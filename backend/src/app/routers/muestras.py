"""
Router de Muestras - INVEB Envases OT
Gestión de muestras asociadas a órdenes de trabajo.

Estados de muestra:
- 0: Sin Asignar
- 1: En Proceso
- 2: Rechazada
- 3: Terminada
- 4: Anulada
- 5: Devuelta
- 6: Sala de Corte
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import pymysql
import jwt
import json

from app.config import get_settings

router = APIRouter(prefix="/muestras", tags=["Muestras"])
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
        raise HTTPException(status_code=401, detail="Token inválido")


def get_current_user_with_role(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Extrae user_id y role_id del token JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {
            "user_id": int(payload.get("sub")),
            "role_id": int(payload.get("role_id", 0))
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# Roles que pueden crear muestras (según Laravel MuestraController.php líneas 63-72)
ROLES_CREAR_MUESTRA = [5, 6]  # Jefe de Desarrollo (5), Ingeniero/Diseñador Técnico (6)

# Roles que pueden editar campos específicos de muestras (líneas 82-207)
ROLES_EDITAR_MUESTRA = [13, 14]  # Técnico de Muestras (13, 14)


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
            detail=f"Error conectando a base de datos: {str(e)}"
        )


# ============ SCHEMAS ============

# Mapeo de estados
ESTADO_MUESTRA = {
    0: "Sin Asignar",
    1: "En Proceso",
    2: "Rechazada",
    3: "Terminada",
    4: "Anulada",
    5: "Devuelta",
    6: "Sala de Corte"
}


class MuestraListItem(BaseModel):
    """Item de lista de muestras."""
    id: int
    work_order_id: int
    ot_descripcion: Optional[str]
    client_name: Optional[str]
    estado: int
    estado_nombre: str
    prioritaria: bool
    sala_corte: Optional[str]
    cad: Optional[str]
    carton: Optional[str]
    tipo_pegado: Optional[str]
    created_at: str
    # Totales de cantidades
    cantidad_total: int
    # Responsable
    creador_nombre: Optional[str]
    # Campos para validación de permisos por sala_corte (como Laravel línea 120)
    sala_corte_vendedor: Optional[int] = None
    sala_corte_disenador: Optional[int] = None
    sala_corte_laboratorio: Optional[int] = None
    sala_corte_1: Optional[int] = None
    sala_corte_2: Optional[int] = None
    sala_corte_3: Optional[int] = None
    sala_corte_4: Optional[int] = None
    sala_corte_disenador_revision: Optional[int] = None


class MuestraListResponse(BaseModel):
    """Respuesta de lista de muestras."""
    items: List[MuestraListItem]
    total: int


# Mapeo de destinatarios según Laravel
DESTINATARIOS_MAP = {
    "1": "Retira Ventas VB",
    "2": "Retira Diseñador VB",
    "3": "Envío Laboratorio",
    "4": "Envío Cliente VB",
    "5": "Retira Diseñador Revisión"
}


class MuestraDetalle(BaseModel):
    """Detalle completo de una muestra."""
    id: int
    work_order_id: int
    ot_descripcion: Optional[str]
    client_name: Optional[str]
    estado: int
    estado_nombre: str
    prioritaria: bool
    observacion_muestra: Optional[str]
    # Destinatarios (campo clave para el modal de edición)
    destinatarios_id: List[str] = []  # Array de IDs de destinatarios ["1"], ["2"], etc.
    destinatario_nombre: Optional[str]  # Nombre del primer destinatario para mostrar
    # Sala de corte
    sala_corte_id: Optional[int]
    sala_corte_nombre: Optional[str]
    # CAD y cartón
    cad_id: Optional[int]
    cad_codigo: Optional[str]
    carton_id: Optional[int]
    carton_codigo: Optional[str]
    # Pegado y tiempo
    pegado_id: Optional[int]
    pegado_nombre: Optional[str]
    tiempo_unitario: Optional[str]
    # Datos de forma de entrega
    comentario_vendedor: Optional[str]
    comentario_disenador: Optional[str]
    comentario_laboratorio: Optional[str]
    comentario_disenador_revision: Optional[str]
    # Destinos
    vendedor_nombre: Optional[str]
    vendedor_direccion: Optional[str]
    vendedor_ciudad: Optional[str]
    vendedor_check: bool
    cantidad_vendedor: int
    disenador_nombre: Optional[str]
    disenador_direccion: Optional[str]
    disenador_ciudad: Optional[str]
    disenador_check: bool
    cantidad_disenador: int
    laboratorio_check: bool
    cantidad_laboratorio: int
    cliente_check: bool
    cantidad_cliente: int
    disenador_revision_nombre: Optional[str]
    disenador_revision_direccion: Optional[str]
    disenador_revision_check: bool
    cantidad_disenador_revision: int
    # Fechas
    created_at: str
    updated_at: Optional[str]
    # Creador
    creador_id: Optional[int]
    creador_nombre: Optional[str]


class MuestraCreate(BaseModel):
    """
    Schema para crear una muestra.
    Basado en estructura real de tabla muestras y Laravel MuestraController.php
    """
    work_order_id: int = Field(..., description="ID de la OT")
    # CAD y materiales
    cad: Optional[str] = Field(None, description="Código CAD (texto libre)")
    cad_id: Optional[int] = Field(None, description="ID del CAD seleccionado")
    carton_id: Optional[int] = Field(None, description="ID del cartón")
    carton_muestra_id: Optional[int] = Field(None, description="ID del cartón de muestra")
    pegado_id: Optional[int] = Field(None, description="ID del pegado")
    # Cantidades por destino
    cantidad_vendedor: Optional[int] = 0
    cantidad_disenador: Optional[int] = 0
    cantidad_laboratorio: Optional[int] = 0
    cantidad_disenador_revision: Optional[int] = 0
    # Comentarios
    comentario_vendedor: Optional[str] = Field(None, max_length=191)
    comentario_disenador: Optional[str] = Field(None, max_length=191)
    comentario_laboratorio: Optional[str] = Field(None, max_length=191)
    comentario_disenador_revision: Optional[str] = Field(None, max_length=191)
    # Salas de corte por destino
    sala_corte_vendedor: Optional[int] = None
    sala_corte_disenador: Optional[int] = None
    sala_corte_laboratorio: Optional[int] = None
    sala_corte_disenador_revision: Optional[int] = None
    # Destino 1 (cliente externo)
    destinatario_1: Optional[str] = Field(None, max_length=191)
    comuna_1: Optional[int] = None
    direccion_1: Optional[str] = Field(None, max_length=191)
    cantidad_1: Optional[int] = 0
    comentario_1: Optional[str] = Field(None, max_length=191)
    sala_corte_1: Optional[int] = None
    # Destinatarios adicionales (2, 3, 4) se crean duplicando la muestra según Laravel


class MuestraCreateResponse(BaseModel):
    """Respuesta al crear muestra."""
    id: int
    message: str


class MuestraActionResponse(BaseModel):
    """Respuesta de acciones sobre muestra."""
    id: int
    message: str
    nuevo_estado: str


class MuestraUpdate(BaseModel):
    """
    Schema para actualizar una muestra.
    Campos editables según Laravel MuestraController.php:
    - Roles 5, 6 (Jefe Desarrollo, Ingeniero): cad, carton, pegado, cantidades, salas_corte
    - Roles 13, 14 (Técnico de Muestras): tiempo_unitario, checkboxes fecha_corte, pegado, cantidades
    """
    # CAD y materiales (editable por roles 5, 6)
    cad: Optional[str] = None
    cad_id: Optional[int] = None
    carton_id: Optional[int] = None
    carton_muestra_id: Optional[int] = None
    pegado_id: Optional[int] = None
    # Tiempo unitario (editable por roles 13, 14)
    tiempo_unitario: Optional[str] = None
    # Cantidades por destino
    cantidad_vendedor: Optional[int] = None
    cantidad_disenador: Optional[int] = None
    cantidad_laboratorio: Optional[int] = None
    cantidad_disenador_revision: Optional[int] = None
    cantidad_1: Optional[int] = None
    # Salas de corte por destino (editable por roles 5, 6)
    sala_corte_vendedor: Optional[int] = None
    sala_corte_disenador: Optional[int] = None
    sala_corte_laboratorio: Optional[int] = None
    sala_corte_disenador_revision: Optional[int] = None
    sala_corte_1: Optional[int] = None


class MuestraUpdateResponse(BaseModel):
    """Respuesta al actualizar muestra."""
    id: int
    message: str


class RechazoRequest(BaseModel):
    """Request para rechazar muestra."""
    observacion: Optional[str] = Field(None, description="Motivo del rechazo")


class DevolucionRequest(BaseModel):
    """Request para devolver muestra."""
    observacion: Optional[str] = Field(None, description="Motivo de devolución")


class OptionsResponse(BaseModel):
    """Opciones para formulario de muestra."""
    salas_corte: List[dict]
    cads: List[dict]
    cartones: List[dict]
    ciudades_flete: List[dict]
    pegados: List[dict]


# ============ ENDPOINTS ============

@router.get("/ot/{ot_id}", response_model=MuestraListResponse)
async def list_muestras_by_ot(ot_id: int):
    """
    Lista todas las muestras de una OT específica.
    Adaptado a la estructura real de la tabla muestras.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query adaptado a la estructura real de la tabla
            # La tabla no tiene sala_corte_id único, sino múltiples columnas por destino
            # Las columnas con ñ usan backticks
            # JOINs con cads, salas_cortes y pegados para obtener valores correctos
            sql = """
                SELECT
                    m.id,
                    m.work_order_id,
                    m.estado,
                    m.prioritaria,
                    m.created_at,
                    m.cantidad_vendedor,
                    m.`cantidad_diseñador` as cantidad_disenador,
                    m.cantidad_laboratorio,
                    COALESCE(m.cantidad_1, 0) + COALESCE(m.cantidad_2, 0) + COALESCE(m.cantidad_3, 0) + COALESCE(m.cantidad_4, 0) as cantidad_cliente,
                    m.`cantidad_diseñador_revision` as cantidad_disenador_revision,
                    m.destinatario_1,
                    m.sala_corte_vendedor,
                    m.`sala_corte_diseñador` as sala_corte_disenador,
                    m.sala_corte_laboratorio,
                    m.sala_corte_1,
                    m.sala_corte_2,
                    m.sala_corte_3,
                    m.sala_corte_4,
                    m.`sala_corte_diseñador_revision` as sala_corte_disenador_revision,
                    wo.descripcion as ot_descripcion,
                    c.nombre as client_name,
                    cad.cad as cad_codigo,
                    cart.codigo as carton_codigo,
                    sc.nombre as sala_corte_nombre,
                    peg.descripcion as tipo_pegado,
                    CONCAT(u.nombre, ' ', u.apellido) as creador_nombre
                FROM muestras m
                LEFT JOIN work_orders wo ON m.work_order_id = wo.id
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN cads cad ON m.cad_id = cad.id
                LEFT JOIN cartons cart ON m.carton_id = cart.id
                LEFT JOIN salas_cortes sc ON m.sala_corte_vendedor = sc.id
                LEFT JOIN pegados peg ON m.pegado_id = peg.id
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.work_order_id = %s
                ORDER BY m.prioritaria DESC, m.created_at DESC
            """
            cursor.execute(sql, (ot_id,))
            rows = cursor.fetchall()

            items = []
            for row in rows:
                cantidad_total = (
                    (row['cantidad_vendedor'] or 0) +
                    (row['cantidad_disenador'] or 0) +
                    (row['cantidad_laboratorio'] or 0) +
                    (row['cantidad_cliente'] or 0) +
                    (row['cantidad_disenador_revision'] or 0)
                )
                items.append(MuestraListItem(
                    id=row['id'],
                    work_order_id=row['work_order_id'],
                    ot_descripcion=row['ot_descripcion'],
                    client_name=row['client_name'],
                    estado=row['estado'] or 0,
                    estado_nombre=ESTADO_MUESTRA.get(row['estado'] or 0, 'Desconocido'),
                    prioritaria=bool(row['prioritaria']),
                    sala_corte=row.get('sala_corte_nombre'),  # Planta Corte desde salas_cortes
                    cad=row.get('cad_codigo'),  # CAD desde tabla cads
                    carton=row.get('carton_codigo'),
                    tipo_pegado=row.get('tipo_pegado'),  # Tipo Pegado desde tabla pegados
                    created_at=row['created_at'].strftime('%Y-%m-%d %H:%M') if row['created_at'] else '',
                    cantidad_total=cantidad_total,
                    creador_nombre=row.get('destinatario_1') or row['creador_nombre'],  # Usar destinatario si existe
                    # Campos para validación de permisos (como Laravel línea 120)
                    sala_corte_vendedor=row.get('sala_corte_vendedor'),
                    sala_corte_disenador=row.get('sala_corte_disenador'),
                    sala_corte_laboratorio=row.get('sala_corte_laboratorio'),
                    sala_corte_1=row.get('sala_corte_1'),
                    sala_corte_2=row.get('sala_corte_2'),
                    sala_corte_3=row.get('sala_corte_3'),
                    sala_corte_4=row.get('sala_corte_4'),
                    sala_corte_disenador_revision=row.get('sala_corte_disenador_revision')
                ))

            return MuestraListResponse(items=items, total=len(items))

    finally:
        connection.close()


