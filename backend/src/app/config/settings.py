"""
Configuración del microservicio INVEB Envases OT.
Utiliza pydantic-settings para manejo de variables de entorno.
Soporta Railway y Docker con variables de entorno flexibles.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


# Leer variables de entorno directamente (Railway, Docker, o local)
def get_env(names: list, default: str = "") -> str:
    """Busca una variable de entorno en múltiples nombres posibles."""
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    return default


class Settings(BaseSettings):
    """Configuración principal del microservicio."""

    # App
    APP_NAME: str = "INVEB Envases OT API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database MySQL - Lee directamente de variables de entorno
    # Soporta: MYSQL_*, MYSQLHOST, LARAVEL_MYSQL_*, DB_*
    @property
    def LARAVEL_MYSQL_HOST(self) -> str:
        return get_env(['MYSQL_HOST', 'MYSQLHOST', 'LARAVEL_MYSQL_HOST', 'DB_HOST'], '127.0.0.1')

    @property
    def LARAVEL_MYSQL_PORT(self) -> int:
        return int(get_env(['MYSQL_PORT', 'MYSQLPORT', 'LARAVEL_MYSQL_PORT', 'DB_PORT'], '3306'))

    @property
    def LARAVEL_MYSQL_USER(self) -> str:
        return get_env(['MYSQL_USER', 'MYSQLUSER', 'LARAVEL_MYSQL_USER', 'DB_USER'], 'envases')

    @property
    def LARAVEL_MYSQL_PASSWORD(self) -> str:
        return get_env(['MYSQL_PASSWORD', 'MYSQLPASSWORD', 'LARAVEL_MYSQL_PASSWORD', 'DB_PASSWORD'], 'secret')

    @property
    def LARAVEL_MYSQL_DATABASE(self) -> str:
        return get_env(['MYSQL_DATABASE', 'MYSQLDATABASE', 'LARAVEL_MYSQL_DATABASE', 'DB_NAME'], 'envases_ot')

    # JWT Configuration
    JWT_SECRET_KEY: str = "inveb-cascade-service-secret-key-2024"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "https://inveb-frontend-production.up.railway.app",
        "https://inveb-api-production.up.railway.app",
        "https://endearing-wholeness-production-b529.up.railway.app",
        "https://inveb-sistema-production.up.railway.app",
    ]

    # API
    API_PREFIX: str = "/api/v1"

    # Firebase Cloud Messaging - Sprint M
    FCM_API_KEY: str = ""  # Configurar en .env o variable de entorno

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna instancia cacheada de settings."""
    return Settings()
