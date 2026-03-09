/**
 * Tests para validadores chilenos
 * Sprint K - Task K.2
 */
import { describe, it, expect } from 'vitest';
import {
  validarRUT,
  validarTelefonoChileno,
  validarEmail,
  formatearRUT,
  formatearTelefono,
} from '../validators';

describe('validarRUT', () => {
  describe('RUTs válidos', () => {
    it('debe aceptar RUT con guión', () => {
      expect(validarRUT('12345678-5')).toBe(true);
    });

    it('debe aceptar RUT sin guión', () => {
      expect(validarRUT('123456785')).toBe(true);
    });

    it('debe aceptar RUT con puntos y guión', () => {
      expect(validarRUT('12.345.678-5')).toBe(true);
    });

    it('debe aceptar RUT con K como dígito verificador', () => {
      // 6456871-K es un RUT válido con K (calculado con módulo 11)
      expect(validarRUT('6456871-K')).toBe(true);
    });

    it('debe aceptar K minúscula', () => {
      expect(validarRUT('6456871-k')).toBe(true);
    });

    it('debe aceptar RUT corto', () => {
      expect(validarRUT('1-9')).toBe(true);
    });
  });

  describe('RUTs inválidos', () => {
    it('debe rechazar RUT vacío', () => {
      expect(validarRUT('')).toBe(false);
    });

    it('debe rechazar RUT con dígito verificador incorrecto', () => {
      expect(validarRUT('12345678-0')).toBe(false);
    });

    it('debe rechazar RUT solo letras', () => {
      expect(validarRUT('abcdefgh-i')).toBe(false);
    });

    it('debe rechazar RUT con caracteres inválidos', () => {
      expect(validarRUT('12345678-X')).toBe(false);
    });
  });
});

describe('validarTelefonoChileno', () => {
  describe('teléfonos válidos', () => {
    it('debe aceptar formato +56 9 XXXX XXXX', () => {
      expect(validarTelefonoChileno('+56912345678')).toBe(true);
    });

    it('debe aceptar formato 56 9 XXXX XXXX', () => {
      expect(validarTelefonoChileno('56912345678')).toBe(true);
    });

    it('debe aceptar formato 9 XXXX XXXX (móvil)', () => {
      expect(validarTelefonoChileno('912345678')).toBe(true);
    });

    it('debe aceptar teléfono con espacios', () => {
      expect(validarTelefonoChileno('+56 9 1234 5678')).toBe(true);
    });

    it('debe aceptar teléfono fijo Santiago', () => {
      expect(validarTelefonoChileno('+56212345678')).toBe(true);
    });

    it('debe aceptar vacío (campo opcional)', () => {
      expect(validarTelefonoChileno('')).toBe(true);
    });
  });

  describe('teléfonos inválidos', () => {
    it('debe rechazar teléfono muy corto', () => {
      expect(validarTelefonoChileno('12345')).toBe(false);
    });

    it('debe rechazar teléfono con letras', () => {
      expect(validarTelefonoChileno('56912345abc')).toBe(false);
    });
  });
});

describe('validarEmail', () => {
  describe('emails válidos', () => {
    it('debe aceptar email simple', () => {
      expect(validarEmail('test@example.com')).toBe(true);
    });

    it('debe aceptar email con subdominios', () => {
      expect(validarEmail('test@mail.example.com')).toBe(true);
    });

    it('debe aceptar email con puntos en usuario', () => {
      expect(validarEmail('test.user@example.com')).toBe(true);
    });

    it('debe aceptar vacío (campo opcional)', () => {
      expect(validarEmail('')).toBe(true);
    });
  });

  describe('emails inválidos', () => {
    it('debe rechazar email sin @', () => {
      expect(validarEmail('testexample.com')).toBe(false);
    });

    it('debe rechazar email sin dominio', () => {
      expect(validarEmail('test@')).toBe(false);
    });

    it('debe rechazar email sin TLD', () => {
      expect(validarEmail('test@example')).toBe(false);
    });
  });
});

describe('formatearRUT', () => {
  it('debe formatear RUT sin formato', () => {
    expect(formatearRUT('123456785')).toBe('12.345.678-5');
  });

  it('debe formatear RUT ya con guión', () => {
    expect(formatearRUT('12345678-5')).toBe('12.345.678-5');
  });

  it('debe manejar RUT corto', () => {
    expect(formatearRUT('19')).toBe('1-9');
  });

  it('debe manejar RUT vacío', () => {
    expect(formatearRUT('')).toBe('');
  });

  it('debe convertir k minúscula a mayúscula', () => {
    expect(formatearRUT('6456871k')).toBe('6.456.871-K');
  });
});

describe('formatearTelefono', () => {
  it('debe formatear teléfono con código país', () => {
    expect(formatearTelefono('56912345678')).toBe('+56 9 1234 5678');
  });

  it('debe formatear teléfono móvil sin código', () => {
    expect(formatearTelefono('912345678')).toBe('9 1234 5678');
  });

  it('debe manejar teléfono vacío', () => {
    expect(formatearTelefono('')).toBe('');
  });
});
