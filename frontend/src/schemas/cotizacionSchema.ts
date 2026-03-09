/**
 * Esquemas de validación para Cotizaciones
 * Sprint K - Task K.2
 *
 * Basado en:
 * - Laravel: app/Http/Controllers/CotizacionController.php
 * - FastAPI: routers/cotizaciones.py, schemas/cotizacion.py
 */
import * as yup from 'yup';
import { validarEmail, validarTelefonoChileno } from './validators';

// =============================================================================
// MENSAJES DE ERROR
// =============================================================================
const MENSAJES = {
  requerido: (campo: string) => `${campo} es requerido`,
  maximo: (campo: string, max: number) => `${campo} debe tener máximo ${max} caracteres`,
  email: 'Email inválido',
  telefono: 'Teléfono inválido',
  positivo: (campo: string) => `${campo} debe ser mayor a 0`,
  rango: (campo: string, min: number, max: number) => `${campo} debe estar entre ${min} y ${max}`,
};

// =============================================================================
// SCHEMA PARA COTIZACIÓN
// =============================================================================
export const cotizacionSchema = yup.object({
  // Campos requeridos
  client_id: yup
    .number()
    .required(MENSAJES.requerido('Cliente'))
    .positive(MENSAJES.positivo('Cliente')),

  // Campos opcionales
  nombre_contacto: yup
    .string()
    .max(255, MENSAJES.maximo('Nombre contacto', 255))
    .nullable(),

  email_contacto: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .max(191, MENSAJES.maximo('Email', 191))
    .nullable(),

  telefono_contacto: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .max(12, MENSAJES.maximo('Teléfono', 12))
    .nullable(),

  moneda_id: yup.number().nullable(),
  dias_pago: yup.number().min(0).nullable(),
  comision: yup.number().min(0).nullable(),

  observacion_interna: yup
    .string()
    .max(255, MENSAJES.maximo('Observación interna', 255))
    .nullable(),

  observacion_cliente: yup
    .string()
    .max(255, MENSAJES.maximo('Observación cliente', 255))
    .nullable(),
});

// =============================================================================
// SCHEMA PARA DETALLE DE COTIZACIÓN
// =============================================================================
export const detalleCotizacionSchema = yup.object({
  // Identificadores
  cotizacion_id: yup.number().required(),
  rubro_id: yup.number().required(MENSAJES.requerido('Rubro')),
  carton_id: yup.number().required(MENSAJES.requerido('Cartón')),

  // Dimensiones
  largo: yup.number().min(0).nullable(),
  ancho: yup.number().min(0).nullable(),
  alto: yup.number().min(0).nullable(),

  // Cantidades
  cantidad: yup
    .number()
    .required(MENSAJES.requerido('Cantidad'))
    .min(1, 'Cantidad debe ser al menos 1'),

  // Precios y costos
  precio_unitario: yup.number().min(0).nullable(),
  margen: yup.number().min(0, 'Margen no puede ser negativo').nullable(),
  margen_sugerido: yup.number().min(0).nullable(),

  // Características del producto
  planta_id: yup.number().nullable(),
  process_id: yup.number().nullable(),
  impresion_id: yup.number().nullable(),

  // Otros
  observaciones: yup.string().max(500).nullable(),
});

// =============================================================================
// SCHEMA PARA APROBACIÓN DE COTIZACIÓN
// =============================================================================
export const aprobacionCotizacionSchema = yup.object({
  accion: yup
    .string()
    .required(MENSAJES.requerido('Acción'))
    .oneOf(['aprobar', 'rechazar', 'solicitar_cambios'], 'Acción inválida'),

  comentario: yup
    .string()
    .max(500, MENSAJES.maximo('Comentario', 500))
    .nullable(),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================
export type CotizacionFormData = yup.InferType<typeof cotizacionSchema>;
export type DetalleCotizacionFormData = yup.InferType<typeof detalleCotizacionSchema>;
export type AprobacionFormData = yup.InferType<typeof aprobacionCotizacionSchema>;

// =============================================================================
// VALORES POR DEFECTO
// =============================================================================
export const cotizacionDefaultValues: Partial<CotizacionFormData> = {
  moneda_id: 1, // CLP
  dias_pago: 0,
  comision: 0,
};

export const detalleDefaultValues: Partial<DetalleCotizacionFormData> = {
  cantidad: 1,
};
