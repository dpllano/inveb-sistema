/**
 * Tests para MuestraModal - Sprint P
 * Verifica lógica de muestras asociadas a OT
 *
 * Fuente Laravel: MuestraController.php, muestras-ot.blade.php, ot-muestras.js
 */
import { describe, it, expect } from 'vitest';

// =============================================
// CONSTANTES (extraídas del componente)
// =============================================

const DESTINATARIOS_OPTIONS = [
  { id: '1', nombre: 'Retira Ventas VB' },
  { id: '2', nombre: 'Retira Diseñador VB' },
  { id: '3', nombre: 'Envío Laboratorio' },
  { id: '4', nombre: 'Envío Cliente VB' },
  { id: '5', nombre: 'Retira Diseñador Revisión' },
];

const PEGADO_OPTIONS = [
  { id: 1, nombre: 'Sin Pegar' },
  { id: 2, nombre: 'Pegado Flexo Interior' },
  { id: 3, nombre: 'Pegado Flexo Exterior' },
  { id: 4, nombre: 'Pegado Diecutter' },
  { id: 5, nombre: 'Pegado Cajas Fruta' },
  { id: 6, nombre: 'Pegado con Cinta' },
  { id: 7, nombre: 'Sin Pegar con Cinta' },
];

const FORMA_ENVIO_OPTIONS = [
  { id: 'Chile Express', nombre: 'Chile Express' },
  { id: 'Auto Correo', nombre: 'Auto Correo' },
  { id: 'Camión', nombre: 'Camión' },
];

// Estados de muestra - Fuente: muestras.py líneas 5-12
const ESTADO_MUESTRA = {
  SIN_ASIGNAR: 0,
  EN_PROCESO: 1,
  RECHAZADA: 2,
  TERMINADA: 3,
  ANULADA: 4,
  DEVUELTA: 5,
  SALA_CORTE: 6,
};

const ESTADO_MUESTRA_NOMBRE: Record<number, string> = {
  0: 'Sin Asignar',
  1: 'En Proceso',
  2: 'Rechazada',
  3: 'Terminada',
  4: 'Anulada',
  5: 'Devuelta',
  6: 'Sala de Corte',
};

// Roles de vendedor (Issue 12)
const VENDEDOR_ROLES = [4, 17];

// Roles que pueden crear muestras - Fuente: MuestraController.php líneas 63-72
const ROLES_CREAR_MUESTRA = [5, 6]; // Jefe de Desarrollo (5), Ingeniero (6)

// Roles que pueden editar campos específicos - MuestraController líneas 82-207
const ROLES_EDITAR_MUESTRA = [13, 14]; // Técnico de Muestras

// =============================================
// TIPOS
// =============================================

interface MuestraFormData {
  cad_id: number | null;
  carton_id: number | null;
  pegado_id: number | null;
  tiempo_unitario: string;
  carton_muestra_id: number | null;
  destinatarios_id: string[];
  cantidad_vendedor: number | null;
  comentario_vendedor: string;
  cantidad_disenador: number | null;
  comentario_disenador: string;
  cantidad_disenador_revision: number | null;
  comentario_disenador_revision: string;
  cantidad_laboratorio: number | null;
  comentario_laboratorio: string;
  destinatario_1: string;
  comuna_1: number | null;
  direccion_1: string;
  cantidad_1: number | null;
  comentario_1: string;
  destinatario_2: string;
  comuna_2: number | null;
  direccion_2: string;
  cantidad_2: number | null;
  comentario_2: string;
  destinatario_3: string;
  comuna_3: number | null;
  direccion_3: string;
  cantidad_3: number | null;
  comentario_3: string;
  destinatario_4: string;
  comuna_4: number | null;
  direccion_4: string;
  cantidad_4: number | null;
  comentario_4: string;
}

// =============================================
// FUNCIONES DE LÓGICA (replicadas del componente)
// =============================================

function esVendedor(roleId: number): boolean {
  return VENDEDOR_ROLES.includes(roleId);
}

function puedeCrearMuestra(roleId: number): boolean {
  return ROLES_CREAR_MUESTRA.includes(roleId);
}

function puedeEditarMuestra(roleId: number): boolean {
  return ROLES_EDITAR_MUESTRA.includes(roleId);
}

function cadDisabled(tipoSolicitud: number | null): boolean {
  return tipoSolicitud === 1 || tipoSolicitud === 4 || tipoSolicitud === 7;
}

