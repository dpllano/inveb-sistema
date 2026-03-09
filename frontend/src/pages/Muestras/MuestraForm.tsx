/**
 * MuestraForm Component
 * Formulario para crear una nueva muestra asociada a una OT.
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { muestrasApi, type MuestraCreate } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MuestraFormProps {
  otId: number;
  onNavigate: (page: string, id?: number) => void;
  onSuccess?: () => void;
}

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 900px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const BackButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 50px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const Form = styled.form`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1rem 0;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 0.375rem;
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 0.625rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: ${theme.colors.bgLight};
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.625rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const TextArea = styled.textarea`
  padding: 0.625rem 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
  cursor: pointer;
`;

const DestinoCard = styled.div<{ $enabled?: boolean }>`
  background: ${props => props.$enabled ? theme.colors.primary + '08' : theme.colors.bgLight};
  border: 1px solid ${props => props.$enabled ? theme.colors.primary + '40' : theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s;
`;

const DestinoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const DestinoTitle = styled.span`
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const DestinoFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${theme.colors.border};
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.625rem 1.5rem;
  border: 1px solid ${props => props.$primary ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  background: ${props => props.$primary ? theme.colors.primary : 'white'};
  color: ${props => props.$primary ? 'white' : theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: ${theme.colors.danger}15;
  border: 1px solid ${theme.colors.danger}40;
  border-radius: 4px;
  padding: 0.75rem;
  color: ${theme.colors.danger};
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
`;

// Initial state
const initialFormState: MuestraCreate = {
  work_order_id: 0,
  sala_corte_id: undefined,
  cad_id: undefined,
  carton_id: undefined,
  observacion_muestra: '',
  // Vendedor
  vendedor_nombre: '',
  vendedor_direccion: '',
  vendedor_ciudad: '',
  vendedor_check: 0,
  cantidad_vendedor: 0,
  // Diseñador
  disenador_nombre: '',
  disenador_direccion: '',
  disenador_ciudad: '',
  disenador_check: 0,
  cantidad_disenador: 0,
  // Laboratorio
  laboratorio_check: 0,
  cantidad_laboratorio: 0,
  // Cliente
  cliente_check: 0,
  cantidad_cliente: 0,
  // Diseñador Revisión
  disenador_revision_nombre: '',
  disenador_revision_direccion: '',
  disenador_revision_check: 0,
  cantidad_disenador_revision: 0,
};

// Component
export function MuestraForm({ otId, onNavigate, onSuccess }: MuestraFormProps) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<MuestraCreate>({
    ...initialFormState,
    work_order_id: otId,
  });
  const [error, setError] = useState<string | null>(null);

  // Query para opciones
  const { data: options, isLoading: loadingOptions } = useQuery({
    queryKey: ['muestras-options'],
    queryFn: () => muestrasApi.getOptions(),
  });

  // Mutation para crear
  const createMutation = useMutation({
    mutationFn: (data: MuestraCreate) => muestrasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras', otId] });
      if (onSuccess) {
        onSuccess();
      } else {
        onNavigate('muestras-list', otId);
      }
    },
    onError: (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la muestra';
      setError(errorMessage);
    },
  });

  // Handlers
  const handleChange = useCallback((field: keyof MuestraCreate, value: unknown) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCheckChange = useCallback((field: keyof MuestraCreate, checked: boolean) => {
    setFormState(prev => ({ ...prev, [field]: checked ? 1 : 0 }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar que al menos un destino tenga cantidad
    const totalCantidad = (formState.cantidad_vendedor || 0) +
      (formState.cantidad_disenador || 0) +
      (formState.cantidad_laboratorio || 0) +
      (formState.cantidad_cliente || 0) +
      (formState.cantidad_disenador_revision || 0);

    if (totalCantidad === 0) {
      setError('Debe especificar al menos una cantidad en algún destino');
      return;
    }

    createMutation.mutate(formState);
  }, [formState, createMutation]);

  const handleCancel = useCallback(() => {
    onNavigate('muestras-list', otId);
  }, [onNavigate, otId]);

  if (loadingOptions) {
    return (
      <Container>
        <Header>
          <Title>Nueva Muestra para OT #{otId}</Title>
          <BackButton onClick={handleCancel}>Cancelar</BackButton>
        </Header>
        <LoadingOverlay>Cargando opciones...</LoadingOverlay>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Nueva Muestra para OT #{otId}</Title>
        <BackButton onClick={handleCancel}>Cancelar</BackButton>
      </Header>

      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Información General */}
        <Section>
          <SectionTitle>Información General</SectionTitle>
          <FormRow>
            <FormGroup>
              <Label>Sala de Corte</Label>
              <Select
                value={formState.sala_corte_id || ''}
                onChange={e => handleChange('sala_corte_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seleccionar...</option>
                {options?.salas_corte?.map(sala => (
                  <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>CAD</Label>
              <Select
                value={formState.cad_id || ''}
                onChange={e => handleChange('cad_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seleccionar...</option>
                {options?.cads?.map(cad => (
                  <option key={cad.id} value={cad.id}>{cad.codigo}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Cartón</Label>
              <Select
                value={formState.carton_id || ''}
                onChange={e => handleChange('carton_id', e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seleccionar...</option>
                {options?.cartones?.map(carton => (
                  <option key={carton.id} value={carton.id}>{carton.codigo}</option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Observación</Label>
              <TextArea
                value={formState.observacion_muestra || ''}
                onChange={e => handleChange('observacion_muestra', e.target.value)}
                placeholder="Observaciones generales de la muestra..."
              />
            </FormGroup>
          </FormRow>
        </Section>

        {/* Destinos */}
        <Section>
          <SectionTitle>Destinos de Muestras</SectionTitle>

          {/* Vendedor */}
          <DestinoCard $enabled={!!formState.vendedor_check} style={{ marginBottom: '1rem' }}>
            <DestinoHeader>
              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="vendedor_check"
                  checked={!!formState.vendedor_check}
                  onChange={e => handleCheckChange('vendedor_check', e.target.checked)}
                />
                <CheckboxLabel htmlFor="vendedor_check">
                  <DestinoTitle>Vendedor</DestinoTitle>
                </CheckboxLabel>
              </CheckboxRow>
            </DestinoHeader>
            {formState.vendedor_check ? (
              <DestinoFields>
                <FormGroup>
                  <Label>Nombre</Label>
                  <Input
                    value={formState.vendedor_nombre || ''}
                    onChange={e => handleChange('vendedor_nombre', e.target.value)}
                    placeholder="Nombre del vendedor"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Dirección</Label>
                  <Input
                    value={formState.vendedor_direccion || ''}
                    onChange={e => handleChange('vendedor_direccion', e.target.value)}
                    placeholder="Dirección"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Ciudad</Label>
                  <Input
                    value={formState.vendedor_ciudad || ''}
                    onChange={e => handleChange('vendedor_ciudad', e.target.value)}
                    placeholder="Ciudad"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.cantidad_vendedor || ''}
                    onChange={e => handleChange('cantidad_vendedor', e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormGroup>
              </DestinoFields>
            ) : null}
          </DestinoCard>

          {/* Diseñador */}
          <DestinoCard $enabled={!!formState.disenador_check} style={{ marginBottom: '1rem' }}>
            <DestinoHeader>
              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="disenador_check"
                  checked={!!formState.disenador_check}
                  onChange={e => handleCheckChange('disenador_check', e.target.checked)}
                />
                <CheckboxLabel htmlFor="disenador_check">
                  <DestinoTitle>Diseñador</DestinoTitle>
                </CheckboxLabel>
              </CheckboxRow>
            </DestinoHeader>
            {formState.disenador_check ? (
              <DestinoFields>
                <FormGroup>
                  <Label>Nombre</Label>
                  <Input
                    value={formState.disenador_nombre || ''}
                    onChange={e => handleChange('disenador_nombre', e.target.value)}
                    placeholder="Nombre del diseñador"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Dirección</Label>
                  <Input
                    value={formState.disenador_direccion || ''}
                    onChange={e => handleChange('disenador_direccion', e.target.value)}
                    placeholder="Dirección"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Ciudad</Label>
                  <Input
                    value={formState.disenador_ciudad || ''}
                    onChange={e => handleChange('disenador_ciudad', e.target.value)}
                    placeholder="Ciudad"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.cantidad_disenador || ''}
                    onChange={e => handleChange('cantidad_disenador', e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormGroup>
              </DestinoFields>
            ) : null}
          </DestinoCard>

          {/* Laboratorio */}
          <DestinoCard $enabled={!!formState.laboratorio_check} style={{ marginBottom: '1rem' }}>
            <DestinoHeader>
              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="laboratorio_check"
                  checked={!!formState.laboratorio_check}
                  onChange={e => handleCheckChange('laboratorio_check', e.target.checked)}
                />
                <CheckboxLabel htmlFor="laboratorio_check">
                  <DestinoTitle>Laboratorio</DestinoTitle>
                </CheckboxLabel>
              </CheckboxRow>
            </DestinoHeader>
            {formState.laboratorio_check ? (
              <DestinoFields>
                <FormGroup>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.cantidad_laboratorio || ''}
                    onChange={e => handleChange('cantidad_laboratorio', e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormGroup>
              </DestinoFields>
            ) : null}
          </DestinoCard>

          {/* Cliente */}
          <DestinoCard $enabled={!!formState.cliente_check} style={{ marginBottom: '1rem' }}>
            <DestinoHeader>
              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="cliente_check"
                  checked={!!formState.cliente_check}
                  onChange={e => handleCheckChange('cliente_check', e.target.checked)}
                />
                <CheckboxLabel htmlFor="cliente_check">
                  <DestinoTitle>Cliente</DestinoTitle>
                </CheckboxLabel>
              </CheckboxRow>
            </DestinoHeader>
            {formState.cliente_check ? (
              <DestinoFields>
                <FormGroup>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.cantidad_cliente || ''}
                    onChange={e => handleChange('cantidad_cliente', e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormGroup>
              </DestinoFields>
            ) : null}
          </DestinoCard>

          {/* Diseñador Revisión */}
          <DestinoCard $enabled={!!formState.disenador_revision_check}>
            <DestinoHeader>
              <CheckboxRow>
                <Checkbox
                  type="checkbox"
                  id="disenador_revision_check"
                  checked={!!formState.disenador_revision_check}
                  onChange={e => handleCheckChange('disenador_revision_check', e.target.checked)}
                />
                <CheckboxLabel htmlFor="disenador_revision_check">
                  <DestinoTitle>Diseñador Revisión</DestinoTitle>
                </CheckboxLabel>
              </CheckboxRow>
            </DestinoHeader>
            {formState.disenador_revision_check ? (
              <DestinoFields>
                <FormGroup>
                  <Label>Nombre</Label>
                  <Input
                    value={formState.disenador_revision_nombre || ''}
                    onChange={e => handleChange('disenador_revision_nombre', e.target.value)}
                    placeholder="Nombre del diseñador revisor"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Dirección</Label>
                  <Input
                    value={formState.disenador_revision_direccion || ''}
                    onChange={e => handleChange('disenador_revision_direccion', e.target.value)}
                    placeholder="Dirección"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formState.cantidad_disenador_revision || ''}
                    onChange={e => handleChange('cantidad_disenador_revision', e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormGroup>
              </DestinoFields>
            ) : null}
          </DestinoCard>
        </Section>

        <ButtonRow>
          <Button type="button" onClick={handleCancel}>Cancelar</Button>
          <Button type="submit" $primary disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Muestra'}
          </Button>
        </ButtonRow>
      </Form>
    </Container>
  );
}

export default MuestraForm;
