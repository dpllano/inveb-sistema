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
  // Fuente Laravel: muestras-ot.blade.php líneas 644-704
  contactos_cliente_1: number | null;
  destinatario_1: string;
  comuna_1: number | null;
  direccion_1: string;
  cantidad_1: number | null;
  comentario_1: string;
  check_fecha_corte_1: boolean;  // Solo roles 13, 14
  fecha_corte_1: string;
  sala_corte_1: number | null;  // Solo roles 5, 6, 13, 14
  contactos_cliente_2: number | null;
  destinatario_2: string;
  comuna_2: number | null;
  direccion_2: string;
  cantidad_2: number | null;
  comentario_2: string;
  check_fecha_corte_2: boolean;
  fecha_corte_2: string;
  sala_corte_2: number | null;
  contactos_cliente_3: number | null;
  destinatario_3: string;
  comuna_3: number | null;
  direccion_3: string;
  cantidad_3: number | null;
  comentario_3: string;
  check_fecha_corte_3: boolean;
  fecha_corte_3: string;
  sala_corte_3: number | null;
  contactos_cliente_4: number | null;
  destinatario_4: string;
  comuna_4: number | null;
  direccion_4: string;
  cantidad_4: number | null;
  comentario_4: string;
  check_fecha_corte_4: boolean;
  fecha_corte_4: string;
  sala_corte_4: number | null;
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
  contactosCliente?: Array<{ id: string | number; nombre?: string; comuna_id?: number; direccion?: string }>; // Contactos de la instalación seleccionada
  salasCortes?: Array<{ id: string | number; nombre?: string }>; // Plantas de corte para muestras
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
  contactos_cliente_1: null,
  destinatario_1: '',
  comuna_1: null,
  direccion_1: '',
  cantidad_1: null,
  comentario_1: '',
  check_fecha_corte_1: false,
  fecha_corte_1: '',
  sala_corte_1: null,
  contactos_cliente_2: null,
  destinatario_2: '',
  comuna_2: null,
  direccion_2: '',
  cantidad_2: null,
  comentario_2: '',
  check_fecha_corte_2: false,
  fecha_corte_2: '',
  sala_corte_2: null,
  contactos_cliente_3: null,
  destinatario_3: '',
  comuna_3: null,
  direccion_3: '',
  cantidad_3: null,
  comentario_3: '',
  check_fecha_corte_3: false,
  fecha_corte_3: '',
  sala_corte_3: null,
  contactos_cliente_4: null,
  destinatario_4: '',
  comuna_4: null,
  direccion_4: '',
  cantidad_4: null,
  comentario_4: '',
  check_fecha_corte_4: false,
  fecha_corte_4: '',
  sala_corte_4: null,
};

// Opciones de destino para OT Normal (incluye Envío Cliente VB)
const DESTINATARIOS_OPTIONS_NORMAL = [
  { id: '1', nombre: 'Retira Ventas VB' },
  { id: '2', nombre: 'Retira Diseñador VB' },
  { id: '3', nombre: 'Envío Laboratorio' },
  { id: '4', nombre: 'Envío Cliente VB' },
  { id: '5', nombre: 'Retira Diseñador Revisión' },
];

// Opciones de destino para Licitaciones (tipo_solicitud=6) - SIN Envío Cliente VB
// Fuente Laravel: muestras-ot-licitaciones.blade.php línea 501
const DESTINATARIOS_OPTIONS_LICITACION = [
  { id: '1', nombre: 'Retira Ventas VB' },
  { id: '2', nombre: 'Retira Diseñador VB' },
  { id: '3', nombre: 'Envío Laboratorio' },
  { id: '5', nombre: 'Retira Diseñador Revisión' },
];

// Roles que pueden ver la sección de destinos
// Fuente Laravel: muestras-ot.blade.php líneas 500-503
// JefeVenta=3, Vendedor=4, JefeDesarrollo=5, Ingeniero=6, VendedorExterno=19
const ROLES_PUEDEN_VER_DESTINOS = [3, 4, 5, 6, 19];

// Roles que pueden ver campo "Fecha de Corte" (checkbox + datepicker)
// Fuente Laravel: muestras-ot.blade.php línea 674
// JefeMuestras=13, TecnicoMuestras=14
const ROLES_FECHA_CORTE = [13, 14];

// Roles que pueden ver campo "Planta de Corte" (select)
// Fuente Laravel: muestras-ot.blade.php líneas 689-692
// JefeDesarrollo=5, Ingeniero=6, JefeMuestras=13, TecnicoMuestras=14
const ROLES_PLANTA_CORTE = [5, 6, 13, 14];

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

