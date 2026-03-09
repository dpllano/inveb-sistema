"""
Router de Mantenedor de Clientes - INVEB Cascade Service
CRUD completo para la tabla clients de MySQL Laravel.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr, field_validator
import pymysql
import jwt
import re

from app.config import get_settings
from app.validators import validar_rut_chileno, validar_telefono_chileno

router = APIRouter(prefix="/mantenedores/clients", tags=["Mantenedor - Clientes"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


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


def get_mysql_connection():
    """Obtiene conexion a MySQL de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


def validate_rut(rut: str) -> bool:
    """Valida formato de RUT chileno."""
    if not rut:
        return False
    # Limpiar RUT
    clean_rut = re.sub(r'[.-]', '', rut.upper())
    if len(clean_rut) < 2:
        return False

    dv = clean_rut[-1]
    numbers = clean_rut[:-1]

    if not numbers.isdigit():
        return False

    # Algoritmo modulo 11
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
    """Formatea RUT a formato estandar XX.XXX.XXX-X."""
    if not rut:
        return rut
    clean = re.sub(r'[.-]', '', rut.upper())
    if len(clean) < 2:
        return rut
    dv = clean[-1]
    numbers = clean[:-1]
    # Agregar puntos cada 3 digitos desde la derecha
    formatted = ''
    for i, c in enumerate(reversed(numbers)):
        if i > 0 and i % 3 == 0:
            formatted = '.' + formatted
        formatted = c + formatted
    return f"{formatted}-{dv}"


# Schemas
class ClientListItem(BaseModel):
    """Item de la lista de clientes."""
    id: int
    rut: str
    nombre_sap: str
    codigo: Optional[str]
    email_contacto_1: Optional[str]
    phone_contacto_1: Optional[str]
    clasificacion_nombre: Optional[str]
    active: int
    created_at: Optional[str]