@router.get("/options", response_model=OptionsResponse)
async def get_muestra_options():
    """
    Obtiene las opciones para el formulario de muestras.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            options = {}

            # Salas de corte (usa 'deleted' en lugar de 'active')
            cursor.execute("SELECT id, nombre FROM salas_cortes WHERE deleted = 0 ORDER BY nombre")
            options['salas_corte'] = cursor.fetchall()

            # CADs (usa 'active')
            cursor.execute("SELECT id, cad as codigo FROM cads WHERE active = 1 ORDER BY cad LIMIT 500")
            options['cads'] = cursor.fetchall()

            # Cartones (usa 'active')
            cursor.execute("SELECT id, codigo FROM cartons WHERE active = 1 ORDER BY codigo LIMIT 500")
            options['cartones'] = cursor.fetchall()

            # Ciudades para flete (usa 'ciudad' no 'nombre', y 'active')
            cursor.execute("SELECT id, ciudad as nombre FROM ciudades_fletes WHERE active = 1 ORDER BY ciudad")
            options['ciudades_flete'] = cursor.fetchall()

            # Pegados (tipos de pegado)
            cursor.execute("SELECT id, descripcion as nombre FROM pegados WHERE active = 1 ORDER BY id")
            options['pegados'] = cursor.fetchall()

            return OptionsResponse(**options)

    finally:
        connection.close()


@router.get("/{muestra_id}", response_model=MuestraDetalle)
async def get_muestra(muestra_id: int):
    """
    Obtiene el detalle de una muestra específica.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # La tabla no tiene sala_corte_id único, usa sala_corte_vendedor como principal
            sql = """
                SELECT
                    m.*,
                    wo.descripcion as ot_descripcion,
                    c.nombre as client_name,
                    sc.nombre as sala_corte_nombre,
                    cad.cad as cad_codigo,
                    cart.codigo as carton_codigo,
                    peg.descripcion as pegado_nombre,
                    CONCAT(u.nombre, ' ', u.apellido) as creador_nombre
                FROM muestras m
                LEFT JOIN work_orders wo ON m.work_order_id = wo.id
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN salas_cortes sc ON m.sala_corte_vendedor = sc.id
                LEFT JOIN cads cad ON m.cad_id = cad.id
                LEFT JOIN cartons cart ON m.carton_id = cart.id
                LEFT JOIN pegados peg ON m.pegado_id = peg.id
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.id = %s
            """
            cursor.execute(sql, (muestra_id,))
            row = cursor.fetchone()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            # Parsear destinatarios_id (viene como JSON string de Laravel)
            destinatarios_id_raw = row.get('destinatarios_id')
            destinatarios_id = []
            if destinatarios_id_raw:
                if isinstance(destinatarios_id_raw, str):
                    try:
                        destinatarios_id = json.loads(destinatarios_id_raw)
                    except json.JSONDecodeError:
                        destinatarios_id = []
                elif isinstance(destinatarios_id_raw, list):
                    destinatarios_id = destinatarios_id_raw

            # Obtener nombre del primer destinatario
            destinatario_nombre = None
            if destinatarios_id and len(destinatarios_id) > 0:
                first_dest = str(destinatarios_id[0])
                destinatario_nombre = DESTINATARIOS_MAP.get(first_dest)

            return MuestraDetalle(
                id=row['id'],
                work_order_id=row['work_order_id'],
                ot_descripcion=row['ot_descripcion'],
                client_name=row['client_name'],
                estado=row['estado'] or 0,
                estado_nombre=ESTADO_MUESTRA.get(row['estado'] or 0, 'Desconocido'),
                prioritaria=bool(row.get('prioritaria')),
                observacion_muestra=row.get('observacion_muestra'),
                destinatarios_id=destinatarios_id,
                destinatario_nombre=destinatario_nombre,
                sala_corte_id=row.get('sala_corte_vendedor'),
                sala_corte_nombre=row.get('sala_corte_nombre'),
                cad_id=row.get('cad_id'),
                cad_codigo=row.get('cad_codigo') or row.get('cad'),  # CAD puede ser texto libre
                carton_id=row.get('carton_id'),
                carton_codigo=row.get('carton_codigo'),
                pegado_id=row.get('pegado_id'),
                pegado_nombre=row.get('pegado_nombre'),
                tiempo_unitario=row.get('tiempo_unitario').strftime('%H:%M') if row.get('tiempo_unitario') else None,
                comentario_vendedor=row.get('comentario_vendedor'),
                comentario_disenador=row.get('comentario_diseñador'),
                comentario_laboratorio=row.get('comentario_laboratorio'),
                comentario_disenador_revision=row.get('comentario_diseñador_revision'),
                vendedor_nombre=row.get('vendedor_nombre'),
                vendedor_direccion=row.get('vendedor_direccion'),
                vendedor_ciudad=row.get('vendedor_ciudad'),
                vendedor_check=bool(row.get('vendedor_check')),
                cantidad_vendedor=row.get('cantidad_vendedor') or 0,
                disenador_nombre=row.get('disenador_nombre'),
                disenador_direccion=row.get('disenador_direccion'),
                disenador_ciudad=row.get('disenador_ciudad'),
                disenador_check=bool(row.get('disenador_check')),
                cantidad_disenador=row.get('cantidad_diseñador') or 0,
                laboratorio_check=bool(row.get('laboratorio_check')),
                cantidad_laboratorio=row.get('cantidad_laboratorio') or 0,
                cliente_check=bool(row.get('cliente_check')),
                cantidad_cliente=row.get('cantidad_cliente') or 0,
                disenador_revision_nombre=row.get('disenador_revision_nombre'),
                disenador_revision_direccion=row.get('disenador_revision_direccion'),
                disenador_revision_check=bool(row.get('disenador_revision_check')),
                cantidad_disenador_revision=row.get('cantidad_diseñador_revision') or 0,
                created_at=row['created_at'].strftime('%Y-%m-%d %H:%M') if row.get('created_at') else '',
                updated_at=row['updated_at'].strftime('%Y-%m-%d %H:%M') if row.get('updated_at') else None,
                creador_id=row.get('user_id'),
                creador_nombre=row.get('creador_nombre')
            )

    finally:
        connection.close()


