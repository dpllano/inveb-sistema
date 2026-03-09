"""
Configuración del microservicio INVEB Envases OT.
Utiliza pydantic-settings para manejo de variables de entorno.
Soporta Railway y Docker con variables de entorno flexibles.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Configuración principal del microservicio."""

    # App
    APP_NAME: str = "INVEB Envases OT API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database MySQL - Soporta múltiples nombres de variables
    # Railway usa: MYSQL_HOST, MYSQL_PORT, etc.
    # Docker/Local usa: LARAVEL_MYSQL_HOST, etc.
    LARAVEL_MYSQL_HOST: str = "127.0.0.1"
    LARAVEL_MYSQL_PORT: int = 3306
    LARAVEL_MYSQL_USER: str = "envases"
    LARAVEL_MYSQL_PASSWORD: str = "secret"
    LARAVEL_MYSQL_DATABASE: str = "envases_ot"

    @field_validator('LARAVEL_MYSQL_HOST', mode='before')
    @classmethod
    def get_mysql_host(cls, v):
        # Railway usa MYSQL_HOST o MYSQLHOST
        return os.environ.get('MYSQL_HOST') or os.environ.get('MYSQLHOST') or os.environ.get('DB_HOST') or v

    @field_validator('LARAVEL_MYSQL_PORT', mode='before')
    @classmethod
    def get_mysql_port(cls, v):
        port = os.environ.get('MYSQL_PORT') or os.environ.get('MYSQLPORT') or os.environ.get('DB_PORT') or v
        return int(port) if port else 3306

    @field_validator('LARAVEL_MYSQL_USER', mode='before')
    @classmethod
    def get_mysql_user(cls, v):
        return os.environ.get('MYSQL_USER') or os.environ.get('MYSQLUSER') or os.environ.get('DB_USER') or v

    @field_validator('LARAVEL_MYSQL_PASSWORD', mode='before')
    @classmethod
    def get_mysql_password(cls, v):
        return os.environ.get('MYSQL_PASSWORD') or os.environ.get('MYSQLPASSWORD') or os.environ.get('DB_PASSWORD') or v

    @field_validator('LARAVEL_MYSQL_DATABASE', mode='before')
    @classmethod
    def get_mysql_database(cls, v):
        return os.environ.get('MYSQL_DATABASE') or os.environ.get('MYSQLDATABASE') or os.environ.get('DB_NAME') or v

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
