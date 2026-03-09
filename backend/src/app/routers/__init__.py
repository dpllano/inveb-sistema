"""
Routers del microservicio INVEB Envases OT.
Exporta lista de routers para registro en main.py.
"""
from .form_options import router as form_options_router
from .auth import router as auth_router
from .work_orders import router as work_orders_router
from .notifications import router as notifications_router
from .mantenedores import MANTENEDOR_ROUTERS
from .cotizaciones import cotizaciones_router, detalles_router
from .reports import router as reports_router
from .muestras import router as muestras_router
from .exports import router as exports_router
from .pdfs import router as pdfs_router
from .cascades import router as cascades_router
from .bulk_cotizador import router as bulk_cotizador_router
from .mobile import router as mobile_router
from .emails import router as emails_router
from .materials import router as materials_router
from .uploads import router as uploads_router
from .areahc import router as areahc_router
from .fcm import router as fcm_router

# Lista de routers para registrar automaticamente
ROUTERS = [
    auth_router,  # Autenticacion primero
    work_orders_router,  # Dashboard de OTs
    notifications_router,  # Notificaciones de OTs
    reports_router,  # Reportes del dashboard
    exports_router,  # Exportaciones Excel/SAP
    pdfs_router,  # Generación de PDFs
    cascades_router,  # Cascadas AJAX
    form_options_router,
    *MANTENEDOR_ROUTERS,  # Mantenedores (Clientes, Usuarios, etc.)
    cotizaciones_router,  # Módulo de Cotizaciones
    detalles_router,  # Detalles de Cotizaciones
    muestras_router,  # Módulo de Muestras
    bulk_cotizador_router,  # Carga masiva tablas cotizador
    mobile_router,  # API Mobile
    emails_router,  # Sistema de Emails
    materials_router,  # Materiales y CAD
    uploads_router,  # Subida de archivos de diseño
    areahc_router,  # Cálculo Área HC y Cartón
    fcm_router,  # Firebase Cloud Messaging - Sprint M
]

__all__ = [
    "ROUTERS",
    "auth_router",
    "work_orders_router",
    "notifications_router",
    "form_options_router",
    "MANTENEDOR_ROUTERS",
    "cotizaciones_router",
    "detalles_router",
    "muestras_router",
    "exports_router",
    "pdfs_router",
    "cascades_router",
    "bulk_cotizador_router",
    "mobile_router",
    "emails_router",
    "materials_router",
    "uploads_router",
    "areahc_router",
    "fcm_router",
]
