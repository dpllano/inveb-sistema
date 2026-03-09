"""
Routers del módulo de Cotizaciones.
"""
from .router import router as cotizaciones_router
from .detalles import router as detalles_router

__all__ = [
    "cotizaciones_router",
    "detalles_router",
]