function calcularTotalMuestras(
  formData: MuestraFormData,
  destinatariosSeleccionados: {
    vendedor: boolean;
    disenador: boolean;
    laboratorio: boolean;
    clientes: boolean;
    disenadorRevision: boolean;
  }
): number {
  let total = 0;

  if (destinatariosSeleccionados.vendedor && formData.cantidad_vendedor) {
    total += formData.cantidad_vendedor;
  }
  if (destinatariosSeleccionados.disenador && formData.cantidad_disenador) {
    total += formData.cantidad_disenador;
  }
  if (destinatariosSeleccionados.disenadorRevision && formData.cantidad_disenador_revision) {
    total += formData.cantidad_disenador_revision;
  }
  if (destinatariosSeleccionados.laboratorio && formData.cantidad_laboratorio) {
    total += formData.cantidad_laboratorio;
  }
  if (destinatariosSeleccionados.clientes) {
    total += (formData.cantidad_1 || 0) +
             (formData.cantidad_2 || 0) +
             (formData.cantidad_3 || 0) +
             (formData.cantidad_4 || 0);
  }

  return total;
}

function getDestinatariosSeleccionados(destinatarios_id: string[]) {
  return {
    vendedor: destinatarios_id.includes('1'),
    disenador: destinatarios_id.includes('2'),
    laboratorio: destinatarios_id.includes('3'),
    clientes: destinatarios_id.includes('4'),
    disenadorRevision: destinatarios_id.includes('5'),
  };
}

function getEstadoNombre(estado: number): string {
  return ESTADO_MUESTRA_NOMBRE[estado] || 'Desconocido';
}

// =============================================
// TESTS - DESTINATARIOS
// =============================================

describe('MuestraModal - Destinatarios', () => {
  it('tiene 5 opciones de destinatario', () => {
    expect(DESTINATARIOS_OPTIONS).toHaveLength(5);
  });

  it('incluye Retira Ventas VB (ID=1)', () => {
    const opt = DESTINATARIOS_OPTIONS.find(d => d.id === '1');
    expect(opt?.nombre).toBe('Retira Ventas VB');
  });

  it('incluye Retira Diseñador VB (ID=2)', () => {
    const opt = DESTINATARIOS_OPTIONS.find(d => d.id === '2');
    expect(opt?.nombre).toBe('Retira Diseñador VB');
  });

  it('incluye Envío Laboratorio (ID=3)', () => {
    const opt = DESTINATARIOS_OPTIONS.find(d => d.id === '3');
    expect(opt?.nombre).toBe('Envío Laboratorio');
  });

  it('incluye Envío Cliente VB (ID=4)', () => {
    const opt = DESTINATARIOS_OPTIONS.find(d => d.id === '4');
    expect(opt?.nombre).toBe('Envío Cliente VB');
  });

  it('incluye Retira Diseñador Revisión (ID=5)', () => {
    const opt = DESTINATARIOS_OPTIONS.find(d => d.id === '5');
    expect(opt?.nombre).toBe('Retira Diseñador Revisión');
  });
});

// =============================================
// TESTS - TIPOS DE PEGADO
// =============================================

describe('MuestraModal - Tipos de Pegado', () => {
  it('tiene 7 tipos de pegado', () => {
    expect(PEGADO_OPTIONS).toHaveLength(7);
  });

  it('incluye Sin Pegar (ID=1)', () => {
    const opt = PEGADO_OPTIONS.find(p => p.id === 1);
    expect(opt?.nombre).toBe('Sin Pegar');
  });

  it('incluye Pegado con Cinta (ID=6)', () => {
    const opt = PEGADO_OPTIONS.find(p => p.id === 6);
    expect(opt?.nombre).toBe('Pegado con Cinta');
  });
});

// =============================================
// TESTS - FORMAS DE ENVÍO
// =============================================

describe('MuestraModal - Formas de Envío', () => {
  it('tiene 3 formas de envío', () => {
    expect(FORMA_ENVIO_OPTIONS).toHaveLength(3);
  });

  it('incluye Chile Express', () => {
    const opt = FORMA_ENVIO_OPTIONS.find(f => f.id === 'Chile Express');
    expect(opt).toBeDefined();
  });

  it('incluye Camión', () => {
    const opt = FORMA_ENVIO_OPTIONS.find(f => f.id === 'Camión');
    expect(opt).toBeDefined();
  });
});

// =============================================
// TESTS - ESTADOS DE MUESTRA
// =============================================

describe('MuestraModal - Estados de Muestra', () => {
  it('tiene 7 estados de muestra', () => {
    expect(Object.keys(ESTADO_MUESTRA)).toHaveLength(7);
  });

  it('estado 0 es Sin Asignar', () => {
    expect(getEstadoNombre(0)).toBe('Sin Asignar');
  });

  it('estado 1 es En Proceso', () => {
    expect(getEstadoNombre(1)).toBe('En Proceso');
  });

  it('estado 2 es Rechazada', () => {
    expect(getEstadoNombre(2)).toBe('Rechazada');
  });

  it('estado 3 es Terminada', () => {
    expect(getEstadoNombre(3)).toBe('Terminada');
  });

  it('estado 4 es Anulada', () => {
    expect(getEstadoNombre(4)).toBe('Anulada');
  });

  it('estado 5 es Devuelta', () => {
    expect(getEstadoNombre(5)).toBe('Devuelta');
  });
});

