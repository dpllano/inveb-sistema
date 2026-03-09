"""
Router de Autenticación - INVEB Cascade Service
Valida credenciales contra MySQL de Laravel para operación paralela.
Incluye flujo de recuperación de contraseña.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
import jwt

from app.validators import validar_rut_chileno
import bcrypt
import pymysql
import secrets
import hashlib
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Autenticación"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


# Schemas
class LoginRequest(BaseModel):
    """Solicitud de login."""
    rut: str
    password: str

    @field_validator('rut')
    @classmethod
    def validar_rut(cls, v: str) -> str:
        """Valida formato de RUT chileno."""
        if v and not validar_rut_chileno(v):
            raise ValueError('RUT chileno inválido. Verifique el formato y dígito verificador.')
        return v.upper()


class LoginResponse(BaseModel):
    """Respuesta de login exitoso."""
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserInfo(BaseModel):
    """Información del usuario."""
    id: int
    rut: str
    nombre: str
    apellido: str
    email: Optional[EmailStr] = None
    role_id: int
    role_nombre: str
    work_space_id: Optional[int] = None
    sala_corte_id: Optional[int] = None


def get_mysql_connection():
    """Crea conexión a MySQL de Laravel."""
    try:
        connection = pymysql.connect(
            host=settings.LARAVEL_MYSQL_HOST,
            port=settings.LARAVEL_MYSQL_PORT,
            user=settings.LARAVEL_MYSQL_USER,
            password=settings.LARAVEL_MYSQL_PASSWORD,
            database=settings.LARAVEL_MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return connection
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error conectando a base de datos Laravel: {str(e)}"
        )


def create_access_token(data: dict) -> str:
    """Crea un token JWT."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verifica y decodifica un token JWT."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def normalize_rut(rut: str) -> str:
    """Normaliza un RUT removiendo puntos y guiones."""
    return rut.replace(".", "").replace("-", "").upper()


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Autenticación de usuario contra MySQL de Laravel.

    Valida credenciales usando la tabla `users` de Laravel y retorna
    un token JWT para usar en el microservicio.
    """
    rut_normalized = normalize_rut(request.rut)

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Buscar usuario por RUT (con y sin formato)
            sql = """
                SELECT u.id, u.rut, u.nombre, u.apellido, u.email, u.password,
                       u.role_id, u.sala_corte_id, r.nombre as role_nombre, r.work_space_id
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE REPLACE(REPLACE(u.rut, '.', ''), '-', '') = %s
                   OR u.rut = %s
                LIMIT 1
            """
            cursor.execute(sql, (rut_normalized, request.rut))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="RUT o contraseña incorrectos"
                )

            # Verificar contraseña con bcrypt
            # Laravel usa bcrypt con prefijo $2y$, Python bcrypt usa $2b$
            password_bytes = request.password.encode('utf-8')
            hash_str = user['password']
            # Convertir prefijo de Laravel ($2y$) a Python bcrypt ($2b$)
            if hash_str.startswith('$2y$'):
                hash_str = '$2b$' + hash_str[4:]
            hash_bytes = hash_str.encode('utf-8')

            if not bcrypt.checkpw(password_bytes, hash_bytes):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="RUT o contraseña incorrectos"
                )

            # Crear token JWT
            token_data = {
                "sub": str(user['id']),
                "rut": user['rut'],
                "email": user['email'],
                "role_id": user['role_id'],
                "role_nombre": user['role_nombre'] or "Sin rol"
            }
            access_token = create_access_token(token_data)

            return LoginResponse(
                access_token=access_token,
                user={
                    "id": user['id'],
                    "rut": user['rut'],
                    "nombre": user['nombre'],
                    "apellido": user['apellido'],
                    "email": user['email'],
                    "role_id": user['role_id'],
                    "role_nombre": user['role_nombre'] or "Sin rol",
                    "work_space_id": user.get('work_space_id'),
                    "sala_corte_id": user.get('sala_corte_id')
                }
            )
    finally:
        connection.close()


@router.get("/me", response_model=UserInfo)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Retorna información del usuario autenticado.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )

    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

    # Obtener datos actualizados del usuario desde MySQL
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT u.id, u.rut, u.nombre, u.apellido, u.email,
                       u.role_id, u.sala_corte_id, r.nombre as role_nombre, r.work_space_id
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = %s
                LIMIT 1
            """
            cursor.execute(sql, (payload['sub'],))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no encontrado"
                )

            return UserInfo(
                id=user['id'],
                rut=user['rut'],
                nombre=user['nombre'],
                apellido=user['apellido'],
                email=user['email'],
                role_id=user['role_id'],
                role_nombre=user['role_nombre'] or "Sin rol",
                work_space_id=user.get('work_space_id'),
                sala_corte_id=user.get('sala_corte_id')
            )
    finally:
        connection.close()


