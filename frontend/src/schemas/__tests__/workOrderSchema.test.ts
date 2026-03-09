/**
 * Tests para esquemas de validación de Work Orders
 * Sprint K - Task K.2
 */
import { describe, it, expect } from 'vitest';
import {
  datosComercialSchema,
  especificacionesTecnicasSchema,
  workOrderDefaultValues,
} from '../workOrderSchema';

describe('datosComercialSchema', () => {
  describe('campos requeridos', () => {
    it('debe requerir client_id', async () => {
      const data = {
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('Cliente');
    });

    it('debe requerir descripcion', async () => {
      const data = {
        client_id: 1,
        tipo_solicitud: 1,
        canal_id: 1,
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('Descripción');
    });

    it('debe requerir tipo_solicitud', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        canal_id: 1,
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('Tipo de solicitud');
    });

    it('debe validar datos completos correctamente', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Caja de prueba',
        tipo_solicitud: 1,
        canal_id: 1,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.client_id).toBe(1);
      expect(result.descripcion).toBe('Caja de prueba');
    });
  });

  describe('validación file_oc condicional (Issue 8)', () => {
    it('debe requerir file_oc cuando oc=1', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test OC',
        tipo_solicitud: 1,
        canal_id: 1,
        oc: 1,
        // file_oc no proporcionado
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('archivo OC');
    });

    it('debe aceptar sin file_oc cuando oc=0', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test sin OC',
        tipo_solicitud: 1,
        canal_id: 1,
        oc: 0,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.oc).toBe(0);
    });

    it('debe aceptar sin file_oc cuando oc no está definido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test sin OC',
        tipo_solicitud: 1,
        canal_id: 1,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.file_oc).toBeUndefined();
    });

    it('debe aceptar file_oc cuando oc=1', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const data = {
        client_id: 1,
        descripcion: 'Test con OC',
        tipo_solicitud: 1,
        canal_id: 1,
        oc: 1,
        file_oc: mockFile,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.oc).toBe(1);
      expect(result.file_oc).toBeDefined();
    });
  });

  describe('validación email contacto', () => {
    it('debe aceptar email válido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
        email_contacto: 'test@example.com',
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.email_contacto).toBe('test@example.com');
    });

    it('debe rechazar email inválido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
        email_contacto: 'invalido',
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('Email');
    });

    it('debe aceptar email vacío (opcional)', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
        email_contacto: '',
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.email_contacto).toBe('');
    });
  });

  describe('validación teléfono contacto', () => {
    it('debe aceptar teléfono chileno válido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
        telefono_contacto: '+56912345678',
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.telefono_contacto).toBe('+56912345678');
    });

    it('debe rechazar teléfono inválido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
        telefono_contacto: '12345',
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow('Teléfono');
    });
  });

  describe('validación tipo_solicitud', () => {
    it('debe aceptar tipo 1 (Nueva)', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 1,
        canal_id: 1,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.tipo_solicitud).toBe(1);
    });

    it('debe aceptar tipo 2 (Modificación)', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 2,
        canal_id: 1,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.tipo_solicitud).toBe(2);
    });

    it('debe aceptar tipo 3 (Repetición)', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 3,
        canal_id: 1,
      };

      const result = await datosComercialSchema.validate(data);
      expect(result.tipo_solicitud).toBe(3);
    });

    it('debe rechazar tipo inválido', async () => {
      const data = {
        client_id: 1,
        descripcion: 'Test',
        tipo_solicitud: 99,
        canal_id: 1,
      };

      await expect(datosComercialSchema.validate(data)).rejects.toThrow();
    });
  });
});

describe('especificacionesTecnicasSchema', () => {
  describe('transform decimal (Issues 37-38)', () => {
    it('debe convertir coma a punto en ECT', async () => {
      const data = {
        ect: '12,5',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBe(12.5);
    });

    it('debe convertir coma a punto en FCT', async () => {
      const data = {
        fct: '8,75',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.fct).toBe(8.75);
    });

    it('debe aceptar punto como separador', async () => {
      const data = {
        ect: '12.5',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBe(12.5);
    });

    it('debe aceptar número sin decimales', async () => {
      const data = {
        ect: '12',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBe(12);
    });

    it('debe convertir string vacío a null', async () => {
      const data = {
        ect: '',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBeNull();
    });

    it('debe manejar valores numéricos directamente', async () => {
      const data = {
        ect: 15.5,
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBe(15.5);
    });

    it('debe manejar múltiples campos con coma', async () => {
      const data = {
        ect: '12,5',
        fct: '8,75',
        gramaje: '200,5',
        espesor: '0,45',
      };

      const result = await especificacionesTecnicasSchema.validate(data);
      expect(result.ect).toBe(12.5);
      expect(result.fct).toBe(8.75);
      expect(result.gramaje).toBe(200.5);
      expect(result.espesor).toBe(0.45);
    });

    it('debe rechazar valores negativos', async () => {
      const data = {
        ect: -5,
      };

      await expect(especificacionesTecnicasSchema.validate(data)).rejects.toThrow();
    });
  });
});

describe('workOrderDefaultValues', () => {
  it('debe tener tipo_solicitud por defecto 1 (Nueva)', () => {
    expect(workOrderDefaultValues.tipo_solicitud).toBe(1);
  });

  it('debe tener oc por defecto 0 (No)', () => {
    expect(workOrderDefaultValues.oc).toBe(0);
  });

  it('debe tener golpes_largo por defecto 1', () => {
    expect(workOrderDefaultValues.golpes_largo).toBe(1);
  });

  it('debe tener golpes_ancho por defecto 1', () => {
    expect(workOrderDefaultValues.golpes_ancho).toBe(1);
  });

  it('debe tener todos los campos de antecedentes en 0', () => {
    expect(workOrderDefaultValues.ant_des_correo_cliente).toBe(0);
    expect(workOrderDefaultValues.ant_des_plano_actual).toBe(0);
    expect(workOrderDefaultValues.ant_des_boceto_actual).toBe(0);
    expect(workOrderDefaultValues.ant_des_spec).toBe(0);
    expect(workOrderDefaultValues.ant_des_otro).toBe(0);
  });
});
