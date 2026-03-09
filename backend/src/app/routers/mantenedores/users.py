"""
Router de Mantenedor de Usuarios
CRUD para la tabla users de Laravel
"""

import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field, EmailStr, field_validator
import hashlib

from ...validators import validar_rut_chileno, validar_telefono_chileno

from ...database import get_db_connection
from ...dependencies import get_current_user

router = APIRouter(
    prefix="/mantenedores/users",
    tags=["Mantenedores - Usuarios"],
)


# ============================================
# Pydantic Schemas
# ============================================

class UserListItem(BaseModel):
    """Usuario en listado"""
    id: int
    rut: str
    nombre: str
    apellido: str
    email: Optional[EmailStr] = None
    role_nombre: Optional[str] = None
    active: bool


class UserListResponse(BaseModel):
    """Respuesta paginada de usuarios"""
    items: list[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserDetail(BaseModel):
    """Detalle completo de usuario"""
    id: int
    rut: str
    nombre: str
    apellido: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    role_id: Optional[int] = None
    role_nombre: Optional[str] = None
    active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserCreate(BaseModel):
    """Datos para crear usuario"""
    rut: str = Field(..., min_length=8, max_length=12)
    nombre: str = Field(..., min_length=2, max_length=100)
    apellido: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=6)
    role_id: Optional[int] = None

    @field_validator('rut')
    @classmethod
    def validar_rut(cls, v: str) -> str:
        """Valida formato y dígito verificador de RUT chileno."""
        if v and not validar_rut_chileno(v):
            raise ValueError('RUT chileno inválido. Verifique el formato y dígito verificador.')
        return v.upper()

    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato de teléfono chileno."""
        if v and not validar_telefono_chileno(v):
            raise ValueError('Teléfono chileno inválido. Formato esperado: +56 9 XXXX XXXX')
        return v


class UserUpdate(BaseModel):
    """Datos para actualizar usuario"""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellido: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=6)
    role_id: Optional[int] = None

    @field_validator('telefono')
    @classmethod
    def validar_telefono(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato de teléfono chileno."""
        if v and not validar_telefono_chileno(v):
            raise ValueError('Teléfono chileno inválido. Formato esperado: +56 9 XXXX XXXX')
        return v


class UserResponse(BaseModel):
    """Respuesta de operacion"""
    id: int
    message: str


class RoleOption(BaseModel):
    """Opcion de rol"""
    id: int
    nombre: str


class WorkspaceOption(BaseModel):
    """Opcion de workspace"""
    id: int
    nombre: str


# ============================================
# Helper functions
# ============================================

def validate_rut(rut: str) -> bool:
    """Valida RUT chileno"""
    if not rut:
        return False

    clean_rut = re.sub(r'[.-]', '', rut.upper())
    if len(clean_rut) < 2:
        return False

    dv = clean_rut[-1]
    numbers = clean_rut[:-1]

    if not numbers.isdigit():
        return False

    total = 0
    mul = 2
    for c in reversed(numbers):
        total += int(c) * mul
        mul = mul + 1 if mul < 7 else 2

    expected = 11 - (total % 11)
    if expected == 11:
        expected_dv = '0'
    elif expected == 10:
        expected_dv = 'K'
    else:
        expected_dv = str(expected)

    return dv == expected_dv


def format_rut(rut: str) -> str:
    """Formatea RUT a formato de base de datos (sin puntos, solo con guion)"""
    clean_rut = re.sub(r'[.-]', '', rut.upper())
    if len(clean_rut) < 2:
        return clean_rut

    dv = clean_rut[-1]
    numbers = clean_rut[:-1]

    # Formato: 12345678-9 (sin puntos, solo guion)
    return f"{numbers}-{dv}"


def clean_telefono(telefono: str) -> str:
    """Limpia y normaliza el telefono (max 10 chars para la BD)"""
    if not telefono:
        return ""
    # Remover caracteres no numericos excepto +
    cleaned = re.sub(r'[^\d]', '', telefono)
    # Si es muy largo (tiene codigo de pais), tomar los ultimos 9 digitos
    if len(cleaned) > 10:
        cleaned = cleaned[-9:]
    return cleaned


def hash_password(password: str) -> str:
    """Hash password compatible con Laravel bcrypt"""
    # Laravel usa bcrypt, pero para simplificar usamos SHA256
    # En produccion se debe usar bcrypt
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# ============================================
# Endpoints
# ============================================

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role_id: Optional[int] = None,
    active: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
):
    """Lista usuarios con filtros y paginacion"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Base query
        base_query = """
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE 1=1
        """
        params = []

        # Filters
        if search:
            base_query += " AND (u.rut LIKE %s OR u.nombre LIKE %s OR u.apellido LIKE %s OR u.email LIKE %s)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

        if role_id:
            base_query += " AND u.role_id = %s"
            params.append(role_id)

        if active is not None:
            base_query += " AND u.active = %s"
            params.append(1 if active else 0)

        # Count total
        count_query = f"SELECT COUNT(*) as total {base_query}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']

        # Get paginated results
        offset = (page - 1) * page_size
        select_query = f"""
            SELECT
                u.id,
                u.rut,
                u.nombre,
                u.apellido,
                u.email,
                r.nombre as role_nombre,
                u.active
            {base_query}
            ORDER BY u.nombre ASC
            LIMIT %s OFFSET %s
        """
        params.extend([page_size, offset])
        cursor.execute(select_query, params)
        rows = cursor.fetchall()

        # Format results
        items = []
        for row in rows:
            items.append(UserListItem(
                id=row['id'],
                rut=row['rut'] or '',
                nombre=row['nombre'] or '',
                apellido=row['apellido'] or '',
                email=row['email'],
                role_nombre=row['role_nombre'],
                active=bool(row['active']),
            ))

        total_pages = (total + page_size - 1) // page_size

        return UserListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    finally:
        cursor.close()
        conn.close()


@router.get("/roles", response_model=list[RoleOption])
async def get_roles(
    current_user: dict = Depends(get_current_user),
):
    """Obtiene lista de roles disponibles"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, nombre FROM roles ORDER BY nombre")
        rows = cursor.fetchall()
        return [RoleOption(id=r['id'], nombre=r['nombre']) for r in rows]

    finally:
        cursor.close()
        conn.close()


