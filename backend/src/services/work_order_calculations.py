"""
Servicio de Cálculos para WorkOrder (Sprint 1.3)

Fuente Laravel: app/WorkOrder.php líneas 19-23 (constantes), 346-880 (accessors)

Este módulo implementa todos los cálculos/accessors del modelo WorkOrder de Laravel.
NO INVENTAR - Todas las fórmulas son extraídas directamente del código Laravel.
"""
from typing import Optional, Union, Dict, Any
from decimal import Decimal


# =============================================================================
# CONSTANTES DE CONSUMO
# Fuente Laravel: app/WorkOrder.php líneas 19-23
# =============================================================================
CONSUMO_TINTA = 5
CONSUMO_ADHESIVO = 4
CONSUMO_CERA = 28
CONSUMO_HIDROPELENTE = 25
CONSUMO_BARNIZ_UV = 20


# =============================================================================
# TIPOS DE CARTÓN (para cálculos de largura/anchura HC)
# Fuente Laravel: app/WorkOrder.php líneas 389-407
# =============================================================================
CARTONES_SIMPLES = ["SIMPLES", "POWER PLY", "MONOTAPA", "SIMPLE EMPLACADO"]
CARTONES_DOBLES = ["DOBLES", "DOBLE MONOTAPA"]

PROCESOS_DIECUTTER = ["DIECUTTER-C/PEGADO", "DIECUTTER", "FLEXO/MATRIZ COMPLET"]
PROCESOS_OFFSET = ["OFFSET", "OFFSET-C/PEGADO"]


def _is_valid(value: Any) -> bool:
    """Verifica si un valor es válido para cálculos."""
    if value is None:
        return False
    if isinstance(value, str) and (value == "" or value == "N/A"):
        return False
    return True


def _safe_float(value: Any) -> Optional[float]:
    """Convierte un valor a float de forma segura."""
    if not _is_valid(value):
        return None
    try:
        if isinstance(value, str):
            # Manejar formato europeo (coma como decimal)
            value = value.replace(",", ".")
        return float(value)
    except (ValueError, TypeError):
        return None


# =============================================================================
# CÁLCULOS DE ÁREA
# Fuente Laravel: app/WorkOrder.php líneas 346-373
# =============================================================================

def calcular_area_hm(
    largura_hm: Optional[float],
    anchura_hm: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Área HM.

    Fórmula Laravel (línea 349):
        (largura_hm * anchura_hm) / 1000000

    Args:
        largura_hm: Largura HM en mm
        anchura_hm: Anchura HM en mm

    Returns:
        Área en m² o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hm)
    anchura = _safe_float(anchura_hm)

    if largura is None or anchura is None:
        return "N/A"

    return (largura * anchura) / 1000000


def calcular_area_hc(
    largura_hc: Union[float, str],
    anchura_hc: Union[float, str],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el Área HC unitario.

    Fórmula Laravel (líneas 354-358):
        (Largura HC * Anchura HC / 1000000) / (Golpes al largo * Golpes al ancho)

    Args:
        largura_hc: Largura HC calculada
        anchura_hc: Anchura HC calculada
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Área HC unitaria en m² o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hc)
    anchura = _safe_float(anchura_hc)

    if largura is None or anchura is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((largura * anchura) / 1000000) / (golpes_largo * golpes_ancho)


def calcular_area_hc_semielaborado(
    largura_hc: Union[float, str],
    anchura_hc: Union[float, str],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el Área HC para semielaborado (sin dividir por golpes).

    Fórmula Laravel (líneas 361-367):
        (Largura HC * Anchura HC) / 1000000

    Args:
        largura_hc: Largura HC calculada
        anchura_hc: Anchura HC calculada
        golpes_largo: Número de golpes al largo (solo para validación)
        golpes_ancho: Número de golpes al ancho (solo para validación)

    Returns:
        Área HC semielaborado en m² o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hc)
    anchura = _safe_float(anchura_hc)

    if largura is None or anchura is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return (largura * anchura) / 1000000