@router.post("/verify")
async def verify_auth_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifica si un token es válido.
    """
    if not credentials:
        return {"valid": False, "message": "Token no proporcionado"}

    payload = verify_token(credentials.credentials)
    if not payload:
        return {"valid": False, "message": "Token inválido o expirado"}

    return {
        "valid": True,
        "user_id": payload.get('sub'),
        "rut": payload.get('rut'),
        "role_id": payload.get('role_id')
    }


@router.get("/roles")
async def list_roles():
    """
    Lista todos los roles disponibles en el sistema.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT id, nombre, work_space_id FROM roles ORDER BY id"
            cursor.execute(sql)
            roles = cursor.fetchall()
            return {"roles": roles}
    finally:
        connection.close()


class ChangePasswordRequest(BaseModel):
    """Solicitud de cambio de contraseña."""
    current_password: str
    new_password: str


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Cambia la contraseña del usuario autenticado.
    Valida la contraseña actual antes de actualizar.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )

    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

    user_id = payload.get('sub')

    # Validar longitud minima de la nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Obtener contraseña actual del usuario
            sql = "SELECT id, password FROM users WHERE id = %s LIMIT 1"
            cursor.execute(sql, (user_id,))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )

            # Verificar contraseña actual
            password_bytes = request.current_password.encode('utf-8')
            hash_str = user['password']
            # Convertir prefijo de Laravel ($2y$) a Python bcrypt ($2b$)
            if hash_str.startswith('$2y$'):
                hash_str = '$2b$' + hash_str[4:]
            hash_bytes = hash_str.encode('utf-8')

            if not bcrypt.checkpw(password_bytes, hash_bytes):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña actual es incorrecta"
                )

            # Generar nueva hash con bcrypt
            new_password_bytes = request.new_password.encode('utf-8')
            new_hash = bcrypt.hashpw(new_password_bytes, bcrypt.gensalt())
            # Convertir a formato Laravel ($2y$)
            new_hash_str = new_hash.decode('utf-8').replace('$2b$', '$2y$')

            # Actualizar contraseña en la base de datos
            update_sql = "UPDATE users SET password = %s, updated_at = %s WHERE id = %s"
            cursor.execute(update_sql, (new_hash_str, datetime.now(), user_id))
            connection.commit()

            return {"message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cambiar la contraseña: {str(e)}"
        )
    finally:
        connection.close()


# =============================================
# RECUPERACIÓN DE CONTRASEÑA
# =============================================

class ForgotPasswordRequest(BaseModel):
    """Solicitud de recuperación de contraseña."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Solicitud de reset de contraseña."""
    token: str
    email: EmailStr
    new_password: str


class ValidateTokenRequest(BaseModel):
    """Solicitud de validación de token."""
    token: str
    email: EmailStr