@router.get("/workspaces", response_model=list[WorkspaceOption])
async def get_workspaces(
    current_user: dict = Depends(get_current_user),
):
    """Obtiene lista de workspaces (areas de trabajo) disponibles"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, nombre FROM work_spaces WHERE status = 'active' ORDER BY id")
        rows = cursor.fetchall()
        return [WorkspaceOption(id=r['id'], nombre=r['nombre']) for r in rows]

    finally:
        cursor.close()
        conn.close()


@router.get("/{user_id}", response_model=UserDetail)
async def get_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Obtiene detalle de un usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                u.id,
                u.rut,
                u.nombre,
                u.apellido,
                u.email,
                u.telefono,
                u.role_id,
                r.nombre as role_nombre,
                u.active,
                u.created_at,
                u.updated_at
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
        """, (user_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        return UserDetail(
            id=row['id'],
            rut=row['rut'] or '',
            nombre=row['nombre'] or '',
            apellido=row['apellido'] or '',
            email=row['email'],
            telefono=row['telefono'],
            role_id=row['role_id'],
            role_nombre=row['role_nombre'],
            active=bool(row['active']),
            created_at=str(row['created_at']) if row['created_at'] else None,
            updated_at=str(row['updated_at']) if row['updated_at'] else None,
        )

    finally:
        cursor.close()
        conn.close()


@router.post("/", response_model=UserResponse)
async def create_user(
    data: UserCreate,
    current_user: dict = Depends(get_current_user),
):
    """Crea un nuevo usuario"""
    # Validate RUT
    if not validate_rut(data.rut):
        raise HTTPException(status_code=400, detail="RUT invalido")

    formatted_rut = format_rut(data.rut)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if RUT already exists
        cursor.execute("SELECT id FROM users WHERE rut = %s", (formatted_rut,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un usuario con este RUT")

        # Check if email already exists
        if data.email:
            cursor.execute("SELECT id FROM users WHERE email = %s", (data.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe un usuario con este email")

        # Hash password
        hashed_password = hash_password(data.password)

        # Insert user
        cleaned_telefono = clean_telefono(data.telefono) if data.telefono else ""
        cursor.execute("""
            INSERT INTO users (rut, nombre, apellido, email, telefono, password, role_id, active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, NOW(), NOW())
        """, (
            formatted_rut,
            data.nombre,
            data.apellido,
            data.email,
            cleaned_telefono,
            hashed_password,
            data.role_id,
        ))

        conn.commit()
        user_id = cursor.lastrowid

        return UserResponse(id=user_id, message="Usuario creado exitosamente")

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {str(e)}")

    finally:
        cursor.close()
        conn.close()


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Actualiza un usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Check if email already exists (for another user)
        if data.email:
            cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (data.email, user_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe otro usuario con este email")

        # Build update query
        updates = []
        params = []

        if data.nombre is not None:
            updates.append("nombre = %s")
            params.append(data.nombre)

        if data.apellido is not None:
            updates.append("apellido = %s")
            params.append(data.apellido)

        if data.email is not None:
            updates.append("email = %s")
            params.append(data.email)

        if data.telefono is not None:
            updates.append("telefono = %s")
            params.append(data.telefono)

        if data.password is not None:
            updates.append("password = %s")
            params.append(hash_password(data.password))

        if data.role_id is not None:
            updates.append("role_id = %s")
            params.append(data.role_id)

        if not updates:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")

        updates.append("updated_at = NOW()")
        params.append(user_id)

        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        conn.commit()

        return UserResponse(id=user_id, message="Usuario actualizado exitosamente")

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar usuario: {str(e)}")

    finally:
        cursor.close()
        conn.close()


@router.put("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Activa un usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        cursor.execute("UPDATE users SET active = 1, updated_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()

        return UserResponse(id=user_id, message="Usuario activado exitosamente")

    finally:
        cursor.close()
        conn.close()


@router.put("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Desactiva un usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Cannot deactivate yourself
        if user_id == current_user['id']:
            raise HTTPException(status_code=400, detail="No puede desactivarse a si mismo")

        cursor.execute("UPDATE users SET active = 0, updated_at = NOW() WHERE id = %s", (user_id,))
        conn.commit()

        return UserResponse(id=user_id, message="Usuario desactivado exitosamente")

    except HTTPException:
        raise

    finally:
        cursor.close()
        conn.close()
