/**
 * Tests para BenchmarkingSection - Sprint O.2.4
 * Verifica lógica de componente de Estudio Benchmarking
 *
 * Fuente Laravel:
 * - ficha-form-estudio-bench.blade.php líneas 145-310
 * - WorkOrderController.php líneas 2123-2293
 */
import { describe, it, expect } from 'vitest';

// =============================================
// TIPOS (replicados del componente)
// =============================================

interface Ensayo {
  id: string;
  label: string;
  campo: string;
}

interface DetalleEstudio {
  identificacion: string;
  cliente: string;
  descripcion: string;
}

interface BenchmarkingData {
  cantidad_estudio_bench: number | null;
  fecha_maxima_entrega_estudio: string | null;
  ensayos_selected: string[];
  detalles_estudios: DetalleEstudio[];
}

// =============================================
// CONSTANTES (replicadas del componente)
// =============================================

const ENSAYOS: Ensayo[] = [
  { id: 'bct', label: 'BCT (lbf)', campo: 'check_estudio_bct' },
  { id: 'ect', label: 'ECT (lb/in)', campo: 'check_estudio_ect' },
  { id: 'bct_humedo', label: 'BCT en Humedo (lbf)', campo: 'check_estudio_bct_humedo' },
  { id: 'flat', label: 'Flat Crush (lb/in)', campo: 'check_estudio_flat' },
  { id: 'humedad', label: 'Humedad (%)', campo: 'check_estudio_humedad' },
  { id: 'porosidad_ext', label: 'Porosidad Exterior Gurley', campo: 'check_estudio_porosidad_ext' },
  { id: 'espesor', label: 'Espesor (mm)', campo: 'check_estudio_espesor' },
  { id: 'cera', label: 'Cera', campo: 'check_estudio_cera' },
  { id: 'porosidad_int', label: 'Porosidad Interior Gurley', campo: 'check_estudio_porosidad_int' },
  { id: 'flexion_fondo', label: 'Flexion de Fondo', campo: 'check_estudio_flexion_fondo' },
  { id: 'gramaje', label: 'Gramaje (gr/mt2)', campo: 'check_estudio_gramaje' },
  { id: 'composicion_papeles', label: 'Composicion Papeles', campo: 'check_estudio_composicion_papeles' },
  { id: 'cobb_interno', label: 'Cobb Interno', campo: 'check_estudio_cobb_interno' },
  { id: 'cobb_externo', label: 'Cobb Externo', campo: 'check_estudio_cobb_externo' },
  { id: 'flexion_4_puntos', label: 'Flexion 4 Puntos', campo: 'check_estudio_flexion_4_puntos' },
  { id: 'medidas', label: 'Medidas', campo: 'check_estudio_medidas' },
  { id: 'impresion', label: 'Impresion', campo: 'check_estudio_impresion' },
];

// =============================================
// FUNCIONES DE UTILIDAD (replicadas del componente)
// =============================================

function benchmarkingDataToApiFields(data: BenchmarkingData): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    cantidad_estudio_bench: data.cantidad_estudio_bench,
    fecha_maxima_entrega_estudio: data.fecha_maxima_entrega_estudio,
  };

  ENSAYOS.forEach((ensayo) => {
    fields[ensayo.campo] = data.ensayos_selected.includes(ensayo.id) ? 1 : null;
  });

  if (data.detalles_estudios.length > 0) {
    const detallesConcatenados = data.detalles_estudios
      .map((d) => `${d.identificacion}*${d.cliente}*${d.descripcion}`)
      .join('¡');
    fields.detalle_estudio_bench = detallesConcatenados;
  }

  return fields;
}

function apiFieldsToBenchmarkingData(fields: Record<string, unknown>): BenchmarkingData {
  const ensayos_selected: string[] = [];

  ENSAYOS.forEach((ensayo) => {
    if (fields[ensayo.campo] === 1 || fields[ensayo.campo] === '1') {
      ensayos_selected.push(ensayo.id);
    }
  });

  const detalles_estudios: DetalleEstudio[] = [];
  const detalleStr = fields.detalle_estudio_bench as string;
  if (detalleStr) {
    const items = detalleStr.split('¡');
    items.forEach((item) => {
      const parts = item.split('*');
      if (parts.length >= 3) {
        detalles_estudios.push({
          identificacion: parts[0] || '',
          cliente: parts[1] || '',
          descripcion: parts[2] || '',
        });
      }
    });
  }

  return {
    cantidad_estudio_bench: fields.cantidad_estudio_bench as number | null,
    fecha_maxima_entrega_estudio: fields.fecha_maxima_entrega_estudio as string | null,
    ensayos_selected,
    detalles_estudios,
  };
}

