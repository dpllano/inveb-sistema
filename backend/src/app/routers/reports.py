"""
Router de Reportes - INVEB Cascade Service
Endpoints para obtener datos agregados para los reportes del dashboard.
Incluye descarga de reportes en Excel.
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import pymysql
import jwt
from calendar import monthrange

from app.config import get_settings
from services.report_excel_generator import (
    generar_excel_ots_completadas,
    generar_excel_conversion_ot,
    generar_excel_ots_activas_area,
    generar_excel_sala_muestra,
    generar_excel_tiempo_primera_muestra,
    generar_excel_anulaciones,
    generar_excel_rechazos,
)

router = APIRouter(prefix="/reports", tags=["Reportes"])
security = HTTPBearer(auto_error=False)
settings = get_settings()


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


# =============================================
# SCHEMAS DE REPORTES
# =============================================

class OTsPorUsuarioItem(BaseModel):
    """Item del reporte de OTs por usuario."""
    usuario_id: int
    usuario_nombre: str
    area_id: Optional[int]
    area_nombre: str
    total_ots: int
    ots_activas: int
    ots_completadas: int
    tiempo_promedio: float


class OTsPorUsuarioResponse(BaseModel):
    """Respuesta del reporte de OTs por usuario."""
    items: List[OTsPorUsuarioItem]
    total_usuarios: int
    total_ots: int
    areas: List[dict]


class OTsCompletadasItem(BaseModel):
    """Item del reporte de OTs completadas."""
    id: int
    created_at: str
    completed_at: str
    client_name: str
    descripcion: str
    tiempo_total: float
    estado: str


class OTsCompletadasResponse(BaseModel):
    """Respuesta del reporte de OTs completadas."""
    items: List[OTsCompletadasItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    resumen: dict


class TiempoPorAreaItem(BaseModel):
    """Item del reporte de tiempo por área."""
    mes: str
    area_id: int
    area_nombre: str
    tiempo_promedio: float
    total_ots: int


class TiempoPorAreaResponse(BaseModel):
    """Respuesta del reporte de tiempo por área."""
    items: List[TiempoPorAreaItem]
    areas: List[dict]
    meses: List[str]


class CargaMensualItem(BaseModel):
    """Item del reporte de carga mensual."""
    mes: str
    total_ots: int
    ots_nuevas: int
    ots_completadas: int
    ots_activas: int


class CargaMensualResponse(BaseModel):
    """Respuesta del reporte de carga mensual."""
    items: List[CargaMensualItem]
    total_anual: int
    promedio_mensual: float


class RechazosMesItem(BaseModel):
    """Item del reporte de rechazos por mes."""
    mes: str
    total_rechazos: int
    area_id: Optional[int]
    area_nombre: Optional[str]


class RechazosMesResponse(BaseModel):
    """Respuesta del reporte de rechazos por mes."""
    items: List[RechazosMesItem]
    total_rechazos: int
    promedio_mensual: float
    por_area: List[dict]


class AnulacionItem(BaseModel):
    """Item del reporte de anulaciones."""
    id: int
    fecha: str
    client_name: str
    descripcion: str
    motivo: Optional[str]
    usuario: str


class AnulacionesResponse(BaseModel):
    """Respuesta del reporte de anulaciones."""
    items: List[AnulacionItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    por_mes: List[dict]


class MotivoRechazoItem(BaseModel):
    """Item del reporte de motivos de rechazo."""
    motivo: str
    cantidad: int
    porcentaje: float


class MotivosRechazoResponse(BaseModel):
    """Respuesta del reporte de motivos de rechazo."""
    items: List[MotivoRechazoItem]
    total: int
    por_mes: List[dict]


class TiempoPrimeraMuestraItem(BaseModel):
    """Item del reporte de tiempo primera muestra."""
    id: int
    client_name: str
    descripcion: str
    created_at: str
    primera_muestra_at: Optional[str]
    dias_hasta_muestra: Optional[float]


class TiempoPrimeraMuestraResponse(BaseModel):
    """Respuesta del reporte de tiempo primera muestra."""
    items: List[TiempoPrimeraMuestraItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    promedio_dias: float
    minimo_dias: float
    maximo_dias: float


class SalaMuestraItem(BaseModel):
    """Item del reporte de sala de muestra."""
    id: int
    ot_id: int
    estado: str
    responsable: str
    created_at: str
    completed_at: Optional[str]
    tiempo_proceso: Optional[float]


class SalaMuestraResponse(BaseModel):
    """Respuesta del reporte de sala de muestra."""
    items: List[SalaMuestraItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    por_estado: List[dict]
    por_responsable: List[dict]


class MuestraItem(BaseModel):
    """Item del reporte de muestras."""
    id: int
    ot_id: int
    tipo: str
    estado: str
    responsable: str
    created_at: str
    completed_at: Optional[str]


class MuestrasResponse(BaseModel):
    """Respuesta del reporte de muestras."""
    items: List[MuestraItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    por_tipo: List[dict]
    por_estado: List[dict]


# =============================================
# ENDPOINTS DE REPORTES
# =============================================

@router.get("/ots-por-usuario", response_model=OTsPorUsuarioResponse)
async def get_ots_por_usuario(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    area_id: Optional[int] = None,
):
    """
    Obtiene distribución de OTs activas por usuario y área.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Obtener áreas disponibles
            cursor.execute("SELECT id, nombre FROM work_spaces WHERE status = 'active' ORDER BY id")
            areas = cursor.fetchall()

            # Query principal
            query = """
                SELECT
                    u.id as usuario_id,
                    CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
                    wo.current_area_id as area_id,
                    COALESCE(ws.nombre, 'Sin asignar') as area_nombre,
                    COUNT(*) as total_ots,
                    SUM(CASE WHEN s.abreviatura NOT IN ('COMP', 'ANUL', 'RECH') THEN 1 ELSE 0 END) as ots_activas,
                    SUM(CASE WHEN s.abreviatura = 'COMP' THEN 1 ELSE 0 END) as ots_completadas,
                    AVG(COALESCE((SELECT SUM(duracion_segundos) / 86400.0 FROM managements
                        WHERE work_order_id = wo.id AND management_type_id = 1 AND mostrar = 1), 0)) as tiempo_promedio
                FROM work_orders wo
                INNER JOIN users u ON wo.creador_id = u.id
                LEFT JOIN work_spaces ws ON wo.current_area_id = ws.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
            """
            params = []

            if date_desde:
                query += " AND wo.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND wo.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            if area_id:
                query += " AND wo.current_area_id = %s"
                params.append(area_id)

            query += " GROUP BY u.id, u.nombre, u.apellido, wo.current_area_id, ws.nombre"
            query += " ORDER BY total_ots DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            total_ots = 0
            for row in rows:
                items.append(OTsPorUsuarioItem(
                    usuario_id=row['usuario_id'],
                    usuario_nombre=row['usuario_nombre'] or 'Sin nombre',
                    area_id=row['area_id'],
                    area_nombre=row['area_nombre'],
                    total_ots=row['total_ots'],
                    ots_activas=row['ots_activas'] or 0,
                    ots_completadas=row['ots_completadas'] or 0,
                    tiempo_promedio=float(row['tiempo_promedio']) if row['tiempo_promedio'] else 0.0
                ))
                total_ots += row['total_ots']

            return OTsPorUsuarioResponse(
                items=items,
                total_usuarios=len(set(item.usuario_id for item in items)),
                total_ots=total_ots,
                areas=areas
            )

    finally:
        connection.close()


