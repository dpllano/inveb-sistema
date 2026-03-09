/**
 * Hooks - Exportaciones centralizadas
 * Sprint K
 */

// React Hook Form integration
export {
  useFormValidation,
  useWorkOrderForm,
  useClientForm,
  useCotizacionForm,
  useLoginForm,
  useChangePasswordForm,
} from './useFormValidation';

// Cascade rules
export {
  useCascadeRules,
  useCascadeRulesByTrigger,
  useCascadeValidation,
  useHealthCheck,
  useFormOptions,
} from './useCascadeRules';

// Work Orders
export {
  useWorkOrderFilterOptions,
  useFormOptionsComplete,
} from './useWorkOrders';

// Mantenedores - Clients
export {
  useClientsList,
  useClientDetail,
  useClasificaciones,
  useCreateClient,
  useUpdateClient,
  useActivateClient,
  useDeactivateClient,
} from './useMantenedores';

// Mantenedores - Users
export {
  useUsersList,
  useUserDetail,
  useRoles,
  useWorkSpaces,
  useCreateUser,
  useUpdateUser,
  useActivateUser,
  useDeactivateUser,
} from './useMantenedores';