def generate_reset_token() -> str:
    """Genera un token seguro para reset de contraseña."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hashea el token para almacenamiento seguro (compatible con Laravel)."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Inicia el proceso de recuperación de contraseña.
    Genera un token y lo almacena en password_resets (tabla de Laravel).

    Nota: En producción, aquí se enviaría un email con el link de reset.
    Por ahora, retornamos el token para pruebas en desarrollo.
    """
    email = request.email.lower().strip()

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que el email existe
            sql = "SELECT id, email, nombre FROM users WHERE LOWER(email) = %s LIMIT 1"
            cursor.execute(sql, (email,))
            user = cursor.fetchone()

            if not user:
                # Por seguridad, no revelamos si el email existe o no
                logger.info(f"Intento de recuperación para email no registrado: {email}")
                return {
                    "message": "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.",
                    "success": True
                }

            # Generar token
            raw_token = generate_reset_token()
            hashed_token = hash_token(raw_token)

            # Eliminar tokens anteriores para este email
            cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))

            # Insertar nuevo token (expira en 1 hora)
            cursor.execute("""
                INSERT INTO password_resets (email, token, created_at)
                VALUES (%s, %s, %s)
            """, (email, hashed_token, datetime.now()))

            connection.commit()

            # En producción, aquí se enviaría el email
            # Por ahora, logueamos y retornamos info para desarrollo
            logger.info(f"Token de recuperación generado para: {email}")

            # URL de reset (para frontend)
            reset_url = f"/reset-password?token={raw_token}&email={email}"

            return {
                "message": "Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.",
                "success": True,
                # Solo en desarrollo - quitar en producción
                "_dev_token": raw_token,
                "_dev_reset_url": reset_url,
                "_dev_expires_in": "1 hora"
            }

    except Exception as e:
        logger.error(f"Error en forgot-password: {str(e)}")
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la solicitud"
        )
    finally:
        connection.close()


@router.post("/validate-reset-token")
async def validate_reset_token(request: ValidateTokenRequest):
    """
    Valida si un token de reset es válido y no ha expirado.
    """
    email = request.email.lower().strip()
    hashed_token = hash_token(request.token)

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Buscar token válido (menos de 1 hora de antigüedad)
            sql = """
                SELECT email, created_at
                FROM password_resets
                WHERE email = %s AND token = %s
                LIMIT 1
            """
            cursor.execute(sql, (email, hashed_token))
            reset_record = cursor.fetchone()

            if not reset_record:
                return {"valid": False, "message": "Token inválido o expirado"}

            # Verificar expiración (1 hora)
            created_at = reset_record['created_at']
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)

            expiration_time = created_at + timedelta(hours=1)

            if datetime.now() > expiration_time:
                # Token expirado, eliminarlo
                cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
                connection.commit()
                return {"valid": False, "message": "El enlace ha expirado. Solicita uno nuevo."}

            return {
                "valid": True,
                "message": "Token válido",
                "email": email
            }

    except Exception as e:
        logger.error(f"Error validando token: {str(e)}")
        return {"valid": False, "message": "Error al validar token"}
    finally:
        connection.close()


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Restablece la contraseña usando el token de recuperación.
    """
    email = request.email.lower().strip()
    hashed_token = hash_token(request.token)

    # Validar nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Buscar token válido
            sql = """
                SELECT email, created_at
                FROM password_resets
                WHERE email = %s AND token = %s
                LIMIT 1
            """
            cursor.execute(sql, (email, hashed_token))
            reset_record = cursor.fetchone()

            if not reset_record:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token inválido o expirado"
                )

            # Verificar expiración (1 hora)
            created_at = reset_record['created_at']
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)

            expiration_time = created_at + timedelta(hours=1)

            if datetime.now() > expiration_time:
                cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))
                connection.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El enlace ha expirado. Solicita uno nuevo."
                )

            # Buscar usuario
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", (email,))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )

            # Generar nueva hash con bcrypt (formato Laravel)
            new_password_bytes = request.new_password.encode('utf-8')
            new_hash = bcrypt.hashpw(new_password_bytes, bcrypt.gensalt())
            new_hash_str = new_hash.decode('utf-8').replace('$2b$', '$2y$')

            # Actualizar contraseña
            cursor.execute("""
                UPDATE users
                SET password = %s, updated_at = %s
                WHERE id = %s
            """, (new_hash_str, datetime.now(), user['id']))

            # Eliminar token usado
            cursor.execute("DELETE FROM password_resets WHERE email = %s", (email,))

            connection.commit()

            logger.info(f"Contraseña restablecida para: {email}")

            return {
                "message": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión.",
                "success": True
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en reset-password: {str(e)}")
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer la contraseña"
        )
    finally:
        connection.close()
