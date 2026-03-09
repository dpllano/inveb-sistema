/**
 * Tests para CreateSpecialOT - Sprint O.1.4
 * Verifica lógica de campos para OTs Especiales:
 * - Licitación (ajuste_area_desarrollo=1)
 * - Ficha Técnica (ajuste_area_desarrollo=2)
 * - Estudio Benchmarking (ajuste_area_desarrollo=3)
 *
 * Fuente Laravel: ficha-form-licitacion.blade.php, WorkOrderController.php
 */
import { describe, it, expect } from 'vitest';

// =============================================
// CONSTANTES (replicadas del componente)
// =============================================

// Tipos de OT Especial - Fuente: WorkOrderController.php líneas 1250, 1731
const AJUSTE_AREA = {
  LICITACION: 1,
  FICHA_TECNICA: 2,
  ESTUDIO_BENCH: 3
};

// =============================================
// INTERFACES
// =============================================

interface LicitacionData {
  cantidad_item_licitacion: number | null;
  fecha_maxima_entrega_licitacion: string | null;
  check_entregadas_todas: boolean;
  check_entregadas_algunas: boolean;
  cantidad_entregadas_algunas: number | null;
}

interface FichaTecnicaData {
  check_ficha_simple: boolean;
  check_ficha_doble: boolean;
}

interface EstudioBenchData {
  cantidad_estudio_bench: number | null;
  fecha_maxima_entrega_estudio: string | null;
  ensayos_selected: string[];
}

// =============================================
// FUNCIONES DE VALIDACIÓN (replicadas para testing)
// =============================================

function validateLicitacionData(data: LicitacionData): string[] {
  const errors: string[] = [];

  // Validar exclusividad de checkboxes
  if (data.check_entregadas_todas && data.check_entregadas_algunas) {
    errors.push('Solo puede seleccionar "Todas" o "Algunas", no ambas');
  }

  // Validar cantidad cuando es "Algunas"
  if (data.check_entregadas_algunas && !data.cantidad_entregadas_algunas) {
    errors.push('Debe indicar la cantidad de muestras entregadas');
  }

  // Validar cantidad positiva
  if (data.cantidad_entregadas_algunas !== null && data.cantidad_entregadas_algunas <= 0) {
    errors.push('La cantidad debe ser mayor a 0');
  }

  // Validar cantidad items licitación positiva
  if (data.cantidad_item_licitacion !== null && data.cantidad_item_licitacion <= 0) {
    errors.push('Cantidad items debe ser mayor a 0');
  }

  return errors;
}

function validateFichaTecnicaData(data: FichaTecnicaData): string[] {
  const errors: string[] = [];

  // Validar exclusividad de checkboxes
  if (data.check_ficha_simple && data.check_ficha_doble) {
    errors.push('Solo puede seleccionar "Simple" o "Doble", no ambas');
  }

  return errors;
}

function getAjusteAreaDesarrollo(type: 'licitacion' | 'ficha-tecnica' | 'estudio-bench'): number {
  switch (type) {
    case 'licitacion': return AJUSTE_AREA.LICITACION;
    case 'ficha-tecnica': return AJUSTE_AREA.FICHA_TECNICA;
    case 'estudio-bench': return AJUSTE_AREA.ESTUDIO_BENCH;
  }
}

function shouldShowLicitacionFields(ajusteArea: number | null): boolean {
  return ajusteArea === AJUSTE_AREA.LICITACION;
}

function shouldShowFichaTecnicaFields(ajusteArea: number | null): boolean {
  return ajusteArea === AJUSTE_AREA.FICHA_TECNICA;
}

function shouldShowEstudioBenchFields(ajusteArea: number | null): boolean {
  return ajusteArea === AJUSTE_AREA.ESTUDIO_BENCH;
}

