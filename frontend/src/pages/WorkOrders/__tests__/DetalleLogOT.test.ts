/**
 * Tests para DetalleLogOT - Sprint O.4
 * Verifica lógica de historial de cambios de OT
 *
 * Fuente Laravel: BitacoraWorkOrder, WorkOrderController
 */
import { describe, it, expect } from 'vitest';

// =============================================
// TIPOS (replicados del componente)
// =============================================

interface LogEntry {
  id: number;
  work_order_id: number;
  created_at: string;
  observacion: string;
  operacion: 'Modificación' | 'Insercion' | 'Eliminacion';
  user_data: {
    nombre: string;
    apellido: string;
  };
  datos_modificados: {
    texto: string;
    antiguo_valor?: { descripcion: string };
    nuevo_valor?: { descripcion: string };
    valor?: { descripcion: string };
  }[];
}

interface FlattenedEntry extends LogEntry {
  modIndex: number;
  campo: string;
  valorAntiguo: string;
  valorNuevo: string;
}

// =============================================
// FUNCIONES DE FORMATEO (replicadas del componente)
// =============================================

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function flattenLogEntries(logEntries: LogEntry[]): FlattenedEntry[] {
  return logEntries.flatMap((entry) =>
    entry.datos_modificados.map((mod, idx) => ({
      ...entry,
      modIndex: idx,
      campo: mod.texto,
      valorAntiguo:
        entry.operacion === 'Modificación'
          ? mod.antiguo_valor?.descripcion || ''
          : 'N/A',
      valorNuevo:
        entry.operacion === 'Modificación'
          ? mod.nuevo_valor?.descripcion || ''
          : mod.valor?.descripcion || '',
    }))
  );
}

function getOperationColor(operacion: string): string {
  switch (operacion) {
    case 'Modificación':
      return 'warning';
    case 'Insercion':
      return 'success';
    case 'Eliminacion':
      return 'danger';
    default:
      return 'secondary';
  }
}

function parseUserData(jsonStr: string): { nombre: string; apellido: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      nombre: parsed.nombre || 'Sistema',
      apellido: parsed.apellido || '',
    };
  } catch {
    return { nombre: 'Sistema', apellido: '' };
  }
}

function getUserFullName(userData: { nombre: string; apellido: string }): string {
  return `${userData.nombre} ${userData.apellido}`.trim();
}

// =============================================
// TESTS - FORMATEO DE FECHA Y HORA
// =============================================

describe('DetalleLogOT - Formateo de Fecha y Hora', () => {
  it('formatea fecha y hora correctamente', () => {
    const result = formatDateTime('2026-03-15 10:30:00');
    expect(result).not.toBe('-');
    expect(result).toContain('2026');
  });

  it('retorna "-" para string vacío', () => {
    expect(formatDateTime('')).toBe('-');
  });

  it('maneja formato ISO', () => {
    const result = formatDateTime('2026-03-15T10:30:00Z');
    expect(result).not.toBe('-');
  });
});

// =============================================
// TESTS - APLANAR ENTRADAS DE LOG
// =============================================

describe('DetalleLogOT - Aplanar Entradas', () => {
  it('aplana entrada con múltiples modificaciones', () => {
    const entries: LogEntry[] = [
      {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Test',
        operacion: 'Modificación',
        user_data: { nombre: 'Juan', apellido: 'Pérez' },
        datos_modificados: [
          { texto: 'Campo1', antiguo_valor: { descripcion: 'A' }, nuevo_valor: { descripcion: 'B' } },
          { texto: 'Campo2', antiguo_valor: { descripcion: 'C' }, nuevo_valor: { descripcion: 'D' } },
        ],
      },
    ];

    const flattened = flattenLogEntries(entries);

    expect(flattened).toHaveLength(2);
    expect(flattened[0].campo).toBe('Campo1');
    expect(flattened[0].valorAntiguo).toBe('A');
    expect(flattened[0].valorNuevo).toBe('B');
    expect(flattened[1].campo).toBe('Campo2');
  });

  it('maneja operación de Inserción', () => {
    const entries: LogEntry[] = [
      {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Nueva OT',
        operacion: 'Insercion',
        user_data: { nombre: 'Juan', apellido: 'Pérez' },
        datos_modificados: [
          { texto: 'OT Creada', valor: { descripcion: 'OT #100' } },
        ],
      },
    ];

    const flattened = flattenLogEntries(entries);

    expect(flattened).toHaveLength(1);
    expect(flattened[0].valorAntiguo).toBe('N/A');
    expect(flattened[0].valorNuevo).toBe('OT #100');
  });

  it('maneja array vacío', () => {
    const flattened = flattenLogEntries([]);
    expect(flattened).toHaveLength(0);
  });

  it('preserva índice de modificación', () => {
    const entries: LogEntry[] = [
      {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Test',
        operacion: 'Modificación',
        user_data: { nombre: 'Juan', apellido: 'Pérez' },
        datos_modificados: [
          { texto: 'A', antiguo_valor: { descripcion: '' }, nuevo_valor: { descripcion: '' } },
          { texto: 'B', antiguo_valor: { descripcion: '' }, nuevo_valor: { descripcion: '' } },
          { texto: 'C', antiguo_valor: { descripcion: '' }, nuevo_valor: { descripcion: '' } },
        ],
      },
    ];

    const flattened = flattenLogEntries(entries);

    expect(flattened[0].modIndex).toBe(0);
    expect(flattened[1].modIndex).toBe(1);
    expect(flattened[2].modIndex).toBe(2);
  });
});

