"""
Router de Cotizaciones - INVEB Cascade Service
===============================================

Endpoints para gestión de cotizaciones (quotes).

Fuente Laravel: CotizacionController.php, DetalleCotizacionController.php, CotizacionApprovalController.php
Rutas Laravel (web.php líneas 825-888):
- GET /cotizador/index
- GET /cotizador/crear
- GET /cotizador/edit/{id}
- GET /cotizador/index_externo
- POST /cotizador/guardarDetalleCotizacion/{id}
- POST /cotizador/editarDetalleCotizacion
- POST /cotizador/eliminarDetalleCotizacion
- POST /cotizador/calcularDetalleCotizacion
- POST /cotizador/solicitarAprobacion/{id}
- POST /cotizador/gestionar-cotizacion/{id}
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from dateutil.relativedelta import relativedelta
from io import BytesIO
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
import pymysql

from ..config import get_settings
from .auth import get_current_user

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])
settings = get_settings()


# =============================================
# SCHEMAS
# =============================================

class CotizacionBase(BaseModel):
    client_id: int
    nombre_contacto: Optional[str] = None
    email_contacto: Optional[EmailStr] = None
    telefono_contacto: Optional[str] = None
    moneda_id: Optional[int] = 1
    dias_pago: Optional[int] = 0
    comision: Optional[float] = 0
    observacion_interna: Optional[str] = None
    observacion_cliente: Optional[str] = None


class CotizacionCreate(CotizacionBase):
    pass


class CotizacionUpdate(CotizacionBase):
    pass


class CotizacionResponse(BaseModel):
    id: int
    client_id: int
    cliente_nombre: Optional[str]
    nombre_contacto: Optional[str]
    email_contacto: Optional[EmailStr]
    telefono_contacto: Optional[str]
    moneda_id: Optional[int]
    dias_pago: Optional[int]
    comision: Optional[float]
    observacion_interna: Optional[str]
    observacion_cliente: Optional[str]
    user_id: int
    user_nombre: Optional[str]
    estado_id: int
    estado_nombre: Optional[str]
    version_number: Optional[int]
    created_at: datetime
    detalles_count: Optional[int] = 0

    class Config:
        from_attributes = True


class DetalleCotizacionBase(BaseModel):
    tipo_detalle_id: int  # 1=Corrugado, 2=Esquinero
    cantidad: int
    ciudad_id: Optional[int] = None
    carton_id: Optional[int] = None
    product_type_id: Optional[int] = None
    print_type_id: Optional[int] = None
    numero_colores: Optional[int] = 0
    process_id: Optional[int] = None
    rubro_id: Optional[int] = None
    area_hc: Optional[float] = None
    anchura: Optional[float] = None
    largura: Optional[float] = None
    maquila: Optional[int] = 0
    maquila_servicio_id: Optional[int] = None
    pallet: Optional[int] = 0
    margen: Optional[float] = 0


class DetalleCotizacionCreate(DetalleCotizacionBase):
    cotizacion_id: int


class DetalleCotizacionResponse(BaseModel):
    id: int
    cotizacion_id: int
    tipo_detalle_id: int
    cantidad: int
    carton_codigo: Optional[str]
    product_type: Optional[str]
    print_type: Optional[str]
    proceso: Optional[str]
    precio_unitario: Optional[float]
    precio_total: Optional[float]
    margen: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class CotizacionListResponse(BaseModel):
    cotizaciones: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int


class AprobacionRequest(BaseModel):
    accion: str  # 'aprobar', 'rechazar', 'solicitar_cambios'
    comentario: Optional[str] = None


# =============================================
# HELPERS
# =============================================

def get_mysql_connection():
    """Crea conexión a MySQL de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


# =============================================
# ENDPOINTS - COTIZACIONES
# =============================================

