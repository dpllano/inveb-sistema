/**
 * Contexto Global de Usuario
 * Sprint K - Task K.4
 * Sprint K+: Correcciones de permisos según feedback del dueño (2026-02-18)
 *
 * Proporciona:
 * - Estado del usuario actual
 * - Funciones de verificación de permisos
 * - Acceso a roles y áreas
 *
 * Fuente Laravel: app/Constants.php
 */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { UserInfo } from '../services/api';

// =============================================================================
// CONSTANTES DE ROLES
// Fuente: app/Constants.php líneas 7-25
// =============================================================================
export const ROLES = {
  ADMIN: 1,
  GERENTE_GENERAL: 2,
  JEFE_VENTAS: 3,
  VENDEDOR: 4,
  JEFE_DESARROLLO: 5,
  INGENIERO: 6,
  JEFE_DISENO: 7,
  DISENADOR: 8,
  JEFE_CATALOGADOR: 9,
  CATALOGADOR: 10,
  JEFE_PRECATALOGADOR: 11,
  PRECATALOGADOR: 12,
  JEFE_MUESTRAS: 13,
  TECNICO_MUESTRAS: 14,
  GERENTE_COMERCIAL: 15,
  API: 17,
  SUPER_ADMIN: 18,
  VENDEDOR_EXTERNO: 19,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

// Nombres legibles de roles
export const ROLE_NAMES: Record<number, string> = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.GERENTE_GENERAL]: 'Gerente General',
  [ROLES.JEFE_VENTAS]: 'Jefe de Ventas',
  [ROLES.VENDEDOR]: 'Vendedor',
  [ROLES.JEFE_DESARROLLO]: 'Jefe de Desarrollo',
  [ROLES.INGENIERO]: 'Ingeniero',
  [ROLES.JEFE_DISENO]: 'Jefe de Diseño',
  [ROLES.DISENADOR]: 'Diseñador',
  [ROLES.JEFE_CATALOGADOR]: 'Jefe de Catalogador',
  [ROLES.CATALOGADOR]: 'Catalogador',
  [ROLES.JEFE_PRECATALOGADOR]: 'Jefe de Precatalogador',
  [ROLES.PRECATALOGADOR]: 'Precatalogador',
  [ROLES.JEFE_MUESTRAS]: 'Jefe de Muestras',
  [ROLES.TECNICO_MUESTRAS]: 'Técnico de Muestras',
  [ROLES.GERENTE_COMERCIAL]: 'Gerente Comercial',
  [ROLES.API]: 'API',
  [ROLES.SUPER_ADMIN]: 'Super Administrador',
  [ROLES.VENDEDOR_EXTERNO]: 'Vendedor Externo',
};

// =============================================================================
// ÁREAS FUNCIONALES
// Fuente: Lógica de Laravel por área de trabajo
// =============================================================================
export const AREAS = {
  VENTAS: [ROLES.JEFE_VENTAS, ROLES.VENDEDOR, ROLES.VENDEDOR_EXTERNO],
  DESARROLLO: [ROLES.JEFE_DESARROLLO, ROLES.INGENIERO],
  DISENO: [ROLES.JEFE_DISENO, ROLES.DISENADOR],
  CATALOGO: [ROLES.JEFE_CATALOGADOR, ROLES.CATALOGADOR, ROLES.JEFE_PRECATALOGADOR, ROLES.PRECATALOGADOR],
  MUESTRAS: [ROLES.JEFE_MUESTRAS, ROLES.TECNICO_MUESTRAS],
  GERENCIA: [ROLES.ADMIN, ROLES.GERENTE_GENERAL, ROLES.GERENTE_COMERCIAL, ROLES.SUPER_ADMIN],
} as const;

// =============================================================================
// AGRUPACIONES DE ROLES - Correcciones del dueño (2026-02-18)
// =============================================================================

// Todos los Jefes de área
export const ROLES_JEFES = [
  ROLES.JEFE_VENTAS,
  ROLES.JEFE_DESARROLLO,
  ROLES.JEFE_DISENO,
  ROLES.JEFE_CATALOGADOR,
  ROLES.JEFE_PRECATALOGADOR,
  ROLES.JEFE_MUESTRAS,
] as const;

// Roles que pueden AUTOASIGNARSE una OT en su área (si no está asignada)
export const ROLES_AUTOASIGNAR_OT = [
  ROLES.INGENIERO,
  ROLES.DISENADOR,
  ROLES.CATALOGADOR,
  ROLES.PRECATALOGADOR,
  ROLES.TECNICO_MUESTRAS,
] as const;

