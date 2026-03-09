"""
Constantes del sistema INVEB - Migrado de Laravel
Fuente: app/Constants.php

Sprint G: Corrección de Brechas - FASE 2
Sprint K+: Correcciones de permisos según feedback del dueño (2026-02-18)

Estas constantes son usadas para validación de roles y permisos.
"""


class Roles:
    """
    IDs de roles del sistema.
    CORREGIDO 2026-02-23: Valores según BD real (tabla roles), NO según Laravel Constants.php
    Laravel Constants.php tenía error: roles 9-12 estaban invertidos.
    """
    Admin = 1
    Gerente = 2
    JefeVenta = 3
    Vendedor = 4
    JefeDesarrollo = 5
    Ingeniero = 6
    JefeDiseño = 7
    Diseñador = 8
    # CORREGIDO: Según BD real, NO según Laravel Constants.php
    JefePrecatalogador = 9   # BD: "Jefe de Precatalogación"
    Precatalogador = 10      # BD: "Precatalogador"
    JefeCatalogador = 11     # BD: "Jefe de Catalogación"
    Catalogador = 12         # BD: "Catalogador"
    JefeMuestras = 13
    TecnicoMuestras = 14
    GerenteComercial = 15
    API = 17
    SuperAdministrador = 18
    VendedorExterno = 19


class Areas:
    """
    IDs de áreas del sistema.
    Fuente Laravel: app/Constants.php líneas 27-33
    """
    Venta = 1
    Desarrollo = 2
    Diseño = 3
    Catalogacion = 4
    Precatalogacion = 5
    Muestras = 6


# Agrupaciones de roles para permisos
# Basado en WorkOrderController.php y ManagementController.php

ROLES_ADMIN = [
    Roles.Admin,
    Roles.SuperAdministrador,
]

ROLES_GERENTES = [
    Roles.Gerente,
    Roles.GerenteComercial,
]

ROLES_VENTAS = [
    Roles.JefeVenta,
    Roles.Vendedor,
    Roles.VendedorExterno,
]

ROLES_DESARROLLO = [
    Roles.JefeDesarrollo,
    Roles.Ingeniero,
]

ROLES_DISEÑO = [
    Roles.JefeDiseño,
    Roles.Diseñador,
]

ROLES_CATALOGACION = [
    Roles.JefeCatalogador,
    Roles.Catalogador,
    Roles.JefePrecatalogador,
    Roles.Precatalogador,
]

ROLES_MUESTRAS = [
    Roles.JefeMuestras,
    Roles.TecnicoMuestras,
]

# Roles que pueden crear OTs
# Fuente: WorkOrderController.php middleware 'role:...'
ROLES_CREAR_OT = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.Gerente,
    Roles.GerenteComercial,
    Roles.JefeVenta,
    Roles.Vendedor,
    Roles.VendedorExterno,
    Roles.JefeDesarrollo,
    Roles.Ingeniero,
    Roles.JefeDiseño,
    Roles.Diseñador,
]

# Roles que pueden usar el cotizador
# Fuente: CotizadorController.php
ROLES_COTIZADOR = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.Gerente,
    Roles.GerenteComercial,
    Roles.JefeVenta,
    Roles.Vendedor,
]

# Roles que pueden aprobar cotizaciones
# Fuente: CotizacionApprovalController.php
ROLES_APROBAR_COTIZACION = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.Gerente,
    Roles.GerenteComercial,
    Roles.JefeVenta,
]

# Roles con acceso completo a mantenedores
# Fuente: routes/web.php middleware
ROLES_MANTENEDORES_FULL = [
    Roles.Admin,
    Roles.SuperAdministrador,
]

# Roles con acceso parcial a mantenedores
ROLES_MANTENEDORES_PARCIAL = [
    Roles.JefeCatalogador,
    Roles.JefeDesarrollo,
    Roles.JefeDiseño,
]

# Roles que pueden ver todos los reportes
ROLES_REPORTES_ALL = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.Gerente,
    Roles.GerenteComercial,
    Roles.JefeVenta,
]

