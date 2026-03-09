"""
Servicio de Reglas de Negocio (Sprint J - J.3, J.4, J.5)

Fuente Laravel:
- WorkOrderController.php líneas 240-258 (filtrado estados por rol)
- CustomHelpers.php líneas 2223-2420 (cálculo margen sugerido)
- Constants.php (roles)

NO INVENTAR - Todas las reglas son extraídas directamente del código Laravel.
"""
from typing import List, Optional, Dict, Any
from enum import IntEnum


# =============================================================================
# ROLES
# Fuente Laravel: app/Constants.php
# =============================================================================
class Roles(IntEnum):
    """Roles del sistema."""
    ADMIN = 1
    GERENTE = 2
    JEFE_VENTA = 3
    VENDEDOR = 4
    JEFE_DESARROLLO = 5
    INGENIERO = 6
    JEFE_DISENO = 7
    DISENADOR = 8
    JEFE_CATALOGADOR = 9
    CATALOGADOR = 10
    JEFE_PRECATALOGADOR = 11
    PRECATALOGADOR = 12
    JEFE_MUESTRAS = 13
    TECNICO_MUESTRAS = 14
    GERENTE_COMERCIAL = 15
    API = 17
    SUPER_ADMIN = 18
    VENDEDOR_EXTERNO = 19


# =============================================================================
# J.3 - FILTRADO DE ESTADOS POR ROL
# Fuente Laravel: WorkOrderController.php líneas 240-258
# =============================================================================

# Estados visibles para Vendedor y Jefe de Venta (excluyen 8, 9, 11, 19)
ESTADOS_VENDEDOR = [1, 2, 3, 4, 5, 6, 7, 10, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22]

# Estados para Jefe de Muestras y Técnico de Muestras (solo estado 17)
ESTADOS_MUESTRAS = [17]

# Todos los estados
ESTADOS_TODOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]


def obtener_estados_visibles_ot(role_id: int) -> List[int]:
    """
    Obtiene los estados de OT visibles según el rol del usuario.

    Fuente Laravel: WorkOrderController.php líneas 240-258

    Reglas:
    - Vendedor (4) y Jefe de Venta (3): Ven 18 estados (excluyen 8, 9, 11, 19)
    - Jefe de Muestras (13) y Técnico de Muestras (14): Solo ven estado 17
    - Otros roles: Ven todos los 22 estados

    Args:
        role_id: ID del rol del usuario

    Returns:
        Lista de IDs de estados visibles
    """
    # Vendedor o Jefe de Venta
    if role_id in [Roles.VENDEDOR, Roles.JEFE_VENTA]:
        return ESTADOS_VENDEDOR.copy()

    # Jefe de Muestras o Técnico de Muestras
    if role_id in [Roles.JEFE_MUESTRAS, Roles.TECNICO_MUESTRAS]:
        return ESTADOS_MUESTRAS.copy()

    # Todos los demás roles ven todos los estados
    return ESTADOS_TODOS.copy()


def filtrar_ots_por_visibilidad(
    role_id: int,
    user_id: int,
    include_own_ots: bool = True
) -> Dict[str, Any]:
    """
    Genera las condiciones SQL para filtrar OTs según visibilidad del usuario.

    Fuente Laravel: WorkOrderController@index

    Args:
        role_id: ID del rol del usuario
        user_id: ID del usuario
        include_own_ots: Si True, siempre incluye OTs creadas por el usuario

    Returns:
        Dict con:
        - estados: Lista de estados visibles
        - where_clause: Cláusula WHERE adicional para SQL
        - params: Parámetros para la query
    """
    estados = obtener_estados_visibles_ot(role_id)

    # Vendedor externo solo ve OTs de su cliente asignado
    if role_id == Roles.VENDEDOR_EXTERNO:
        return {
            "estados": estados,
            "where_clause": "AND wo.client_id = (SELECT client_id FROM users WHERE id = %s)",
            "params": [user_id],
            "filter_by_user": True
        }

    # Vendedor normal ve solo sus propias OTs
    if role_id == Roles.VENDEDOR:
        return {
            "estados": estados,
            "where_clause": "AND wo.user_id = %s",
            "params": [user_id],
            "filter_by_user": True
        }

    # Otros roles ven todas las OTs con estados permitidos
    return {
        "estados": estados,
        "where_clause": "",
        "params": [],
        "filter_by_user": False
    }


# =============================================================================
# J.4 - CÁLCULO DE MARGEN SUGERIDO
# Fuente Laravel: CustomHelpers.php líneas 2223-2420
# =============================================================================

# Porcentaje de margen para exportación
MARGEN_EXPORTACION_PORCENTAJE = 0.45  # 45% del costo total


def calcular_margen_exportacion(costo_total_usd_mm2: float) -> float:
    """
    Calcula el margen para cotizaciones de exportación.

    Fuente Laravel: CustomHelpers.php línea 2286
    Regla: Si comision > 0 (exportación), margen = costo_total * 0.45

    Args:
        costo_total_usd_mm2: Costo total en USD/mm²

    Returns:
        Margen sugerido para exportación
    """
    return costo_total_usd_mm2 * MARGEN_EXPORTACION_PORCENTAJE


def es_cotizacion_exportacion(comision: Optional[float]) -> bool:
    """
    Determina si una cotización es de exportación.

    Fuente Laravel: CustomHelpers.php línea 2283
    Regla: Si comision > 0, es exportación

    Args:
        comision: Valor de comisión de la cotización

    Returns:
        True si es exportación
    """
    return comision is not None and comision > 0


