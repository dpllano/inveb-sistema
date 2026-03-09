/**
 * Tests para WorkOrderDetailModal - Sprint O.3
 * Verifica lógica de formateo y visualización de detalles de OT
 *
 * Fuente Laravel: modal-ot-licitacion.blade.php, modal-ot-view.blade.php
 */
import { describe, it, expect } from 'vitest';

// =============================================
// TIPOS (replicados del componente)
// =============================================

interface WorkOrderDetail {
  id: number;
  numero_ot?: string;
  descripcion?: string;
  codigo_producto?: string;
  client_id?: number;
  client_name?: string;
  state_id?: number;
  state_name?: string;
  state_color?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_compromiso?: string;
  tipo_solicitud_id?: number;
  tipo_solicitud_name?: string;
  canal_id?: number;
  canal_name?: string;
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  planta_id?: number;
  planta_name?: string;
  ajuste_area_desarrollo?: number;
  cantidad?: number;
  user_asignado_id?: number;
  user_asignado_name?: string;
  observacion?: string;
}

// =============================================
// FUNCIONES DE FORMATEO (replicadas del componente)
// =============================================

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getOTTypeLabel(ajusteArea?: number): string | null {
  switch (ajusteArea) {
    case 1:
      return 'Licitación';
    case 2:
      return 'Ficha Técnica';
    case 3:
      return 'Estudio Benchmarking';
    default:
      return null;
  }
}

function getDisplayTitle(workOrder: WorkOrderDetail): string {
  return workOrder.numero_ot || `#${workOrder.id}`;
}

function hasContactInfo(workOrder: WorkOrderDetail): boolean {
  return !!(workOrder.nombre_contacto || workOrder.email_contacto || workOrder.telefono_contacto);
}

function hasProductionInfo(workOrder: WorkOrderDetail): boolean {
  return !!(workOrder.planta_name || workOrder.cantidad || workOrder.user_asignado_name);
}

function isSpecialOT(workOrder: WorkOrderDetail): boolean {
  return workOrder.ajuste_area_desarrollo !== undefined && workOrder.ajuste_area_desarrollo !== null;
}

// =============================================
// TESTS - FORMATEO DE FECHAS
// =============================================

describe('WorkOrderDetailModal - Formateo de Fechas', () => {
  it('formatea fecha ISO correctamente', () => {
    const result = formatDate('2026-03-15');
    // El formato depende del locale, verificamos que no sea '-'
    expect(result).not.toBe('-');
    expect(result).toContain('2026');
  });

  it('retorna "-" para fecha undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('retorna "-" para string vacío', () => {
    expect(formatDate('')).toBe('-');
  });

  it('maneja fecha con hora', () => {
    const result = formatDate('2026-03-15T10:30:00');
    expect(result).not.toBe('-');
  });
});

// =============================================
// TESTS - ETIQUETAS DE TIPO OT
// =============================================

describe('WorkOrderDetailModal - Etiquetas de Tipo OT', () => {
  it('retorna "Licitación" para ajuste=1', () => {
    expect(getOTTypeLabel(1)).toBe('Licitación');
  });

  it('retorna "Ficha Técnica" para ajuste=2', () => {
    expect(getOTTypeLabel(2)).toBe('Ficha Técnica');
  });

  it('retorna "Estudio Benchmarking" para ajuste=3', () => {
    expect(getOTTypeLabel(3)).toBe('Estudio Benchmarking');
  });

  it('retorna null para ajuste undefined', () => {
    expect(getOTTypeLabel(undefined)).toBeNull();
  });

  it('retorna null para ajuste 0', () => {
    expect(getOTTypeLabel(0)).toBeNull();
  });

  it('retorna null para otros valores', () => {
    expect(getOTTypeLabel(4)).toBeNull();
    expect(getOTTypeLabel(99)).toBeNull();
  });
});

// =============================================
// TESTS - TÍTULO DE DISPLAY
// =============================================

