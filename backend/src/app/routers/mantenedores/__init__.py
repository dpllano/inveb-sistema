"""
Routers de Mantenedores - INVEB Cascade Service
CRUD para tablas maestras del sistema.
"""
from .clients import router as clients_router
from .users import router as users_router
from .generic import router as generic_router
from .jerarquias import router as jerarquias_router
from .roles import router as roles_router
from .installations import router as installations_router  # Issue 4: CRUD Instalaciones
from .masivos import router as masivos_router  # Sprint D: Mantenedor Masivo

# Lista de routers de mantenedores
MANTENEDOR_ROUTERS = [
    clients_router,
    users_router,
    generic_router,
    jerarquias_router,
    roles_router,
    installations_router,  # Issue 4: CRUD Instalaciones
    masivos_router,  # Sprint D: Mantenedor Masivo
]

__all__ = [
    "MANTENEDOR_ROUTERS",
    "clients_router",
    "users_router",
    "generic_router",
    "jerarquias_router",
    "roles_router",
    "installations_router",
    "masivos_router",
]
