"""
Servicio de notificaciones dirigidas para cotizaciones.

Origen: BRECHA P0 #4 sub-item C — `users.jefe_id` notificaciones dirigidas.
Doc decisión: aibo/output/inveb-h1/documento/brecha-p0-4-jefe-id-confirmada-codigo.md

LEGACY (NotificarCotizacionesPorAprobacion.php:55-62):
Las notificaciones de cotizaciones pendientes de aprobación se envían SOLO al
jefe asignado (users.jefe_id) del Vendedor que creó la cotización. NO a todos
los Jefes Ventas indistintamente.

CIERRA REGRESIÓN:
Sin este filtro, todos los Jefes Ventas reciben todas las notificaciones de
cotizaciones de cualquier Vendedor (spam masivo + posible fuga de información
entre equipos).

USO TÍPICO:
    from app.services.cotizacion_notifications import (
        get_jefes_para_notificar,
        get_destinatarios_aprobacion_cotizacion,
    )

    # Obtener jefes que deben recibir notificación de N cotizaciones
    jefes_ids = get_jefes_para_notificar(connection, cotizacion_ids)

    # Obtener destinatarios completos (con email) para envío
    destinatarios = get_destinatarios_aprobacion_cotizacion(connection, cotizacion_id)
"""
from typing import List, Dict, Any
import pymysql


# =============================================================================
# OBTENER JEFES ASIGNADOS A LOS CREADORES DE COTIZACIONES
# =============================================================================

def get_jefes_para_notificar(
    connection: pymysql.connections.Connection,
    cotizacion_ids: List[int],
) -> List[int]:
    """
    Retorna IDs únicos de Jefes Ventas (role_id=3) asignados a los creadores
    de las cotizaciones dadas. Solo jefes activos.

    Replica legacy NotificarCotizacionesPorAprobacion.php:55-62.

    Args:
        connection: conexión pymysql activa
        cotizacion_ids: lista de IDs de cotizaciones

    Returns:
        Lista de user_ids únicos de los jefes a notificar (puede estar vacía
        si ninguna cotización tiene Vendedor con jefe asignado, o si el jefe
        no está activo o no es role_id=3).
    """
    if not cotizacion_ids:
        return []

    placeholders = ",".join(["%s"] * len(cotizacion_ids))
    sql = f"""
        SELECT DISTINCT u_jefe.id AS jefe_id
        FROM cotizacions c
        JOIN users u_creador ON u_creador.id = c.user_id
        JOIN users u_jefe ON u_jefe.id = u_creador.jefe_id
        WHERE c.id IN ({placeholders})
          AND u_creador.jefe_id IS NOT NULL
          AND u_jefe.role_id = 3
          AND u_jefe.active = 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, cotizacion_ids)
        rows = cursor.fetchall()
    return [row["jefe_id"] for row in rows if row.get("jefe_id")]


# =============================================================================
# OBTENER DESTINATARIOS COMPLETOS (con email) PARA UNA COTIZACIÓN
# =============================================================================

def get_destinatarios_aprobacion_cotizacion(
    connection: pymysql.connections.Connection,
    cotizacion_id: int,
) -> List[Dict[str, Any]]:
    """
    Retorna los destinatarios (jefe asignado) de una cotización individual,
    incluyendo info para envío de email.

    Args:
        connection: conexión pymysql activa
        cotizacion_id: ID de la cotización

    Returns:
        Lista de dicts con keys: id, nombre, apellido, email, role_id.
        Lista vacía si la cotización no tiene jefe asignado o el jefe no está
        activo / no es role_id=3.
    """
    sql = """
        SELECT
            u_jefe.id, u_jefe.nombre, u_jefe.apellido,
            u_jefe.email, u_jefe.role_id
        FROM cotizacions c
        JOIN users u_creador ON u_creador.id = c.user_id
        JOIN users u_jefe ON u_jefe.id = u_creador.jefe_id
        WHERE c.id = %s
          AND u_creador.jefe_id IS NOT NULL
          AND u_jefe.role_id = 3
          AND u_jefe.active = 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, (cotizacion_id,))
        return list(cursor.fetchall())


# =============================================================================
# VERIFICAR SI UN JEFE DEBE RECIBIR NOTIFICACIÓN DE UNA COTIZACIÓN
# =============================================================================

def jefe_recibe_notificacion_cotizacion(
    connection: pymysql.connections.Connection,
    jefe_user_id: int,
    cotizacion_id: int,
) -> bool:
    """
    Verifica si el usuario jefe_user_id es el jefe asignado del creador
    de la cotización. Útil para validar acciones manuales.

    Args:
        connection: conexión pymysql activa
        jefe_user_id: ID del usuario que se quiere validar como jefe
        cotizacion_id: ID de la cotización

    Returns:
        True si el jefe asignado del creador coincide con jefe_user_id.
    """
    sql = """
        SELECT 1
        FROM cotizacions c
        JOIN users u_creador ON u_creador.id = c.user_id
        WHERE c.id = %s
          AND u_creador.jefe_id = %s
        LIMIT 1
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, (cotizacion_id, jefe_user_id))
        return cursor.fetchone() is not None
