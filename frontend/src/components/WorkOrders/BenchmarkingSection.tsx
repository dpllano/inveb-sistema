/**
 * BenchmarkingSection Component
 * Sección para datos de Estudio Benchmarking en OTs Especiales
 *
 * Fuente Laravel:
 * - ficha-form-estudio-bench.blade.php líneas 145-310
 * - WorkOrderController.php líneas 2123-2293
 *
 * Ensayos disponibles: 17 tipos de ensayos de laboratorio
 */

import { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

// =============================================
// TIPOS
// =============================================

export interface Ensayo {
  id: string;
  label: string;
  campo: string; // Nombre del campo en BD: check_estudio_{id}
}

export interface DetalleEstudio {
  identificacion: string;
  cliente: string;
  descripcion: string;
}

export interface BenchmarkingData {
  cantidad_estudio_bench: number | null;
  fecha_maxima_entrega_estudio: string | null;
  ensayos_selected: string[];
  detalles_estudios: DetalleEstudio[];
}

export interface BenchmarkingSectionProps {
  data: BenchmarkingData;
  onChange: (data: BenchmarkingData) => void;
  readOnly?: boolean;
}

// =============================================
// CONSTANTES - Ensayos disponibles
// Fuente: ficha-form-estudio-bench.blade.php líneas 145-310
// =============================================

export const ENSAYOS: Ensayo[] = [
  { id: 'bct', label: 'BCT (lbf)', campo: 'check_estudio_bct' },
  { id: 'ect', label: 'ECT (lb/in)', campo: 'check_estudio_ect' },
  { id: 'bct_humedo', label: 'BCT en Humedo (lbf)', campo: 'check_estudio_bct_humedo' },
  { id: 'flat', label: 'Flat Crush (lb/in)', campo: 'check_estudio_flat' },
  { id: 'humedad', label: 'Humedad (%)', campo: 'check_estudio_humedad' },
  { id: 'porosidad_ext', label: 'Porosidad Exterior Gurley', campo: 'check_estudio_porosidad_ext' },
  { id: 'espesor', label: 'Espesor (mm)', campo: 'check_estudio_espesor' },
  { id: 'cera', label: 'Cera', campo: 'check_estudio_cera' },
  { id: 'porosidad_int', label: 'Porosidad Interior Gurley', campo: 'check_estudio_porosidad_int' },
  { id: 'flexion_fondo', label: 'Flexion de Fondo', campo: 'check_estudio_flexion_fondo' },
  { id: 'gramaje', label: 'Gramaje (gr/mt2)', campo: 'check_estudio_gramaje' },
  { id: 'composicion_papeles', label: 'Composicion Papeles', campo: 'check_estudio_composicion_papeles' },
  { id: 'cobb_interno', label: 'Cobb Interno', campo: 'check_estudio_cobb_interno' },
  { id: 'cobb_externo', label: 'Cobb Externo', campo: 'check_estudio_cobb_externo' },
  { id: 'flexion_4_puntos', label: 'Flexion 4 Puntos', campo: 'check_estudio_flexion_4_puntos' },
  { id: 'medidas', label: 'Medidas', campo: 'check_estudio_medidas' },
  { id: 'impresion', label: 'Impresion', campo: 'check_estudio_impresion' },
];

// =============================================
// STYLED COMPONENTS
// =============================================

const Card = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const CardHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgLight};
  border-radius: 8px 8px 0 0;
`;

const CardTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.85rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }

  &:disabled {
    background: ${theme.colors.bgLight};
    cursor: not-allowed;
  }
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const CheckboxGroup = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-size: 0.8rem;
  color: ${theme.colors.textPrimary};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};

  input {
    width: 16px;
    height: 16px;
    accent-color: ${theme.colors.primary};
  }
`;

const SectionTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  span {
    font-weight: 400;
    font-size: 0.75rem;
    color: ${theme.colors.textSecondary};
  }
