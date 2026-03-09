"""
Router de Notificaciones - INVEB Cascade Service
Gestiona las notificaciones de OT para usuarios.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import pymysql
import jwt

from app.config import get_settings

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])
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


# Schemas
class NotificationItem(BaseModel):
    """Item de notificacion."""
    id: int
    work_order_id: int
    motivo: str
    observacion: Optional[str]
    created_at: str
    generador_nombre: str
    # Datos de la OT
    ot_descripcion: str
    client_name: str
    item_tipo: Optional[str]
    estado: str
    area: Optional[str]
    dias_total: Optional[float]


class NotificationListResponse(BaseModel):
    """Respuesta paginada de notificaciones."""
    items: List[NotificationItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class MarkReadResponse(BaseModel):
    """Respuesta al marcar como leida."""
    id: int
    message: str


class CreateNotificationRequest(BaseModel):
    """Request para crear notificacion."""
    work_order_id: int
    user_id: Optional[int] = None  # Si es None, se envia al creador de la OT
    motivo: str
    observacion: Optional[str] = None


class CreateNotificationResponse(BaseModel):
    """Respuesta al crear notificacion."""
    id: int
    message: str


def get_laravel_connection():
    """Obtiene conexion a MySQL de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
    )


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: int = Depends(get_current_user_id),
):
    """
    Lista notificaciones activas del usuario autenticado.
    Replica la funcionalidad de NotificationController@index.
    """
    offset = (page - 1) * page_size

    try:
        connection = get_laravel_connection()
        with connection.cursor() as cursor:
            # Query para obtener notificaciones con datos de OT
            query = """
                SELECT
                    n.id,
                    n.work_order_id,
                    n.motivo,
                    n.observacion,
                    DATE_FORMAT(n.created_at, '%%Y-%%m-%%d %%H:%%i') as created_at,
                    CONCAT(gen.nombre, ' ', gen.apellido) as generador_nombre,
                    wo.descripcion as ot_descripcion,
                    c.nombre as client_name,
                    pt.descripcion as item_tipo,
                    COALESCE(s.nombre, 'Sin estado') as estado,
                    ws.nombre as area,
                    TIMESTAMPDIFF(DAY, wo.created_at, NOW()) as dias_total
                FROM notifications n
                INNER JOIN work_orders wo ON n.work_order_id = wo.id
                LEFT JOIN users gen ON n.generador_id = gen.id
                LEFT JOIN clients c ON wo.client_id = c.id
                LEFT JOIN product_types pt ON wo.product_type_id = pt.id
                LEFT JOIN (
                    SELECT work_order_id, MAX(id) as max_id
                    FROM managements
                    GROUP BY work_order_id
                ) m_latest ON wo.id = m_latest.work_order_id
                LEFT JOIN managements m ON m_latest.max_id = m.id
                LEFT JOIN states s ON m.state_id = s.id
                LEFT JOIN work_spaces ws ON m.work_space_id = ws.id
                WHERE n.user_id = %s AND n.active = 1
                ORDER BY n.created_at DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (user_id, page_size, offset))
            items = cursor.fetchall()

            # Count total
            count_query = """
                SELECT COUNT(*) as total
                FROM notifications n
                WHERE n.user_id = %s AND n.active = 1
            """
            cursor.execute(count_query, (user_id,))
            total = cursor.fetchone()["total"]

        connection.close()

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return NotificationListResponse(
            items=[NotificationItem(**item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar notificaciones: {str(e)}",
        )


@router.put("/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(
    notification_id: int,
    user_id: int = Depends(get_current_user_id),
):
    """
    Marca una notificacion como leida (inactiva).
    Replica la funcionalidad de NotificationController@inactivarNotificacion.
    """
    try:
        connection = get_laravel_connection()
        with connection.cursor() as cursor:
            # Verificar que la notificacion existe y pertenece al usuario
            cursor.execute(
                "SELECT id, user_id FROM notifications WHERE id = %s",
                (notification_id,)
            )
            notification = cursor.fetchone()

            if not notification:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notificacion no encontrada",
                )

            if notification["user_id"] != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene permiso para modificar esta notificacion",
                )

            # Marcar como inactiva
            cursor.execute(
                "UPDATE notifications SET active = 0, updated_at = NOW() WHERE id = %s",
                (notification_id,)
            )
            connection.commit()

        connection.close()

        return MarkReadResponse(
            id=notification_id,
            message="Notificacion marcada como leida",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al marcar notificacion: {str(e)}",
        )


@router.post("/", response_model=CreateNotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    data: CreateNotificationRequest,
    generador_id: int = Depends(get_current_user_id),
):
    """
    Crea una nueva notificacion para un usuario sobre una OT.
    """
    try:
        connection = get_laravel_connection()
        with connection.cursor() as cursor:
            # Verificar que la OT existe
            cursor.execute(
                "SELECT id, creador_id FROM work_orders WHERE id = %s AND active = 1",
                (data.work_order_id,)
            )
            ot = cursor.fetchone()

            if not ot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Orden de trabajo no encontrada",
                )

            # Si no se especifica usuario, enviar al creador de la OT
            recipient_id = data.user_id if data.user_id else ot["creador_id"]

            # Insertar notificacion
            cursor.execute(
                """
                INSERT INTO notifications (work_order_id, user_id, generador_id, motivo, observacion, active, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
                """,
                (data.work_order_id, recipient_id, generador_id, data.motivo, data.observacion)
            )
            notification_id = cursor.lastrowid
            connection.commit()

        connection.close()

        return CreateNotificationResponse(
            id=notification_id,
            message="Notificacion creada exitosamente",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear notificacion: {str(e)}",
        )


@router.get("/count")
async def get_notification_count(
    user_id: int = Depends(get_current_user_id),
):
    """
    Obtiene el conteo de notificaciones activas del usuario.
    Util para mostrar badge en la UI.
    """
    try:
        connection = get_laravel_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) as count FROM notifications WHERE user_id = %s AND active = 1",
                (user_id,)
            )
            result = cursor.fetchone()

        connection.close()

        return {"count": result["count"]}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener conteo: {str(e)}",
        )