@router.post("/", response_model=MuestraCreateResponse)
async def create_muestra(
    data: MuestraCreate,
    current_user: dict = Depends(get_current_user_with_role)
):
    """
    Crea una nueva muestra para una OT.
    Estado inicial: 0 (Sin Asignar), o 1 si la OT está en Sala de Muestra (area 6).

    Roles permitidos (según Laravel MuestraController.php líneas 63-72):
    - role_id 5: Jefe de Desarrollo
    - role_id 6: Ingeniero (Diseñador Técnico)
    """
    user_id = current_user["user_id"]
    role_id = current_user["role_id"]

    # Validar que el rol puede crear muestras
    if role_id not in ROLES_CREAR_MUESTRA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para crear muestras. Solo Jefe de Desarrollo e Ingeniero pueden crear muestras."
        )

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que la OT existe y obtener su área actual
            cursor.execute(
                "SELECT id, current_area_id FROM work_orders WHERE id = %s AND active = 1",
                (data.work_order_id,)
            )
            ot = cursor.fetchone()
            if not ot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"OT {data.work_order_id} no encontrada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Según Laravel (MuestraController.php líneas 213-219):
            # Si la OT está en current_area_id == 6 (Sala de Muestra), estado inicial = 1 (En Proceso)
            # De lo contrario, estado inicial = 0 (Sin Asignar)
            estado_inicial = 1 if ot['current_area_id'] == 6 else 0

            # Insertar muestra (estructura real de la tabla)
            # La tabla usa destinatarios_id como JSON array de IDs de destino
            # Por simplicidad inicial, solo soportamos destino vendedor (1)
            destinatarios_id = '["1"]'  # Destino vendedor por defecto

            insert_sql = """
                INSERT INTO muestras (
                    work_order_id, user_id, estado, prioritaria,
                    cad, cad_id, carton_id, carton_muestra_id, pegado_id,
                    destinatarios_id,
                    cantidad_vendedor, comentario_vendedor,
                    `cantidad_diseñador`, `comentario_diseñador`,
                    cantidad_laboratorio, comentario_laboratorio,
                    `cantidad_diseñador_revision`, `comentario_diseñador_revision`,
                    sala_corte_vendedor, `sala_corte_diseñador`,
                    sala_corte_laboratorio, `sala_corte_diseñador_revision`,
                    destinatario_1, comuna_1, direccion_1, cantidad_1, comentario_1, sala_corte_1,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, 0,
                    %s, %s, %s, %s, %s,
                    %s,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s
                )
            """
            cursor.execute(insert_sql, (
                data.work_order_id, user_id, estado_inicial,
                data.cad, data.cad_id, data.carton_id, data.carton_muestra_id, data.pegado_id,
                destinatarios_id,
                data.cantidad_vendedor or 0, data.comentario_vendedor or "Retira Vendedor",
                data.cantidad_disenador or 0, data.comentario_disenador,
                data.cantidad_laboratorio or 0, data.comentario_laboratorio,
                data.cantidad_disenador_revision or 0, data.comentario_disenador_revision,
                data.sala_corte_vendedor, data.sala_corte_disenador,
                data.sala_corte_laboratorio, data.sala_corte_disenador_revision,
                data.destinatario_1, data.comuna_1, data.direccion_1, data.cantidad_1 or 0, data.comentario_1, data.sala_corte_1,
                now, now
            ))
            muestra_id = cursor.lastrowid
            connection.commit()

            return MuestraCreateResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} creada exitosamente"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear muestra: {str(e)}"
        )
    finally:
        connection.close()


