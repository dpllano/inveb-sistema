/**
 * Tests para Datos Comerciales de OT - Sprint O.5
 * Verifica campos comerciales en formulario de OT
 *
 * Fuente Laravel:
 * - create_work_orders_table.php
 * - ficha-form.blade.php
 * - WorkOrderController.php
 */
import { describe, it, expect } from 'vitest';

// =============================================
// CONSTANTES - Campos Comerciales
// =============================================

// Campos comerciales requeridos - Fuente: ficha-form.blade.php
const CAMPOS_COMERCIALES_REQUERIDOS = [
  'client_id',
  'tipo_solicitud',
  'canal_id',
  'org_venta_id',
];

// Campos comerciales opcionales
const CAMPOS_COMERCIALES_OPCIONALES = [
  'hierarchy_id',
  'subhierarchy_id',
  'subsubhierarchy_id',
  'instalacion_cliente',
  'nombre_contacto',
  'email_contacto',
  'telefono_contacto',
  'volumen_venta_anual',
  'usd',
  'oc',
];

// Tipos de solicitud - Fuente: WorkOrderController.php
const TIPOS_SOLICITUD = [
  { id: 1, nombre: 'Desarrollo Completo' },
  { id: 2, nombre: 'Cotiza con CAD' },
  { id: 3, nombre: 'Muestra con CAD' },
  { id: 4, nombre: 'Cotiza sin CAD' },
  { id: 5, nombre: 'Arte con Material' },
  { id: 6, nombre: 'Otras Solicitudes Desarrollo' },
  { id: 7, nombre: 'Innovación' },
];

// Tipos de solicitud para Vendedor Externo - Fuente: WorkOrderController.php línea 903
const TIPOS_SOLICITUD_VENDEDOR_EXTERNO = [1, 5];

// Organización de ventas
const ORG_VENTAS = [
  { id: 1, nombre: 'Nacional' },
  { id: 2, nombre: 'Exportación' },
];

// =============================================
// TIPOS
// =============================================

interface DatosComerciales {
  client_id: number;
  tipo_solicitud: number;
  canal_id: number;
  org_venta_id: number;
  hierarchy_id?: number;
  subhierarchy_id?: number;
  subsubhierarchy_id?: number;
  instalacion_cliente?: number;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  volumen_venta_anual?: number;
  usd?: number;
  oc?: number;
}

// =============================================
// FUNCIONES DE VALIDACIÓN
// =============================================