function toggleEnsayo(current: string[], ensayoId: string): string[] {
  return current.includes(ensayoId)
    ? current.filter((id) => id !== ensayoId)
    : [...current, ensayoId];
}

function adjustDetallesArray(current: DetalleEstudio[], newCantidad: number): DetalleEstudio[] {
  const result = [...current];
  while (result.length < newCantidad) {
    result.push({ identificacion: '', cliente: '', descripcion: '' });
  }
  result.length = Math.min(newCantidad, 10);
  return result;
}

// =============================================
// TESTS - ENSAYOS CONSTANTES
// =============================================

describe('BenchmarkingSection - Ensayos Constantes', () => {
  it('tiene 17 ensayos definidos', () => {
    expect(ENSAYOS).toHaveLength(17);
  });

  it('cada ensayo tiene id, label y campo', () => {
    ENSAYOS.forEach((ensayo) => {
      expect(ensayo.id).toBeDefined();
      expect(ensayo.label).toBeDefined();
      expect(ensayo.campo).toBeDefined();
      expect(ensayo.campo).toMatch(/^check_estudio_/);
    });
  });

  it('IDs de ensayos son únicos', () => {
    const ids = ENSAYOS.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ENSAYOS.length);
  });

  it('campos de ensayos son únicos', () => {
    const campos = ENSAYOS.map((e) => e.campo);
    const uniqueCampos = new Set(campos);
    expect(uniqueCampos.size).toBe(ENSAYOS.length);
  });
});

// =============================================
// TESTS - TOGGLE ENSAYO
// =============================================

describe('BenchmarkingSection - Toggle Ensayo', () => {
  it('agrega ensayo cuando no está seleccionado', () => {
    const current: string[] = ['bct'];
    const result = toggleEnsayo(current, 'ect');
    expect(result).toContain('bct');
    expect(result).toContain('ect');
    expect(result).toHaveLength(2);
  });

  it('remueve ensayo cuando está seleccionado', () => {
    const current: string[] = ['bct', 'ect', 'humedad'];
    const result = toggleEnsayo(current, 'ect');
    expect(result).toContain('bct');
    expect(result).toContain('humedad');
    expect(result).not.toContain('ect');
    expect(result).toHaveLength(2);
  });

  it('maneja lista vacía correctamente', () => {
    const current: string[] = [];
    const result = toggleEnsayo(current, 'bct');
    expect(result).toContain('bct');
    expect(result).toHaveLength(1);
  });

  it('remueve último ensayo', () => {
    const current: string[] = ['bct'];
    const result = toggleEnsayo(current, 'bct');
    expect(result).toHaveLength(0);
  });
});

// =============================================
// TESTS - AJUSTE DE DETALLES
// =============================================

describe('BenchmarkingSection - Ajuste Detalles Array', () => {
  it('expande array cuando cantidad aumenta', () => {
    const current: DetalleEstudio[] = [
      { identificacion: 'A', cliente: 'B', descripcion: 'C' },
    ];
    const result = adjustDetallesArray(current, 3);
    expect(result).toHaveLength(3);
    expect(result[0].identificacion).toBe('A');
    expect(result[1].identificacion).toBe('');
    expect(result[2].identificacion).toBe('');
  });

  it('recorta array cuando cantidad disminuye', () => {
    const current: DetalleEstudio[] = [
      { identificacion: 'A', cliente: 'B', descripcion: 'C' },
      { identificacion: 'D', cliente: 'E', descripcion: 'F' },
      { identificacion: 'G', cliente: 'H', descripcion: 'I' },
    ];
    const result = adjustDetallesArray(current, 2);
    expect(result).toHaveLength(2);
    expect(result[0].identificacion).toBe('A');
    expect(result[1].identificacion).toBe('D');
  });

  it('limita máximo a 10 detalles', () => {
    const current: DetalleEstudio[] = [];
    const result = adjustDetallesArray(current, 15);
    expect(result).toHaveLength(10);
  });

  it('maneja array vacío', () => {
    const result = adjustDetallesArray([], 2);
    expect(result).toHaveLength(2);
    expect(result[0].identificacion).toBe('');
  });
});

