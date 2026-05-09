"""
Constantes de Roles - INVEB Cascade Service

Catalogo central de roles del sistema, espejando la definicion del frontend
en `frontend/src/contexts/UserContext.tsx`. Eliminar IDs magicos en checks
RBAC del backend (PR Sprint 3 chip 106 Auditoria RBAC).

Fuente de verdad: tabla `roles` BD legacy. Cualquier cambio aqui debe
sincronizarse con el catalogo frontend ROLES.

Uso:
    from app.constants.roles import RoleId, ROLE_NAMES, AREAS, is_admin

    if user.role_id == RoleId.ADMIN:
        ...
    if user.role_id in AREAS["VENTAS"]:
        ...
"""
from enum import IntEnum
from typing import Dict, FrozenSet


class RoleId(IntEnum):
    """IDs de roles definidos en BD legacy.

    Espejo de `frontend/src/contexts/UserContext.tsx` `ROLES`.
    Nota: ID 17 (API) reservado en frontend pero ausente en BD local.
    """

    ADMIN = 1
    GERENTE_GENERAL = 2
    JEFE_VENTAS = 3
    VENDEDOR = 4
    JEFE_DESARROLLO = 5
    INGENIERO = 6
    JEFE_DISENO = 7
    DISENADOR = 8
    JEFE_PRECATALOGADOR = 9
    PRECATALOGADOR = 10
    JEFE_CATALOGADOR = 11
    CATALOGADOR = 12
    JEFE_MUESTRAS = 13
    TECNICO_MUESTRAS = 14
    GERENTE_COMERCIAL = 15
    VISUALIZADOR = 16
    SUPER_ADMIN = 18
    VENDEDOR_EXTERNO = 19


ROLE_NAMES: Dict[int, str] = {
    RoleId.ADMIN: "Administrador",
    RoleId.GERENTE_GENERAL: "Gerente General",
    RoleId.JEFE_VENTAS: "Jefe de Ventas",
    RoleId.VENDEDOR: "Vendedor",
    RoleId.JEFE_DESARROLLO: "Jefe de Desarrollo",
    RoleId.INGENIERO: "Ingeniero",
    RoleId.JEFE_DISENO: "Jefe de Diseno e Impresion",
    RoleId.DISENADOR: "Disenador",
    RoleId.JEFE_PRECATALOGADOR: "Jefe de Precatalogacion",
    RoleId.PRECATALOGADOR: "Precatalogador",
    RoleId.JEFE_CATALOGADOR: "Jefe de Catalogacion",
    RoleId.CATALOGADOR: "Catalogador",
    RoleId.JEFE_MUESTRAS: "Jefe de Muestras",
    RoleId.TECNICO_MUESTRAS: "Tecnico de Muestras",
    RoleId.GERENTE_COMERCIAL: "Gerente Comercial",
    RoleId.VISUALIZADOR: "Visualizador",
    RoleId.SUPER_ADMIN: "Super Administrador",
    RoleId.VENDEDOR_EXTERNO: "Vendedor Externo",
}


# Areas funcionales (espejo frontend AREAS)
AREAS: Dict[str, FrozenSet[int]] = {
    "VENTAS": frozenset({RoleId.JEFE_VENTAS, RoleId.VENDEDOR, RoleId.VENDEDOR_EXTERNO}),
    "DESARROLLO": frozenset({RoleId.JEFE_DESARROLLO, RoleId.INGENIERO}),
    "DISENO": frozenset({RoleId.JEFE_DISENO, RoleId.DISENADOR}),
    "CATALOGO": frozenset({
        RoleId.JEFE_CATALOGADOR, RoleId.CATALOGADOR,
        RoleId.JEFE_PRECATALOGADOR, RoleId.PRECATALOGADOR,
    }),
    "MUESTRAS": frozenset({RoleId.JEFE_MUESTRAS, RoleId.TECNICO_MUESTRAS}),
}

ROLES_JEFES: FrozenSet[int] = frozenset({
    RoleId.JEFE_VENTAS,
    RoleId.JEFE_DESARROLLO,
    RoleId.JEFE_DISENO,
    RoleId.JEFE_PRECATALOGADOR,
    RoleId.JEFE_CATALOGADOR,
    RoleId.JEFE_MUESTRAS,
})

# Roles con privilegio de admin total (acceso irrestricto)
ROLES_ADMIN: FrozenSet[int] = frozenset({
    RoleId.ADMIN,
    RoleId.SUPER_ADMIN,
})


def is_admin(role_id: int) -> bool:
    """True si el rol es Admin o Super Admin."""
    return role_id in ROLES_ADMIN


def is_jefe(role_id: int) -> bool:
    """True si el rol es algun Jefe."""
    return role_id in ROLES_JEFES


def is_in_area(role_id: int, area: str) -> bool:
    """True si el rol pertenece al area funcional."""
    return role_id in AREAS.get(area, frozenset())


def role_name(role_id: int) -> str:
    """Devuelve el nombre del rol o 'Rol N' si desconocido."""
    return ROLE_NAMES.get(role_id, f"Rol {role_id}")