def obtener_margen_sugerido(
    rubro_id: int,
    mercado_id: int,
    tipo_cliente: Optional[str],
    comision: Optional[float],
    costo_total_usd_mm2: float,
    margenes_minimos: Optional[List[Dict]] = None
) -> float:
    """
    Obtiene el margen sugerido según rubro, mercado y tipo de cliente.

    Fuente Laravel: CustomHelpers.php función obtenerMargenSugerido() líneas 2223-2300

    Proceso:
    1. Si es exportación (comision > 0): Retorna 45% del costo
    2. Si no, busca en tabla margen_minimos por rubro + mercado + tipo_cliente
    3. Si no encuentra, retorna 0

    Args:
        rubro_id: ID del rubro
        mercado_id: ID del mercado
        tipo_cliente: Cluster/tipo del cliente
        comision: Comisión de la cotización (> 0 = exportación)
        costo_total_usd_mm2: Costo total en USD/mm²
        margenes_minimos: Lista de registros de margen_minimos (para evitar query)

    Returns:
        Margen sugerido en USD/mm²
    """
    # Caso exportación: 45% del costo
    if es_cotizacion_exportacion(comision):
        return calcular_margen_exportacion(costo_total_usd_mm2)

    # Buscar en tabla de márgenes mínimos
    if margenes_minimos:
        for margen in margenes_minimos:
            if (margen.get("rubro_id") == rubro_id and
                margen.get("mercado_id") == mercado_id and
                margen.get("cluster") == tipo_cliente):
                return float(margen.get("minimo", 0))

    return 0


def obtener_ebitda_esperado(
    clasificacion_cliente_id: int,
    rubro_id: int,
    porcentajes_margen: Optional[List[Dict]] = None
) -> float:
    """
    Obtiene el porcentaje de EBITDA esperado según clasificación de cliente y rubro.

    Fuente Laravel: DetalleCotizacion.php función mg_ebitda() líneas 4570-4590

    Args:
        clasificacion_cliente_id: ID de clasificación del cliente
        rubro_id: ID del rubro
        porcentajes_margen: Lista de registros de porcentaje_margen (para evitar query)

    Returns:
        Porcentaje de EBITDA esperado (ej: 0.15 para 15%)
    """
    if porcentajes_margen:
        for pm in porcentajes_margen:
            if (pm.get("clasificacion_cliente_id") == clasificacion_cliente_id and
                pm.get("rubro_id") == rubro_id and
                pm.get("active") == 1):
                return float(pm.get("ebitda_esperado", 0))

    return 0


# =============================================================================
# J.5 - RESTRICCIÓN TÉCNICO MUESTRAS (SALA CORTE)
# Fuente Laravel: WorkOrderController.php (acceso restringido para muestra_sala_corte)
# =============================================================================

def puede_ver_sala_corte(role_id: int) -> bool:
    """
    Determina si un rol puede ver información de sala de corte.

    Fuente Laravel: Lógica en WorkOrderController

    Args:
        role_id: ID del rol del usuario

    Returns:
        True si puede ver sala de corte
    """
    # Técnico de muestras solo ve estado 17 (sala de corte)
    # Otros roles con acceso a muestras pueden ver
    roles_permitidos = [
        Roles.ADMIN,
        Roles.GERENTE,
        Roles.JEFE_DESARROLLO,
        Roles.JEFE_MUESTRAS,
        Roles.TECNICO_MUESTRAS,
        Roles.SUPER_ADMIN
    ]
    return role_id in roles_permitidos


def filtrar_campos_muestra_por_rol(
    role_id: int,
    datos_muestra: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Filtra los campos de muestra según el rol.

    El Técnico de Muestras solo ve campos relacionados con sala de corte.

    Args:
        role_id: ID del rol del usuario
        datos_muestra: Diccionario con todos los datos de muestra

    Returns:
        Diccionario filtrado según permisos del rol
    """
    # Campos que el técnico de muestras puede ver
    campos_tecnico_muestras = [
        "id", "work_order_id", "fecha_muestra", "estado_muestra",
        "cantidad_muestras", "observaciones_corte",
        "maquina_corte", "operador_corte", "fecha_corte"
    ]

    if role_id == Roles.TECNICO_MUESTRAS:
        return {k: v for k, v in datos_muestra.items() if k in campos_tecnico_muestras}

    # Otros roles ven todo
    return datos_muestra


# =============================================================================
# HELPERS DE CLASIFICACIÓN DE CLIENTE
# =============================================================================

class ClasificacionCliente(IntEnum):
    """Clasificaciones de clientes."""
    DESARROLLO = 1
    MANTENCION = 2
    VENTA_PUNTUAL = 3
    PRESENCIA_RENTABLE = 4
    EXPORTACION = 5


def requiere_margen_cero(clasificacion_id: int) -> bool:
    """
    Determina si una clasificación de cliente requiere margen = 0.

    Fuente Laravel: CotizacionController.php líneas 2724-2728

    Args:
        clasificacion_id: ID de clasificación del cliente

    Returns:
        True si requiere margen cero
    """
    return clasificacion_id == ClasificacionCliente.PRESENCIA_RENTABLE


def es_cliente_exportacion(clasificacion_id: int) -> bool:
    """
    Determina si un cliente es de exportación por su clasificación.

    Args:
        clasificacion_id: ID de clasificación del cliente

    Returns:
        True si es exportación
    """
    return clasificacion_id == ClasificacionCliente.EXPORTACION