// Roles que pueden ver OTs propias + TODAS con filtro
export const ROLES_VER_OTS_CON_FILTRO = [
  ROLES.VENDEDOR,
  ROLES.VENDEDOR_EXTERNO,
  ROLES.INGENIERO,
  ROLES.DISENADOR,
  ROLES.CATALOGADOR,
  ROLES.PRECATALOGADOR,
  ROLES.TECNICO_MUESTRAS,
] as const;

// Roles que pueden EDITAR OT (condicionado a área y estado)
// Los Jefes NO pueden editar, solo asignar/reasignar
export const ROLES_EDITAR_OT_CONDICIONAL = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.VENDEDOR,
  ROLES.VENDEDOR_EXTERNO,
  ROLES.INGENIERO,
  ROLES.DISENADOR,
  ROLES.CATALOGADOR,
  ROLES.PRECATALOGADOR,
] as const;

// Roles con GESTIÓN ACTIVIDAD (Full en su área, Consulta+Archivo en otras)
export const ROLES_GESTIONAR_ACTIVIDAD = [
  ROLES.VENDEDOR,
  ROLES.VENDEDOR_EXTERNO,
  ROLES.INGENIERO,
  ROLES.TECNICO_MUESTRAS,
] as const;

// Roles que pueden CREAR MUESTRAS (en su área)
export const ROLES_CREAR_MUESTRAS = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.VENDEDOR,
  ROLES.VENDEDOR_EXTERNO,
  ROLES.INGENIERO,
] as const;

// Roles con GESTIÓN FULL de muestras
export const ROLES_GESTIONAR_MUESTRAS_FULL = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.TECNICO_MUESTRAS,
  ROLES.JEFE_MUESTRAS,
] as const;

// Tipos de solicitud permitidos para Vendedor Externo
// Fuente: WorkOrderController.php línea 903
// Solo: Desarrollo Completo (1) y Arte con Material (5)
export const TIPOS_SOLICITUD_VENDEDOR_EXTERNO = [1, 5] as const;

// =============================================================================
// PERMISOS POR FUNCIONALIDAD
// Fuente: WorkOrderController.php y CotizacionController.php
// Actualizado: 2026-02-18 según correcciones del dueño
// =============================================================================
const PERMISOS = {
  // OTs - Visualización
  VER_TODAS_OTS: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GERENTE_GENERAL, ROLES.GERENTE_COMERCIAL, ...ROLES_JEFES],
  VER_OTS_CON_FILTRO: [...ROLES_VER_OTS_CON_FILTRO],

  // OTs - Creación y Edición
  CREAR_OT: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_VENTAS, ROLES.VENDEDOR, ROLES.VENDEDOR_EXTERNO, ROLES.JEFE_DESARROLLO, ROLES.INGENIERO, ROLES.JEFE_DISENO, ROLES.DISENADOR],
  EDITAR_OT_CONDICIONAL: [...ROLES_EDITAR_OT_CONDICIONAL],
  ELIMINAR_OT: [ROLES.ADMIN, ROLES.SUPER_ADMIN],

  // OTs - Asignación (NUEVO)
  AUTOASIGNAR_OT: [...ROLES_AUTOASIGNAR_OT],
  ASIGNAR_REASIGNAR_EQUIPO: [...ROLES_JEFES],

  // OTs - Gestión Actividad (NUEVO)
  GESTIONAR_ACTIVIDAD_FULL: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ...ROLES_GESTIONAR_ACTIVIDAD],
  GESTIONAR_ACTIVIDAD_CONSULTA: [...ROLES_VER_OTS_CON_FILTRO],

  // Cotizaciones
  VER_COTIZACIONES: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GERENTE_GENERAL, ROLES.GERENTE_COMERCIAL, ROLES.JEFE_VENTAS, ROLES.VENDEDOR],
  APROBAR_COTIZACION_NIVEL_1: [ROLES.JEFE_VENTAS, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  APROBAR_COTIZACION_NIVEL_2: [ROLES.GERENTE_COMERCIAL, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  APROBAR_COTIZACION_NIVEL_3: [ROLES.GERENTE_GENERAL, ROLES.ADMIN, ROLES.SUPER_ADMIN],

  // Muestras - Visualización
  VER_MUESTRAS: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_MUESTRAS, ROLES.TECNICO_MUESTRAS, ROLES.JEFE_DESARROLLO],
  GESTIONAR_SALA_CORTE: [ROLES.JEFE_MUESTRAS, ROLES.TECNICO_MUESTRAS],

  // Muestras - Gestión (NUEVO)
  CREAR_MUESTRAS: [...ROLES_CREAR_MUESTRAS],
  GESTIONAR_MUESTRAS_FULL: [...ROLES_GESTIONAR_MUESTRAS_FULL],
  GESTIONAR_MUESTRAS_PRIORITARIAS: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ...ROLES_JEFES],

  // Mantenedores
  VER_MANTENEDORES: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GERENTE_GENERAL],
  EDITAR_MANTENEDORES: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  GESTIONAR_CLIENTES: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_VENTAS],

  // Reportes
  VER_REPORTES: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GERENTE_GENERAL, ROLES.GERENTE_COMERCIAL, ROLES.JEFE_VENTAS, ROLES.JEFE_DESARROLLO],
  VER_REPORTES_FINANCIEROS: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.GERENTE_GENERAL, ROLES.GERENTE_COMERCIAL],

  // Usuarios
  VER_USUARIOS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  GESTIONAR_USUARIOS: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
} as const;

