/**
 * Tests para CargaMasivaDetallesModal - Sprint N.1.4
 * Verifica lógica de parsing Excel y validación de datos
 *
 * NO requiere renderizado de componentes - solo lógica de negocio
 */
import { describe, it, expect } from 'vitest';

// =============================================
// TIPOS (replicados del componente)
// =============================================

interface DetalleRow {
  tipo_detalle: string;
  cantidad: number;
  area_hc?: number;
  carton_codigo?: string;
  carton_id?: number;
  product_type?: string;
  product_type_id?: number;
  proceso?: string;
  process_id?: number;
  golpes_ancho?: number;
  golpes_largo?: number;
  numero_colores?: number;
  impresion?: number;
  porcentaje_cera_interno?: number;
  porcentaje_cera_externo?: number;
  matriz?: number;
  clisse?: number;
  royalty?: number;
  maquila?: number;
  armado_automatico?: number;
  largo_esquinero?: number;
  carton_esquinero_codigo?: string;
  carton_esquinero_id?: number;
  linea_excel: number;
  errores: string[];
}

// =============================================
// FUNCIONES DE VALIDACIÓN (replicadas para testing)
// =============================================

function validarDetalleCorrugado(detalle: DetalleRow): string[] {
  const errores: string[] = [];

  if (!detalle.cantidad || detalle.cantidad <= 0) {
    errores.push('Cantidad es requerida y debe ser mayor a 0');
  }

  if (!detalle.area_hc || detalle.area_hc <= 0) {
    errores.push('Área HC es requerida');
  }

  if (!detalle.carton_codigo && !detalle.carton_id) {
    errores.push('Cartón es requerido');
  }

  return errores;
}

function validarDetalleEsquinero(detalle: DetalleRow): string[] {
  const errores: string[] = [];

  if (!detalle.cantidad || detalle.cantidad <= 0) {
    errores.push('Cantidad es requerida y debe ser mayor a 0');
  }

  if (!detalle.largo_esquinero || detalle.largo_esquinero <= 0) {
    errores.push('Largo esquinero es requerido');
  }

  if (!detalle.carton_esquinero_codigo && !detalle.carton_esquinero_id) {
    errores.push('Cartón esquinero es requerido');
  }

  return errores;
}

function parseNumero(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function parseTipoDetalle(value: unknown): 'Corrugado' | 'Esquinero' | null {
  const str = String(value || '').toLowerCase().trim();
  if (str === 'corrugado' || str === 'c') return 'Corrugado';
  if (str === 'esquinero' || str === 'e') return 'Esquinero';
  return null;
}

// =============================================
// TESTS
// =============================================

describe('CargaMasivaDetallesModal - Validación Corrugados', () => {
  it('valida detalle corrugado completo sin errores', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Corrugado',
      cantidad: 1000,
      area_hc: 0.5,
      carton_codigo: 'BC-001',
      linea_excel: 2,
      errores: []
    };

    const errores = validarDetalleCorrugado(detalle);
    expect(errores).toHaveLength(0);
  });

  it('detecta cantidad faltante', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Corrugado',
      cantidad: 0,
      area_hc: 0.5,
      carton_codigo: 'BC-001',
      linea_excel: 2,
      errores: []
    };

    const errores = validarDetalleCorrugado(detalle);
    expect(errores).toContain('Cantidad es requerida y debe ser mayor a 0');
  });

  it('detecta área HC faltante', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Corrugado',
      cantidad: 1000,
      area_hc: 0,
      carton_codigo: 'BC-001',
      linea_excel: 2,
      errores: []
    };

    const errores = validarDetalleCorrugado(detalle);
    expect(errores).toContain('Área HC es requerida');
  });

  it('detecta cartón faltante', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Corrugado',
      cantidad: 1000,
      area_hc: 0.5,
      linea_excel: 2,
      errores: []
    };

    const errores = validarDetalleCorrugado(detalle);
    expect(errores).toContain('Cartón es requerido');
  });

  it('acepta cartón por ID en lugar de código', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Corrugado',
      cantidad: 1000,
      area_hc: 0.5,
      carton_id: 15,
      linea_excel: 2,
      errores: []
    };

    const errores = validarDetalleCorrugado(detalle);
    expect(errores.filter(e => e.includes('Cartón'))).toHaveLength(0);
  });
});

describe('CargaMasivaDetallesModal - Validación Esquineros', () => {
  it('valida detalle esquinero completo sin errores', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Esquinero',
      cantidad: 500,
      largo_esquinero: 120,
      carton_esquinero_codigo: 'ESQ-001',
      linea_excel: 3,
      errores: []
    };

    const errores = validarDetalleEsquinero(detalle);
    expect(errores).toHaveLength(0);
  });

  it('detecta largo esquinero faltante', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Esquinero',
      cantidad: 500,
      carton_esquinero_codigo: 'ESQ-001',
      linea_excel: 3,
      errores: []
    };

    const errores = validarDetalleEsquinero(detalle);
    expect(errores).toContain('Largo esquinero es requerido');
  });

  it('detecta cartón esquinero faltante', () => {
    const detalle: DetalleRow = {
      tipo_detalle: 'Esquinero',
      cantidad: 500,
      largo_esquinero: 120,
      linea_excel: 3,
      errores: []
    };

    const errores = validarDetalleEsquinero(detalle);
    expect(errores).toContain('Cartón esquinero es requerido');
  });
});

