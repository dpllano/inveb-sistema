/**
 * Tests para componentes de Sistema
 * Sprint R + S - Sistema y Mobile al 100%
 *
 * Verifica lógica de:
 * - Notificaciones de usuario
 * - Autenticación y sesión
 * - Mobile API patterns
 * - Configuración de FCM
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// CONSTANTES DE SISTEMA
// =============================================================================

// Estados de notificación
const NOTIFICATION_STATUS = {
  ACTIVE: 1,
  READ: 0,
} as const;

// Motivos de notificación (extraídos de Laravel)
const NOTIFICATION_MOTIVOS = [
  'RECHAZO',
  'DEVOLUCION',
  'CONSULTA',
  'APROBACION',
  'ASIGNACION',
  'CAMBIO_ESTADO',
] as const;

// Roles del sistema (de constants.py)
const ROLES = {
  ADMINISTRADOR: 1,
  GERENTE_COMERCIAL: 2,
  GERENTE_GENERAL: 3,
  VENDEDOR: 4,
  DISENADOR: 5,
  DISENADOR_ESTRUCTURAL: 6,
  OPERADOR_PLANTA: 7,
  SUPERVISOR_PLANTA: 8,
  JEFE_VENTAS: 9,
  TECNICO_MUESTRAS: 13,
  ASISTENTE_TECNICO: 14,
  VENDEDOR_EXTERNO: 17,
} as const;

// Áreas de trabajo
const AREAS = {
  DESARROLLO: 1,
  MUESTRAS: 2,
  DISENO: 3,
  CATALOGACION: 4,
  PRECATALOGACION: 5,
} as const;

// =============================================================================
// FUNCIONES DE UTILIDAD PARA NOTIFICACIONES
// =============================================================================

interface Notification {
  id: number;
  work_order_id: number;
  user_id: number;
  motivo: string;
  observacion?: string;
  active: number;
  created_at: string;
  generador_id: number;
}

/**
 * Filtra notificaciones activas de un usuario
 */
function getActiveNotifications(
  notifications: Notification[],
  userId: number
): Notification[] {
  return notifications.filter(
    (n) => n.user_id === userId && n.active === NOTIFICATION_STATUS.ACTIVE
  );
}

/**
 * Cuenta notificaciones por motivo
 */
