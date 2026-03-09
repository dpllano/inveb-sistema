"""
Router de Firebase Cloud Messaging (FCM) - Sprint M
Fuente Laravel: ApiMobileController.php líneas 638-677

Gestiona tokens de notificaciones push para dispositivos móviles.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
import pymysql
import jwt
from datetime import datetime

from app.config import get_settings
from app.database import get_mysql_connection

router = APIRouter(prefix="/fcm", tags=["Firebase Cloud Messaging"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


# =============================================================================
# DEPENDENCY: Obtener usuario actual
# =============================================================================

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extrae el user_id del token JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return int(payload.get("sub"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


# =============================================================================
# SCHEMAS
# =============================================================================

class UpdateTokenRequest(BaseModel):
    """
    Request para actualizar token de notificaciones push.
    Fuente: ApiMobileController.php línea 664
    """
    token_push_mobile: str = Field(
        ...,
        min_length=1,
        description="Token FCM del dispositivo móvil"
    )


class TokenResponse(BaseModel):
    """Respuesta de operaciones de token."""
    code: str
    message: str
    data: Optional[dict] = None


class TokenStatusResponse(BaseModel):
    """Respuesta del estado del token del usuario."""
    user_id: int
    has_token: bool
    token_preview: Optional[str] = None  # Primeros/últimos caracteres


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/token", response_model=TokenResponse)
async def update_token_notification(
    data: UpdateTokenRequest,
    user_id: int = Depends(get_current_user_id)
):
    """
    Actualiza el token de notificaciones push del usuario autenticado.

    Fuente Laravel: ApiMobileController.php líneas 638-677
    Método: updateTokenNotificationSeller()

    Este endpoint es llamado por la app móvil después de obtener
    el token FCM del dispositivo.
    """
    if not data.token_push_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bad Request, datos incompletos. Por favor verificar los datos enviados."
        )

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que el usuario existe
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )

            # Actualizar token
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("""
                UPDATE users
                SET token_push_mobile = %s, updated_at = %s
                WHERE id = %s
            """, (data.token_push_mobile, now, user_id))

            connection.commit()

            return TokenResponse(
                code="200",
                message="Exito, Token de notificacion push ha sido guardado!"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar token: {str(e)}"
        )
    finally:
        connection.close()


@router.delete("/token", response_model=TokenResponse)
async def delete_token_notification(
    user_id: int = Depends(get_current_user_id)
):
    """
    Elimina el token de notificaciones push del usuario autenticado.

    Usado cuando el usuario cierra sesión en la app móvil.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute("""
                UPDATE users
                SET token_push_mobile = NULL, updated_at = %s
                WHERE id = %s
            """, (now, user_id))

            connection.commit()

            return TokenResponse(
                code="200",
                message="Token de notificacion eliminado correctamente"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar token: {str(e)}"
        )
    finally:
        connection.close()


@router.get("/token/status", response_model=TokenStatusResponse)
async def get_token_status(
    user_id: int = Depends(get_current_user_id)
):
    """
    Obtiene el estado del token de notificaciones del usuario.

    Retorna si el usuario tiene token registrado y una vista previa
    parcial del mismo (por seguridad no retorna el token completo).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT token_push_mobile
                FROM users
                WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado"
                )

            token = user.get('token_push_mobile')
            has_token = bool(token)
            token_preview = None

            if token and len(token) > 20:
                # Mostrar solo primeros 10 y últimos 5 caracteres
                token_preview = f"{token[:10]}...{token[-5:]}"
            elif token:
                token_preview = f"{token[:5]}..."

            return TokenStatusResponse(
                user_id=user_id,
                has_token=has_token,
                token_preview=token_preview
            )

    finally:
        connection.close()