export type PermisoKey = keyof typeof PERMISOS;

// =============================================================================
// ESTADOS OT VISIBLES POR ROL
// Fuente: WorkOrderController.php líneas 240-258
// =============================================================================
const ESTADOS_VENDEDOR = [1, 2, 3, 4, 5, 6, 7, 10, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22];
const ESTADOS_MUESTRAS = [17];
const ESTADOS_TODOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

// =============================================================================
// INTERFACE Y CONTEXT
// =============================================================================
interface UserContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Funciones de verificación base
  hasRole: (roleId: RoleId | RoleId[]) => boolean;
  hasPermission: (permiso: PermisoKey) => boolean;
  isInArea: (area: keyof typeof AREAS) => boolean;
  getEstadosVisibles: () => number[];

  // Funciones de utilidad
  getRoleName: () => string;
  isAdmin: () => boolean;
  isVendedor: () => boolean;
  isGerencia: () => boolean;
  isJefe: () => boolean;

  // Nuevas funciones de permisos (2026-02-18)
  canAutoassignOT: () => boolean;
  canAssignTeam: () => boolean;
  canEditOTConditional: () => boolean;
  canViewOTsWithFilter: () => boolean;
  canManageActivityFull: () => boolean;
  canCreateMuestras: () => boolean;
  canManageMuestrasPriority: () => boolean;
  canManageMuestrasFull: () => boolean;
  canManageClients: () => boolean;
  getAllowedTiposSolicitud: () => number[] | null;

  // Funciones de gestión
  setUser: (user: UserInfo | null) => void;
  refreshUser: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================
