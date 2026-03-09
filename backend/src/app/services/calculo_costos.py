"""
Servicio de Cálculo de Costos para Cotizaciones.
Portado desde Laravel: DetalleCotizacion.php (4594 líneas)

Este servicio implementa las fórmulas de costeo para:
- Cajas corrugadas (preciosCorrugados)
- Esquineros de cartón (preciosEsquineros)

Estructura de costos:
1. Costos Directos (Materia Prima)
2. Costos Indirectos (Embalaje, Fabricación, Operación)
3. Costos de Servicios (Armado, Maquila)
4. Costos GVV (Flete, Financiamiento, Comisión)
5. Costos Fijos (Mano de obra, Productividad)
6. Costos Administrativos y de Servir

Basado en: PLAN_MIGRACION_COTIZACIONES.md
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


# =============================================
# ESTRUCTURAS DE DATOS
# =============================================

@dataclass
class CostoUnidades:
    """Estructura para almacenar costo en diferentes unidades"""
    usd_mm2: Decimal = Decimal("0")   # USD por mil metros cuadrados
    usd_ton: Decimal = Decimal("0")   # USD por tonelada
    usd_caja: Decimal = Decimal("0")  # USD por unidad/caja

    def to_dict(self) -> Dict[str, float]:
        return {
            "usd_mm2": float(self.usd_mm2),
            "usd_ton": float(self.usd_ton),
            "usd_caja": float(self.usd_caja),
        }


@dataclass
class DatosDetalle:
    """Datos del detalle necesarios para cálculos"""
    # Identificadores
    id: Optional[int] = None
    cotizacion_id: Optional[int] = None
    tipo_detalle_id: int = 1  # 1=Corrugado, 2=Esquinero

    # Dimensiones y cantidades
    cantidad: int = 0
    area_hc: Decimal = Decimal("0")
    anchura: int = 0
    largura: int = 0
    largo: int = 0
    ancho: int = 0
    alto: int = 0
    golpes_largo: int = 0
    golpes_ancho: int = 0

    # Referencias
    carton_id: Optional[int] = None
    carton_esquinero_id: Optional[int] = None
    process_id: Optional[int] = None
    rubro_id: Optional[int] = None
    planta_id: int = 1
    ciudad_id: Optional[int] = None
    variable_cotizador_id: int = 1

    # Impresión y acabados
    impresion: int = 0
    numero_colores: int = 0
    porcentaje_cera_interno: int = 0
    porcentaje_cera_externo: int = 0
    coverage_type_id: Optional[int] = None
    coverage: Decimal = Decimal("0")
    cobertura_color_percent: Decimal = Decimal("0")  # Porcentaje cobertura tinta
    cobertura_barniz_cm2: Decimal = Decimal("0")  # Área de cobertura barniz
    printing_machine_id: Optional[int] = None  # 1=Sin, 2=Normal, 3=Interna, 4=AltaGrafica, 5=DongFang
    print_type_id: Optional[int] = None  # Tipo de impresión
    ink_type_id: Optional[int] = None  # Tipo de tinta
    barniz_type_id: Optional[int] = None  # 1=UV, 2=Acuoso, 3=Hidrorepelente
    cinta_desgarro: int = 0  # Si lleva cinta de desgarro

    # Servicios
    matriz: int = 0
    clisse: int = 0
    royalty: int = 0
    maquila: int = 0
    maquila_servicio_id: Optional[int] = None
    armado_automatico: int = 0
    armado_usd_caja: Decimal = Decimal("0")
    pallet: int = 0
    zuncho: int = 0
    funda: int = 0
    stretch_film: int = 0
    pallet_height_id: Optional[int] = None

    # Comercial
    margen: Decimal = Decimal("0")
    pallets_apilados: int = 2

    # Esquineros
    largo_esquinero: int = 0
    tipo_destino_esquinero: Optional[int] = None
    tipo_camion_esquinero: Optional[int] = None


@dataclass
class DatosRelacionados:
    """Datos de tablas relacionadas para cálculos"""
    # Planta
    planta_nombre: str = ""
    ancho_corrugadora: int = 0
    trim_corrugadora: int = 0
    formatos_bobina: List[int] = field(default_factory=list)
    porcentaje_merma_corrugadora: Decimal = Decimal("0")
    merma_cera: Decimal = Decimal("0")

    # Cartón
    carton_codigo: str = ""
    carton_tipo: str = ""  # POWER PLY, DOBLE MONOTAPA, etc.
    gramaje_carton: Decimal = Decimal("0")
    costo_carton_papeles: Decimal = Decimal("0")
    costo_carton_adhesivos: Decimal = Decimal("0")

    # Factores
    factor_onda: Decimal = Decimal("1")
    factor_desarrollo: Decimal = Decimal("1")

    # Consumos adhesivo
    consumo_adhesivo: Decimal = Decimal("0")
    consumo_energia_kwh: Decimal = Decimal("0")
    consumo_adhesivo_pegado_gr_caja: Decimal = Decimal("0")
    precio_adhesivo_powerply: Decimal = Decimal("0")
    porcentaje_merma_convertidora_adhesivo_pegado: Decimal = Decimal("0")

    # Tinta
    costo_tinta_usd_gr: Decimal = Decimal("0")
    consumo_tinta_gr_x_Mm2: Decimal = Decimal("0")
    costo_tinta_usd_gr_alta_grafica_metalizada: Decimal = Decimal("0")
    costo_tinta_usd_gr_alta_grafica_otras: Decimal = Decimal("0")
    consumo_tinta_usd_gr_alta_grafica_otras: Decimal = Decimal("0")
    consumo_tinta_usd_gr_alta_grafica_metalizado: Decimal = Decimal("0")

    # Barniz
    costo_barniz_usd_gr: Decimal = Decimal("0")
    consumo_barniz_gr_x_Mm2: Decimal = Decimal("0")
    costo_barniz_uv_usd_gr: Decimal = Decimal("0")
    consumo_barniz_uv_gr_x_Mm2: Decimal = Decimal("0")
    costo_barniz_acuoso_usd_gr: Decimal = Decimal("0")
    consumo_barniz_acuoso_gr_x_Mm2: Decimal = Decimal("0")

    # Cinta desgarro
    costo_cinta_usd_m: Decimal = Decimal("0")
    consumo_cinta_m_x_caja: Decimal = Decimal("0")

    # Mermas
    merma_convertidora: Decimal = Decimal("0")

    # Rubro
    rubro_codigo: str = ""

    # Variables cotizador
    precio_dolar: Decimal = Decimal("1")
    iva: Decimal = Decimal("0.19")
    tasa_mensual_credito: Decimal = Decimal("0")
    dias_financiamiento: int = 0
    comision_venta: Decimal = Decimal("0")

    # Flete
    costo_flete_pallet: Decimal = Decimal("0")
    cajas_por_pallet: int = 0

    # Energía y Gas
    costo_energia_usd_kwh: Decimal = Decimal("0")
    consumo_energia_kwh_x_Mm2: Decimal = Decimal("0")
    costo_gas_caldera_usd_m3: Decimal = Decimal("0")
    consumo_gas_caldera_m3_x_Mm2: Decimal = Decimal("0")
    costo_gas_gruas_usd_m3: Decimal = Decimal("0")
    consumo_gas_gruas_m3_x_Mm2: Decimal = Decimal("0")

    # Servicios
    costo_maquila_caja: Decimal = Decimal("0")
    costo_clisse_clp_cm2: Decimal = Decimal("0")
    costo_matriz_clp_unidad: Decimal = Decimal("0")

    # Embalaje
    costo_pallet_usd_unidad: Decimal = Decimal("0")
    costo_zuncho_usd_m: Decimal = Decimal("0")
    consumo_zuncho_m_x_pallet: Decimal = Decimal("0")
    costo_funda_usd_unidad: Decimal = Decimal("0")
    costo_stretch_usd_m: Decimal = Decimal("0")
    consumo_stretch_m_x_pallet: Decimal = Decimal("0")

    # Tarifario
    mg_ebitda: Decimal = Decimal("0")

    # Mano de obra y productividad
    costo_mano_obra_usd_mm2: Decimal = Decimal("0")
    costo_perdida_productividad_usd_mm2: Decimal = Decimal("0")
    costo_fijos_planta_usd_mm2: Decimal = Decimal("0")
    costo_administrativos_usd_mm2: Decimal = Decimal("0")


@dataclass
class ResultadoPrecios:
    """Resultado completo de cálculo de precios"""
    # Costos Directos
    costo_papel: CostoUnidades = field(default_factory=CostoUnidades)
    costo_adhesivo: CostoUnidades = field(default_factory=CostoUnidades)
    costo_tinta: CostoUnidades = field(default_factory=CostoUnidades)
    costo_barniz: CostoUnidades = field(default_factory=CostoUnidades)
    costo_cinta: CostoUnidades = field(default_factory=CostoUnidades)
    costo_adhesivo_pegado: CostoUnidades = field(default_factory=CostoUnidades)
    costo_materia_prima: CostoUnidades = field(default_factory=CostoUnidades)
    costo_directo: CostoUnidades = field(default_factory=CostoUnidades)

    # Costos Indirectos
    costo_pallet: CostoUnidades = field(default_factory=CostoUnidades)
    costo_zuncho: CostoUnidades = field(default_factory=CostoUnidades)
    costo_funda: CostoUnidades = field(default_factory=CostoUnidades)
    costo_stretch_film: CostoUnidades = field(default_factory=CostoUnidades)
    costo_materiales_embalaje: CostoUnidades = field(default_factory=CostoUnidades)
    costo_energia: CostoUnidades = field(default_factory=CostoUnidades)
    costo_gas_caldera: CostoUnidades = field(default_factory=CostoUnidades)
    costo_gas_gruas: CostoUnidades = field(default_factory=CostoUnidades)
    costo_fabricacion: CostoUnidades = field(default_factory=CostoUnidades)
    costo_clisses: CostoUnidades = field(default_factory=CostoUnidades)
    costo_matriz: CostoUnidades = field(default_factory=CostoUnidades)
    costo_materiales_operacion: CostoUnidades = field(default_factory=CostoUnidades)
    costo_indirecto: CostoUnidades = field(default_factory=CostoUnidades)

    # Costos de Servicios
    costo_armado: CostoUnidades = field(default_factory=CostoUnidades)
    costo_maquila: CostoUnidades = field(default_factory=CostoUnidades)
    costo_servicios: CostoUnidades = field(default_factory=CostoUnidades)

    # Costos GVV
    costo_flete: CostoUnidades = field(default_factory=CostoUnidades)
    costo_financiamiento: CostoUnidades = field(default_factory=CostoUnidades)
    costo_comision: CostoUnidades = field(default_factory=CostoUnidades)
    costo_gvv: CostoUnidades = field(default_factory=CostoUnidades)

    # Costos Fijos
    costo_mano_de_obra: CostoUnidades = field(default_factory=CostoUnidades)
    costo_perdida_productividad: CostoUnidades = field(default_factory=CostoUnidades)
    costo_perdida_productividad_pegado: CostoUnidades = field(default_factory=CostoUnidades)
    costo_fijos_planta: CostoUnidades = field(default_factory=CostoUnidades)
    costo_fijo_total: CostoUnidades = field(default_factory=CostoUnidades)

    # Otros
    costo_servir_sin_flete: CostoUnidades = field(default_factory=CostoUnidades)
    costo_administrativos: CostoUnidades = field(default_factory=CostoUnidades)
    costo_royalty: CostoUnidades = field(default_factory=CostoUnidades)

    # Totales
    costo_total: CostoUnidades = field(default_factory=CostoUnidades)
    margen: CostoUnidades = field(default_factory=CostoUnidades)
    precio_total: CostoUnidades = field(default_factory=CostoUnidades)
    precio_final: CostoUnidades = field(default_factory=CostoUnidades)

    def to_dict(self) -> Dict[str, Any]:
        """Convierte a diccionario para serialización"""
        result = {}
        for key, value in self.__dict__.items():
            if isinstance(value, CostoUnidades):
                result[key] = value.to_dict()
            else:
                result[key] = value
        return result


# =============================================
# SERVICIO PRINCIPAL DE CÁLCULO
# =============================================

class CalculoCostosService:
    """
    Servicio para calcular costos de cotizaciones.

    Uso:
        service = CalculoCostosService(connection)
        precios = service.calcular_precios(detalle_data, datos_relacionados)
    """

    def __init__(self, db_connection=None):
        """
        Inicializa el servicio de cálculo.

        Args:
            db_connection: Conexión a base de datos para consultas
        """
        self.conn = db_connection

    # =============================================
    # MÉTODOS PRINCIPALES
    # =============================================

    def calcular_precios(
        self,
        detalle: DatosDetalle,
        datos: DatosRelacionados
    ) -> ResultadoPrecios:
        """
        Calcula todos los precios para un detalle de cotización.

        Args:
            detalle: Datos del detalle
            datos: Datos de tablas relacionadas

        Returns:
            ResultadoPrecios con todos los costos calculados
        """
        if detalle.tipo_detalle_id == 1:
            return self._precios_corrugados(detalle, datos)
        elif detalle.tipo_detalle_id == 2:
            return self._precios_esquineros(detalle, datos)
        else:
            raise ValueError(f"Tipo de detalle no soportado: {detalle.tipo_detalle_id}")

    def _precios_corrugados(
        self,
        detalle: DatosDetalle,
        datos: DatosRelacionados
    ) -> ResultadoPrecios:
        """
        Calcula precios para cajas corrugadas.
        Replica la lógica de preciosCorrugados() en Laravel.
        """
        precios = ResultadoPrecios()

        # ====== COSTOS DIRECTOS ======
        # Costo Papel
        precios.costo_papel = self._costo_papel(detalle, datos)

        # Costo Adhesivo (corrugadora)
        precios.costo_adhesivo = self._costo_adhesivo(detalle, datos)

        # Costo Tinta
        precios.costo_tinta = self._costo_tinta(detalle, datos)

        # Costo Barniz
        precios.costo_barniz = self._costo_barniz(detalle, datos)

        # Costo Cinta (desgarro)
        precios.costo_cinta = self._costo_cinta(detalle, datos)

        # Costo Adhesivo Pegado
        precios.costo_adhesivo_pegado = self._costo_adhesivo_pegado(detalle, datos)

        # Total Materia Prima
        precios.costo_materia_prima = self._sumar_costos([
            precios.costo_papel,
            precios.costo_adhesivo,
            precios.costo_tinta,
            precios.costo_barniz,
            precios.costo_cinta,
            precios.costo_adhesivo_pegado,
        ])
        precios.costo_directo = precios.costo_materia_prima

        # ====== COSTOS INDIRECTOS ======
        # Embalaje
        precios.costo_pallet = self._costo_pallet(detalle, datos)
        precios.costo_zuncho = self._costo_zuncho(detalle, datos)
        precios.costo_funda = self._costo_funda(detalle, datos)
        precios.costo_stretch_film = self._costo_stretch_film(detalle, datos)

        precios.costo_materiales_embalaje = self._sumar_costos([
            precios.costo_pallet,
            precios.costo_zuncho,
            precios.costo_funda,
            precios.costo_stretch_film,
        ])

        # Fabricación
        precios.costo_energia = self._costo_energia(detalle, datos)
        precios.costo_gas_caldera = self._costo_gas_caldera(detalle, datos)
        precios.costo_gas_gruas = self._costo_gas_gruas(detalle, datos)

        precios.costo_fabricacion = self._sumar_costos([
            precios.costo_energia,
            precios.costo_gas_caldera,
            precios.costo_gas_gruas,
        ])

        # Materiales de operación
        precios.costo_clisses = self._costo_clisses(detalle, datos)
        precios.costo_matriz = self._costo_matriz(detalle, datos)

        precios.costo_materiales_operacion = self._sumar_costos([
            precios.costo_clisses,
            precios.costo_matriz,
        ])

        # Total Indirectos
        precios.costo_indirecto = self._sumar_costos([
            precios.costo_materiales_embalaje,
            precios.costo_fabricacion,
            precios.costo_materiales_operacion,
        ])

        # ====== COSTOS DE SERVICIOS ======
        precios.costo_armado = self._costo_armado(detalle, datos)
        precios.costo_maquila = self._costo_maquila(detalle, datos)

        precios.costo_servicios = self._sumar_costos([
            precios.costo_armado,
            precios.costo_maquila,
        ])

        # ====== COSTOS GVV ======
        precios.costo_flete = self._costo_flete(detalle, datos)

        # FOB para cálculo de financiamiento y comisión
        costo_fob = (
            detalle.margen +
            precios.costo_materia_prima.usd_mm2 +
            precios.costo_materiales_operacion.usd_mm2 +
            precios.costo_materiales_embalaje.usd_mm2 +
            precios.costo_fabricacion.usd_mm2 +
            precios.costo_servicios.usd_mm2 +
            precios.costo_flete.usd_mm2
        )

        precios.costo_financiamiento = self._costo_financiamiento(detalle, datos, costo_fob)
        precios.costo_comision = self._costo_comision(detalle, datos, costo_fob)

        precios.costo_gvv = self._sumar_costos([
            precios.costo_flete,
            precios.costo_financiamiento,
            precios.costo_comision,
        ])

        # ====== COSTOS FIJOS ======
        precios.costo_mano_de_obra = self._costo_mano_de_obra(detalle, datos)
        precios.costo_perdida_productividad = self._costo_perdida_productividad(detalle, datos)
        precios.costo_perdida_productividad_pegado = self._costo_perdida_productividad_pegado(detalle, datos)
        precios.costo_fijos_planta = self._costo_fijos_planta(detalle, datos)

        precios.costo_fijo_total = self._sumar_costos([
            precios.costo_mano_de_obra,
            precios.costo_perdida_productividad,
            precios.costo_perdida_productividad_pegado,
            precios.costo_fijos_planta,
        ])

        # ====== OTROS COSTOS ======
        precios.costo_servir_sin_flete = self._costo_servir_sin_flete(detalle, datos)
        precios.costo_administrativos = self._costo_administrativos(detalle, datos)
        precios.costo_royalty = self._costo_royalty(detalle, datos)

        # ====== TOTALES ======
        precios.costo_total = self._sumar_costos([
            precios.costo_directo,
            precios.costo_indirecto,
            precios.costo_gvv,
            precios.costo_servicios,
            precios.costo_fijo_total,
            precios.costo_servir_sin_flete,
            precios.costo_administrativos,
        ])

        # Margen
        precios.margen = self._calcular_margen(detalle, datos)

        # Precio calculado con mg_ebitda
        mg_ebitda = datos.mg_ebitda
        if mg_ebitda > 0:
            divisor = Decimal("1") - (mg_ebitda / Decimal("100"))
            precios.precio_total = CostoUnidades(
                usd_mm2=precios.costo_total.usd_mm2 / divisor if divisor != 0 else Decimal("0"),
                usd_ton=precios.costo_total.usd_ton / divisor if divisor != 0 else Decimal("0"),
                usd_caja=precios.costo_total.usd_caja / divisor if divisor != 0 else Decimal("0"),
            )
        else:
            precios.precio_total = precios.costo_total

        # Precio final (costo + margen)
        precios.precio_final = CostoUnidades(
            usd_mm2=precios.costo_total.usd_mm2 + precios.margen.usd_mm2,
            usd_ton=precios.costo_total.usd_ton + precios.margen.usd_ton,
            usd_caja=precios.costo_total.usd_caja + precios.margen.usd_caja,
        )

        return precios

    def _precios_esquineros(
        self,
        detalle: DatosDetalle,
        datos: DatosRelacionados
    ) -> ResultadoPrecios:
        """
        Calcula precios para esquineros de cartón.
        Replica la lógica de preciosEsquineros() en Laravel.
        """
        # TODO: Implementar fórmulas específicas de esquineros
        # Por ahora retorna estructura vacía
        return ResultadoPrecios()

    # =============================================
    # MÉTODOS DE CÁLCULO INDIVIDUAL
    # =============================================

    def _costo_papel(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del papel del cartón.

        Fórmula:
        costo_papel_usd_mm2 = costo_carton_papeles /
            ((1 - desperdicio_papel) * (1 - merma_corrugadora) * (1 - merma_convertidora))
        """
        # Calcular desperdicio de papel
        desperdicio_papel = self._calcular_desperdicio_papel(detalle, datos)

        # Obtener costo de papeles del cartón
        costo_carton_papeles = datos.costo_carton_papeles

        # Calcular denominador
        merma_corrugadora = datos.porcentaje_merma_corrugadora
        merma_convertidora = datos.merma_convertidora

        denominador = (
            (Decimal("1") - desperdicio_papel) *
            (Decimal("1") - merma_corrugadora) *
            (Decimal("1") - merma_convertidora)
        )

        if denominador == 0:
            costo_papel_usd_mm2 = Decimal("0")
        else:
            costo_papel_usd_mm2 = costo_carton_papeles / denominador

        # Convertir a otras unidades
        gramaje = datos.gramaje_carton
        area_hc = detalle.area_hc

        costo_papel_usd_ton = (costo_papel_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0")
        costo_papel_usd_caja = costo_papel_usd_mm2 * area_hc / 1000

        return CostoUnidades(
            usd_mm2=costo_papel_usd_mm2,
            usd_ton=costo_papel_usd_ton,
            usd_caja=costo_papel_usd_caja,
        )

    def _calcular_desperdicio_papel(self, detalle: DatosDetalle, datos: DatosRelacionados) -> Decimal:
        """
        Calcula el desperdicio de papel según formato de bobina.

        Replica getDesperdicioPapelAttribute() de Laravel.
        Tope máximo: 7%
        """
        ancho_hc = detalle.anchura * detalle.golpes_ancho + self._orilla_ancho(detalle)

        if ancho_hc == 0:
            return Decimal("0")

        # Cartones de excepción con desperdicio fijo
        cartones_excepcion = ["EN32B", "EN58Q", "EN34C", "EN42C", "EN48C", "EN55C", "EN57C", "EN64C"]
        if datos.carton_codigo in cartones_excepcion:
            return Decimal("0.015")

        # Calcular según formatos de bobina
        ancho_corrugadora = datos.ancho_corrugadora
        trim_corrugadora = datos.trim_corrugadora
        formatos_bobina = datos.formatos_bobina

        numero_cortes = int((ancho_corrugadora - trim_corrugadora) / ancho_hc) if ancho_hc > 0 else 0

        desperdicio = Decimal("0")
        for formato in formatos_bobina:
            diferencia = formato - (numero_cortes * ancho_hc)
            if diferencia > 30 and (numero_cortes * ancho_hc) > 0:
                desperdicio = Decimal(str(diferencia)) / Decimal(str(numero_cortes * ancho_hc))
                break

        # Tope máximo 7%
        if desperdicio > Decimal("0.07"):
            desperdicio = Decimal("0.07")

        return desperdicio

    def _orilla_ancho(self, detalle: DatosDetalle) -> int:
        """Calcula orilla de ancho según proceso"""
        # TODO: Implementar según lógica de Laravel
        return 0

    def _costo_adhesivo(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del adhesivo de corrugadora.

        Fórmula:
        costo_adhesivo_usd_mm2 = costo_carton_adhesivos /
            ((1 - merma_corrugadora) * (1 - merma_convertidora))
        """
        costo_carton_adhesivo = datos.costo_carton_adhesivos
        merma_corrugadora = datos.porcentaje_merma_corrugadora
        merma_convertidora = datos.merma_convertidora

        denominador = (Decimal("1") - merma_corrugadora) * (Decimal("1") - merma_convertidora)

        if denominador == 0:
            costo_adhesivo_usd_mm2 = Decimal("0")
        else:
            costo_adhesivo_usd_mm2 = costo_carton_adhesivo / denominador

        gramaje = datos.gramaje_carton
        area_hc = detalle.area_hc

        return CostoUnidades(
            usd_mm2=costo_adhesivo_usd_mm2,
            usd_ton=(costo_adhesivo_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_adhesivo_usd_mm2 * area_hc / 1000,
        )

    def _costo_tinta(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de tinta de impresión.

        Según tipo de máquina impresora:
        - 1: Sin impresión (retorna 0)
        - 2: Máquina Normal
        - 3: Máquina Interna (retorna 0)
        - 4: Alta Gráfica
        - 5: Dong Fang
        """
        maquina_impresora = detalle.printing_machine_id
        cobertura_color = detalle.cobertura_color_percent

        # Sin impresión o cobertura cero
        if (maquina_impresora is None or maquina_impresora == 1 or
            maquina_impresora == 3 or cobertura_color == 0):
            return CostoUnidades()

        # Determinar costo y consumo según máquina
        if maquina_impresora == 4:  # Alta Gráfica
            if detalle.print_type_id:  # Alta Gráfica especial
                costo_usd_gr = (
                    datos.costo_tinta_usd_gr_alta_grafica_metalizada * Decimal("0.2") +
                    datos.costo_tinta_usd_gr_alta_grafica_otras * Decimal("0.8")
                )
                consumo_usd_gr = (
                    (datos.consumo_tinta_usd_gr_alta_grafica_otras * 4 +
                     datos.consumo_tinta_usd_gr_alta_grafica_metalizado * 2) / 6
                ) / Decimal("10000000")
            else:
                costo_usd_gr = datos.costo_tinta_usd_gr
                consumo_usd_gr = datos.consumo_tinta_gr_x_Mm2 / Decimal("10000000")
        else:  # Normal (2) o Dong Fang (5)
            costo_usd_gr = datos.costo_tinta_usd_gr
            consumo_usd_gr = datos.consumo_tinta_gr_x_Mm2 / Decimal("10000000")

        area_hc = detalle.area_hc
        merma_convertidora = datos.merma_convertidora

        # Cobertura se multiplica por 100 (no 10000) porque cobertura ya está en %
        cobertura = cobertura_color * area_hc * 100

        # Cálculo costo de tinta
        denominador = Decimal("1") - merma_convertidora
        if denominador == 0:
            costo_tinta_usd_caja = Decimal("0")
        else:
            costo_tinta_usd_caja = (cobertura * costo_usd_gr * consumo_usd_gr) / denominador

        gramaje = datos.gramaje_carton
        costo_tinta_usd_mm2 = costo_tinta_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_tinta_usd_mm2,
            usd_ton=(costo_tinta_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_tinta_usd_caja,
        )

    def _costo_barniz(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del barniz.

        Según tipo de barniz:
        - 1: UV
        - 2: Acuoso
        - 3: Hidrorepelente
        """
        maquina_impresora = detalle.printing_machine_id
        tipo_barniz = detalle.barniz_type_id

        # Sin impresión
        if maquina_impresora is None or maquina_impresora == 1 or maquina_impresora == 3:
            return CostoUnidades()

        # Determinar costo y consumo según tipo de barniz
        if maquina_impresora == 4:  # Alta Gráfica
            if tipo_barniz == 1:  # UV
                costo_usd_gr = datos.costo_barniz_uv_usd_gr
                consumo_gr_mm2 = datos.consumo_barniz_uv_gr_x_Mm2 / Decimal("10000000")
            elif tipo_barniz == 2:  # Acuoso
                costo_usd_gr = datos.costo_barniz_acuoso_usd_gr
                consumo_gr_mm2 = datos.consumo_barniz_acuoso_gr_x_Mm2 / Decimal("10000000")
            elif tipo_barniz == 3:  # Hidrorepelente
                costo_usd_gr = datos.costo_barniz_usd_gr
                consumo_gr_mm2 = datos.consumo_barniz_gr_x_Mm2 / Decimal("10000000")
            else:
                return CostoUnidades()
        else:  # Normal (2) o Dong Fang (5)
            costo_usd_gr = datos.costo_barniz_usd_gr
            consumo_gr_mm2 = datos.consumo_barniz_gr_x_Mm2 / Decimal("10000000")

        cobertura = detalle.cobertura_barniz_cm2
        area_hc = detalle.area_hc
        merma_convertidora = datos.merma_convertidora

        # Cálculo costo de barniz
        denominador = Decimal("1") - merma_convertidora
        if denominador == 0 or area_hc == 0:
            costo_barniz_usd_caja = Decimal("0")
        else:
            costo_barniz_usd_caja = (cobertura * costo_usd_gr * consumo_gr_mm2) / denominador

        gramaje = datos.gramaje_carton
        costo_barniz_usd_mm2 = costo_barniz_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_barniz_usd_mm2,
            usd_ton=(costo_barniz_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_barniz_usd_caja,
        )

    def _costo_cinta(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de cinta de desgarro.

        Solo aplica si cinta_desgarro = 1
        """
        if not detalle.cinta_desgarro:
            return CostoUnidades()

        costo_cinta_m = datos.costo_cinta_usd_m
        consumo_cinta_m = datos.consumo_cinta_m_x_caja
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton
        merma_convertidora = datos.merma_convertidora

        denominador = Decimal("1") - merma_convertidora
        if denominador == 0:
            costo_cinta_usd_caja = Decimal("0")
        else:
            costo_cinta_usd_caja = (costo_cinta_m * consumo_cinta_m) / denominador

        costo_cinta_usd_mm2 = costo_cinta_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_cinta_usd_mm2,
            usd_ton=(costo_cinta_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_cinta_usd_caja,
        )

    def _costo_adhesivo_pegado(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del adhesivo de pegado (para armar la caja).

        Fórmula:
        costo = (consumo_gr_caja * precio_adhesivo) / (1 - merma_pegado)
        """
        consumo_adhesivo_pegado = datos.consumo_adhesivo_pegado_gr_caja
        precio_adhesivo = datos.precio_adhesivo_powerply
        merma_pegado = datos.porcentaje_merma_convertidora_adhesivo_pegado

        if consumo_adhesivo_pegado == 0 or precio_adhesivo == 0:
            return CostoUnidades()

        denominador = Decimal("1") - merma_pegado
        if denominador == 0:
            costo_adhesivo_usd_caja = Decimal("0")
        else:
            costo_adhesivo_usd_caja = (consumo_adhesivo_pegado * precio_adhesivo) / denominador

        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton
        costo_adhesivo_usd_mm2 = costo_adhesivo_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_adhesivo_usd_mm2,
            usd_ton=(costo_adhesivo_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_adhesivo_usd_caja,
        )

    def _costo_pallet(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del pallet.

        costo_pallet_caja = costo_pallet_unidad / cajas_por_pallet
        """
        if not detalle.pallet:
            return CostoUnidades()

        costo_pallet = datos.costo_pallet_usd_unidad
        cajas_por_pallet = datos.cajas_por_pallet
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        if cajas_por_pallet == 0:
            return CostoUnidades()

        costo_pallet_usd_caja = costo_pallet / Decimal(str(cajas_por_pallet))
        costo_pallet_usd_mm2 = costo_pallet_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_pallet_usd_mm2,
            usd_ton=(costo_pallet_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_pallet_usd_caja,
        )

    def _costo_zuncho(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del zuncho.

        costo_zuncho_caja = (costo_zuncho_m * consumo_zuncho_m) / cajas_por_pallet
        """
        if not detalle.zuncho:
            return CostoUnidades()

        costo_zuncho_m = datos.costo_zuncho_usd_m
        consumo_zuncho_m = datos.consumo_zuncho_m_x_pallet
        cajas_por_pallet = datos.cajas_por_pallet
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        if cajas_por_pallet == 0:
            return CostoUnidades()

        costo_zuncho_usd_caja = (costo_zuncho_m * consumo_zuncho_m) / Decimal(str(cajas_por_pallet))
        costo_zuncho_usd_mm2 = costo_zuncho_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_zuncho_usd_mm2,
            usd_ton=(costo_zuncho_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_zuncho_usd_caja,
        )

    def _costo_funda(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de la funda.

        costo_funda_caja = costo_funda_unidad / cajas_por_pallet
        """
        if not detalle.funda:
            return CostoUnidades()

        costo_funda = datos.costo_funda_usd_unidad
        cajas_por_pallet = datos.cajas_por_pallet
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        if cajas_por_pallet == 0:
            return CostoUnidades()

        costo_funda_usd_caja = costo_funda / Decimal(str(cajas_por_pallet))
        costo_funda_usd_mm2 = costo_funda_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_funda_usd_mm2,
            usd_ton=(costo_funda_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_funda_usd_caja,
        )

    def _costo_stretch_film(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del stretch film.

        costo_stretch_caja = (costo_stretch_m * consumo_stretch_m) / cajas_por_pallet
        """
        if not detalle.stretch_film:
            return CostoUnidades()

        costo_stretch_m = datos.costo_stretch_usd_m
        consumo_stretch_m = datos.consumo_stretch_m_x_pallet
        cajas_por_pallet = datos.cajas_por_pallet
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        if cajas_por_pallet == 0:
            return CostoUnidades()

        costo_stretch_usd_caja = (costo_stretch_m * consumo_stretch_m) / Decimal(str(cajas_por_pallet))
        costo_stretch_usd_mm2 = costo_stretch_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_stretch_usd_mm2,
            usd_ton=(costo_stretch_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_stretch_usd_caja,
        )

    def _costo_energia(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de energía eléctrica.

        costo_energia_mm2 = costo_kwh * consumo_kwh_mm2 / (1 - merma_convertidora)
        """
        costo_kwh = datos.costo_energia_usd_kwh
        consumo_kwh = datos.consumo_energia_kwh_x_Mm2
        merma_convertidora = datos.merma_convertidora
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        denominador = Decimal("1") - merma_convertidora
        if denominador == 0:
            costo_energia_usd_mm2 = Decimal("0")
        else:
            costo_energia_usd_mm2 = (costo_kwh * consumo_kwh) / denominador

        return CostoUnidades(
            usd_mm2=costo_energia_usd_mm2,
            usd_ton=(costo_energia_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_energia_usd_mm2 * area_hc / 1000,
        )

    def _costo_gas_caldera(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de gas de caldera.

        costo_gas_mm2 = costo_m3 * consumo_m3_mm2 / (1 - merma_convertidora)
        """
        costo_m3 = datos.costo_gas_caldera_usd_m3
        consumo_m3 = datos.consumo_gas_caldera_m3_x_Mm2
        merma_convertidora = datos.merma_convertidora
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        denominador = Decimal("1") - merma_convertidora
        if denominador == 0:
            costo_gas_usd_mm2 = Decimal("0")
        else:
            costo_gas_usd_mm2 = (costo_m3 * consumo_m3) / denominador

        return CostoUnidades(
            usd_mm2=costo_gas_usd_mm2,
            usd_ton=(costo_gas_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_gas_usd_mm2 * area_hc / 1000,
        )

    def _costo_gas_gruas(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de gas de grúas.

        costo_gas_mm2 = costo_m3 * consumo_m3_mm2 / (1 - merma_convertidora)
        """
        costo_m3 = datos.costo_gas_gruas_usd_m3
        consumo_m3 = datos.consumo_gas_gruas_m3_x_Mm2
        merma_convertidora = datos.merma_convertidora
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        denominador = Decimal("1") - merma_convertidora
        if denominador == 0:
            costo_gas_usd_mm2 = Decimal("0")
        else:
            costo_gas_usd_mm2 = (costo_m3 * consumo_m3) / denominador

        return CostoUnidades(
            usd_mm2=costo_gas_usd_mm2,
            usd_ton=(costo_gas_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_gas_usd_mm2 * area_hc / 1000,
        )

    def _costo_clisses(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de clisses de impresión.

        El clisse se prorratea por la cantidad de cajas.
        costo_clisse_caja = (area_clisse * costo_cm2) / cantidad
        """
        if not detalle.clisse:
            return CostoUnidades()

        numero_golpes = detalle.golpes_ancho * detalle.golpes_largo
        area_hc = detalle.area_hc
        cantidad = detalle.cantidad
        precio_dolar = datos.precio_dolar
        gramaje = datos.gramaje_carton

        # Costo de clisse en CLP, convertir a USD
        costo_clisse_usd_cm2 = datos.costo_clisse_clp_cm2 / precio_dolar if precio_dolar > 0 else Decimal("0")

        # Área del clisse en cm2 (area_hc * 10000 convierte de m2 a cm2)
        costo_clisses_total = numero_golpes * area_hc * costo_clisse_usd_cm2 * 10000

        if cantidad == 0:
            return CostoUnidades()

        costo_clisse_usd_caja = costo_clisses_total / Decimal(str(cantidad))
        costo_clisse_usd_mm2 = costo_clisse_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_clisse_usd_mm2,
            usd_ton=(costo_clisse_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_clisse_usd_caja,
        )

    def _costo_matriz(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de matriz de troquelado.

        La matriz se prorratea por la cantidad de cajas.
        costo_matriz_caja = costo_matriz_unidad / cantidad
        """
        if not detalle.matriz:
            return CostoUnidades()

        precio_dolar = datos.precio_dolar
        cantidad = detalle.cantidad
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        # Costo de matriz en CLP, convertir a USD
        costo_matriz_usd = datos.costo_matriz_clp_unidad / precio_dolar if precio_dolar > 0 else Decimal("0")

        if cantidad == 0:
            return CostoUnidades()

        costo_matriz_usd_caja = costo_matriz_usd / Decimal(str(cantidad))
        costo_matriz_usd_mm2 = costo_matriz_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_matriz_usd_mm2,
            usd_ton=(costo_matriz_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_matriz_usd_caja,
        )

    def _costo_armado(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """Calcula costo de armado"""
        if not detalle.armado_automatico:
            return CostoUnidades()

        costo_caja = detalle.armado_usd_caja
        area_hc = detalle.area_hc

        return CostoUnidades(
            usd_mm2=costo_caja * 1000 / area_hc if area_hc > 0 else Decimal("0"),
            usd_ton=Decimal("0"),  # No aplica para armado
            usd_caja=costo_caja,
        )

    def _costo_maquila(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de maquila (servicios externos).

        El costo de maquila viene directamente del servicio seleccionado.
        """
        if not detalle.maquila:
            return CostoUnidades()

        costo_maquila_caja = datos.costo_maquila_caja
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        costo_maquila_usd_mm2 = costo_maquila_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_maquila_usd_mm2,
            usd_ton=(costo_maquila_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_maquila_caja,
        )

    def _costo_flete(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo del flete.

        costo_flete_caja = costo_flete_pallet / cajas_por_pallet
        """
        costo_flete_pallet = datos.costo_flete_pallet
        cajas_por_pallet = datos.cajas_por_pallet
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        if cajas_por_pallet == 0:
            return CostoUnidades()

        costo_flete_usd_caja = costo_flete_pallet / Decimal(str(cajas_por_pallet))
        costo_flete_usd_mm2 = costo_flete_usd_caja / area_hc * 1000 if area_hc > 0 else Decimal("0")

        return CostoUnidades(
            usd_mm2=costo_flete_usd_mm2,
            usd_ton=(costo_flete_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_flete_usd_caja,
        )

    def _costo_financiamiento(
        self,
        detalle: DatosDetalle,
        datos: DatosRelacionados,
        costo_fob: Decimal
    ) -> CostoUnidades:
        """Calcula costo de financiamiento según días de pago"""
        tasa = datos.tasa_mensual_credito
        dias = datos.dias_financiamiento

        if tasa == 0 or dias == 0:
            return CostoUnidades()

        # Fórmula: costo_fob * tasa * (dias / 30)
        factor = tasa * Decimal(str(dias)) / Decimal("30")
        costo_mm2 = costo_fob * factor

        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_mm2,
            usd_ton=(costo_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_mm2 * area_hc / 1000,
        )

    def _costo_comision(
        self,
        detalle: DatosDetalle,
        datos: DatosRelacionados,
        costo_fob: Decimal
    ) -> CostoUnidades:
        """
        Calcula costo de comisión de venta.

        costo_comision = costo_fob * porcentaje_comision
        """
        comision = datos.comision_venta

        if comision == 0:
            return CostoUnidades()

        costo_mm2 = costo_fob * comision / Decimal("100")
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_mm2,
            usd_ton=(costo_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_mm2 * area_hc / 1000,
        )

    def _costo_mano_de_obra(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de mano de obra.

        Costo fijo por mm2 definido en tarifario.
        """
        costo_mo_usd_mm2 = datos.costo_mano_obra_usd_mm2
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_mo_usd_mm2,
            usd_ton=(costo_mo_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_mo_usd_mm2 * area_hc / 1000,
        )

    def _costo_perdida_productividad(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo por pérdida de productividad.

        Costo fijo por mm2 definido en tarifario según proceso.
        """
        costo_pp_usd_mm2 = datos.costo_perdida_productividad_usd_mm2
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_pp_usd_mm2,
            usd_ton=(costo_pp_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_pp_usd_mm2 * area_hc / 1000,
        )

    def _costo_perdida_productividad_pegado(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo por pérdida de productividad en pegado.

        Similar a pérdida de productividad pero específico para proceso de pegado.
        Solo aplica si el proceso incluye pegado.
        """
        # En la implementación completa, esto depende del process_id
        # Por ahora retorna 0, se implementará cuando se definan los procesos
        return CostoUnidades()

    def _costo_fijos_planta(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costos fijos de planta.

        Costo fijo por mm2 definido en tarifario por planta.
        """
        costo_fijos_usd_mm2 = datos.costo_fijos_planta_usd_mm2
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_fijos_usd_mm2,
            usd_ton=(costo_fijos_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_fijos_usd_mm2 * area_hc / 1000,
        )

    def _costo_servir_sin_flete(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de servir sin flete.

        Componente del costo de servir excluyendo el flete.
        Por ahora retorna 0, se implementará según tarifario.
        """
        # En la implementación completa, esto viene del tarifario
        return CostoUnidades()

    def _costo_administrativos(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costos administrativos.

        Costo fijo por mm2 definido en tarifario.
        """
        costo_admin_usd_mm2 = datos.costo_administrativos_usd_mm2
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=costo_admin_usd_mm2,
            usd_ton=(costo_admin_usd_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=costo_admin_usd_mm2 * area_hc / 1000,
        )

    def _costo_royalty(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """
        Calcula costo de royalty.

        Solo aplica si royalty = 1 y hay un porcentaje definido.
        Por ahora estructura base, se implementará con tarifario.
        """
        if not detalle.royalty:
            return CostoUnidades()

        # En la implementación completa, el royalty viene del tarifario
        # Típicamente es un % sobre el precio de venta
        return CostoUnidades()

    def _calcular_margen(self, detalle: DatosDetalle, datos: DatosRelacionados) -> CostoUnidades:
        """Calcula el margen en diferentes unidades"""
        margen_mm2 = detalle.margen
        area_hc = detalle.area_hc
        gramaje = datos.gramaje_carton

        return CostoUnidades(
            usd_mm2=margen_mm2,
            usd_ton=(margen_mm2 * 1000 / gramaje) if gramaje > 0 else Decimal("0"),
            usd_caja=margen_mm2 * area_hc / 1000,
        )

    # =============================================
    # UTILIDADES
    # =============================================

    def _sumar_costos(self, costos: List[CostoUnidades]) -> CostoUnidades:
        """Suma una lista de costos"""
        total = CostoUnidades()
        for costo in costos:
            total.usd_mm2 += costo.usd_mm2
            total.usd_ton += costo.usd_ton
            total.usd_caja += costo.usd_caja
        return total


# =============================================
# FUNCIONES DE UTILIDAD
# =============================================

def cargar_datos_relacionados(conn, detalle: DatosDetalle) -> DatosRelacionados:
    """
    Carga todos los datos relacionados necesarios para el cálculo.

    Args:
        conn: Conexión a base de datos
        detalle: Datos del detalle

    Returns:
        DatosRelacionados con todos los datos cargados
    """
    import json

    datos = DatosRelacionados()
    cursor = conn.cursor()

    try:
        # =============================================
        # 1. CARGAR PLANTA (costos y consumos base)
        # =============================================
        if detalle.planta_id:
            cursor.execute("""
                SELECT
                    nombre, ancho_corrugadora, trim_corrugadora,
                    porcentaje_merma_corrugadora, merma_cera,
                    formatos_bobina_corrugadora,
                    -- Costos de adhesivo
                    precio_adhesivo, precio_adhesivo_powerply,
                    -- Costos de tinta
                    costo_tinta_usd_gr, consumo_tinta_gr_x_Mm2,
                    costo_tinta_usd_gr_alta_grafica_metalizada,
                    costo_tinta_usd_gr_alta_grafica_otras,
                    consumo_tinta_usd_gr_alta_grafica_otras,
                    consumo_tinta_usd_gr_alta_grafica_metalizado,
                    -- Costos de barniz
                    costo_barniz_usd_gr, consumo_barniz_gr_x_Mm2,
                    costo_barniz_uv_usd_gr, consumo_barniz_uv_gr_x_Mm2,
                    costo_barniz_acuoso_usd_gr, consumo_barniz_acuoso_gr_x_Mm2,
                    -- Costos de cinta
                    costo_cinta_usd_m, consumo_cinta_m_x_caja,
                    -- Costos de energía y gas
                    costo_energia_usd_kwh, consumo_energia_kwh_x_Mm2,
                    costo_gas_caldera_usd_m3, consumo_gas_caldera_m3_x_Mm2,
                    costo_gas_gruas_usd_m3, consumo_gas_gruas_m3_x_Mm2,
                    -- Costos de embalaje
                    costo_pallet_usd_unidad,
                    costo_zuncho_usd_m, consumo_zuncho_m_x_pallet,
                    costo_funda_usd_unidad,
                    costo_stretch_usd_m, consumo_stretch_m_x_pallet,
                    -- Costos de operación
                    costo_clisse_clp_cm2, costo_matriz_clp_unidad,
                    -- Tarifario
                    mg_ebitda,
                    -- Costos fijos
                    costo_mano_obra_usd_mm2, costo_perdida_productividad_usd_mm2,
                    costo_fijos_planta_usd_mm2, costo_administrativos_usd_mm2
                FROM plantas WHERE id = %s
            """, (detalle.planta_id,))
            planta = cursor.fetchone()

            if planta:
                # Datos básicos de planta
                datos.planta_nombre = planta.get("nombre", "")
                datos.ancho_corrugadora = planta.get("ancho_corrugadora") or 0
                datos.trim_corrugadora = planta.get("trim_corrugadora") or 0
                datos.porcentaje_merma_corrugadora = Decimal(str(planta.get("porcentaje_merma_corrugadora") or 0))
                datos.merma_cera = Decimal(str(planta.get("merma_cera") or 0))

                # Formatos de bobina (JSON)
                formatos_raw = planta.get("formatos_bobina_corrugadora")
                if formatos_raw:
                    try:
                        if isinstance(formatos_raw, str):
                            formatos = json.loads(formatos_raw)
                        else:
                            formatos = formatos_raw
                        datos.formatos_bobina = formatos.get("formatos", []) if isinstance(formatos, dict) else formatos
                    except (json.JSONDecodeError, TypeError):
                        datos.formatos_bobina = []

                # Precios de adhesivo
                datos.precio_adhesivo_powerply = Decimal(str(planta.get("precio_adhesivo_powerply") or 0))

                # Costos de tinta
                datos.costo_tinta_usd_gr = Decimal(str(planta.get("costo_tinta_usd_gr") or 0))
                datos.consumo_tinta_gr_x_Mm2 = Decimal(str(planta.get("consumo_tinta_gr_x_Mm2") or 0))
                datos.costo_tinta_usd_gr_alta_grafica_metalizada = Decimal(
                    str(planta.get("costo_tinta_usd_gr_alta_grafica_metalizada") or 0))
                datos.costo_tinta_usd_gr_alta_grafica_otras = Decimal(
                    str(planta.get("costo_tinta_usd_gr_alta_grafica_otras") or 0))
                datos.consumo_tinta_usd_gr_alta_grafica_otras = Decimal(
                    str(planta.get("consumo_tinta_usd_gr_alta_grafica_otras") or 0))
                datos.consumo_tinta_usd_gr_alta_grafica_metalizado = Decimal(
                    str(planta.get("consumo_tinta_usd_gr_alta_grafica_metalizado") or 0))

                # Costos de barniz
                datos.costo_barniz_usd_gr = Decimal(str(planta.get("costo_barniz_usd_gr") or 0))
                datos.consumo_barniz_gr_x_Mm2 = Decimal(str(planta.get("consumo_barniz_gr_x_Mm2") or 0))
                datos.costo_barniz_uv_usd_gr = Decimal(str(planta.get("costo_barniz_uv_usd_gr") or 0))
                datos.consumo_barniz_uv_gr_x_Mm2 = Decimal(str(planta.get("consumo_barniz_uv_gr_x_Mm2") or 0))
                datos.costo_barniz_acuoso_usd_gr = Decimal(str(planta.get("costo_barniz_acuoso_usd_gr") or 0))
                datos.consumo_barniz_acuoso_gr_x_Mm2 = Decimal(str(planta.get("consumo_barniz_acuoso_gr_x_Mm2") or 0))

                # Costos de cinta
                datos.costo_cinta_usd_m = Decimal(str(planta.get("costo_cinta_usd_m") or 0))
                datos.consumo_cinta_m_x_caja = Decimal(str(planta.get("consumo_cinta_m_x_caja") or 0))

                # Costos de energía y gas
                datos.costo_energia_usd_kwh = Decimal(str(planta.get("costo_energia_usd_kwh") or 0))
                datos.consumo_energia_kwh_x_Mm2 = Decimal(str(planta.get("consumo_energia_kwh_x_Mm2") or 0))
                datos.costo_gas_caldera_usd_m3 = Decimal(str(planta.get("costo_gas_caldera_usd_m3") or 0))
                datos.consumo_gas_caldera_m3_x_Mm2 = Decimal(str(planta.get("consumo_gas_caldera_m3_x_Mm2") or 0))
                datos.costo_gas_gruas_usd_m3 = Decimal(str(planta.get("costo_gas_gruas_usd_m3") or 0))
                datos.consumo_gas_gruas_m3_x_Mm2 = Decimal(str(planta.get("consumo_gas_gruas_m3_x_Mm2") or 0))

                # Costos de embalaje
                datos.costo_pallet_usd_unidad = Decimal(str(planta.get("costo_pallet_usd_unidad") or 0))
                datos.costo_zuncho_usd_m = Decimal(str(planta.get("costo_zuncho_usd_m") or 0))
                datos.consumo_zuncho_m_x_pallet = Decimal(str(planta.get("consumo_zuncho_m_x_pallet") or 0))
                datos.costo_funda_usd_unidad = Decimal(str(planta.get("costo_funda_usd_unidad") or 0))
                datos.costo_stretch_usd_m = Decimal(str(planta.get("costo_stretch_usd_m") or 0))
                datos.consumo_stretch_m_x_pallet = Decimal(str(planta.get("consumo_stretch_m_x_pallet") or 0))

                # Costos de operación
                datos.costo_clisse_clp_cm2 = Decimal(str(planta.get("costo_clisse_clp_cm2") or 0))
                datos.costo_matriz_clp_unidad = Decimal(str(planta.get("costo_matriz_clp_unidad") or 0))

                # Tarifario
                datos.mg_ebitda = Decimal(str(planta.get("mg_ebitda") or 0))

                # Costos fijos
                datos.costo_mano_obra_usd_mm2 = Decimal(str(planta.get("costo_mano_obra_usd_mm2") or 0))
                datos.costo_perdida_productividad_usd_mm2 = Decimal(
                    str(planta.get("costo_perdida_productividad_usd_mm2") or 0))
                datos.costo_fijos_planta_usd_mm2 = Decimal(str(planta.get("costo_fijos_planta_usd_mm2") or 0))
                datos.costo_administrativos_usd_mm2 = Decimal(str(planta.get("costo_administrativos_usd_mm2") or 0))

        # =============================================
        # 2. CARGAR CARTÓN (papeles y adhesivos)
        # =============================================
        if detalle.carton_id:
            cursor.execute("""
                SELECT
                    c.codigo, c.gramaje_total, c.tipo, c.onda_1, c.onda_2,
                    c.factor_onda, c.factor_desarrollo,
                    (SELECT COALESCE(SUM(p.precio * cp.factor), 0)
                     FROM carton_papeles cp
                     JOIN papers p ON cp.paper_id = p.id
                     WHERE cp.carton_id = c.id) as costo_papeles,
                    (SELECT COALESCE(SUM(ca.costo_adhesivo), 0)
                     FROM carton_adhesivos ca
                     WHERE ca.carton_id = c.id) as costo_adhesivos
                FROM cardboards c WHERE c.id = %s
            """, (detalle.carton_id,))
            carton = cursor.fetchone()

            if carton:
                datos.carton_codigo = carton.get("codigo", "")
                datos.carton_tipo = carton.get("tipo", "")
                datos.gramaje_carton = Decimal(str(carton.get("gramaje_total") or 0))
                datos.costo_carton_papeles = Decimal(str(carton.get("costo_papeles") or 0))
                datos.costo_carton_adhesivos = Decimal(str(carton.get("costo_adhesivos") or 0))
                datos.factor_onda = Decimal(str(carton.get("factor_onda") or 1))
                datos.factor_desarrollo = Decimal(str(carton.get("factor_desarrollo") or 1))

        # =============================================
        # 3. CARGAR VARIABLES COTIZADOR
        # =============================================
        if detalle.variable_cotizador_id:
            cursor.execute("""
                SELECT
                    precio_dolar, iva, tasa_mensual_credito,
                    dias_financiamiento_credito, comision_venta
                FROM variables_cotizadors WHERE id = %s
            """, (detalle.variable_cotizador_id,))
            variables = cursor.fetchone()

            if variables:
                datos.precio_dolar = Decimal(str(variables.get("precio_dolar") or 1))
                datos.iva = Decimal(str(variables.get("iva") or 19)) / Decimal("100")
                datos.tasa_mensual_credito = Decimal(str(variables.get("tasa_mensual_credito") or 0)) / Decimal("100")
                datos.dias_financiamiento = variables.get("dias_financiamiento_credito") or 0
                datos.comision_venta = Decimal(str(variables.get("comision_venta") or 0))

        # =============================================
        # 4. CARGAR MERMA CONVERTIDORA
        # =============================================
        if detalle.rubro_id and detalle.process_id and detalle.planta_id:
            cursor.execute("""
                SELECT porcentaje_merma_convertidora
                FROM merma_convertidoras
                WHERE rubro_id = %s AND process_id = %s AND planta_id = %s
                LIMIT 1
            """, (detalle.rubro_id, detalle.process_id, detalle.planta_id))
            merma = cursor.fetchone()

            if merma:
                datos.merma_convertidora = Decimal(str(merma.get("porcentaje_merma_convertidora") or 0)) / Decimal("100")

        # =============================================
        # 5. CARGAR CONSUMO DE ENERGÍA POR PROCESO
        # =============================================
        if detalle.planta_id and detalle.process_id:
            cursor.execute("""
                SELECT consumo_kwh_mm2
                FROM consumo_energias
                WHERE planta_id = %s AND process_id = %s
                LIMIT 1
            """, (detalle.planta_id, detalle.process_id))
            consumo = cursor.fetchone()

            if consumo:
                datos.consumo_energia_kwh_x_Mm2 = Decimal(str(consumo.get("consumo_kwh_mm2") or 0))

        # =============================================
        # 6. CARGAR CONSUMO DE ADHESIVO DE PEGADO
        # =============================================
        if detalle.planta_id and detalle.process_id:
            cursor.execute("""
                SELECT consumo_adhesivo_pegado_gr_caja, porcentaje_merma_adhesivo_pegado
                FROM consumo_adhesivo_pegados
                WHERE planta_id = %s AND process_id = %s
                LIMIT 1
            """, (detalle.planta_id, detalle.process_id))
            consumo_pegado = cursor.fetchone()

            if consumo_pegado:
                datos.consumo_adhesivo_pegado_gr_caja = Decimal(
                    str(consumo_pegado.get("consumo_adhesivo_pegado_gr_caja") or 0))
                datos.porcentaje_merma_convertidora_adhesivo_pegado = Decimal(
                    str(consumo_pegado.get("porcentaje_merma_adhesivo_pegado") or 0)) / Decimal("100")

        # =============================================
        # 7. CARGAR FLETE (por ciudad destino)
        # =============================================
        if detalle.ciudad_id and detalle.planta_id:
            cursor.execute("""
                SELECT costo_flete_pallet
                FROM fletes
                WHERE ciudad_id = %s AND planta_id = %s
                LIMIT 1
            """, (detalle.ciudad_id, detalle.planta_id))
            flete = cursor.fetchone()

            if flete:
                datos.costo_flete_pallet = Decimal(str(flete.get("costo_flete_pallet") or 0))

        # =============================================
        # 8. CARGAR CAJAS POR PALLET
        # =============================================
        if detalle.pallet_height_id:
            cursor.execute("""
                SELECT cajas_por_pallet
                FROM pallet_heights
                WHERE id = %s
            """, (detalle.pallet_height_id,))
            pallet_height = cursor.fetchone()

            if pallet_height:
                datos.cajas_por_pallet = pallet_height.get("cajas_por_pallet") or 0

        # Calcular cajas por pallet si no está definido
        if datos.cajas_por_pallet == 0 and detalle.cantidad > 0:
            # Usar valor por defecto basado en el área del HC
            datos.cajas_por_pallet = 100  # Valor por defecto

        # =============================================
        # 9. CARGAR SERVICIO DE MAQUILA
        # =============================================
        if detalle.maquila and detalle.maquila_servicio_id:
            cursor.execute("""
                SELECT costo_usd_caja
                FROM maquila_servicios
                WHERE id = %s
            """, (detalle.maquila_servicio_id,))
            maquila = cursor.fetchone()

            if maquila:
                datos.costo_maquila_caja = Decimal(str(maquila.get("costo_usd_caja") or 0))

        # =============================================
        # 10. CARGAR RUBRO
        # =============================================
        if detalle.rubro_id:
            cursor.execute("""
                SELECT codigo FROM rubros WHERE id = %s
            """, (detalle.rubro_id,))
            rubro = cursor.fetchone()

            if rubro:
                datos.rubro_codigo = rubro.get("codigo", "")

    except Exception as e:
        logger.error(f"Error cargando datos relacionados: {e}")
        raise

    finally:
        cursor.close()

    return datos