@router.get("/", response_model=CotizacionListResponse)
async def listar_cotizaciones(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    estado_id: Optional[int] = None,
    client_id: Optional[int] = None,
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista cotizaciones con filtros y paginación.

    Fuente Laravel: CotizacionController@index (líneas 60-197)
    Ruta Laravel: GET /cotizador/index
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Fechas por defecto: último mes
        if date_desde and date_hasta:
            from_date = date_desde
            to_date = date_hasta
        else:
            from_date = (datetime.now() - relativedelta(months=1)).strftime('%Y-%m-%d')
            to_date = datetime.now().strftime('%Y-%m-%d')

        # Query base
        where_clauses = ["c.active = 1"]
        params = []

        # Filtro por estado
        if estado_id:
            where_clauses.append("c.estado_id = %s")
            params.append(estado_id)

        # Filtro por cliente
        if client_id:
            where_clauses.append("c.client_id = %s")
            params.append(client_id)

        # Filtro por fechas
        where_clauses.append("DATE(c.created_at) BETWEEN %s AND %s")
        params.extend([from_date, to_date])

        # Filtro por usuario (si no es admin)
        user_role = current_user.get('role_id')
        if user_role not in [1]:  # 1 = Admin
            where_clauses.append("c.user_id = %s")
            params.append(current_user.get('id'))

        where_sql = " AND ".join(where_clauses)

        # Contar total
        cursor.execute(f"""
            SELECT COUNT(*) as total FROM cotizaciones c
            WHERE {where_sql}
        """, params)
        total = cursor.fetchone()['total']

        # Obtener cotizaciones con paginación
        offset = (page - 1) * page_size
        params.extend([page_size, offset])

        cursor.execute(f"""
            SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.codigo as cliente_codigo,
                   u.name as user_nombre,
                   ce.nombre as estado_nombre,
                   (SELECT COUNT(*) FROM detalle_cotizaciones dc WHERE dc.cotizacion_id = c.id) as detalles_count
            FROM cotizaciones c
            LEFT JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN cotizacion_estados ce ON c.estado_id = ce.id
            WHERE {where_sql}
            ORDER BY c.id DESC
            LIMIT %s OFFSET %s
        """, params)
        cotizaciones = cursor.fetchall()

        # Convertir fechas
        for cot in cotizaciones:
            for key in cot:
                if isinstance(cot[key], datetime):
                    cot[key] = cot[key].isoformat()
                elif isinstance(cot[key], date):
                    cot[key] = cot[key].isoformat()

        return CotizacionListResponse(
            cotizaciones=cotizaciones,
            total=total,
            page=page,
            page_size=page_size
        )

    finally:
        connection.close()


@router.get("/{cotizacion_id}")
async def obtener_cotizacion(
    cotizacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene una cotización con todos sus detalles.

    Fuente Laravel: CotizacionController@create (líneas 324-442)
    Ruta Laravel: GET /cotizador/edit/{id}
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Obtener cotización
        cursor.execute("""
            SELECT c.*,
                   cl.nombre as cliente_nombre,
                   cl.codigo as cliente_codigo,
                   u.name as user_nombre,
                   ce.nombre as estado_nombre
            FROM cotizaciones c
            LEFT JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN cotizacion_estados ce ON c.estado_id = ce.id
            WHERE c.id = %s AND c.active = 1
        """, (cotizacion_id,))
        cotizacion = cursor.fetchone()

        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cotización {cotizacion_id} no encontrada"
            )

        # Obtener detalles
        cursor.execute("""
            SELECT dc.*,
                   ca.codigo as carton_codigo,
                   pt.descripcion as product_type,
                   prt.descripcion as print_type,
                   pr.descripcion as proceso,
                   r.descripcion as rubro,
                   cf.ciudad as ciudad_destino
            FROM detalle_cotizaciones dc
            LEFT JOIN cartons ca ON dc.carton_id = ca.id
            LEFT JOIN product_types pt ON dc.product_type_id = pt.id
            LEFT JOIN print_types prt ON dc.print_type_id = prt.id
            LEFT JOIN processes pr ON dc.process_id = pr.id
            LEFT JOIN rubros r ON dc.rubro_id = r.id
            LEFT JOIN ciudades_fletes cf ON dc.ciudad_id = cf.id
            WHERE dc.cotizacion_id = %s
            ORDER BY dc.id
        """, (cotizacion_id,))
        detalles = cursor.fetchall()

        # Convertir fechas
        for key in cotizacion:
            if isinstance(cotizacion[key], (datetime, date)):
                cotizacion[key] = cotizacion[key].isoformat()

        for det in detalles:
            for key in det:
                if isinstance(det[key], (datetime, date)):
                    det[key] = det[key].isoformat()

        cotizacion['detalles'] = detalles

        return cotizacion

    finally:
        connection.close()


@router.post("/", response_model=CotizacionResponse)
async def crear_cotizacion(
    cotizacion: CotizacionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crea una nueva cotización.

    Fuente Laravel: CotizacionController (implícito en create/store)
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar cliente existe
        cursor.execute("SELECT id, nombre FROM clients WHERE id = %s AND active = 1", (cotizacion.client_id,))
        cliente = cursor.fetchone()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente {cotizacion.client_id} no encontrado"
            )

        # Insertar cotización
        cursor.execute("""
            INSERT INTO cotizaciones
            (client_id, nombre_contacto, email_contacto, telefono_contacto,
             moneda_id, dias_pago, comision, observacion_interna, observacion_cliente,
             user_id, estado_id, version_number, active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            cotizacion.client_id,
            cotizacion.nombre_contacto,
            cotizacion.email_contacto,
            cotizacion.telefono_contacto,
            cotizacion.moneda_id,
            cotizacion.dias_pago,
            cotizacion.comision,
            cotizacion.observacion_interna,
            cotizacion.observacion_cliente,
            current_user.get('id'),
            1,  # Estado: Borrador
            1,  # Version inicial
            1   # Active
        ))
        cotizacion_id = cursor.lastrowid
        connection.commit()

        # Obtener cotización creada
        cursor.execute("""
            SELECT c.*, cl.nombre as cliente_nombre, u.name as user_nombre, ce.nombre as estado_nombre
            FROM cotizaciones c
            LEFT JOIN clients cl ON c.client_id = cl.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN cotizacion_estados ce ON c.estado_id = ce.id
            WHERE c.id = %s
        """, (cotizacion_id,))
        nueva_cot = cursor.fetchone()

        return CotizacionResponse(
            id=nueva_cot['id'],
            client_id=nueva_cot['client_id'],
            cliente_nombre=nueva_cot.get('cliente_nombre'),
            nombre_contacto=nueva_cot.get('nombre_contacto'),
            email_contacto=nueva_cot.get('email_contacto'),
            telefono_contacto=nueva_cot.get('telefono_contacto'),
            moneda_id=nueva_cot.get('moneda_id'),
            dias_pago=nueva_cot.get('dias_pago'),
            comision=nueva_cot.get('comision'),
            observacion_interna=nueva_cot.get('observacion_interna'),
            observacion_cliente=nueva_cot.get('observacion_cliente'),
            user_id=nueva_cot['user_id'],
            user_nombre=nueva_cot.get('user_nombre'),
            estado_id=nueva_cot['estado_id'],
            estado_nombre=nueva_cot.get('estado_nombre'),
            version_number=nueva_cot.get('version_number'),
            created_at=nueva_cot['created_at'],
            detalles_count=0
        )

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear cotización: {str(e)}"
        )
    finally:
        connection.close()


@router.put("/{cotizacion_id}")
async def actualizar_cotizacion(
    cotizacion_id: int,
    cotizacion: CotizacionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Actualiza una cotización existente.
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar existe
        cursor.execute("SELECT id FROM cotizaciones WHERE id = %s AND active = 1", (cotizacion_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cotización {cotizacion_id} no encontrada"
            )

        # Actualizar
        cursor.execute("""
            UPDATE cotizaciones SET
                client_id = %s, nombre_contacto = %s, email_contacto = %s,
                telefono_contacto = %s, moneda_id = %s, dias_pago = %s,
                comision = %s, observacion_interna = %s, observacion_cliente = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (
            cotizacion.client_id,
            cotizacion.nombre_contacto,
            cotizacion.email_contacto,
            cotizacion.telefono_contacto,
            cotizacion.moneda_id,
            cotizacion.dias_pago,
            cotizacion.comision,
            cotizacion.observacion_interna,
            cotizacion.observacion_cliente,
            cotizacion_id
        ))
        connection.commit()

        return {"message": "Cotización actualizada correctamente", "id": cotizacion_id}

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar cotización: {str(e)}"
        )
    finally:
        connection.close()


