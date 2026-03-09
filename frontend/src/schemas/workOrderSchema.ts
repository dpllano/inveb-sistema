/**
 * Esquemas de validación para Work Orders (OTs)
 * Sprint K - Task K.2
 *
 * Basado en:
 * - services/api.ts → WorkOrderCreateData
 * - Laravel: app/Http/Requests/WorkOrderRequest.php
 */
import * as yup from 'yup';
import { validarTelefonoChileno, validarEmail } from './validators';

// =============================================================================
// MENSAJES DE ERROR PERSONALIZADOS
// =============================================================================
const MENSAJES = {
  requerido: (campo: string) => `${campo} es requerido`,
  minimo: (campo: string, min: number) => `${campo} debe tener al menos ${min} caracteres`,
  maximo: (campo: string, max: number) => `${campo} debe tener máximo ${max} caracteres`,
  numero: (campo: string) => `${campo} debe ser un número`,
  positivo: (campo: string) => `${campo} debe ser mayor a 0`,
  email: 'Email inválido',
  telefono: 'Teléfono inválido (formato: +56 9 XXXX XXXX)',
  rut: 'RUT inválido',
  archivoOC: 'Debe adjuntar archivo OC cuando OC = SI',
};

// =============================================================================
// HELPER: Transform para campos decimales (coma → punto)
// Issues 37-38: Soporte para coma como separador decimal
// =============================================================================
const transformDecimal = (_value: unknown, originalValue: unknown): number | null => {
  if (originalValue === '' || originalValue === null || originalValue === undefined) {
    return null;
  }
  // Convertir coma a punto y parsear
  const normalized = String(originalValue).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
};

// =============================================================================
// SECCIÓN 1: DATOS COMERCIALES
// =============================================================================
export const datosComercialSchema = yup.object({
  // Campos requeridos
  client_id: yup
    .number()
    .required(MENSAJES.requerido('Cliente'))
    .positive(MENSAJES.positivo('Cliente')),

  descripcion: yup
    .string()
    .required(MENSAJES.requerido('Descripción'))
    .min(3, MENSAJES.minimo('Descripción', 3))
    .max(255, MENSAJES.maximo('Descripción', 255)),

  tipo_solicitud: yup
    .number()
    .required(MENSAJES.requerido('Tipo de solicitud'))
    .oneOf([1, 2, 3], 'Tipo de solicitud inválido'), // 1=Nueva, 2=Modificación, 3=Repetición

  canal_id: yup
    .number()
    .required(MENSAJES.requerido('Canal de venta')),

  // Campos opcionales
  org_venta_id: yup.number().nullable(),
  subsubhierarchy_id: yup.number().nullable(),
  instalacion_cliente: yup.number().nullable(),

  nombre_contacto: yup
    .string()
    .max(255, MENSAJES.maximo('Nombre contacto', 255))
    .nullable(),

  email_contacto: yup
    .string()
    .test('email-valido', MENSAJES.email, (value) => !value || validarEmail(value))
    .nullable(),

  telefono_contacto: yup
    .string()
    .test('telefono-valido', MENSAJES.telefono, (value) => !value || validarTelefonoChileno(value))
    .nullable(),

  volumen_venta_anual: yup
    .number()
    .min(0, 'Volumen debe ser mayor o igual a 0')
    .nullable(),

  usd: yup
    .number()
    .min(0, 'USD debe ser mayor o igual a 0')
    .nullable(),

  oc: yup.number().oneOf([0, 1], 'Valor OC inválido').nullable(),

  // Archivo OC - requerido cuando oc = 1
  file_oc: yup.mixed()
    .when('oc', {
      is: 1,
      then: (schema) => schema.required(MENSAJES.archivoOC),
      otherwise: (schema) => schema.nullable(),
    }),

  codigo_producto: yup
    .string()
    .max(100, MENSAJES.maximo('Código producto', 100))
    .nullable(),

  dato_sub_cliente: yup
    .string()
    .max(255, MENSAJES.maximo('Dato sub-cliente', 255))
    .nullable(),
});