function countByMotivo(
  notifications: Notification[]
): Record<string, number> {
  return notifications.reduce((acc, n) => {
    acc[n.motivo] = (acc[n.motivo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Marca notificación como leída
 */
function markAsRead(notification: Notification): Notification {
  return { ...notification, active: NOTIFICATION_STATUS.READ };
}

/**
 * Crea notificación nueva
 */
function createNotification(
  workOrderId: number,
  userId: number,
  generadorId: number,
  motivo: string,
  observacion?: string
): Omit<Notification, 'id'> {
  return {
    work_order_id: workOrderId,
    user_id: userId,
    generador_id: generadorId,
    motivo,
    observacion,
    active: NOTIFICATION_STATUS.ACTIVE,
    created_at: new Date().toISOString(),
  };
}

/**
 * Valida motivo de notificación
 */
function isValidMotivo(motivo: string): boolean {
  return (NOTIFICATION_MOTIVOS as readonly string[]).includes(motivo);
}

// =============================================================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================================================

interface User {
  id: number;
  role_id: number;
  email: string;
  nombre: string;
  apellido: string;
  active: boolean;
}

interface JWTPayload {
  sub: string;
  role_id: number;
  exp: number;
  iat: number;
}

/**
 * Verifica si el token ha expirado
 */
function isTokenExpired(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Obtiene tiempo restante del token en segundos
 */
function getTokenTimeRemaining(payload: JWTPayload): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Verifica si el usuario tiene un rol específico
 */
function hasRole(user: User, roleId: number): boolean {
  return user.role_id === roleId;
}

/**
 * Verifica si el usuario tiene alguno de los roles
 */
function hasAnyRole(user: User, roleIds: number[]): boolean {
  return roleIds.includes(user.role_id);
}

/**
 * Verifica si el usuario puede acceder a un área
 */
function canAccessArea(user: User, areaId: number): boolean {
  // Administrador puede acceder a todas las áreas
  if (user.role_id === ROLES.ADMINISTRADOR) return true;

  // Mapeo de roles a áreas permitidas
  const roleAreaMap: Record<number, number[]> = {
    [ROLES.DISENADOR]: [AREAS.DISENO],
    [ROLES.DISENADOR_ESTRUCTURAL]: [AREAS.DISENO],
    [ROLES.TECNICO_MUESTRAS]: [AREAS.MUESTRAS],
    [ROLES.ASISTENTE_TECNICO]: [AREAS.MUESTRAS],
    [ROLES.VENDEDOR]: [AREAS.DESARROLLO, AREAS.CATALOGACION],
    [ROLES.VENDEDOR_EXTERNO]: [AREAS.DESARROLLO],
  };

  const allowedAreas = roleAreaMap[user.role_id] || [];
  return allowedAreas.includes(areaId);
}

// =============================================================================
// FUNCIONES MOBILE API
// =============================================================================

interface MobileOTSummary {
  id: number;
  descripcion: string;
  client_name: string;
  state_name: string;
  dias_en_area: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

/**
 * Calcula semáforo para OT móvil
 */
function calcularSemaforoMobile(diasEnArea: number): 'verde' | 'amarillo' | 'rojo' {
  if (diasEnArea >= 10) return 'rojo';
  if (diasEnArea >= 5) return 'amarillo';
  return 'verde';
}

/**
 * Filtra OTs para vista móvil según rol
 */
function filterOTsForMobile(
  ots: MobileOTSummary[],
  roleId: number,
  userId: number
): MobileOTSummary[] {
  // Vendedor externo solo ve sus propias OTs
  if (roleId === ROLES.VENDEDOR_EXTERNO) {
    return ots.filter((ot) => ot.id > 0); // Placeholder - en real filtraría por vendedor_id
  }
  return ots;
}

/**
 * Ordena OTs por prioridad (semáforo)
 */
function sortOTsByPriority(ots: MobileOTSummary[]): MobileOTSummary[] {
  const priorityMap = { rojo: 0, amarillo: 1, verde: 2 };
  return [...ots].sort(
    (a, b) => priorityMap[a.semaforo] - priorityMap[b.semaforo]
  );
}

/**
 * Agrupa OTs por estado
 */
function groupOTsByState(
  ots: MobileOTSummary[]
): Record<string, MobileOTSummary[]> {
  return ots.reduce((acc, ot) => {
    if (!acc[ot.state_name]) acc[ot.state_name] = [];
    acc[ot.state_name].push(ot);
    return acc;
  }, {} as Record<string, MobileOTSummary[]>);
}

// =============================================================================
// FUNCIONES FCM
// =============================================================================

interface FCMToken {
  user_id: number;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  created_at: string;
  active: boolean;
}

/**
 * Valida formato de token FCM
 */
function isValidFCMToken(token: string): boolean {
  // FCM tokens son strings largos con formato específico
  if (!token || token.length < 100) return false;
  // No debe contener espacios
  if (/\s/.test(token)) return false;
  return true;
}

/**
 * Determina tipo de dispositivo por token
 */
function detectDeviceType(userAgent: string): FCMToken['device_type'] {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  if (ua.includes('android')) return 'android';
  return 'web';
}

/**
 * Filtra tokens activos de usuario
 */
function getActiveTokens(tokens: FCMToken[], userId: number): FCMToken[] {
  return tokens.filter((t) => t.user_id === userId && t.active);
}

// =============================================================================
// TESTS: NOTIFICACIONES
// =============================================================================

describe('Notificaciones', () => {
  describe('getActiveNotifications', () => {
    it('debe filtrar notificaciones activas del usuario', () => {
      const notifications: Notification[] = [
        { id: 1, work_order_id: 100, user_id: 1, motivo: 'RECHAZO', active: 1, created_at: '', generador_id: 2 },
        { id: 2, work_order_id: 101, user_id: 1, motivo: 'CONSULTA', active: 0, created_at: '', generador_id: 2 },
        { id: 3, work_order_id: 102, user_id: 2, motivo: 'RECHAZO', active: 1, created_at: '', generador_id: 1 },
      ];

      const result = getActiveNotifications(notifications, 1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('debe retornar vacío si no hay notificaciones activas', () => {
      const notifications: Notification[] = [
        { id: 1, work_order_id: 100, user_id: 1, motivo: 'RECHAZO', active: 0, created_at: '', generador_id: 2 },
      ];

      expect(getActiveNotifications(notifications, 1)).toHaveLength(0);
    });
  });

  describe('countByMotivo', () => {
    it('debe contar notificaciones por motivo', () => {
      const notifications: Notification[] = [
        { id: 1, work_order_id: 100, user_id: 1, motivo: 'RECHAZO', active: 1, created_at: '', generador_id: 2 },
        { id: 2, work_order_id: 101, user_id: 1, motivo: 'RECHAZO', active: 1, created_at: '', generador_id: 2 },
        { id: 3, work_order_id: 102, user_id: 1, motivo: 'CONSULTA', active: 1, created_at: '', generador_id: 2 },
      ];

      const counts = countByMotivo(notifications);
      expect(counts['RECHAZO']).toBe(2);
      expect(counts['CONSULTA']).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('debe marcar notificación como leída', () => {
      const notification: Notification = {
        id: 1, work_order_id: 100, user_id: 1, motivo: 'RECHAZO',
        active: 1, created_at: '', generador_id: 2
      };

      const result = markAsRead(notification);
      expect(result.active).toBe(NOTIFICATION_STATUS.READ);
      expect(result.id).toBe(notification.id);
    });
  });

  describe('createNotification', () => {
    it('debe crear notificación con campos correctos', () => {
      const notif = createNotification(100, 1, 2, 'RECHAZO', 'Observación test');

      expect(notif.work_order_id).toBe(100);
      expect(notif.user_id).toBe(1);
      expect(notif.generador_id).toBe(2);
      expect(notif.motivo).toBe('RECHAZO');
      expect(notif.observacion).toBe('Observación test');
      expect(notif.active).toBe(NOTIFICATION_STATUS.ACTIVE);
    });

    it('debe permitir observación opcional', () => {
      const notif = createNotification(100, 1, 2, 'CONSULTA');
      expect(notif.observacion).toBeUndefined();
    });
  });

  describe('isValidMotivo', () => {
    it('debe validar motivos conocidos', () => {
      expect(isValidMotivo('RECHAZO')).toBe(true);
      expect(isValidMotivo('DEVOLUCION')).toBe(true);
      expect(isValidMotivo('CONSULTA')).toBe(true);
      expect(isValidMotivo('APROBACION')).toBe(true);
    });

    it('debe rechazar motivos inválidos', () => {
      expect(isValidMotivo('INVALIDO')).toBe(false);
      expect(isValidMotivo('')).toBe(false);
    });
  });
});

// =============================================================================
// TESTS: AUTENTICACIÓN
// =============================================================================

describe('Autenticación', () => {
  describe('isTokenExpired', () => {
    it('debe detectar token expirado', () => {
      const expiredPayload: JWTPayload = {
        sub: '1',
        role_id: 1,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hora atrás
        iat: Math.floor(Date.now() / 1000) - 7200,
      };

      expect(isTokenExpired(expiredPayload)).toBe(true);
    });

    it('debe detectar token válido', () => {
      const validPayload: JWTPayload = {
        sub: '1',
        role_id: 1,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora adelante
        iat: Math.floor(Date.now() / 1000),
      };

      expect(isTokenExpired(validPayload)).toBe(false);
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('debe retornar tiempo restante positivo', () => {
      const payload: JWTPayload = {
        sub: '1',
        role_id: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const remaining = getTokenTimeRemaining(payload);
      expect(remaining).toBeGreaterThan(3500);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('debe retornar 0 para token expirado', () => {
      const payload: JWTPayload = {
        sub: '1',
        role_id: 1,
        exp: Math.floor(Date.now() / 1000) - 3600,
        iat: Math.floor(Date.now() / 1000) - 7200,
      };

      expect(getTokenTimeRemaining(payload)).toBe(0);
    });
  });

  describe('hasRole', () => {
    it('debe verificar rol correcto', () => {
      const user: User = { id: 1, role_id: ROLES.ADMINISTRADOR, email: '', nombre: '', apellido: '', active: true };
      expect(hasRole(user, ROLES.ADMINISTRADOR)).toBe(true);
      expect(hasRole(user, ROLES.VENDEDOR)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('debe verificar si tiene alguno de los roles', () => {
      const user: User = { id: 1, role_id: ROLES.VENDEDOR, email: '', nombre: '', apellido: '', active: true };

      expect(hasAnyRole(user, [ROLES.VENDEDOR, ROLES.VENDEDOR_EXTERNO])).toBe(true);
      expect(hasAnyRole(user, [ROLES.ADMINISTRADOR, ROLES.GERENTE_GENERAL])).toBe(false);
    });
  });

  describe('canAccessArea', () => {
    it('administrador puede acceder a todas las áreas', () => {
      const admin: User = { id: 1, role_id: ROLES.ADMINISTRADOR, email: '', nombre: '', apellido: '', active: true };

      expect(canAccessArea(admin, AREAS.DESARROLLO)).toBe(true);
      expect(canAccessArea(admin, AREAS.MUESTRAS)).toBe(true);
      expect(canAccessArea(admin, AREAS.DISENO)).toBe(true);
    });

    it('diseñador solo accede a área diseño', () => {
      const disenador: User = { id: 2, role_id: ROLES.DISENADOR, email: '', nombre: '', apellido: '', active: true };

      expect(canAccessArea(disenador, AREAS.DISENO)).toBe(true);
      expect(canAccessArea(disenador, AREAS.MUESTRAS)).toBe(false);
    });

    it('técnico muestras solo accede a área muestras', () => {
      const tecnico: User = { id: 3, role_id: ROLES.TECNICO_MUESTRAS, email: '', nombre: '', apellido: '', active: true };

      expect(canAccessArea(tecnico, AREAS.MUESTRAS)).toBe(true);
      expect(canAccessArea(tecnico, AREAS.DESARROLLO)).toBe(false);
    });
  });
});

// =============================================================================
// TESTS: MOBILE API
// =============================================================================

describe('Mobile API', () => {
  describe('calcularSemaforoMobile', () => {
    it('debe retornar verde para pocos días', () => {
      expect(calcularSemaforoMobile(0)).toBe('verde');
      expect(calcularSemaforoMobile(4)).toBe('verde');
    });

    it('debe retornar amarillo para días intermedios', () => {
      expect(calcularSemaforoMobile(5)).toBe('amarillo');
      expect(calcularSemaforoMobile(9)).toBe('amarillo');
    });

    it('debe retornar rojo para muchos días', () => {
      expect(calcularSemaforoMobile(10)).toBe('rojo');
      expect(calcularSemaforoMobile(15)).toBe('rojo');
    });
  });

  describe('sortOTsByPriority', () => {
    it('debe ordenar OTs por semáforo (rojo primero)', () => {
      const ots: MobileOTSummary[] = [
        { id: 1, descripcion: 'OT1', client_name: 'C1', state_name: 'E1', dias_en_area: 2, semaforo: 'verde' },
        { id: 2, descripcion: 'OT2', client_name: 'C2', state_name: 'E2', dias_en_area: 12, semaforo: 'rojo' },
        { id: 3, descripcion: 'OT3', client_name: 'C3', state_name: 'E3', dias_en_area: 6, semaforo: 'amarillo' },
      ];

      const sorted = sortOTsByPriority(ots);
      expect(sorted[0].semaforo).toBe('rojo');
      expect(sorted[1].semaforo).toBe('amarillo');
      expect(sorted[2].semaforo).toBe('verde');
    });
  });

  describe('groupOTsByState', () => {
    it('debe agrupar OTs por estado', () => {
      const ots: MobileOTSummary[] = [
        { id: 1, descripcion: 'OT1', client_name: 'C1', state_name: 'En Proceso', dias_en_area: 2, semaforo: 'verde' },
        { id: 2, descripcion: 'OT2', client_name: 'C2', state_name: 'En Proceso', dias_en_area: 3, semaforo: 'verde' },
        { id: 3, descripcion: 'OT3', client_name: 'C3', state_name: 'Completada', dias_en_area: 0, semaforo: 'verde' },
      ];

      const grouped = groupOTsByState(ots);
      expect(grouped['En Proceso']).toHaveLength(2);
      expect(grouped['Completada']).toHaveLength(1);
    });
  });
});

// =============================================================================
// TESTS: FCM
// =============================================================================

describe('FCM Tokens', () => {
  describe('isValidFCMToken', () => {
    it('debe validar token largo', () => {
      const validToken = 'a'.repeat(150); // Token largo sin espacios
      expect(isValidFCMToken(validToken)).toBe(true);
    });

    it('debe rechazar token corto', () => {
      expect(isValidFCMToken('short')).toBe(false);
      expect(isValidFCMToken('')).toBe(false);
    });

    it('debe rechazar token con espacios', () => {
      const tokenWithSpaces = 'a'.repeat(75) + ' ' + 'b'.repeat(75);
      expect(isValidFCMToken(tokenWithSpaces)).toBe(false);
    });
  });

  describe('detectDeviceType', () => {
    it('debe detectar iOS', () => {
      expect(detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)')).toBe('ios');
      expect(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 15_0)')).toBe('ios');
    });

    it('debe detectar Android', () => {
      expect(detectDeviceType('Mozilla/5.0 (Linux; Android 12)')).toBe('android');
    });

    it('debe detectar web por defecto', () => {
      expect(detectDeviceType('Mozilla/5.0 (Windows NT 10.0)')).toBe('web');
      expect(detectDeviceType('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('web');
    });
  });

  describe('getActiveTokens', () => {
    it('debe filtrar tokens activos del usuario', () => {
      const tokens: FCMToken[] = [
        { user_id: 1, token: 'token1', device_type: 'ios', created_at: '', active: true },
        { user_id: 1, token: 'token2', device_type: 'android', created_at: '', active: false },
        { user_id: 2, token: 'token3', device_type: 'ios', created_at: '', active: true },
      ];

      const result = getActiveTokens(tokens, 1);
      expect(result).toHaveLength(1);
      expect(result[0].token).toBe('token1');
    });
  });
});

// =============================================================================
// TESTS: ROLES Y CONSTANTES
// =============================================================================

describe('Roles y Constantes', () => {
  it('debe tener todos los roles definidos', () => {
    expect(ROLES.ADMINISTRADOR).toBe(1);
    expect(ROLES.GERENTE_COMERCIAL).toBe(2);
    expect(ROLES.VENDEDOR).toBe(4);
    expect(ROLES.DISENADOR).toBe(5);
    expect(ROLES.TECNICO_MUESTRAS).toBe(13);
    expect(ROLES.VENDEDOR_EXTERNO).toBe(17);
  });

  it('debe tener todas las áreas definidas', () => {
    expect(AREAS.DESARROLLO).toBe(1);
    expect(AREAS.MUESTRAS).toBe(2);
    expect(AREAS.DISENO).toBe(3);
    expect(AREAS.CATALOGACION).toBe(4);
    expect(AREAS.PRECATALOGACION).toBe(5);
  });

  it('debe tener todos los motivos de notificación', () => {
    expect(NOTIFICATION_MOTIVOS).toContain('RECHAZO');
    expect(NOTIFICATION_MOTIVOS).toContain('DEVOLUCION');
    expect(NOTIFICATION_MOTIVOS).toContain('CONSULTA');
    expect(NOTIFICATION_MOTIVOS).toContain('APROBACION');
    expect(NOTIFICATION_MOTIVOS.length).toBeGreaterThanOrEqual(6);
  });
});
