"""
Router para opciones del formulario Cascade.
Provee los datos para los selectores del formulario OT.

ACTUALIZADO: Sprint G - Correccion de brechas
- Todas las opciones se leen de la base de datos
- Equivalente a WorkOrderController.php create() lineas 654-776
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union
import pymysql
import logging
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/form-options",
    tags=["Form Options"],
    responses={404: {"description": "Not found"}},
)


def get_db_connection():
    """Obtiene conexión a la base de datos de Laravel."""
    return pymysql.connect(
        host=settings.LARAVEL_MYSQL_HOST,
        port=settings.LARAVEL_MYSQL_PORT,
        user=settings.LARAVEL_MYSQL_USER,
        password=settings.LARAVEL_MYSQL_PASSWORD,
        database=settings.LARAVEL_MYSQL_DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


class SelectOption(BaseModel):
    """Modelo para opciones de selector."""
    value: Union[int, str]
    label: str
    description: Optional[str] = None


class FormOptionsResponse(BaseModel):
    """Respuesta con todas las opciones del formulario."""
    # Seccion 6 - Tipo Item
    product_types: List[SelectOption]
    impresion_types: List[SelectOption]
    fsc_options: List[SelectOption]
    cinta_options: List[SelectOption]
    coverage_internal: List[SelectOption]
    coverage_external: List[SelectOption]
    plantas: List[SelectOption]
    carton_colors: List[SelectOption]
    cartones: List[SelectOption]
    # Seccion 11 - Terminaciones
    procesos: List[SelectOption]
    armados: List[SelectOption]
    pegados: List[SelectOption]
    sentidos_armado: List[SelectOption]
    # Opciones adicionales
    maquila_servicios: List[SelectOption]
    tipo_cinta: List[SelectOption]
    trazabilidad: List[SelectOption]
    design_types: List[SelectOption]
    reference_types: List[SelectOption]
    recubrimiento_types: List[SelectOption]
    # Sprint 1 - OTs Especiales
    ajustes_area_desarrollo: List[SelectOption]
    tipos_solicitud: List[SelectOption]
    # Muestras - Salas de Corte
    salas_cortes: List[SelectOption]


# =============================================================================
# FUNCIONES QUE LEEN DE LA BASE DE DATOS
# =============================================================================

def get_product_types_from_db() -> List[SelectOption]:
    """Obtiene los tipos de producto de la base de datos.
    Fuente: ProductType::where('active', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion, codigo
            FROM product_types
            WHERE active = 1
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'] or r['codigo'], description=r.get('codigo'))
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching product_types: {e}")
        return []


def get_impresion_from_db() -> List[SelectOption]:
    """Obtiene tipos de impresión de la base de datos.
    Fuente Laravel: Impresion::where('status', 1)->whereNotIn('id', [1])->pluck('descripcion', 'id')
    IMPORTANTE: Excluye id=1 (Offset) según Laravel WorkOrderController.php:710
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM impresion
            WHERE status = 1 AND id != 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching impresion: {e}")
        return []


def get_fsc_from_db() -> List[SelectOption]:
    """Obtiene opciones FSC de la base de datos.
    Fuente Laravel: Fsc::where('active', 1)->pluck('descripcion', 'codigo')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT codigo, descripcion
            FROM fsc
            WHERE active = 1
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['codigo'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching fsc: {e}")
        return []


def get_coverage_internal_from_db() -> List[SelectOption]:
    """Obtiene opciones de recubrimiento interno de la base de datos.
    Fuente Laravel: CoverageInternal::where('status', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM coverage_internal
            WHERE status = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching coverage_internal: {e}")
        return []


def get_coverage_external_from_db() -> List[SelectOption]:
    """Obtiene opciones de recubrimiento externo de la base de datos.
    Fuente Laravel: CoverageExternal::where('status', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM coverage_external
            WHERE status = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching coverage_external: {e}")
        return []


def get_plantas_from_db() -> List[SelectOption]:
    """Obtiene plantas de la base de datos.
    Fuente Laravel: Planta::pluck('nombre', 'id')
    Nota: La tabla plantas no tiene columna 'active'
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre
            FROM plantas
            ORDER BY nombre
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['nombre'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching plantas: {e}")
        return []


def get_cartones_from_db() -> List[SelectOption]:
    """Obtiene cartones de la base de datos.
    Fuente Laravel: Carton::where('active', 1)->pluck('codigo', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, codigo, onda
            FROM cartons
            WHERE active = 1
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(
                value=r['id'],
                label=r['codigo'],
                description=f"Onda: {r['onda']}" if r.get('onda') else None
            )
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching cartones: {e}")
        return []


def get_procesos_from_db() -> List[SelectOption]:
    """Obtiene los procesos de la base de datos.
    Fuente Laravel: Process::where('active', 1)->orderBy('orden', 'ASC')
    Nota: El filtro type='EV' no aplica en estos datos
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM processes
            WHERE active = 1
            ORDER BY orden ASC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching processes: {e}")
        return []


def get_armados_from_db() -> List[SelectOption]:
    """Obtiene los tipos de armado de la base de datos.
    Fuente Laravel: Armado::where('active', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM armados
            WHERE active = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching armados: {e}")
        return []


def get_pegados_from_db() -> List[SelectOption]:
    """Obtiene los tipos de pegado de la base de datos.
    Fuente Laravel: (no hay referencia directa, pero existe tabla pegados)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM pegados
            WHERE active = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching pegados: {e}")
        return []


def get_maquila_servicios_from_db() -> List[SelectOption]:
    """Obtiene servicios de maquila de la base de datos.
    Fuente Laravel: MaquilaServicio::pluck('servicio', 'id')
    Nota: La columna active no es booleana, son referencias a product_type
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, servicio
            FROM maquila_servicios
            ORDER BY servicio
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['servicio'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching maquila_servicios: {e}")
        return []


def get_tipo_cinta_from_db() -> List[SelectOption]:
    """Obtiene tipos de cinta de la base de datos.
    Fuente Laravel: TipoCinta::where('active', 1)->pluck('descripcion', 'id')
    Nota: Tabla se llama tipos_cintas (plural)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM tipos_cintas
            WHERE active = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching tipo_cinta: {e}")
        return []


def get_trazabilidad_from_db() -> List[SelectOption]:
    """Obtiene opciones de trazabilidad de la base de datos.
    Fuente Laravel: Trazabilidad::where('status', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM trazabilidad
            WHERE status = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching trazabilidad: {e}")
        return []


def get_design_types_from_db() -> List[SelectOption]:
    """Obtiene tipos de diseño de la base de datos.
    Fuente Laravel: DesignType::where('active', 1)->pluck('descripcion', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM design_types
            WHERE active = 1
            ORDER BY id
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching design_types: {e}")
        return []


def get_reference_types_from_db() -> List[SelectOption]:
    """Obtiene tipos de referencia de la base de datos.
    Fuente Laravel: ReferenceType::where('active', 1)->pluck('descripcion', 'codigo')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT codigo, descripcion
            FROM reference_types
            WHERE active = 1
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['codigo'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching reference_types: {e}")
        return []


def get_recubrimiento_types_from_db() -> List[SelectOption]:
    """Obtiene tipos de recubrimiento de la base de datos.
    Fuente Laravel: RecubrimientoType::where('active', 1)->pluck('descripcion', 'codigo')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT codigo, descripcion
            FROM recubrimiento_types
            WHERE active = 1
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['codigo'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching recubrimiento_types: {e}")
        return []


def get_salas_cortes_from_db() -> List[SelectOption]:
    """Obtiene salas de corte (plantas de corte para muestras) de la base de datos.
    Fuente Laravel: SalaCorte::where('deleted', 0)->pluck('nombre', 'id')
    Usado en: muestras-ot.blade.php línea 691 - Campo "Planta de Corte"
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre
            FROM salas_cortes
            WHERE deleted = 0
            ORDER BY nombre
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['nombre'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching salas_cortes: {e}")
        return []


# =============================================================================
# OPCIONES HARDCODEADAS (igual que en Laravel)
# =============================================================================

# Cinta - Campo booleano en work_orders (tinyint 0/1)
# En Laravel se usa: [1 => "Si", 0=>"No"]
CINTA_OPTIONS = [
    SelectOption(value=1, label="Si", description="Con cinta"),
    SelectOption(value=0, label="No", description="Sin cinta"),
]

# Colores de Carton - Hardcodeado en Laravel: [1=>"Café", 2=>"Blanco"]
CARTON_COLORS = [
    SelectOption(value=1, label="Café", description="Tapa exterior café"),
    SelectOption(value=2, label="Blanco", description="Tapa exterior blanca"),
]

# Sentido de Armado - Hardcodeado en Laravel (WorkOrderController.php:687)
SENTIDOS_ARMADO = [
    SelectOption(value=1, label="No aplica"),
    SelectOption(value=2, label="Ancho a la Derecha"),
    SelectOption(value=3, label="Ancho a la Izquierda"),
    SelectOption(value=4, label="Largo a la Izquierda"),
    SelectOption(value=5, label="Largo a la Derecha"),
]

# Ajuste Area Desarrollo - Tipos de OT Especial
# Fuente Laravel: WorkOrderController.php línea 799
AJUSTES_AREA_DESARROLLO = [
    SelectOption(value=1, label="Licitación", description="OT para proceso de licitación"),
    SelectOption(value=2, label="Ficha Técnica", description="OT para ficha técnica de producto"),
    SelectOption(value=3, label="Estudio Benchmarking", description="OT para estudio de benchmarking"),
]

# Tipos de Solicitud - Hardcodeado en Laravel (WorkOrderController.php:690-694)
# Nota: Puede variar según área del usuario
TIPOS_SOLICITUD = [
    SelectOption(value=1, label="Desarrollo Completo"),
    SelectOption(value=3, label="Muestra con CAD"),
    SelectOption(value=5, label="Arte con Material"),
    SelectOption(value=6, label="Otras Solicitudes Desarrollo"),
    SelectOption(value=7, label="OT Proyectos Innovación"),
]


# =============================================================================
# ENDPOINT PRINCIPAL
# =============================================================================

@router.get("/", response_model=FormOptionsResponse)
async def get_all_options():
    """
    Obtiene todas las opciones del formulario en una sola llamada.
    Optimizado para carga inicial del formulario.

    ACTUALIZADO: Todas las opciones se leen de la base de datos
    excepto las que son hardcodeadas en Laravel.

    Equivalente a WorkOrderController@create() lineas 654-776
    """
    return FormOptionsResponse(
        # Seccion 6 - Tipo Item (de BD)
        product_types=get_product_types_from_db(),
        impresion_types=get_impresion_from_db(),
        fsc_options=get_fsc_from_db(),
        cinta_options=CINTA_OPTIONS,  # Hardcodeado
        coverage_internal=get_coverage_internal_from_db(),
        coverage_external=get_coverage_external_from_db(),
        plantas=get_plantas_from_db(),
        carton_colors=CARTON_COLORS,  # Hardcodeado
        cartones=get_cartones_from_db(),
        # Seccion 11 - Terminaciones (de BD)
        procesos=get_procesos_from_db(),
        armados=get_armados_from_db(),
        pegados=get_pegados_from_db(),
        sentidos_armado=SENTIDOS_ARMADO,  # Hardcodeado
        # Opciones adicionales (de BD)
        maquila_servicios=get_maquila_servicios_from_db(),
        tipo_cinta=get_tipo_cinta_from_db(),
        trazabilidad=get_trazabilidad_from_db(),
        design_types=get_design_types_from_db(),
        reference_types=get_reference_types_from_db(),
        recubrimiento_types=get_recubrimiento_types_from_db(),
        # Sprint 1 - OTs Especiales (Hardcodeado)
        ajustes_area_desarrollo=AJUSTES_AREA_DESARROLLO,
        tipos_solicitud=TIPOS_SOLICITUD,
        # Muestras - Salas de Corte (de BD)
        salas_cortes=get_salas_cortes_from_db(),
    )


# =============================================================================
# ENDPOINTS INDIVIDUALES
# =============================================================================

@router.get("/product-types", response_model=List[SelectOption])
async def get_product_types():
    """Obtiene tipos de producto de la base de datos."""
    return get_product_types_from_db()


@router.get("/impresion-types", response_model=List[SelectOption])
async def get_impresion_types():
    """Obtiene tipos de impresión (excluye Offset id=1)."""
    return get_impresion_from_db()


@router.get("/fsc-options", response_model=List[SelectOption])
async def get_fsc_options():
    """Obtiene opciones FSC de la base de datos."""
    return get_fsc_from_db()


@router.get("/cinta-options", response_model=List[SelectOption])
async def get_cinta_options():
    """Obtiene opciones de cinta (Si/No)."""
    return CINTA_OPTIONS


@router.get("/coverage-internal", response_model=List[SelectOption])
async def get_coverage_internal():
    """Obtiene opciones de recubrimiento interno de la base de datos."""
    return get_coverage_internal_from_db()


@router.get("/coverage-external", response_model=List[SelectOption])
async def get_coverage_external():
    """Obtiene opciones de recubrimiento externo de la base de datos."""
    return get_coverage_external_from_db()


@router.get("/plantas", response_model=List[SelectOption])
async def get_plantas():
    """Obtiene plantas de la base de datos."""
    return get_plantas_from_db()


@router.get("/carton-colors", response_model=List[SelectOption])
async def get_carton_colors():
    """Obtiene colores de cartón (Café/Blanco)."""
    return CARTON_COLORS


@router.get("/cartones", response_model=List[SelectOption])
async def get_cartones():
    """Obtiene cartones de la base de datos."""
    return get_cartones_from_db()


@router.get("/procesos", response_model=List[SelectOption])
async def get_procesos():
    """Obtiene procesos disponibles (type='EV', active=1)."""
    return get_procesos_from_db()


@router.get("/armados", response_model=List[SelectOption])
async def get_armados():
    """Obtiene tipos de armado de la base de datos."""
    return get_armados_from_db()


@router.get("/pegados", response_model=List[SelectOption])
async def get_pegados():
    """Obtiene tipos de pegado de la base de datos."""
    return get_pegados_from_db()


@router.get("/sentidos-armado", response_model=List[SelectOption])
async def get_sentidos_armado():
    """Obtiene sentidos de armado (hardcodeado)."""
    return SENTIDOS_ARMADO


@router.get("/maquila-servicios", response_model=List[SelectOption])
async def get_maquila_servicios():
    """Obtiene servicios de maquila de la base de datos."""
    return get_maquila_servicios_from_db()


@router.get("/tipo-cinta", response_model=List[SelectOption])
async def get_tipo_cinta():
    """Obtiene tipos de cinta de la base de datos."""
    return get_tipo_cinta_from_db()


@router.get("/trazabilidad", response_model=List[SelectOption])
async def get_trazabilidad():
    """Obtiene opciones de trazabilidad de la base de datos."""
    return get_trazabilidad_from_db()


@router.get("/design-types", response_model=List[SelectOption])
async def get_design_types():
    """Obtiene tipos de diseño de la base de datos."""
    return get_design_types_from_db()


@router.get("/reference-types", response_model=List[SelectOption])
async def get_reference_types():
    """Obtiene tipos de referencia de la base de datos."""
    return get_reference_types_from_db()


@router.get("/recubrimiento-types", response_model=List[SelectOption])
async def get_recubrimiento_types():
    """Obtiene tipos de recubrimiento de la base de datos."""
    return get_recubrimiento_types_from_db()


@router.get("/ajustes-area-desarrollo", response_model=List[SelectOption])
async def get_ajustes_area_desarrollo():
    """
    Obtiene tipos de ajuste área desarrollo (OTs Especiales).
    Valores: 1=Licitación, 2=Ficha Técnica, 3=Estudio Benchmarking
    """
    return AJUSTES_AREA_DESARROLLO


@router.get("/tipos-solicitud", response_model=List[SelectOption])
async def get_tipos_solicitud():
    """Obtiene tipos de solicitud de OT."""
    return TIPOS_SOLICITUD


# =============================================================================
# OPCIONES ESPECÍFICAS PARA COTIZADOR
# Fuente Laravel: CotizacionController.php líneas 348-362
# =============================================================================

class CotizadorOptionsResponse(BaseModel):
    """Opciones filtradas específicamente para el cotizador."""
    # Filtradas según Laravel
    styles: List[SelectOption]           # Solo [1,2,3,4,12,14,15,16]
    product_types: List[SelectOption]    # Solo cotiza=1
    procesos: List[SelectOption]         # Excluyendo [6,8,7,9]
    hierarchies: List[SelectOption]      # Solo [2,3,4,5]
    rubros: List[SelectOption]           # Excluyendo id=5
    envases: List[SelectOption]          # Solo [1,3,4,5,7,8,9]
    cartones: List[SelectOption]         # Excluyendo ESQUINEROS y provisional=1
    cartones_esquinero: List[SelectOption]  # Solo esquineros activos
    ondas: List[SelectOption]            # Todos
    clientes: List[SelectOption]         # Todos activos


def get_styles_cotizador() -> List[SelectOption]:
    """
    Obtiene estilos para cotizador.
    Fuente Laravel: Style::where('active', 1)->whereIn('id', [1, 2, 3, 4, 12, 14, 15, 16])
    Códigos: 200-201-202-203-216-221-222-223
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, glosa, codigo
            FROM styles
            WHERE active = 1 AND id IN (1, 2, 3, 4, 12, 14, 15, 16)
            ORDER BY glosa
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['glosa'], description=r.get('codigo'))
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching styles_cotizador: {e}")
        return []


def get_product_types_cotizador() -> List[SelectOption]:
    """
    Obtiene tipos de producto para cotizador.
    Fuente Laravel: ProductType::where('cotiza',1)->where('active', 1)
    Solo productos marcados para cotización.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion, codigo
            FROM product_types
            WHERE active = 1 AND cotiza = 1
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'], description=r.get('codigo'))
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching product_types_cotizador: {e}")
        return []


def get_procesos_cotizador() -> List[SelectOption]:
    """
    Obtiene procesos para cotizador.
    Fuente Laravel: Process::where('active', 1)->whereNotIn('id', [6, 8, 7, 9])
    Excluye: Offset y relacionados.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM processes
            WHERE active = 1 AND id NOT IN (6, 7, 8, 9)
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching procesos_cotizador: {e}")
        return []


def get_hierarchies_cotizador() -> List[SelectOption]:
    """
    Obtiene jerarquías para cotizador.
    Fuente Laravel: Hierarchy::whereIn('id', [2, 3, 4, 5])->where('active', 1)
    Excluye: Exportaciones (id=1).
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM hierarchies
            WHERE active = 1 AND id IN (2, 3, 4, 5)
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching hierarchies_cotizador: {e}")
        return []


def get_rubros_cotizador() -> List[SelectOption]:
    """
    Obtiene rubros para cotizador.
    Fuente Laravel: Rubro::where('id', "!=", 5)
    Excluye: Esquinero (id=5).
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM rubros
            WHERE id != 5
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching rubros_cotizador: {e}")
        return []


def get_envases_cotizador() -> List[SelectOption]:
    """
    Obtiene envases para cotizador.
    Fuente Laravel: Envase::where('active', 1)->whereIn('id', [1, 3, 4, 5, 7, 8, 9])
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, descripcion
            FROM envases
            WHERE active = 1 AND id IN (1, 3, 4, 5, 7, 8, 9)
            ORDER BY descripcion
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['descripcion'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching envases_cotizador: {e}")
        return []


def get_cartones_cotizador() -> List[SelectOption]:
    """
    Obtiene cartones para cotizador.
    Fuente Laravel: Carton::where('tipo', '!=', 'ESQUINEROS')->where('active', 1)->where('provisional', 0)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, codigo, tipo, onda
            FROM cartons
            WHERE active = 1 AND provisional = 0 AND tipo != 'ESQUINEROS'
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(
                value=r['id'],
                label=r['codigo'],
                description=f"{r['tipo']} - {r['onda']}" if r.get('onda') else r.get('tipo')
            )
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching cartones_cotizador: {e}")
        return []


def get_cartones_esquinero() -> List[SelectOption]:
    """
    Obtiene cartones de esquinero para cotizador.
    Fuente Laravel: CartonEsquinero::where('active', 1)->pluck('codigo', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, codigo
            FROM carton_esquineros
            WHERE active = 1
            ORDER BY codigo
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['codigo'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching cartones_esquinero: {e}")
        return []


def get_ondas() -> List[SelectOption]:
    """
    Obtiene tipos de onda.
    Fuente Laravel: TipoOnda::pluck('onda', 'id')
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, onda
            FROM tipo_ondas
            ORDER BY onda
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(value=r['id'], label=r['onda'])
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching ondas: {e}")
        return []


def get_clientes_cotizador() -> List[SelectOption]:
    """
    Obtiene clientes activos para cotizador.
    Fuente Laravel: Client::where('active', 1)->select(DB::raw('id, CONCAT(nombre, " - ", codigo)'))
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, codigo
            FROM clients
            WHERE active = 1
            ORDER BY nombre
        """)
        rows = cursor.fetchall()
        conn.close()
        return [
            SelectOption(
                value=r['id'],
                label=f"{r['nombre'] or ''} - {r['codigo'] or ''}".strip(' - '),
                description=r.get('codigo')
            )
            for r in rows
        ]
    except Exception as e:
        logger.error(f"Error fetching clientes_cotizador: {e}")
        return []


@router.get("/cotizador", response_model=CotizadorOptionsResponse)
async def get_cotizador_options():
    """
    Obtiene todas las opciones FILTRADAS para el cotizador.

    Fuente Laravel: CotizacionController.php líneas 348-362

    Filtros aplicados:
    - Estilos: Solo [1,2,3,4,12,14,15,16] (códigos 200-201-202-203-216-221-222-223)
    - ProductTypes: Solo cotiza=1
    - Procesos: Excluyendo [6,7,8,9] (Offset y relacionados)
    - Hierarchies: Solo [2,3,4,5] (excluye Exportaciones)
    - Rubros: Excluyendo id=5 (Esquinero)
    - Envases: Solo [1,3,4,5,7,8,9]
    - Cartones: Excluyendo ESQUINEROS y provisional=1
    """
    return CotizadorOptionsResponse(
        styles=get_styles_cotizador(),
        product_types=get_product_types_cotizador(),
        procesos=get_procesos_cotizador(),
        hierarchies=get_hierarchies_cotizador(),
        rubros=get_rubros_cotizador(),
        envases=get_envases_cotizador(),
        cartones=get_cartones_cotizador(),
        cartones_esquinero=get_cartones_esquinero(),
        ondas=get_ondas(),
        clientes=get_clientes_cotizador(),
    )


# =============================================================================
# BRECHA 4: OPCIONES MODAL ASIGNACION DINAMICO
# Fuente Laravel: UserWorkOrderController@modalAsignacion
# =============================================================================

class AsignacionUsuario(BaseModel):
    """Usuario disponible para asignacion."""
    id: int
    nombre: str
    apellido: Optional[str] = None
    email: Optional[str] = None
    role_id: int
    role_nombre: Optional[str] = None
    area_id: Optional[int] = None


class AsignacionOptionsResponse(BaseModel):
    """Opciones para modal de asignacion dinamico."""
    asignar_directo: bool
    profesionales: List[AsignacionUsuario]
    profesional_actual: Optional[AsignacionUsuario] = None
    area_id: int
    area_nombre: str


# Mapeo de roles jefes a roles profesionales (role_id_jefe: role_id_profesional)
# Fuente Laravel: User::where('role_id', (auth()->user()->role_id + 1))
JEFE_A_PROFESIONAL = {
    3: 4,   # JefeVenta -> Vendedor
    5: 6,   # JefeDesarrollo -> Ingeniero
    7: 8,   # JefeDiseño -> Diseñador
    9: 10,  # JefeCatalogador -> Catalogador
    11: 12, # JefePrecatalogador -> Precatalogador
    13: 14, # JefeMuestras -> TecnicoMuestras
}

# Roles que asignan directo (no jefes)
ROLES_ASIGNAR_DIRECTO = [6, 8, 10, 12, 14]  # Ingeniero, Diseñador, Catalogador, Precatalogador, TecnicoMuestras

# Mapeo de role_id a area_id
# Fuente: Roles y areas en constants.py
ROLE_A_AREA = {
    3: 1,   # JefeVenta -> Ventas
    4: 1,   # Vendedor -> Ventas
    5: 2,   # JefeDesarrollo -> Desarrollo
    6: 2,   # Ingeniero -> Desarrollo
    7: 3,   # JefeDiseño -> Diseño
    8: 3,   # Diseñador -> Diseño
    9: 4,   # JefeCatalogador -> Catalogacion
    10: 4,  # Catalogador -> Catalogacion
    11: 5,  # JefePrecatalogador -> Precatalogacion
    12: 5,  # Precatalogador -> Precatalogacion
    13: 6,  # JefeMuestras -> Muestras
    14: 6,  # TecnicoMuestras -> Muestras
}

AREA_NOMBRES = {
    1: "Ventas",
    2: "Desarrollo",
    3: "Diseño",
    4: "Catalogación",
    5: "Precatalogación",
    6: "Muestras",
}


def get_profesionales_para_asignacion(
    role_id: int,
    user_id: int,
    ot_id: int
) -> tuple:
    """
    Obtiene los profesionales disponibles para asignar según el rol del usuario.

    Fuente Laravel: UserWorkOrderController@modalAsignacion lineas 184-212

    Logica:
    - Perfiles no jefes (Ingeniero, Diseñador, etc.): asignar_directo = True
    - Perfiles jefes: Obtienen lista de profesionales de su area
      - role_id + 1 = rol del profesional
      - Excluye al profesional actualmente asignado
      - Incluye al jefe logueado

    Args:
        role_id: ID del rol del usuario logueado
        user_id: ID del usuario logueado
        ot_id: ID de la OT a asignar

    Returns:
        (asignar_directo, profesionales, profesional_actual, area_id)
    """
    area_id = ROLE_A_AREA.get(role_id, 0)

    # Perfiles no jefes - asignan directo
    if role_id in ROLES_ASIGNAR_DIRECTO:
        return (True, [], None, area_id)

    # Perfiles jefes - obtienen lista de profesionales
    rol_profesional = JEFE_A_PROFESIONAL.get(role_id)
    if not rol_profesional:
        return (True, [], None, area_id)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Obtener profesional actualmente asignado a la OT en esta area
        cursor.execute("""
            SELECT uwo.user_id, u.nombre, u.apellido, u.email, u.role_id
            FROM user_work_orders uwo
            JOIN users u ON uwo.user_id = u.id
            WHERE uwo.work_order_id = %s AND uwo.area_id = %s
            LIMIT 1
        """, (ot_id, area_id))
        asignacion_actual = cursor.fetchone()

        profesional_actual = None
        profesional_actual_id = None
        if asignacion_actual:
            profesional_actual = AsignacionUsuario(
                id=asignacion_actual['user_id'],
                nombre=asignacion_actual['nombre'],
                apellido=asignacion_actual.get('apellido'),
                email=asignacion_actual.get('email'),
                role_id=asignacion_actual['role_id']
            )
            profesional_actual_id = asignacion_actual['user_id']

        # Obtener profesionales del area (excluyendo al actual si existe)
        if profesional_actual_id:
            cursor.execute("""
                SELECT u.id, u.nombre, u.apellido, u.email, u.role_id, r.descripcion as role_nombre
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.active = 1
                  AND (u.role_id = %s OR u.id = %s)
                  AND u.id != %s
                ORDER BY u.nombre
            """, (rol_profesional, user_id, profesional_actual_id))
        else:
            cursor.execute("""
                SELECT u.id, u.nombre, u.apellido, u.email, u.role_id, r.descripcion as role_nombre
                FROM users u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.active = 1
                  AND (u.role_id = %s OR u.id = %s)
                ORDER BY u.nombre
            """, (rol_profesional, user_id))

        rows = cursor.fetchall()
        conn.close()

        profesionales = [
            AsignacionUsuario(
                id=r['id'],
                nombre=r['nombre'],
                apellido=r.get('apellido'),
                email=r.get('email'),
                role_id=r['role_id'],
                role_nombre=r.get('role_nombre'),
                area_id=area_id
            )
            for r in rows
        ]

        return (False, profesionales, profesional_actual, area_id)

    except Exception as e:
        logger.error(f"Error obteniendo profesionales para asignacion: {e}")
        return (True, [], None, area_id)


@router.get("/asignacion/{ot_id}", response_model=AsignacionOptionsResponse)
async def get_asignacion_options(ot_id: int, role_id: int, user_id: int):
    """
    Obtiene las opciones DINAMICAS para el modal de asignacion.

    Fuente Laravel: UserWorkOrderController@modalAsignacion

    Args:
        ot_id: ID de la OT a asignar
        role_id: ID del rol del usuario logueado
        user_id: ID del usuario logueado

    Returns:
        - asignar_directo: True si el usuario debe asignarse directamente (no jefes)
        - profesionales: Lista de usuarios disponibles para asignar (solo jefes)
        - profesional_actual: Usuario actualmente asignado (si existe)
        - area_id: ID del area del usuario
        - area_nombre: Nombre del area

    Logica por rol:
    - Ingeniero (6), Diseñador (8), Catalogador (10), TecnicoMuestras (14):
      -> asignar_directo = True (se asignan a si mismos)
    - JefeVenta (3), JefeDesarrollo (5), JefeDiseño (7), JefeCatalogador (9), JefeMuestras (13):
      -> asignar_directo = False
      -> profesionales = usuarios con role_id = jefe_role_id + 1 (subordinados)
      -> Se excluye al profesional actualmente asignado
      -> Se incluye al jefe logueado
    """
    asignar_directo, profesionales, profesional_actual, area_id = get_profesionales_para_asignacion(
        role_id, user_id, ot_id
    )

    return AsignacionOptionsResponse(
        asignar_directo=asignar_directo,
        profesionales=profesionales,
        profesional_actual=profesional_actual,
        area_id=area_id,
        area_nombre=AREA_NOMBRES.get(area_id, "Desconocida")
    )