// =============================================================================
// SECCIÓN 2: ANTECEDENTES DESARROLLO
// =============================================================================
export const antecedentesDesarrolloSchema = yup.object({
  // Documentos (0=No, 1=Sí)
  ant_des_correo_cliente: yup.number().oneOf([0, 1]).nullable(),
  ant_des_plano_actual: yup.number().oneOf([0, 1]).nullable(),
  ant_des_boceto_actual: yup.number().oneOf([0, 1]).nullable(),
  ant_des_spec: yup.number().oneOf([0, 1]).nullable(),
  ant_des_otro: yup.number().oneOf([0, 1]).nullable(),

  // Muestra competencia
  ant_des_cj_referencia_de: yup.number().oneOf([0, 1]).nullable(),
  ant_des_cj_referencia_dg: yup.number().oneOf([0, 1]).nullable(),
  ant_des_envase_primario: yup.number().oneOf([0, 1]).nullable(),

  // Conservar muestra
  ant_des_conservar_muestra: yup.number().oneOf([0, 1]).nullable(),

  // Armado automático
  armado_automatico: yup.number().oneOf([0, 1]).nullable(),
});

// =============================================================================
// SECCIÓN 3: SOLICITA
// =============================================================================
export const solicitaSchema = yup.object({
  analisis: yup.number().oneOf([0, 1]).nullable(),
  prueba_industrial: yup.number().oneOf([0, 1]).nullable(),
  muestra: yup.number().oneOf([0, 1]).nullable(),
  numero_muestras: yup
    .number()
    .min(0, 'Número de muestras debe ser mayor o igual a 0')
    .nullable(),
});

// =============================================================================
// SECCIÓN 4: REFERENCIA
// =============================================================================
export const referenciaSchema = yup.object({
  reference_type: yup.number().nullable(),
  reference_id: yup.number().nullable(),
});

// =============================================================================
// SECCIÓN 5: CARACTERÍSTICAS (CASCADE)
// =============================================================================
export const caracteristicasSchema = yup.object({
  product_type_id: yup.number().nullable(),
  impresion: yup.number().nullable(),
  fsc: yup.string().nullable(),
  cinta: yup.number().oneOf([0, 1]).nullable(),
  coverage_internal_id: yup.number().nullable(),
  coverage_external_id: yup.number().nullable(),
  carton_color: yup.number().nullable(),
  carton_id: yup.number().nullable(),
  cad_id: yup.number().nullable(),
  cad: yup.string().max(100).nullable(),
  style_id: yup.number().nullable(),
  items_set: yup.number().min(1).nullable(),
  veces_item: yup.number().min(1).nullable(),
});

// =============================================================================
// SECCIÓN 6: DIMENSIONES
// =============================================================================
export const dimensionesSchema = yup.object({
  largura_hm: yup
    .number()
    .min(0, 'Largura HM debe ser mayor o igual a 0')
    .nullable(),

  anchura_hm: yup
    .number()
    .min(0, 'Anchura HM debe ser mayor o igual a 0')
    .nullable(),

  area_producto: yup
    .number()
    .min(0, 'Área producto debe ser mayor o igual a 0')
    .nullable(),

  recorte_adicional: yup
    .number()
    .min(0, 'Recorte adicional debe ser mayor o igual a 0')
    .nullable(),

  longitud_pegado: yup
    .number()
    .min(0, 'Longitud pegado debe ser mayor o igual a 0')
    .nullable(),

  golpes_largo: yup
    .number()
    .min(1, 'Golpes al largo debe ser al menos 1')
    .nullable(),

  golpes_ancho: yup
    .number()
    .min(1, 'Golpes al ancho debe ser al menos 1')
    .nullable(),

  separacion_golpes_largo: yup.number().min(0).nullable(),
  separacion_golpes_ancho: yup.number().min(0).nullable(),

  rayado_c1r1: yup.number().min(0).nullable(),
  rayado_r1_r2: yup.number().min(0).nullable(),
  rayado_r2_c2: yup.number().min(0).nullable(),
});

// =============================================================================
// SECCIÓN 7: PALLET
// =============================================================================
export const palletSchema = yup.object({
  pallet_qa_id: yup.number().nullable(),
  pais_id: yup.number().nullable(),
  restriccion_pallet: yup.number().oneOf([0, 1]).nullable(),
  tamano_pallet_type_id: yup.number().nullable(),
  altura_pallet: yup.number().min(0).nullable(),
  permite_sobresalir_carga: yup.number().oneOf([0, 1]).nullable(),
});

