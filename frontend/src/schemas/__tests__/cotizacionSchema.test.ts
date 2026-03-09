/**
 * Tests para esquemas de validación de Cotizaciones
 * Sprint K - Task K.2
 */
import { describe, it, expect } from 'vitest';
import {
  cotizacionSchema,
  detalleCotizacionSchema,
  aprobacionCotizacionSchema,
  cotizacionDefaultValues,
  detalleDefaultValues,
} from '../cotizacionSchema';

describe('cotizacionSchema', () => {
  describe('campos requeridos', () => {
    it('debe requerir client_id', async () => {
      const data = {};

      await expect(cotizacionSchema.validate(data)).rejects.toThrow('Cliente');
    });

    it('debe aceptar cotización válida con campos mínimos', async () => {
      const data = {
        client_id: 1,
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.client_id).toBe(1);
    });

    it('debe rechazar client_id negativo', async () => {
      const data = {
        client_id: -1,
      };

      await expect(cotizacionSchema.validate(data)).rejects.toThrow('Cliente');
    });
  });

  describe('validación email_contacto', () => {
    it('debe aceptar email válido', async () => {
      const data = {
        client_id: 1,
        email_contacto: 'test@example.com',
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.email_contacto).toBe('test@example.com');
    });

    it('debe rechazar email inválido', async () => {
      const data = {
        client_id: 1,
        email_contacto: 'invalido',
      };

      await expect(cotizacionSchema.validate(data)).rejects.toThrow('Email');
    });

    it('debe aceptar email vacío (opcional)', async () => {
      const data = {
        client_id: 1,
        email_contacto: '',
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.email_contacto).toBe('');
    });
  });

  describe('validación telefono_contacto', () => {
    it('debe aceptar teléfono chileno válido', async () => {
      const data = {
        client_id: 1,
        telefono_contacto: '+56912345678',
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.telefono_contacto).toBe('+56912345678');
    });

    it('debe rechazar teléfono inválido', async () => {
      const data = {
        client_id: 1,
        telefono_contacto: '12345',
      };

      await expect(cotizacionSchema.validate(data)).rejects.toThrow('Teléfono');
    });
  });

  describe('campos numéricos opcionales', () => {
    it('debe aceptar moneda_id', async () => {
      const data = {
        client_id: 1,
        moneda_id: 1,
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.moneda_id).toBe(1);
    });

    it('debe aceptar dias_pago', async () => {
      const data = {
        client_id: 1,
        dias_pago: 30,
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.dias_pago).toBe(30);
    });

    it('debe rechazar dias_pago negativo', async () => {
      const data = {
        client_id: 1,
        dias_pago: -1,
      };

      await expect(cotizacionSchema.validate(data)).rejects.toThrow();
    });

    it('debe aceptar comision', async () => {
      const data = {
        client_id: 1,
        comision: 5,
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.comision).toBe(5);
    });
  });

  describe('campos de texto opcionales', () => {
    it('debe aceptar observacion_interna', async () => {
      const data = {
        client_id: 1,
        observacion_interna: 'Nota interna',
      };

      const result = await cotizacionSchema.validate(data);
      expect(result.observacion_interna).toBe('Nota interna');
    });

    it('debe rechazar observacion_interna muy larga', async () => {
      const data = {
        client_id: 1,
        observacion_interna: 'a'.repeat(256),
      };

      await expect(cotizacionSchema.validate(data)).rejects.toThrow('255');
    });
  });
});