# Roles que pueden editar muestras (según Laravel MuestraController.php)
# Roles 5, 6: Jefe de Desarrollo, Ingeniero - pueden editar todos los campos
# Roles 13, 14: Técnico de Muestras - pueden editar campos específicos
ROLES_EDITAR_MUESTRA_COMPLETO = [5, 6]  # Edición completa
ROLES_EDITAR_MUESTRA_TECNICO = [13, 14]  # Edición limitada


@router.put("/{muestra_id}", response_model=MuestraUpdateResponse)
async def update_muestra(
    muestra_id: int,
    data: MuestraUpdate,
    current_user: dict = Depends(get_current_user_with_role)
):
    """
    Actualiza una muestra existente.

    Permisos según Laravel MuestraController.php:
    - Roles 5, 6 (Jefe Desarrollo, Ingeniero): Edición completa
    - Roles 13, 14 (Técnico de Muestras): Solo campos específicos
    """
    user_id = current_user["user_id"]
    role_id = current_user["role_id"]

    # Validar que el rol puede editar muestras
    if role_id not in ROLES_EDITAR_MUESTRA_COMPLETO + ROLES_EDITAR_MUESTRA_TECNICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para editar muestras."
        )

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que la muestra existe
            cursor.execute("SELECT id, estado FROM muestras WHERE id = %s", (muestra_id,))
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Construir UPDATE dinámico según el rol
            updates = []
            params = []

            if role_id in ROLES_EDITAR_MUESTRA_COMPLETO:
                # Roles 5, 6: pueden editar todos los campos
                if data.cad is not None:
                    updates.append("cad = %s")
                    params.append(data.cad)
                if data.cad_id is not None:
                    updates.append("cad_id = %s")
                    params.append(data.cad_id)
                if data.carton_id is not None:
                    updates.append("carton_id = %s")
                    params.append(data.carton_id)
                if data.carton_muestra_id is not None:
                    updates.append("carton_muestra_id = %s")
                    params.append(data.carton_muestra_id)
                if data.pegado_id is not None:
                    updates.append("pegado_id = %s")
                    params.append(data.pegado_id)
                if data.cantidad_vendedor is not None:
                    updates.append("cantidad_vendedor = %s")
                    params.append(data.cantidad_vendedor)
                if data.cantidad_disenador is not None:
                    updates.append("`cantidad_diseñador` = %s")
                    params.append(data.cantidad_disenador)
                if data.cantidad_laboratorio is not None:
                    updates.append("cantidad_laboratorio = %s")
                    params.append(data.cantidad_laboratorio)
                if data.cantidad_disenador_revision is not None:
                    updates.append("`cantidad_diseñador_revision` = %s")
                    params.append(data.cantidad_disenador_revision)
                if data.cantidad_1 is not None:
                    updates.append("cantidad_1 = %s")
                    params.append(data.cantidad_1)
                if data.sala_corte_vendedor is not None:
                    updates.append("sala_corte_vendedor = %s")
                    params.append(data.sala_corte_vendedor)
                if data.sala_corte_disenador is not None:
                    updates.append("`sala_corte_diseñador` = %s")
                    params.append(data.sala_corte_disenador)
                if data.sala_corte_laboratorio is not None:
                    updates.append("sala_corte_laboratorio = %s")
                    params.append(data.sala_corte_laboratorio)
                if data.sala_corte_disenador_revision is not None:
                    updates.append("`sala_corte_diseñador_revision` = %s")
                    params.append(data.sala_corte_disenador_revision)
                if data.sala_corte_1 is not None:
                    updates.append("sala_corte_1 = %s")
                    params.append(data.sala_corte_1)
            else:
                # Roles 13, 14: solo campos específicos
                if data.tiempo_unitario is not None:
                    updates.append("tiempo_unitario = %s")
                    params.append(f"2021-01-01 {data.tiempo_unitario}:00" if ":" not in data.tiempo_unitario else data.tiempo_unitario)
                if data.pegado_id is not None:
                    updates.append("pegado_id = %s")
                    params.append(data.pegado_id)
                if data.cantidad_vendedor is not None:
                    updates.append("cantidad_vendedor = %s")
                    params.append(data.cantidad_vendedor)
                if data.cantidad_disenador is not None:
                    updates.append("`cantidad_diseñador` = %s")
                    params.append(data.cantidad_disenador)
                if data.cantidad_laboratorio is not None:
                    updates.append("cantidad_laboratorio = %s")
                    params.append(data.cantidad_laboratorio)
                if data.cantidad_disenador_revision is not None:
                    updates.append("`cantidad_diseñador_revision` = %s")
                    params.append(data.cantidad_disenador_revision)
                if data.cantidad_1 is not None:
                    updates.append("cantidad_1 = %s")
                    params.append(data.cantidad_1)
                if data.carton_muestra_id is not None:
                    updates.append("carton_muestra_id = %s")
                    params.append(data.carton_muestra_id)

            if not updates:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se proporcionaron campos para actualizar"
                )

            # Agregar updated_at
            updates.append("updated_at = %s")
            params.append(now)
            params.append(muestra_id)

            update_sql = f"UPDATE muestras SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(update_sql, tuple(params))
            connection.commit()

            return MuestraUpdateResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} actualizada exitosamente"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/terminar", response_model=MuestraActionResponse)
