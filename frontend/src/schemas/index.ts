/**
 * Exportaciones centralizadas de esquemas de validación
 * Sprint K - Task K.2
 */

// Validadores personalizados para Chile
export {
  validarRUT,
  validarTelefonoChileno,
  validarEmail,
  formatearRUT,
  formatearTelefono,
} from './validators';

// Esquemas de Work Orders
export {
  workOrderSchema,
  datosComercialSchema,
  antecedentesDesarrolloSchema,
  solicitaSchema,
  referenciaSchema,
  caracteristicasSchema,
  dimensionesSchema,
  palletSchema,
  especificacionesTecnicasSchema,
  disenoAcabadosSchema,
  medidasSchema,
  terminacionesSchema,
  workOrderDefaultValues,
  type WorkOrderFormData,
} from './workOrderSchema';

// Esquemas de Clientes
export {
  clientSchema,
  installationSchema,
  clientDefaultValues,
  installationDefaultValues,
  type ClientFormData,
  type InstallationFormData,
} from './clientSchema';

// Esquemas de Cotizaciones
export {
  cotizacionSchema,
  detalleCotizacionSchema,
  aprobacionCotizacionSchema,
  cotizacionDefaultValues,
  detalleDefaultValues,
  type CotizacionFormData,
  type DetalleCotizacionFormData,
  type AprobacionFormData,
} from './cotizacionSchema';

// Esquemas de Usuarios
export {
  userCreateSchema,
  userUpdateSchema,
  changePasswordSchema,
  loginSchema,
  userCreateDefaultValues,
  type UserCreateFormData,
  type UserUpdateFormData,
  type ChangePasswordFormData,
  type LoginFormData,
} from './userSchema';
