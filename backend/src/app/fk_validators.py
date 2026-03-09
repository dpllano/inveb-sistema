"""
Validadores de Foreign Keys para INVEB
Sprint I: Validaciones Backend - Tarea I.4

Valida que los IDs de entidades relacionadas existan en la BD antes de insertar.
"""
from typing import Optional, List
from fastapi import HTTPException, status
import pymysql

from app.config import get_settings

settings = get_settings()


def get_mysql_connection():
    """Obtiene conexión a MySQL."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        cursorclass=pymysql.cursors.DictCursor,
        charset='utf8mb4'
    )


def validate_fk_exists(
    table: str,
    id_value: int,
    id_column: str = "id",
    active_check: bool = True,
    raise_exception: bool = True
) -> bool:
    """
    Valida que un ID exista en una tabla.

    Args:
        table: Nombre de la tabla
        id_value: ID a validar
        id_column: Nombre de la columna ID (default: "id")
        active_check: Si True, también verifica que active=1
        raise_exception: Si True, lanza HTTPException si no existe

    Returns:
        True si existe, False si no

    Raises:
        HTTPException: Si raise_exception=True y el ID no existe
    """
    if id_value is None:
        return True  # FK opcional, None es válido

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            if active_check:
                query = f"SELECT 1 FROM {table} WHERE {id_column} = %s AND active = 1 LIMIT 1"
            else:
                query = f"SELECT 1 FROM {table} WHERE {id_column} = %s LIMIT 1"

            cursor.execute(query, (id_value,))
            result = cursor.fetchone()

            if result:
                return True

            if raise_exception:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"El {id_column}={id_value} no existe o no está activo en la tabla {table}"
                )
            return False

    finally:
        connection.close()


def validate_client_exists(client_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que un cliente exista y esté activo.

    Args:
        client_id: ID del cliente
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe y está activo
    """
    if client_id is None:
        return True

    return validate_fk_exists(
        table="clients",
        id_value=client_id,
        id_column="id",
        active_check=True,
        raise_exception=raise_exception
    )


def validate_user_exists(user_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que un usuario exista y esté activo.

    Args:
        user_id: ID del usuario
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe y está activo
    """
    if user_id is None:
        return True

    return validate_fk_exists(
        table="users",
        id_value=user_id,
        id_column="id",
        active_check=True,
        raise_exception=raise_exception
    )


def validate_role_exists(role_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que un rol exista.

    Args:
        role_id: ID del rol
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe
    """
    if role_id is None:
        return True

    return validate_fk_exists(
        table="roles",
        id_value=role_id,
        id_column="id",
        active_check=False,  # roles no tienen campo active
        raise_exception=raise_exception
    )


def validate_installation_exists(installation_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que una instalación exista y esté activa.

    Args:
        installation_id: ID de la instalación
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe y está activa
    """
    if installation_id is None:
        return True

    return validate_fk_exists(
        table="instalaciones",
        id_value=installation_id,
        id_column="id",
        active_check=True,
        raise_exception=raise_exception
    )


def validate_cotizacion_exists(cotizacion_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que una cotización exista.

    Args:
        cotizacion_id: ID de la cotización
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe
    """
    if cotizacion_id is None:
        return True

    return validate_fk_exists(
        table="cotizaciones",
        id_value=cotizacion_id,
        id_column="id",
        active_check=False,  # cotizaciones no tienen campo active
        raise_exception=raise_exception
    )


def validate_work_order_exists(work_order_id: Optional[int], raise_exception: bool = True) -> bool:
    """
    Valida que una OT exista.

    Args:
        work_order_id: ID de la OT
        raise_exception: Si lanza excepción cuando no existe

    Returns:
        True si existe
    """
    if work_order_id is None:
        return True

    return validate_fk_exists(
        table="work_orders",
        id_value=work_order_id,
        id_column="id",
        active_check=False,  # work_orders no tienen campo active
        raise_exception=raise_exception
    )


def validate_multiple_fks(
    validations: List[tuple],
    raise_exception: bool = True
) -> dict:
    """
    Valida múltiples FKs en una sola llamada.

    Args:
        validations: Lista de tuplas (table, id_value, id_column, active_check)
        raise_exception: Si lanza excepción cuando alguno no existe

    Returns:
        Dict con resultados {table: bool}

    Example:
        validate_multiple_fks([
            ("clients", 123, "id", True),
            ("users", 456, "id", True),
        ])
    """
    results = {}
    errors = []

    connection = get_mysql_connection()
    try:
        with connection.cursor() as cursor:
            for validation in validations:
                table, id_value, id_column, active_check = validation

                if id_value is None:
                    results[table] = True
                    continue

                if active_check:
                    query = f"SELECT 1 FROM {table} WHERE {id_column} = %s AND active = 1 LIMIT 1"
                else:
                    query = f"SELECT 1 FROM {table} WHERE {id_column} = %s LIMIT 1"

                cursor.execute(query, (id_value,))
                result = cursor.fetchone()

                if result:
                    results[table] = True
                else:
                    results[table] = False
                    errors.append(f"{table}.{id_column}={id_value}")

        if raise_exception and errors:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Los siguientes IDs no existen o no están activos: {', '.join(errors)}"
            )

        return results

    finally:
        connection.close()
