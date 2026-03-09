/**
 * Tests funcionales - Issues 37, 38: Decimales con coma
 * Verifican que la utilidad normalizeDecimalInput funciona correctamente
 */

import { normalizeDecimalInput, formatDecimalDisplay, isValidDecimalInput, DECIMAL_REGEX } from '../decimal';

describe('normalizeDecimalInput - Issue 37, 38', () => {
  describe('Conversión de coma a punto', () => {
    it('debería convertir "12,5" a 12.5', () => {
      expect(normalizeDecimalInput('12,5')).toBe(12.5);
    });

    it('debería mantener "12.5" como 12.5', () => {
      expect(normalizeDecimalInput('12.5')).toBe(12.5);
    });

    it('debería manejar números enteros', () => {
      expect(normalizeDecimalInput('42')).toBe(42);
    });

    it('debería manejar números negativos con coma', () => {
      expect(normalizeDecimalInput('-5,75')).toBe(-5.75);
    });

    it('debería manejar números negativos con punto', () => {
      expect(normalizeDecimalInput('-5.75')).toBe(-5.75);
    });
  });

  describe('Valores vacíos o inválidos', () => {
    it('debería retornar null para string vacío', () => {
      expect(normalizeDecimalInput('')).toBeNull();
    });

    it('debería retornar null para espacios en blanco', () => {
      expect(normalizeDecimalInput('   ')).toBeNull();
    });

    it('debería retornar null para texto no numérico', () => {
      expect(normalizeDecimalInput('abc')).toBeNull();
    });

    it('debería parsear números con texto trailing (comportamiento parseFloat)', () => {
      // parseFloat('12abc') retorna 12 - comportamiento JavaScript estándar
      // Esto es consistente con Laravel que solo hace str_replace
      expect(normalizeDecimalInput('12abc')).toBe(12);
    });
  });

  describe('Casos especiales chilenos/europeos', () => {
    it('debería manejar decimales largos con coma', () => {
      expect(normalizeDecimalInput('123,456')).toBe(123.456);
    });

    it('debería manejar solo decimal con coma', () => {
      expect(normalizeDecimalInput('0,5')).toBe(0.5);
    });
  });
});

describe('formatDecimalDisplay', () => {
  it('debería formatear 12.5 como "12,50"', () => {
    expect(formatDecimalDisplay(12.5)).toBe('12,50');
  });

  it('debería formatear con decimales personalizados', () => {
    expect(formatDecimalDisplay(12.5, 1)).toBe('12,5');
  });

  it('debería retornar string vacío para null', () => {
    expect(formatDecimalDisplay(null)).toBe('');
  });

  it('debería retornar string vacío para undefined', () => {
    expect(formatDecimalDisplay(undefined)).toBe('');
  });
});

describe('isValidDecimalInput', () => {
  it('debería aceptar "12,5"', () => {
    expect(isValidDecimalInput('12,5')).toBe(true);
  });

  it('debería aceptar "12.5"', () => {
    expect(isValidDecimalInput('12.5')).toBe(true);
  });

  it('debería aceptar "-12,5"', () => {
    expect(isValidDecimalInput('-12,5')).toBe(true);
  });

  it('debería rechazar "12,5,3"', () => {
    expect(isValidDecimalInput('12,5,3')).toBe(false);
  });

  it('debería rechazar "abc"', () => {
    expect(isValidDecimalInput('abc')).toBe(false);
  });
});

describe('DECIMAL_REGEX', () => {
  it('debería coincidir con números enteros', () => {
    expect(DECIMAL_REGEX.test('123')).toBe(true);
  });

  it('debería coincidir con decimales con coma', () => {
    expect(DECIMAL_REGEX.test('123,45')).toBe(true);
  });

  it('debería coincidir con decimales con punto', () => {
    expect(DECIMAL_REGEX.test('123.45')).toBe(true);
  });

  it('debería coincidir con negativos', () => {
    expect(DECIMAL_REGEX.test('-123,45')).toBe(true);
  });
});