// =============================================
// TESTS - ROLES Y PERMISOS
// =============================================

describe('MuestraModal - Roles y Permisos', () => {
  it('Vendedor (4) es rol de vendedor', () => {
    expect(esVendedor(4)).toBe(true);
  });

  it('Vendedor Externo (17) es rol de vendedor', () => {
    expect(esVendedor(17)).toBe(true);
  });

  it('Ingeniero (6) NO es rol de vendedor', () => {
    expect(esVendedor(6)).toBe(false);
  });

  it('Jefe Desarrollo (5) puede crear muestra', () => {
    expect(puedeCrearMuestra(5)).toBe(true);
  });

  it('Ingeniero (6) puede crear muestra', () => {
    expect(puedeCrearMuestra(6)).toBe(true);
  });

  it('Vendedor (4) NO puede crear muestra', () => {
    expect(puedeCrearMuestra(4)).toBe(false);
  });

  it('Técnico Muestras (13) puede editar muestra', () => {
    expect(puedeEditarMuestra(13)).toBe(true);
  });

  it('Técnico Muestras (14) puede editar muestra', () => {
    expect(puedeEditarMuestra(14)).toBe(true);
  });
});

// =============================================
// TESTS - CAMPOS DESHABILITADOS
// =============================================

describe('MuestraModal - Campos Deshabilitados', () => {
  it('CAD deshabilitado para tipo_solicitud=1 (Desarrollo Completo)', () => {
    expect(cadDisabled(1)).toBe(true);
  });

  it('CAD deshabilitado para tipo_solicitud=4 (Cotiza sin CAD)', () => {
    expect(cadDisabled(4)).toBe(true);
  });

  it('CAD deshabilitado para tipo_solicitud=7 (Innovación)', () => {
    expect(cadDisabled(7)).toBe(true);
  });

  it('CAD habilitado para tipo_solicitud=2 (Cotiza con CAD)', () => {
    expect(cadDisabled(2)).toBe(false);
  });

  it('CAD habilitado para tipo_solicitud=null', () => {
    expect(cadDisabled(null)).toBe(false);
  });
});

// =============================================
// TESTS - CÁLCULO TOTAL MUESTRAS
// =============================================

describe('MuestraModal - Cálculo Total Muestras', () => {
  const formDataBase: MuestraFormData = {
    cad_id: 1,
    carton_id: 1,
    pegado_id: 1,
    tiempo_unitario: '',
    carton_muestra_id: null,
    destinatarios_id: [],
    cantidad_vendedor: null,
    comentario_vendedor: 'Retira Vendedor',
    cantidad_disenador: null,
    comentario_disenador: '',
    cantidad_disenador_revision: null,
    comentario_disenador_revision: '',
    cantidad_laboratorio: null,
    comentario_laboratorio: '',
    destinatario_1: '',
    comuna_1: null,
    direccion_1: '',
    cantidad_1: null,
    comentario_1: '',
    destinatario_2: '',
    comuna_2: null,
    direccion_2: '',
    cantidad_2: null,
    comentario_2: '',
    destinatario_3: '',
    comuna_3: null,
    direccion_3: '',
    cantidad_3: null,
    comentario_3: '',
    destinatario_4: '',
    comuna_4: null,
    direccion_4: '',
    cantidad_4: null,
    comentario_4: '',
  };

  it('calcula 0 muestras sin destinatarios seleccionados', () => {
    const formData = { ...formDataBase };
    const dest = getDestinatariosSeleccionados([]);
    expect(calcularTotalMuestras(formData, dest)).toBe(0);
  });

  it('calcula muestras para vendedor', () => {
    const formData = { ...formDataBase, cantidad_vendedor: 5 };
    const dest = getDestinatariosSeleccionados(['1']);
    expect(calcularTotalMuestras(formData, dest)).toBe(5);
  });

  it('calcula muestras para diseñador', () => {
    const formData = { ...formDataBase, cantidad_disenador: 3 };
    const dest = getDestinatariosSeleccionados(['2']);
    expect(calcularTotalMuestras(formData, dest)).toBe(3);
  });

  it('calcula muestras para laboratorio', () => {
    const formData = { ...formDataBase, cantidad_laboratorio: 2 };
    const dest = getDestinatariosSeleccionados(['3']);
    expect(calcularTotalMuestras(formData, dest)).toBe(2);
  });

  it('calcula muestras para clientes (múltiples destinatarios)', () => {
    const formData = {
      ...formDataBase,
      cantidad_1: 2,
      cantidad_2: 3,
      cantidad_3: 1,
      cantidad_4: 4,
    };
    const dest = getDestinatariosSeleccionados(['4']);
    expect(calcularTotalMuestras(formData, dest)).toBe(10);
  });

  it('calcula muestras combinadas', () => {
    const formData = {
      ...formDataBase,
      cantidad_vendedor: 5,
      cantidad_disenador: 3,
      cantidad_laboratorio: 2,
    };
    const dest = getDestinatariosSeleccionados(['1', '2', '3']);
    expect(calcularTotalMuestras(formData, dest)).toBe(10);
  });

  it('ignora cantidades de destinatarios no seleccionados', () => {
    const formData = {
      ...formDataBase,
      cantidad_vendedor: 5,
      cantidad_disenador: 3,
    };
    const dest = getDestinatariosSeleccionados(['1']); // Solo vendedor
    expect(calcularTotalMuestras(formData, dest)).toBe(5); // Solo cuenta vendedor
  });
});