async def terminar_muestra(
    muestra_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Marca una muestra como terminada.
    Cambia estado a 3 (Terminada).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Verificar que existe y no está terminada/anulada
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            if muestra['estado'] in [3, 4]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La muestra ya está terminada o anulada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                "UPDATE muestras SET estado = 3, updated_at = %s WHERE id = %s",
                (now, muestra_id)
            )
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} terminada",
                nuevo_estado="Terminada"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al terminar muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/rechazar", response_model=MuestraActionResponse)
async def rechazar_muestra(
    muestra_id: int,
    data: RechazoRequest,
    user_id: int = Depends(get_current_user_id)
):
    """
    Rechaza una muestra.
    Cambia estado a 2 (Rechazada).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            update_sql = """
                UPDATE muestras
                SET estado = 2, observacion_muestra = CONCAT(COALESCE(observacion_muestra, ''), ' | Rechazada: ', %s), updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_sql, (data.observacion or '', now, muestra_id))
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} rechazada",
                nuevo_estado="Rechazada"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al rechazar muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/anular", response_model=MuestraActionResponse)
async def anular_muestra(
    muestra_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Anula una muestra.
    Cambia estado a 4 (Anulada).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            if muestra['estado'] == 4:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La muestra ya está anulada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                "UPDATE muestras SET estado = 4, updated_at = %s WHERE id = %s",
                (now, muestra_id)
            )
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} anulada",
                nuevo_estado="Anulada"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al anular muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/devolver", response_model=MuestraActionResponse)
