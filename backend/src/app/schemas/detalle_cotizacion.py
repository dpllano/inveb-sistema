"""
Schemas Pydantic para Detalle de Cotizaciones.
Modelo complejo con 50+ campos para líneas de cotización.
Basado en: PLAN_MIGRACION_COTIZACIONES.md
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


# =============================================
# TIPOS DE DETALLE
# =============================================

class TipoDetalle:
    """Constantes para tipos de detalle"""
    CORRUGADO = 1
    ESQUINERO = 2


# =============================================
# DETALLE COTIZACION - SCHEMAS
# =============================================

class DetalleCotizacionBase(BaseModel):
    """Schema base con campos comunes de detalle"""
    # Campos generales
    tipo_detalle_id: int = Field(..., description="1=Corrugado, 2=Esquinero")
    cantidad: int = Field(..., gt=0)
    product_type_id: int
    numero_colores: Optional[int] = None
    planta_id: int = Field(default=1)
    variable_cotizador_id: Optional[int] = Field(default=1)

    # Dimensiones opcionales
    largo: Optional[int] = None
    ancho: Optional[int] = None
    alto: Optional[int] = None

    # BCT (Box Compression Test)
    bct: Optional[int] = None
    unidad_medida_bct: Optional[int] = None  # 0=Kilo, 1=Libra

    # Código cliente
    codigo_cliente: Optional[int] = None
    subsubhierarchy_id: Optional[int] = None


class DetalleCotizacionCorrugado(BaseModel):
    """Campos específicos para detalles de tipo Corrugado"""
    area_hc: Optional[Decimal] = Field(None)
    anchura: Optional[int] = None
    largura: Optional[int] = None
    carton_id: Optional[int] = None
    impresion: Optional[int] = None
    golpes_largo: Optional[int] = None
    golpes_ancho: Optional[int] = None
    process_id: Optional[int] = None
    cinta_desgarro: Optional[int] = None
    pegado_terminacion: Optional[int] = None
    porcentaje_cera_interno: Optional[int] = None
    porcentaje_cera_externo: Optional[int] = None
    rubro_id: Optional[int] = None
    coverage_type_id: Optional[int] = None
    coverage: Optional[Decimal] = None
    print_type_id: Optional[int] = None
    ink_type_id: Optional[int] = None
    printing_machine_id: Optional[int] = None
    barniz_type_id: Optional[int] = None
    pegado_id: Optional[int] = None


class DetalleCotizacionEsquinero(BaseModel):
    """Campos específicos para detalles de tipo Esquinero"""
    largo_esquinero: Optional[int] = None
    carton_esquinero_id: Optional[int] = None
    funda_esquinero: Optional[int] = None
    tipo_destino_esquinero: Optional[int] = None
    tipo_camion_esquinero: Optional[int] = None


class DetalleCotizacionServicios(BaseModel):
    """Campos de servicios adicionales"""
    matriz: Optional[int] = Field(default=0)
    clisse: Optional[int] = Field(default=0)
    royalty: Optional[int] = Field(default=0)
    maquila: Optional[int] = Field(default=0)
    maquila_servicio_id: Optional[int] = None
    detalle_maquila_servicio_id: Optional[List[int]] = None
    armado_automatico: Optional[int] = Field(default=0)
    armado_usd_caja: Optional[Decimal] = Field(default=0)
    pallet: Optional[int] = Field(default=0)
    zuncho: Optional[int] = None
    funda: Optional[int] = Field(default=0)
    stretch_film: Optional[int] = Field(default=0)
    pallet_height_id: Optional[int] = None


class DetalleCotizacionOffset(BaseModel):
    """Campos para productos offset"""
    ancho_pliego_cartulina: Optional[int] = None
    largo_pliego_cartulina: Optional[int] = None
    precio_pliego_cartulina: Optional[Decimal] = Field(None)
    precio_impresion_pliego: Optional[Decimal] = Field(None)
    gp_emplacado: Optional[int] = None


class DetalleCotizacionMaterial(BaseModel):
    """Campos cuando se carga desde material existente"""
    codigo_material_detalle: Optional[str] = None
    descripcion_material_detalle: Optional[str] = None
    cad_material_detalle: Optional[str] = None
    cad_material_id: Optional[int] = None
    material_id: Optional[int] = None


class DetalleCotizacionComercial(BaseModel):
    """Campos comerciales"""
    ciudad_id: Optional[int] = None
    pallets_apilados: Optional[int] = Field(default=2)
    margen: Optional[Decimal] = Field(None)
    margen_sugerido: Optional[int] = None
    indice_complejidad: Optional[int] = None


class DetalleCotizacionCreateRequest(
    DetalleCotizacionBase,
    DetalleCotizacionCorrugado,
    DetalleCotizacionEsquinero,
    DetalleCotizacionServicios,
    DetalleCotizacionOffset,
    DetalleCotizacionMaterial,
    DetalleCotizacionComercial
):
    """Schema para request de creación de detalle (sin cotizacion_id, viene en URL)"""
    work_order_id: Optional[int] = None


class DetalleCotizacionCreate(
    DetalleCotizacionBase,
    DetalleCotizacionCorrugado,
    DetalleCotizacionEsquinero,
    DetalleCotizacionServicios,
    DetalleCotizacionOffset,
    DetalleCotizacionMaterial,
    DetalleCotizacionComercial
):
    """Schema completo para crear detalle de cotización"""
    cotizacion_id: int
    work_order_id: Optional[int] = None


class DetalleCotizacionUpdate(BaseModel):
    """Schema para actualizar detalle (todos los campos opcionales)"""
    tipo_detalle_id: Optional[int] = None
    cantidad: Optional[int] = None
    product_type_id: Optional[int] = None
    numero_colores: Optional[int] = None
    planta_id: Optional[int] = None

    # Corrugado
    area_hc: Optional[Decimal] = None
    anchura: Optional[int] = None
    largura: Optional[int] = None
    carton_id: Optional[int] = None
    impresion: Optional[int] = None
    golpes_largo: Optional[int] = None
    golpes_ancho: Optional[int] = None
    process_id: Optional[int] = None
    rubro_id: Optional[int] = None
    porcentaje_cera_interno: Optional[int] = None
    porcentaje_cera_externo: Optional[int] = None

    # Esquinero
    largo_esquinero: Optional[int] = None
    carton_esquinero_id: Optional[int] = None

    # Servicios
    matriz: Optional[int] = None
    clisse: Optional[int] = None
    royalty: Optional[int] = None
    maquila: Optional[int] = None
    pallet: Optional[int] = None
    zuncho: Optional[int] = None
    funda: Optional[int] = None
    stretch_film: Optional[int] = None
    armado_automatico: Optional[int] = None

    # Comercial
    ciudad_id: Optional[int] = None
    margen: Optional[Decimal] = None


class DetalleCotizacionResponse(
    DetalleCotizacionBase,
    DetalleCotizacionCorrugado,
    DetalleCotizacionEsquinero,
    DetalleCotizacionServicios,
    DetalleCotizacionOffset,
    DetalleCotizacionMaterial,
    DetalleCotizacionComercial
):
    """Schema de respuesta completo"""
    id: int
    cotizacion_id: int
    work_order_id: Optional[int] = None
    historial_resultados: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Campos calculados/relacionados (opcionales)
    carton_codigo: Optional[str] = None
    proceso_nombre: Optional[str] = None
    rubro_nombre: Optional[str] = None
    planta_nombre: Optional[str] = None

    # Estado del detalle
    ganado: Optional[bool] = None
    perdido: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================
# PRECIOS Y COSTOS CALCULADOS
# =============================================

class CostoComponente(BaseModel):
    """Estructura para un componente de costo"""
    usd_mm2: Decimal = Field(default=0)
    usd_ton: Decimal = Field(default=0)
    usd_caja: Decimal = Field(default=0)


class PreciosCorrugados(BaseModel):
    """Estructura completa de precios para corrugados"""
    # Costos Directos
    costo_papel: CostoComponente
    costo_adhesivo: CostoComponente
    costo_tinta: CostoComponente
    costo_barniz: CostoComponente
    costo_cinta: CostoComponente
    costo_adhesivo_pegado: CostoComponente
    costo_materia_prima: CostoComponente
    costo_directo: CostoComponente

    # Costos Indirectos
    costo_pallet: CostoComponente
    costo_zuncho: CostoComponente
    costo_funda: CostoComponente
    costo_stretch_film: CostoComponente
    costo_materiales_embalaje: CostoComponente
    costo_energia: CostoComponente
    costo_gas_caldera: CostoComponente
    costo_gas_gruas: CostoComponente
    costo_fabricacion: CostoComponente
    costo_clisses: CostoComponente
    costo_matriz: CostoComponente
    costo_materiales_operacion: CostoComponente
    costo_indirecto: CostoComponente

    # Costos de Servicios
    costo_armado: CostoComponente
    costo_maquila: CostoComponente
    costo_servicios: CostoComponente

    # Costos GVV
    costo_flete: CostoComponente
    costo_financiamiento: CostoComponente
    costo_comision: CostoComponente
    costo_gvv: CostoComponente

    # Costos Fijos
    costo_mano_de_obra: CostoComponente
    costo_perdida_productividad: CostoComponente
    costo_perdida_productividad_pegado: CostoComponente
    costo_fijos_planta: CostoComponente
    costo_fijo_total: CostoComponente

    # Otros Costos
    costo_servir_sin_flete: CostoComponente
    costo_administrativos: CostoComponente
    costo_royalty: CostoComponente

    # Totales
    costo_total: CostoComponente
    margen: CostoComponente
    precio_total: CostoComponente
    precio_final: CostoComponente


class PreciosEsquineros(BaseModel):
    """Estructura de precios para esquineros (simplificada)"""
    costo_papel: CostoComponente
    costo_adhesivo: CostoComponente
    costo_fabricacion: CostoComponente
    costo_embalaje: CostoComponente
    costo_flete: CostoComponente
    costo_total: CostoComponente
    margen: CostoComponente
    precio_final: CostoComponente


class DetalleCotizacionConPrecios(DetalleCotizacionResponse):
    """Detalle con precios calculados"""
    precios: Optional[Dict[str, Any]] = None

    # Métricas adicionales
    desperdicio_papel: Optional[Decimal] = None
    merma_corrugadora: Optional[Decimal] = None
    merma_convertidora: Optional[Decimal] = None
    gramaje_carton: Optional[Decimal] = None
    precio_dolar: Optional[Decimal] = None


# =============================================
# CALCULOS Y REQUESTS
# =============================================

class CalcularDetalleRequest(BaseModel):
    """Request para calcular precios de un detalle"""
    detalle_id: Optional[int] = None  # Si es detalle existente
    # O datos para calcular sin guardar:
    tipo_detalle_id: Optional[int] = None
    cantidad: Optional[int] = None
    area_hc: Optional[Decimal] = None
    anchura: Optional[int] = None
    largura: Optional[int] = None
    carton_id: Optional[int] = None
    process_id: Optional[int] = None
    rubro_id: Optional[int] = None
    planta_id: Optional[int] = None
    # ... más campos según necesidad


class CalcularDetalleResponse(BaseModel):
    """Respuesta del cálculo de precios"""
    success: bool
    precios: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    warnings: Optional[List[str]] = None


class MarcarGanadoPerdidoRequest(BaseModel):
    """Request para marcar detalle como ganado/perdido"""
    detalle_id: int
    estado: str = Field(..., pattern="^(ganado|perdido|ninguno)$")
    observacion: Optional[str] = None


class CargaMasivaDetallesRequest(BaseModel):
    """Request para carga masiva de detalles"""
    cotizacion_id: int
    detalles: List[DetalleCotizacionCreate]


class CargaMasivaDetallesResponse(BaseModel):
    """Respuesta de carga masiva"""
    success: bool
    total_procesados: int
    total_exitosos: int
    total_errores: int
    errores: List[Dict[str, Any]] = Field(default_factory=list)


# =============================================
# INDICE DE COMPLEJIDAD
# =============================================

class IndiceComplejidadRequest(BaseModel):
    """Request para calcular índice de complejidad"""
    detalle_id: Optional[int] = None
    # O datos directos:
    numero_colores: Optional[int] = None
    tiene_matriz: Optional[bool] = None
    tiene_clisse: Optional[bool] = None
    proceso_id: Optional[int] = None
    # ... más factores


class IndiceComplejidadResponse(BaseModel):
    """Respuesta del cálculo de índice"""
    indice_complejidad: int
    factores: Dict[str, int]  # Desglose de factores
    margen_sugerido: Optional[Decimal] = None