# Mapeo de roles a áreas
# CORREGIDO 2026-02-23: Valores según tabla roles.work_space_id en BD
# NOTA: La BD tiene inconsistencia histórica donde:
#   - Roles de Precatalogación (9, 10) → work_space_id 4 ("Área de Catalogación")
#   - Roles de Catalogación (11, 12) → work_space_id 5 ("Área de Precatalogación")
#   Mantenemos esta asignación para consistencia con la BD existente.
ROLE_TO_AREA = {
    Roles.JefeVenta: Areas.Venta,
    Roles.Vendedor: Areas.Venta,
    Roles.VendedorExterno: Areas.Venta,
    Roles.JefeDesarrollo: Areas.Desarrollo,
    Roles.Ingeniero: Areas.Desarrollo,
    Roles.JefeDiseño: Areas.Diseño,
    Roles.Diseñador: Areas.Diseño,
    # Según BD: roles 9, 10 tienen work_space_id = 4
    Roles.JefePrecatalogador: Areas.Catalogacion,   # 9 → 4
    Roles.Precatalogador: Areas.Catalogacion,       # 10 → 4
    # Según BD: roles 11, 12 tienen work_space_id = 5
    Roles.JefeCatalogador: Areas.Precatalogacion,   # 11 → 5
    Roles.Catalogador: Areas.Precatalogacion,       # 12 → 5
    Roles.JefeMuestras: Areas.Muestras,
    Roles.TecnicoMuestras: Areas.Muestras,
}


def get_user_area(role_id: int) -> int:
    """
    Obtiene el área del usuario según su rol.
    Retorna None si es admin/gerente (no tienen área específica).
    """
    return ROLE_TO_AREA.get(role_id)


def is_admin(role_id: int) -> bool:
    """Verifica si el usuario es Admin o SuperAdministrador."""
    return role_id in ROLES_ADMIN


def is_gerente(role_id: int) -> bool:
    """Verifica si el usuario es Gerente o GerenteComercial."""
    return role_id in ROLES_GERENTES


def is_jefe(role_id: int) -> bool:
    """Verifica si el usuario es algún tipo de Jefe."""
    return role_id in [
        Roles.JefeVenta,
        Roles.JefeDesarrollo,
        Roles.JefeDiseño,
        Roles.JefeCatalogador,
        Roles.JefePrecatalogador,
        Roles.JefeMuestras,
    ]


def can_see_all_ots(role_id: int) -> bool:
    """
    Verifica si el usuario puede ver todas las OTs.
    Fuente: WorkOrderController.php líneas 70-200
    """
    return role_id in ROLES_ADMIN + ROLES_GERENTES + [Roles.JefeVenta]


def can_create_ot(role_id: int) -> bool:
    """Verifica si el usuario puede crear OTs."""
    return role_id in ROLES_CREAR_OT


def can_use_cotizador(role_id: int) -> bool:
    """Verifica si el usuario puede usar el cotizador."""
    return role_id in ROLES_COTIZADOR


def can_approve_cotizacion(role_id: int) -> bool:
    """Verifica si el usuario puede aprobar cotizaciones."""
    return role_id in ROLES_APROBAR_COTIZACION


# =============================================================================
# NUEVOS PERMISOS - Correcciones del dueño (2026-02-18)
# =============================================================================

# Todos los roles de Jefes de área
ROLES_JEFES = [
    Roles.JefeVenta,
    Roles.JefeDesarrollo,
    Roles.JefeDiseño,
    Roles.JefeCatalogador,
    Roles.JefePrecatalogador,
    Roles.JefeMuestras,
]

# Roles que pueden AUTOASIGNARSE una OT en su área (si no está asignada)
# Ingeniero, Diseñador, Catalogador, Precatalogador, Técnico Muestras
ROLES_AUTOASIGNAR_OT = [
    Roles.Ingeniero,
    Roles.Diseñador,
    Roles.Catalogador,
    Roles.Precatalogador,
    Roles.TecnicoMuestras,
]

# Roles que pueden ASIGNAR/REASIGNAR OTs a su equipo (todos los Jefes)
ROLES_ASIGNAR_REASIGNAR_EQUIPO = ROLES_JEFES

# Roles con acceso a mantenedor de CLIENTES (crear/modificar)
# Jefe Ventas puede crear/modificar clientes
ROLES_MANTENEDOR_CLIENTES = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.JefeVenta,
]

# Roles que pueden EDITAR OT (solo en su área y según estado de OT)
# Los Jefes NO pueden editar, solo asignar/reasignar
ROLES_EDITAR_OT_CONDICIONAL = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.Vendedor,
    Roles.VendedorExterno,
    Roles.Ingeniero,
    Roles.Diseñador,
    Roles.Catalogador,
    Roles.Precatalogador,
]