@router.get("/ots-completadas")
async def get_ots_completadas(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    client_id: Optional[int] = None,
):
    """
    Obtiene OTs completadas con métricas de tiempo.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query base para OTs completadas (estado con abreviatura COMP o nombre Completado)
            query = """
                SELECT
                    wo.id,
                    wo.created_at,
                    wo.descripcion,
                    c.nombre as client_name,
                    s.nombre as estado,
                    COALESCE((SELECT SUM(duracion_segundos) / 86400.0 FROM managements
                        WHERE work_order_id = wo.id AND management_type_id = 1 AND mostrar = 1), 0) as tiempo_total,
                    (SELECT MAX(created_at) FROM managements WHERE work_order_id = wo.id) as completed_at
                FROM work_orders wo
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND (s.abreviatura = 'COMP' OR s.nombre LIKE '%%omplet%%')
            """
            params = []

            if date_desde:
                query += " AND wo.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND wo.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            if client_id:
                query += " AND wo.client_id = %s"
                params.append(client_id)

            # Contar total
            count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']

            # Obtener resumen
            resumen_query = f"""
                SELECT
                    COUNT(*) as total_completadas,
                    AVG(tiempo_total) as tiempo_promedio,
                    MIN(tiempo_total) as tiempo_minimo,
                    MAX(tiempo_total) as tiempo_maximo
                FROM ({query}) as subquery
            """
            cursor.execute(resumen_query, params)
            resumen_row = cursor.fetchone()

            # Paginación
            query += " ORDER BY wo.id DESC LIMIT %s OFFSET %s"
            offset = (page - 1) * page_size
            params.extend([page_size, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append(OTsCompletadasItem(
                    id=row['id'],
                    created_at=row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else '',
                    completed_at=row['completed_at'].strftime('%d/%m/%Y') if row['completed_at'] else '',
                    client_name=row['client_name'] or '',
                    descripcion=row['descripcion'] or '',
                    tiempo_total=float(row['tiempo_total']) if row['tiempo_total'] else 0.0,
                    estado=row['estado'] or 'Completado'
                ))

            total_pages = (total + page_size - 1) // page_size

            return OTsCompletadasResponse(
                items=items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                resumen={
                    'total_completadas': resumen_row['total_completadas'] or 0,
                    'tiempo_promedio': float(resumen_row['tiempo_promedio']) if resumen_row['tiempo_promedio'] else 0.0,
                    'tiempo_minimo': float(resumen_row['tiempo_minimo']) if resumen_row['tiempo_minimo'] else 0.0,
                    'tiempo_maximo': float(resumen_row['tiempo_maximo']) if resumen_row['tiempo_maximo'] else 0.0
                }
            )

    finally:
        connection.close()


@router.get("/tiempo-por-area", response_model=TiempoPorAreaResponse)
async def get_tiempo_por_area(
    year: Optional[int] = None,
):
    """
    Obtiene tiempo promedio por área por mes.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not year:
                year = datetime.now().year

            # Obtener áreas
            cursor.execute("SELECT id, nombre FROM work_spaces WHERE status = 'active' ORDER BY id")
            areas = cursor.fetchall()

            # Generar lista de meses
            meses = []
            for month in range(1, 13):
                meses.append(f"{year}-{month:02d}")

            # Query para tiempos por área y mes
            query = """
                SELECT
                    DATE_FORMAT(wo.created_at, '%%Y-%%m') as mes,
                    m.work_space_id as area_id,
                    ws.nombre as area_nombre,
                    AVG(m.duracion_segundos / 86400.0) as tiempo_promedio,
                    COUNT(DISTINCT wo.id) as total_ots
                FROM work_orders wo
                INNER JOIN managements m ON wo.id = m.work_order_id
                LEFT JOIN work_spaces ws ON m.work_space_id = ws.id
                WHERE wo.active = 1
                AND m.management_type_id = 1
                AND m.mostrar = 1
                AND YEAR(wo.created_at) = %s
                GROUP BY DATE_FORMAT(wo.created_at, '%%Y-%%m'), m.work_space_id, ws.nombre
                ORDER BY mes, area_id
            """
            cursor.execute(query, (year,))
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append(TiempoPorAreaItem(
                    mes=row['mes'],
                    area_id=row['area_id'] or 0,
                    area_nombre=row['area_nombre'] or 'Sin área',
                    tiempo_promedio=float(row['tiempo_promedio']) if row['tiempo_promedio'] else 0.0,
                    total_ots=row['total_ots'] or 0
                ))

            return TiempoPorAreaResponse(
                items=items,
                areas=areas,
                meses=meses
            )

    finally:
        connection.close()


@router.get("/carga-mensual", response_model=CargaMensualResponse)
async def get_carga_mensual(
    year: Optional[int] = None,
):
    """
    Obtiene carga de OTs por mes.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not year:
                year = datetime.now().year

            # Query para carga mensual
            query = """
                SELECT
                    DATE_FORMAT(wo.created_at, '%%Y-%%m') as mes,
                    COUNT(*) as total_ots,
                    SUM(CASE WHEN s.abreviatura NOT IN ('COMP', 'ANUL', 'RECH') THEN 1 ELSE 0 END) as ots_activas,
                    SUM(CASE WHEN s.abreviatura = 'COMP' THEN 1 ELSE 0 END) as ots_completadas
                FROM work_orders wo
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND YEAR(wo.created_at) = %s
                GROUP BY DATE_FORMAT(wo.created_at, '%%Y-%%m')
                ORDER BY mes
            """
            cursor.execute(query, (year,))
            rows = cursor.fetchall()

            items = []
            total_anual = 0
            for row in rows:
                items.append(CargaMensualItem(
                    mes=row['mes'],
                    total_ots=row['total_ots'],
                    ots_nuevas=row['total_ots'],  # Las nuevas son las creadas en ese mes
                    ots_completadas=row['ots_completadas'] or 0,
                    ots_activas=row['ots_activas'] or 0
                ))
                total_anual += row['total_ots']

            promedio_mensual = total_anual / len(items) if items else 0

            return CargaMensualResponse(
                items=items,
                total_anual=total_anual,
                promedio_mensual=promedio_mensual
            )

    finally:
        connection.close()


@router.get("/rechazos-mes", response_model=RechazosMesResponse)
async def get_rechazos_mes(
    year: Optional[int] = None,
):
    """
    Obtiene rechazos por mes.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not year:
                year = datetime.now().year

            # Query para rechazos por mes
            query = """
                SELECT
                    DATE_FORMAT(m.created_at, '%%Y-%%m') as mes,
                    m.work_space_id as area_id,
                    ws.nombre as area_nombre,
                    COUNT(*) as total_rechazos
                FROM managements m
                INNER JOIN states s ON m.state_id = s.id
                LEFT JOIN work_spaces ws ON m.work_space_id = ws.id
                WHERE (s.abreviatura = 'RECH' OR s.nombre LIKE '%%echaz%%')
                AND YEAR(m.created_at) = %s
                GROUP BY DATE_FORMAT(m.created_at, '%%Y-%%m'), m.work_space_id, ws.nombre
                ORDER BY mes
            """
            cursor.execute(query, (year,))
            rows = cursor.fetchall()

            items = []
            total_rechazos = 0
            por_area = {}

            for row in rows:
                items.append(RechazosMesItem(
                    mes=row['mes'],
                    total_rechazos=row['total_rechazos'],
                    area_id=row['area_id'],
                    area_nombre=row['area_nombre']
                ))
                total_rechazos += row['total_rechazos']

                # Agrupar por área
                area_key = row['area_nombre'] or 'Sin área'
                if area_key not in por_area:
                    por_area[area_key] = 0
                por_area[area_key] += row['total_rechazos']

            por_area_list = [{'area': k, 'cantidad': v} for k, v in por_area.items()]
            meses_con_datos = len(set(item.mes for item in items))
            promedio_mensual = total_rechazos / meses_con_datos if meses_con_datos else 0

            return RechazosMesResponse(
                items=items,
                total_rechazos=total_rechazos,
                promedio_mensual=promedio_mensual,
                por_area=por_area_list
            )

    finally:
        connection.close()


