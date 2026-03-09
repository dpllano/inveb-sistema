/**
 * MuestraModal Component
 * Modal para crear una muestra asociada a una OT
 * Basado en muestras-ot.blade.php y ot-muestras.js de Laravel
 */

import { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Modal } from '../common';
import { theme } from '../../theme';

interface MuestraFormData {
  cad_id: number | null;
  carton_id: number | null;
  pegado_id: number | null;
  tiempo_unitario: string;
  carton_muestra_id: number | null;
  destinatarios_id: string[];
  // Datos para Retira Ventas VB
  cantidad_vendedor: number | null;
  comentario_vendedor: string;
  // Datos para Retira Diseñador VB
  cantidad_disenador: number | null;
  comentario_disenador: string;
  // Datos para Diseñador Revisión
  cantidad_disenador_revision: number | null;
  comentario_disenador_revision: string;
  // Datos para Envío Laboratorio
  cantidad_laboratorio: number | null;
  comentario_laboratorio: string;
  // Datos para Envío Cliente VB (hasta 4 destinatarios)
  destinatario_1: string;
  comuna_1: number | null;
  direccion_1: string;
  cantidad_1: number | null;
  comentario_1: string;
  destinatario_2: string;
  comuna_2: number | null;
  direccion_2: string;
  cantidad_2: number | null;
  comentario_2: string;
  destinatario_3: string;
  comuna_3: number | null;
  direccion_3: string;
  cantidad_3: number | null;
  comentario_3: string;
  destinatario_4: string;
  comuna_4: number | null;
  direccion_4: string;
  cantidad_4: number | null;
  comentario_4: string;
}

interface MuestraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MuestraFormData, numeroMuestras: number) => void;
  cadId?: number | null;
  cartonId?: number | null;
  tipoSolicitud?: number | null;
  cads?: Array<{ id: string | number; nombre?: string; codigo?: string }>;
  cartones?: Array<{ id: string | number; nombre?: string; codigo?: string }>;
  cartonesMuestra?: Array<{ id: string | number; nombre?: string; codigo?: string }>;
  comunas?: Array<{ id: string | number; nombre?: string }>;
  roleId?: number; // Issue 12: Para hacer campos readonly para vendedor
}

const INITIAL_FORM_DATA: MuestraFormData = {
  cad_id: null,
  carton_id: null,
  pegado_id: null,
  tiempo_unitario: '',
  carton_muestra_id: null,
  destinatarios_id: [],
  cantidad_vendedor: null,
  comentario_vendedor: 'Retira Vendedor',
  cantidad_disenador: null,
  comentario_disenador: '',
  cantidad_disenador_revision: null,
  comentario_disenador_revision: '',
  cantidad_laboratorio: null,
  comentario_laboratorio: '',
  destinatario_1: '',
  comuna_1: null,
  direccion_1: '',
  cantidad_1: null,
  comentario_1: '',
  destinatario_2: '',
  comuna_2: null,
  direccion_2: '',
  cantidad_2: null,
  comentario_2: '',
  destinatario_3: '',
  comuna_3: null,
  direccion_3: '',
  cantidad_3: null,
  comentario_3: '',
  destinatario_4: '',
  comuna_4: null,
  direccion_4: '',
  cantidad_4: null,
  comentario_4: '',
};

const DESTINATARIOS_OPTIONS = [
  { id: '1', nombre: 'Retira Ventas VB' },
  { id: '2', nombre: 'Retira Diseñador VB' },
  { id: '3', nombre: 'Envío Laboratorio' },
  { id: '4', nombre: 'Envío Cliente VB' },
  { id: '5', nombre: 'Retira Diseñador Revisión' },
];

const PEGADO_OPTIONS = [
  { id: 1, nombre: 'Sin Pegar' },
  { id: 2, nombre: 'Pegado Flexo Interior' },
  { id: 3, nombre: 'Pegado Flexo Exterior' },
  { id: 4, nombre: 'Pegado Diecutter' },
  { id: 5, nombre: 'Pegado Cajas Fruta' },
  { id: 6, nombre: 'Pegado con Cinta' },
  { id: 7, nombre: 'Sin Pegar con Cinta' },
];

const FORMA_ENVIO_OPTIONS = [
  { id: 'Chile Express', nombre: 'Chile Express' },
  { id: 'Auto Correo', nombre: 'Auto Correo' },
  { id: 'Camión', nombre: 'Camión' },
];