# Roles que pueden ver OTs propias + TODAS con filtro
ROLES_VER_OTS_CON_FILTRO = [
    Roles.Vendedor,
    Roles.VendedorExterno,
    Roles.Ingeniero,
    Roles.Diseñador,
    Roles.Catalogador,
    Roles.Precatalogador,
    Roles.TecnicoMuestras,
]

# Roles con GESTIÓN ACTIVIDAD FULL (en su área)
# Consulta y Subir Archivo cuando está en otra área
ROLES_GESTIONAR_ACTIVIDAD = [
    Roles.Vendedor,
    Roles.VendedorExterno,
    Roles.Ingeniero,
    Roles.TecnicoMuestras,
]

# Roles que pueden CREAR MUESTRAS (en su área)
ROLES_CREAR_MUESTRAS = [
    Roles.Vendedor,
    Roles.VendedorExterno,
    Roles.Ingeniero,
]

# Roles que pueden ANULAR/MARCAR PRIORITARIAS muestras (Jefes)
ROLES_GESTIONAR_MUESTRAS_JEFES = ROLES_JEFES

# Roles con GESTIÓN FULL de muestras
ROLES_GESTIONAR_MUESTRAS_FULL = [
    Roles.Admin,
    Roles.SuperAdministrador,
    Roles.TecnicoMuestras,
    Roles.JefeMuestras,
]

# Tipos de solicitud permitidos para Vendedor Externo
# Fuente: WorkOrderController.php línea 903
# Solo: Desarrollo Completo (1) y Arte con Material (5)
TIPOS_SOLICITUD_VENDEDOR_EXTERNO = [1, 5]


# =============================================================================
# NUEVAS FUNCIONES DE VERIFICACIÓN
# =============================================================================

def can_autoassign_ot(role_id: int) -> bool:
    """
    Verifica si el usuario puede autoasignarse una OT en su área.
    Aplica a: Ingeniero, Diseñador, Catalogador, Precatalogador, Técnico Muestras
    """
    return role_id in ROLES_AUTOASIGNAR_OT


def can_assign_team(role_id: int) -> bool:
    """
    Verifica si el usuario puede asignar/reasignar OTs a su equipo.
    Aplica a: Todos los Jefes de área
    """
    return role_id in ROLES_ASIGNAR_REASIGNAR_EQUIPO


def can_edit_ot_conditional(role_id: int) -> bool:
    """
    Verifica si el usuario puede editar OTs (condicionado a área y estado).
    Los Jefes NO pueden editar, solo asignar/reasignar.
    """
    return role_id in ROLES_EDITAR_OT_CONDICIONAL or role_id in ROLES_ADMIN


def can_view_ots_with_filter(role_id: int) -> bool:
    """
    Verifica si el usuario puede ver todas las OTs usando filtro.
    Por defecto ve solo las suyas.
    """
    return role_id in ROLES_VER_OTS_CON_FILTRO


def can_manage_activity_full(role_id: int) -> bool:
    """
    Verifica si el usuario puede gestionar actividad de forma completa.
    Full gestión en su área, Consulta+Archivo en otras áreas.
    """
    return role_id in ROLES_GESTIONAR_ACTIVIDAD or role_id in ROLES_ADMIN


def can_create_muestras(role_id: int) -> bool:
    """Verifica si el usuario puede crear muestras (en su área)."""
    return role_id in ROLES_CREAR_MUESTRAS or role_id in ROLES_ADMIN


def can_manage_muestras_priority(role_id: int) -> bool:
    """Verifica si el usuario puede anular/marcar prioritarias muestras (Jefes)."""
    return role_id in ROLES_GESTIONAR_MUESTRAS_JEFES or role_id in ROLES_ADMIN


def can_manage_muestras_full(role_id: int) -> bool:
    """Verifica si el usuario tiene gestión completa de muestras."""
    return role_id in ROLES_GESTIONAR_MUESTRAS_FULL


def can_manage_clients(role_id: int) -> bool:
    """Verifica si el usuario puede crear/modificar clientes."""
    return role_id in ROLES_MANTENEDOR_CLIENTES


def get_allowed_tipos_solicitud(role_id: int) -> list:
    """
    Obtiene los tipos de solicitud permitidos para crear OT.
    Vendedor Externo solo puede: Desarrollo Completo (1) y Arte con Material (5)
    Fuente: WorkOrderController.php líneas 902-903
    """
    if role_id == Roles.VendedorExterno:
        return TIPOS_SOLICITUD_VENDEDOR_EXTERNO
    return None  # None = todos permitidos