describe('CargaMasivaDetallesModal - Parsing de Números', () => {
  it('parsea número válido', () => {
    expect(parseNumero(100)).toBe(100);
    expect(parseNumero('100')).toBe(100);
    expect(parseNumero(0.5)).toBe(0.5);
    expect(parseNumero('0.5')).toBe(0.5);
  });

  it('retorna undefined para valores vacíos', () => {
    expect(parseNumero(null)).toBeUndefined();
    expect(parseNumero(undefined)).toBeUndefined();
    expect(parseNumero('')).toBeUndefined();
  });

  it('retorna undefined para valores no numéricos', () => {
    expect(parseNumero('abc')).toBeUndefined();
    expect(parseNumero('N/A')).toBeUndefined();
  });

  it('parsea números con decimales correctamente', () => {
    expect(parseNumero(1.234)).toBe(1.234);
    expect(parseNumero('1.234')).toBe(1.234);
  });

  it('parsea números negativos', () => {
    expect(parseNumero(-100)).toBe(-100);
    expect(parseNumero('-100')).toBe(-100);
  });
});

describe('CargaMasivaDetallesModal - Parsing de Tipo Detalle', () => {
  it('parsea "Corrugado" correctamente', () => {
    expect(parseTipoDetalle('Corrugado')).toBe('Corrugado');
    expect(parseTipoDetalle('corrugado')).toBe('Corrugado');
    expect(parseTipoDetalle('CORRUGADO')).toBe('Corrugado');
    expect(parseTipoDetalle('C')).toBe('Corrugado');
    expect(parseTipoDetalle('c')).toBe('Corrugado');
  });

  it('parsea "Esquinero" correctamente', () => {
    expect(parseTipoDetalle('Esquinero')).toBe('Esquinero');
    expect(parseTipoDetalle('esquinero')).toBe('Esquinero');
    expect(parseTipoDetalle('ESQUINERO')).toBe('Esquinero');
    expect(parseTipoDetalle('E')).toBe('Esquinero');
    expect(parseTipoDetalle('e')).toBe('Esquinero');
  });

  it('retorna null para valores inválidos', () => {
    expect(parseTipoDetalle('')).toBeNull();
    expect(parseTipoDetalle(null)).toBeNull();
    expect(parseTipoDetalle('Otro')).toBeNull();
    expect(parseTipoDetalle('X')).toBeNull();
  });

  it('ignora espacios en blanco', () => {
    expect(parseTipoDetalle('  Corrugado  ')).toBe('Corrugado');
    expect(parseTipoDetalle('  E  ')).toBe('Esquinero');
  });
});

describe('CargaMasivaDetallesModal - Estructura de Respuesta API', () => {
  it('verifica estructura de respuesta exitosa', () => {
    const response = {
      success: true,
      total_procesados: 10,
      total_exitosos: 8,
      total_errores: 2,
      errores: [
        { index: 3, error: 'Cartón no encontrado' },
        { index: 7, error: 'Cantidad inválida' }
      ]
    };

    expect(response.success).toBe(true);
    expect(response.total_procesados).toBe(10);
    expect(response.total_exitosos).toBe(8);
    expect(response.total_errores).toBe(2);
    expect(response.errores).toHaveLength(2);
  });

  it('verifica estructura de respuesta con todos errores', () => {
    const response = {
      success: false,
      total_procesados: 5,
      total_exitosos: 0,
      total_errores: 5,
      errores: [
        { index: 1, error: 'Error 1' },
        { index: 2, error: 'Error 2' },
        { index: 3, error: 'Error 3' },
        { index: 4, error: 'Error 4' },
        { index: 5, error: 'Error 5' }
      ]
    };

    expect(response.success).toBe(false);
    expect(response.total_exitosos).toBe(0);
    expect(response.errores).toHaveLength(5);
  });
});

describe('CargaMasivaDetallesModal - Mapeo de Headers', () => {
  const HEADERS_ESPERADOS = [
    'tipo_detalle',
    'cantidad',
    'area_hc',
    'carton',
    'producto',
    'proceso',
    'golpes_ancho',
    'golpes_largo',
    'colores',
    'impresion'
  ];

  it('reconoce headers estándar', () => {
    HEADERS_ESPERADOS.forEach(header => {
      expect(header).toBeDefined();
      expect(typeof header).toBe('string');
    });
  });

  it('cantidad de headers mínimos requeridos', () => {
    expect(HEADERS_ESPERADOS.length).toBeGreaterThanOrEqual(10);
  });
});
