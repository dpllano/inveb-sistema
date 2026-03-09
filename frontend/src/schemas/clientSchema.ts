/**
 * Esquemas de validación para Clientes
 * Sprint K - Task K.2
 *
 * Basado en:
 * - Laravel: app/Http/Controllers/ClientController.php
 * - FastAPI: routers/mantenedores/clients.py
 */
import * as yup from 'yup';
import { validarRUT, validarTelefonoChileno, validarEmail } from './validators';

// =============================================================================
// MENSAJES DE ERROR
// =============================================================================
const MENSAJES = {
  requerido: (campo: string) => `${campo} es requerido`,
  minimo: (campo: string, min: number) => `${campo} debe tener al menos ${min} caracteres`,
  maximo: (campo: string, max: number) => `${campo} debe tener máximo ${max} caracteres`,
  rut: 'RUT inválido (formato: XX.XXX.XXX-X)',
  email: 'Email inválido',
  telefono: 'Teléfono inválido (formato: +56 9 XXXX XXXX)',
};

// =============================================================================
// SCHEMA PARA CLIENTE
// =============================================================================
export const clientSchema = yup.object({
  // Campos requeridos
  rut: yup
    .string()
    .required(MENSAJES.requerido('RUT'))
    .test('rut-valido', MENSAJES.rut, (value) => validarRUT(value || '')),

  razon_social: yup
    .string()
    .required(MENSAJES.requerido('Razón social'))
    .min(3, MENSAJES.minimo('Razón social', 3))
    .max(255, MENSAJES.maximo('Razón social', 255)),

  // Campos opcionales
  nombre_fantasia: yup
    .string()
    .max(255, MENSAJES.maximo('Nombre fantasía', 255))
    .nullable(),

  giro: yup
    .string()
    .max(255, MENSAJES.maximo('Giro', 255))
    .nullable(),

  direccion: yup
    .string()
    .max(500, MENSAJES.maximo('Dirección', 500))
    .nullable(),

  comuna_id: yup.number().nullable(),

  email: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .nullable(),

  telefono: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .nullable(),

  tipo_cliente: yup.string().nullable(),
  clasificacion_id: yup.number().nullable(),
  vendedor_id: yup.number().nullable(),
  org_venta_id: yup.number().nullable(),

  // Campo de estado
  active: yup.number().oneOf([0, 1]).default(1),
});

// =============================================================================
// SCHEMA PARA INSTALACIÓN DE CLIENTE
// =============================================================================
export const installationSchema = yup.object({
  // Requeridos
  client_id: yup
    .number()
    .required(MENSAJES.requerido('Cliente')),

  nombre: yup
    .string()
    .required(MENSAJES.requerido('Nombre instalación'))
    .min(3, MENSAJES.minimo('Nombre', 3))
    .max(255, MENSAJES.maximo('Nombre', 255)),

  // Opcionales
  direccion: yup.string().max(500).nullable(),
  comuna_id: yup.number().nullable(),

  // Características de despacho
  tipo_pallet_id: yup.number().nullable(),
  altura_pallet: yup.number().min(0).nullable(),
  sobresalir_carga: yup.number().oneOf([0, 1]).nullable(),
  bunker: yup.number().oneOf([0, 1]).nullable(),
  termocontraible: yup.number().oneOf([0, 1]).nullable(),
  fsc: yup.number().oneOf([0, 1]).nullable(),
  pais_mercado_destino: yup.number().nullable(),
  certificado_calidad: yup.number().nullable(),

  // Contacto 1
  nombre_contacto: yup.string().max(255).nullable(),
  cargo_contacto: yup.string().max(255).nullable(),
  email_contacto: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .nullable(),
  phone_contacto: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .nullable(),
  direccion_contacto: yup.string().max(500).nullable(),
  comuna_contacto: yup.number().nullable(),
  active_contacto: yup.string().oneOf(['activo', 'inactivo']).default('inactivo'),

  // Contacto 2
  nombre_contacto_2: yup.string().max(255).nullable(),
  cargo_contacto_2: yup.string().max(255).nullable(),
  email_contacto_2: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .nullable(),
  phone_contacto_2: yup.string().nullable(),
  active_contacto_2: yup.string().oneOf(['activo', 'inactivo']).default('inactivo'),

  // Contacto 3-5 (simplificado)
  nombre_contacto_3: yup.string().max(255).nullable(),
  nombre_contacto_4: yup.string().max(255).nullable(),
  nombre_contacto_5: yup.string().max(255).nullable(),

  active: yup.number().oneOf([0, 1]).default(1),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================
export type ClientFormData = yup.InferType<typeof clientSchema>;
export type InstallationFormData = yup.InferType<typeof installationSchema>;

// =============================================================================
// VALORES POR DEFECTO
// =============================================================================
export const clientDefaultValues: Partial<ClientFormData> = {
  active: 1,
};

export const installationDefaultValues: Partial<InstallationFormData> = {
  active: 1,
  sobresalir_carga: 0,
  bunker: 0,
  termocontraible: 0,
  fsc: 0,
  active_contacto: 'inactivo',
  active_contacto_2: 'inactivo',
};