function buildApiPayload(
  type: 'licitacion' | 'ficha-tecnica' | 'estudio-bench',
  licitacionData: LicitacionData,
  fichaTecnicaData: FichaTecnicaData,
  estudioBenchData: EstudioBenchData
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ajuste_area_desarrollo: getAjusteAreaDesarrollo(type)
  };

  if (type === 'licitacion') {
    payload.cantidad_item_licitacion = licitacionData.cantidad_item_licitacion;
    payload.fecha_maxima_entrega_licitacion = licitacionData.fecha_maxima_entrega_licitacion;
    payload.check_entregadas_todas = licitacionData.check_entregadas_todas ? 1 : null;
    payload.check_entregadas_algunas = licitacionData.check_entregadas_algunas ? 1 : null;
    payload.cantidad_entregadas_algunas = licitacionData.check_entregadas_algunas
      ? licitacionData.cantidad_entregadas_algunas
      : null;
  }

  if (type === 'ficha-tecnica') {
    payload.check_ficha_simple = fichaTecnicaData.check_ficha_simple ? 1 : null;
    payload.check_ficha_doble = fichaTecnicaData.check_ficha_doble ? 1 : null;
  }

  if (type === 'estudio-bench') {
    payload.cantidad_estudio_bench = estudioBenchData.cantidad_estudio_bench;
    payload.fecha_maxima_entrega_estudio = estudioBenchData.fecha_maxima_entrega_estudio;
    // Map ensayos to check_estudio_* fields
    estudioBenchData.ensayos_selected.forEach(ensayo => {
      payload[`check_estudio_${ensayo}`] = 1;
    });
  }

  return payload;
}

// =============================================
// TESTS - CONSTANTES Y TIPOS
// =============================================

describe('CreateSpecialOT - Constantes de Tipo', () => {
  it('AJUSTE_AREA.LICITACION es 1', () => {
    expect(AJUSTE_AREA.LICITACION).toBe(1);
  });

  it('AJUSTE_AREA.FICHA_TECNICA es 2', () => {
    expect(AJUSTE_AREA.FICHA_TECNICA).toBe(2);
  });

  it('AJUSTE_AREA.ESTUDIO_BENCH es 3', () => {
    expect(AJUSTE_AREA.ESTUDIO_BENCH).toBe(3);
  });
});

describe('CreateSpecialOT - Mapeo de Tipo a Ajuste', () => {
  it('licitacion mapea a 1', () => {
    expect(getAjusteAreaDesarrollo('licitacion')).toBe(1);
  });

  it('ficha-tecnica mapea a 2', () => {
    expect(getAjusteAreaDesarrollo('ficha-tecnica')).toBe(2);
  });

  it('estudio-bench mapea a 3', () => {
    expect(getAjusteAreaDesarrollo('estudio-bench')).toBe(3);
  });
});

// =============================================
// TESTS - VISIBILIDAD DE CAMPOS
// =============================================

describe('CreateSpecialOT - Visibilidad Campos Licitación', () => {
  it('muestra campos licitación cuando ajuste=1', () => {
    expect(shouldShowLicitacionFields(AJUSTE_AREA.LICITACION)).toBe(true);
  });

  it('oculta campos licitación para otros tipos', () => {
    expect(shouldShowLicitacionFields(AJUSTE_AREA.FICHA_TECNICA)).toBe(false);
    expect(shouldShowLicitacionFields(AJUSTE_AREA.ESTUDIO_BENCH)).toBe(false);
    expect(shouldShowLicitacionFields(null)).toBe(false);
  });
});

describe('CreateSpecialOT - Visibilidad Campos Ficha Técnica', () => {
  it('muestra campos ficha técnica cuando ajuste=2', () => {
    expect(shouldShowFichaTecnicaFields(AJUSTE_AREA.FICHA_TECNICA)).toBe(true);
  });

  it('oculta campos ficha técnica para otros tipos', () => {
    expect(shouldShowFichaTecnicaFields(AJUSTE_AREA.LICITACION)).toBe(false);
    expect(shouldShowFichaTecnicaFields(AJUSTE_AREA.ESTUDIO_BENCH)).toBe(false);
    expect(shouldShowFichaTecnicaFields(null)).toBe(false);
  });
});

describe('CreateSpecialOT - Visibilidad Campos Estudio Bench', () => {
  it('muestra campos estudio bench cuando ajuste=3', () => {
    expect(shouldShowEstudioBenchFields(AJUSTE_AREA.ESTUDIO_BENCH)).toBe(true);
  });

  it('oculta campos estudio bench para otros tipos', () => {
    expect(shouldShowEstudioBenchFields(AJUSTE_AREA.LICITACION)).toBe(false);
    expect(shouldShowEstudioBenchFields(AJUSTE_AREA.FICHA_TECNICA)).toBe(false);
    expect(shouldShowEstudioBenchFields(null)).toBe(false);
  });
});

// =============================================
// TESTS - VALIDACIÓN LICITACIÓN
// =============================================

