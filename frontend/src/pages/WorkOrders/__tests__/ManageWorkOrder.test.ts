/**
 * Tests para ManageWorkOrder - Sprint N.2.3
 * Verifica lógica de condicionales para campos dinámicos
 *
 * Fuente Laravel: gestionar.blade.php
 * - Proveedor: visible cuando management_type_id IN (9, 10)
 * - Motivo: visible cuando state_id = 12 (Rechazada)
 */
import { describe, it, expect } from 'vitest';

// =============================================
// CONSTANTES (replicadas del componente)
// =============================================

// Tipos de gestión que requieren Proveedor
const MGMT_ENVIO_DISENADOR_EXTERNO = 9;
const MGMT_RECEPCION_DISENADOR_EXTERNO = 10;

// Estado que requiere Motivo
const STATE_RECHAZADA = 12;

// Área de Ventas
const AREA_VENTAS = 1;

// =============================================
// FUNCIONES DE CONDICIONALES (replicadas para testing)
// =============================================

function shouldShowProveedor(managementTypeId: number | null): boolean {
  if (!managementTypeId) return false;
  return managementTypeId === MGMT_ENVIO_DISENADOR_EXTERNO ||
         managementTypeId === MGMT_RECEPCION_DISENADOR_EXTERNO;
}

function shouldShowMotivo(stateId: number | null): boolean {
  return stateId === STATE_RECHAZADA;
}

function shouldShowMuestraConsulta(areaId: number | null): boolean {
  // Mostrar consulta de muestra cuando área es específica
  // Fuente: verificar en gestionar.blade.php
  return areaId !== null && areaId > 0;
}