async def devolver_muestra(
    muestra_id: int,
    data: DevolucionRequest,
    user_id: int = Depends(get_current_user_id)
):
    """
    Devuelve una muestra.
    Cambia estado a 5 (Devuelta).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            update_sql = """
                UPDATE muestras
                SET estado = 5, observacion_muestra = CONCAT(COALESCE(observacion_muestra, ''), ' | Devuelta: ', %s), updated_at = %s
                WHERE id = %s
            """
            cursor.execute(update_sql, (data.observacion or '', now, muestra_id))
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} devuelta",
                nuevo_estado="Devuelta"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al devolver muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/prioritaria", response_model=MuestraActionResponse)
async def toggle_prioritaria(
    muestra_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Alterna el estado de prioridad de una muestra.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, prioritaria FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            nueva_prioridad = 0 if muestra['prioritaria'] else 1
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            cursor.execute(
                "UPDATE muestras SET prioritaria = %s, updated_at = %s WHERE id = %s",
                (nueva_prioridad, now, muestra_id)
            )
            connection.commit()

            estado_str = "Prioritaria" if nueva_prioridad else "Normal"
            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} marcada como {estado_str}",
                nuevo_estado=estado_str
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cambiar prioridad: {str(e)}"
        )
    finally:
        connection.close()


@router.delete("/{muestra_id}")
async def delete_muestra(
    muestra_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Elimina una muestra.
    Solo se permite si está en estado Sin Asignar (0).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            if muestra['estado'] != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Solo se pueden eliminar muestras sin asignar"
                )

            cursor.execute("DELETE FROM muestras WHERE id = %s", (muestra_id,))
            connection.commit()

            return {"message": f"Muestra {muestra_id} eliminada exitosamente"}

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar muestra: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/sala-corte", response_model=MuestraActionResponse)
async def asignar_sala_corte(
    muestra_id: int,
    sala_corte_id: int = Query(..., description="ID de la sala de corte"),
    user_id: int = Depends(get_current_user_id)
):
    """
    Asigna una sala de corte a la muestra.
    Cambia estado a 6 (Sala de Corte).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            # Verificar sala de corte
            cursor.execute(
                "SELECT id, nombre FROM salas_cortes WHERE id = %s AND active = 1",
                (sala_corte_id,)
            )
            sala = cursor.fetchone()
            if not sala:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Sala de corte {sala_corte_id} no encontrada"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                "UPDATE muestras SET sala_corte_id = %s, estado = 6, updated_at = %s WHERE id = %s",
                (sala_corte_id, now, muestra_id)
            )
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} asignada a {sala['nombre']}",
                nuevo_estado="Sala de Corte"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asignar sala de corte: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{muestra_id}/en-proceso", response_model=MuestraActionResponse)
async def iniciar_proceso(
    muestra_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """
    Marca una muestra como en proceso.
    Cambia estado a 1 (En Proceso).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, estado FROM muestras WHERE id = %s",
                (muestra_id,)
            )
            muestra = cursor.fetchone()

            if not muestra:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Muestra {muestra_id} no encontrada"
                )

            if muestra['estado'] not in [0, 6]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Solo se puede iniciar proceso desde Sin Asignar o Sala de Corte"
                )

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(
                "UPDATE muestras SET estado = 1, updated_at = %s WHERE id = %s",
                (now, muestra_id)
            )
            connection.commit()

            return MuestraActionResponse(
                id=muestra_id,
                message=f"Muestra {muestra_id} en proceso",
                nuevo_estado="En Proceso"
            )

    except pymysql.Error as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al iniciar proceso: {str(e)}"
        )
    finally:
        connection.close()
