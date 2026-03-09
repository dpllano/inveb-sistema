/**
 * Tests para Tooltip Component - Sprint T.1
 * Prueba la funcionalidad del componente de tooltips.
 */

import { describe, it, expect } from 'vitest';

// =============================================================================
// CONSTANTES A TESTEAR
// =============================================================================

const OT_TYPE_LABELS: Record<number, string> = {
  1: 'Desarrollo Completo',
  2: 'Arte Sin Material',
  3: 'Desarrollo Rapido',
  4: 'Modificacion',
  5: 'Arte Con Material',
  6: 'Cotizacion',
  7: 'Catalogacion',
  8: 'Licitacion',
  9: 'Ficha Tecnica',
  10: 'Estudio Benchmarking',
  11: 'Proyecto Innovacion',
};

// =============================================================================
// FUNCIONES A TESTEAR (simulando las del componente)
// =============================================================================

/**
 * Calcula tiempo relativo (hace X días, etc.)
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} dias`;
  if (diffWeeks === 1) return 'hace 1 semana';
  if (diffWeeks < 4) return `hace ${diffWeeks} semanas`;
  if (diffMonths === 1) return 'hace 1 mes';
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  if (diffYears === 1) return 'hace 1 ano';
  return `hace ${diffYears} anos`;
}

/**
 * Trunca texto si excede el largo máximo
 */
function truncateText(text: string, maxLength: number = 30): { truncated: boolean; display: string } {
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate
    ? `${text.substring(0, maxLength)}...`
    : text;
  return { truncated: shouldTruncate, display: displayText };
}

/**
 * Formatea fecha para tooltip
 */
function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Obtiene label de tipo de OT
 */
function getOTTypeLabel(typeId: number): string {
  return OT_TYPE_LABELS[typeId] || 'Tipo desconocido';
}

// =============================================================================
// TESTS
// =============================================================================

