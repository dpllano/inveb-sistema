"""
Router para cálculo de Área HC y Cartón.
Endpoints para opciones de formulario y cálculo.

Basado en: AreahcController.php y CalculosAreahcHelpers.php
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pymysql
import pymysql.cursors
import os
import logging
import math
from decimal import Decimal

logger = logging.getLogger(__name__)


def to_float(value) -> float:
    """Convierte Decimal, int o None a float"""
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)

router = APIRouter(prefix="/areahc", tags=["Área HC y Cartón"])


# =============================================
# CONEXIÓN A BASE DE DATOS
# =============================================

def get_db_connection():
    """Obtiene conexión a MySQL con DictCursor"""
    return pymysql.connect(
        host=os.getenv("LARAVEL_MYSQL_HOST", os.getenv("MYSQL_HOST", "127.0.0.1")),
        port=int(os.getenv("LARAVEL_MYSQL_PORT", os.getenv("MYSQL_PORT", "3306"))),
        user=os.getenv("LARAVEL_MYSQL_USER", os.getenv("MYSQL_USER", "envases")),
        password=os.getenv("LARAVEL_MYSQL_PASSWORD", os.getenv("MYSQL_PASSWORD", "secret")),
        database=os.getenv("MYSQL_DATABASE", "envases_ot"),
        cursorclass=pymysql.cursors.DictCursor
    )


# =============================================
# SCHEMAS
# =============================================

class CalculoAreaHCRequest(BaseModel):
    """Request para cálculo de Área HC y Cartón"""
    tipo_calculo: int  # 1=Completo, 2=Cálculo HC, 3=Cartón

    # Medidas internas (para Cálculo HC)
    interno_largo: Optional[float] = None
    interno_ancho: Optional[float] = None
    interno_alto: Optional[float] = None

    # Selects
    style_id: Optional[int] = None
    onda_id: Optional[int] = None
    areahc_product_type_id: Optional[int] = None
    process_id: Optional[int] = None
    rubro_id: Optional[int] = None
    envase_id: Optional[int] = None

    # Campos adicionales
    traslape: Optional[float] = 0
    prepicado_ventilacion: Optional[int] = 0
    contenido_caja: Optional[float] = None
    areahc_pallets_apilados: Optional[int] = None
    cajas_apiladas_por_pallet: Optional[int] = None
    filas_columnares_por_pallet: Optional[int] = None
    numero_colores: Optional[int] = 0

    # Para Cartón
    carton_color: Optional[int] = None  # 1=Café, 2=Blanco
    rmt: Optional[float] = None  # RMT ingresado manualmente
    ect_min_ingresado: Optional[float] = None  # ECT ingresado manualmente


class CalculoAreaHCResponse(BaseModel):
    """Response del cálculo"""
    success: bool
    externo_largo: Optional[float] = None
    externo_ancho: Optional[float] = None
    externo_alto: Optional[float] = None
    areahc: Optional[float] = None
    rmt: Optional[Any] = None  # Puede ser "-" o número
    ect_min: Optional[Any] = None  # Puede ser "-" o número
    codigo_carton_id: Optional[int] = None
    codigo_carton: Optional[str] = None
    ect_min_carton: Optional[float] = None
    error: Optional[str] = None


# =============================================
# FUNCIONES DE CÁLCULO
# =============================================

def caja_entera(estilo: int) -> int:
    """Determina si es caja entera según el estilo"""
    if estilo in [2, 3, 4, 12]:
        return 1
    return 0


def get_factor_desarrollo(conn, onda_id: int, caja_entera_val: int) -> Dict:
    """Obtiene factor de desarrollo desde la BD"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT externo_largo, externo_ancho, externo_alto, d1, d2, dh
        FROM factores_desarrollos
        WHERE onda_id = %s AND caja_entera = %s
        LIMIT 1
    """, (onda_id, caja_entera_val))
    result = cursor.fetchone()
    cursor.close()
    return result or {}


def externo_largo(conn, interno_largo: float, estilo: int, onda: int) -> float:
    """Calcula largo exterior"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return interno_largo + to_float(factor.get('externo_largo', 0))


def externo_ancho(conn, interno_ancho: float, estilo: int, onda: int) -> float:
    """Calcula ancho exterior"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return interno_ancho + to_float(factor.get('externo_ancho', 0))


def externo_alto(conn, interno_alto: float, estilo: int, onda: int) -> float:
    """Calcula alto exterior"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return interno_alto + to_float(factor.get('externo_alto', 0))