class ClientListResponse(BaseModel):
    """Respuesta paginada de clientes."""
    items: List[ClientListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ClientDetail(BaseModel):
    """Detalle completo de un cliente. Issue 3: Incluir TODOS los campos de contacto."""
    id: int
    rut: str
    nombre_sap: str
    codigo: Optional[str]
    # Contacto 1 (campos extraidos de Laravel ClientController lineas 122-128)
    nombre_contacto_1: Optional[str]
    cargo_contacto_1: Optional[str]
    email_contacto_1: Optional[str]
    phone_contacto_1: Optional[str]
    comuna_contacto_1: Optional[int]
    direccion_contacto_1: Optional[str]
    active_contacto_1: Optional[str]
    # Contacto 2
    nombre_contacto_2: Optional[str]
    cargo_contacto_2: Optional[str]
    email_contacto_2: Optional[str]
    phone_contacto_2: Optional[str]
    comuna_contacto_2: Optional[int]
    direccion_contacto_2: Optional[str]
    active_contacto_2: Optional[str]
    # Contacto 3
    nombre_contacto_3: Optional[str]
    cargo_contacto_3: Optional[str]
    email_contacto_3: Optional[str]
    phone_contacto_3: Optional[str]
    comuna_contacto_3: Optional[int]
    direccion_contacto_3: Optional[str]
    active_contacto_3: Optional[str]
    # Contacto 4
    nombre_contacto_4: Optional[str]
    cargo_contacto_4: Optional[str]
    email_contacto_4: Optional[str]
    phone_contacto_4: Optional[str]
    comuna_contacto_4: Optional[int]
    direccion_contacto_4: Optional[str]
    active_contacto_4: Optional[str]
    # Contacto 5
    nombre_contacto_5: Optional[str]
    cargo_contacto_5: Optional[str]
    email_contacto_5: Optional[str]
    phone_contacto_5: Optional[str]
    comuna_contacto_5: Optional[int]
    direccion_contacto_5: Optional[str]
    active_contacto_5: Optional[str]
    # Clasificacion y estado
    clasificacion_id: Optional[int]
    clasificacion_nombre: Optional[str]
    active: int
    created_at: Optional[str]
    updated_at: Optional[str]


class ClientCreate(BaseModel):
    """Schema para crear cliente. Issue 3: Incluir todos los campos de contacto."""
    rut: str = Field(..., min_length=8, max_length=12, description="RUT chileno")
    nombre_sap: str = Field(..., min_length=1, max_length=255, description="Nombre SAP")
    codigo: Optional[str] = Field(None, max_length=50, description="Codigo interno")
    # Contacto 1
    nombre_contacto_1: Optional[str] = Field(None, max_length=255)
    cargo_contacto_1: Optional[str] = Field(None, max_length=255)
    email_contacto_1: Optional[EmailStr] = None
    phone_contacto_1: Optional[str] = Field(None, max_length=20)
    comuna_contacto_1: Optional[int] = None
    direccion_contacto_1: Optional[str] = Field(None, max_length=255)
    active_contacto_1: Optional[str] = Field(None, max_length=20)
    # Contacto 2
    nombre_contacto_2: Optional[str] = Field(None, max_length=255)
    cargo_contacto_2: Optional[str] = Field(None, max_length=255)
    email_contacto_2: Optional[EmailStr] = None
    phone_contacto_2: Optional[str] = Field(None, max_length=20)
    comuna_contacto_2: Optional[int] = None
    direccion_contacto_2: Optional[str] = Field(None, max_length=255)
    active_contacto_2: Optional[str] = Field(None, max_length=20)
    # Contacto 3
    nombre_contacto_3: Optional[str] = Field(None, max_length=255)
    cargo_contacto_3: Optional[str] = Field(None, max_length=255)
    email_contacto_3: Optional[EmailStr] = None
    phone_contacto_3: Optional[str] = Field(None, max_length=20)
    comuna_contacto_3: Optional[int] = None
    direccion_contacto_3: Optional[str] = Field(None, max_length=255)
    active_contacto_3: Optional[str] = Field(None, max_length=20)
    # Contacto 4
    nombre_contacto_4: Optional[str] = Field(None, max_length=255)
    cargo_contacto_4: Optional[str] = Field(None, max_length=255)
    email_contacto_4: Optional[EmailStr] = None
    phone_contacto_4: Optional[str] = Field(None, max_length=20)
    comuna_contacto_4: Optional[int] = None
    direccion_contacto_4: Optional[str] = Field(None, max_length=255)
    active_contacto_4: Optional[str] = Field(None, max_length=20)
    # Contacto 5
    nombre_contacto_5: Optional[str] = Field(None, max_length=255)
    cargo_contacto_5: Optional[str] = Field(None, max_length=255)
    email_contacto_5: Optional[EmailStr] = None
    phone_contacto_5: Optional[str] = Field(None, max_length=20)
    comuna_contacto_5: Optional[int] = None
    direccion_contacto_5: Optional[str] = Field(None, max_length=255)
    active_contacto_5: Optional[str] = Field(None, max_length=20)
    # Clasificacion
    clasificacion_id: Optional[int] = None

    @field_validator('rut')
    @classmethod
    def validar_rut(cls, v: str) -> str:
        """Valida formato y dígito verificador de RUT chileno."""
        if v and not validar_rut_chileno(v):
            raise ValueError('RUT chileno inválido. Verifique el formato y dígito verificador.')
        return v.upper()

    @field_validator('phone_contacto_1', 'phone_contacto_2', 'phone_contacto_3', 'phone_contacto_4', 'phone_contacto_5')
    @classmethod
    def validar_telefono(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato de teléfono chileno."""
        if v and not validar_telefono_chileno(v):
            raise ValueError('Teléfono chileno inválido. Formato esperado: +56 9 XXXX XXXX')
        return v


class ClientUpdate(BaseModel):
    """Schema para actualizar cliente. Issue 3: Incluir todos los campos de contacto."""
    rut: Optional[str] = Field(None, min_length=8, max_length=12)
    nombre_sap: Optional[str] = Field(None, min_length=1, max_length=255)
    codigo: Optional[str] = Field(None, max_length=50)
    # Contacto 1
    nombre_contacto_1: Optional[str] = Field(None, max_length=255)
    cargo_contacto_1: Optional[str] = Field(None, max_length=255)
    email_contacto_1: Optional[EmailStr] = None
    phone_contacto_1: Optional[str] = Field(None, max_length=20)
    comuna_contacto_1: Optional[int] = None
    direccion_contacto_1: Optional[str] = Field(None, max_length=255)
    active_contacto_1: Optional[str] = Field(None, max_length=20)
    # Contacto 2
    nombre_contacto_2: Optional[str] = Field(None, max_length=255)
    cargo_contacto_2: Optional[str] = Field(None, max_length=255)
    email_contacto_2: Optional[EmailStr] = None
    phone_contacto_2: Optional[str] = Field(None, max_length=20)
    comuna_contacto_2: Optional[int] = None
    direccion_contacto_2: Optional[str] = Field(None, max_length=255)
    active_contacto_2: Optional[str] = Field(None, max_length=20)
    # Contacto 3
    nombre_contacto_3: Optional[str] = Field(None, max_length=255)
    cargo_contacto_3: Optional[str] = Field(None, max_length=255)
    email_contacto_3: Optional[EmailStr] = None
    phone_contacto_3: Optional[str] = Field(None, max_length=20)
    comuna_contacto_3: Optional[int] = None
    direccion_contacto_3: Optional[str] = Field(None, max_length=255)
    active_contacto_3: Optional[str] = Field(None, max_length=20)
    # Contacto 4
    nombre_contacto_4: Optional[str] = Field(None, max_length=255)
    cargo_contacto_4: Optional[str] = Field(None, max_length=255)
    email_contacto_4: Optional[EmailStr] = None
    phone_contacto_4: Optional[str] = Field(None, max_length=20)
    comuna_contacto_4: Optional[int] = None
    direccion_contacto_4: Optional[str] = Field(None, max_length=255)
    active_contacto_4: Optional[str] = Field(None, max_length=20)
    # Contacto 5
    nombre_contacto_5: Optional[str] = Field(None, max_length=255)
    cargo_contacto_5: Optional[str] = Field(None, max_length=255)
    email_contacto_5: Optional[EmailStr] = None
    phone_contacto_5: Optional[str] = Field(None, max_length=20)
    comuna_contacto_5: Optional[int] = None
    direccion_contacto_5: Optional[str] = Field(None, max_length=255)
    active_contacto_5: Optional[str] = Field(None, max_length=20)
    # Clasificacion
    clasificacion_id: Optional[int] = None

    @field_validator('rut')
    @classmethod
    def validar_rut(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato y dígito verificador de RUT chileno."""
        if v and not validar_rut_chileno(v):
            raise ValueError('RUT chileno inválido. Verifique el formato y dígito verificador.')
        return v.upper() if v else v

    @field_validator('phone_contacto_1', 'phone_contacto_2', 'phone_contacto_3', 'phone_contacto_4', 'phone_contacto_5')
    @classmethod
    def validar_telefono(cls, v: Optional[str]) -> Optional[str]:
        """Valida formato de teléfono chileno."""
        if v and not validar_telefono_chileno(v):
            raise ValueError('Teléfono chileno inválido. Formato esperado: +56 9 XXXX XXXX')
        return v


class ClientResponse(BaseModel):
    """Respuesta de operacion de cliente."""
    id: int
    message: str


class ClasificacionOption(BaseModel):
    """Opcion de clasificacion para select."""
    id: int
    descripcion: str


# Endpoints

@router.get("/", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=2000),
    rut: Optional[str] = Query(None, description="Filtrar por RUT"),
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    search: Optional[str] = Query(None, description="Busqueda general en RUT, nombre y codigo"),
    active: Optional[int] = Query(None, description="Filtrar por estado (1=activo, 0=inactivo)"),
    activo: Optional[str] = Query(None, description="Alias de active para compatibilidad (true/false)"),
    clasificacion_id: Optional[int] = Query(None, description="Filtrar por clasificacion"),
    order_by: str = Query("nombre", description="Campo para ordenar"),
    order_dir: str = Query("asc", description="Direccion de ordenamiento"),
    user_id: int = Depends(get_current_user_id)
):
    """Lista clientes con filtros y paginacion."""
    # Procesar parametro activo como alias de active
    if activo is not None and active is None:
        if activo.lower() == 'true':
            active = 1
        elif activo.lower() == 'false':
            active = 0

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query base
            query = """
                SELECT
                    c.id,
                    c.rut,
                    c.nombre as nombre_sap,
                    c.codigo,
                    c.email_contacto as email_contacto_1,
                    c.phone_contacto as phone_contacto_1,
                    cc.name as clasificacion_nombre,
                    c.active,
                    DATE_FORMAT(c.created_at, '%%Y-%%m-%%d %%H:%%i') as created_at
                FROM clients c
                LEFT JOIN clasificacion_clientes cc ON c.clasificacion = cc.id
                WHERE 1=1
            """
            params = []

            # Issue 1: Filtro de busqueda general
            if search:
                query += " AND (c.rut LIKE %s OR c.nombre LIKE %s OR c.codigo LIKE %s OR c.email_contacto LIKE %s)"
                search_term = f"%{search}%"
                params.extend([search_term, search_term, search_term, search_term])
            # Filtros especificos
            if rut:
                query += " AND c.rut LIKE %s"
                params.append(f"%{rut}%")
            if nombre:
                query += " AND c.nombre LIKE %s"
                params.append(f"%{nombre}%")
            if active is not None:
                query += " AND c.active = %s"
                params.append(active)
            if clasificacion_id:
                query += " AND c.clasificacion = %s"
                params.append(clasificacion_id)

            # Count total
            count_query = f"SELECT COUNT(*) as total FROM ({query}) as subq"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']

            # Ordenamiento y paginacion
            allowed_columns = ['id', 'rut', 'nombre', 'codigo', 'active', 'created_at']
            if order_by not in allowed_columns:
                order_by = 'nombre'
            order_dir = 'DESC' if order_dir.lower() == 'desc' else 'ASC'

            query += f" ORDER BY c.{order_by} {order_dir}"
            query += " LIMIT %s OFFSET %s"
            params.extend([page_size, (page - 1) * page_size])

            cursor.execute(query, params)
            items = cursor.fetchall()

            total_pages = (total + page_size - 1) // page_size

            return ClientListResponse(
                items=[ClientListItem(**item) for item in items],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
    finally:
        connection.close()


@router.get("/clasificaciones", response_model=List[ClasificacionOption])
async def get_clasificaciones(user_id: int = Depends(get_current_user_id)):
    """Obtiene lista de clasificaciones para select."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, name as descripcion
                FROM clasificacion_clientes
                WHERE active = 1
                ORDER BY name
            """)
            return [ClasificacionOption(**row) for row in cursor.fetchall()]
    finally:
        connection.close()


@router.get("/{client_id}", response_model=ClientDetail)
async def get_client(
    client_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Obtiene detalle de un cliente. Issue 3: Incluir TODOS los campos de contacto."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query con todos los campos de contacto (extraidos de Laravel ClientController lineas 122-160)
            cursor.execute("""
                SELECT
                    c.id,
                    c.rut,
                    c.nombre as nombre_sap,
                    c.codigo,
                    -- Contacto 1
                    c.nombre_contacto as nombre_contacto_1,
                    c.cargo_contacto as cargo_contacto_1,
                    c.email_contacto as email_contacto_1,
                    c.phone_contacto as phone_contacto_1,
                    c.comuna_contacto as comuna_contacto_1,
                    c.direccion_contacto as direccion_contacto_1,
                    c.active_contacto as active_contacto_1,
                    -- Contacto 2
                    c.nombre_contacto_2,
                    c.cargo_contacto_2,
                    c.email_contacto_2,
                    c.phone_contacto_2,
                    c.comuna_contacto_2,
                    c.direccion_contacto_2,
                    c.active_contacto_2,
                    -- Contacto 3
                    c.nombre_contacto_3,
                    c.cargo_contacto_3,
                    c.email_contacto_3,
                    c.phone_contacto_3,
                    c.comuna_contacto_3,
                    c.direccion_contacto_3,
                    c.active_contacto_3,
                    -- Contacto 4
                    c.nombre_contacto_4,
                    c.cargo_contacto_4,
                    c.email_contacto_4,
                    c.phone_contacto_4,
                    c.comuna_contacto_4,
                    c.direccion_contacto_4,
                    c.active_contacto_4,
                    -- Contacto 5
                    c.nombre_contacto_5,
                    c.cargo_contacto_5,
                    c.email_contacto_5,
                    c.phone_contacto_5,
                    c.comuna_contacto_5,
                    c.direccion_contacto_5,
                    c.active_contacto_5,
                    -- Clasificacion y estado
                    c.clasificacion as clasificacion_id,
                    cc.name as clasificacion_nombre,
                    c.active,
                    DATE_FORMAT(c.created_at, '%%Y-%%m-%%d %%H:%%i') as created_at,
                    DATE_FORMAT(c.updated_at, '%%Y-%%m-%%d %%H:%%i') as updated_at
                FROM clients c
                LEFT JOIN clasificacion_clientes cc ON c.clasificacion = cc.id
                WHERE c.id = %s
            """, (client_id,))

            client = cursor.fetchone()
            if not client:
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            return ClientDetail(**client)
    finally:
        connection.close()


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    user_id: int = Depends(get_current_user_id)
):
    """Crea un nuevo cliente."""
    # Validar RUT
    if not validate_rut(data.rut):
        raise HTTPException(status_code=400, detail="RUT invalido")

    formatted_rut = format_rut(data.rut)

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar RUT unico
            cursor.execute("SELECT id FROM clients WHERE rut = %s", (formatted_rut,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe un cliente con ese RUT")

            # Insertar cliente con todos los campos de contacto (Issue 3)
            cursor.execute("""
                INSERT INTO clients (
                    rut, nombre, codigo,
                    nombre_contacto, cargo_contacto, email_contacto, phone_contacto,
                    comuna_contacto, direccion_contacto, active_contacto,
                    nombre_contacto_2, cargo_contacto_2, email_contacto_2, phone_contacto_2,
                    comuna_contacto_2, direccion_contacto_2, active_contacto_2,
                    nombre_contacto_3, cargo_contacto_3, email_contacto_3, phone_contacto_3,
                    comuna_contacto_3, direccion_contacto_3, active_contacto_3,
                    nombre_contacto_4, cargo_contacto_4, email_contacto_4, phone_contacto_4,
                    comuna_contacto_4, direccion_contacto_4, active_contacto_4,
                    nombre_contacto_5, cargo_contacto_5, email_contacto_5, phone_contacto_5,
                    comuna_contacto_5, direccion_contacto_5, active_contacto_5,
                    clasificacion, active,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, 1,
                    NOW(), NOW()
                )
            """, (
                formatted_rut, data.nombre_sap, data.codigo,
                data.nombre_contacto_1, data.cargo_contacto_1, data.email_contacto_1, data.phone_contacto_1,
                data.comuna_contacto_1, data.direccion_contacto_1, data.active_contacto_1,
                data.nombre_contacto_2, data.cargo_contacto_2, data.email_contacto_2, data.phone_contacto_2,
                data.comuna_contacto_2, data.direccion_contacto_2, data.active_contacto_2,
                data.nombre_contacto_3, data.cargo_contacto_3, data.email_contacto_3, data.phone_contacto_3,
                data.comuna_contacto_3, data.direccion_contacto_3, data.active_contacto_3,
                data.nombre_contacto_4, data.cargo_contacto_4, data.email_contacto_4, data.phone_contacto_4,
                data.comuna_contacto_4, data.direccion_contacto_4, data.active_contacto_4,
                data.nombre_contacto_5, data.cargo_contacto_5, data.email_contacto_5, data.phone_contacto_5,
                data.comuna_contacto_5, data.direccion_contacto_5, data.active_contacto_5,
                data.clasificacion_id
            ))

            connection.commit()
            client_id = cursor.lastrowid

            return ClientResponse(
                id=client_id,
                message="Cliente creado exitosamente"
            )
    finally:
        connection.close()


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    data: ClientUpdate,
    user_id: int = Depends(get_current_user_id)
):
    """Actualiza un cliente existente."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que existe
            cursor.execute("SELECT id, rut FROM clients WHERE id = %s", (client_id,))
            existing = cursor.fetchone()
            if not existing:
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            # Si se cambia el RUT, validar
            if data.rut:
                if not validate_rut(data.rut):
                    raise HTTPException(status_code=400, detail="RUT invalido")
                formatted_rut = format_rut(data.rut)
                # Verificar unicidad
                cursor.execute(
                    "SELECT id FROM clients WHERE rut = %s AND id != %s",
                    (formatted_rut, client_id)
                )
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Ya existe otro cliente con ese RUT")

            # Construir UPDATE dinamico con todos los campos de contacto (Issue 3)
            updates = []
            params = []

            if data.rut:
                updates.append("rut = %s")
                params.append(format_rut(data.rut))
            if data.nombre_sap:
                updates.append("nombre = %s")
                params.append(data.nombre_sap)
            if data.codigo is not None:
                updates.append("codigo = %s")
                params.append(data.codigo)
            # Contacto 1
            if data.nombre_contacto_1 is not None:
                updates.append("nombre_contacto = %s")
                params.append(data.nombre_contacto_1)
            if data.cargo_contacto_1 is not None:
                updates.append("cargo_contacto = %s")
                params.append(data.cargo_contacto_1)
            if data.email_contacto_1 is not None:
                updates.append("email_contacto = %s")
                params.append(data.email_contacto_1)
            if data.phone_contacto_1 is not None:
                updates.append("phone_contacto = %s")
                params.append(data.phone_contacto_1)
            if data.comuna_contacto_1 is not None:
                updates.append("comuna_contacto = %s")
                params.append(data.comuna_contacto_1)
            if data.direccion_contacto_1 is not None:
                updates.append("direccion_contacto = %s")
                params.append(data.direccion_contacto_1)
            if data.active_contacto_1 is not None:
                updates.append("active_contacto = %s")
                params.append(data.active_contacto_1)
            # Contacto 2
            if data.nombre_contacto_2 is not None:
                updates.append("nombre_contacto_2 = %s")
                params.append(data.nombre_contacto_2)
            if data.cargo_contacto_2 is not None:
                updates.append("cargo_contacto_2 = %s")
                params.append(data.cargo_contacto_2)
            if data.email_contacto_2 is not None:
                updates.append("email_contacto_2 = %s")
                params.append(data.email_contacto_2)
            if data.phone_contacto_2 is not None:
                updates.append("phone_contacto_2 = %s")
                params.append(data.phone_contacto_2)
            if data.comuna_contacto_2 is not None:
                updates.append("comuna_contacto_2 = %s")
                params.append(data.comuna_contacto_2)
            if data.direccion_contacto_2 is not None:
                updates.append("direccion_contacto_2 = %s")
                params.append(data.direccion_contacto_2)
            if data.active_contacto_2 is not None:
                updates.append("active_contacto_2 = %s")
                params.append(data.active_contacto_2)
            # Contacto 3
            if data.nombre_contacto_3 is not None:
                updates.append("nombre_contacto_3 = %s")
                params.append(data.nombre_contacto_3)
            if data.cargo_contacto_3 is not None:
                updates.append("cargo_contacto_3 = %s")
                params.append(data.cargo_contacto_3)
            if data.email_contacto_3 is not None:
                updates.append("email_contacto_3 = %s")
                params.append(data.email_contacto_3)
            if data.phone_contacto_3 is not None:
                updates.append("phone_contacto_3 = %s")
                params.append(data.phone_contacto_3)
            if data.comuna_contacto_3 is not None:
                updates.append("comuna_contacto_3 = %s")
                params.append(data.comuna_contacto_3)
            if data.direccion_contacto_3 is not None:
                updates.append("direccion_contacto_3 = %s")
                params.append(data.direccion_contacto_3)
            if data.active_contacto_3 is not None:
                updates.append("active_contacto_3 = %s")
                params.append(data.active_contacto_3)
            # Contacto 4
            if data.nombre_contacto_4 is not None:
                updates.append("nombre_contacto_4 = %s")
                params.append(data.nombre_contacto_4)
            if data.cargo_contacto_4 is not None:
                updates.append("cargo_contacto_4 = %s")
                params.append(data.cargo_contacto_4)
            if data.email_contacto_4 is not None:
                updates.append("email_contacto_4 = %s")
                params.append(data.email_contacto_4)
            if data.phone_contacto_4 is not None:
                updates.append("phone_contacto_4 = %s")
                params.append(data.phone_contacto_4)
            if data.comuna_contacto_4 is not None:
                updates.append("comuna_contacto_4 = %s")
                params.append(data.comuna_contacto_4)
            if data.direccion_contacto_4 is not None:
                updates.append("direccion_contacto_4 = %s")
                params.append(data.direccion_contacto_4)
            if data.active_contacto_4 is not None:
                updates.append("active_contacto_4 = %s")
                params.append(data.active_contacto_4)
            # Contacto 5
            if data.nombre_contacto_5 is not None:
                updates.append("nombre_contacto_5 = %s")
                params.append(data.nombre_contacto_5)
            if data.cargo_contacto_5 is not None:
                updates.append("cargo_contacto_5 = %s")
                params.append(data.cargo_contacto_5)
            if data.email_contacto_5 is not None:
                updates.append("email_contacto_5 = %s")
                params.append(data.email_contacto_5)
            if data.phone_contacto_5 is not None:
                updates.append("phone_contacto_5 = %s")
                params.append(data.phone_contacto_5)
            if data.comuna_contacto_5 is not None:
                updates.append("comuna_contacto_5 = %s")
                params.append(data.comuna_contacto_5)
            if data.direccion_contacto_5 is not None:
                updates.append("direccion_contacto_5 = %s")
                params.append(data.direccion_contacto_5)
            if data.active_contacto_5 is not None:
                updates.append("active_contacto_5 = %s")
                params.append(data.active_contacto_5)
            # Clasificacion
            if data.clasificacion_id is not None:
                updates.append("clasificacion = %s")
                params.append(data.clasificacion_id)

            if not updates:
                raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

            updates.append("updated_at = NOW()")
            params.append(client_id)

            query = f"UPDATE clients SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, params)
            connection.commit()

            return ClientResponse(
                id=client_id,
                message="Cliente actualizado exitosamente"
            )
    finally:
        connection.close()


@router.put("/{client_id}/activate", response_model=ClientResponse)
async def activate_client(
    client_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Activa un cliente."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM clients WHERE id = %s", (client_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            cursor.execute(
                "UPDATE clients SET active = 1, updated_at = NOW() WHERE id = %s",
                (client_id,)
            )
            connection.commit()

            return ClientResponse(
                id=client_id,
                message="Cliente activado exitosamente"
            )
    finally:
        connection.close()


@router.put("/{client_id}/deactivate", response_model=ClientResponse)
async def deactivate_client(
    client_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Desactiva un cliente."""
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM clients WHERE id = %s", (client_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            cursor.execute(
                "UPDATE clients SET active = 0, updated_at = NOW() WHERE id = %s",
                (client_id,)
            )
            connection.commit()

            return ClientResponse(
                id=client_id,
                message="Cliente desactivado exitosamente"
            )
    finally:
        connection.close()
