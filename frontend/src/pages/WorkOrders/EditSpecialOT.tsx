/**
 * EditSpecialOT Component
 * Formulario para editar OTs de tipo especial:
 * - Estudio Benchmarking: Analisis de productos competencia
 * - Ficha Tecnica: Especificaciones tecnicas de producto
 * - Licitacion: OTs para procesos de licitacion
 */

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { workOrdersApi } from '../../services/api';

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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const OTBadge = styled.span`
  background: ${theme.colors.primary};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const TypeBadge = styled.span<{ $type: string }>`
  background: ${({ $type }) => {
    switch ($type) {
      case 'estudio-bench': return `${theme.colors.info}20`;
      case 'ficha-tecnica': return `${theme.colors.success}20`;
      case 'licitacion': return `${theme.colors.warning}20`;
      default: return `${theme.colors.textSecondary}20`;
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'estudio-bench': return theme.colors.info;
      case 'ficha-tecnica': return theme.colors.success;
      case 'licitacion': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 0.5rem;
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

  &:disabled {
    background: ${theme.colors.bgLight};
    cursor: not-allowed;
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

  &:disabled {
    background: ${theme.colors.bgLight};
    cursor: not-allowed;
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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
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
      case 'danger':
        return `
          background: ${theme.colors.danger};
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: ${theme.colors.textSecondary};
  font-size: 1rem;
`;

const ErrorContainer = styled.div`
  background: ${theme.colors.danger}15;
  border: 1px solid ${theme.colors.danger}30;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  color: ${theme.colors.danger};
`;

const SuccessMessage = styled.div`
  background: ${theme.colors.success}15;
  border: 1px solid ${theme.colors.success}30;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: ${theme.colors.success};
  text-align: center;
`;

// Types
type SpecialOTType = 'estudio-bench' | 'ficha-tecnica' | 'licitacion';

interface EditSpecialOTProps {
  otId: number;
  onNavigate: (page: string, id?: number) => void;
}

interface FormData {
  client_id: string;
  client_name: string;
  descripcion: string;
  codigo_producto: string;
  tipo_solicitud: string;
  canal_id: string;
  hierarchy_id: string;
  subhierarchy_id: string;
  subsubhierarchy_id: string;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string;
  observacion: string;
  // Estudio Benchmarking
  cantidad_estudio_bench: string;
  fecha_maxima_entrega_estudio: string;
  ensayos_selected: string[];
}

// Ensayos checkboxes for Estudio Benchmarking
const ensayos = [
  { id: 'bct', label: 'BCT (lbf)', field: 'ensayo_bct' },
  { id: 'ect', label: 'ECT (lb/in)', field: 'ensayo_ect' },
  { id: 'bct_humedo', label: 'BCT en Humedo (lbf)', field: 'ensayo_bct_humedo' },
  { id: 'flat', label: 'Flat Crush (lb/in)', field: 'ensayo_flat' },
  { id: 'humedad', label: 'Humedad (%)', field: 'ensayo_humedad' },
  { id: 'porosidad_ext', label: 'Porosidad Exterior Gurley', field: 'ensayo_porosidad_ext' },
  { id: 'espesor', label: 'Espesor (mm)', field: 'ensayo_espesor' },
  { id: 'cera', label: 'Cera', field: 'ensayo_cera' },
  { id: 'porosidad_int', label: 'Porosidad Interior Gurley', field: 'ensayo_porosidad_int' },
  { id: 'flexion_fondo', label: 'Flexion de Fondo', field: 'ensayo_flexion_fondo' },
  { id: 'gramaje', label: 'Gramaje (gr/mt2)', field: 'ensayo_gramaje' },
  { id: 'composicion_papeles', label: 'Composicion Papeles', field: 'ensayo_composicion_papeles' },
  { id: 'cobb_interno', label: 'Cobb Interno', field: 'ensayo_cobb_interno' },
  { id: 'cobb_externo', label: 'Cobb Externo', field: 'ensayo_cobb_externo' },
  { id: 'flexion_4_puntos', label: 'Flexion 4 Puntos', field: 'ensayo_flexion_4_puntos' },
  { id: 'medidas', label: 'Medidas', field: 'ensayo_medidas' },
  { id: 'impresion', label: 'Impresion', field: 'ensayo_impresion' },
];

export default function EditSpecialOT({ otId, onNavigate }: EditSpecialOTProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otType, setOtType] = useState<SpecialOTType | null>(null);
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    client_name: '',
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
    cantidad_estudio_bench: '',
    fecha_maxima_entrega_estudio: '',
    ensayos_selected: [],
  });

  // Cargar datos de la OT al montar
  useEffect(() => {
    const loadOT = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await workOrdersApi.get(otId);

        // Determinar tipo de OT
        const tipoSolicitud = data.tipo_solicitud as number;
        let type: SpecialOTType | null = null;

        // tipo_solicitud 7 = Estudio Benchmarking, 8 = Ficha Tecnica, 9 = Licitacion
        // (estos valores pueden variar segun la BD)
        if (tipoSolicitud === 7 || data.is_estudio_bench) {
          type = 'estudio-bench';
        } else if (tipoSolicitud === 8 || data.is_ficha_tecnica) {
          type = 'ficha-tecnica';
        } else if (tipoSolicitud === 9 || data.is_licitacion) {
          type = 'licitacion';
        }

        setOtType(type);

        // Cargar ensayos seleccionados
        const selectedEnsayos: string[] = [];
        ensayos.forEach(ensayo => {
          if (data[ensayo.field] === 1 || data[ensayo.field] === true) {
            selectedEnsayos.push(ensayo.id);
          }
        });

        setFormData({
          client_id: String(data.client_id || ''),
          client_name: String(data.client_name || ''),
          descripcion: String(data.descripcion || ''),
          codigo_producto: String(data.codigo_producto || ''),
          tipo_solicitud: String(data.tipo_solicitud || ''),
          canal_id: String(data.canal_id || ''),
          hierarchy_id: String(data.hierarchy_id || ''),
          subhierarchy_id: String(data.subhierarchy_id || ''),
          subsubhierarchy_id: String(data.subsubhierarchy_id || ''),
          nombre_contacto: String(data.nombre_contacto || ''),
          email_contacto: String(data.email_contacto || ''),
          telefono_contacto: String(data.telefono_contacto || ''),
          observacion: String(data.observacion || ''),
          cantidad_estudio_bench: String(data.cantidad_estudio_bench || data.cantidad || ''),
          fecha_maxima_entrega_estudio: String(data.fecha_maxima_entrega || ''),
          ensayos_selected: selectedEnsayos,
        });
      } catch (err) {
        console.error('Error loading OT:', err);
        setError('Error al cargar los datos de la OT');
      } finally {
        setLoading(false);
      }
    };

    loadOT();
  }, [otId]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(null);
  }, []);

  const handleEnsayoToggle = useCallback((ensayoId: string) => {
    setFormData(prev => ({
      ...prev,
      ensayos_selected: prev.ensayos_selected.includes(ensayoId)
        ? prev.ensayos_selected.filter(id => id !== ensayoId)
        : [...prev.ensayos_selected, ensayoId],
    }));
    setSuccess(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Preparar datos para actualizar
      const updateData: Record<string, unknown> = {
        descripcion: formData.descripcion,
        codigo_producto: formData.codigo_producto || null,
        nombre_contacto: formData.nombre_contacto || null,
        email_contacto: formData.email_contacto || null,
        telefono_contacto: formData.telefono_contacto || null,
        observacion: formData.observacion || null,
      };

      // Agregar campos especificos de Estudio Benchmarking
      if (otType === 'estudio-bench') {
        updateData.cantidad = formData.cantidad_estudio_bench ? parseInt(formData.cantidad_estudio_bench) : null;
        updateData.fecha_maxima_entrega = formData.fecha_maxima_entrega_estudio || null;

        // Agregar ensayos
        ensayos.forEach(ensayo => {
          updateData[ensayo.field] = formData.ensayos_selected.includes(ensayo.id) ? 1 : 0;
        });
      }

      await workOrdersApi.update(otId, updateData);
      setSuccess('OT actualizada correctamente');

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error updating OT:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  }, [otId, otType, formData]);

  const getTypeTitle = () => {
    switch (otType) {
      case 'estudio-bench': return 'Estudio Benchmarking';
      case 'ficha-tecnica': return 'Ficha Tecnica';
      case 'licitacion': return 'Licitacion';
      default: return 'OT Especial';
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingContainer>Cargando datos de la OT...</LoadingContainer>
      </Container>
    );
  }

  if (error && !formData.client_id) {
    return (
      <Container>
        <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
        <ErrorContainer>
          <p>{error}</p>
          <Button
            $variant="primary"
            onClick={() => onNavigate('dashboard')}
            style={{ marginTop: '1rem' }}
          >
            Volver al Dashboard
          </Button>
        </ErrorContainer>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink onClick={() => onNavigate('work-order-detail', otId)}>← Volver al Detalle</BackLink>

      <Header>
        <div>
          <Title>
            Editar OT
            <OTBadge style={{ marginLeft: '0.75rem' }}>#{otId}</OTBadge>
            {otType && <TypeBadge $type={otType}>{getTypeTitle()}</TypeBadge>}
          </Title>
        </div>
      </Header>

      {success && <SuccessMessage>{success}</SuccessMessage>}
      {error && (
        <ErrorContainer style={{ marginBottom: '1rem' }}>
          {error}
        </ErrorContainer>
      )}

      {/* Datos Comerciales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Comerciales</CardTitle>
        </CardHeader>
        <CardBody>
          <FormGrid>
            <FormGroup>
              <Label>Cliente</Label>
              <Input
                type="text"
                value={formData.client_name}
                disabled
                style={{ background: theme.colors.bgLight }}
              />
            </FormGroup>

            <FormGroup>
              <Label>Descripcion *</Label>
              <Input
                type="text"
                value={formData.descripcion}
                onChange={(e) => handleInputChange('descripcion', e.target.value)}
                maxLength={40}
                disabled={saving}
              />
            </FormGroup>

            <FormGroup>
              <Label>Codigo Producto</Label>
              <Input
                type="text"
                value={formData.codigo_producto}
                onChange={(e) => handleInputChange('codigo_producto', e.target.value)}
                disabled={saving}
              />
            </FormGroup>

            <FormGroup>
              <Label>Tipo de Solicitud</Label>
              <Select
                value={formData.tipo_solicitud}
                disabled
              >
                <option value="">Seleccione...</option>
                <option value="1">Desarrollo Completo</option>
                <option value="4">Cotiza sin CAD</option>
                <option value="2">Cotiza con CAD</option>
                <option value="3">Muestra con CAD</option>
                <option value="5">Arte con Material</option>
                <option value="6">Otras Solicitudes Desarrollo</option>
                <option value="7">Estudio Benchmarking</option>
                <option value="8">Ficha Tecnica</option>
                <option value="9">Licitacion</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Nombre Contacto</Label>
              <Input
                type="text"
                value={formData.nombre_contacto}
                onChange={(e) => handleInputChange('nombre_contacto', e.target.value)}
                disabled={saving}
              />
            </FormGroup>

            <FormGroup>
              <Label>Email Contacto</Label>
              <Input
                type="email"
                value={formData.email_contacto}
                onChange={(e) => handleInputChange('email_contacto', e.target.value)}
                disabled={saving}
              />
            </FormGroup>

            <FormGroup>
              <Label>Telefono Contacto</Label>
              <Input
                type="text"
                value={formData.telefono_contacto}
                onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
                disabled={saving}
              />
            </FormGroup>
          </FormGrid>
        </CardBody>
      </Card>

      {/* Specific Fields for Estudio Benchmarking */}
      {otType === 'estudio-bench' && (
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
                  disabled={saving}
                />
              </FormGroup>

              <FormGroup>
                <Label>Fecha Maxima Entrega</Label>
                <Input
                  type="date"
                  value={formData.fecha_maxima_entrega_estudio}
                  onChange={(e) => handleInputChange('fecha_maxima_entrega_estudio', e.target.value)}
                  disabled={saving}
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
                      disabled={saving}
                    />
                    {ensayo.label}
                  </CheckboxGroup>
                ))}
              </CheckboxGrid>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Specific Fields for Ficha Tecnica */}
      {otType === 'ficha-tecnica' && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de Ficha Tecnica</CardTitle>
          </CardHeader>
          <CardBody>
            <FormGrid>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cantidad_estudio_bench}
                  onChange={(e) => handleInputChange('cantidad_estudio_bench', e.target.value)}
                  disabled={saving}
                />
              </FormGroup>

              <FormGroup>
                <Label>Fecha Maxima Entrega</Label>
                <Input
                  type="date"
                  value={formData.fecha_maxima_entrega_estudio}
                  onChange={(e) => handleInputChange('fecha_maxima_entrega_estudio', e.target.value)}
                  disabled={saving}
                />
              </FormGroup>
            </FormGrid>
          </CardBody>
        </Card>
      )}

      {/* Specific Fields for Licitacion */}
      {otType === 'licitacion' && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de Licitacion</CardTitle>
          </CardHeader>
          <CardBody>
            <FormGrid>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.cantidad_estudio_bench}
                  onChange={(e) => handleInputChange('cantidad_estudio_bench', e.target.value)}
                  disabled={saving}
                />
              </FormGroup>

              <FormGroup>
                <Label>Fecha Maxima Entrega</Label>
                <Input
                  type="date"
                  value={formData.fecha_maxima_entrega_estudio}
                  onChange={(e) => handleInputChange('fecha_maxima_entrega_estudio', e.target.value)}
                  disabled={saving}
                />
              </FormGroup>
            </FormGrid>
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
            disabled={saving}
          />
        </CardBody>
      </Card>

      <ButtonsRow>
        <Button onClick={() => onNavigate('work-order-detail', otId)} disabled={saving}>
          Cancelar
        </Button>
        <Button $variant="success" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </ButtonsRow>
    </Container>
  );
}