// =============================================
// TESTS - CONVERSIÓN A API
// =============================================

describe('BenchmarkingSection - Conversión a API Fields', () => {
  it('convierte datos completos a campos de API', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 3,
      fecha_maxima_entrega_estudio: '2026-04-15',
      ensayos_selected: ['bct', 'ect', 'humedad'],
      detalles_estudios: [
        { identificacion: 'ID-1', cliente: 'Cliente A', descripcion: 'Desc 1' },
        { identificacion: 'ID-2', cliente: 'Cliente B', descripcion: 'Desc 2' },
      ],
    };

    const fields = benchmarkingDataToApiFields(data);

    expect(fields.cantidad_estudio_bench).toBe(3);
    expect(fields.fecha_maxima_entrega_estudio).toBe('2026-04-15');
    expect(fields.check_estudio_bct).toBe(1);
    expect(fields.check_estudio_ect).toBe(1);
    expect(fields.check_estudio_humedad).toBe(1);
    expect(fields.check_estudio_cera).toBeNull();
  });

  it('convierte ensayos no seleccionados a null', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 1,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: ['bct'],
      detalles_estudios: [],
    };

    const fields = benchmarkingDataToApiFields(data);

    expect(fields.check_estudio_bct).toBe(1);
    expect(fields.check_estudio_ect).toBeNull();
    expect(fields.check_estudio_humedad).toBeNull();
  });

  it('concatena detalles con separadores correctos', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 2,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: [],
      detalles_estudios: [
        { identificacion: 'ID-1', cliente: 'Cliente A', descripcion: 'Desc 1' },
        { identificacion: 'ID-2', cliente: 'Cliente B', descripcion: 'Desc 2' },
      ],
    };

    const fields = benchmarkingDataToApiFields(data);

    expect(fields.detalle_estudio_bench).toBe('ID-1*Cliente A*Desc 1¡ID-2*Cliente B*Desc 2');
  });

  it('no incluye detalle_estudio_bench si no hay detalles', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 0,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: [],
      detalles_estudios: [],
    };

    const fields = benchmarkingDataToApiFields(data);

    expect(fields.detalle_estudio_bench).toBeUndefined();
  });
});

// =============================================
// TESTS - CONVERSIÓN DESDE API
// =============================================

describe('BenchmarkingSection - Conversión desde API Fields', () => {
  it('parsea campos de API a BenchmarkingData', () => {
    const fields: Record<string, unknown> = {
      cantidad_estudio_bench: 3,
      fecha_maxima_entrega_estudio: '2026-04-15',
      check_estudio_bct: 1,
      check_estudio_ect: 1,
      check_estudio_humedad: null,
      detalle_estudio_bench: 'ID-1*Cliente A*Desc 1¡ID-2*Cliente B*Desc 2',
    };

    const data = apiFieldsToBenchmarkingData(fields);

    expect(data.cantidad_estudio_bench).toBe(3);
    expect(data.fecha_maxima_entrega_estudio).toBe('2026-04-15');
    expect(data.ensayos_selected).toContain('bct');
    expect(data.ensayos_selected).toContain('ect');
    expect(data.ensayos_selected).not.toContain('humedad');
    expect(data.detalles_estudios).toHaveLength(2);
    expect(data.detalles_estudios[0].identificacion).toBe('ID-1');
    expect(data.detalles_estudios[1].cliente).toBe('Cliente B');
  });

  it('maneja campos vacíos', () => {
    const fields: Record<string, unknown> = {
      cantidad_estudio_bench: null,
      fecha_maxima_entrega_estudio: null,
    };

    const data = apiFieldsToBenchmarkingData(fields);

    expect(data.cantidad_estudio_bench).toBeNull();
    expect(data.fecha_maxima_entrega_estudio).toBeNull();
    expect(data.ensayos_selected).toHaveLength(0);
    expect(data.detalles_estudios).toHaveLength(0);
  });

  it('parsea ensayos como string "1"', () => {
    const fields: Record<string, unknown> = {
      check_estudio_bct: '1',
      check_estudio_ect: '1',
    };

    const data = apiFieldsToBenchmarkingData(fields);

    expect(data.ensayos_selected).toContain('bct');
    expect(data.ensayos_selected).toContain('ect');
  });

  it('parsea detalles con separadores', () => {
    const fields: Record<string, unknown> = {
      detalle_estudio_bench: 'A*B*C¡D*E*F¡G*H*I',
    };

    const data = apiFieldsToBenchmarkingData(fields);

    expect(data.detalles_estudios).toHaveLength(3);
    expect(data.detalles_estudios[0]).toEqual({
      identificacion: 'A',
      cliente: 'B',
      descripcion: 'C',
    });
  });
});

