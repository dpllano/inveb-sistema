/**
 * React Query hooks for Cascade data
 */

import { useQuery } from '@tanstack/react-query';
import { cascadeApi } from '../services/api';
import type { ValidateCombinationParams } from '../types/cascade';

/**
 * Hook to fetch all cascade rules
 */
export function useCascadeRules() {
  return useQuery({
    queryKey: ['cascade-rules'],
    queryFn: cascadeApi.getRules,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch cascade rules by trigger field
 */
export function useCascadeRulesByTrigger(triggerField: string) {
  return useQuery({
    queryKey: ['cascade-rules', 'trigger', triggerField],
    queryFn: () => cascadeApi.getRulesByTrigger(triggerField),
    enabled: !!triggerField,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to validate a product combination
 */
export function useCascadeValidation(params: ValidateCombinationParams) {
  const hasRequiredParams = !!params.product_type_id && !!params.impresion && !!params.fsc;

  return useQuery({
    queryKey: ['cascade-validation', params],
    queryFn: () => cascadeApi.validateCombination(params),
    enabled: hasRequiredParams,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for API health check
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: cascadeApi.healthCheck,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch all form options
 */
export function useFormOptions() {
  return useQuery({
    queryKey: ['form-options'],
    queryFn: cascadeApi.getFormOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes - options don't change often
  });
}
