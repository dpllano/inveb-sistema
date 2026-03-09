"""
Servicio de Aprobación de Cotizaciones (Sprint J - J.2)

Fuente Laravel:
- CotizacionController.php líneas 1100-1130 (umbrales de margen)
- CotizacionApprovalController.php líneas 17-110 (flujo de aprobación)

NO INVENTAR - Todas las reglas son extraídas directamente del código Laravel.
"""
from typing import Optional, Dict, Any, Tuple
from enum import IntEnum


# =============================================================================
# ROLES DE APROBACIÓN
# Fuente Laravel: app/Constants.php líneas 7-25
# =============================================================================
class ApprovalRoles(IntEnum):
    """Roles que participan en el flujo de aprobación de cotizaciones."""
    ADMIN = 1
    GERENTE_GENERAL = 2
    JEFE_VENTAS = 3
    GERENTE_COMERCIAL = 15


# =============================================================================
# ESTADOS DE COTIZACIÓN
# Fuente Laravel: tabla cotizacion_estados
# =============================================================================
class CotizacionEstados(IntEnum):
    """Estados de cotización."""
    BORRADOR = 1
    PENDIENTE_APROBACION = 2
    APROBADA = 3
    EN_PROCESO = 4
    FINALIZADA = 5
    RECHAZADA = 6


# =============================================================================
# UMBRALES DE MARGEN
# Fuente Laravel: CotizacionController.php líneas 1108-1128
# =============================================================================
UMBRAL_NIVEL_1 = 10.0   # Margen < 10% = Nivel 1
UMBRAL_NIVEL_2 = 25.0   # 10% <= Margen < 25% = Nivel 2
                         # Margen >= 25% = Nivel 3


def determinar_nivel_aprobacion(
    margen: float,
    role_id_solicitante: int
) -> Tuple[int, Optional[int], bool]:
    """
    Determina el nivel de aprobación requerido según el margen.

    Fuente Laravel: CotizacionController.php líneas 1100-1130

    Reglas:
    - Margen <= 0%: Aprobación automática (sin nivel)
    - Jefe de Ventas (role=3) con Margen < 10%: Aprobación automática
    - Margen < 10%: Nivel 1 (Solo Jefe de Ventas)
    - 10% <= Margen < 25%: Nivel 2 (Jefe Ventas + Gerente Comercial)
    - Margen >= 25%: Nivel 3 (Jefe Ventas + Ger. Comercial + Ger. General)

    Args:
        margen: Margen total de la cotización (porcentaje)
        role_id_solicitante: ID del rol del usuario que solicita aprobación

    Returns:
        Tuple de (nivel_aprobacion, role_can_show, aprobacion_automatica)
        - nivel_aprobacion: 1, 2 o 3 (o None si es automática)
        - role_can_show: ID del rol que debe ver la cotización para aprobar
        - aprobacion_automatica: True si se aprueba sin intervención
    """
    # Caso 1: Margen <= 0% → Aprobación automática
    if margen <= 0:
        return (None, None, True)

    # Caso 2: Jefe de Ventas con margen < 10% → Aprobación automática
    if role_id_solicitante == ApprovalRoles.JEFE_VENTAS and margen < UMBRAL_NIVEL_1:
        return (None, None, True)

    # Caso 3: Margen < 10% → Nivel 1 (Solo Jefe de Ventas)
    if margen < UMBRAL_NIVEL_1:
        return (1, ApprovalRoles.JEFE_VENTAS, False)

    # Caso 4: 10% <= Margen < 25% → Nivel 2 (Jefe Ventas → Gerente Comercial)
    if margen < UMBRAL_NIVEL_2:
        return (2, ApprovalRoles.JEFE_VENTAS, False)

    # Caso 5: Margen >= 25% → Nivel 3 (Jefe → Ger. Comercial → Ger. General)
    return (3, ApprovalRoles.JEFE_VENTAS, False)


