"""
Schemas Pydantic para el módulo de Cotizaciones.
Basado en: PLAN_MIGRACION_COTIZACIONES.md
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from decimal import Decimal


# =============================================
# ESTADOS DE COTIZACION
# =============================================

class CotizacionEstadoBase(BaseModel):
    """Schema base para estados de cotización"""
    nombre: str


class CotizacionEstadoResponse(CotizacionEstadoBase):
    """Estado de cotización con ID"""
    id: int

    model_config = ConfigDict(from_attributes=True)


# =============================================
# COTIZACION - SCHEMAS PRINCIPALES
# =============================================

class CotizacionBase(BaseModel):
    """Schema base con campos comunes de cotización"""
    client_id: int = Field(..., description="ID del cliente")
    nombre_contacto: Optional[str] = Field(None, max_length=255)
    email_contacto: Optional[EmailStr] = Field(None, max_length=191)
    telefono_contacto: Optional[str] = Field(None, max_length=12)
    moneda_id: Optional[int] = None
    dias_pago: Optional[int] = None
    comision: Optional[int] = Field(default=0)
    observacion_interna: Optional[str] = Field(None, max_length=255)
    observacion_cliente: Optional[str] = Field(None, max_length=255)


class CotizacionCreate(CotizacionBase):
    """Schema para crear cotización"""
    user_id: int = Field(..., description="ID del usuario creador")


class CotizacionUpdate(BaseModel):
    """Schema para actualizar cotización (campos opcionales)"""
    client_id: Optional[int] = None
    nombre_contacto: Optional[str] = None
    email_contacto: Optional[EmailStr] = None
    telefono_contacto: Optional[str] = None
    moneda_id: Optional[int] = None
    dias_pago: Optional[int] = None
    comision: Optional[int] = None
    observacion_interna: Optional[str] = None
    observacion_cliente: Optional[str] = None


class CotizacionResponse(CotizacionBase):
    """Schema de respuesta con todos los campos"""
    id: int
    user_id: int
    estado_id: int = Field(default=1)
    role_can_show: Optional[int] = None
    nivel_aprobacion: Optional[int] = None
    previous_version_id: Optional[int] = None
    original_version_id: Optional[int] = None
    version_number: Optional[int] = None
    active: int = Field(default=1)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Relaciones expandidas (opcionales)
    estado: Optional[CotizacionEstadoResponse] = None
    cliente_nombre: Optional[str] = None
    usuario_nombre: Optional[str] = None
    total_detalles: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CotizacionListResponse(BaseModel):
    """Schema para listado paginado de cotizaciones"""
    items: List[CotizacionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CotizacionConDetalles(CotizacionResponse):
    """Cotización con sus detalles incluidos"""
    detalles: List[Any] = Field(default_factory=list)  # DetalleCotizacionResponse
    detalles_ganados_count: int = 0
    detalles_perdidos_count: int = 0


# =============================================
# FILTROS DE BUSQUEDA
# =============================================

class CotizacionFilters(BaseModel):
    """Filtros para búsqueda de cotizaciones"""
    estado_id: Optional[List[int]] = None
    client_id: Optional[List[int]] = None
    user_id: Optional[int] = None
    cotizacion_id: Optional[int] = None
    work_order_id: Optional[List[int]] = None
    cad_material_id: Optional[List[int]] = None
    date_desde: Optional[str] = None  # formato dd/mm/yyyy
    date_hasta: Optional[str] = None  # formato dd/mm/yyyy
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# =============================================
# APROBACION DE COTIZACIONES
# =============================================

class CotizacionApprovalBase(BaseModel):
    """Schema base para aprobaciones"""
    motivo: Optional[str] = Field(None, max_length=500)
    action_made: str = Field(..., description="Acción realizada: aprobar, rechazar")


class CotizacionApprovalCreate(CotizacionApprovalBase):
    """Schema para crear registro de aprobación"""
    cotizacion_id: int
    user_id: int
    role_do_action: int


class CotizacionApprovalResponse(CotizacionApprovalBase):
    """Schema de respuesta de aprobación"""
    id: int
    cotizacion_id: int
    user_id: int
    role_do_action: int
    created_at: Optional[datetime] = None
    usuario_nombre: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SolicitarAprobacionRequest(BaseModel):
    """Request para solicitar aprobación"""
    cotizacion_id: int
    observacion: Optional[str] = None


class GestionarAprobacionRequest(BaseModel):
    """Request para gestionar (aprobar/rechazar) cotización"""
    action: str = Field(..., pattern="^(aprobar|rechazar)$")
    motivo: Optional[str] = None


# =============================================
# VERSIONAMIENTO
# =============================================

class VersionarCotizacionRequest(BaseModel):
    """Request para crear nueva versión de cotización"""
    cotizacion_id: int
    observacion: Optional[str] = None


class DuplicarCotizacionRequest(BaseModel):
    """Request para duplicar cotización"""
    cotizacion_id: int
    nuevo_client_id: Optional[int] = None  # Si quiere asignar a otro cliente


class RetomarCotizacionRequest(BaseModel):
    """Request para retomar cotización rechazada"""
    cotizacion_id: int


# =============================================
# RESUMEN Y ESTADISTICAS
# =============================================

class CotizacionResumen(BaseModel):
    """Resumen de cotización para listados"""
    id: int
    client_id: int
    cliente_nombre: str
    estado_id: int
    estado_nombre: str
    total_detalles: int
    total_ganados: int
    total_perdidos: int
    valor_total_usd: Optional[Decimal] = None
    created_at: datetime
    version_number: Optional[int] = None


class EstadisticasCotizaciones(BaseModel):
    """Estadísticas del módulo de cotizaciones"""
    total_cotizaciones: int
    por_estado: dict  # {estado_id: count}
    total_ganados: int
    total_perdidos: int
    valor_total_ganados_usd: Decimal
    promedio_margen: Decimal