@router.get("/anulaciones", response_model=AnulacionesResponse)
async def get_anulaciones(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Obtiene OTs anuladas.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query base para anulaciones
            query = """
                SELECT
                    wo.id,
                    wo.updated_at as fecha,
                    c.nombre as client_name,
                    wo.descripcion,
                    m.observacion as motivo,
                    CONCAT(u.nombre, ' ', u.apellido) as usuario
                FROM work_orders wo
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.observacion, m1.user_id
                    FROM managements m1
                    INNER JOIN states s ON m1.state_id = s.id
                    WHERE s.abreviatura = 'ANUL' OR s.nombre LIKE '%%nulad%%'
                    ORDER BY m1.created_at DESC
                ) m ON wo.id = m.work_order_id
                LEFT JOIN users u ON m.user_id = u.id
                WHERE wo.active = 0
                OR EXISTS (
                    SELECT 1 FROM managements mg
                    INNER JOIN states st ON mg.state_id = st.id
                    WHERE mg.work_order_id = wo.id
                    AND (st.abreviatura = 'ANUL' OR st.nombre LIKE '%%nulad%%')
                )
            """
            params = []

            if date_desde:
                query += " AND wo.updated_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND wo.updated_at <= %s"
                params.append(date_hasta + " 23:59:59")

            # Contar total
            count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']

            # Obtener por mes
            por_mes_query = f"""
                SELECT DATE_FORMAT(fecha, '%%Y-%%m') as mes, COUNT(*) as cantidad
                FROM ({query}) as subquery
                GROUP BY DATE_FORMAT(fecha, '%%Y-%%m')
                ORDER BY mes DESC
            """
            cursor.execute(por_mes_query, params)
            por_mes = cursor.fetchall()

            # Paginación
            query += " ORDER BY wo.updated_at DESC LIMIT %s OFFSET %s"
            offset = (page - 1) * page_size
            params.extend([page_size, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append(AnulacionItem(
                    id=row['id'],
                    fecha=row['fecha'].strftime('%d/%m/%Y') if row['fecha'] else '',
                    client_name=row['client_name'] or '',
                    descripcion=row['descripcion'] or '',
                    motivo=row['motivo'],
                    usuario=row['usuario'] or 'Sistema'
                ))

            total_pages = (total + page_size - 1) // page_size

            return AnulacionesResponse(
                items=items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                por_mes=[{'mes': m['mes'], 'cantidad': m['cantidad']} for m in por_mes]
            )

    finally:
        connection.close()


@router.get("/motivos-rechazo", response_model=MotivosRechazoResponse)
async def get_motivos_rechazo(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Obtiene motivos de rechazo agrupados.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query para motivos de rechazo
            query = """
                SELECT
                    COALESCE(m.observacion, 'Sin motivo especificado') as motivo,
                    COUNT(*) as cantidad
                FROM managements m
                INNER JOIN states s ON m.state_id = s.id
                WHERE (s.abreviatura = 'RECH' OR s.nombre LIKE '%%echaz%%')
            """
            params = []

            if date_desde:
                query += " AND m.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND m.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            query += " GROUP BY COALESCE(m.observacion, 'Sin motivo especificado')"
            query += " ORDER BY cantidad DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            total = sum(row['cantidad'] for row in rows)

            items = []
            for row in rows:
                items.append(MotivoRechazoItem(
                    motivo=row['motivo'][:100] if row['motivo'] else 'Sin motivo',
                    cantidad=row['cantidad'],
                    porcentaje=round(row['cantidad'] / total * 100, 1) if total > 0 else 0
                ))

            # Obtener por mes
            por_mes_query = """
                SELECT
                    DATE_FORMAT(m.created_at, '%%Y-%%m') as mes,
                    COUNT(*) as cantidad
                FROM managements m
                INNER JOIN states s ON m.state_id = s.id
                WHERE (s.abreviatura = 'RECH' OR s.nombre LIKE '%%echaz%%')
            """
            if date_desde:
                por_mes_query += f" AND m.created_at >= '{date_desde}'"
            if date_hasta:
                por_mes_query += f" AND m.created_at <= '{date_hasta} 23:59:59'"

            por_mes_query += " GROUP BY DATE_FORMAT(m.created_at, '%%Y-%%m') ORDER BY mes"

            cursor.execute(por_mes_query)
            por_mes = cursor.fetchall()

            return MotivosRechazoResponse(
                items=items,
                total=total,
                por_mes=[{'mes': m['mes'], 'cantidad': m['cantidad']} for m in por_mes]
            )

    finally:
        connection.close()


@router.get("/tiempo-primera-muestra")
async def get_tiempo_primera_muestra(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Obtiene tiempo hasta primera muestra por OT.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query para tiempo primera muestra
            query = """
                SELECT
                    wo.id,
                    c.nombre as client_name,
                    wo.descripcion,
                    wo.created_at,
                    (SELECT MIN(created_at) FROM managements WHERE work_order_id = wo.id AND work_space_id = 6) as primera_muestra_at,
                    DATEDIFF(
                        (SELECT MIN(created_at) FROM managements WHERE work_order_id = wo.id AND work_space_id = 6),
                        wo.created_at
                    ) as dias_hasta_muestra
                FROM work_orders wo
                LEFT JOIN clients c ON wo.client_id = c.id
                WHERE wo.active = 1
                AND EXISTS (SELECT 1 FROM managements WHERE work_order_id = wo.id AND work_space_id = 6)
            """
            params = []

            if date_desde:
                query += " AND wo.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND wo.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            # Contar total
            count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']

            # Obtener estadísticas
            stats_query = f"""
                SELECT
                    AVG(dias_hasta_muestra) as promedio,
                    MIN(dias_hasta_muestra) as minimo,
                    MAX(dias_hasta_muestra) as maximo
                FROM ({query}) as subquery
                WHERE dias_hasta_muestra IS NOT NULL
            """
            cursor.execute(stats_query, params)
            stats = cursor.fetchone()

            # Paginación
            query += " ORDER BY wo.created_at DESC LIMIT %s OFFSET %s"
            offset = (page - 1) * page_size
            params.extend([page_size, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append(TiempoPrimeraMuestraItem(
                    id=row['id'],
                    client_name=row['client_name'] or '',
                    descripcion=row['descripcion'] or '',
                    created_at=row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else '',
                    primera_muestra_at=row['primera_muestra_at'].strftime('%d/%m/%Y') if row['primera_muestra_at'] else None,
                    dias_hasta_muestra=float(row['dias_hasta_muestra']) if row['dias_hasta_muestra'] else None
                ))

            total_pages = (total + page_size - 1) // page_size

            return TiempoPrimeraMuestraResponse(
                items=items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                promedio_dias=float(stats['promedio']) if stats['promedio'] else 0.0,
                minimo_dias=float(stats['minimo']) if stats['minimo'] else 0.0,
                maximo_dias=float(stats['maximo']) if stats['maximo'] else 0.0
            )

    finally:
        connection.close()


@router.get("/gestion-ots-activas")
async def get_gestion_ots_activas(
    area_id: Optional[int] = None,
):
    """
    Obtiene dashboard de gestión de OTs activas.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Obtener OTs activas por área
            query = """
                SELECT
                    ws.id as area_id,
                    ws.nombre as area_nombre,
                    COUNT(*) as total_ots,
                    AVG(DATEDIFF(NOW(), wo.created_at)) as dias_promedio,
                    SUM(CASE WHEN DATEDIFF(NOW(), wo.created_at) > 30 THEN 1 ELSE 0 END) as ots_atrasadas
                FROM work_orders wo
                LEFT JOIN work_spaces ws ON wo.current_area_id = ws.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND s.abreviatura NOT IN ('COMP', 'ANUL', 'RECH')
            """
            params = []

            if area_id:
                query += " AND wo.current_area_id = %s"
                params.append(area_id)

            query += " GROUP BY ws.id, ws.nombre ORDER BY total_ots DESC"

            cursor.execute(query, params)
            por_area = cursor.fetchall()

            # Totales
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM work_orders wo
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND s.abreviatura NOT IN ('COMP', 'ANUL', 'RECH')
            """)
            total_activas = cursor.fetchone()['total']

            return {
                'total_activas': total_activas,
                'por_area': [
                    {
                        'area_id': row['area_id'],
                        'area_nombre': row['area_nombre'] or 'Sin asignar',
                        'total_ots': row['total_ots'],
                        'dias_promedio': float(row['dias_promedio']) if row['dias_promedio'] else 0,
                        'ots_atrasadas': row['ots_atrasadas'] or 0
                    }
                    for row in por_area
                ]
            }

    finally:
        connection.close()


@router.get("/indicadores-sala-muestra")
async def get_indicadores_sala_muestra(
    year: Optional[int] = None,
):
    """
    Obtiene KPIs de la sala de muestras.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not year:
                year = datetime.now().year

            # OTs que pasaron por sala de muestra (work_space_id = 6)
            query = """
                SELECT
                    DATE_FORMAT(m.created_at, '%%Y-%%m') as mes,
                    COUNT(DISTINCT m.work_order_id) as total_muestras,
                    AVG(m.duracion_segundos / 86400.0) as tiempo_promedio,
                    SUM(CASE WHEN s.abreviatura = 'COMP' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN s.abreviatura = 'RECH' THEN 1 ELSE 0 END) as rechazadas
                FROM managements m
                LEFT JOIN states s ON m.state_id = s.id
                WHERE m.work_space_id = 6
                AND YEAR(m.created_at) = %s
                GROUP BY DATE_FORMAT(m.created_at, '%%Y-%%m')
                ORDER BY mes
            """
            cursor.execute(query, (year,))
            por_mes = cursor.fetchall()

            # Totales del año
            cursor.execute("""
                SELECT
                    COUNT(DISTINCT work_order_id) as total,
                    AVG(duracion_segundos / 86400.0) as tiempo_promedio
                FROM managements
                WHERE work_space_id = 6
                AND YEAR(created_at) = %s
            """, (year,))
            totales = cursor.fetchone()

            return {
                'year': year,
                'total_muestras': totales['total'] or 0,
                'tiempo_promedio': float(totales['tiempo_promedio']) if totales['tiempo_promedio'] else 0,
                'por_mes': [
                    {
                        'mes': row['mes'],
                        'total_muestras': row['total_muestras'],
                        'tiempo_promedio': float(row['tiempo_promedio']) if row['tiempo_promedio'] else 0,
                        'completadas': row['completadas'] or 0,
                        'rechazadas': row['rechazadas'] or 0
                    }
                    for row in por_mes
                ]
            }

    finally:
        connection.close()


@router.get("/diseno-estructural-sala")
async def get_diseno_estructural_sala(
    year: Optional[int] = None,
):
    """
    Obtiene relación entre diseño estructural y sala de muestras.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not year:
                year = datetime.now().year

            # OTs que pasaron por diseño (3) y luego por muestra (6)
            query = """
                SELECT
                    DATE_FORMAT(wo.created_at, '%%Y-%%m') as mes,
                    COUNT(*) as total_ots,
                    AVG(COALESCE((SELECT SUM(duracion_segundos) / 86400.0 FROM managements
                        WHERE work_order_id = wo.id AND work_space_id = 3 AND mostrar = 1), 0)) as tiempo_diseno,
                    AVG(COALESCE((SELECT SUM(duracion_segundos) / 86400.0 FROM managements
                        WHERE work_order_id = wo.id AND work_space_id = 6 AND mostrar = 1), 0)) as tiempo_muestra
                FROM work_orders wo
                WHERE wo.active = 1
                AND YEAR(wo.created_at) = %s
                AND EXISTS (SELECT 1 FROM managements WHERE work_order_id = wo.id AND work_space_id = 3)
                AND EXISTS (SELECT 1 FROM managements WHERE work_order_id = wo.id AND work_space_id = 6)
                GROUP BY DATE_FORMAT(wo.created_at, '%%Y-%%m')
                ORDER BY mes
            """
            cursor.execute(query, (year,))
            por_mes = cursor.fetchall()

            return {
                'year': year,
                'por_mes': [
                    {
                        'mes': row['mes'],
                        'total_ots': row['total_ots'],
                        'tiempo_diseno': float(row['tiempo_diseno']) if row['tiempo_diseno'] else 0,
                        'tiempo_muestra': float(row['tiempo_muestra']) if row['tiempo_muestra'] else 0
                    }
                    for row in por_mes
                ]
            }

    finally:
        connection.close()


@router.get("/tiempo-disenador-externo")
async def get_tiempo_disenador_externo(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Obtiene métricas de tiempo para diseñadores externos.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Buscar usuarios que han trabajado en el área de diseño gráfico (work_space_id = 3)
            # Usa la tabla managements para encontrar los diseñadores
            query = """
                SELECT
                    u.id as disenador_id,
                    CONCAT(u.nombre, ' ', u.apellido) as disenador_nombre,
                    COUNT(DISTINCT wo.id) as total_ots,
                    AVG(COALESCE(m.duracion_segundos / 86400.0, 0)) as tiempo_promedio
                FROM work_orders wo
                INNER JOIN managements m ON wo.id = m.work_order_id AND m.work_space_id = 3
                INNER JOIN users u ON m.user_id = u.id
                WHERE wo.active = 1
            """
            params = []

            if date_desde:
                query += " AND wo.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND wo.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            query += " GROUP BY u.id, u.nombre, u.apellido ORDER BY total_ots DESC LIMIT 20"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            return {
                'disenadores': [
                    {
                        'id': row['disenador_id'],
                        'nombre': row['disenador_nombre'] or 'Sin nombre',
                        'total_ots': row['total_ots'],
                        'tiempo_promedio': float(row['tiempo_promedio']) if row['tiempo_promedio'] else 0
                    }
                    for row in rows
                ],
                'total_disenadores': len(rows)
            }

    finally:
        connection.close()


@router.get("/muestras")
async def get_muestras(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    estado: Optional[str] = None,
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Obtiene listado de muestras con su estado.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Query para muestras (OTs que tienen registro en sala de muestras)
            query = """
                SELECT
                    m.id,
                    m.work_order_id as ot_id,
                    s.nombre as estado,
                    CONCAT(u.nombre, ' ', u.apellido) as responsable,
                    m.created_at,
                    CASE WHEN s.abreviatura = 'COMP' THEN m.updated_at ELSE NULL END as completed_at
                FROM managements m
                INNER JOIN work_orders wo ON m.work_order_id = wo.id
                LEFT JOIN states s ON m.state_id = s.id
                LEFT JOIN users u ON m.user_id = u.id
                WHERE m.work_space_id = 6
                AND wo.active = 1
            """
            params = []

            if estado:
                query += " AND s.nombre LIKE %s"
                params.append(f"%{estado}%")

            if date_desde:
                query += " AND m.created_at >= %s"
                params.append(date_desde)

            if date_hasta:
                query += " AND m.created_at <= %s"
                params.append(date_hasta + " 23:59:59")

            # Contar total
            count_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
            cursor.execute(count_query, params)
            total = cursor.fetchone()['total']

            # Estadísticas por estado
            stats_query = """
                SELECT s.nombre as estado, COUNT(*) as cantidad
                FROM managements m
                INNER JOIN work_orders wo ON m.work_order_id = wo.id
                LEFT JOIN states s ON m.state_id = s.id
                WHERE m.work_space_id = 6 AND wo.active = 1
                GROUP BY s.nombre
            """
            cursor.execute(stats_query)
            por_estado = cursor.fetchall()

            # Paginación
            query += " ORDER BY m.created_at DESC LIMIT %s OFFSET %s"
            offset = (page - 1) * page_size
            params.extend([page_size, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append(MuestraItem(
                    id=row['id'],
                    ot_id=row['ot_id'],
                    tipo='física',  # Por defecto, se puede extender según modelo de datos
                    estado=row['estado'] or 'En proceso',
                    responsable=row['responsable'] or 'Sin asignar',
                    created_at=row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else '',
                    completed_at=row['completed_at'].strftime('%d/%m/%Y') if row['completed_at'] else None
                ))

            total_pages = (total + page_size - 1) // page_size

            return MuestrasResponse(
                items=items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                por_tipo=[{'tipo': 'física', 'cantidad': total}],  # Simplificado
                por_estado=[{'estado': e['estado'] or 'Sin estado', 'cantidad': e['cantidad']} for e in por_estado]
            )

    finally:
        connection.close()


# =============================================
# ENDPOINTS FALTANTES SPRINT 2
# Fuente Laravel: ReportController.php
# =============================================

@router.get("/conversion-ot-entre-fechas")
async def get_conversion_ot_entre_fechas(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    vendedor_id: Optional[int] = None,
):
    """
    Reporte de conversión de OTs entre fechas.

    Fuente Laravel: ReportController@reportCompletedOtEntreFechas (líneas 731-978)

    Muestra OTs creadas entre fechas por tipo de solicitud y su porcentaje de completadas.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Fechas por defecto: inicio del mes actual hasta hoy
            if not date_desde:
                date_desde = datetime.now().replace(day=1).strftime('%Y-%m-%d')
            if not date_hasta:
                date_hasta = datetime.now().strftime('%Y-%m-%d')

            # Query para OTs de desarrollo (tipo_solicitud = 1) y arte con material (tipo_solicitud = 5)
            query = """
                SELECT
                    wo.id,
                    wo.tipo_solicitud,
                    wo.created_at,
                    c.nombre as client_name,
                    wo.descripcion,
                    s.nombre as estado,
                    s.id as state_id
                FROM work_orders wo
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND wo.tipo_solicitud IN (1, 5, 7)
                AND wo.created_at BETWEEN %s AND %s
            """
            params = [date_desde, date_hasta + " 23:59:59"]

            if vendedor_id:
                query += " AND wo.creador_id = %s"
                params.append(vendedor_id)

            query += " ORDER BY wo.created_at DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Calcular estadísticas por tipo
            desarrollo_total = 0
            desarrollo_completadas = 0
            arte_total = 0
            arte_completadas = 0

            items = []
            for row in rows:
                tipo_solicitud = row['tipo_solicitud']
                is_completada = row['state_id'] == 8  # Estado 8 = Completado en Laravel

                if tipo_solicitud in (1, 7):  # Desarrollo
                    desarrollo_total += 1
                    if is_completada:
                        desarrollo_completadas += 1
                elif tipo_solicitud == 5:  # Arte con material
                    arte_total += 1
                    if is_completada:
                        arte_completadas += 1

                items.append({
                    'id': row['id'],
                    'tipo_solicitud': tipo_solicitud,
                    'tipo_nombre': 'Desarrollo' if tipo_solicitud in (1, 7) else 'Arte con Material',
                    'created_at': row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else '',
                    'client_name': row['client_name'] or '',
                    'descripcion': row['descripcion'] or '',
                    'estado': row['estado'] or 'En proceso',
                    'completada': is_completada
                })

            # Calcular porcentajes
            desarrollo_porcentaje = round((desarrollo_completadas / desarrollo_total * 100), 1) if desarrollo_total > 0 else 0
            arte_porcentaje = round((arte_completadas / arte_total * 100), 1) if arte_total > 0 else 0

            # Obtener vendedores para filtro
            cursor.execute("""
                SELECT id, CONCAT(nombre, ' ', apellido) as nombre
                FROM users
                WHERE active = 1 AND role_id IN (3, 4, 19)
                ORDER BY nombre
            """)
            vendedores = cursor.fetchall()

            return {
                'date_desde': date_desde,
                'date_hasta': date_hasta,
                'items': items,
                'total': len(items),
                'resumen': {
                    'desarrollo': {
                        'total': desarrollo_total,
                        'completadas': desarrollo_completadas,
                        'porcentaje': desarrollo_porcentaje
                    },
                    'arte_material': {
                        'total': arte_total,
                        'completadas': arte_completadas,
                        'porcentaje': arte_porcentaje
                    }
                },
                'filtros': {
                    'vendedores': [{'id': v['id'], 'nombre': v['nombre']} for v in vendedores]
                }
            }

    finally:
        connection.close()


@router.get("/ots-activas-por-area")
async def get_ots_activas_por_area(
    area_id: Optional[int] = None,
    vendedor_id: Optional[int] = None,
):
    """
    Reporte de OTs activas por área con semáforo de tiempo.

    Fuente Laravel: ReportController@reportActiveOtsPerArea (líneas 2788-3093)

    Muestra OTs activas agrupadas por área con indicadores de tiempo (semáforo).
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Obtener áreas
            cursor.execute("""
                SELECT id, nombre FROM work_spaces
                WHERE status = 'active' ORDER BY id
            """)
            areas = cursor.fetchall()

            # Query principal para OTs activas
            query = """
                SELECT
                    wo.id,
                    wo.created_at,
                    wo.descripcion,
                    wo.current_area_id as area_id,
                    ws.nombre as area_nombre,
                    c.nombre as client_name,
                    CONCAT(u.nombre, ' ', u.apellido) as vendedor_nombre,
                    ts.nombre as tipo_solicitud,
                    s.nombre as estado,
                    DATEDIFF(NOW(), wo.created_at) as dias_transcurridos,
                    COALESCE((
                        SELECT SUM(duracion_segundos) / 86400.0
                        FROM managements
                        WHERE work_order_id = wo.id
                        AND work_space_id = wo.current_area_id
                        AND management_type_id = 1
                        AND mostrar = 1
                    ), DATEDIFF(NOW(), (
                        SELECT MAX(created_at)
                        FROM managements
                        WHERE work_order_id = wo.id
                        AND work_space_id = wo.current_area_id
                    ))) as dias_en_area
                FROM work_orders wo
                LEFT JOIN work_spaces ws ON wo.current_area_id = ws.id
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN users u ON wo.creador_id = u.id
                LEFT JOIN tipo_solicitudes ts ON wo.tipo_solicitud = ts.id
                LEFT JOIN (
                    SELECT m1.work_order_id, m1.state_id
                    FROM managements m1
                    INNER JOIN (
                        SELECT work_order_id, MAX(id) as max_id
                        FROM managements
                        GROUP BY work_order_id
                    ) m2 ON m1.work_order_id = m2.work_order_id AND m1.id = m2.max_id
                ) latest ON wo.id = latest.work_order_id
                LEFT JOIN states s ON latest.state_id = s.id
                WHERE wo.active = 1
                AND s.abreviatura NOT IN ('COMP', 'ANUL', 'RECH')
            """
            params = []

            if area_id:
                query += " AND wo.current_area_id = %s"
                params.append(area_id)

            if vendedor_id:
                query += " AND wo.creador_id = %s"
                params.append(vendedor_id)

            query += " ORDER BY wo.current_area_id, dias_en_area DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Procesar resultados y calcular semáforo
            # Semáforo según Laravel: Verde < 5 días, Amarillo 5-10 días, Rojo > 10 días
            items = []
            por_area = {}
            semaforo_totales = {'verde': 0, 'amarillo': 0, 'rojo': 0}

            for row in rows:
                dias_en_area = float(row['dias_en_area']) if row['dias_en_area'] else 0

                # Calcular semáforo
                if dias_en_area < 5:
                    semaforo = 'verde'
                elif dias_en_area < 10:
                    semaforo = 'amarillo'
                else:
                    semaforo = 'rojo'

                semaforo_totales[semaforo] += 1

                area_key = row['area_id'] or 0
                if area_key not in por_area:
                    por_area[area_key] = {
                        'area_id': area_key,
                        'area_nombre': row['area_nombre'] or 'Sin asignar',
                        'total': 0,
                        'verde': 0,
                        'amarillo': 0,
                        'rojo': 0
                    }
                por_area[area_key]['total'] += 1
                por_area[area_key][semaforo] += 1

                items.append({
                    'id': row['id'],
                    'created_at': row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else '',
                    'descripcion': row['descripcion'] or '',
                    'area_id': row['area_id'],
                    'area_nombre': row['area_nombre'] or 'Sin asignar',
                    'client_name': row['client_name'] or '',
                    'vendedor_nombre': row['vendedor_nombre'] or '',
                    'tipo_solicitud': row['tipo_solicitud'] or '',
                    'estado': row['estado'] or 'En proceso',
                    'dias_transcurridos': row['dias_transcurridos'] or 0,
                    'dias_en_area': round(dias_en_area, 1),
                    'semaforo': semaforo
                })

            # Obtener vendedores para filtro
            cursor.execute("""
                SELECT id, CONCAT(nombre, ' ', apellido) as nombre
                FROM users
                WHERE active = 1 AND role_id IN (3, 4, 19)
                ORDER BY nombre
            """)
            vendedores = cursor.fetchall()

            return {
                'total': len(items),
                'items': items,
                'por_area': list(por_area.values()),
                'semaforo_totales': semaforo_totales,
                'filtros': {
                    'areas': [{'id': a['id'], 'nombre': a['nombre']} for a in areas],
                    'vendedores': [{'id': v['id'], 'nombre': v['nombre']} for v in vendedores]
                }
            }

    finally:
        connection.close()


@router.get("/sala-muestra-completo")
async def get_sala_muestra_completo(
    mes: Optional[int] = None,
    year: Optional[int] = None,
):
    """
    Reporte completo de Sala de Muestras.

    Fuente Laravel: ReportController@reportSalaMuestra (líneas 4286-5344)

    Incluye: muestras en proceso, pendientes de entrega, cortadas, terminadas,
    con comparaciones mensuales y anuales.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            # Valores por defecto
            if not mes:
                mes = datetime.now().month
            if not year:
                year = datetime.now().year

            # Calcular fechas del mes seleccionado
            from calendar import monthrange
            _, last_day = monthrange(year, mes)
            from_date = f"{year}-{mes:02d}-01"
            to_date = f"{year}-{mes:02d}-{last_day}"

            # Nombres de meses para display
            nombres_meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

            # 1. OTs en sala de muestras (current_area_id = 6)
            cursor.execute("""
                SELECT id FROM work_orders
                WHERE current_area_id = 6 AND active = 1
            """)
            ot_en_sala = [r['id'] for r in cursor.fetchall()]

            # 2. Muestras en proceso (si existe la tabla muestras)
            muestras_en_proceso = 0
            muestras_pendiente_entrega = 0
            muestras_cortadas = 0
            muestras_terminadas = 0

            try:
                # Verificar si existe la tabla muestras
                cursor.execute("SHOW TABLES LIKE 'muestras'")
                if cursor.fetchone():
                    # Muestras en proceso (estado = 1, sin fecha de corte)
                    cursor.execute("""
                        SELECT COUNT(*) as total
                        FROM muestras m
                        WHERE m.work_order_id IN (SELECT id FROM work_orders WHERE current_area_id = 6 AND active = 1)
                        AND m.estado = 1
                        AND m.fecha_corte_vendedor IS NULL
                        AND m.fecha_corte_1 IS NULL
                    """)
                    muestras_en_proceso = cursor.fetchone()['total'] or 0

                    # Muestras pendientes de entrega (con fecha de corte pero no terminadas)
                    cursor.execute("""
                        SELECT COUNT(*) as total
                        FROM muestras m
                        WHERE m.work_order_id IN (SELECT id FROM work_orders WHERE current_area_id = 6 AND active = 1)
                        AND m.estado NOT IN (2, 3, 4)
                        AND (m.fecha_corte_vendedor IS NOT NULL OR m.fecha_corte_1 IS NOT NULL)
                    """)
                    muestras_pendiente_entrega = cursor.fetchone()['total'] or 0

                    # Muestras cortadas en el mes
                    cursor.execute("""
                        SELECT COUNT(*) as total
                        FROM muestras m
                        WHERE (m.fecha_corte_vendedor BETWEEN %s AND %s
                               OR m.fecha_corte_1 BETWEEN %s AND %s)
                    """, (from_date, to_date, from_date, to_date))
                    muestras_cortadas = cursor.fetchone()['total'] or 0

                    # Muestras terminadas en el mes
                    cursor.execute("""
                        SELECT COUNT(*) as total
                        FROM muestras m
                        WHERE m.estado IN (2, 3)
                        AND m.updated_at BETWEEN %s AND %s
                    """, (from_date, to_date))
                    muestras_terminadas = cursor.fetchone()['total'] or 0
            except Exception:
                pass  # Si no existe la tabla muestras, usar valores por defecto

            # 3. Estadísticas de managements en sala de muestras (work_space_id = 6)
            cursor.execute("""
                SELECT
                    COUNT(DISTINCT work_order_id) as total_ots,
                    AVG(duracion_segundos / 86400.0) as tiempo_promedio_dias
                FROM managements
                WHERE work_space_id = 6
                AND created_at BETWEEN %s AND %s
            """, (from_date, to_date))
            stats_mes = cursor.fetchone()

            # 4. Comparación con meses anteriores (últimos 5 meses)
            meses_anteriores = []
            for i in range(4, -1, -1):
                mes_calc = mes - i
                year_calc = year
                if mes_calc <= 0:
                    mes_calc += 12
                    year_calc -= 1

                _, last_day_calc = monthrange(year_calc, mes_calc)
                from_date_calc = f"{year_calc}-{mes_calc:02d}-01"
                to_date_calc = f"{year_calc}-{mes_calc:02d}-{last_day_calc}"

                cursor.execute("""
                    SELECT COUNT(DISTINCT work_order_id) as total
                    FROM managements
                    WHERE work_space_id = 6
                    AND created_at BETWEEN %s AND %s
                """, (from_date_calc, to_date_calc))
                total_mes = cursor.fetchone()['total'] or 0

                meses_anteriores.append({
                    'mes': f"{year_calc}-{mes_calc:02d}",
                    'nombre': nombres_meses[mes_calc - 1],
                    'total': total_mes
                })

            # 5. Comparación con año anterior
            cursor.execute("""
                SELECT
                    COUNT(DISTINCT work_order_id) as total_ots,
                    AVG(duracion_segundos / 86400.0) as tiempo_promedio
                FROM managements
                WHERE work_space_id = 6
                AND YEAR(created_at) = %s
            """, (year - 1,))
            stats_anio_anterior = cursor.fetchone()

            cursor.execute("""
                SELECT
                    COUNT(DISTINCT work_order_id) as total_ots,
                    AVG(duracion_segundos / 86400.0) as tiempo_promedio
                FROM managements
                WHERE work_space_id = 6
                AND YEAR(created_at) = %s
            """, (year,))
            stats_anio_actual = cursor.fetchone()

            # Generar años para filtro
            years_disponibles = list(range(datetime.now().year, 2019, -1))

            return {
                'filtros': {
                    'mes_seleccionado': mes,
                    'year_seleccionado': year,
                    'meses': [{'value': i, 'nombre': nombres_meses[i-1]} for i in range(1, 13)],
                    'years': years_disponibles
                },
                'periodo': {
                    'from_date': from_date,
                    'to_date': to_date,
                    'nombre_mes': nombres_meses[mes - 1],
                    'year': year
                },
                'ots_en_sala': len(ot_en_sala),
                'muestras': {
                    'en_proceso': muestras_en_proceso,
                    'pendiente_entrega': muestras_pendiente_entrega,
                    'cortadas_mes': muestras_cortadas,
                    'terminadas_mes': muestras_terminadas
                },
                'estadisticas_mes': {
                    'total_ots': stats_mes['total_ots'] or 0,
                    'tiempo_promedio_dias': round(float(stats_mes['tiempo_promedio_dias'] or 0), 1)
                },
                'comparacion_meses': meses_anteriores,
                'comparacion_anual': {
                    'anio_anterior': {
                        'year': year - 1,
                        'total_ots': stats_anio_anterior['total_ots'] or 0,
                        'tiempo_promedio': round(float(stats_anio_anterior['tiempo_promedio'] or 0), 1)
                    },
                    'anio_actual': {
                        'year': year,
                        'total_ots': stats_anio_actual['total_ots'] or 0,
                        'tiempo_promedio': round(float(stats_anio_actual['tiempo_promedio'] or 0), 1)
                    }
                }
            }

    finally:
        connection.close()


@router.get("/tiempo-disenador-externo-ajuste")
async def get_tiempo_disenador_externo_ajuste(
    mes: Optional[int] = None,
    year: Optional[int] = None,
    disenador_id: Optional[int] = None,
):
    """
    Reporte de tiempo de diseñador externo con ajustes.

    Fuente Laravel: ReportController@reportTiempoDisenadorExternoAjuste (líneas 11388+)

    Similar a tiempo-disenador-externo pero con ajustes de tiempo adicionales.
    """
    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if not mes:
                mes = datetime.now().month
            if not year:
                year = datetime.now().year

            # Calcular fechas
            from calendar import monthrange
            _, last_day = monthrange(year, mes)
            from_date = f"{year}-{mes:02d}-01"
            to_date = f"{year}-{mes:02d}-{last_day}"

            # Query para diseñadores que trabajaron en área de diseño (work_space_id = 3)
            query = """
                SELECT
                    u.id as disenador_id,
                    CONCAT(u.nombre, ' ', u.apellido) as disenador_nombre,
                    COUNT(DISTINCT m.work_order_id) as total_ots,
                    SUM(m.duracion_segundos) / 3600.0 as total_horas,
                    AVG(m.duracion_segundos / 86400.0) as tiempo_promedio_dias,
                    MIN(m.duracion_segundos / 86400.0) as tiempo_minimo,
                    MAX(m.duracion_segundos / 86400.0) as tiempo_maximo
                FROM managements m
                INNER JOIN users u ON m.user_id = u.id
                WHERE m.work_space_id = 3
                AND m.management_type_id = 1
                AND m.mostrar = 1
                AND m.created_at BETWEEN %s AND %s
            """
            params = [from_date, to_date]

            if disenador_id:
                query += " AND u.id = %s"
                params.append(disenador_id)

            query += " GROUP BY u.id, u.nombre, u.apellido ORDER BY total_ots DESC"

            cursor.execute(query, params)
            rows = cursor.fetchall()

            items = []
            for row in rows:
                items.append({
                    'disenador_id': row['disenador_id'],
                    'disenador_nombre': row['disenador_nombre'] or 'Sin nombre',
                    'total_ots': row['total_ots'],
                    'total_horas': round(float(row['total_horas'] or 0), 1),
                    'tiempo_promedio_dias': round(float(row['tiempo_promedio_dias'] or 0), 2),
                    'tiempo_minimo_dias': round(float(row['tiempo_minimo'] or 0), 2),
                    'tiempo_maximo_dias': round(float(row['tiempo_maximo'] or 0), 2)
                })

            # Comparación con mes anterior
            mes_anterior = mes - 1 if mes > 1 else 12
            year_anterior = year if mes > 1 else year - 1
            _, last_day_ant = monthrange(year_anterior, mes_anterior)
            from_date_ant = f"{year_anterior}-{mes_anterior:02d}-01"
            to_date_ant = f"{year_anterior}-{mes_anterior:02d}-{last_day_ant}"

            cursor.execute("""
                SELECT
                    COUNT(DISTINCT work_order_id) as total_ots,
                    AVG(duracion_segundos / 86400.0) as tiempo_promedio
                FROM managements
                WHERE work_space_id = 3
                AND management_type_id = 1
                AND mostrar = 1
                AND created_at BETWEEN %s AND %s
            """, (from_date_ant, to_date_ant))
            stats_mes_anterior = cursor.fetchone()

            # Obtener lista de diseñadores para filtro
            cursor.execute("""
                SELECT DISTINCT u.id, CONCAT(u.nombre, ' ', u.apellido) as nombre
                FROM users u
                INNER JOIN managements m ON u.id = m.user_id
                WHERE m.work_space_id = 3
                ORDER BY nombre
            """)
            disenadores = cursor.fetchall()

            nombres_meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

            return {
                'filtros': {
                    'mes': mes,
                    'year': year,
                    'disenadores': [{'id': d['id'], 'nombre': d['nombre']} for d in disenadores]
                },
                'periodo': {
                    'mes_nombre': nombres_meses[mes - 1],
                    'year': year
                },
                'disenadores': items,
                'total_disenadores': len(items),
                'comparacion': {
                    'mes_anterior': {
                        'nombre': nombres_meses[mes_anterior - 1],
                        'total_ots': stats_mes_anterior['total_ots'] or 0,
                        'tiempo_promedio': round(float(stats_mes_anterior['tiempo_promedio'] or 0), 2)
                    }
                }
            }

    finally:
        connection.close()


@router.get("/index")
async def get_reportes_index():
    """
    Vista index de reportes - lista todos los reportes disponibles.

    Fuente Laravel: ReportController@index (líneas 2490-2495)
    """
    return {
        'reportes': [
            {'id': 'ots-por-usuario', 'nombre': 'OTs por Usuario', 'descripcion': 'Distribución de OTs por usuario y área'},
            {'id': 'ots-completadas', 'nombre': 'OTs Completadas', 'descripcion': 'Listado de OTs completadas con tiempos'},
            {'id': 'conversion-ot-entre-fechas', 'nombre': 'Conversión OT Entre Fechas', 'descripcion': 'Conversión de OTs por tipo entre fechas'},
            {'id': 'tiempo-por-area', 'nombre': 'Tiempo por Área', 'descripcion': 'Tiempo promedio por área por mes'},
            {'id': 'carga-mensual', 'nombre': 'Carga Mensual', 'descripcion': 'Carga de OTs por mes'},
            {'id': 'gestion-ots-activas', 'nombre': 'Gestión OTs Activas', 'descripcion': 'Dashboard de OTs activas'},
            {'id': 'ots-activas-por-area', 'nombre': 'OTs Activas por Área', 'descripcion': 'OTs activas con semáforo por área'},
            {'id': 'rechazos-mes', 'nombre': 'Rechazos por Mes', 'descripcion': 'Rechazos agrupados por mes'},
            {'id': 'motivos-rechazo', 'nombre': 'Motivos de Rechazo', 'descripcion': 'Motivos de rechazo agrupados'},
            {'id': 'anulaciones', 'nombre': 'Anulaciones', 'descripcion': 'OTs anuladas'},
            {'id': 'muestras', 'nombre': 'Muestras', 'descripcion': 'Listado de muestras'},
            {'id': 'sala-muestra-completo', 'nombre': 'Sala de Muestras Completo', 'descripcion': 'Reporte completo sala de muestras'},
            {'id': 'indicadores-sala-muestra', 'nombre': 'Indicadores Sala Muestra', 'descripcion': 'KPIs de sala de muestras'},
            {'id': 'tiempo-primera-muestra', 'nombre': 'Tiempo Primera Muestra', 'descripcion': 'Tiempo hasta primera muestra'},
            {'id': 'diseno-estructural-sala', 'nombre': 'Diseño Estructural y Sala', 'descripcion': 'Relación diseño-sala'},
            {'id': 'tiempo-disenador-externo', 'nombre': 'Tiempo Diseñador Externo', 'descripcion': 'Métricas diseñadores'},
            {'id': 'tiempo-disenador-externo-ajuste', 'nombre': 'Tiempo Diseñador Externo (Ajuste)', 'descripcion': 'Métricas diseñadores con ajustes'}
        ]
    }


# =============================================
# ENDPOINTS DE DESCARGA EXCEL
# Fuente Laravel: ReportController líneas 2595-11027
# =============================================

@router.get("/ots-completadas/excel")
async def download_ots_completadas_excel(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    client_id: Optional[int] = None,
):
    """
    Descarga Excel de OTs completadas.

    Fuente Laravel: descargaReporteOT (líneas 2595-2788)
    """
    # Obtener datos usando la función existente
    data = await get_ots_completadas(
        page=1,
        page_size=10000,  # Obtener todos
        date_desde=date_desde,
        date_hasta=date_hasta,
        client_id=client_id
    )

    # Generar Excel
    excel_file = generar_excel_ots_completadas(
        items=[item.dict() for item in data.items],
        resumen=data.resumen,
        titulo=f"OTs Completadas {date_desde or ''} - {date_hasta or ''}"
    )

    filename = f"ots_completadas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/conversion-ot-entre-fechas/excel")
async def download_conversion_ot_excel(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
    vendedor_id: Optional[int] = None,
):
    """
    Descarga Excel de conversión de OTs entre fechas.

    Fuente Laravel: descargaReporteOT (líneas 2595-2788)
    """
    data = await get_conversion_ot_entre_fechas(
        date_desde=date_desde,
        date_hasta=date_hasta,
        vendedor_id=vendedor_id
    )

    excel_file = generar_excel_conversion_ot(
        items=data['items'],
        resumen=data['resumen'],
        date_desde=data['date_desde'],
        date_hasta=data['date_hasta']
    )

    filename = f"conversion_ot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/ots-activas-por-area/excel")
async def download_ots_activas_area_excel(
    area_id: Optional[int] = None,
    vendedor_id: Optional[int] = None,
):
    """
    Descarga Excel de OTs activas por área con semáforo.

    Fuente Laravel: descargaReporteExcel (líneas 3093-3327)
    """
    data = await get_ots_activas_por_area(
        area_id=area_id,
        vendedor_id=vendedor_id
    )

    excel_file = generar_excel_ots_activas_area(
        items=data['items'],
        por_area=data['por_area'],
        semaforo_totales=data['semaforo_totales']
    )

    filename = f"ots_activas_area_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/sala-muestra-completo/excel")
async def download_sala_muestra_excel(
    mes: Optional[int] = None,
    year: Optional[int] = None,
):
    """
    Descarga Excel de sala de muestras.

    Fuente Laravel: descargaReporteSalaMuestra (líneas 10554-10923)
    """
    data = await get_sala_muestra_completo(mes=mes, year=year)

    excel_file = generar_excel_sala_muestra(
        data=data,
        titulo=f"Sala Muestras {data['periodo']['nombre_mes']} {data['periodo']['year']}"
    )

    filename = f"sala_muestras_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/tiempo-primera-muestra/excel")
async def download_tiempo_primera_muestra_excel(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Descarga Excel de tiempo primera muestra.

    Fuente Laravel: descargaReporteTiempoPrimeraMuestra (líneas 10923-11027)
    """
    data = await get_tiempo_primera_muestra(
        page=1,
        page_size=10000,
        date_desde=date_desde,
        date_hasta=date_hasta
    )

    excel_file = generar_excel_tiempo_primera_muestra(
        items=[item.dict() for item in data.items],
        promedio_dias=data.promedio_dias,
        minimo_dias=data.minimo_dias,
        maximo_dias=data.maximo_dias
    )

    filename = f"tiempo_primera_muestra_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/anulaciones/excel")
async def download_anulaciones_excel(
    date_desde: Optional[str] = None,
    date_hasta: Optional[str] = None,
):
    """
    Descarga Excel de anulaciones.
    """
    data = await get_anulaciones(
        page=1,
        page_size=10000,
        date_desde=date_desde,
        date_hasta=date_hasta
    )

    excel_file = generar_excel_anulaciones(
        items=[item.dict() for item in data.items],
        por_mes=data.por_mes
    )

    filename = f"anulaciones_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/rechazos-mes/excel")
async def download_rechazos_excel(
    year: Optional[int] = None,
):
    """
    Descarga Excel de rechazos por mes.
    """
    data = await get_rechazos_mes(year=year)

    excel_file = generar_excel_rechazos(
        items=[item.dict() for item in data.items],
        total_rechazos=data.total_rechazos,
        por_area=data.por_area
    )

    filename = f"rechazos_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