// =============================================
// TESTS - SELECCIÓN DE DESTINATARIOS
// =============================================

describe('MuestraModal - Selección de Destinatarios', () => {
  it('detecta vendedor seleccionado', () => {
    const dest = getDestinatariosSeleccionados(['1']);
    expect(dest.vendedor).toBe(true);
    expect(dest.disenador).toBe(false);
  });

  it('detecta múltiples selecciones', () => {
    const dest = getDestinatariosSeleccionados(['1', '2', '3']);
    expect(dest.vendedor).toBe(true);
    expect(dest.disenador).toBe(true);
    expect(dest.laboratorio).toBe(true);
    expect(dest.clientes).toBe(false);
  });

  it('detecta todos los destinatarios', () => {
    const dest = getDestinatariosSeleccionados(['1', '2', '3', '4', '5']);
    expect(dest.vendedor).toBe(true);
    expect(dest.disenador).toBe(true);
    expect(dest.laboratorio).toBe(true);
    expect(dest.clientes).toBe(true);
    expect(dest.disenadorRevision).toBe(true);
  });

  it('ningún destinatario seleccionado', () => {
    const dest = getDestinatariosSeleccionados([]);
    expect(dest.vendedor).toBe(false);
    expect(dest.disenador).toBe(false);
    expect(dest.laboratorio).toBe(false);
    expect(dest.clientes).toBe(false);
    expect(dest.disenadorRevision).toBe(false);
  });
});

// =============================================
// TESTS - VALIDACIÓN DE FORMULARIO
// =============================================

describe('MuestraModal - Validación', () => {
  function validateMuestraForm(data: Partial<MuestraFormData>): string[] {
    const errors: string[] = [];

    // Al menos un destinatario debe estar seleccionado
    if (!data.destinatarios_id || data.destinatarios_id.length === 0) {
      errors.push('Debe seleccionar al menos un destinatario');
    }

    // Si hay destinatario vendedor, debe haber cantidad
    if (data.destinatarios_id?.includes('1') && !data.cantidad_vendedor) {
      errors.push('Cantidad vendedor es requerida');
    }

    // Si hay destinatario cliente, al menos un destino debe tener datos
    if (data.destinatarios_id?.includes('4')) {
      const tieneDestinoCliente =
        (data.destinatario_1 && data.cantidad_1) ||
        (data.destinatario_2 && data.cantidad_2) ||
        (data.destinatario_3 && data.cantidad_3) ||
        (data.destinatario_4 && data.cantidad_4);

      if (!tieneDestinoCliente) {
        errors.push('Debe completar al menos un destino de cliente');
      }
    }

    return errors;
  }

  it('error si no hay destinatarios', () => {
    const errors = validateMuestraForm({ destinatarios_id: [] });
    expect(errors).toContain('Debe seleccionar al menos un destinatario');
  });

  it('sin error con destinatario válido', () => {
    const errors = validateMuestraForm({
      destinatarios_id: ['2'],
      cantidad_disenador: 3,
    });
    expect(errors).not.toContain('Debe seleccionar al menos un destinatario');
  });

  it('error si vendedor sin cantidad', () => {
    const errors = validateMuestraForm({
      destinatarios_id: ['1'],
      cantidad_vendedor: null,
    });
    expect(errors).toContain('Cantidad vendedor es requerida');
  });

  it('error si cliente sin destino', () => {
    const errors = validateMuestraForm({
      destinatarios_id: ['4'],
    });
    expect(errors).toContain('Debe completar al menos un destino de cliente');
  });

  it('sin error con cliente y destino válido', () => {
    const errors = validateMuestraForm({
      destinatarios_id: ['4'],
      destinatario_1: 'Juan Pérez',
      cantidad_1: 2,
    });
    expect(errors).not.toContain('Debe completar al menos un destino de cliente');
  });
});

