/**
 * CreateSpecialOT Component
 * Formulario para crear OTs de tipo especial:
 * - Estudio Benchmarking: Analisis de productos competencia
 * - Ficha Tecnica: Especificaciones tecnicas de producto
 * - Licitacion: OTs para procesos de licitacion
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1.5rem 0;
`;

const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TypeCard = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => $active ? `${theme.colors.primary}15` : 'white'};
  border: 2px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const TypeIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const TypeTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 0.25rem 0;
`;

const TypeDescription = styled.p`
  font-size: 0.8rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`;

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
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.85rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const Textarea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.85rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
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

const CheckboxGroup = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: ${theme.colors.textPrimary};

  input {
    width: 16px;
    height: 16px;
    accent-color: ${theme.colors.primary};
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { background: ${theme.colors.primaryDark || '#0051a3'}; }
        `;
      case 'success':
        return `
          background: ${theme.colors.success};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      default:
        return `
          background: ${theme.colors.bgLight};
          color: ${theme.colors.textSecondary};
          border: 1px solid ${theme.colors.border};
          &:hover { background: white; }
        `;
    }
  }}
`;

const InfoCard = styled.div`
  background: ${theme.colors.warning}10;
  border: 1px solid ${theme.colors.warning}30;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

// Types
type SpecialOTType = 'estudio-bench' | 'ficha-tecnica' | 'licitacion';

interface CreateSpecialOTProps {
  onNavigate: (page: string, id?: number) => void;
}

// Ensayos checkboxes for Estudio Benchmarking
const ensayos = [
  { id: 'bct', label: 'BCT (lbf)' },
  { id: 'ect', label: 'ECT (lb/in)' },
  { id: 'bct_humedo', label: 'BCT en Humedo (lbf)' },
  { id: 'flat', label: 'Flat Crush (lb/in)' },
  { id: 'humedad', label: 'Humedad (%)' },
  { id: 'porosidad_ext', label: 'Porosidad Exterior Gurley' },
  { id: 'espesor', label: 'Espesor (mm)' },
  { id: 'cera', label: 'Cera' },
  { id: 'porosidad_int', label: 'Porosidad Interior Gurley' },
  { id: 'flexion_fondo', label: 'Flexion de Fondo' },
  { id: 'gramaje', label: 'Gramaje (gr/mt2)' },
  { id: 'composicion_papeles', label: 'Composicion Papeles' },
  { id: 'cobb_interno', label: 'Cobb Interno' },
  { id: 'cobb_externo', label: 'Cobb Externo' },
  { id: 'flexion_4_puntos', label: 'Flexion 4 Puntos' },
  { id: 'medidas', label: 'Medidas' },
  { id: 'impresion', label: 'Impresion' },
];

export default function CreateSpecialOT({ onNavigate }: CreateSpecialOTProps) {
  const [selectedType, setSelectedType] = useState<SpecialOTType | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    descripcion: '',
    codigo_producto: '',
    tipo_solicitud: '',
    canal_id: '',
    hierarchy_id: '',
    subhierarchy_id: '',
    subsubhierarchy_id: '',
    nombre_contacto: '',
    email_contacto: '',
    telefono_contacto: '',
    observacion: '',
    // Estudio Benchmarking
    cantidad_estudio_bench: '',
    fecha_maxima_entrega_estudio: '',
    ensayos_selected: [] as string[],
    // Licitación - Fuente Laravel: ficha-form-licitacion.blade.php líneas 235-376
    cantidad_item_licitacion: '',
    fecha_maxima_entrega_licitacion: '',
    check_entregadas_todas: false,
    check_entregadas_algunas: false,
    cantidad_entregadas_algunas: '',
    // Ficha Técnica
    check_ficha_simple: false,
    check_ficha_doble: false,
  });

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEnsayoToggle = useCallback((ensayoId: string) => {
    setFormData(prev => ({
      ...prev,
      ensayos_selected: prev.ensayos_selected.includes(ensayoId)
        ? prev.ensayos_selected.filter(id => id !== ensayoId)
        : [...prev.ensayos_selected, ensayoId],
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    console.log('Submit special OT:', { type: selectedType, data: formData });
    // TODO: Implement API call
    alert('Funcionalidad en desarrollo. Datos en consola.');
  }, [selectedType, formData]);

  const getTypeTitle = () => {
    switch (selectedType) {
      case 'estudio-bench': return 'Estudio Benchmarking';
      case 'ficha-tecnica': return 'Ficha Tecnica';
      case 'licitacion': return 'Licitacion';
      default: return 'OT Especial';
    }
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
      <Title>Crear OT Especial</Title>

      <InfoCard>
        <InfoText>
          Seleccione el tipo de OT especial que desea crear. Estos tipos tienen campos
          especificos para el analisis de productos de la competencia (Estudio Benchmarking),
          especificaciones tecnicas detalladas (Ficha Tecnica) o procesos de licitacion.
        </InfoText>
      </InfoCard>

      {/* Type Selector */}
      <TypeSelector>
        <TypeCard
          $active={selectedType === 'estudio-bench'}
          onClick={() => setSelectedType('estudio-bench')}
        >
          <TypeIcon>🔬</TypeIcon>
          <TypeTitle>Estudio Benchmarking</TypeTitle>
          <TypeDescription>
            Analisis de productos de la competencia con ensayos de laboratorio
          </TypeDescription>
        </TypeCard>

        <TypeCard
          $active={selectedType === 'ficha-tecnica'}
          onClick={() => setSelectedType('ficha-tecnica')}
        >
          <TypeIcon>📋</TypeIcon>
          <TypeTitle>Ficha Tecnica</TypeTitle>
          <TypeDescription>
            Especificaciones tecnicas detalladas del producto
          </TypeDescription>
        </TypeCard>

        <TypeCard
          $active={selectedType === 'licitacion'}
          onClick={() => setSelectedType('licitacion')}
        >
          <TypeIcon>📝</TypeIcon>
          <TypeTitle>Licitacion</TypeTitle>
          <TypeDescription>
            OTs para procesos de licitacion con requerimientos especiales
          </TypeDescription>
        </TypeCard>
      </TypeSelector>

      {selectedType && (
        <>
          {/* Datos Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Comerciales - {getTypeTitle()}</CardTitle>
            </CardHeader>
            <CardBody>
              <FormGrid>
                <FormGroup>
                  <Label>Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onChange={(e) => handleInputChange('client_id', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {/* TODO: Load clients from API */}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Descripcion *</Label>
                  <Input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    maxLength={40}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Codigo Producto</Label>
                  <Input
                    type="text"
                    value={formData.codigo_producto}
                    onChange={(e) => handleInputChange('codigo_producto', e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Tipo de Solicitud</Label>
                  <Select
                    value={formData.tipo_solicitud}
                    onChange={(e) => handleInputChange('tipo_solicitud', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="1">Desarrollo Completo</option>
                    <option value="4">Cotiza sin CAD</option>
                    <option value="2">Cotiza con CAD</option>
                    <option value="3">Muestra con CAD</option>
                    <option value="5">Arte con Material</option>
                    <option value="6">Otras Solicitudes Desarrollo</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Canal</Label>
                  <Select
                    value={formData.canal_id}
                    onChange={(e) => handleInputChange('canal_id', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {/* TODO: Load canales from API */}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Jerarquia 1</Label>
                  <Select
                    value={formData.hierarchy_id}
                    onChange={(e) => handleInputChange('hierarchy_id', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {/* TODO: Load hierarchies from API */}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Nombre Contacto</Label>
                  <Input
                    type="text"
                    value={formData.nombre_contacto}
                    onChange={(e) => handleInputChange('nombre_contacto', e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email Contacto</Label>
                  <Input
                    type="email"
                    value={formData.email_contacto}
                    onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Telefono Contacto</Label>
                  <Input
                    type="text"
                    value={formData.telefono_contacto}
                    onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                  />
                </FormGroup>
              </FormGrid>
            </CardBody>
          </Card>

          {/* Specific Fields for Estudio Benchmarking */}
          {selectedType === 'estudio-bench' && (
            <Card>
              <CardHeader>
                <CardTitle>Datos de Estudio Benchmarking</CardTitle>
              </CardHeader>
              <CardBody>
                <FormGrid>
                  <FormGroup>
                    <Label>Cantidad de Items</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_estudio_bench}
                      onChange={(e) => handleInputChange('cantidad_estudio_bench', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Fecha Maxima Entrega</Label>
                    <Input
                      type="date"
                      value={formData.fecha_maxima_entrega_estudio}
                      onChange={(e) => handleInputChange('fecha_maxima_entrega_estudio', e.target.value)}
                    />
                  </FormGroup>
                </FormGrid>

                <div style={{ marginTop: '1.5rem' }}>
                  <Label style={{ marginBottom: '0.75rem', display: 'block' }}>Ensayos Caja</Label>
                  <CheckboxGrid>
                    {ensayos.map(ensayo => (
                      <CheckboxGroup key={ensayo.id}>
                        <input
                          type="checkbox"
                          checked={formData.ensayos_selected.includes(ensayo.id)}
                          onChange={() => handleEnsayoToggle(ensayo.id)}
                        />
                        {ensayo.label}
                      </CheckboxGroup>
                    ))}
                  </CheckboxGrid>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Specific Fields for Licitación */}
          {/* Fuente Laravel: ficha-form-licitacion.blade.php líneas 235-376 */}
          {selectedType === 'licitacion' && (
            <Card>
              <CardHeader>
                <CardTitle>Datos de Licitación</CardTitle>
              </CardHeader>
              <CardBody>
                <FormGrid>
                  <FormGroup>
                    <Label>Cantidad Items</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.cantidad_item_licitacion}
                      onChange={(e) => handleInputChange('cantidad_item_licitacion', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Fecha Maxima Entrega</Label>
                    <Input
                      type="date"
                      value={formData.fecha_maxima_entrega_licitacion}
                      onChange={(e) => handleInputChange('fecha_maxima_entrega_licitacion', e.target.value)}
                    />
                  </FormGroup>
                </FormGrid>

                <div style={{ marginTop: '1.5rem' }}>
                  <Label style={{ marginBottom: '0.75rem', display: 'block' }}>Cantidad Muestras Entregadas</Label>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <CheckboxGroup>
                      <input
                        type="checkbox"
                        checked={formData.check_entregadas_todas}
                        onChange={(e) => {
                          handleInputChange('check_entregadas_todas', e.target.checked);
                          if (e.target.checked) {
                            handleInputChange('check_entregadas_algunas', false);
                            handleInputChange('cantidad_entregadas_algunas', '');
                          }
                        }}
                      />
                      Todas
                    </CheckboxGroup>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckboxGroup>
                        <input
                          type="checkbox"
                          checked={formData.check_entregadas_algunas}
                          onChange={(e) => {
                            handleInputChange('check_entregadas_algunas', e.target.checked);
                            if (e.target.checked) {
                              handleInputChange('check_entregadas_todas', false);
                            } else {
                              handleInputChange('cantidad_entregadas_algunas', '');
                            }
                          }}
                        />
                        Algunas
                      </CheckboxGroup>
                      {formData.check_entregadas_algunas && (
                        <Input
                          type="number"
                          min="1"
                          style={{ width: '100px' }}
                          placeholder="Cantidad"
                          value={formData.cantidad_entregadas_algunas}
                          onChange={(e) => handleInputChange('cantidad_entregadas_algunas', e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Specific Fields for Ficha Técnica */}
          {/* Fuente Laravel: ficha-form-ficha-tecnica.blade.php */}
          {selectedType === 'ficha-tecnica' && (
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Ficha Técnica</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <CheckboxGroup>
                    <input
                      type="checkbox"
                      checked={formData.check_ficha_simple}
                      onChange={(e) => {
                        handleInputChange('check_ficha_simple', e.target.checked);
                        if (e.target.checked) {
                          handleInputChange('check_ficha_doble', false);
                        }
                      }}
                    />
                    Ficha Simple
                  </CheckboxGroup>
                  <CheckboxGroup>
                    <input
                      type="checkbox"
                      checked={formData.check_ficha_doble}
                      onChange={(e) => {
                        handleInputChange('check_ficha_doble', e.target.checked);
                        if (e.target.checked) {
                          handleInputChange('check_ficha_simple', false);
                        }
                      }}
                    />
                    Ficha Completa (Doble)
                  </CheckboxGroup>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardBody>
              <Textarea
                value={formData.observacion}
                onChange={(e) => handleInputChange('observacion', e.target.value)}
                placeholder="Ingrese observaciones adicionales..."
              />
            </CardBody>
          </Card>

          <ButtonsRow>
            <Button onClick={() => onNavigate('dashboard')}>Cancelar</Button>
            <Button $variant="success" onClick={handleSubmit}>
              Guardar OT
            </Button>
          </ButtonsRow>
        </>
      )}
    </Container>
  );
}
