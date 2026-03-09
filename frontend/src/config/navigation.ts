/**
 * Configuración de Navegación con Permisos
 * Sprint K - Task K.5
 *
 * Define las opciones del menú y sus permisos requeridos.
 * Basado en Laravel: resources/views/layouts/sidebar.blade.php
 */
import { ROLES, type PermisoKey, type RoleId } from '../contexts/UserContext';

// =============================================================================
// TIPOS
// =============================================================================
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  permiso?: PermisoKey;
  roles?: RoleId[];
  children?: NavItem[];
  badge?: string;
  isExternal?: boolean;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

// =============================================================================
// CONFIGURACIÓN DE NAVEGACIÓN
// =============================================================================
export const navigationConfig: NavSection[] = [
  // Sección Principal
  {
    id: 'main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'home',
        path: '/dashboard',
      },
      {
        id: 'notifications',
        label: 'Notificaciones',
        icon: 'bell',
        path: '/notifications',
      },
    ],
  },

  // Órdenes de Trabajo
  {
    id: 'work-orders',
    title: 'Órdenes de Trabajo',
    items: [
      {
        id: 'ots-list',
        label: 'Listado OTs',
        icon: 'list',
        path: '/work-orders',
      },
      {
        id: 'create-ot',
        label: 'Nueva OT',
        icon: 'plus',
        path: '/work-orders/create',
        permiso: 'CREAR_OT',
      },
      {
        id: 'create-ot-special',
        label: 'OT Especial',
        icon: 'star',
        path: '/work-orders/special/create',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_VENTAS],
      },
      {
        id: 'aprobaciones-ot',
        label: 'Aprobaciones OT',
        icon: 'check-circle',
        path: '/work-orders/aprobaciones',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_VENTAS, ROLES.JEFE_DESARROLLO],
      },
      {
        id: 'asignaciones',
        label: 'Asignaciones',
        icon: 'users',
        path: '/work-orders/asignaciones',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_DESARROLLO, ROLES.JEFE_DISENO, ROLES.JEFE_CATALOGADOR],
      },
    ],
  },

  // Cotizaciones
  {
    id: 'cotizaciones',
    title: 'Cotizaciones',
    items: [
      {
        id: 'cotizaciones-list',
        label: 'Listado',
        icon: 'file-text',
        path: '/cotizaciones',
        permiso: 'VER_COTIZACIONES',
      },
      {
        id: 'cotizar-multiples',
        label: 'Cotizar Múltiples',
        icon: 'layers',
        path: '/cotizaciones/cotizar-multiples',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.VENDEDOR, ROLES.JEFE_VENTAS],
      },
      {
        id: 'aprobaciones-cotizacion',
        label: 'Aprobaciones',
        icon: 'check-square',
        path: '/cotizaciones/aprobaciones',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.JEFE_VENTAS, ROLES.GERENTE_COMERCIAL, ROLES.GERENTE_GENERAL],
      },
      {
        id: 'cotizador-externo',
        label: 'Cotizador Externo',
        icon: 'external-link',
        path: '/cotizaciones/externo',
        roles: [ROLES.VENDEDOR_EXTERNO],
      },
    ],
  },

  // Muestras
  {
    id: 'muestras',
    title: 'Muestras',
    items: [
      {
        id: 'muestras-list',
        label: 'Listado Muestras',
        icon: 'package',
        path: '/muestras',
        permiso: 'VER_MUESTRAS',
      },
      {
        id: 'sala-corte',
        label: 'Sala de Corte',
        icon: 'scissors',
        path: '/muestras/sala-corte',
        permiso: 'GESTIONAR_SALA_CORTE',
      },
    ],
  },

  // Reportes
  {
    id: 'reports',
    title: 'Reportes',
    items: [
      {
        id: 'reports-dashboard',
        label: 'Dashboard Reportes',
        icon: 'bar-chart',
        path: '/reports',
        permiso: 'VER_REPORTES',
      },
      {
        id: 'report-ots-activas',
        label: 'OTs Activas por Usuario',
        icon: 'activity',
        path: '/reports/ots-activas-usuario',
        permiso: 'VER_REPORTES',
      },
      {
        id: 'report-ots-completadas',
        label: 'OTs Completadas',
        icon: 'check',
        path: '/reports/ots-completadas',
        permiso: 'VER_REPORTES',
      },
      {
        id: 'report-financiero',
        label: 'Reportes Financieros',
        icon: 'dollar-sign',
        path: '/reports/financiero',
        permiso: 'VER_REPORTES_FINANCIEROS',
      },
    ],
  },

  // Mantenedores
  {
    id: 'mantenedores',
    title: 'Mantenedores',
    items: [
      {
        id: 'clientes',
        label: 'Clientes',
        icon: 'briefcase',
        path: '/mantenedores/clients',
        permiso: 'VER_MANTENEDORES',
      },
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: 'users',
        path: '/mantenedores/users',
        permiso: 'VER_USUARIOS',
      },
      {
        id: 'jerarquias',
        label: 'Jerarquías',
        icon: 'git-branch',
        path: '/mantenedores/jerarquias',
        permiso: 'VER_MANTENEDORES',
      },
      {
        id: 'carga-masiva',
        label: 'Carga Masiva',
        icon: 'upload',
        path: '/mantenedores/bulk-upload',
        permiso: 'EDITAR_MANTENEDORES',
      },
      {
        id: 'mantenedor-generico',
        label: 'Tablas de Sistema',
        icon: 'database',
        path: '/mantenedores/generic',
        permiso: 'VER_MANTENEDORES',
      },
    ],
  },

  // Configuración
  {
    id: 'settings',
    title: 'Configuración',
    items: [
      {
        id: 'change-password',
        label: 'Cambiar Contraseña',
        icon: 'lock',
        path: '/settings/change-password',
      },
      {
        id: 'ayuda-cotizador',
        label: 'Ayuda Cotizador',
        icon: 'help-circle',
        path: '/cotizador/ayuda',
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.VENDEDOR, ROLES.JEFE_VENTAS],
      },
    ],
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Filtra los items de navegación según los permisos del usuario
 */