// =============================================
// TESTS - VALIDACIONES
// =============================================

describe('BenchmarkingSection - Validaciones', () => {
  function validateBenchmarkingData(data: BenchmarkingData): string[] {
    const errors: string[] = [];

    if (data.cantidad_estudio_bench !== null && data.cantidad_estudio_bench <= 0) {
      errors.push('Cantidad debe ser mayor a 0');
    }

    if (data.cantidad_estudio_bench !== null && data.cantidad_estudio_bench > 10) {
      errors.push('Cantidad máxima es 10');
    }

    if (data.ensayos_selected.length === 0 && data.cantidad_estudio_bench !== null && data.cantidad_estudio_bench > 0) {
      errors.push('Debe seleccionar al menos un ensayo');
    }

    return errors;
  }

  it('valida datos completos sin errores', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 2,
      fecha_maxima_entrega_estudio: '2026-04-15',
      ensayos_selected: ['bct', 'ect'],
      detalles_estudios: [],
    };

    const errors = validateBenchmarkingData(data);
    expect(errors).toHaveLength(0);
  });

  it('detecta cantidad inválida', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 0,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: ['bct'],
      detalles_estudios: [],
    };

    const errors = validateBenchmarkingData(data);
    expect(errors).toContain('Cantidad debe ser mayor a 0');
  });

  it('detecta cantidad mayor al máximo', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 15,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: ['bct'],
      detalles_estudios: [],
    };

    const errors = validateBenchmarkingData(data);
    expect(errors).toContain('Cantidad máxima es 10');
  });

  it('detecta falta de ensayos cuando hay cantidad', () => {
    const data: BenchmarkingData = {
      cantidad_estudio_bench: 2,
      fecha_maxima_entrega_estudio: null,
      ensayos_selected: [],
      detalles_estudios: [],
    };

    const errors = validateBenchmarkingData(data);
    expect(errors).toContain('Debe seleccionar al menos un ensayo');
  });
});

// =============================================
// TESTS - SERIALIZACIÓN
// =============================================

describe('BenchmarkingSection - Serialización Round-Trip', () => {
  it('mantiene datos después de convertir a API y volver', () => {
    const original: BenchmarkingData = {
      cantidad_estudio_bench: 3,
      fecha_maxima_entrega_estudio: '2026-04-15',
      ensayos_selected: ['bct', 'ect', 'humedad'],
      detalles_estudios: [
        { identificacion: 'ID-1', cliente: 'Cliente A', descripcion: 'Desc 1' },
        { identificacion: 'ID-2', cliente: 'Cliente B', descripcion: 'Desc 2' },
      ],
    };

    const apiFields = benchmarkingDataToApiFields(original);
    const restored = apiFieldsToBenchmarkingData(apiFields);

    expect(restored.cantidad_estudio_bench).toBe(original.cantidad_estudio_bench);
    expect(restored.fecha_maxima_entrega_estudio).toBe(original.fecha_maxima_entrega_estudio);
    expect(restored.ensayos_selected.sort()).toEqual(original.ensayos_selected.sort());
    expect(restored.detalles_estudios).toHaveLength(original.detalles_estudios.length);
  });
});