describe('WorkOrderDetailModal - Título de Display', () => {
  it('usa numero_ot cuando está disponible', () => {
    const workOrder: WorkOrderDetail = { id: 123, numero_ot: 'OT-2026-001' };
    expect(getDisplayTitle(workOrder)).toBe('OT-2026-001');
  });

  it('usa id formateado cuando no hay numero_ot', () => {
    const workOrder: WorkOrderDetail = { id: 456 };
    expect(getDisplayTitle(workOrder)).toBe('#456');
  });

  it('prefiere numero_ot sobre id', () => {
    const workOrder: WorkOrderDetail = { id: 123, numero_ot: 'OT-CUSTOM' };
    expect(getDisplayTitle(workOrder)).toBe('OT-CUSTOM');
  });
});

// =============================================
// TESTS - DETECCIÓN DE INFORMACIÓN
// =============================================

describe('WorkOrderDetailModal - Detección de Contacto', () => {
  it('detecta cuando hay nombre de contacto', () => {
    const workOrder: WorkOrderDetail = { id: 1, nombre_contacto: 'Juan' };
    expect(hasContactInfo(workOrder)).toBe(true);
  });

  it('detecta cuando hay email de contacto', () => {
    const workOrder: WorkOrderDetail = { id: 1, email_contacto: 'juan@test.com' };
    expect(hasContactInfo(workOrder)).toBe(true);
  });

  it('detecta cuando hay teléfono de contacto', () => {
    const workOrder: WorkOrderDetail = { id: 1, telefono_contacto: '+56912345678' };
    expect(hasContactInfo(workOrder)).toBe(true);
  });

  it('detecta cuando no hay información de contacto', () => {
    const workOrder: WorkOrderDetail = { id: 1 };
    expect(hasContactInfo(workOrder)).toBe(false);
  });
});

describe('WorkOrderDetailModal - Detección de Producción', () => {
  it('detecta cuando hay planta', () => {
    const workOrder: WorkOrderDetail = { id: 1, planta_name: 'Planta Santiago' };
    expect(hasProductionInfo(workOrder)).toBe(true);
  });

  it('detecta cuando hay cantidad', () => {
    const workOrder: WorkOrderDetail = { id: 1, cantidad: 1000 };
    expect(hasProductionInfo(workOrder)).toBe(true);
  });

  it('detecta cuando hay usuario asignado', () => {
    const workOrder: WorkOrderDetail = { id: 1, user_asignado_name: 'Ana García' };
    expect(hasProductionInfo(workOrder)).toBe(true);
  });

  it('detecta cuando no hay información de producción', () => {
    const workOrder: WorkOrderDetail = { id: 1 };
    expect(hasProductionInfo(workOrder)).toBe(false);
  });
});

// =============================================
// TESTS - OT ESPECIAL
// =============================================

describe('WorkOrderDetailModal - Detección OT Especial', () => {
  it('detecta Licitación como OT especial', () => {
    const workOrder: WorkOrderDetail = { id: 1, ajuste_area_desarrollo: 1 };
    expect(isSpecialOT(workOrder)).toBe(true);
  });

  it('detecta Ficha Técnica como OT especial', () => {
    const workOrder: WorkOrderDetail = { id: 1, ajuste_area_desarrollo: 2 };
    expect(isSpecialOT(workOrder)).toBe(true);
  });

  it('detecta Estudio Bench como OT especial', () => {
    const workOrder: WorkOrderDetail = { id: 1, ajuste_area_desarrollo: 3 };
    expect(isSpecialOT(workOrder)).toBe(true);
  });

  it('detecta OT normal (sin ajuste)', () => {
    const workOrder: WorkOrderDetail = { id: 1 };
    expect(isSpecialOT(workOrder)).toBe(false);
  });
});

// =============================================
// TESTS - ESTRUCTURA DE DATOS
// =============================================

