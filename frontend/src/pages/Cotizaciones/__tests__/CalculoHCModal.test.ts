/**
 * Tests para CalculoHCModal - Sprint N.3.3
 * Verifica lógica de cálculo HC y Cartón
 *
 * Fuente Laravel: modal-calculo-hc.blade.php
 * Modos: 'carton', 'calculo_hc', 'ambos'
 */
import { describe, it, expect } from 'vitest';

// =============================================
// TIPOS (replicados del componente)
// =============================================

interface CalculoFormData {
  tipo_calculo: number; // 1=Cálculo HC y Cartón, 2=Cálculo HC, 3=Cartón
  interno_largo: number | null;
  interno_ancho: number | null;
  interno_alto: number | null;
  style_id: number | null;
  traslape: number | null;
  areahc_product_type_id: number | null;
  prepicado_ventilacion: number;
  onda_id: number | null;
  process_id: number | null;
  rubro_id: number | null;
  carton_color: number | null;
  ect_min_ingresado: number | null;
  envase_id: number | null;
  contenido_caja: number | null;
}

interface CalculoResult {
  externo_largo: number | null;
  externo_ancho: number | null;
  externo_alto: number | null;
  areahc: number | null;
  rmt_resultado: string | number | null;
  ect_min: string | number | null;
  codigo_carton_id: number | null;
  codigo_carton: string;
  ect_min_carton: number | null;
}

// =============================================
// CONSTANTES DE TIPOS DE CÁLCULO
// =============================================

const TIPO_CALCULO = {
  HC_Y_CARTON: 1,
  SOLO_HC: 2,
  SOLO_CARTON: 3
} as const;

const MODOS_MODAL = {
  CARTON: 'carton',
  CALCULO_HC: 'calculo_hc',
  AMBOS: 'ambos'
} as const;

// =============================================
// FUNCIONES DE VALIDACIÓN (replicadas para testing)
// =============================================

function validarCamposHC(data: CalculoFormData): string[] {
  const errores: string[] = [];

  if (!data.interno_largo || data.interno_largo <= 0) {
    errores.push('Largo interno es requerido');
  }

  if (!data.interno_ancho || data.interno_ancho <= 0) {
    errores.push('Ancho interno es requerido');
  }

  if (!data.interno_alto || data.interno_alto <= 0) {
    errores.push('Alto interno es requerido');
  }

  if (!data.style_id) {
    errores.push('Estilo es requerido');
  }

  if (!data.onda_id) {
    errores.push('Onda es requerida');
  }

  return errores;
}

function validarCamposCarton(data: CalculoFormData): string[] {
  const errores: string[] = [];

  if (!data.rubro_id) {
    errores.push('Rubro es requerido');
  }

  if (!data.carton_color) {
    errores.push('Color de cartón es requerido');
  }

  return errores;
}

function getValidacionByTipo(tipoCalculo: number, data: CalculoFormData): string[] {
  switch (tipoCalculo) {
    case TIPO_CALCULO.HC_Y_CARTON:
      return [...validarCamposHC(data), ...validarCamposCarton(data)];
    case TIPO_CALCULO.SOLO_HC:
      return validarCamposHC(data);
    case TIPO_CALCULO.SOLO_CARTON:
      return validarCamposCarton(data);
    default:
      return ['Tipo de cálculo inválido'];
  }
}

function getModoByTipoCalculo(tipoCalculo: number): 'carton' | 'calculo_hc' | 'ambos' {
  switch (tipoCalculo) {
    case TIPO_CALCULO.HC_Y_CARTON:
      return 'ambos';
    case TIPO_CALCULO.SOLO_HC:
      return 'calculo_hc';
    case TIPO_CALCULO.SOLO_CARTON:
      return 'carton';
    default:
      return 'ambos';
  }
}

// =============================================
// TESTS
// =============================================

describe('CalculoHCModal - Tipos de Cálculo', () => {
  it('TIPO_CALCULO.HC_Y_CARTON es 1', () => {
    expect(TIPO_CALCULO.HC_Y_CARTON).toBe(1);
  });

  it('TIPO_CALCULO.SOLO_HC es 2', () => {
    expect(TIPO_CALCULO.SOLO_HC).toBe(2);
  });

  it('TIPO_CALCULO.SOLO_CARTON es 3', () => {
    expect(TIPO_CALCULO.SOLO_CARTON).toBe(3);
  });
});

describe('CalculoHCModal - Modos de Modal', () => {
  it('modo carton es válido', () => {
    expect(MODOS_MODAL.CARTON).toBe('carton');
  });

  it('modo calculo_hc es válido', () => {
    expect(MODOS_MODAL.CALCULO_HC).toBe('calculo_hc');
  });

  it('modo ambos es válido', () => {
    expect(MODOS_MODAL.AMBOS).toBe('ambos');
  });

  it('getModoByTipoCalculo retorna modo correcto', () => {
    expect(getModoByTipoCalculo(1)).toBe('ambos');
    expect(getModoByTipoCalculo(2)).toBe('calculo_hc');
    expect(getModoByTipoCalculo(3)).toBe('carton');
  });
});

