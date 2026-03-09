/**
 * Hook para integrar React Hook Form con Yup
 * Sprint K - Task K.3
 *
 * Uso:
 * const { register, errors, handleSubmit, ... } = useFormValidation({
 *   schema: workOrderSchema,
 *   defaultValues: workOrderDefaultValues,
 * });
 */
import { useForm, UseFormProps, UseFormReturn, FieldValues, DefaultValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { ObjectSchema } from 'yup';

// Importaciones de schemas
import {
  workOrderSchema,
  workOrderDefaultValues,
  clientSchema,
  clientDefaultValues,
  cotizacionSchema,
  cotizacionDefaultValues,
  loginSchema,
  changePasswordSchema,
} from '../schemas';

interface UseFormValidationProps<T extends FieldValues> {
  schema: ObjectSchema<T>;
  defaultValues?: DefaultValues<T>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

/**
 * Hook personalizado que configura React Hook Form con validación Yup
 */
export function useFormValidation<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onBlur',
}: UseFormValidationProps<T>): UseFormReturn<T> {
  const formOptions: UseFormProps<T> = {
    resolver: yupResolver(schema) as any,
    defaultValues,
    mode,
  };

  return useForm<T>(formOptions);
}

/**
 * Hook especializado para Work Orders
 */
export function useWorkOrderForm(defaultValues?: Partial<Record<string, any>>) {
  return useFormValidation({
    schema: workOrderSchema as any,
    defaultValues: { ...workOrderDefaultValues, ...defaultValues },
    mode: 'onBlur',
  });
}

/**
 * Hook especializado para Clientes
 */
export function useClientForm(defaultValues?: Partial<Record<string, any>>) {
  return useFormValidation({
    schema: clientSchema as any,
    defaultValues: { ...clientDefaultValues, ...defaultValues },
    mode: 'onBlur',
  });
}

/**
 * Hook especializado para Cotizaciones
 */
export function useCotizacionForm(defaultValues?: Partial<Record<string, any>>) {
  return useFormValidation({
    schema: cotizacionSchema as any,
    defaultValues: { ...cotizacionDefaultValues, ...defaultValues },
    mode: 'onBlur',
  });
}

/**
 * Hook especializado para Login
 */
export function useLoginForm() {
  return useFormValidation({
    schema: loginSchema as any,
    mode: 'onSubmit',
  });
}

/**
 * Hook especializado para Cambio de Contraseña
 */
export function useChangePasswordForm() {
  return useFormValidation({
    schema: changePasswordSchema as any,
    mode: 'onSubmit',
  });
}

export default useFormValidation;