def puede_aprobar(
    role_id_aprobador: int,
    nivel_aprobacion: int,
    role_can_show: Optional[int]
) -> bool:
    """
    Verifica si un rol puede aprobar una cotización en su estado actual.

    Fuente Laravel: CotizacionApprovalController.php líneas 26-90

    Args:
        role_id_aprobador: ID del rol del usuario que quiere aprobar
        nivel_aprobacion: Nivel de aprobación actual (1, 2 o 3)
        role_can_show: Rol que actualmente debe aprobar

    Returns:
        True si puede aprobar, False si no
    """
    # Admin siempre puede aprobar
    if role_id_aprobador == ApprovalRoles.ADMIN:
        return True

    # Si role_can_show está definido, solo ese rol puede aprobar
    if role_can_show is not None:
        return role_id_aprobador == role_can_show

    # Si no hay role_can_show, validar según nivel
    if nivel_aprobacion == 1:
        return role_id_aprobador in [ApprovalRoles.JEFE_VENTAS, ApprovalRoles.ADMIN]
    elif nivel_aprobacion == 2:
        return role_id_aprobador in [ApprovalRoles.JEFE_VENTAS, ApprovalRoles.GERENTE_COMERCIAL, ApprovalRoles.ADMIN]
    elif nivel_aprobacion == 3:
        return role_id_aprobador in [ApprovalRoles.JEFE_VENTAS, ApprovalRoles.GERENTE_COMERCIAL, ApprovalRoles.GERENTE_GENERAL, ApprovalRoles.ADMIN]

    return False


def procesar_aprobacion(
    nivel_aprobacion: int,
    role_can_show: int,
    role_id_aprobador: int,
    accion: str
) -> Dict[str, Any]:
    """
    Procesa una acción de aprobación y determina el siguiente estado.

    Fuente Laravel: CotizacionApprovalController.php líneas 17-110

    Flujo:
    - NIVEL 1: Jefe Ventas aprueba → APROBADA (fin)
    - NIVEL 2: Jefe Ventas aprueba → pasa a Ger. Comercial
              Ger. Comercial aprueba → APROBADA (fin)
    - NIVEL 3: Jefe Ventas aprueba → pasa a Ger. Comercial
              Ger. Comercial aprueba → pasa a Ger. General
              Ger. General aprueba → APROBADA (fin)

    Args:
        nivel_aprobacion: Nivel actual (1, 2 o 3)
        role_can_show: Rol que actualmente está aprobando
        role_id_aprobador: ID del rol del usuario que aprueba
        accion: "aprobar" o "rechazar"

    Returns:
        Dict con:
        - estado_nuevo: ID del nuevo estado
        - role_can_show_nuevo: Nuevo rol aprobador (o None si terminó)
        - accion_registrada: Texto de la acción para el log
        - flujo_terminado: True si el flujo terminó
    """
    # Rechazar siempre termina el flujo
    if accion == "rechazar":
        return {
            "estado_nuevo": CotizacionEstados.RECHAZADA,
            "role_can_show_nuevo": None,
            "accion_registrada": "Rechazo",
            "flujo_terminado": True
        }

    # Aprobar - depende del nivel y quién aprueba
    if nivel_aprobacion == 1:
        # Nivel 1: Jefe Ventas aprueba → FIN
        return {
            "estado_nuevo": CotizacionEstados.APROBADA,
            "role_can_show_nuevo": None,
            "accion_registrada": "Aprobación Total",
            "flujo_terminado": True
        }

    elif nivel_aprobacion == 2:
        # Nivel 2: 2 aprobadores
        if role_can_show == ApprovalRoles.JEFE_VENTAS:
            # Jefe Ventas aprobó → pasa a Gerente Comercial
            return {
                "estado_nuevo": CotizacionEstados.PENDIENTE_APROBACION,
                "role_can_show_nuevo": ApprovalRoles.GERENTE_COMERCIAL,
                "accion_registrada": "Aprobación Parcial",
                "flujo_terminado": False
            }
        else:
            # Gerente Comercial aprobó → FIN
            return {
                "estado_nuevo": CotizacionEstados.APROBADA,
                "role_can_show_nuevo": None,
                "accion_registrada": "Aprobación Total",
                "flujo_terminado": True
            }

    elif nivel_aprobacion == 3:
        # Nivel 3: 3 aprobadores
        if role_can_show == ApprovalRoles.JEFE_VENTAS:
            # Jefe Ventas aprobó → pasa a Gerente Comercial
            return {
                "estado_nuevo": CotizacionEstados.PENDIENTE_APROBACION,
                "role_can_show_nuevo": ApprovalRoles.GERENTE_COMERCIAL,
                "accion_registrada": "Aprobación Parcial",
                "flujo_terminado": False
            }
        elif role_can_show == ApprovalRoles.GERENTE_COMERCIAL:
            # Gerente Comercial aprobó → pasa a Gerente General
            return {
                "estado_nuevo": CotizacionEstados.PENDIENTE_APROBACION,
                "role_can_show_nuevo": ApprovalRoles.GERENTE_GENERAL,
                "accion_registrada": "Aprobación Parcial",
                "flujo_terminado": False
            }
        else:
            # Gerente General aprobó → FIN
            return {
                "estado_nuevo": CotizacionEstados.APROBADA,
                "role_can_show_nuevo": None,
                "accion_registrada": "Aprobación Total",
                "flujo_terminado": True
            }

    # Default (no debería llegar aquí)
    return {
        "estado_nuevo": CotizacionEstados.APROBADA,
        "role_can_show_nuevo": None,
        "accion_registrada": "Aprobación Total",
        "flujo_terminado": True
    }