export function filterNavigationByPermissions(
  sections: NavSection[],
  hasPermission: (permiso: PermisoKey) => boolean,
  hasRole: (roles: RoleId | RoleId[]) => boolean
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Si no tiene restricciones, mostrar siempre
        if (!item.permiso && !item.roles) {
          return true;
        }

        // Verificar permiso
        if (item.permiso && !hasPermission(item.permiso)) {
          return false;
        }

        // Verificar roles
        if (item.roles && !hasRole(item.roles)) {
          return false;
        }

        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Encuentra un item de navegación por su path
 */
export function findNavItemByPath(
  sections: NavSection[],
  path: string
): NavItem | undefined {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const child = item.children.find((c) => c.path === path);
        if (child) {
          return child;
        }
      }
    }
  }
  return undefined;
}

/**
 * Obtiene las migas de pan (breadcrumbs) para un path
 */
export function getBreadcrumbs(
  sections: NavSection[],
  path: string
): { label: string; path?: string }[] {
  const breadcrumbs: { label: string; path?: string }[] = [
    { label: 'Inicio', path: '/dashboard' },
  ];

  for (const section of sections) {
    for (const item of section.items) {
      if (item.path === path) {
        if (section.title) {
          breadcrumbs.push({ label: section.title });
        }
        breadcrumbs.push({ label: item.label, path: item.path });
        return breadcrumbs;
      }

      if (item.children) {
        const child = item.children.find((c) => c.path === path);
        if (child) {
          if (section.title) {
            breadcrumbs.push({ label: section.title });
          }
          breadcrumbs.push({ label: item.label, path: item.path });
          breadcrumbs.push({ label: child.label, path: child.path });
          return breadcrumbs;
        }
      }
    }
  }

  return breadcrumbs;
}

export default navigationConfig;