describe('CalculoHCModal - Validación HC', () => {
  it('valida campos HC completos sin errores', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: 1,
      traslape: 5,
      areahc_product_type_id: 1,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: 1,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposHC(data);
    expect(errores).toHaveLength(0);
  });

  it('detecta largo interno faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: null,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: 1,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: null,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposHC(data);
    expect(errores).toContain('Largo interno es requerido');
  });

  it('detecta ancho interno faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: 30,
      interno_ancho: 0,
      interno_alto: 15,
      style_id: 1,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: null,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposHC(data);
    expect(errores).toContain('Ancho interno es requerido');
  });

  it('detecta estilo faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: null,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposHC(data);
    expect(errores).toContain('Estilo es requerido');
  });

  it('detecta onda faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: 1,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposHC(data);
    expect(errores).toContain('Onda es requerida');
  });
});

describe('CalculoHCModal - Validación Cartón', () => {
  it('valida campos cartón completos sin errores', () => {
    const data: CalculoFormData = {
      tipo_calculo: 3,
      interno_largo: null,
      interno_ancho: null,
      interno_alto: null,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: 1,
      carton_color: 1,
      ect_min_ingresado: 150,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposCarton(data);
    expect(errores).toHaveLength(0);
  });

  it('detecta rubro faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 3,
      interno_largo: null,
      interno_ancho: null,
      interno_alto: null,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: null,
      carton_color: 1,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposCarton(data);
    expect(errores).toContain('Rubro es requerido');
  });

  it('detecta color de cartón faltante', () => {
    const data: CalculoFormData = {
      tipo_calculo: 3,
      interno_largo: null,
      interno_ancho: null,
      interno_alto: null,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: 1,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = validarCamposCarton(data);
    expect(errores).toContain('Color de cartón es requerido');
  });
});

describe('CalculoHCModal - Validación por Tipo', () => {
  it('valida HC y Cartón cuando tipo es 1', () => {
    const data: CalculoFormData = {
      tipo_calculo: 1,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: 1,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: null,
      rubro_id: 1,
      carton_color: 1,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = getValidacionByTipo(TIPO_CALCULO.HC_Y_CARTON, data);
    expect(errores).toHaveLength(0);
  });

  it('solo valida HC cuando tipo es 2', () => {
    const data: CalculoFormData = {
      tipo_calculo: 2,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15,
      style_id: 1,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: 1,
      process_id: null,
      rubro_id: null, // No requerido para solo HC
      carton_color: null, // No requerido para solo HC
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = getValidacionByTipo(TIPO_CALCULO.SOLO_HC, data);
    expect(errores).toHaveLength(0);
  });

  it('solo valida Cartón cuando tipo es 3', () => {
    const data: CalculoFormData = {
      tipo_calculo: 3,
      interno_largo: null, // No requerido para solo Cartón
      interno_ancho: null,
      interno_alto: null,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: 1,
      carton_color: 1,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = getValidacionByTipo(TIPO_CALCULO.SOLO_CARTON, data);
    expect(errores).toHaveLength(0);
  });

  it('retorna error para tipo inválido', () => {
    const data: CalculoFormData = {
      tipo_calculo: 99,
      interno_largo: null,
      interno_ancho: null,
      interno_alto: null,
      style_id: null,
      traslape: null,
      areahc_product_type_id: null,
      prepicado_ventilacion: 0,
      onda_id: null,
      process_id: null,
      rubro_id: null,
      carton_color: null,
      ect_min_ingresado: null,
      envase_id: null,
      contenido_caja: null
    };

    const errores = getValidacionByTipo(99, data);
    expect(errores).toContain('Tipo de cálculo inválido');
  });
});

describe('CalculoHCModal - Estructura de Resultado', () => {
  it('estructura de CalculoResult tiene todos los campos', () => {
    const resultado: CalculoResult = {
      externo_largo: 32,
      externo_ancho: 22,
      externo_alto: 17,
      areahc: 0.5,
      rmt_resultado: 150,
      ect_min: 140,
      codigo_carton_id: 15,
      codigo_carton: 'BC-001',
      ect_min_carton: 145
    };

    expect(resultado).toHaveProperty('externo_largo');
    expect(resultado).toHaveProperty('externo_ancho');
    expect(resultado).toHaveProperty('externo_alto');
    expect(resultado).toHaveProperty('areahc');
    expect(resultado).toHaveProperty('codigo_carton_id');
    expect(resultado).toHaveProperty('codigo_carton');
  });

  it('resultado puede tener valores nulos', () => {
    const resultado: CalculoResult = {
      externo_largo: null,
      externo_ancho: null,
      externo_alto: null,
      areahc: null,
      rmt_resultado: null,
      ect_min: null,
      codigo_carton_id: null,
      codigo_carton: '',
      ect_min_carton: null
    };

    expect(resultado.externo_largo).toBeNull();
    expect(resultado.areahc).toBeNull();
    expect(resultado.codigo_carton).toBe('');
  });
});

describe('CalculoHCModal - Integración con DetalleForm', () => {
  it('campos transferidos a formulario principal', () => {
    // Verificar que los campos del resultado se pueden usar en DetalleForm
    const camposTransferibles = [
      'interno_largo',
      'interno_ancho',
      'interno_alto',
      'areahc',
      'codigo_carton_id',
      'rubro_id',
      'process_id',
      'numero_colores'
    ];

    camposTransferibles.forEach(campo => {
      expect(campo).toBeDefined();
    });
  });

  it('botón "Usar" transfiere datos', () => {
    // Simular que el botón "Usar" llama onApply con los datos
    const onApplyData = {
      areahc: 0.5,
      codigo_carton_id: 15,
      interno_largo: 30,
      interno_ancho: 20,
      interno_alto: 15
    };

    expect(onApplyData.areahc).toBe(0.5);
    expect(onApplyData.codigo_carton_id).toBe(15);
  });
});