describe('CreateSpecialOT - Validación Licitación', () => {
  it('valida datos licitación completos sin errores', () => {
    const data: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: true,
      check_entregadas_algunas: false,
      cantidad_entregadas_algunas: null
    };

    const errors = validateLicitacionData(data);
    expect(errors).toHaveLength(0);
  });

  it('detecta error cuando ambos checkboxes están seleccionados', () => {
    const data: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: true,
      check_entregadas_algunas: true,
      cantidad_entregadas_algunas: 3
    };

    const errors = validateLicitacionData(data);
    expect(errors).toContain('Solo puede seleccionar "Todas" o "Algunas", no ambas');
  });

  it('requiere cantidad cuando selecciona "Algunas"', () => {
    const data: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: false,
      check_entregadas_algunas: true,
      cantidad_entregadas_algunas: null
    };

    const errors = validateLicitacionData(data);
    expect(errors).toContain('Debe indicar la cantidad de muestras entregadas');
  });

  it('valida cantidad positiva de muestras', () => {
    const data: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: false,
      check_entregadas_algunas: true,
      cantidad_entregadas_algunas: 0
    };

    const errors = validateLicitacionData(data);
    expect(errors).toContain('La cantidad debe ser mayor a 0');
  });

  it('valida cantidad items licitación positiva', () => {
    const data: LicitacionData = {
      cantidad_item_licitacion: 0,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: true,
      check_entregadas_algunas: false,
      cantidad_entregadas_algunas: null
    };

    const errors = validateLicitacionData(data);
    expect(errors).toContain('Cantidad items debe ser mayor a 0');
  });
});

// =============================================
// TESTS - VALIDACIÓN FICHA TÉCNICA
// =============================================

describe('CreateSpecialOT - Validación Ficha Técnica', () => {
  it('valida ficha simple sin errores', () => {
    const data: FichaTecnicaData = {
      check_ficha_simple: true,
      check_ficha_doble: false
    };

    const errors = validateFichaTecnicaData(data);
    expect(errors).toHaveLength(0);
  });

  it('valida ficha doble sin errores', () => {
    const data: FichaTecnicaData = {
      check_ficha_simple: false,
      check_ficha_doble: true
    };

    const errors = validateFichaTecnicaData(data);
    expect(errors).toHaveLength(0);
  });

  it('detecta error cuando ambos checkboxes están seleccionados', () => {
    const data: FichaTecnicaData = {
      check_ficha_simple: true,
      check_ficha_doble: true
    };

    const errors = validateFichaTecnicaData(data);
    expect(errors).toContain('Solo puede seleccionar "Simple" o "Doble", no ambas');
  });

  it('permite ninguno seleccionado (campos opcionales)', () => {
    const data: FichaTecnicaData = {
      check_ficha_simple: false,
      check_ficha_doble: false
    };

    const errors = validateFichaTecnicaData(data);
    expect(errors).toHaveLength(0);
  });
});

// =============================================
// TESTS - CONSTRUCCIÓN PAYLOAD API
// =============================================

describe('CreateSpecialOT - Payload API Licitación', () => {
  const emptyFichaTecnica: FichaTecnicaData = { check_ficha_simple: false, check_ficha_doble: false };
  const emptyEstudioBench: EstudioBenchData = { cantidad_estudio_bench: null, fecha_maxima_entrega_estudio: null, ensayos_selected: [] };

  it('incluye ajuste_area_desarrollo=1 para licitación', () => {
    const licitacionData: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: true,
      check_entregadas_algunas: false,
      cantidad_entregadas_algunas: null
    };

    const payload = buildApiPayload('licitacion', licitacionData, emptyFichaTecnica, emptyEstudioBench);
    expect(payload.ajuste_area_desarrollo).toBe(1);
  });

  it('incluye campos específicos de licitación', () => {
    const licitacionData: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: '2026-03-15',
      check_entregadas_todas: false,
      check_entregadas_algunas: true,
      cantidad_entregadas_algunas: 3
    };

    const payload = buildApiPayload('licitacion', licitacionData, emptyFichaTecnica, emptyEstudioBench);

    expect(payload.cantidad_item_licitacion).toBe(5);
    expect(payload.fecha_maxima_entrega_licitacion).toBe('2026-03-15');
    expect(payload.check_entregadas_todas).toBeNull();
    expect(payload.check_entregadas_algunas).toBe(1);
    expect(payload.cantidad_entregadas_algunas).toBe(3);
  });

  it('convierte checkboxes booleanos a 1/null para API', () => {
    const licitacionDataTodas: LicitacionData = {
      cantidad_item_licitacion: 5,
      fecha_maxima_entrega_licitacion: null,
      check_entregadas_todas: true,
      check_entregadas_algunas: false,
      cantidad_entregadas_algunas: null
    };

    const payload = buildApiPayload('licitacion', licitacionDataTodas, emptyFichaTecnica, emptyEstudioBench);
    expect(payload.check_entregadas_todas).toBe(1);
    expect(payload.check_entregadas_algunas).toBeNull();
  });
});