def verificar_mc_bruto_negativo(detalles: list) -> bool:
    """
    Verifica si algún detalle tiene MC Bruto negativo.

    Fuente Laravel: CotizacionController.php líneas 1899-1921

    Fórmula: MC Bruto = margen + costo_administrativos + costo_servir_sin_flete
    Si MC Bruto < 0 para cualquier detalle, se marca para comité.

    Args:
        detalles: Lista de diccionarios con datos de cada detalle

    Returns:
        True si algún detalle tiene MC Bruto < 0
    """
    for detalle in detalles:
        try:
            margen = float(detalle.get("margen", 0) or 0)
            costo_admin = float(detalle.get("costo_administrativos", 0) or 0)
            costo_servir = float(detalle.get("costo_servir_sin_flete", 0) or 0)

            mc_bruto = margen + costo_admin + costo_servir

            if mc_bruto < 0:
                return True
        except (ValueError, TypeError):
            continue

    return False


def obtener_mensaje_aprobacion(
    nivel: Optional[int],
    role_can_show: Optional[int],
    aprobacion_automatica: bool
) -> str:
    """
    Genera un mensaje descriptivo del estado de aprobación.

    Args:
        nivel: Nivel de aprobación (1, 2 o 3)
        role_can_show: Rol que debe aprobar
        aprobacion_automatica: Si fue aprobación automática

    Returns:
        Mensaje descriptivo
    """
    if aprobacion_automatica:
        return "Cotización aprobada automáticamente"

    roles_nombres = {
        ApprovalRoles.JEFE_VENTAS: "Jefe de Ventas",
        ApprovalRoles.GERENTE_COMERCIAL: "Gerente Comercial",
        ApprovalRoles.GERENTE_GENERAL: "Gerente General"
    }

    rol_nombre = roles_nombres.get(role_can_show, f"Rol {role_can_show}")

    if nivel == 1:
        return f"Cotización enviada a {rol_nombre} para aprobación (Nivel 1)"
    elif nivel == 2:
        return f"Cotización enviada a {rol_nombre} para aprobación (Nivel 2 - requiere 2 aprobadores)"
    elif nivel == 3:
        return f"Cotización enviada a {rol_nombre} para aprobación (Nivel 3 - requiere 3 aprobadores)"

    return "Cotización en proceso de aprobación"