def calcular_area_esquinero(
    largura_hm: Optional[float],
    anchura_hm: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Área Esquinero (igual a Área HM).

    Fórmula Laravel (líneas 370-372):
        (largura_hm * anchura_hm) / 1000000
    """
    return calcular_area_hm(largura_hm, anchura_hm)


# =============================================================================
# CÁLCULOS DE DIMENSIONES HC
# Fuente Laravel: app/WorkOrder.php líneas 374-516
# =============================================================================

def calcular_largura_hc(
    largura_hm: Optional[float],
    golpes_largo: Optional[int],
    tipo_carton: Optional[str],
    proceso: Optional[str],
    separacion_golpes_largo: Optional[float] = None,
    work_order_id: Optional[int] = None,
    override_values: Optional[Dict[int, float]] = None
) -> Union[float, str]:
    """
    Calcula la Largura HC.

    Fórmula Laravel (líneas 374-446):
        (Largura HM * Golpes al largo) + suma + ((Golpes Largo - 1) * separacion_golpes_largo)

        Donde suma depende de:
        - DIECUTTER/FLEXO + cartón simple: +20
        - DIECUTTER/FLEXO + cartón doble: +25
        - OFFSET + cualquier cartón: +24
        - Otros: +10

        Casos especiales:
        - CORRUGADO: largura_hc = largura_hm
        - S/PROCESO: largura_hc = largura_hm * golpes_largo

    Args:
        largura_hm: Largura HM en mm
        golpes_largo: Número de golpes al largo
        tipo_carton: Tipo de cartón (SIMPLES, DOBLES, etc.)
        proceso: Descripción del proceso
        separacion_golpes_largo: Separación entre golpes al largo (default 0)
        work_order_id: ID de la OT (para overrides específicos)
        override_values: Dict de {work_order_id: valor} para casos especiales

    Returns:
        Largura HC en mm o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hm)
    sep_largo = _safe_float(separacion_golpes_largo) or 0

    if largura is None or not golpes_largo or not tipo_carton or not proceso:
        return "N/A"

    # Verificar overrides específicos por OT
    if override_values and work_order_id in override_values:
        return override_values[work_order_id]

    # Caso especial: CORRUGADO
    if proceso == "CORRUGADO":
        return largura

    # Caso especial: S/PROCESO
    if proceso == "S/PROCESO":
        return largura * golpes_largo

    # Calcular suma según tipo de cartón y proceso
    suma = 10  # Default

    if proceso in PROCESOS_DIECUTTER and tipo_carton in CARTONES_SIMPLES:
        suma = 20
    elif proceso in PROCESOS_DIECUTTER and tipo_carton in CARTONES_DOBLES:
        suma = 25
    elif proceso in PROCESOS_OFFSET:
        suma = 24

    # Fórmula principal
    largura_hc = (largura * golpes_largo) + ((golpes_largo - 1) * sep_largo) + suma

    return largura_hc


def calcular_anchura_hc(
    anchura_hm: Optional[float],
    golpes_ancho: Optional[int],
    tipo_carton: Optional[str],
    proceso: Optional[str],
    separacion_golpes_ancho: Optional[float] = None,
    work_order_id: Optional[int] = None,
    override_values: Optional[Dict[int, float]] = None
) -> Union[float, str]:
    """
    Calcula la Anchura HC.

    Fórmula Laravel (líneas 447-516):
        (Anchura HM * Golpes al ancho) + suma + ((Golpes Ancho - 1) * separacion_golpes_ancho)

        Donde suma depende de:
        - DIECUTTER/FLEXO + cartón simple: +20
        - DIECUTTER/FLEXO + cartón doble: +25
        - OFFSET + cualquier cartón: +24
        - Otros: +0 (diferente a largura que es +10)

        Casos especiales:
        - CORRUGADO: anchura_hc = anchura_hm
        - S/PROCESO: anchura_hc = anchura_hm * golpes_ancho

    Args:
        anchura_hm: Anchura HM en mm
        golpes_ancho: Número de golpes al ancho
        tipo_carton: Tipo de cartón (SIMPLES, DOBLES, etc.)
        proceso: Descripción del proceso
        separacion_golpes_ancho: Separación entre golpes al ancho (default 0)
        work_order_id: ID de la OT (para overrides específicos)
        override_values: Dict de {work_order_id: valor} para casos especiales

    Returns:
        Anchura HC en mm o "N/A" si faltan datos
    """
    anchura = _safe_float(anchura_hm)
    sep_ancho = _safe_float(separacion_golpes_ancho) or 0

    if anchura is None or not golpes_ancho or not tipo_carton or not proceso:
        return "N/A"

    # Verificar overrides específicos por OT
    if override_values and work_order_id in override_values:
        return override_values[work_order_id]

    # Caso especial: CORRUGADO
    if proceso == "CORRUGADO":
        return anchura

    # Caso especial: S/PROCESO
    if proceso == "S/PROCESO":
        return anchura * golpes_ancho

    # Calcular suma según tipo de cartón y proceso
    suma = 0  # Default para anchura (diferente a largura)

    if proceso in PROCESOS_DIECUTTER and tipo_carton in CARTONES_SIMPLES:
        suma = 20
    elif proceso in PROCESOS_DIECUTTER and tipo_carton in CARTONES_DOBLES:
        suma = 25
    elif proceso in PROCESOS_OFFSET:
        suma = 24

    # Fórmula principal
    anchura_hc = (anchura * golpes_ancho) + ((golpes_ancho - 1) * sep_ancho) + suma

    return anchura_hc