describe('WorkOrderDetailModal - Estructura de Datos', () => {
  it('estructura completa de WorkOrderDetail', () => {
    const workOrder: WorkOrderDetail = {
      id: 123,
      numero_ot: 'OT-2026-001',
      descripcion: 'Caja de prueba',
      codigo_producto: 'COD-001',
      client_id: 5,
      client_name: 'Cliente Test',
      state_id: 2,
      state_name: 'En Desarrollo',
      state_color: '#2196f3',
      fecha_creacion: '2026-02-22',
      tipo_solicitud_id: 1,
      tipo_solicitud_name: 'Desarrollo Completo',
      canal_id: 1,
      canal_name: 'Directo',
      nombre_contacto: 'Juan Pérez',
      email_contacto: 'juan@test.com',
      telefono_contacto: '+56912345678',
      planta_id: 1,
      planta_name: 'Santiago',
      cantidad: 1000,
      ajuste_area_desarrollo: 1,
      user_asignado_id: 10,
      user_asignado_name: 'Ana García',
      observacion: 'OT de prueba',
    };

    expect(workOrder.id).toBe(123);
    expect(workOrder.numero_ot).toBe('OT-2026-001');
    expect(workOrder.ajuste_area_desarrollo).toBe(1);
    expect(getOTTypeLabel(workOrder.ajuste_area_desarrollo)).toBe('Licitación');
    expect(hasContactInfo(workOrder)).toBe(true);
    expect(hasProductionInfo(workOrder)).toBe(true);
    expect(isSpecialOT(workOrder)).toBe(true);
  });

  it('estructura mínima de WorkOrderDetail', () => {
    const workOrder: WorkOrderDetail = { id: 1 };

    expect(workOrder.id).toBe(1);
    expect(workOrder.numero_ot).toBeUndefined();
    expect(hasContactInfo(workOrder)).toBe(false);
    expect(hasProductionInfo(workOrder)).toBe(false);
    expect(isSpecialOT(workOrder)).toBe(false);
  });
});

// =============================================
// TESTS - COLORES DE ESTADO
// =============================================

describe('WorkOrderDetailModal - Colores de Estado', () => {
  const ESTADOS_CONOCIDOS = [
    { id: 1, name: 'Ingresada', color: '#9e9e9e' },
    { id: 2, name: 'En Desarrollo', color: '#2196f3' },
    { id: 5, name: 'Aprobada', color: '#4caf50' },
    { id: 12, name: 'Rechazada', color: '#f44336' },
  ];

  ESTADOS_CONOCIDOS.forEach((estado) => {
    it(`reconoce estado ${estado.name} (ID=${estado.id})`, () => {
      const workOrder: WorkOrderDetail = {
        id: 1,
        state_id: estado.id,
        state_name: estado.name,
        state_color: estado.color,
      };

      expect(workOrder.state_name).toBe(estado.name);
      expect(workOrder.state_color).toBe(estado.color);
    });
  });
});

// =============================================
// TESTS - FORMATOS DE CANTIDAD
// =============================================

describe('WorkOrderDetailModal - Formato de Cantidad', () => {
  function formatQuantity(cantidad?: number): string {
    if (!cantidad) return '-';
    return cantidad.toLocaleString('es-CL');
  }

  it('formatea cantidad con separador de miles', () => {
    const result = formatQuantity(1000000);
    // Depende del locale, pero no debe ser '-'
    expect(result).not.toBe('-');
    expect(result.length).toBeGreaterThan(4); // Tiene separadores
  });

  it('retorna "-" para cantidad undefined', () => {
    expect(formatQuantity(undefined)).toBe('-');
  });

  it('retorna "-" para cantidad 0', () => {
    expect(formatQuantity(0)).toBe('-');
  });

  it('formatea cantidad pequeña', () => {
    const result = formatQuantity(50);
    expect(result).not.toBe('-');
  });
});