// Checkbox list para selección múltiple de destinos (más intuitivo que select multiple)
const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  background: #fafafa;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f0f0f0;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: 0.875rem;
    color: ${theme.colors.textPrimary};
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
const VENDEDOR_ROLES = [4, 19]; // Vendedor y Vendedor Externo

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
  contactosCliente = [],
  salasCortes = [],
  roleId,
}: MuestraModalProps) {
  // DEBUG: Verificar props recibidas
  console.log('MuestraModal props: cads=' + cads.length + ', cartones=' + cartones.length + ', cartonesMuestra=' + cartonesMuestra.length + ', comunas=' + comunas.length + ', contactosCliente=' + contactosCliente.length + ', salasCortes=' + salasCortes.length + ', roleId=' + roleId);

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

  // Determinar si puede ver la sección de destinos según el rol
  // Fuente Laravel: muestras-ot.blade.php líneas 500-503
  const puedeVerDestinos = useMemo(() => {
    return roleId ? ROLES_PUEDEN_VER_DESTINOS.includes(roleId) : true;
  }, [roleId]);

  // Determinar si puede ver campo "Fecha de Corte" según el rol
  // Fuente Laravel: muestras-ot.blade.php línea 674
  const puedeVerFechaCorte = useMemo(() => {
    return roleId ? ROLES_FECHA_CORTE.includes(roleId) : false;
  }, [roleId]);

  // Determinar si puede ver campo "Planta de Corte" según el rol
  // Fuente Laravel: muestras-ot.blade.php líneas 689-692
  const puedeVerPlantaCorte = useMemo(() => {
    return roleId ? ROLES_PLANTA_CORTE.includes(roleId) : false;
  }, [roleId]);

  // Seleccionar opciones de destino según tipo de solicitud
  // Fuente Laravel: muestras-ot.blade.php vs muestras-ot-licitaciones.blade.php
  // Licitaciones (tipo_solicitud=6) no tienen "Envío Cliente VB"
  const destinatariosOptions = useMemo(() => {
    return tipoSolicitud === 6 ? DESTINATARIOS_OPTIONS_LICITACION : DESTINATARIOS_OPTIONS_NORMAL;
  }, [tipoSolicitud]);

  // Verificar qué destinatarios están seleccionados
  const destinatariosSeleccionados = useMemo(() => ({
    vendedor: formData.destinatarios_id.includes('1'),
    disenador: formData.destinatarios_id.includes('2'),
    laboratorio: formData.destinatarios_id.includes('3'),
    clientes: formData.destinatarios_id.includes('4'),
    disenadorRevision: formData.destinatarios_id.includes('5'),
  }), [formData.destinatarios_id]);

  const handleInputChange = useCallback((field: keyof MuestraFormData, value: string | number | null | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handler para toggle de checkbox individual (más intuitivo que select multiple)
  const handleDestinatarioToggle = useCallback((id: string) => {
    setFormData(prev => {
      const currentIds = prev.destinatarios_id;
      if (currentIds.includes(id)) {
        // Quitar si ya está seleccionado
        return { ...prev, destinatarios_id: currentIds.filter(d => d !== id) };
      } else {
        // Agregar si no está seleccionado
        return { ...prev, destinatarios_id: [...currentIds, id] };
      }
    });
  }, []);

  // Handler para autocompletar campos cuando se selecciona un contacto
  // Fuente Laravel: ot-muestras.js líneas 57-76 - getDatosContactoInstalacion
  const handleContactoChange = useCallback((contactoIndex: 1 | 2 | 3 | 4, contactoId: number | null) => {
    const contactoField = `contactos_cliente_${contactoIndex}` as keyof MuestraFormData;
    const destinatarioField = `destinatario_${contactoIndex}` as keyof MuestraFormData;
    const comunaField = `comuna_${contactoIndex}` as keyof MuestraFormData;
    const direccionField = `direccion_${contactoIndex}` as keyof MuestraFormData;

    if (!contactoId) {
      // Si se deselecciona, limpiar campos
      setFormData(prev => ({
        ...prev,
        [contactoField]: null,
        [destinatarioField]: '',
        [comunaField]: null,
        [direccionField]: '',
      }));
      return;
    }

    // Buscar el contacto en la lista
    const contacto = contactosCliente.find(c => Number(c.id) === contactoId);
    if (contacto) {
      // Autocompletar campos según Laravel: nombre_contacto → Destinatario, comuna_contacto → Comuna, direccion_contacto → Dirección
      setFormData(prev => ({
        ...prev,
        [contactoField]: contactoId,
        [destinatarioField]: contacto.nombre || '',
        [comunaField]: contacto.comuna_id || null,
        [direccionField]: contacto.direccion || '',
      }));
    } else {
      // Si no se encuentra, solo guardar el ID
      setFormData(prev => ({
        ...prev,
        [contactoField]: contactoId,
      }));
    }
  }, [contactosCliente]);

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

      {/* Destinos - Solo visible para ciertos roles según Laravel líneas 500-503 */}
      {puedeVerDestinos && (
      <FormCard>
        <CardHeader>
          <CardTitle>Destinos</CardTitle>
        </CardHeader>
        <CardBody>
          <FormGrid $columns={1}>
            <FormGroup>
              <Label>Enviar Muestras a (puede seleccionar múltiples)</Label>
              {/* Checkboxes en lugar de MultiSelect para mejor UX */}
              <CheckboxList>
                {destinatariosOptions.map(opt => (
                  <CheckboxItem key={opt.id}>
                    <input
                      type="checkbox"
                      checked={formData.destinatarios_id.includes(opt.id)}
                      onChange={() => handleDestinatarioToggle(opt.id)}
                    />
                    <span>{opt.nombre}</span>
                  </CheckboxItem>
                ))}
              </CheckboxList>
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
          {/* Fuente Laravel: muestras-ot.blade.php líneas 641-704 */}
          <DestinoSection $visible={destinatariosSeleccionados.clientes}>
            <DestinoTitle>Envío Cliente VB</DestinoTitle>

            {/* Contactos Cliente 1 - Fuente Laravel línea 646 */}
            <FormGrid $columns={1} style={{ marginBottom: '0.5rem' }}>
              <FormGroup>
                <Label>Contactos Cliente</Label>
                <Select
                  value={formData.contactos_cliente_1 || ''}
                  onChange={(e) => handleContactoChange(1, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {contactosCliente.map(contacto => (
                    <option key={String(contacto.id)} value={contacto.id}>{contacto.nombre || contacto.id}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 1 - 6 campos según Laravel */}
            <FormGrid $columns={6} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 1</Label>
                <Input
                  type="text"
                  value={formData.destinatario_1}
                  onChange={(e) => handleInputChange('destinatario_1', e.target.value)}
                />
              </FormGroup>
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
              {/* Fecha de Corte - Solo roles 13, 14 */}
              {puedeVerFechaCorte && (
                <FormGroup>
                  <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.check_fecha_corte_1}
                      onChange={(e) => handleInputChange('check_fecha_corte_1', e.target.checked)}
                    />
                    Fecha de Corte
                  </Label>
                  {formData.check_fecha_corte_1 && (
                    <Input
                      type="date"
                      value={formData.fecha_corte_1}
                      onChange={(e) => handleInputChange('fecha_corte_1', e.target.value)}
                    />
                  )}
                </FormGroup>
              )}
              {/* Planta de Corte - Solo roles 5, 6, 13, 14 */}
              {puedeVerPlantaCorte && (
                <FormGroup>
                  <Label>Planta de Corte</Label>
                  <Select
                    value={formData.sala_corte_1 || ''}
                    onChange={(e) => handleInputChange('sala_corte_1', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {salasCortes.map(sala => (
                      <option key={String(sala.id)} value={sala.id}>{sala.nombre || sala.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
            </FormGrid>

            {/* Contactos Cliente 2 */}
            <hr style={{ margin: '1rem 0', borderColor: '#e0e0e0' }} />
            <FormGrid $columns={1} style={{ marginBottom: '0.5rem' }}>
              <FormGroup>
                <Label>Contactos Cliente</Label>
                <Select
                  value={formData.contactos_cliente_2 || ''}
                  onChange={(e) => handleContactoChange(2, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {contactosCliente.map(contacto => (
                    <option key={String(contacto.id)} value={contacto.id}>{contacto.nombre || contacto.id}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 2 */}
            <FormGrid $columns={6} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 2</Label>
                <Input
                  type="text"
                  value={formData.destinatario_2}
                  onChange={(e) => handleInputChange('destinatario_2', e.target.value)}
                />
              </FormGroup>
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
              {/* Fecha de Corte 2 - Solo roles 13, 14 */}
              {puedeVerFechaCorte && (
                <FormGroup>
                  <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.check_fecha_corte_2}
                      onChange={(e) => handleInputChange('check_fecha_corte_2', e.target.checked)}
                    />
                    Fecha de Corte
                  </Label>
                  {formData.check_fecha_corte_2 && (
                    <Input
                      type="date"
                      value={formData.fecha_corte_2}
                      onChange={(e) => handleInputChange('fecha_corte_2', e.target.value)}
                    />
                  )}
                </FormGroup>
              )}
              {/* Planta de Corte 2 - Solo roles 5, 6, 13, 14 */}
              {puedeVerPlantaCorte && (
                <FormGroup>
                  <Label>Planta de Corte</Label>
                  <Select
                    value={formData.sala_corte_2 || ''}
                    onChange={(e) => handleInputChange('sala_corte_2', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {salasCortes.map(sala => (
                      <option key={String(sala.id)} value={sala.id}>{sala.nombre || sala.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
            </FormGrid>

            {/* Contactos Cliente 3 */}
            <hr style={{ margin: '1rem 0', borderColor: '#e0e0e0' }} />
            <FormGrid $columns={1} style={{ marginBottom: '0.5rem' }}>
              <FormGroup>
                <Label>Contactos Cliente</Label>
                <Select
                  value={formData.contactos_cliente_3 || ''}
                  onChange={(e) => handleContactoChange(3, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {contactosCliente.map(contacto => (
                    <option key={String(contacto.id)} value={contacto.id}>{contacto.nombre || contacto.id}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 3 */}
            <FormGrid $columns={6} style={{ marginBottom: '1rem' }}>
              <FormGroup>
                <Label>Destinatario 3</Label>
                <Input
                  type="text"
                  value={formData.destinatario_3}
                  onChange={(e) => handleInputChange('destinatario_3', e.target.value)}
                />
              </FormGroup>
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
              {/* Fecha de Corte 3 - Solo roles 13, 14 */}
              {puedeVerFechaCorte && (
                <FormGroup>
                  <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.check_fecha_corte_3}
                      onChange={(e) => handleInputChange('check_fecha_corte_3', e.target.checked)}
                    />
                    Fecha de Corte
                  </Label>
                  {formData.check_fecha_corte_3 && (
                    <Input
                      type="date"
                      value={formData.fecha_corte_3}
                      onChange={(e) => handleInputChange('fecha_corte_3', e.target.value)}
                    />
                  )}
                </FormGroup>
              )}
              {/* Planta de Corte 3 - Solo roles 5, 6, 13, 14 */}
              {puedeVerPlantaCorte && (
                <FormGroup>
                  <Label>Planta de Corte</Label>
                  <Select
                    value={formData.sala_corte_3 || ''}
                    onChange={(e) => handleInputChange('sala_corte_3', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {salasCortes.map(sala => (
                      <option key={String(sala.id)} value={sala.id}>{sala.nombre || sala.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
            </FormGrid>

            {/* Contactos Cliente 4 */}
            <hr style={{ margin: '1rem 0', borderColor: '#e0e0e0' }} />
            <FormGrid $columns={1} style={{ marginBottom: '0.5rem' }}>
              <FormGroup>
                <Label>Contactos Cliente</Label>
                <Select
                  value={formData.contactos_cliente_4 || ''}
                  onChange={(e) => handleContactoChange(4, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar...</option>
                  {contactosCliente.map(contacto => (
                    <option key={String(contacto.id)} value={contacto.id}>{contacto.nombre || contacto.id}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>

            {/* Destinatario 4 */}
            <FormGrid $columns={6}>
              <FormGroup>
                <Label>Destinatario 4</Label>
                <Input
                  type="text"
                  value={formData.destinatario_4}
                  onChange={(e) => handleInputChange('destinatario_4', e.target.value)}
                />
              </FormGroup>
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
              {/* Fecha de Corte 4 - Solo roles 13, 14 */}
              {puedeVerFechaCorte && (
                <FormGroup>
                  <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.check_fecha_corte_4}
                      onChange={(e) => handleInputChange('check_fecha_corte_4', e.target.checked)}
                    />
                    Fecha de Corte
                  </Label>
                  {formData.check_fecha_corte_4 && (
                    <Input
                      type="date"
                      value={formData.fecha_corte_4}
                      onChange={(e) => handleInputChange('fecha_corte_4', e.target.value)}
                    />
                  )}
                </FormGroup>
              )}
              {/* Planta de Corte 4 - Solo roles 5, 6, 13, 14 */}
              {puedeVerPlantaCorte && (
                <FormGroup>
                  <Label>Planta de Corte</Label>
                  <Select
                    value={formData.sala_corte_4 || ''}
                    onChange={(e) => handleInputChange('sala_corte_4', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar...</option>
                    {salasCortes.map(sala => (
                      <option key={String(sala.id)} value={sala.id}>{sala.nombre || sala.id}</option>
                    ))}
                  </Select>
                </FormGroup>
              )}
            </FormGrid>
          </DestinoSection>
        </CardBody>
      </FormCard>
      )}

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