# =============================================================================
# CÁLCULOS DE PESO
# Fuente Laravel: app/WorkOrder.php líneas 553-580
# =============================================================================

def calcular_peso_bruto(
    area_hc: Union[float, str],
    gramaje_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Peso Bruto.

    Fórmula Laravel (líneas 554-560):
        Área HC unitario * Gramaje / 1000

    Args:
        area_hc: Área HC unitaria calculada
        gramaje_carton: Gramaje del cartón (g/m²)

    Returns:
        Peso bruto en kg o "N/A" si faltan datos
    """
    area = _safe_float(area_hc)
    gramaje = _safe_float(gramaje_carton)

    if area is None or gramaje is None:
        return "N/A"

    return (area * gramaje) / 1000


def calcular_peso_neto(
    area_producto: Union[float, str],
    gramaje_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Peso Neto.

    Fórmula Laravel (líneas 562-570):
        Área producto * Gramaje / 1000

    Args:
        area_producto: Área del producto
        gramaje_carton: Gramaje del cartón (g/m²)

    Returns:
        Peso neto en kg o "N/A" si faltan datos
    """
    area = _safe_float(area_producto)
    gramaje = _safe_float(gramaje_carton)

    if area is None or gramaje is None:
        return "N/A"

    return (area * gramaje) / 1000


def calcular_peso_esquinero(
    largura_hm: Optional[float],
    gramaje_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Peso Esquinero.

    Fórmula Laravel (líneas 573-580):
        Largura HM * Gramaje / 1000000

    Args:
        largura_hm: Largura HM en mm
        gramaje_carton: Gramaje del cartón (g/m²)

    Returns:
        Peso esquinero en kg o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hm)
    gramaje = _safe_float(gramaje_carton)

    if largura is None or gramaje is None:
        return "N/A"

    return (largura * gramaje) / 1000000


# =============================================================================
# CÁLCULOS DE VOLUMEN
# Fuente Laravel: app/WorkOrder.php líneas 581-598
# =============================================================================

def calcular_volumen_unitario(
    largura_hc: Union[float, str],
    anchura_hc: Union[float, str],
    espesor_carton: Optional[float],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el Volumen Unitario.

    Fórmula Laravel (líneas 582-589):
        (Largura HC * Anchura HC * Espesor Cartón / (Golpes Largo * Golpes Ancho)) / 1000

    Args:
        largura_hc: Largura HC calculada
        anchura_hc: Anchura HC calculada
        espesor_carton: Espesor del cartón en mm
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Volumen unitario en cm³ o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hc)
    anchura = _safe_float(anchura_hc)
    espesor = _safe_float(espesor_carton)

    if largura is None or anchura is None or espesor is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((largura * anchura * espesor) / (golpes_largo * golpes_ancho)) / 1000


# =============================================================================
# CÁLCULOS DE UMA
# Fuente Laravel: app/WorkOrder.php líneas 600-617
# =============================================================================

def calcular_uma_area(area_hc: Union[float, str]) -> Union[float, str]:
    """
    Calcula UMA por Área.

    Fórmula Laravel (líneas 601-608):
        Área HC unitario * 1000

    Args:
        area_hc: Área HC unitaria calculada

    Returns:
        UMA área o "N/A" si faltan datos
    """
    area = _safe_float(area_hc)

    if area is None:
        return "N/A"

    return area * 1000


def calcular_uma_peso(peso_bruto: Union[float, str]) -> Union[float, str]:
    """
    Calcula UMA por Peso.

    Fórmula Laravel (líneas 610-617):
        Peso bruto * 1000

    Args:
        peso_bruto: Peso bruto calculado

    Returns:
        UMA peso o "N/A" si faltan datos
    """
    peso = _safe_float(peso_bruto)

    if peso is None:
        return "N/A"

    return peso * 1000


# =============================================================================
# CÁLCULOS DE CONSUMO
# Fuente Laravel: app/WorkOrder.php líneas 618-755
# =============================================================================

def calcular_consumo_tinta(
    area_hm: Union[float, str],
    porcentaje_impresion: Optional[float],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el consumo de tinta (genérico para impresión 1-7).

    Fórmula Laravel (líneas 618-687):
        (Área HM * % impresión * CONSUMO_TINTA / 100) * (Golpes Largo * Golpes Ancho)

    Args:
        area_hm: Área HM calculada
        porcentaje_impresion: Porcentaje de impresión (0-100)
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Consumo de tinta o "N/A" si faltan datos
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_impresion)

    if area is None or porcentaje is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((area * porcentaje * CONSUMO_TINTA) / 100) * (golpes_largo * golpes_ancho)


def calcular_consumo_barniz_uv(
    area_hm: Union[float, str],
    porcentaje_barniz_uv: Optional[float],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el consumo de barniz UV.

    Fórmula Laravel (líneas 689-697):
        (Área HM * % barniz UV * CONSUMO_BARNIZ_UV / 100) * (Golpes Largo * Golpes Ancho)

    Args:
        area_hm: Área HM calculada
        porcentaje_barniz_uv: Porcentaje de barniz UV (0-100)
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Consumo de barniz UV o "N/A" si faltan datos
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_barniz_uv)

    if area is None or porcentaje is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((area * porcentaje * CONSUMO_BARNIZ_UV) / 100) * (golpes_largo * golpes_ancho)


def calcular_consumo_color_interno(
    area_hm: Union[float, str],
    porcentaje_color_interno: Optional[float]
) -> Union[float, str]:
    """
    Calcula el consumo de color interno.

    Fórmula Laravel (líneas 699-706):
        Área HM * % color interno * CONSUMO_TINTA / 100

    NOTA: Este NO multiplica por golpes (diferente a consumo_tinta).
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_color_interno)

    if area is None or porcentaje is None:
        return "N/A"

    return (area * porcentaje * CONSUMO_TINTA) / 100


def calcular_consumo_pegado(
    longitud_pegado: Optional[float],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el consumo de pegado.

    Fórmula Laravel (líneas 708-715):
        Longitud del pegado / 1000 * CONSUMO_ADHESIVO * Golpes Largo * Golpes Ancho

    Args:
        longitud_pegado: Longitud del pegado en mm
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Consumo de pegado o "N/A" si faltan datos
    """
    longitud = _safe_float(longitud_pegado)

    if longitud is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return (longitud / 1000) * CONSUMO_ADHESIVO * golpes_largo * golpes_ancho


def calcular_consumo_cera_interior(
    area_hm: Union[float, str],
    porcentaje_cera: Optional[float],
    coverage_internal_id: Optional[int],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el consumo de cera interior.

    Fórmula Laravel (líneas 717-724):
        (Área HM * % cera interior * CONSUMO_CERA / 100) * (Golpes Largo * Golpes Ancho)
        Solo si coverage_internal_id == 2 (cera)

    Args:
        area_hm: Área HM calculada
        porcentaje_cera: Porcentaje de cobertura de cera
        coverage_internal_id: ID del tipo de recubrimiento interno (2 = cera)
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Consumo de cera interior o "N/A" si faltan datos o no aplica
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_cera)

    if area is None or porcentaje is None:
        return "N/A"
    if coverage_internal_id != 2:  # Solo aplica para cera
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((area * porcentaje * CONSUMO_CERA) / 100) * (golpes_largo * golpes_ancho)


def calcular_consumo_cera_exterior(
    area_hm: Union[float, str],
    porcentaje_cera: Optional[float],
    coverage_external_id: Optional[int],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula el consumo de cera exterior.

    Fórmula Laravel (líneas 726-733):
        (Área HM * % cera exterior * CONSUMO_CERA / 100) * (Golpes Largo * Golpes Ancho)
        Solo si coverage_external_id == 2 (cera)
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_cera)

    if area is None or porcentaje is None:
        return "N/A"
    if coverage_external_id != 2:  # Solo aplica para cera
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return ((area * porcentaje * CONSUMO_CERA) / 100) * (golpes_largo * golpes_ancho)


def calcular_consumo_barniz_hidropelente(
    area_hm: Union[float, str],
    porcentaje_barniz_interior: Optional[float]
) -> Union[float, str]:
    """
    Calcula el consumo de barniz hidropelente.

    Fórmula Laravel (líneas 735-742):
        Área HM * % barniz interior * CONSUMO_HIDROPELENTE / 100

    NOTA: Este NO multiplica por golpes.
    """
    area = _safe_float(area_hm)
    porcentaje = _safe_float(porcentaje_barniz_interior)

    if area is None or porcentaje is None:
        return "N/A"

    return (area * porcentaje * CONSUMO_HIDROPELENTE) / 100


def calcular_gramos_adhesivo(
    longitud_pegado: Optional[float],
    golpes_largo: Optional[int],
    golpes_ancho: Optional[int]
) -> Union[float, str]:
    """
    Calcula los gramos de adhesivo.

    Fórmula Laravel (líneas 744-755):
        (Longitud del pegado / 1000) * CONSUMO_ADHESIVO * (Golpes Largo * Golpes Ancho)

    Args:
        longitud_pegado: Longitud del pegado en mm
        golpes_largo: Número de golpes al largo
        golpes_ancho: Número de golpes al ancho

    Returns:
        Gramos de adhesivo o "N/A" si faltan datos
    """
    longitud = _safe_float(longitud_pegado)

    if longitud is None:
        return "N/A"
    if not golpes_largo or not golpes_ancho:
        return "N/A"

    return (longitud / 1000) * CONSUMO_ADHESIVO * (golpes_largo * golpes_ancho)


# =============================================================================
# CÁLCULOS DE RECORTE
# Fuente Laravel: app/WorkOrder.php líneas 517-537
# =============================================================================

def calcular_recorte_caracteristico(
    largura_hm: Optional[float],
    anchura_hm: Optional[float],
    area_producto: Union[float, str],
    recorte_adicional: Union[float, str],
    proceso: Optional[str] = None
) -> Union[float, str]:
    """
    Calcula el Recorte Característico.

    Fórmula Laravel (líneas 518-537):
        ((Largura HM * Anchura HM) / 1000000) - Área Producto - Recorte Adicional

        Caso especial: Si proceso = S/PROCESO, retorna 0

    Args:
        largura_hm: Largura HM en mm
        anchura_hm: Anchura HM en mm
        area_producto: Área del producto
        recorte_adicional: Recorte adicional
        proceso: Descripción del proceso (opcional)

    Returns:
        Recorte característico o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hm)
    anchura = _safe_float(anchura_hm)
    area = _safe_float(area_producto)
    recorte = _safe_float(recorte_adicional)

    if largura is None or anchura is None or area is None or recorte is None:
        return "N/A"

    # Caso especial S/PROCESO
    if proceso == "S/PROCESO":
        return 0

    return round(((largura * anchura) / 1000000) - area - recorte, 7)


# =============================================================================
# CÁLCULOS SEMIELABORADO
# Fuente Laravel: app/WorkOrder.php líneas 837-891
# =============================================================================

def calcular_peso_bruto_semielaborado(
    area_hc_semielaborado: Union[float, str],
    gramaje_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Peso Bruto para Semielaborado.

    Fórmula Laravel (líneas 837-850):
        (Área HC Semielaborado * Gramaje) / 1000

    Args:
        area_hc_semielaborado: Área HC semielaborado calculada
        gramaje_carton: Gramaje del cartón (g/m²)

    Returns:
        Peso bruto semielaborado en kg o "N/A" si faltan datos
    """
    area = _safe_float(area_hc_semielaborado)
    gramaje = _safe_float(gramaje_carton)

    if area is None or gramaje is None:
        return "N/A"

    return (area * gramaje) / 1000


def calcular_peso_neto_semielaborado(
    area_hc_semielaborado: Union[float, str],
    gramaje_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Peso Neto para Semielaborado.

    Fórmula Laravel (líneas 853-860):
        (Área HC Semielaborado * Gramaje) / 1000

    NOTA: En Laravel, peso_neto_semielaborado usa la misma fórmula que peso_bruto_semielaborado.

    Args:
        area_hc_semielaborado: Área HC semielaborado calculada
        gramaje_carton: Gramaje del cartón (g/m²)

    Returns:
        Peso neto semielaborado en kg o "N/A" si faltan datos
    """
    return calcular_peso_bruto_semielaborado(area_hc_semielaborado, gramaje_carton)


def calcular_volumen_unitario_semielaborado(
    largura_hc: Union[float, str],
    anchura_hc: Union[float, str],
    espesor_carton: Optional[float]
) -> Union[float, str]:
    """
    Calcula el Volumen Unitario para Semielaborado.

    Fórmula Laravel (líneas 863-872):
        (Largura HC * Anchura HC * Espesor Cartón) / 1000

    NOTA: A diferencia del volumen_unitario normal, este NO divide por golpes.

    Args:
        largura_hc: Largura HC calculada
        anchura_hc: Anchura HC calculada
        espesor_carton: Espesor del cartón en mm

    Returns:
        Volumen unitario semielaborado en cm³ o "N/A" si faltan datos
    """
    largura = _safe_float(largura_hc)
    anchura = _safe_float(anchura_hc)
    espesor = _safe_float(espesor_carton)

    if largura is None or anchura is None or espesor is None:
        return "N/A"

    return (largura * anchura * espesor) / 1000


def calcular_uma_area_semielaborado(
    area_hc_semielaborado: Union[float, str]
) -> Union[float, str]:
    """
    Calcula UMA por Área para Semielaborado.

    Fórmula Laravel (líneas 875-882):
        Área HC Semielaborado * 1000

    Args:
        area_hc_semielaborado: Área HC semielaborado calculada

    Returns:
        UMA área semielaborado o "N/A" si faltan datos
    """
    area = _safe_float(area_hc_semielaborado)

    if area is None:
        return "N/A"

    return area * 1000


def calcular_uma_peso_semielaborado(
    peso_bruto_semielaborado: Union[float, str]
) -> Union[float, str]:
    """
    Calcula UMA por Peso para Semielaborado.

    Fórmula Laravel (líneas 884-891):
        Peso Bruto Semielaborado * 1000

    Args:
        peso_bruto_semielaborado: Peso bruto semielaborado calculado

    Returns:
        UMA peso semielaborado o "N/A" si faltan datos
    """
    peso = _safe_float(peso_bruto_semielaborado)

    if peso is None:
        return "N/A"

    return peso * 1000


# =============================================================================
# FUNCIÓN PRINCIPAL DE CÁLCULO
# =============================================================================

def calcular_todos(work_order_data: Dict[str, Any], carton_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcula todos los valores derivados para una WorkOrder.

    Args:
        work_order_data: Diccionario con datos de la WorkOrder
        carton_data: Diccionario con datos del cartón (peso, espesor, tipo)

    Returns:
        Diccionario con todos los valores calculados
    """
    # Extraer datos básicos
    largura_hm = work_order_data.get("largura_hm")
    anchura_hm = work_order_data.get("anchura_hm")
    golpes_largo = work_order_data.get("golpes_largo")
    golpes_ancho = work_order_data.get("golpes_ancho")
    tipo_carton = carton_data.get("tipo")
    proceso = work_order_data.get("proceso_descripcion")
    gramaje = carton_data.get("peso")
    espesor = carton_data.get("espesor")
    area_producto = work_order_data.get("area_producto")

    # Calcular dimensiones HC
    largura_hc = calcular_largura_hc(
        largura_hm, golpes_largo, tipo_carton, proceso,
        work_order_data.get("separacion_golpes_largo")
    )
    anchura_hc = calcular_anchura_hc(
        anchura_hm, golpes_ancho, tipo_carton, proceso,
        work_order_data.get("separacion_golpes_ancho")
    )

    # Calcular áreas
    area_hm = calcular_area_hm(largura_hm, anchura_hm)
    area_hc = calcular_area_hc(largura_hc, anchura_hc, golpes_largo, golpes_ancho)

    # Calcular pesos
    peso_bruto = calcular_peso_bruto(area_hc, gramaje)
    peso_neto = calcular_peso_neto(area_producto, gramaje)

    # Calcular volumen
    volumen_unitario = calcular_volumen_unitario(
        largura_hc, anchura_hc, espesor, golpes_largo, golpes_ancho
    )

    # Calcular UMA
    uma_area = calcular_uma_area(area_hc)
    uma_peso = calcular_uma_peso(peso_bruto)

    return {
        # Dimensiones
        "largura_hc": largura_hc,
        "anchura_hc": anchura_hc,

        # Áreas
        "area_hm": area_hm,
        "area_hc": area_hc,
        "area_hc_semielaborado": calcular_area_hc_semielaborado(
            largura_hc, anchura_hc, golpes_largo, golpes_ancho
        ),
        "area_esquinero": calcular_area_esquinero(largura_hm, anchura_hm),

        # Pesos
        "peso_bruto": peso_bruto,
        "peso_neto": peso_neto,
        "peso_esquinero": calcular_peso_esquinero(largura_hm, gramaje),

        # Volumen
        "volumen_unitario": volumen_unitario,

        # UMA
        "uma_area": uma_area,
        "uma_peso": uma_peso,

        # Semielaborado (Laravel líneas 837-891)
        "peso_bruto_semielaborado": calcular_peso_bruto_semielaborado(
            calcular_area_hc_semielaborado(largura_hc, anchura_hc, golpes_largo, golpes_ancho),
            gramaje
        ),
        "peso_neto_semielaborado": calcular_peso_neto_semielaborado(
            calcular_area_hc_semielaborado(largura_hc, anchura_hc, golpes_largo, golpes_ancho),
            gramaje
        ),
        "volumen_unitario_semielaborado": calcular_volumen_unitario_semielaborado(
            largura_hc, anchura_hc, espesor
        ),
        "uma_area_semielaborado": calcular_uma_area_semielaborado(
            calcular_area_hc_semielaborado(largura_hc, anchura_hc, golpes_largo, golpes_ancho)
        ),
        "uma_peso_semielaborado": calcular_uma_peso_semielaborado(
            calcular_peso_bruto_semielaborado(
                calcular_area_hc_semielaborado(largura_hc, anchura_hc, golpes_largo, golpes_ancho),
                gramaje
            )
        ),

        # Consumos de tinta (1-7)
        "consumo_1": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_1"), golpes_largo, golpes_ancho
        ),
        "consumo_2": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_2"), golpes_largo, golpes_ancho
        ),
        "consumo_3": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_3"), golpes_largo, golpes_ancho
        ),
        "consumo_4": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_4"), golpes_largo, golpes_ancho
        ),
        "consumo_5": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_5"), golpes_largo, golpes_ancho
        ),
        "consumo_6": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_6"), golpes_largo, golpes_ancho
        ),
        "consumo_7": calcular_consumo_tinta(
            area_hm, work_order_data.get("impresion_7"), golpes_largo, golpes_ancho
        ),

        # Otros consumos
        "consumo_barniz_uv": calcular_consumo_barniz_uv(
            area_hm, work_order_data.get("porcentanje_barniz_uv"), golpes_largo, golpes_ancho
        ),
        "consumo_color_interno": calcular_consumo_color_interno(
            area_hm, work_order_data.get("impresion_color_interno")
        ),
        "consumo_pegado": calcular_consumo_pegado(
            work_order_data.get("longitud_pegado"), golpes_largo, golpes_ancho
        ),
        "consumo_cera_interior": calcular_consumo_cera_interior(
            area_hm, work_order_data.get("percentage_coverage_internal"),
            work_order_data.get("coverage_internal_id"), golpes_largo, golpes_ancho
        ),
        "consumo_cera_exterior": calcular_consumo_cera_exterior(
            area_hm, work_order_data.get("percentage_coverage_external"),
            work_order_data.get("coverage_external_id"), golpes_largo, golpes_ancho
        ),
        "consumo_barniz_hidropelente": calcular_consumo_barniz_hidropelente(
            area_hm, work_order_data.get("porcentaje_barniz_interior")
        ),
        "gramos_adhesivo": calcular_gramos_adhesivo(
            work_order_data.get("longitud_pegado"), golpes_largo, golpes_ancho
        ),

        # Recorte
        "recorte_caracteristico": calcular_recorte_caracteristico(
            largura_hm, anchura_hm, area_producto,
            work_order_data.get("recorte_adicional"), proceso
        ),
    }