const USER_KEY = 'inveb_cascade_user';
const TOKEN_KEY = 'inveb_cascade_token';

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario de localStorage al montar
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem(USER_KEY);
        const token = localStorage.getItem(TOKEN_KEY);

        if (userStr && token) {
          const parsedUser = JSON.parse(userStr) as UserInfo;
          setUserState(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Sincronizar con localStorage
  const setUser = useCallback((newUser: UserInfo | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const refreshUser = useCallback(() => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        setUserState(JSON.parse(userStr));
      }
    } catch {
      // Ignorar errores
    }
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  // Verificar si tiene un rol específico
  const hasRole = useCallback((roleId: RoleId | RoleId[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(roleId) ? roleId : [roleId];
    return roles.includes(user.role_id as RoleId);
  }, [user]);

  // Verificar si tiene un permiso
  const hasPermission = useCallback((permiso: PermisoKey): boolean => {
    if (!user) return false;
    const rolesPermitidos = PERMISOS[permiso] as readonly number[];
    return rolesPermitidos.includes(user.role_id);
  }, [user]);

  // Verificar si pertenece a un área
  const isInArea = useCallback((area: keyof typeof AREAS): boolean => {
    if (!user) return false;
    const rolesArea = AREAS[area] as readonly number[];
    return rolesArea.includes(user.role_id);
  }, [user]);

  // Obtener estados de OT visibles según rol
  const getEstadosVisibles = useCallback((): number[] => {
    if (!user) return [];

    // Vendedor o Jefe de Venta
    if (user.role_id === ROLES.VENDEDOR || user.role_id === ROLES.JEFE_VENTAS) {
      return ESTADOS_VENDEDOR;
    }

    // Técnico o Jefe de Muestras
    if (user.role_id === ROLES.JEFE_MUESTRAS || user.role_id === ROLES.TECNICO_MUESTRAS) {
      return ESTADOS_MUESTRAS;
    }

    // Otros roles ven todos
    return ESTADOS_TODOS;
  }, [user]);

  // Funciones de utilidad
  const getRoleName = useCallback((): string => {
    if (!user) return '';
    return ROLE_NAMES[user.role_id] || `Rol ${user.role_id}`;
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return hasRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]);
  }, [hasRole]);

  const isVendedor = useCallback((): boolean => {
    return hasRole([ROLES.VENDEDOR, ROLES.VENDEDOR_EXTERNO]);
  }, [hasRole]);

  const isGerencia = useCallback((): boolean => {
    return isInArea('GERENCIA');
  }, [isInArea]);

  const isJefe = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_JEFES as readonly number[]).includes(user.role_id);
  }, [user]);

  // =============================================================================
  // NUEVAS FUNCIONES DE PERMISOS (2026-02-18)
  // =============================================================================

  const canAutoassignOT = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_AUTOASIGNAR_OT as readonly number[]).includes(user.role_id);
  }, [user]);

  const canAssignTeam = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_JEFES as readonly number[]).includes(user.role_id);
  }, [user]);

  const canEditOTConditional = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_EDITAR_OT_CONDICIONAL as readonly number[]).includes(user.role_id);
  }, [user]);

  const canViewOTsWithFilter = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_VER_OTS_CON_FILTRO as readonly number[]).includes(user.role_id);
  }, [user]);

  const canManageActivityFull = useCallback((): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return (ROLES_GESTIONAR_ACTIVIDAD as readonly number[]).includes(user.role_id);
  }, [user, isAdmin]);

  const canCreateMuestras = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_CREAR_MUESTRAS as readonly number[]).includes(user.role_id);
  }, [user]);

  const canManageMuestrasPriority = useCallback((): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    return (ROLES_JEFES as readonly number[]).includes(user.role_id);
  }, [user, isAdmin]);

  const canManageMuestrasFull = useCallback((): boolean => {
    if (!user) return false;
    return (ROLES_GESTIONAR_MUESTRAS_FULL as readonly number[]).includes(user.role_id);
  }, [user]);

  const canManageClients = useCallback((): boolean => {
    if (!user) return false;
    return user.role_id === ROLES.ADMIN ||
           user.role_id === ROLES.SUPER_ADMIN ||
           user.role_id === ROLES.JEFE_VENTAS;
  }, [user]);

  const getAllowedTiposSolicitud = useCallback((): number[] | null => {
    if (!user) return null;
    if (user.role_id === ROLES.VENDEDOR_EXTERNO) {
      return [...TIPOS_SOLICITUD_VENDEDOR_EXTERNO];
    }
    return null; // null = todos permitidos
  }, [user]);

  const value = useMemo<UserContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    hasRole,
    hasPermission,
    isInArea,
    getEstadosVisibles,
    getRoleName,
    isAdmin,
    isVendedor,
    isGerencia,
    isJefe,
    // Nuevas funciones (2026-02-18)
    canAutoassignOT,
    canAssignTeam,
    canEditOTConditional,
    canViewOTsWithFilter,
    canManageActivityFull,
    canCreateMuestras,
    canManageMuestrasPriority,
    canManageMuestrasFull,
    canManageClients,
    getAllowedTiposSolicitud,
    setUser,
    refreshUser,
    logout,
  }), [
    user,
    isLoading,
    hasRole,
    hasPermission,
    isInArea,
    getEstadosVisibles,
    getRoleName,
    isAdmin,
    isVendedor,
    isGerencia,
    isJefe,
    canAutoassignOT,
    canAssignTeam,
    canEditOTConditional,
    canViewOTsWithFilter,
    canManageActivityFull,
    canCreateMuestras,
    canManageMuestrasPriority,
    canManageMuestrasFull,
    canManageClients,
    getAllowedTiposSolicitud,
    setUser,
    refreshUser,
    logout,
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// =============================================================================
// COMPONENTES DE UTILIDAD
// =============================================================================

/**
 * Componente que renderiza children solo si el usuario tiene el permiso
 */
interface RequirePermissionProps {
  permiso: PermisoKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ permiso, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = useUser();

  if (!hasPermission(permiso)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente que renderiza children solo si el usuario tiene el rol
 */
interface RequireRoleProps {
  role: RoleId | RoleId[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useUser();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente que renderiza children solo si el usuario pertenece al área
 */
interface RequireAreaProps {
  area: keyof typeof AREAS;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireArea({ area, children, fallback = null }: RequireAreaProps) {
  const { isInArea } = useUser();

  if (!isInArea(area)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default UserContext;