# =============================================
# ENDPOINTS - DETALLES COTIZACION
# =============================================

@router.post("/{cotizacion_id}/detalles", response_model=DetalleCotizacionResponse)
async def agregar_detalle(
    cotizacion_id: int,
    detalle: DetalleCotizacionBase,
    current_user: dict = Depends(get_current_user)
):
    """
    Agrega un detalle (línea) a una cotización.

    Fuente Laravel: DetalleCotizacionController@store (líneas 36-200+)
    Ruta Laravel: POST /cotizador/guardarDetalleCotizacion/{id}
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar cotización existe
        cursor.execute("SELECT id FROM cotizaciones WHERE id = %s AND active = 1", (cotizacion_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cotización {cotizacion_id} no encontrada"
            )

        # Obtener precio dolar actual
        cursor.execute("SELECT precio_dolar FROM variables_cotizadors LIMIT 1")
        variables = cursor.fetchone()
        precio_dolar = variables['precio_dolar'] if variables else 900

        # Insertar detalle
        cursor.execute("""
            INSERT INTO detalle_cotizaciones
            (cotizacion_id, tipo_detalle_id, cantidad, ciudad_id, carton_id,
             product_type_id, print_type_id, numero_colores, process_id, rubro_id,
             area_hc, anchura, largura, maquila, maquila_servicio_id, pallet,
             margen, detalle_valor_dolar, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            cotizacion_id,
            detalle.tipo_detalle_id,
            detalle.cantidad,
            detalle.ciudad_id,
            detalle.carton_id,
            detalle.product_type_id,
            detalle.print_type_id,
            detalle.numero_colores,
            detalle.process_id,
            detalle.rubro_id,
            detalle.area_hc,
            detalle.anchura,
            detalle.largura,
            detalle.maquila,
            detalle.maquila_servicio_id,
            detalle.pallet,
            detalle.margen,
            precio_dolar
        ))
        detalle_id = cursor.lastrowid
        connection.commit()

        # Obtener detalle creado
        cursor.execute("""
            SELECT dc.*,
                   ca.codigo as carton_codigo,
                   pt.descripcion as product_type,
                   prt.descripcion as print_type,
                   pr.descripcion as proceso
            FROM detalle_cotizaciones dc
            LEFT JOIN cartons ca ON dc.carton_id = ca.id
            LEFT JOIN product_types pt ON dc.product_type_id = pt.id
            LEFT JOIN print_types prt ON dc.print_type_id = prt.id
            LEFT JOIN processes pr ON dc.process_id = pr.id
            WHERE dc.id = %s
        """, (detalle_id,))
        nuevo_detalle = cursor.fetchone()

        return DetalleCotizacionResponse(
            id=nuevo_detalle['id'],
            cotizacion_id=nuevo_detalle['cotizacion_id'],
            tipo_detalle_id=nuevo_detalle['tipo_detalle_id'],
            cantidad=nuevo_detalle['cantidad'],
            carton_codigo=nuevo_detalle.get('carton_codigo'),
            product_type=nuevo_detalle.get('product_type'),
            print_type=nuevo_detalle.get('print_type'),
            proceso=nuevo_detalle.get('proceso'),
            precio_unitario=nuevo_detalle.get('precio_unitario'),
            precio_total=nuevo_detalle.get('precio_total'),
            margen=nuevo_detalle.get('margen'),
            created_at=nuevo_detalle['created_at']
        )

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al agregar detalle: {str(e)}"
        )
    finally:
        connection.close()