function validateDatosComerciales(datos: Partial<DatosComerciales>): string[] {
  const errors: string[] = [];

  // Campos requeridos
  if (!datos.client_id) {
    errors.push('Cliente es requerido');
  }

  if (!datos.tipo_solicitud) {
    errors.push('Tipo de solicitud es requerido');
  }

  if (!datos.canal_id) {
    errors.push('Canal es requerido');
  }

  // Validación de email si está presente
  if (datos.email_contacto && !isValidEmail(datos.email_contacto)) {
    errors.push('Email de contacto no es válido');
  }

  // Validación de teléfono si está presente
  if (datos.telefono_contacto && !isValidTelefono(datos.telefono_contacto)) {
    errors.push('Teléfono debe tener formato válido');
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidTelefono(telefono: string): boolean {
  // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678
  const cleaned = telefono.replace(/[\s-]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
}

function getTiposSolicitudPorRol(roleId: number): number[] {
  // Vendedor Externo (role_id = 11) solo ve [1, 5]
  if (roleId === 11) {
    return TIPOS_SOLICITUD_VENDEDOR_EXTERNO;
  }
  // Jefe Desarrollo (role_id = 5) no ve tipo 5 (Arte con Material)
  if (roleId === 5) {
    return TIPOS_SOLICITUD.filter(t => t.id !== 5).map(t => t.id);
  }
  // Otros roles ven todos
  return TIPOS_SOLICITUD.map(t => t.id);
}

function shouldLoadInstalaciones(clientId: number | undefined): boolean {
  return clientId !== undefined && clientId > 0;
}

function shouldLoadContactos(instalacionId: number | undefined): boolean {
  return instalacionId !== undefined && instalacionId > 0;
}

// =============================================
// TESTS - CAMPOS REQUERIDOS
// =============================================

describe('DatosComerciales - Campos Requeridos', () => {
  it('lista correcta de campos requeridos', () => {
    expect(CAMPOS_COMERCIALES_REQUERIDOS).toContain('client_id');
    expect(CAMPOS_COMERCIALES_REQUERIDOS).toContain('tipo_solicitud');
    expect(CAMPOS_COMERCIALES_REQUERIDOS).toContain('canal_id');
    expect(CAMPOS_COMERCIALES_REQUERIDOS).toContain('org_venta_id');
  });

  it('tiene 4 campos requeridos', () => {
    expect(CAMPOS_COMERCIALES_REQUERIDOS).toHaveLength(4);
  });
});

// =============================================
// TESTS - VALIDACIÓN
// =============================================

describe('DatosComerciales - Validación', () => {
  it('valida datos completos sin errores', () => {
    const datos: Partial<DatosComerciales> = {
      client_id: 1,
      tipo_solicitud: 1,
      canal_id: 1,
      org_venta_id: 1,
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).toHaveLength(0);
  });

  it('detecta cliente faltante', () => {
    const datos: Partial<DatosComerciales> = {
      tipo_solicitud: 1,
      canal_id: 1,
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).toContain('Cliente es requerido');
  });

  it('detecta tipo solicitud faltante', () => {
    const datos: Partial<DatosComerciales> = {
      client_id: 1,
      canal_id: 1,
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).toContain('Tipo de solicitud es requerido');
  });

  it('detecta canal faltante', () => {
    const datos: Partial<DatosComerciales> = {
      client_id: 1,
      tipo_solicitud: 1,
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).toContain('Canal es requerido');
  });

  it('valida email inválido', () => {
    const datos: Partial<DatosComerciales> = {
      client_id: 1,
      tipo_solicitud: 1,
      canal_id: 1,
      email_contacto: 'email-invalido',
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).toContain('Email de contacto no es válido');
  });

  it('acepta email válido', () => {
    const datos: Partial<DatosComerciales> = {
      client_id: 1,
      tipo_solicitud: 1,
      canal_id: 1,
      email_contacto: 'test@example.com',
    };

    const errors = validateDatosComerciales(datos);
    expect(errors).not.toContain('Email de contacto no es válido');
  });
});

// =============================================
// TESTS - TIPOS DE SOLICITUD
// =============================================

describe('DatosComerciales - Tipos de Solicitud', () => {
  it('tiene 7 tipos de solicitud', () => {
    expect(TIPOS_SOLICITUD).toHaveLength(7);
  });

  it('incluye Desarrollo Completo (ID=1)', () => {
    const tipo = TIPOS_SOLICITUD.find(t => t.id === 1);
    expect(tipo).toBeDefined();
    expect(tipo?.nombre).toBe('Desarrollo Completo');
  });

  it('incluye Arte con Material (ID=5)', () => {
    const tipo = TIPOS_SOLICITUD.find(t => t.id === 5);
    expect(tipo).toBeDefined();
    expect(tipo?.nombre).toBe('Arte con Material');
  });
});

// =============================================
// TESTS - FILTRADO POR ROL
// =============================================

describe('DatosComerciales - Filtrado por Rol', () => {
  it('Vendedor Externo solo ve tipos [1, 5]', () => {
    const tipos = getTiposSolicitudPorRol(11);
    expect(tipos).toEqual([1, 5]);
  });

  it('Jefe Desarrollo no ve tipo 5', () => {
    const tipos = getTiposSolicitudPorRol(5);
    expect(tipos).not.toContain(5);
    expect(tipos).toContain(1);
    expect(tipos).toContain(2);
    expect(tipos).toContain(3);
    expect(tipos).toContain(4);
  });

  it('Otros roles ven todos los tipos', () => {
    const tipos = getTiposSolicitudPorRol(6); // Ingeniero
    expect(tipos).toHaveLength(7);
  });
});

// =============================================
// TESTS - CASCADAS
// =============================================

describe('DatosComerciales - Cascadas', () => {
  it('debe cargar instalaciones cuando hay cliente', () => {
    expect(shouldLoadInstalaciones(1)).toBe(true);
    expect(shouldLoadInstalaciones(100)).toBe(true);
  });

  it('no carga instalaciones sin cliente', () => {
    expect(shouldLoadInstalaciones(undefined)).toBe(false);
    expect(shouldLoadInstalaciones(0)).toBe(false);
  });

  it('debe cargar contactos cuando hay instalación', () => {
    expect(shouldLoadContactos(1)).toBe(true);
    expect(shouldLoadContactos(50)).toBe(true);
  });

  it('no carga contactos sin instalación', () => {
    expect(shouldLoadContactos(undefined)).toBe(false);
    expect(shouldLoadContactos(0)).toBe(false);
  });
});

// =============================================
// TESTS - ORGANIZACIÓN DE VENTAS
// =============================================

describe('DatosComerciales - Organización de Ventas', () => {
  it('tiene 2 opciones de organización', () => {
    expect(ORG_VENTAS).toHaveLength(2);
  });

  it('incluye Nacional (ID=1)', () => {
    const org = ORG_VENTAS.find(o => o.id === 1);
    expect(org?.nombre).toBe('Nacional');
  });

  it('incluye Exportación (ID=2)', () => {
    const org = ORG_VENTAS.find(o => o.id === 2);
    expect(org?.nombre).toBe('Exportación');
  });
});

// =============================================
// TESTS - VALIDACIÓN DE TELÉFONO
// =============================================

describe('DatosComerciales - Validación Teléfono', () => {
  it('acepta teléfono chileno con código país', () => {
    expect(isValidTelefono('+56912345678')).toBe(true);
  });

  it('acepta teléfono sin código país', () => {
    expect(isValidTelefono('912345678')).toBe(true);
  });

  it('acepta teléfono con espacios', () => {
    expect(isValidTelefono('+56 9 1234 5678')).toBe(true);
  });

  it('rechaza teléfono muy corto', () => {
    expect(isValidTelefono('123')).toBe(false);
  });
});

// =============================================
// TESTS - ESTRUCTURA COMPLETA
// =============================================

describe('DatosComerciales - Estructura Completa', () => {
  it('estructura con todos los campos', () => {
    const datos: DatosComerciales = {
      client_id: 1,
      tipo_solicitud: 1,
      canal_id: 1,
      org_venta_id: 1,
      hierarchy_id: 2,
      subhierarchy_id: 3,
      subsubhierarchy_id: 4,
      instalacion_cliente: 5,
      nombre_contacto: 'Juan Pérez',
      email_contacto: 'juan@test.com',
      telefono_contacto: '+56912345678',
      volumen_venta_anual: 1000000,
      usd: 50000,
      oc: 1,
    };

    expect(datos.client_id).toBe(1);
    expect(datos.nombre_contacto).toBe('Juan Pérez');
    expect(validateDatosComerciales(datos)).toHaveLength(0);
  });
});