def get_d1(conn, estilo: int, onda: int) -> float:
    """Obtiene D1 del factor de desarrollo"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return to_float(factor.get('d1', 0))


def get_d2(conn, estilo: int, onda: int) -> float:
    """Obtiene D2 del factor de desarrollo"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return to_float(factor.get('d2', 0))


def get_dh(conn, estilo: int, onda: int) -> float:
    """Obtiene DH del factor de desarrollo"""
    caja_entera_val = caja_entera(estilo)
    factor = get_factor_desarrollo(conn, onda, caja_entera_val)
    return to_float(factor.get('dh', 0))


def largura_hm(conn, estilo: int, onda: int, interno_largo: float, interno_ancho: float) -> float:
    """Calcula largura de hoja madre"""
    d1 = get_d1(conn, estilo, onda)
    d2 = get_d2(conn, estilo, onda)

    # BE=2, CE=5
    if onda in [2, 5]:
        return (interno_largo + interno_ancho) * 2 + (d1 + d2) * 2 + 35
    else:
        return (interno_largo + interno_ancho) * 2 + (d1 + d2) * 2 + 30


def golpes_largo(largurahm: float, proceso: int) -> int:
    """Calcula golpes al largo"""
    largo_minimo = 800
    # Diecutter o diecutter con proceso/pegado
    if proceso in [2, 4, 6]:
        return math.ceil(largo_minimo / largurahm)
    return 1


def orilla_largo(proceso: int) -> int:
    """Calcula orilla al largo"""
    if proceso in [2, 4, 6]:
        return 25
    return 10


def largo_hc(largurahm: float, golpes: int, orilla: int) -> float:
    """Calcula largo HC"""
    return largurahm * golpes + orilla


def anchura_hm(conn, estilo: int, onda: int, interno_ancho: float, interno_alto: float, traslape: float) -> float:
    """Calcula anchura de hoja madre según estilo"""
    d2 = get_d2(conn, estilo, onda)
    dh = get_dh(conn, estilo, onda)

    # Aletas según estilo - IMPORTANTE: La fórmula de aleta1 es (floor(X) / 2), no floor(X / 2)
    # Esto replica exactamente el comportamiento de Laravel:
    # $aleta1 = (floor($interno_ancho + $d2) / 2);
    aleta1 = math.floor(interno_ancho + d2) / 2
    aleta2 = math.floor(((interno_ancho + d2) / 2) + (traslape / 2))
    aleta3 = interno_ancho
    aleta4 = aleta2

    estilo_map = {
        2: aleta1 * 2 + (interno_alto + dh),  # 201
        1: aleta1 + (interno_alto + dh),      # 200
        3: aleta2 * 2 + (interno_alto + dh),  # 202
        14: aleta2 + (interno_alto + dh),     # 221
        4: aleta3 * 2 + (interno_alto + dh),  # 203
        15: aleta3 + (interno_alto + dh),     # 222
        12: aleta4 * 2 + (interno_alto + dh), # 216
        16: aleta4 + (interno_alto + dh),     # 223
    }

    return estilo_map.get(estilo, 0)


def golpes_ancho(anchurahm: float, proceso: int) -> int:
    """Calcula golpes al ancho"""
    ancho_minimo = 500
    if proceso in [2, 4, 6]:
        return math.ceil(ancho_minimo / anchurahm)
    return 1


def orilla_ancho(proceso: int) -> int:
    """Calcula orilla al ancho"""
    if proceso in [2, 4, 6]:
        return 25
    return 0


def ancho_hc(anchurahm: float, golpes: int, orilla: int) -> float:
    """Calcula ancho HC"""
    return anchurahm * golpes + orilla


def area_hc(conn, estilo: int, onda: int, interno_largo: float, interno_ancho: float,
            interno_alto: float, proceso: int, traslape: float) -> float:
    """Calcula área de hoja corrugada"""
    # Cálculos al largo
    largurahm = largura_hm(conn, estilo, onda, interno_largo, interno_ancho)
    golpes_l = golpes_largo(largurahm, proceso)
    orilla_l = orilla_largo(proceso)
    largohc = largo_hc(largurahm, golpes_l, orilla_l)

    # Cálculos al ancho
    anchurahm = anchura_hm(conn, estilo, onda, interno_ancho, interno_alto, traslape)
    golpes_a = golpes_ancho(anchurahm, proceso)
    orilla_a = orilla_ancho(proceso)
    anchohc = ancho_hc(anchurahm, golpes_a, orilla_a)

    # Área HC = (largo * ancho) / (golpes_largo * golpes_ancho) / 1000000
    return ((largohc * anchohc) / (golpes_a * golpes_l)) / 1000000