// Styled Components
const FormCard = styled.div`
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const FormGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns || 3}, 1fr);
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
  font-size: 0.8rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const MultiSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const DestinoSection = styled.div<{ $visible: boolean }>`
  display: ${props => props.$visible ? 'block' : 'none'};
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  background: #fafafa;
`;

const DestinoTitle = styled.h4`
  text-align: center;
  color: ${theme.colors.primary};
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'primary' ? `
    background: ${theme.colors.primary};
    color: white;
    border: none;

    &:hover {
      background: ${theme.colors.primaryDark};
    }
  ` : `
    background: white;
    color: ${theme.colors.textSecondary};
    border: 1px solid ${theme.colors.border};

    &:hover {
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Roles de vendedor (Issue 12)
const VENDEDOR_ROLES = [4, 17]; // Vendedor y Vendedor Externo

export function MuestraModal({
  isOpen,
  onClose,
  onSave,
  cadId,
  cartonId,
  tipoSolicitud,
  cads = [],
  cartones = [],
  cartonesMuestra = [],
  comunas = [],
  roleId,
}: MuestraModalProps) {
  // DEBUG: Verificar props recibidas
  console.log('MuestraModal props: cads=' + cads.length + ', cartones=' + cartones.length + ', cartonesMuestra=' + cartonesMuestra.length + ', roleId=' + roleId);

  const [formData, setFormData] = useState<MuestraFormData>({
    ...INITIAL_FORM_DATA,
    cad_id: cadId || null,
    carton_id: cartonId || null,
  });

  // Issue 12: Determinar si el usuario es vendedor (campos readonly)
  const esVendedor = useMemo(() => {
    return roleId ? VENDEDOR_ROLES.includes(roleId) : false;
  }, [roleId]);

  // Determinar si el CAD debe estar deshabilitado (para tipo_solicitud 1, 4, 7)
  const cadDisabled = useMemo(() => {
    return tipoSolicitud === 1 || tipoSolicitud === 4 || tipoSolicitud === 7;
  }, [tipoSolicitud]);

  // Verificar qué destinatarios están seleccionados
  const destinatariosSeleccionados = useMemo(() => ({
    vendedor: formData.destinatarios_id.includes('1'),
    disenador: formData.destinatarios_id.includes('2'),
    laboratorio: formData.destinatarios_id.includes('3'),
    clientes: formData.destinatarios_id.includes('4'),
    disenadorRevision: formData.destinatarios_id.includes('5'),
  }), [formData.destinatarios_id]);

  const handleInputChange = useCallback((field: keyof MuestraFormData, value: string | number | null | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDestinatariosChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setFormData(prev => ({ ...prev, destinatarios_id: selectedOptions }));
  }, []);

  const handleSave = useCallback(() => {
    // Calcular número total de muestras
    let numeroMuestras = 0;

    if (destinatariosSeleccionados.vendedor && formData.cantidad_vendedor) {
      numeroMuestras += formData.cantidad_vendedor;
    }
    if (destinatariosSeleccionados.disenador && formData.cantidad_disenador) {
      numeroMuestras += formData.cantidad_disenador;
    }
    if (destinatariosSeleccionados.disenadorRevision && formData.cantidad_disenador_revision) {
      numeroMuestras += formData.cantidad_disenador_revision;
    }
    if (destinatariosSeleccionados.laboratorio && formData.cantidad_laboratorio) {
      numeroMuestras += formData.cantidad_laboratorio;
    }
    if (destinatariosSeleccionados.clientes) {
      numeroMuestras += (formData.cantidad_1 || 0) +
                        (formData.cantidad_2 || 0) +
                        (formData.cantidad_3 || 0) +
                        (formData.cantidad_4 || 0);
    }

    onSave(formData, numeroMuestras);
  }, [formData, destinatariosSeleccionados, onSave]);

  const handleClose = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_DATA,
      cad_id: cadId || null,
      carton_id: cartonId || null,
    });
    onClose();
  }, [cadId, cartonId, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Muestra" size="xl">
      {/* Características de Muestra */}
      <FormCard>
        <CardHeader>
          <CardTitle>Caracteristicas de Muestra</CardTitle>
        </CardHeader>
        <CardBody>
          <FormGrid $columns={3}>
            <FormGroup>
              <Label>CAD</Label>
              <Select
                value={formData.cad_id || ''}
                onChange={(e) => handleInputChange('cad_id', e.target.value ? Number(e.target.value) : null)}
                disabled={cadDisabled || esVendedor}
                style={esVendedor ? { backgroundColor: '#f5f5f5' } : undefined}
              >
                <option value="">Seleccionar...</option>
                {cads.map(cad => (
                  <option key={String(cad.id)} value={cad.id}>{cad.codigo || cad.nombre || cad.id}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Cartón</Label>
              <Select
                value={formData.carton_id || ''}
                onChange={(e) => handleInputChange('carton_id', e.target.value ? Number(e.target.value) : null)}
                disabled={esVendedor}
                style={esVendedor ? { backgroundColor: '#f5f5f5' } : undefined}
              >
                <option value="">Seleccionar...</option>
                {cartones.map(carton => (
                  <option key={String(carton.id)} value={carton.id}>
                    {carton.codigo || carton.nombre || carton.id}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Tipo de Pegado</Label>
              <Select
                value={formData.pegado_id || ''}
                onChange={(e) => handleInputChange('pegado_id', e.target.value ? Number(e.target.value) : null)}
                disabled={esVendedor}
                style={esVendedor ? { backgroundColor: '#f5f5f5' } : undefined}
              >
                <option value="">Seleccionar...</option>
                {PEGADO_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Tiempo Unitario</Label>
              <Input
                type="time"
                value={formData.tiempo_unitario}
                onChange={(e) => handleInputChange('tiempo_unitario', e.target.value)}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>Cartón Muestra</Label>
              <Select
                value={formData.carton_muestra_id || ''}
                onChange={(e) => handleInputChange('carton_muestra_id', e.target.value ? Number(e.target.value) : null)}
                disabled={esVendedor}
                style={esVendedor ? { backgroundColor: '#f5f5f5' } : undefined}
              >
                <option value="">Seleccionar...</option>
                {cartonesMuestra.map(carton => (
                  <option key={String(carton.id)} value={carton.id}>
                    {carton.codigo || carton.nombre || carton.id}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormGrid>
        </CardBody>
      </FormCard>

      {/* Destinos */}
      <FormCard>
        <CardHeader>
          <CardTitle>Destinos</CardTitle>
        </CardHeader>
        <CardBody>
          <FormGrid $columns={1}>
            <FormGroup>
              <Label>Enviar Muestras a</Label>
              <MultiSelect
                multiple
                value={formData.destinatarios_id}
                onChange={handleDestinatariosChange}
              >
                {DESTINATARIOS_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                ))}
              </MultiSelect>
            </FormGroup>
          </FormGrid>

          {/* Datos de Muestra por Destinatario */}
          <h4 style={{ textAlign: 'center', color: '#7f7f7f', marginTop: '1.5rem' }}>Datos de Muestra</h4>

          {/* Retira Ventas VB */}
          <DestinoSection $visible={destinatariosSeleccionados.vendedor}>
            <DestinoTitle>Retira Ventas VB</DestinoTitle>
            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_vendedor || ''}
                  onChange={(e) => handleInputChange('cantidad_vendedor', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Entrega</Label>
                <Input
                  type="text"
                  value={formData.comentario_vendedor}
                  onChange={(e) => handleInputChange('comentario_vendedor', e.target.value)}
                  disabled
                  readOnly
                />
              </FormGroup>
            </FormGrid>
          </DestinoSection>

          {/* Retira Diseñador VB */}
          <DestinoSection $visible={destinatariosSeleccionados.disenador}>
            <DestinoTitle>Retira Diseñador VB</DestinoTitle>
            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_disenador || ''}
                  onChange={(e) => handleInputChange('cantidad_disenador', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Entrega</Label>
                <Input
                  type="text"
                  value={formData.comentario_disenador}
                  onChange={(e) => handleInputChange('comentario_disenador', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
          </DestinoSection>

          {/* Retira Diseñador Revisión */}
          <DestinoSection $visible={destinatariosSeleccionados.disenadorRevision}>
            <DestinoTitle>Retira Diseñador Revisión</DestinoTitle>
            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_disenador_revision || ''}
                  onChange={(e) => handleInputChange('cantidad_disenador_revision', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Entrega</Label>
                <Input
                  type="text"
                  value={formData.comentario_disenador_revision}
                  onChange={(e) => handleInputChange('comentario_disenador_revision', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
          </DestinoSection>

          {/* Envío Laboratorio */}
          <DestinoSection $visible={destinatariosSeleccionados.laboratorio}>
            <DestinoTitle>Envío Laboratorio</DestinoTitle>
            <FormGrid $columns={3}>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_laboratorio || ''}
                  onChange={(e) => handleInputChange('cantidad_laboratorio', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Envío</Label>
                <Input
                  type="text"
                  value={formData.comentario_laboratorio}
                  onChange={(e) => handleInputChange('comentario_laboratorio', e.target.value)}
                />
              </FormGroup>
            </FormGrid>
          </DestinoSection>

          {/* Envío Cliente VB */}
          <DestinoSection $visible={destinatariosSeleccionados.clientes}>
            <DestinoTitle>Envío Cliente VB</DestinoTitle>

            {/* Destinatario 1 */}
            {/* Issue 14: Comuna no se muestra para vendedor (esVendedor) */}
            <FormGrid $columns={esVendedor ? 4 : 5} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 1</Label>
                <Input
                  type="text"
                  value={formData.destinatario_1}
                  onChange={(e) => handleInputChange('destinatario_1', e.target.value)}
                />
              </FormGroup>
              {!esVendedor && (
                <FormGroup>
                  <Label>Comuna</Label>
                  <Select
                    value={formData.comuna_1 || ''}
                    onChange={(e) => handleInputChange('comuna_1', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {comunas.map(comuna => (
                      <option key={String(comuna.id)} value={comuna.id}>{comuna.nombre || comuna.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              <FormGroup>
                <Label>Dirección</Label>
                <Input
                  type="text"
                  value={formData.direccion_1}
                  onChange={(e) => handleInputChange('direccion_1', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_1 || ''}
                  onChange={(e) => handleInputChange('cantidad_1', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Envío</Label>
                <Select
                  value={formData.comentario_1}
                  onChange={(e) => handleInputChange('comentario_1', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {FORMA_ENVIO_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 2 */}
            <FormGrid $columns={esVendedor ? 4 : 5} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 2</Label>
                <Input
                  type="text"
                  value={formData.destinatario_2}
                  onChange={(e) => handleInputChange('destinatario_2', e.target.value)}
                />
              </FormGroup>
              {!esVendedor && (
                <FormGroup>
                  <Label>Comuna</Label>
                  <Select
                    value={formData.comuna_2 || ''}
                    onChange={(e) => handleInputChange('comuna_2', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {comunas.map(comuna => (
                      <option key={String(comuna.id)} value={comuna.id}>{comuna.nombre || comuna.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              <FormGroup>
                <Label>Dirección</Label>
                <Input
                  type="text"
                  value={formData.direccion_2}
                  onChange={(e) => handleInputChange('direccion_2', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_2 || ''}
                  onChange={(e) => handleInputChange('cantidad_2', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Envío</Label>
                <Select
                  value={formData.comentario_2}
                  onChange={(e) => handleInputChange('comentario_2', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {FORMA_ENVIO_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 3 */}
            <FormGrid $columns={esVendedor ? 4 : 5} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 3</Label>
                <Input
                  type="text"
                  value={formData.destinatario_3}
                  onChange={(e) => handleInputChange('destinatario_3', e.target.value)}
                />
              </FormGroup>
              {!esVendedor && (
                <FormGroup>
                  <Label>Comuna</Label>
                  <Select
                    value={formData.comuna_3 || ''}
                    onChange={(e) => handleInputChange('comuna_3', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {comunas.map(comuna => (
                      <option key={String(comuna.id)} value={comuna.id}>{comuna.nombre || comuna.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              <FormGroup>
                <Label>Dirección</Label>
                <Input
                  type="text"
                  value={formData.direccion_3}
                  onChange={(e) => handleInputChange('direccion_3', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_3 || ''}
                  onChange={(e) => handleInputChange('cantidad_3', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Envío</Label>
                <Select
                  value={formData.comentario_3}
                  onChange={(e) => handleInputChange('comentario_3', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {FORMA_ENVIO_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 4 */}
            <FormGrid $columns={esVendedor ? 4 : 5}>
              <FormGroup>
                <Label>Destinatario 4</Label>
                <Input
                  type="text"
                  value={formData.destinatario_4}
                  onChange={(e) => handleInputChange('destinatario_4', e.target.value)}
                />
              </FormGroup>
              {!esVendedor && (
                <FormGroup>
                  <Label>Comuna</Label>
                  <Select
                    value={formData.comuna_4 || ''}
                    onChange={(e) => handleInputChange('comuna_4', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {comunas.map(comuna => (
                      <option key={String(comuna.id)} value={comuna.id}>{comuna.nombre || comuna.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
              <FormGroup>
                <Label>Dirección</Label>
                <Input
                  type="text"
                  value={formData.direccion_4}
                  onChange={(e) => handleInputChange('direccion_4', e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cantidad_4 || ''}
                  onChange={(e) => handleInputChange('cantidad_4', e.target.value ? Number(e.target.value) : null)}
                />
              </FormGroup>
              <FormGroup>
                <Label>Forma de Envío</Label>
                <Select
                  value={formData.comentario_4}
                  onChange={(e) => handleInputChange('comentario_4', e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {FORMA_ENVIO_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>
          </DestinoSection>
        </CardBody>
      </FormCard>

      {/* Botones */}
      <ButtonGroup>
        <Button type="button" onClick={handleClose}>
          Cancelar
        </Button>
        <Button type="button" $variant="primary" onClick={handleSave}>
          Guardar Muestra
        </Button>
      </ButtonGroup>
    </Modal>
  );
}