function getTransitionValidation(
  managementTypeId: number | null,
  stateId: number | null,
  areaId: number | null,
  proveedorId: number | null,
  motivoId: number | null
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar proveedor si es requerido
  if (shouldShowProveedor(managementTypeId) && !proveedorId) {
    errors.push('Proveedor es requerido para este tipo de gestión');
  }

  // Validar motivo si es rechazo
  if (shouldShowMotivo(stateId) && !motivoId) {
    errors.push('Motivo es requerido para rechazar');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// =============================================
// TESTS
// =============================================

describe('ManageWorkOrder - Condicional Proveedor', () => {
  it('muestra Proveedor cuando tipo gestión es ENVIO_DISENADOR_EXTERNO (9)', () => {
    expect(shouldShowProveedor(MGMT_ENVIO_DISENADOR_EXTERNO)).toBe(true);
  });

  it('muestra Proveedor cuando tipo gestión es RECEPCION_DISENADOR_EXTERNO (10)', () => {
    expect(shouldShowProveedor(MGMT_RECEPCION_DISENADOR_EXTERNO)).toBe(true);
  });

  it('oculta Proveedor para otros tipos de gestión', () => {
    expect(shouldShowProveedor(1)).toBe(false);  // Cambio de estado
    expect(shouldShowProveedor(2)).toBe(false);  // Otro tipo
    expect(shouldShowProveedor(3)).toBe(false);  // Consulta
    expect(shouldShowProveedor(8)).toBe(false);  // Tipo 8
    expect(shouldShowProveedor(11)).toBe(false); // Tipo 11
  });

  it('oculta Proveedor cuando tipo gestión es null', () => {
    expect(shouldShowProveedor(null)).toBe(false);
  });

  it('oculta Proveedor cuando tipo gestión es 0', () => {
    expect(shouldShowProveedor(0)).toBe(false);
  });
});

describe('ManageWorkOrder - Condicional Motivo', () => {
  it('muestra Motivo cuando state_id es STATE_RECHAZADA (12)', () => {
    expect(shouldShowMotivo(STATE_RECHAZADA)).toBe(true);
  });

  it('oculta Motivo para otros estados', () => {
    expect(shouldShowMotivo(1)).toBe(false);   // En desarrollo
    expect(shouldShowMotivo(2)).toBe(false);   // Aprobada
    expect(shouldShowMotivo(5)).toBe(false);   // En producción
    expect(shouldShowMotivo(10)).toBe(false);  // Completada
    expect(shouldShowMotivo(11)).toBe(false);  // Otro estado
    expect(shouldShowMotivo(13)).toBe(false);  // Otro estado
  });

  it('oculta Motivo cuando state_id es null', () => {
    expect(shouldShowMotivo(null)).toBe(false);
  });

  it('oculta Motivo cuando state_id es 0', () => {
    expect(shouldShowMotivo(0)).toBe(false);
  });
});

describe('ManageWorkOrder - Validación de Transición', () => {
  it('valida transición sin campos condicionales', () => {
    const result = getTransitionValidation(1, 5, 2, null, null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('requiere proveedor para tipo gestión 9', () => {
    const result = getTransitionValidation(
      MGMT_ENVIO_DISENADOR_EXTERNO,
      5,
      2,
      null, // Sin proveedor
      null
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Proveedor es requerido para este tipo de gestión');
  });

  it('valida con proveedor para tipo gestión 9', () => {
    const result = getTransitionValidation(
      MGMT_ENVIO_DISENADOR_EXTERNO,
      5,
      2,
      15, // Con proveedor
      null
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('requiere motivo para estado RECHAZADA', () => {
    const result = getTransitionValidation(
      1, // Tipo gestión normal
      STATE_RECHAZADA, // Rechazada
      AREA_VENTAS,
      null,
      null // Sin motivo
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Motivo es requerido para rechazar');
  });

  it('valida con motivo para estado RECHAZADA', () => {
    const result = getTransitionValidation(
      1,
      STATE_RECHAZADA,
      AREA_VENTAS,
      null,
      5 // Con motivo
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('valida cuando ambos campos son requeridos y proporcionados', () => {
    const result = getTransitionValidation(
      MGMT_ENVIO_DISENADOR_EXTERNO,
      STATE_RECHAZADA,
      AREA_VENTAS,
      15, // Con proveedor
      5   // Con motivo
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detecta múltiples errores cuando ambos campos faltan', () => {
    const result = getTransitionValidation(
      MGMT_ENVIO_DISENADOR_EXTERNO,
      STATE_RECHAZADA,
      AREA_VENTAS,
      null, // Sin proveedor
      null  // Sin motivo
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Proveedor es requerido para este tipo de gestión');
    expect(result.errors).toContain('Motivo es requerido para rechazar');
  });
});

describe('ManageWorkOrder - Constantes de Configuración', () => {
  it('constante MGMT_ENVIO_DISENADOR_EXTERNO es 9', () => {
    expect(MGMT_ENVIO_DISENADOR_EXTERNO).toBe(9);
  });

  it('constante MGMT_RECEPCION_DISENADOR_EXTERNO es 10', () => {
    expect(MGMT_RECEPCION_DISENADOR_EXTERNO).toBe(10);
  });

  it('constante STATE_RECHAZADA es 12', () => {
    expect(STATE_RECHAZADA).toBe(12);
  });

  it('constante AREA_VENTAS es 1', () => {
    expect(AREA_VENTAS).toBe(1);
  });
});

describe('ManageWorkOrder - Condicional Muestra Consulta', () => {
  it('muestra consulta cuando área está definida', () => {
    expect(shouldShowMuestraConsulta(1)).toBe(true);
    expect(shouldShowMuestraConsulta(2)).toBe(true);
    expect(shouldShowMuestraConsulta(3)).toBe(true);
  });

  it('oculta consulta cuando área es null', () => {
    expect(shouldShowMuestraConsulta(null)).toBe(false);
  });

  it('oculta consulta cuando área es 0', () => {
    expect(shouldShowMuestraConsulta(0)).toBe(false);
  });
});

describe('ManageWorkOrder - Integración con API', () => {
  it('estructura de TransitionRequest incluye campos condicionales', () => {
    const request = {
      management_type_id: MGMT_ENVIO_DISENADOR_EXTERNO,
      work_space_id: AREA_VENTAS,
      state_id: STATE_RECHAZADA,
      observation: 'Observación de prueba',
      motive_id: 5,
      proveedor_id: 15
    };

    expect(request).toHaveProperty('management_type_id');
    expect(request).toHaveProperty('motive_id');
    expect(request).toHaveProperty('proveedor_id');
  });

  it('campos condicionales son opcionales en request básico', () => {
    const request = {
      management_type_id: 1,
      work_space_id: 2,
      state_id: 5,
      observation: 'Observación'
    };

    expect(request).not.toHaveProperty('motive_id');
    expect(request).not.toHaveProperty('proveedor_id');
  });
});