@router.delete("/{cotizacion_id}/detalles/{detalle_id}")
async def eliminar_detalle(
    cotizacion_id: int,
    detalle_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Elimina un detalle de una cotización.

    Fuente Laravel: DetalleCotizacionController@delete
    Ruta Laravel: POST /cotizador/eliminarDetalleCotizacion
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar detalle existe y pertenece a la cotización
        cursor.execute("""
            SELECT id FROM detalle_cotizaciones
            WHERE id = %s AND cotizacion_id = %s
        """, (detalle_id, cotizacion_id))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Detalle {detalle_id} no encontrado"
            )

        # Eliminar
        cursor.execute("DELETE FROM detalle_cotizaciones WHERE id = %s", (detalle_id,))
        connection.commit()

        return {"message": "Detalle eliminado correctamente", "id": detalle_id}

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar detalle: {str(e)}"
        )
    finally:
        connection.close()


# =============================================
# ENDPOINTS - APROBACION
# =============================================

@router.post("/{cotizacion_id}/solicitar-aprobacion")
async def solicitar_aprobacion(
    cotizacion_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Solicita aprobación para una cotización.

    Fuente Laravel: CotizacionController@solicitarAprobacion
    Ruta Laravel: POST /cotizador/solicitarAprobacion/{id}
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar cotización existe
        cursor.execute("""
            SELECT id, estado_id FROM cotizaciones WHERE id = %s AND active = 1
        """, (cotizacion_id,))
        cotizacion = cursor.fetchone()

        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cotización {cotizacion_id} no encontrada"
            )

        # Cambiar estado a "Pendiente Aprobación" (estado_id = 2)
        cursor.execute("""
            UPDATE cotizaciones SET estado_id = 2, updated_at = NOW() WHERE id = %s
        """, (cotizacion_id,))

        # Registrar en historial de aprobaciones
        cursor.execute("""
            INSERT INTO cotizacion_approvals
            (cotizacion_id, user_id, accion, comentario, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, (cotizacion_id, current_user.get('id'), 'solicitar', 'Solicitud de aprobación'))

        connection.commit()

        return {"message": "Aprobación solicitada correctamente", "cotizacion_id": cotizacion_id}

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al solicitar aprobación: {str(e)}"
        )
    finally:
        connection.close()


@router.post("/{cotizacion_id}/gestionar-aprobacion")
async def gestionar_aprobacion(
    cotizacion_id: int,
    aprobacion: AprobacionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Gestiona la aprobación/rechazo de una cotización.

    Fuente Laravel: CotizacionApprovalController@gestionarAprobacionCotizacion
    Ruta Laravel: POST /cotizador/gestionar-cotizacion/{id}
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        # Verificar cotización existe
        cursor.execute("""
            SELECT id, estado_id FROM cotizaciones WHERE id = %s AND active = 1
        """, (cotizacion_id,))
        cotizacion = cursor.fetchone()

        if not cotizacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cotización {cotizacion_id} no encontrada"
            )

        # Determinar nuevo estado según acción
        estado_map = {
            'aprobar': 3,          # Aprobada
            'rechazar': 4,         # Rechazada
            'solicitar_cambios': 5 # Requiere cambios
        }

        nuevo_estado = estado_map.get(aprobacion.accion)
        if not nuevo_estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Acción inválida: {aprobacion.accion}"
            )

        # Actualizar estado
        cursor.execute("""
            UPDATE cotizaciones SET estado_id = %s, updated_at = NOW() WHERE id = %s
        """, (nuevo_estado, cotizacion_id))

        # Registrar en historial
        cursor.execute("""
            INSERT INTO cotizacion_approvals
            (cotizacion_id, user_id, accion, comentario, created_at, updated_at)
            VALUES (%s, %s, %s, %s, NOW(), NOW())
        """, (cotizacion_id, current_user.get('id'), aprobacion.accion, aprobacion.comentario))

        connection.commit()

        return {
            "message": f"Cotización {aprobacion.accion} correctamente",
            "cotizacion_id": cotizacion_id,
            "nuevo_estado": nuevo_estado
        }

    except Exception as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al gestionar aprobación: {str(e)}"
        )
    finally:
        connection.close()


# =============================================
# ENDPOINTS - ESTADOS Y OPCIONES
# =============================================

@router.get("/estados/lista")
async def listar_estados(
    current_user: dict = Depends(get_current_user)
):
    """
    Lista los estados disponibles para cotizaciones.
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id, nombre FROM cotizacion_estados ORDER BY id")
        estados = cursor.fetchall()
        return estados
    finally:
        connection.close()


@router.get("/opciones/formulario")
async def opciones_formulario(
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene todas las opciones necesarias para el formulario de cotización.

    Fuente Laravel: CotizacionController@create (líneas 348-397)
    """
    connection = get_mysql_connection()
    try:
        cursor = connection.cursor()

        opciones = {}

        # Clientes
        cursor.execute("""
            SELECT id, CONCAT(COALESCE(nombre,''), ' - ', COALESCE(codigo,'')) as nombre
            FROM clients WHERE active = 1 ORDER BY nombre
        """)
        opciones['clientes'] = cursor.fetchall()

        # Estilos (solo los 8 asignados)
        cursor.execute("""
            SELECT id, glosa as nombre FROM styles
            WHERE active = 1 AND id IN (1, 2, 3, 4, 12, 14, 15, 16)
        """)
        opciones['estilos'] = cursor.fetchall()

        # Tipos de producto
        cursor.execute("""
            SELECT id, descripcion as nombre FROM product_types
            WHERE active = 1 AND cotiza = 1
        """)
        opciones['tipos_producto'] = cursor.fetchall()

        # Procesos (sin offset)
        cursor.execute("""
            SELECT id, descripcion as nombre FROM processes
            WHERE active = 1 AND id NOT IN (6, 7, 8, 9)
            ORDER BY descripcion
        """)
        opciones['procesos'] = cursor.fetchall()

        # Rubros (sin esquinero)
        cursor.execute("""
            SELECT id, descripcion as nombre FROM rubros WHERE id != 5
        """)
        opciones['rubros'] = cursor.fetchall()

        # Cartones
        cursor.execute("""
            SELECT id, codigo as nombre FROM cartons
            WHERE active = 1 AND provisional = 0 AND tipo != 'ESQUINEROS'
        """)
        opciones['cartones'] = cursor.fetchall()

        # Ciudades (flete)
        cursor.execute("SELECT id, ciudad as nombre FROM ciudades_fletes")
        opciones['ciudades'] = cursor.fetchall()

        # Tipos de impresión
        cursor.execute("""
            SELECT id, descripcion as nombre FROM print_types WHERE active = 1
        """)
        opciones['tipos_impresion'] = cursor.fetchall()

        # Servicios maquila
        cursor.execute("""
            SELECT id, servicio as nombre FROM maquila_servicios WHERE active = 1
        """)
        opciones['servicios_maquila'] = cursor.fetchall()

        return opciones

    finally:
        connection.close()