def get_rubro(conn, rubro_id: int) -> Dict:
    """Obtiene datos del rubro"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM rubros WHERE id = %s", (rubro_id,))
    result = cursor.fetchone()
    cursor.close()
    return result or {}


def get_style(conn, style_id: int) -> Dict:
    """Obtiene datos del estilo"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM styles WHERE id = %s", (style_id,))
    result = cursor.fetchone()
    cursor.close()
    return result or {}


def get_onda(conn, onda_id: int) -> Dict:
    """Obtiene datos de la onda"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tipo_ondas WHERE id = %s", (onda_id,))
    result = cursor.fetchone()
    cursor.close()
    return result or {}


def area_hm(largurahm: float, anchurahm: float) -> float:
    """Calcula área de hoja madre"""
    return (largurahm * anchurahm) / 1000000


def peso_caja_estimado(conn, rubro_id: int, style_id: int, onda_id: int,
                       interno_largo: float, interno_ancho: float,
                       interno_alto: float, traslape: float) -> float:
    """Calcula peso estimado de la caja"""
    rubro = get_rubro(conn, rubro_id)
    estilo = get_style(conn, style_id)

    gramaje = to_float(rubro.get('gramaje', 0))
    factor_peso = to_float(estilo.get('factor_peso', 1)) or 1.0

    largurahm = largura_hm(conn, style_id, onda_id, interno_largo, interno_ancho)
    anchurahm = anchura_hm(conn, style_id, onda_id, interno_ancho, interno_alto, traslape)
    areahm = area_hm(largurahm, anchurahm)

    return gramaje * factor_peso * areahm


def get_factor_seguridad(conn, rubro_id: int, envase_id: int) -> float:
    """Obtiene factor de seguridad"""
    # 19 = deshidratados
    if rubro_id == 19:
        return 4.0

    cursor = conn.cursor()
    cursor.execute("""
        SELECT factor_seguridad
        FROM factores_seguridads
        WHERE rubro_id = %s AND envase_id = %s
        LIMIT 1
    """, (rubro_id, envase_id))
    result = cursor.fetchone()
    cursor.close()

    return to_float(result.get('factor_seguridad', 1)) if result else 1.0


def factor_ect(product_type_id: int) -> float:
    """Calcula factor ECT según tipo de producto"""
    if product_type_id == 5:  # TAPA
        return 48 / (48 + 70)
    elif product_type_id == 4:  # FONDO
        return 70 / (48 + 70)
    return 1  # CAJAS / UNA PIEZA


def rmt_trabado(filas_columnares_por_pallet: int, factor_ect_val: float,
                factor_seguridad: float, peso_caja: float, contenido_cajas: float,
                cajas_apiladas_por_pallet: int, pallets_apilados: int,
                ext_largo: float, ext_ancho: float) -> float:
    """Calcula RMT trabado"""
    if filas_columnares_por_pallet == 0:
        filas_columnares_por_pallet = 1

    return (factor_ect_val * factor_seguridad * 2.2 * 1 / 0.55 *
            ((peso_caja + contenido_cajas) *
             (cajas_apiladas_por_pallet - filas_columnares_por_pallet) *
             pallets_apilados + 24.22 * ((ext_largo * ext_ancho) / 1200000) *
             (pallets_apilados - 1)))


def rmt_columnar(factor_seguridad: float, peso_caja: float, contenido_cajas: float,
                 cajas_apiladas_por_pallet: int, pallets_apilados: int,
                 ext_largo: float, ext_ancho: float) -> float:
    """Calcula RMT columnar"""
    return (factor_seguridad * 2.2 *
            ((peso_caja + contenido_cajas) *
             (cajas_apiladas_por_pallet - 1) * pallets_apilados +
             24.22 * ((ext_largo * ext_ancho) / 1200000) *
             (pallets_apilados - 1)))


def calcular_rmt(conn, rmt_ingresado: Optional[float], rubro_id: int, style_id: int,
                 onda_id: int, envase_id: int, interno_largo: float, interno_ancho: float,
                 interno_alto: float, traslape: float, product_type_id: int,
                 filas_columnares_por_pallet: int, contenido_cajas: float,
                 cajas_apiladas_por_pallet: int, pallets_apilados: int) -> Any:
    """Calcula RMT"""
    # 18 = rubro de vinos
    if rubro_id == 18 or rmt_ingresado is not None:
        return "-"

    peso_caja = peso_caja_estimado(conn, rubro_id, style_id, onda_id,
                                    interno_largo, interno_ancho, interno_alto, traslape)
    factor_seg = get_factor_seguridad(conn, rubro_id, envase_id)
    factor_ect_val = factor_ect(product_type_id)
    ext_largo = externo_largo(conn, interno_largo, style_id, onda_id)
    ext_ancho = externo_ancho(conn, interno_ancho, style_id, onda_id)

    rmt_trab = rmt_trabado(filas_columnares_por_pallet or 0, factor_ect_val, factor_seg,
                           peso_caja, contenido_cajas or 0,
                           cajas_apiladas_por_pallet or 1, pallets_apilados or 1,
                           ext_largo, ext_ancho)
    rmt_col = rmt_columnar(factor_seg, peso_caja, contenido_cajas or 0,
                           cajas_apiladas_por_pallet or 1, pallets_apilados or 1,
                           ext_largo, ext_ancho)

    return max(rmt_trab, rmt_col)


def calcular_ect_min(conn, rmt_ingresado: Optional[float], prepicado_ventilacion: int,
                     rmt_calculado: Any, onda_id: int,
                     interno_largo: float, interno_ancho: float) -> Any:
    """Calcula ECT mínimo"""
    onda = get_onda(conn, onda_id)
    espesor = to_float(onda.get('espesor_promedio', 0))
    factor_conversion = 0.0393701  # mm a in

    if prepicado_ventilacion == 1:
        return "-"

    # Valor RMT a usar
    rmt_val = rmt_ingresado if rmt_ingresado is not None else rmt_calculado

    if rmt_val == "-" or rmt_val is None:
        return "-"

    try:
        rmt_float = to_float(rmt_val)
        ect_min = pow(
            rmt_float / (6.6 * pow(espesor * factor_conversion, 0.4) *
                       pow(2 * (interno_largo * factor_conversion +
                               interno_ancho * factor_conversion), 0.3)),
            0.91
        )
        return round(ect_min, 2)
    except:
        return "-"


def tipo_adhesivo(rubro_id: int) -> str:
    """Determina tipo de adhesivo según rubro"""
    if rubro_id == 19:  # Deshidratados
        return "HIDRORESISTENTE"
    return "CORRIENTE"


def calcular_carton(conn, rubro_id: int, ect_min: Any, onda_id: int,
                    carton_color: int) -> Optional[Dict]:
    """
    Selecciona cartón según criterios.
    Usa la tabla 'cartons' (no 'cardboards') como en Laravel.
    """
    if ect_min == "-" or ect_min is None:
        return None

    tipo_adh = tipo_adhesivo(rubro_id)

    # Obtener onda
    onda = get_onda(conn, onda_id)
    onda_nombre = onda.get('onda', '') if onda else ''

    # Color: 1=Café, 2=Blanco
    # La tabla 'cartons' usa "CAFE" y "BLANCO" (mayúsculas)
    color_map = {1: "CAFE", 2: "BLANCO"}
    color_buscar = color_map.get(carton_color, "CAFE")

    cursor = conn.cursor()

    # Buscar cartón que cumpla requisitos usando tabla 'cartons'
    if tipo_adh == "HIDRORESISTENTE":
        cursor.execute("""
            SELECT id, codigo, onda, color_tapa_exterior,
                   recubrimiento, ect_min
            FROM cartons
            WHERE active = 1
              AND color_tapa_exterior = %s
              AND onda = %s
              AND recubrimiento = %s
              AND ect_min >= %s
            ORDER BY ect_min ASC
            LIMIT 1
        """, (color_buscar, onda_nombre, tipo_adh, ect_min))
    else:
        # Para CORRIENTE: buscar cartones sin filtrar por recubrimiento específico
        # pero excluyendo HIDRORESISTENTE (igual que en Laravel)
        cursor.execute("""
            SELECT id, codigo, onda, color_tapa_exterior,
                   recubrimiento, ect_min
            FROM cartons
            WHERE active = 1
              AND color_tapa_exterior = %s
              AND onda = %s
              AND ect_min >= %s
            ORDER BY ect_min ASC
        """, (color_buscar, onda_nombre, ect_min))

    cartones = cursor.fetchall()
    cursor.close()

    # Retornar el primer cartón que cumple (ya ordenado por ect_min ASC)
    if cartones:
        return cartones[0]

    return None


# =============================================
# ENDPOINTS
# =============================================

@router.get("/form-options")
async def get_form_options():
    """
    Obtiene todas las opciones para el formulario de Cálculo HC y Cartón.
    Replica exactamente los filtros de Laravel AreahcController.
    Si no hay datos con los filtros específicos, retorna todos los disponibles.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        options = {}

        # Estilos: Preferir IDs 1, 2, 3, 4, 12, 14, 15, 16, sino todos
        cursor.execute("""
            SELECT id, glosa as nombre
            FROM styles
            WHERE active = 1 AND id IN (1, 2, 3, 4, 12, 14, 15, 16)
            ORDER BY glosa
        """)
        options['styles'] = cursor.fetchall()
        if not options['styles']:
            cursor.execute("""
                SELECT id, glosa as nombre
                FROM styles
                WHERE active = 1
                ORDER BY glosa
            """)
            options['styles'] = cursor.fetchall()

        # Tipos de producto: Solo IDs 3, 4, 5 (Caja, Tapa, Fondo), sino todos
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM product_types
            WHERE active = 1 AND id IN (3, 4, 5)
            ORDER BY descripcion
        """)
        options['product_types'] = cursor.fetchall()
        if not options['product_types']:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM product_types
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['product_types'] = cursor.fetchall()

        # Procesos: Preferir todos excepto IDs 3, 4, 5, 6, 7, 8, 9
        # (En el dev DB todos tienen active=0, así que usamos fallback sin filtro)
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM processes
            WHERE active = 1 AND id NOT IN (3, 4, 5, 6, 7, 8, 9)
            ORDER BY descripcion
        """)
        options['processes'] = cursor.fetchall()
        if not options['processes']:
            # Si no hay procesos activos con el filtro, traer todos
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM processes
                ORDER BY descripcion
            """)
            options['processes'] = cursor.fetchall()

        # Rubros: Solo IDs 12, 13, 14, 18, 19, sino todos
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM rubros
            WHERE id IN (12, 13, 14, 18, 19)
            ORDER BY descripcion
        """)
        options['rubros'] = cursor.fetchall()
        if not options['rubros']:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM rubros
                ORDER BY descripcion
            """)
            options['rubros'] = cursor.fetchall()

        # Tipo de Ondas: Todos
        cursor.execute("""
            SELECT id, onda as nombre
            FROM tipo_ondas
            ORDER BY onda
        """)
        options['ondas'] = cursor.fetchall()

        # Envases: Solo IDs 1, 3, 4, 5, 7, 8, 9, sino todos
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM envases
            WHERE active = 1 AND id IN (1, 3, 4, 5, 7, 8, 9)
            ORDER BY descripcion
        """)
        options['envases'] = cursor.fetchall()
        if not options['envases']:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM envases
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['envases'] = cursor.fetchall()

        # Opciones hardcoded
        options['tipos_calculo'] = [
            {"id": 1, "nombre": "Cálculo HC y Cartón"},
            {"id": 2, "nombre": "Cálculo HC"},
            {"id": 3, "nombre": "Cartón"}
        ]

        options['colores_carton'] = [
            {"id": 1, "nombre": "Café"},
            {"id": 2, "nombre": "Blanco"}
        ]

        options['prepicado_ventilacion'] = [
            {"id": 0, "nombre": "No"},
            {"id": 1, "nombre": "Sí"}
        ]

        options['numero_colores'] = [
            {"id": i, "nombre": str(i)} for i in range(6)
        ]

        return options

    finally:
        cursor.close()
        conn.close()


