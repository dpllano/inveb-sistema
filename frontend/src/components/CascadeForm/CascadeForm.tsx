/**
 * CascadeForm Component
 * Implementa el formulario de 9 campos para la sección 6 - Tipo Item
 * Diseño simple que coincide con la versión Laravel
 */

import { useCallback, useMemo } from 'react';
import { CascadeSelect, LoadingSpinner } from '../common';
import { useFormOptions } from '../../hooks/useCascadeRules';
import type { CascadeFormData, SelectOption } from '../../types/cascade';
import { SimpleFormGrid } from './CascadeForm.styles';

type FieldErrors = Record<string, string>;

interface CascadeFormProps {
  values: CascadeFormData;
  onChange: (data: CascadeFormData) => void;
  fieldErrors?: FieldErrors;
}

// Opciones por defecto mientras carga la API
const DEFAULT_OPTIONS: SelectOption[] = [];

export function CascadeForm({ values, onChange, fieldErrors = {} }: CascadeFormProps) {
  const { data: formOptions, isLoading: optionsLoading } = useFormOptions();

  // Mapear opciones de la API a formato del formulario
  const options = useMemo(() => ({
    productType: formOptions?.product_types || DEFAULT_OPTIONS,
    impresion: formOptions?.impresion_types || DEFAULT_OPTIONS,
    fsc: formOptions?.fsc_options || DEFAULT_OPTIONS,
    cinta: formOptions?.cinta_options || DEFAULT_OPTIONS,
    coverageInternal: formOptions?.coverage_internal || DEFAULT_OPTIONS,
    coverageExternal: formOptions?.coverage_external || DEFAULT_OPTIONS,
    planta: formOptions?.plantas || DEFAULT_OPTIONS,
    cartonColor: formOptions?.carton_colors || DEFAULT_OPTIONS,
    carton: formOptions?.cartones || DEFAULT_OPTIONS,
  }), [formOptions]);

  // Reset fields from a given step onwards
  const resetFieldsFrom = useCallback((step: number, currentValues: CascadeFormData): CascadeFormData => {
    const updated = { ...currentValues };

    if (step <= 2) updated.impresion = null;
    if (step <= 3) updated.fsc = null;
    if (step <= 4) updated.cinta = null;
    if (step <= 5) updated.coverageInternalId = null;
    if (step <= 6) updated.coverageExternalId = null;
    if (step <= 7) updated.plantaId = null;
    if (step <= 8) updated.cartonColor = null;
    if (step <= 9) updated.cartonId = null;

    return updated;
  }, []);

  // Handle field change
  const handleChange = useCallback(
    (field: keyof CascadeFormData, value: string | number | null) => {
      const stepMap: Record<keyof CascadeFormData, number> = {
        productTypeId: 1,
        impresion: 2,
        fsc: 3,
        cinta: 4,
        coverageInternalId: 5,
        coverageExternalId: 6,
        plantaId: 7,
        cartonColor: 8,
        cartonId: 9,
      };

      // Convert value
      let parsedValue: string | number | null = value;
      if (value === '' || value === null) {
        parsedValue = null;
      } else if (['productTypeId', 'coverageInternalId', 'coverageExternalId', 'plantaId', 'cartonId'].includes(field)) {
        parsedValue = parseInt(value as string, 10);
      }

      // Update field and reset subsequent fields
      const currentStep = stepMap[field];
      let updatedValues = { ...values, [field]: parsedValue };
      updatedValues = resetFieldsFrom(currentStep + 1, updatedValues);

      onChange(updatedValues);
    },
    [values, onChange, resetFieldsFrom]
  );

  if (optionsLoading) {
    return <LoadingSpinner />;
  }

  // Orden de campos igual a Laravel:
  // Col 1: Tipo Item, Impresión, FSC
  // Col 2: Cinta, Recubrimiento Interno, Recubrimiento Externo
  // Col 3: Planta Objetivo, Color Cartón, Cartón
  return (
    <SimpleFormGrid>
      {/* Columna 1 */}
      <CascadeSelect
        label="Tipo Item *"
        value={values.productTypeId}
        options={options.productType}
        onChange={(v) => handleChange('productTypeId', v)}
        placeholder="Seleccionar..."
        error={!!fieldErrors.product_type_id}
        helperText={fieldErrors.product_type_id}
      />
      <CascadeSelect
        label="Cinta"
        value={values.cinta}
        options={options.cinta}
        onChange={(v) => handleChange('cinta', v)}
        disabled={!values.fsc}
        placeholder="Seleccionar..."
        error={!!fieldErrors.cinta}
        helperText={fieldErrors.cinta}
      />
      <CascadeSelect
        label="Planta Objetivo"
        value={values.plantaId}
        options={options.planta}
        onChange={(v) => handleChange('plantaId', v)}
        disabled={!values.coverageExternalId}
        placeholder="Seleccionar..."
        error={!!fieldErrors.planta_id}
        helperText={fieldErrors.planta_id}
      />

      {/* Columna 2 */}
      <CascadeSelect
        label="Impresion *"
        value={values.impresion}
        options={options.impresion}
        onChange={(v) => handleChange('impresion', v)}
        disabled={!values.productTypeId}
        placeholder="Seleccionar..."
        error={!!fieldErrors.impresion}
        helperText={fieldErrors.impresion}
      />
      <CascadeSelect
        label="Recubrimiento Interno"
        value={values.coverageInternalId}
        options={options.coverageInternal}
        onChange={(v) => handleChange('coverageInternalId', v)}
        disabled={!values.cinta}
        placeholder="Seleccionar..."
        error={!!fieldErrors.coverage_internal_id}
        helperText={fieldErrors.coverage_internal_id}
      />
      <CascadeSelect
        label="Color Carton *"
        value={values.cartonColor}
        options={options.cartonColor}
        onChange={(v) => handleChange('cartonColor', v)}
        disabled={!values.plantaId}
        placeholder="Seleccionar..."
        error={!!fieldErrors.carton_color}
        helperText={fieldErrors.carton_color}
      />

      {/* Columna 3 */}
      <CascadeSelect
        label="FSC"
        value={values.fsc}
        options={options.fsc}
        onChange={(v) => handleChange('fsc', v)}
        disabled={!values.impresion}
        placeholder="Seleccionar..."
        error={!!fieldErrors.fsc}
        helperText={fieldErrors.fsc}
      />
      <CascadeSelect
        label="Recubrimiento Externo"
        value={values.coverageExternalId}
        options={options.coverageExternal}
        onChange={(v) => handleChange('coverageExternalId', v)}
        disabled={!values.coverageInternalId}
        placeholder="Seleccionar..."
        error={!!fieldErrors.coverage_external_id}
        helperText={fieldErrors.coverage_external_id}
      />
      <CascadeSelect
        label="Carton"
        value={values.cartonId}
        options={options.carton}
        onChange={(v) => handleChange('cartonId', v)}
        disabled={!values.cartonColor}
        placeholder="Seleccionar..."
        error={!!fieldErrors.carton_id}
        helperText={fieldErrors.carton_id}
      />
    </SimpleFormGrid>
  );
}
