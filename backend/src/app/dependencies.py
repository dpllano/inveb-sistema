"""
Dependencias compartidas para inyección en endpoints FastAPI.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from .config import get_settings

settings = get_settings()
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extrae información del usuario actual del token JWT.
    Retorna dict con id, nombre, apellido, role_id, etc.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no proporcionado"
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {
            "id": int(payload.get("sub")),
            "nombre": payload.get("nombre", ""),
            "apellido": payload.get("apellido", ""),
            "role_id": payload.get("role_id"),
            "role_nombre": payload.get("role_nombre", ""),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Extrae solo el user_id del token JWT.
    """
    user = get_current_user(credentials)
    return user["id"]


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """
    Extrae información del usuario si hay token, retorna None si no hay.
    Útil para endpoints que pueden funcionar con o sin autenticación.
    """
    if not credentials:
        return None

    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
