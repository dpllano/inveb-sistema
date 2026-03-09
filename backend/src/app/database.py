"""
Conexión a base de datos MySQL de Laravel.
Proporciona funciones para conectar con la BD existente de Laravel.
"""
import pymysql
import pymysql.cursors
from typing import Generator
from .config import get_settings

settings = get_settings()


def get_db_connection():
    """
    Crea y retorna una conexión a MySQL de Laravel.
    Uso: conn = get_db_connection(); cursor = conn.cursor()
    Retorna cursor tipo DictCursor por defecto.
    """
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def get_db() -> Generator:
    """
    Dependency para inyección de conexión en endpoints FastAPI.
    Uso: conn = Depends(get_db)
    """
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()


# Alias para compatibilidad con codigo legacy
get_mysql_connection = get_db_connection