`;

const DetallesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const DetalleRow = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  background: ${theme.colors.bgLight};
  border-radius: 4px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetalleLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

// =============================================
// COMPONENT
// =============================================

export default function BenchmarkingSection({
  data,
  onChange,
  readOnly = false,
}: BenchmarkingSectionProps) {
  // Generar lista de detalles basado en cantidad
  const cantidadDetalles = useMemo(() => {
    const cantidad = data.cantidad_estudio_bench || 0;
    return Math.min(Math.max(cantidad, 0), 10); // Max 10 detalles
  }, [data.cantidad_estudio_bench]);

  const handleCantidadChange = useCallback((value: string) => {
    const cantidad = parseInt(value) || null;
    const newDetalles = [...data.detalles_estudios];

    // Ajustar array de detalles al nuevo tamaño
    if (cantidad !== null && cantidad > 0) {
      while (newDetalles.length < cantidad) {
        newDetalles.push({ identificacion: '', cliente: '', descripcion: '' });
      }
      newDetalles.length = Math.min(cantidad, 10);
    }

    onChange({
      ...data,
      cantidad_estudio_bench: cantidad,
      detalles_estudios: newDetalles,
    });
  }, [data, onChange]);

  const handleFechaChange = useCallback((value: string) => {
    onChange({
      ...data,
      fecha_maxima_entrega_estudio: value || null,
    });
  }, [data, onChange]);

  const handleEnsayoToggle = useCallback((ensayoId: string) => {
    if (readOnly) return;

    const newSelected = data.ensayos_selected.includes(ensayoId)
      ? data.ensayos_selected.filter((id) => id !== ensayoId)
      : [...data.ensayos_selected, ensayoId];

    onChange({
      ...data,
      ensayos_selected: newSelected,
    });
  }, [data, onChange, readOnly]);

  const handleDetalleChange = useCallback((index: number, field: keyof DetalleEstudio, value: string) => {
    const newDetalles = [...data.detalles_estudios];
    if (!newDetalles[index]) {
      newDetalles[index] = { identificacion: '', cliente: '', descripcion: '' };
    }
    newDetalles[index] = { ...newDetalles[index], [field]: value };

    onChange({
      ...data,
      detalles_estudios: newDetalles,
    });
  }, [data, onChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de Estudio Benchmarking</CardTitle>
      </CardHeader>
      <CardBody>
        {/* Campos principales */}
        <FormGrid>
          <FormGroup>
            <Label>Cantidad de Items</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={data.cantidad_estudio_bench || ''}
              onChange={(e) => handleCantidadChange(e.target.value)}
              disabled={readOnly}
            />
          </FormGroup>

          <FormGroup>
            <Label>Fecha Maxima Entrega</Label>
            <Input
              type="date"
              value={data.fecha_maxima_entrega_estudio || ''}
              onChange={(e) => handleFechaChange(e.target.value)}
              disabled={readOnly}
            />
          </FormGroup>
        </FormGrid>

        {/* Ensayos Caja */}
        <div style={{ marginTop: '1.5rem' }}>
          <SectionTitle>
            Ensayos Caja
            <span>({data.ensayos_selected.length} seleccionados)</span>
          </SectionTitle>
          <CheckboxGrid>
            {ENSAYOS.map((ensayo) => (
              <CheckboxGroup key={ensayo.id} $disabled={readOnly}>
                <input
                  type="checkbox"
                  checked={data.ensayos_selected.includes(ensayo.id)}
                  onChange={() => handleEnsayoToggle(ensayo.id)}
                  disabled={readOnly}
                />
                {ensayo.label}
              </CheckboxGroup>
            ))}
          </CheckboxGrid>
        </div>

        {/* Detalles de Estudios (dinámico según cantidad) */}
        {cantidadDetalles > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <SectionTitle>
              Detalle de Estudios
              <span>({cantidadDetalles} items)</span>
            </SectionTitle>
            <DetallesGrid>
              {Array.from({ length: cantidadDetalles }).map((_, index) => (
                <DetalleRow key={index}>
                  <DetalleLabel>#{index + 1}</DetalleLabel>
                  <Input
                    placeholder="Identificacion"
                    value={data.detalles_estudios[index]?.identificacion || ''}
                    onChange={(e) => handleDetalleChange(index, 'identificacion', e.target.value)}
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Cliente"
                    value={data.detalles_estudios[index]?.cliente || ''}
                    onChange={(e) => handleDetalleChange(index, 'cliente', e.target.value)}
                    disabled={readOnly}
                  />
                  <Input
                    placeholder="Descripcion"
                    value={data.detalles_estudios[index]?.descripcion || ''}
                    onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)}
                    disabled={readOnly}
                  />
                </DetalleRow>
              ))}
            </DetallesGrid>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// =============================================
// UTILIDADES DE EXPORTACIÓN
// =============================================

/**
 * Convierte BenchmarkingData a campos de BD para API
 */
export function benchmarkingDataToApiFields(data: BenchmarkingData): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    cantidad_estudio_bench: data.cantidad_estudio_bench,
    fecha_maxima_entrega_estudio: data.fecha_maxima_entrega_estudio,
  };

  // Convertir ensayos a campos check_estudio_*
  ENSAYOS.forEach((ensayo) => {
    fields[ensayo.campo] = data.ensayos_selected.includes(ensayo.id) ? 1 : null;
  });

  // Convertir detalles a formato concatenado (separador: ¡ y *)
  // Fuente: WorkOrderController.php línea 2180
  if (data.detalles_estudios.length > 0) {
    const detallesConcatenados = data.detalles_estudios
      .map((d) => `${d.identificacion}*${d.cliente}*${d.descripcion}`)
      .join('¡');
    fields.detalle_estudio_bench = detallesConcatenados;
  }

  return fields;
}

/**
 * Parsea campos de BD a BenchmarkingData
 */
export function apiFieldsToBenchmarkingData(fields: Record<string, unknown>): BenchmarkingData {
  const ensayos_selected: string[] = [];

  ENSAYOS.forEach((ensayo) => {
    if (fields[ensayo.campo] === 1 || fields[ensayo.campo] === '1') {
      ensayos_selected.push(ensayo.id);
    }
  });

  // Parsear detalles concatenados
  const detalles_estudios: DetalleEstudio[] = [];
  const detalleStr = fields.detalle_estudio_bench as string;
  if (detalleStr) {
    const items = detalleStr.split('¡');
    items.forEach((item) => {
      const parts = item.split('*');
      if (parts.length >= 3) {
        detalles_estudios.push({
          identificacion: parts[0] || '',
          cliente: parts[1] || '',
          descripcion: parts[2] || '',
        });
      }
    });
  }

  return {
    cantidad_estudio_bench: fields.cantidad_estudio_bench as number | null,
    fecha_maxima_entrega_estudio: fields.fecha_maxima_entrega_estudio as string | null,
    ensayos_selected,
    detalles_estudios,
  };
}