// =============================================
// TESTS - COLORES DE OPERACIÓN
// =============================================

describe('DetalleLogOT - Colores de Operación', () => {
  it('Modificación usa color warning', () => {
    expect(getOperationColor('Modificación')).toBe('warning');
  });

  it('Insercion usa color success', () => {
    expect(getOperationColor('Insercion')).toBe('success');
  });

  it('Eliminacion usa color danger', () => {
    expect(getOperationColor('Eliminacion')).toBe('danger');
  });

  it('Operación desconocida usa color secondary', () => {
    expect(getOperationColor('Otra')).toBe('secondary');
  });
});

// =============================================
// TESTS - PARSING DE USUARIO
// =============================================

describe('DetalleLogOT - Parsing de Usuario', () => {
  it('parsea JSON de usuario válido', () => {
    const result = parseUserData('{"nombre":"Juan","apellido":"Pérez"}');
    expect(result.nombre).toBe('Juan');
    expect(result.apellido).toBe('Pérez');
  });

  it('retorna Sistema para JSON inválido', () => {
    const result = parseUserData('invalid json');
    expect(result.nombre).toBe('Sistema');
    expect(result.apellido).toBe('');
  });

  it('retorna Sistema para JSON vacío', () => {
    const result = parseUserData('{}');
    expect(result.nombre).toBe('Sistema');
    expect(result.apellido).toBe('');
  });

  it('maneja nombre parcial', () => {
    const result = parseUserData('{"nombre":"Ana"}');
    expect(result.nombre).toBe('Ana');
    expect(result.apellido).toBe('');
  });
});

// =============================================
// TESTS - NOMBRE COMPLETO DE USUARIO
// =============================================

describe('DetalleLogOT - Nombre Completo Usuario', () => {
  it('concatena nombre y apellido', () => {
    const result = getUserFullName({ nombre: 'Juan', apellido: 'Pérez' });
    expect(result).toBe('Juan Pérez');
  });

  it('solo nombre cuando no hay apellido', () => {
    const result = getUserFullName({ nombre: 'Ana', apellido: '' });
    expect(result).toBe('Ana');
  });

  it('maneja ambos vacíos', () => {
    const result = getUserFullName({ nombre: '', apellido: '' });
    expect(result).toBe('');
  });
});

// =============================================
// TESTS - ESTRUCTURA DE DATOS
// =============================================

describe('DetalleLogOT - Estructura de Datos', () => {
  it('LogEntry tiene campos requeridos', () => {
    const entry: LogEntry = {
      id: 1,
      work_order_id: 100,
      created_at: '2026-03-15',
      observacion: 'Test',
      operacion: 'Modificación',
      user_data: { nombre: 'Juan', apellido: 'Pérez' },
      datos_modificados: [],
    };

    expect(entry.id).toBeDefined();
    expect(entry.work_order_id).toBeDefined();
    expect(entry.operacion).toBe('Modificación');
  });

  it('FlattenedEntry extiende LogEntry', () => {
    const flattened: FlattenedEntry = {
      id: 1,
      work_order_id: 100,
      created_at: '2026-03-15',
      observacion: 'Test',
      operacion: 'Modificación',
      user_data: { nombre: 'Juan', apellido: 'Pérez' },
      datos_modificados: [],
      modIndex: 0,
      campo: 'Campo Test',
      valorAntiguo: 'A',
      valorNuevo: 'B',
    };

    expect(flattened.modIndex).toBe(0);
    expect(flattened.campo).toBe('Campo Test');
    expect(flattened.valorAntiguo).toBe('A');
    expect(flattened.valorNuevo).toBe('B');
  });
});

// =============================================
// TESTS - TIPOS DE OPERACIÓN
// =============================================

describe('DetalleLogOT - Tipos de Operación', () => {
  const OPERACIONES_VALIDAS: LogEntry['operacion'][] = ['Modificación', 'Insercion', 'Eliminacion'];

  OPERACIONES_VALIDAS.forEach((op) => {
    it(`reconoce operación "${op}"`, () => {
      const entry: LogEntry = {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Test',
        operacion: op,
        user_data: { nombre: 'Test', apellido: '' },
        datos_modificados: [],
      };

      expect(entry.operacion).toBe(op);
      expect(OPERACIONES_VALIDAS).toContain(entry.operacion);
    });
  });
});

// =============================================
// TESTS - VALORES VACÍOS
// =============================================

describe('DetalleLogOT - Manejo de Valores Vacíos', () => {
  it('maneja valor antiguo vacío', () => {
    const entries: LogEntry[] = [
      {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Test',
        operacion: 'Modificación',
        user_data: { nombre: 'Juan', apellido: 'Pérez' },
        datos_modificados: [
          { texto: 'Campo', nuevo_valor: { descripcion: 'Nuevo' } },
        ],
      },
    ];

    const flattened = flattenLogEntries(entries);
    expect(flattened[0].valorAntiguo).toBe('');
  });

  it('maneja valor nuevo vacío', () => {
    const entries: LogEntry[] = [
      {
        id: 1,
        work_order_id: 100,
        created_at: '2026-03-15',
        observacion: 'Test',
        operacion: 'Modificación',
        user_data: { nombre: 'Juan', apellido: 'Pérez' },
        datos_modificados: [
          { texto: 'Campo', antiguo_valor: { descripcion: 'Antiguo' } },
        ],
      },
    ];

    const flattened = flattenLogEntries(entries);
    expect(flattened[0].valorNuevo).toBe('');
  });
});

