/**
 * Esquemas de validación para Usuarios
 * Sprint K - Task K.2
 *
 * Basado en:
 * - Laravel: app/User.php
 * - FastAPI: routers/mantenedores/users.py
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
  email: 'Email inválido',
  rut: 'RUT inválido',
  telefono: 'Teléfono inválido',
  password: 'La contraseña debe tener al menos 8 caracteres',
  passwordMatch: 'Las contraseñas no coinciden',
};

// =============================================================================
// SCHEMA PARA USUARIO (CREAR)
// =============================================================================
export const userCreateSchema = yup.object({
  // Campos requeridos
  name: yup
    .string()
    .required(MENSAJES.requerido('Nombre'))
    .min(2, MENSAJES.minimo('Nombre', 2))
    .max(255, MENSAJES.maximo('Nombre', 255)),

  email: yup
    .string()
    .required(MENSAJES.requerido('Email'))
    .test('email-valido', MENSAJES.email, (value) => validarEmail(value || '')),

  password: yup
    .string()
    .required(MENSAJES.requerido('Contraseña'))
    .min(8, MENSAJES.password),

  password_confirmation: yup
    .string()
    .required(MENSAJES.requerido('Confirmar contraseña'))
    .oneOf([yup.ref('password')], MENSAJES.passwordMatch),

  role_id: yup
    .number()
    .required(MENSAJES.requerido('Rol')),

  // Campos opcionales
  rut: yup
    .string()
    .test('rut-valido', MENSAJES.rut, (value) => !value || validarRUT(value))
    .nullable(),

  telefono: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .nullable(),

  client_id: yup.number().nullable(), // Para vendedores externos
  active: yup.number().oneOf([0, 1]).default(1),
});

// =============================================================================
// SCHEMA PARA USUARIO (ACTUALIZAR)
// =============================================================================
export const userUpdateSchema = yup.object({
  name: yup
    .string()
    .min(2, MENSAJES.minimo('Nombre', 2))
    .max(255, MENSAJES.maximo('Nombre', 255))
    .nullable(),

  email: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .nullable(),

  role_id: yup.number().nullable(),

  rut: yup
    .string()
    .test('rut-valido', MENSAJES.rut, (value) => !value || validarRUT(value))
    .nullable(),

  telefono: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .nullable(),

  client_id: yup.number().nullable(),
  active: yup.number().oneOf([0, 1]).nullable(),
});

// =============================================================================
// SCHEMA PARA CAMBIAR CONTRASEÑA
// =============================================================================
export const changePasswordSchema = yup.object({
  current_password: yup
    .string()
    .required(MENSAJES.requerido('Contraseña actual')),

  new_password: yup
    .string()
    .required(MENSAJES.requerido('Nueva contraseña'))
    .min(8, MENSAJES.password),

  confirm_password: yup
    .string()
    .required(MENSAJES.requerido('Confirmar contraseña'))
    .oneOf([yup.ref('new_password')], MENSAJES.passwordMatch),
});

// =============================================================================
// SCHEMA PARA LOGIN
// =============================================================================
export const loginSchema = yup.object({
  email: yup
    .string()
    .required(MENSAJES.requerido('Email'))
    .test('email-valido', MENSAJES.email, (value) => validarEmail(value || '')),

  password: yup
    .string()
    .required(MENSAJES.requerido('Contraseña')),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================
export type UserCreateFormData = yup.InferType<typeof userCreateSchema>;
export type UserUpdateFormData = yup.InferType<typeof userUpdateSchema>;
export type ChangePasswordFormData = yup.InferType<typeof changePasswordSchema>;
export type LoginFormData = yup.InferType<typeof loginSchema>;

// =============================================================================
// VALORES POR DEFECTO
// =============================================================================
export const userCreateDefaultValues: Partial<UserCreateFormData> = {
  active: 1,
};