@router.get("/form-options-complete")
async def get_form_options_complete():
    """
    Obtiene TODAS las opciones para el formulario de DetalleForm (Crear Detalle).
    Incluye todas las tablas necesarias para los selects del formulario.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        options = {}

        # ========== Opciones de Cálculo HC (reutilizadas) ==========

        # Tipos de producto (product_types)
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM product_types
            WHERE active = 1
            ORDER BY descripcion
        """)
        options['product_types'] = cursor.fetchall()

        # Procesos
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM processes
            ORDER BY descripcion
        """)
        options['processes'] = cursor.fetchall()

        # Rubros (excluyendo ESQUINEROS id=5, igual que Laravel)
        cursor.execute("""
            SELECT id, descripcion as nombre
            FROM rubros
            WHERE id != 5
            ORDER BY descripcion
        """)
        options['rubros'] = cursor.fetchall()

        # ========== Cartones ==========
        cursor.execute("""
            SELECT id, codigo as nombre
            FROM cartons
            WHERE active = 1
            ORDER BY codigo
        """)
        options['cartons'] = cursor.fetchall()

        # ========== Máquinas Impresoras ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM printing_machines
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['printing_machines'] = cursor.fetchall()
        except Exception:
            options['printing_machines'] = []

        # ========== Tipos de Impresión ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM print_types
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['print_types'] = cursor.fetchall()
        except Exception:
            options['print_types'] = []

        # ========== Tipos de Pegado ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM pegados
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['pegados'] = cursor.fetchall()
        except Exception:
            # Fallback hardcoded
            options['pegados'] = [
                {"id": 1, "nombre": "Sin pegado"},
                {"id": 2, "nombre": "Pegado Simple"},
                {"id": 3, "nombre": "Pegado Doble"},
            ]

        # ========== Tipos de Barniz ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM barniz_types
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['barniz_types'] = cursor.fetchall()
        except Exception:
            options['barniz_types'] = []

        # ========== Tipos de Tinta ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM ink_types
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['ink_types'] = cursor.fetchall()
        except Exception:
            options['ink_types'] = []

        # ========== Alturas de Pallet ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM pallet_heights
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['pallet_heights'] = cursor.fetchall()
        except Exception:
            options['pallet_heights'] = [
                {"id": 1, "nombre": "1.0 m"},
                {"id": 2, "nombre": "1.2 m"},
                {"id": 3, "nombre": "1.5 m"},
            ]

        # ========== Ciudades (ciudades_fletes) ==========
        # En Laravel: CiudadesFlete::pluck('ciudad', 'id')
        try:
            cursor.execute("""
                SELECT id, ciudad as nombre
                FROM ciudades_fletes
                ORDER BY orden, ciudad
            """)
            options['cities'] = cursor.fetchall()
        except Exception:
            options['cities'] = []

        # ========== Jerarquías ==========
        try:
            cursor.execute("""
                SELECT id, descripcion as nombre
                FROM hierarchies
                WHERE active = 1
                ORDER BY descripcion
            """)
            options['hierarchies'] = cursor.fetchall()
        except Exception:
            options['hierarchies'] = []

        # ========== Cartones para Esquinero ==========
        try:
            cursor.execute("""
                SELECT id, codigo as nombre
                FROM cartons_esquinero
                WHERE active = 1
                ORDER BY codigo
            """)
            options['cartons_esquinero'] = cursor.fetchall()
        except Exception:
            options['cartons_esquinero'] = []

        # ========== Servicios de Maquila ==========
        # Issue 49: El campo correcto es 'servicio', no 'descripcion' (según Laravel)
        try:
            cursor.execute("""
                SELECT id, servicio as nombre
                FROM maquila_servicios
                WHERE active = 1
                ORDER BY servicio
            """)
            options['maquila_servicios'] = cursor.fetchall()
        except Exception:
            options['maquila_servicios'] = []

        # ========== Opciones estáticas ==========
        options['pallets'] = [
            {"id": 0, "nombre": "No"},
            {"id": 1, "nombre": "Madera"},
            {"id": 2, "nombre": "Plástico"},
        ]

        options['zunchos'] = [
            {"id": 0, "nombre": "No"},
            {"id": 1, "nombre": "1 zuncho"},
            {"id": 2, "nombre": "2 zunchos"},
            {"id": 3, "nombre": "3 zunchos"},
        ]

        options['si_no'] = [
            {"id": 0, "nombre": "No"},
            {"id": 1, "nombre": "Si"},
        ]

        options['numero_colores'] = [
            {"id": i, "nombre": str(i)} for i in range(7)
        ]

        options['pallets_apilados'] = [
            {"id": 1, "nombre": "1"},
            {"id": 2, "nombre": "2"},
        ]

        options['tipo_destino_esquinero'] = [
            {"id": 1, "nombre": "Tarima Nacional"},
            {"id": 2, "nombre": "Empaque Exportación (Granel)"},
            {"id": 3, "nombre": "Tarima de Exportación"},
        ]

        options['tipo_camion_esquinero'] = [
            {"id": 1, "nombre": "Camión 7x2,6mts"},
        ]

        return options

    finally:
        cursor.close()
        conn.close()


@router.post("/calcular", response_model=CalculoAreaHCResponse)
async def calcular_area_hc(data: CalculoAreaHCRequest):
    """
    Realiza el cálculo de Área HC y/o Cartón.

    tipo_calculo:
    - 1: Cálculo completo (HC + Cartón)
    - 2: Solo Cálculo HC
    - 3: Solo Cartón
    """
    conn = get_db_connection()

    try:
        resultado = CalculoAreaHCResponse(success=True)

        tipo_calculo = data.tipo_calculo

        # Traslape solo para estilos específicos
        traslape = 0
        if data.style_id in [3, 14, 12, 16]:
            traslape = data.traslape or 0

        # Cálculo completo o solo HC
        if tipo_calculo in [1, 2]:
            # Validar campos requeridos
            if not all([data.interno_largo, data.interno_ancho, data.interno_alto,
                       data.style_id, data.onda_id, data.process_id]):
                return CalculoAreaHCResponse(
                    success=False,
                    error="Faltan campos requeridos para Cálculo HC"
                )

            resultado.externo_largo = round(
                externo_largo(conn, data.interno_largo, data.style_id, data.onda_id), 2
            )
            resultado.externo_ancho = round(
                externo_ancho(conn, data.interno_ancho, data.style_id, data.onda_id), 2
            )
            resultado.externo_alto = round(
                externo_alto(conn, data.interno_alto, data.style_id, data.onda_id), 2
            )
            resultado.areahc = round(
                area_hc(conn, data.style_id, data.onda_id, data.interno_largo,
                       data.interno_ancho, data.interno_alto, data.process_id, traslape), 3
            )

        # Cálculo completo incluye Cartón
        if tipo_calculo == 1:
            # Validar campos adicionales para cartón
            if not all([data.rubro_id, data.carton_color]):
                return CalculoAreaHCResponse(
                    success=False,
                    error="Faltan campos requeridos para Cartón"
                )

            # Calcular RMT
            resultado.rmt = calcular_rmt(
                conn, data.rmt, data.rubro_id, data.style_id, data.onda_id,
                data.envase_id or 1, data.interno_largo, data.interno_ancho,
                data.interno_alto, traslape, data.areahc_product_type_id or 3,
                data.filas_columnares_por_pallet or 0, data.contenido_caja or 0,
                data.cajas_apiladas_por_pallet or 1, data.areahc_pallets_apilados or 1
            )

            # Calcular ECT min
            resultado.ect_min = calcular_ect_min(
                conn, data.rmt, data.prepicado_ventilacion or 0, resultado.rmt,
                data.onda_id, data.interno_largo, data.interno_ancho
            )

            # Seleccionar cartón
            carton = calcular_carton(conn, data.rubro_id, resultado.ect_min,
                                     data.onda_id, data.carton_color)
            if carton:
                resultado.codigo_carton_id = carton.get('id')
                resultado.codigo_carton = carton.get('codigo')
                resultado.ect_min_carton = to_float(carton.get('ect_min'))

        # Solo Cartón
        elif tipo_calculo == 3:
            # Validar campos requeridos
            if not all([data.rubro_id, data.onda_id, data.carton_color,
                       data.ect_min_ingresado]):
                return CalculoAreaHCResponse(
                    success=False,
                    error="Faltan campos requeridos para Cartón"
                )

            # Usar ECT ingresado directamente
            resultado.ect_min = data.ect_min_ingresado

            # Seleccionar cartón
            carton = calcular_carton(conn, data.rubro_id, data.ect_min_ingresado,
                                     data.onda_id, data.carton_color)
            if carton:
                resultado.codigo_carton_id = carton.get('id')
                resultado.codigo_carton = carton.get('codigo')
                resultado.ect_min_carton = to_float(carton.get('ect_min'))

        return resultado

    except Exception as e:
        logger.error(f"Error en cálculo: {e}")
        return CalculoAreaHCResponse(success=False, error=str(e))

    finally:
        conn.close()