describe('detalleCotizacionSchema', () => {
  describe('campos requeridos', () => {
    it('debe requerir cotizacion_id', async () => {
      const data = {
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow();
    });

    it('debe requerir rubro_id', async () => {
      const data = {
        cotizacion_id: 1,
        carton_id: 1,
        cantidad: 100,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow('Rubro');
    });

    it('debe requerir carton_id', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        cantidad: 100,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow('Cartón');
    });

    it('debe requerir cantidad', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow('Cantidad');
    });
  });

  describe('validación margen (fix aplicado)', () => {
    it('debe aceptar margen positivo', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
        margen: 15,
      };

      const result = await detalleCotizacionSchema.validate(data);
      expect(result.margen).toBe(15);
    });

    it('debe aceptar margen cero', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
        margen: 0,
      };

      const result = await detalleCotizacionSchema.validate(data);
      expect(result.margen).toBe(0);
    });

    it('debe rechazar margen negativo', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
        margen: -5,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow('Margen no puede ser negativo');
    });

    it('debe aceptar margen null (opcional)', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
        margen: null,
      };

      const result = await detalleCotizacionSchema.validate(data);
      expect(result.margen).toBeNull();
    });
  });

  describe('validación cantidad', () => {
    it('debe rechazar cantidad 0', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 0,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow('al menos 1');
    });

    it('debe rechazar cantidad negativa', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: -10,
      };

      await expect(detalleCotizacionSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('dimensiones opcionales', () => {
    it('debe aceptar dimensiones', async () => {
      const data = {
        cotizacion_id: 1,
        rubro_id: 1,
        carton_id: 1,
        cantidad: 100,
        largo: 30,
        ancho: 20,
        alto: 15,
      };

      const result = await detalleCotizacionSchema.validate(data);
      expect(result.largo).toBe(30);
      expect(result.ancho).toBe(20);
      expect(result.alto).toBe(15);
    });
  });
});

describe('aprobacionCotizacionSchema', () => {
  describe('campo accion', () => {
    it('debe aceptar aprobar', async () => {
      const data = {
        accion: 'aprobar',
      };

      const result = await aprobacionCotizacionSchema.validate(data);
      expect(result.accion).toBe('aprobar');
    });

    it('debe aceptar rechazar', async () => {
      const data = {
        accion: 'rechazar',
      };

      const result = await aprobacionCotizacionSchema.validate(data);
      expect(result.accion).toBe('rechazar');
    });

    it('debe aceptar solicitar_cambios', async () => {
      const data = {
        accion: 'solicitar_cambios',
      };

      const result = await aprobacionCotizacionSchema.validate(data);
      expect(result.accion).toBe('solicitar_cambios');
    });

    it('debe rechazar accion inválida', async () => {
      const data = {
        accion: 'invalida',
      };

      await expect(aprobacionCotizacionSchema.validate(data)).rejects.toThrow('inválida');
    });

    it('debe requerir accion', async () => {
      const data = {};

      await expect(aprobacionCotizacionSchema.validate(data)).rejects.toThrow('Acción');
    });
  });

  describe('campo comentario', () => {
    it('debe aceptar comentario', async () => {
      const data = {
        accion: 'rechazar',
        comentario: 'Falta información',
      };

      const result = await aprobacionCotizacionSchema.validate(data);
      expect(result.comentario).toBe('Falta información');
    });

    it('debe rechazar comentario muy largo', async () => {
      const data = {
        accion: 'rechazar',
        comentario: 'a'.repeat(501),
      };

      await expect(aprobacionCotizacionSchema.validate(data)).rejects.toThrow('500');
    });
  });
});

describe('valores por defecto', () => {
  describe('cotizacionDefaultValues', () => {
    it('debe tener moneda_id por defecto 1 (CLP)', () => {
      expect(cotizacionDefaultValues.moneda_id).toBe(1);
    });

    it('debe tener dias_pago por defecto 0', () => {
      expect(cotizacionDefaultValues.dias_pago).toBe(0);
    });

    it('debe tener comision por defecto 0', () => {
      expect(cotizacionDefaultValues.comision).toBe(0);
    });
  });

  describe('detalleDefaultValues', () => {
    it('debe tener cantidad por defecto 1', () => {
      expect(detalleDefaultValues.cantidad).toBe(1);
    });
  });
});