// =============================================================================
// SECCIÓN 8: ESPECIFICACIONES TÉCNICAS
// Con transform para soporte de coma como separador decimal (Issues 37-38)
// =============================================================================
export const especificacionesTecnicasSchema = yup.object({
  bct_min_lb: yup.number().transform(transformDecimal).min(0).nullable(),
  bct_min_kg: yup.number().transform(transformDecimal).min(0).nullable(),
  bct_humedo_lb: yup.number().transform(transformDecimal).min(0).nullable(),
  ect: yup.number().transform(transformDecimal).min(0).nullable(),
  gramaje: yup.number().transform(transformDecimal).min(0).nullable(),
  mullen: yup.number().transform(transformDecimal).min(0).nullable(),
  fct: yup.number().transform(transformDecimal).min(0).nullable(),
  espesor: yup.number().transform(transformDecimal).min(0).nullable(),
  cobb_interior: yup.number().transform(transformDecimal).min(0).nullable(),
  cobb_exterior: yup.number().transform(transformDecimal).min(0).nullable(),
  flexion_aleta: yup.number().transform(transformDecimal).min(0).nullable(),
  peso: yup.number().transform(transformDecimal).min(0).nullable(),
});

// =============================================================================
// SECCIÓN 9: DISEÑO Y ACABADOS
// =============================================================================
export const disenoAcabadosSchema = yup.object({
  design_type_id: yup.number().nullable(),
  barniz_uv: yup.number().oneOf([0, 1]).nullable(),
  porcentanje_barniz_uv: yup
    .number()
    .min(0, 'Porcentaje debe ser mayor o igual a 0')
    .max(100, 'Porcentaje debe ser menor o igual a 100')
    .nullable(),
});

// =============================================================================
// SECCIÓN 10: MEDIDAS INTERIORES Y EXTERIORES
// =============================================================================
export const medidasSchema = yup.object({
  interno_largo: yup.number().min(0).nullable(),
  interno_ancho: yup.number().min(0).nullable(),
  interno_alto: yup.number().min(0).nullable(),
  externo_largo: yup.number().min(0).nullable(),
  externo_ancho: yup.number().min(0).nullable(),
  externo_alto: yup.number().min(0).nullable(),
});

// =============================================================================
// SECCIÓN 11: TERMINACIONES
// =============================================================================
export const terminacionesSchema = yup.object({
  process_id: yup.number().nullable(),
  armado_id: yup.number().nullable(),
  sentido_armado: yup.number().nullable(),
  tipo_sentido_onda: yup.string().nullable(),
});

// =============================================================================
// SCHEMA COMPLETO PARA WORK ORDER
// =============================================================================
export const workOrderSchema = yup.object({
  ...datosComercialSchema.fields,
  ...antecedentesDesarrolloSchema.fields,
  ...solicitaSchema.fields,
  ...referenciaSchema.fields,
  ...caracteristicasSchema.fields,
  ...dimensionesSchema.fields,
  ...palletSchema.fields,
  ...especificacionesTecnicasSchema.fields,
  ...disenoAcabadosSchema.fields,
  ...medidasSchema.fields,
  ...terminacionesSchema.fields,
});

// =============================================================================
// TIPO INFERIDO DEL SCHEMA
// =============================================================================
export type WorkOrderFormData = yup.InferType<typeof workOrderSchema>;

// =============================================================================
// VALORES POR DEFECTO
// =============================================================================
export const workOrderDefaultValues: Partial<WorkOrderFormData> = {
  tipo_solicitud: 1, // Nueva
  oc: 0,
  ant_des_correo_cliente: 0,
  ant_des_plano_actual: 0,
  ant_des_boceto_actual: 0,
  ant_des_spec: 0,
  ant_des_otro: 0,
  ant_des_cj_referencia_de: 0,
  ant_des_cj_referencia_dg: 0,
  ant_des_envase_primario: 0,
  ant_des_conservar_muestra: 0,
  armado_automatico: 0,
  analisis: 0,
  prueba_industrial: 0,
  muestra: 0,
  numero_muestras: 0,
  cinta: 0,
  golpes_largo: 1,
  golpes_ancho: 1,
  restriccion_pallet: 0,
  permite_sobresalir_carga: 0,
  barniz_uv: 0,
};
