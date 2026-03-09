"""
Middleware de autorización por rol para FastAPI.
Equivalente a CheckRole.php de Laravel.

Sprint G: Corrección de Brechas - FASE 2
Fuente Laravel: app/Http/Middleware/CheckRole.php
"""
from typing import List, Callable
from functools import wraps
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from ..config import get_settings
from ..constants import (
    Roles,
    Areas,
    ROLES_ADMIN,
    ROLES_CREAR_OT,
    ROLES_COTIZADOR,
    ROLES_APROBAR_COTIZACION,
    ROLES_MANTENEDORES_FULL,
    ROLES_REPORTES_ALL,
    get_user_area,
    is_admin,
)

settings = get_settings()
security = HTTPBearer(auto_error=False)


class RoleChecker:
    """
    Verificador de roles para usar como dependencia en FastAPI.
    Equivalente a middleware CheckRole de Laravel.

    Uso:
        @router.post("/crear-ot", dependencies=[Depends(require_roles(Roles.Admin, Roles.Vendedor))])
        async def crear_ot():
            ...
    """

    def __init__(self, allowed_roles: List[int]):
        self.allowed_roles = allowed_roles

    def __call__(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
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
            user = {
                "id": int(payload.get("sub")),
                "nombre": payload.get("nombre", ""),
                "apellido": payload.get("apellido", ""),
                "role_id": payload.get("role_id"),
                "role_nombre": payload.get("role_nombre", ""),
            }

            # Verificar que el rol está permitido
            if user["role_id"] not in self.allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene permisos para realizar esta acción"
                )

            return user

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


def require_roles(*roles: int) -> RoleChecker:
    """
    Factory function para crear un RoleChecker con los roles permitidos.

    Uso:
        # En el router
        @router.post("/crear-ot")
        async def crear_ot(user: dict = Depends(require_roles(Roles.Admin, Roles.Vendedor))):
            ...

        # O como dependency en el decorador
        @router.post("/crear-ot", dependencies=[Depends(require_roles(Roles.Admin, Roles.Vendedor))])
        async def crear_ot():
            ...
    """
    return RoleChecker(list(roles))


def require_admin() -> RoleChecker:
    """Requiere rol Admin o SuperAdministrador."""
    return RoleChecker(ROLES_ADMIN)


def require_crear_ot() -> RoleChecker:
    """Requiere rol para crear OTs."""
    return RoleChecker(ROLES_CREAR_OT)


def require_cotizador() -> RoleChecker:
    """Requiere rol para usar el cotizador."""
    return RoleChecker(ROLES_COTIZADOR)


def require_aprobar_cotizacion() -> RoleChecker:
    """Requiere rol para aprobar cotizaciones."""
    return RoleChecker(ROLES_APROBAR_COTIZACION)


def require_mantenedores() -> RoleChecker:
    """Requiere rol para acceso completo a mantenedores."""
    return RoleChecker(ROLES_MANTENEDORES_FULL)


def require_reportes() -> RoleChecker:
    """Requiere rol para ver todos los reportes."""
    return RoleChecker(ROLES_REPORTES_ALL)


class AreaChecker:
    """
    Verificador de área para filtrar datos según el usuario.
    Usado para que cada área solo vea sus OTs asignadas.
    """

    def __init__(self, allowed_areas: List[int] = None):
        self.allowed_areas = allowed_areas

    def __call__(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
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
            user = {
                "id": int(payload.get("sub")),
                "nombre": payload.get("nombre", ""),
                "apellido": payload.get("apellido", ""),
                "role_id": payload.get("role_id"),
                "role_nombre": payload.get("role_nombre", ""),
                "area_id": get_user_area(payload.get("role_id")),
            }

            # Si hay áreas permitidas específicas, verificar
            if self.allowed_areas and user["area_id"] not in self.allowed_areas:
                # Admin y Gerentes pueden ver todo
                if not is_admin(user["role_id"]):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tiene permisos para acceder a esta área"
                    )

            return user

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


def require_area(*areas: int) -> AreaChecker:
    """
    Requiere que el usuario pertenezca a una de las áreas especificadas.
    Admin y Gerentes pueden acceder a cualquier área.

    Uso:
        @router.get("/ots-desarrollo")
        async def get_ots_desarrollo(user: dict = Depends(require_area(Areas.Desarrollo))):
            ...
    """
    return AreaChecker(list(areas))


# =============================================
# HELPERS PARA FILTRADO DE DATOS
# =============================================

def get_user_filter_query(user: dict, table_alias: str = "wo") -> str:
    """
    Genera parte del query SQL para filtrar según el usuario.
    Fuente: WorkOrderController.php líneas 70-200

    Args:
        user: Dict con datos del usuario (id, role_id, area_id)
        table_alias: Alias de la tabla work_orders en el query

    Returns:
        String con condición WHERE adicional
    """
    role_id = user.get("role_id")
    user_id = user.get("id")

    # Admin y Gerentes ven todo
    if role_id in ROLES_ADMIN or role_id == Roles.Gerente or role_id == Roles.GerenteComercial:
        return "1=1"

    # Jefe de Ventas ve todas las de venta
    if role_id == Roles.JefeVenta:
        return "1=1"  # Puede ver todas

    # Vendedor solo ve las suyas
    if role_id == Roles.Vendedor or role_id == Roles.VendedorExterno:
        return f"{table_alias}.user_id = {user_id}"

    # Desarrollo - ve las asignadas a desarrollo
    if role_id == Roles.JefeDesarrollo or role_id == Roles.Ingeniero:
        if role_id == Roles.JefeDesarrollo:
            return f"({table_alias}.estado_id BETWEEN 2 AND 99)"  # Ve todas de desarrollo
        return f"({table_alias}.asignado_desarrollo_id = {user_id})"

    # Diseño - ve las asignadas a diseño
    if role_id == Roles.JefeDiseño or role_id == Roles.Diseñador:
        if role_id == Roles.JefeDiseño:
            return f"({table_alias}.estado_id BETWEEN 5 AND 99)"
        return f"({table_alias}.asignado_diseno_id = {user_id})"

    # Catalogación
    if role_id == Roles.JefeCatalogador or role_id == Roles.Catalogador:
        if role_id == Roles.JefeCatalogador:
            return f"({table_alias}.estado_id BETWEEN 7 AND 99)"
        return f"({table_alias}.asignado_catalogador_id = {user_id})"

    # Precatalogación
    if role_id == Roles.JefePrecatalogador or role_id == Roles.Precatalogador:
        if role_id == Roles.JefePrecatalogador:
            return f"({table_alias}.estado_id BETWEEN 9 AND 99)"
        return f"({table_alias}.asignado_precatalogador_id = {user_id})"

    # Muestras
    if role_id == Roles.JefeMuestras or role_id == Roles.TecnicoMuestras:
        if role_id == Roles.JefeMuestras:
            return f"({table_alias}.estado_id BETWEEN 11 AND 99)"
        return f"({table_alias}.asignado_muestras_id = {user_id})"

    # Por defecto, no ve nada
    return "1=0"


def filter_vendedor_externo_clients(user: dict) -> List[int]:
    """
    Filtra los clientes que puede ver un VendedorExterno.
    Fuente: WorkOrderController.php líneas 657-661

    VendedorExterno solo puede ver cliente ID=8
    """
    if user.get("role_id") == Roles.VendedorExterno:
        return [8]  # Solo cliente ID=8
    return []  # Sin restricción
