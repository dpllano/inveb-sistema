/**
 * Type definitions for Cascade system
 */

export interface CascadeRule {
  id: number;
  rule_code: string;
  rule_name: string;
  trigger_field: string;
  trigger_table: string | null;
  target_field: string;
  target_table: string | null;
  action: 'enable' | 'disable' | 'setValue';
  condition_type: 'hasValue' | 'equals' | 'in';
  condition_value: string | null;
  reset_fields: string | null;
  validation_endpoint: string | null;
  cascade_order: number;
  form_context: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CascadeValidCombination {
  id: number;
  product_type_id: number;
  impresion: string;
  fsc: string;
  active: boolean;
  notes: string | null;
  plantas: number[];
}

export interface CascadeFormData {
  productTypeId: number | null;
  impresion: string | null;
  fsc: string | null;
  cinta: string | null;
  coverageInternalId: number | null;
  coverageExternalId: number | null;
  plantaId: number | null;
  cartonColor: string | null;
  cartonId: number | null;
}

export interface CascadeStep {
  order: number;
  field: keyof CascadeFormData;
  label: string;
  enabled: boolean;
  value: string | number | null;
  options: SelectOption[];
}

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

export interface FormOptionsResponse {
  product_types: SelectOption[];
  impresion_types: SelectOption[];
  fsc_options: SelectOption[];
  cinta_options: SelectOption[];
  coverage_internal: SelectOption[];
  coverage_external: SelectOption[];
  plantas: SelectOption[];
  carton_colors: SelectOption[];
  cartones: SelectOption[];
}

export interface ValidateCombinationParams {
  product_type_id?: number;
  impresion?: string;
  fsc?: string;
}

export interface ValidationResult {
  valid: boolean;
  combination: CascadeValidCombination | null;
  message?: string;
}