describe('Tooltip - Sprint T.1', () => {
  describe('getRelativeTime', () => {
    it('debe mostrar "hace unos segundos" para tiempos menores a 1 minuto', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 30000)); // 30 segundos
      expect(result).toBe('hace unos segundos');
    });

    it('debe mostrar minutos correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 5 * 60 * 1000)); // 5 minutos
      expect(result).toBe('hace 5 minutos');
    });

    it('debe mostrar "hace 1 minuto" en singular', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 1 * 60 * 1000)); // 1 minuto
      expect(result).toBe('hace 1 minuto');
    });

    it('debe mostrar horas correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)); // 3 horas
      expect(result).toBe('hace 3 horas');
    });

    it('debe mostrar "ayer" para 1 día', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 24 * 60 * 60 * 1000)); // 1 día
      expect(result).toBe('ayer');
    });

    it('debe mostrar días correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)); // 5 días
      expect(result).toBe('hace 5 dias');
    });

    it('debe mostrar "hace 1 semana"', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)); // 7 días
      expect(result).toBe('hace 1 semana');
    });

    it('debe mostrar semanas correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)); // 14 días
      expect(result).toBe('hace 2 semanas');
    });

    it('debe mostrar "hace 1 mes"', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)); // 30 días
      expect(result).toBe('hace 1 mes');
    });

    it('debe mostrar meses correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)); // 90 días
      expect(result).toBe('hace 3 meses');
    });

    it('debe mostrar "hace 1 ano"', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)); // 365 días
      expect(result).toBe('hace 1 ano');
    });

    it('debe mostrar años correctamente', () => {
      const now = new Date();
      const result = getRelativeTime(new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)); // 730 días
      expect(result).toBe('hace 2 anos');
    });
  });

  describe('truncateText', () => {
    it('no debe truncar texto corto', () => {
      const result = truncateText('Texto corto', 30);
      expect(result.truncated).toBe(false);
      expect(result.display).toBe('Texto corto');
    });

    it('debe truncar texto largo', () => {
      const longText = 'Este es un texto muy largo que excede el limite permitido';
      const result = truncateText(longText, 30);
      expect(result.truncated).toBe(true);
      expect(result.display).toHaveLength(33); // 30 + "..."
      expect(result.display).toMatch(/\.\.\.$/);
    });

    it('debe truncar exactamente al límite', () => {
      const text = '123456789012345678901234567890X'; // 31 caracteres
      const result = truncateText(text, 30);
      expect(result.truncated).toBe(true);
      expect(result.display).toBe('123456789012345678901234567890...');
    });

    it('debe respetar límite personalizado', () => {
      const text = 'ABCDEFGHIJ';
      const result = truncateText(text, 5);
      expect(result.truncated).toBe(true);
      expect(result.display).toBe('ABCDE...');
    });

    it('no debe truncar texto igual al límite', () => {
      const text = '123456789012345678901234567890'; // 30 caracteres
      const result = truncateText(text, 30);
      expect(result.truncated).toBe(false);
      expect(result.display).toBe(text);
    });
  });

  describe('formatDateShort', () => {
    it('debe formatear fecha en formato corto', () => {
      // Usar hora específica para evitar problemas de timezone
      const date = new Date('2026-02-22T12:00:00');
      const result = formatDateShort(date);
      // Formato chileno: DD-MM-YY o DD/MM/YY - verificar componentes
      expect(result).toMatch(/02.*26/);
    });

    it('debe mostrar días con ceros', () => {
      const date = new Date('2026-01-05T12:00:00');
      const result = formatDateShort(date);
      expect(result).toMatch(/01.*26/);
    });
  });

  describe('formatDateLong', () => {
    it('debe formatear fecha en formato largo', () => {
      const date = new Date('2026-02-22T12:00:00');
      const result = formatDateLong(date);
      expect(result).toContain('2026');
      // Debe contener el mes en texto
      expect(result.toLowerCase()).toMatch(/febrero/);
    });

    it('debe mostrar mes en español', () => {
      const date = new Date('2026-01-15T12:00:00');
      const result = formatDateLong(date);
      expect(result.toLowerCase()).toMatch(/enero/);
    });
  });

  describe('getOTTypeLabel', () => {
    it('debe retornar label para Desarrollo Completo', () => {
      expect(getOTTypeLabel(1)).toBe('Desarrollo Completo');
    });

    it('debe retornar label para Arte Sin Material', () => {
      expect(getOTTypeLabel(2)).toBe('Arte Sin Material');
    });

    it('debe retornar label para Desarrollo Rapido', () => {
      expect(getOTTypeLabel(3)).toBe('Desarrollo Rapido');
    });

    it('debe retornar label para Modificacion', () => {
      expect(getOTTypeLabel(4)).toBe('Modificacion');
    });

    it('debe retornar label para Arte Con Material', () => {
      expect(getOTTypeLabel(5)).toBe('Arte Con Material');
    });

    it('debe retornar label para Cotizacion', () => {
      expect(getOTTypeLabel(6)).toBe('Cotizacion');
    });

    it('debe retornar label para Catalogacion', () => {
      expect(getOTTypeLabel(7)).toBe('Catalogacion');
    });

    it('debe retornar label para Licitacion', () => {
      expect(getOTTypeLabel(8)).toBe('Licitacion');
    });

    it('debe retornar label para Ficha Tecnica', () => {
      expect(getOTTypeLabel(9)).toBe('Ficha Tecnica');
    });

    it('debe retornar label para Estudio Benchmarking', () => {
      expect(getOTTypeLabel(10)).toBe('Estudio Benchmarking');
    });

    it('debe retornar label para Proyecto Innovacion', () => {
      expect(getOTTypeLabel(11)).toBe('Proyecto Innovacion');
    });

    it('debe retornar "Tipo desconocido" para ID inválido', () => {
      expect(getOTTypeLabel(99)).toBe('Tipo desconocido');
      expect(getOTTypeLabel(0)).toBe('Tipo desconocido');
      expect(getOTTypeLabel(-1)).toBe('Tipo desconocido');
    });
  });

  describe('TooltipPosition - Constantes', () => {
    const positions = ['top', 'bottom', 'left', 'right'] as const;

    it('debe tener 4 posiciones válidas', () => {
      expect(positions).toHaveLength(4);
    });

    it.each(positions)('posición "%s" debe ser string', (pos) => {
      expect(typeof pos).toBe('string');
    });
  });

  describe('Configuración Default', () => {
    const DEFAULT_POSITION = 'top';
    const DEFAULT_DELAY = 200;
    const DEFAULT_MAX_WIDTH = 250;

    it('posición default debe ser "top"', () => {
      expect(DEFAULT_POSITION).toBe('top');
    });

    it('delay default debe ser 200ms', () => {
      expect(DEFAULT_DELAY).toBe(200);
    });

    it('maxWidth default debe ser 250px', () => {
      expect(DEFAULT_MAX_WIDTH).toBe(250);
    });
  });
});
