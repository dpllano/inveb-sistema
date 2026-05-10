"""
RBAC Dependencies - INVEB Cascade Service

Dependencies reutilizables de FastAPI para implementar control RBAC server-side
en endpoints destructivos (Sprint 3.5 Opcion C - chip 106).

Solo se usa en endpoints donde el blast radius justifica defensa en profundidad
(DELETE cotizaciones/work-orders, gestion aprobacion, CRUD users/roles).

Uso:
    from app.dependencies.rbac import require_role
    from app.roles_catalog import RoleId

    @router.delete(
        "/{id}",
        dependencies=[Depends(require_role([RoleId.ADMIN, RoleId.SUPER_ADMIN, RoleId.JEFE_VENTAS]))],
    )
    async def delete_cotizacion(...):
        ...
"""
from typing import Iterable, Set

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import get_settings
from app.roles_catalog import ROLES_ADMIN, role_name

import jwt

settings = get_settings()
security = HTTPBearer(auto_error=False)


def require_role(allowed_role_ids: Iterable[int]):
    """
    Crea una FastAPI dependency que valida que el rol del JWT este en allowed_role_ids.

    El admin/super-admin (ROLES_ADMIN) se considera autorizado SIEMPRE, sin importar
    si esta en la lista (acceso irrestricto por convencion del proyecto).

    Args:
        allowed_role_ids: iterable de ints (role_id) o RoleId enum permitidos.
            Ej: [RoleId.ADMIN, RoleId.JEFE_VENTAS] o {1, 3, 18}

    Returns:
        FastAPI dependency callable.

    Raises:
        HTTPException 401 si no hay token, token invalido, o token expirado.
        HTTPException 403 si el rol no esta autorizado.
    """
    # Normalizar a set de ints (acepta IntEnum)
    allowed: Set[int] = {int(r) for r in allowed_role_ids}
    # Admin siempre permitido (defense in depth no debe bloquear admin)
    allowed |= {int(r) for r in ROLES_ADMIN}

    async def _check(credentials: HTTPAuthorizationCredentials = Depends(security)):
        if not credentials:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")
        try:
            payload = jwt.decode(
                credentials.credentials,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido")

        role_id = payload.get("role_id")
        if role_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token sin role_id")

        if int(role_id) not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rol '{role_name(int(role_id))}' (id={role_id}) no autorizado para esta accion",
            )

    return _check