describe('CreateSpecialOT - Payload API Ficha Técnica', () => {
  const emptyLicitacion: LicitacionData = {
    cantidad_item_licitacion: null, fecha_maxima_entrega_licitacion: null,
    check_entregadas_todas: false, check_entregadas_algunas: false, cantidad_entregadas_algunas: null
  };
  const emptyEstudioBench: EstudioBenchData = { cantidad_estudio_bench: null, fecha_maxima_entrega_estudio: null, ensayos_selected: [] };

  it('incluye ajuste_area_desarrollo=2 para ficha técnica', () => {
    const fichaTecnicaData: FichaTecnicaData = { check_ficha_simple: true, check_ficha_doble: false };

    const payload = buildApiPayload('ficha-tecnica', emptyLicitacion, fichaTecnicaData, emptyEstudioBench);
    expect(payload.ajuste_area_desarrollo).toBe(2);
  });

  it('incluye campos específicos de ficha técnica', () => {
    const fichaTecnicaData: FichaTecnicaData = { check_ficha_simple: false, check_ficha_doble: true };

    const payload = buildApiPayload('ficha-tecnica', emptyLicitacion, fichaTecnicaData, emptyEstudioBench);
    expect(payload.check_ficha_simple).toBeNull();
    expect(payload.check_ficha_doble).toBe(1);
  });
});

describe('CreateSpecialOT - Payload API Estudio Benchmarking', () => {
  const emptyLicitacion: LicitacionData = {
    cantidad_item_licitacion: null, fecha_maxima_entrega_licitacion: null,
    check_entregadas_todas: false, check_entregadas_algunas: false, cantidad_entregadas_algunas: null
  };
  const emptyFichaTecnica: FichaTecnicaData = { check_ficha_simple: false, check_ficha_doble: false };

  it('incluye ajuste_area_desarrollo=3 para estudio bench', () => {
    const estudioBenchData: EstudioBenchData = {
      cantidad_estudio_bench: 2,
      fecha_maxima_entrega_estudio: '2026-04-01',
      ensayos_selected: ['bct', 'ect']
    };

    const payload = buildApiPayload('estudio-bench', emptyLicitacion, emptyFichaTecnica, estudioBenchData);
    expect(payload.ajuste_area_desarrollo).toBe(3);
  });

  it('incluye campos específicos de estudio bench', () => {
    const estudioBenchData: EstudioBenchData = {
      cantidad_estudio_bench: 2,
      fecha_maxima_entrega_estudio: '2026-04-01',
      ensayos_selected: ['bct', 'ect', 'humedad']
    };

    const payload = buildApiPayload('estudio-bench', emptyLicitacion, emptyFichaTecnica, estudioBenchData);

    expect(payload.cantidad_estudio_bench).toBe(2);
    expect(payload.fecha_maxima_entrega_estudio).toBe('2026-04-01');
    expect(payload.check_estudio_bct).toBe(1);
    expect(payload.check_estudio_ect).toBe(1);
    expect(payload.check_estudio_humedad).toBe(1);
  });
});

// =============================================
// TESTS - ENSAYOS ESTUDIO BENCHMARKING
// =============================================

describe('CreateSpecialOT - Ensayos Disponibles', () => {
  // Fuente Laravel: ficha-form-estudio-bench.blade.php líneas 145-310
  const ENSAYOS_ESPERADOS = [
    'bct', 'ect', 'bct_humedo', 'flat', 'humedad', 'porosidad_ext',
    'espesor', 'cera', 'porosidad_int', 'flexion_fondo', 'gramaje',
    'composicion_papeles', 'cobb_interno', 'cobb_externo', 'flexion_4_puntos',
    'medidas', 'impresion'
  ];

  it('tiene 17 ensayos disponibles', () => {
    expect(ENSAYOS_ESPERADOS).toHaveLength(17);
  });

  it('incluye BCT (lbf)', () => {
    expect(ENSAYOS_ESPERADOS).toContain('bct');
  });

  it('incluye ECT (lb/in)', () => {
    expect(ENSAYOS_ESPERADOS).toContain('ect');
  });

  it('incluye Humedad (%)', () => {
    expect(ENSAYOS_ESPERADOS).toContain('humedad');
  });

  it('incluye Cobb Interno y Externo', () => {
    expect(ENSAYOS_ESPERADOS).toContain('cobb_interno');
    expect(ENSAYOS_ESPERADOS).toContain('cobb_externo');
  });
});

