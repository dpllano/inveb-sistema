/**
 * ClientForm Component
 * Formulario para crear/editar clientes
 * Actualizado para usar la estructura real de la tabla clients
 */

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import type { ClientDetail, ClientCreate, ClientUpdate, ClasificacionOption, InstallationListItem, InstallationDetail, InstallationCreate, InstallationUpdate } from '../../services/api';
import { installationsApi } from '../../services/api';
import InstallationForm from './InstallationForm';

// Styled Components
const FormCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const FormHeader = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
`;

const FormBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  ${props => props.$fullWidth && `
    grid-column: 1 / -1;
  `}
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const RequiredMark = styled.span`
  color: ${theme.colors.danger};
  margin-left: 0.25rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;

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
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => props.$variant === 'primary' ? `
    background: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
    &:hover:not(:disabled) { background: #002d66; }
  ` : `
    background: white;
    color: ${theme.colors.textSecondary};
    border-color: ${theme.colors.border};
    &:hover:not(:disabled) {
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  color: ${theme.colors.danger};
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const HelpText = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: 0.7rem;
  margin-top: 0.25rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 1.5rem 0 0.75rem 0;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const InstallationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InstallationItem = styled.div`
  padding: 0.75rem;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
  border: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InstallationInfo = styled.div`
  flex: 1;
`;

const InstallationName = styled.div`
  font-weight: 500;
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
`;

const InstallationAddress = styled.div`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

const InstallationActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => props.$variant === 'delete' ? `
    background: transparent;
    color: ${theme.colors.danger};
    border-color: ${theme.colors.danger};
    &:hover { background: ${theme.colors.danger}10; }
  ` : `
    background: transparent;
    color: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    &:hover { background: ${theme.colors.primary}10; }
  `}
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 0.75rem;

  &:hover {
    background: #002d66;
  }
`;

const NoDataText = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  font-style: italic;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
`;

// Types
interface ClientFormProps {
  client: ClientDetail | null;
  clasificaciones: ClasificacionOption[];
  onSubmit: (data: ClientCreate | ClientUpdate) => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormErrors {
  rut?: string;
  nombre_sap?: string;
  email_contacto_1?: string;
}

// RUT validation helper
function validateRut(rut: string): boolean {
  if (!rut) return false;
  const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;

  const dv = cleanRut.slice(-1);
  const numbers = cleanRut.slice(0, -1);

  if (!/^\d+$/.test(numbers)) return false;

  let total = 0;
  let mul = 2;

  for (let i = numbers.length - 1; i >= 0; i--) {
    total += parseInt(numbers[i]) * mul;
    mul = mul < 7 ? mul + 1 : 2;
  }

  const expected = 11 - (total % 11);
  let expectedDv: string;

  if (expected === 11) {
    expectedDv = '0';
  } else if (expected === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = expected.toString();
  }

  return dv === expectedDv;
}

// Format RUT helper
function formatRut(value: string): string {
  let cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length > 9) {
    cleaned = cleaned.slice(0, 9);
  }
  if (cleaned.length > 1) {
    const dv = cleaned.slice(-1);
    const body = cleaned.slice(0, -1);
    // Add dots for thousands
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${dv}`;
  }
  return cleaned;
}

export default function ClientForm({
  client,
  clasificaciones,
  onSubmit,
  onCancel,
  isLoading,
}: ClientFormProps) {
  const isEditing = !!client;

  // Form state - Issue 3: Incluir TODOS los campos de contacto (extraído de Laravel)
  const [formData, setFormData] = useState({
    rut: client?.rut || '',
    nombre_sap: client?.nombre_sap || '',
    codigo: client?.codigo || '',
    // Contacto 1
    nombre_contacto_1: client?.nombre_contacto_1 || '',
    cargo_contacto_1: client?.cargo_contacto_1 || '',
    email_contacto_1: client?.email_contacto_1 || '',
    phone_contacto_1: client?.phone_contacto_1 || '',
    direccion_contacto_1: client?.direccion_contacto_1 || '',
    // Contacto 2
    nombre_contacto_2: client?.nombre_contacto_2 || '',
    cargo_contacto_2: client?.cargo_contacto_2 || '',
    email_contacto_2: client?.email_contacto_2 || '',
    phone_contacto_2: client?.phone_contacto_2 || '',
    direccion_contacto_2: client?.direccion_contacto_2 || '',
    // Contacto 3
    nombre_contacto_3: client?.nombre_contacto_3 || '',
    cargo_contacto_3: client?.cargo_contacto_3 || '',
    email_contacto_3: client?.email_contacto_3 || '',
    phone_contacto_3: client?.phone_contacto_3 || '',
    direccion_contacto_3: client?.direccion_contacto_3 || '',
    clasificacion_id: client?.clasificacion_id || null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Estado para instalaciones del cliente - Issue 4: CRUD completo
  const [instalaciones, setInstalaciones] = useState<InstallationListItem[]>([]);
  const [loadingInstalaciones, setLoadingInstalaciones] = useState(false);
  const [errorInstalaciones, setErrorInstalaciones] = useState<string | null>(null);

  // Estado para modal de instalaciones - Issue 4
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState<InstallationDetail | null>(null);
  const [installationLoading, setInstallationLoading] = useState(false);

  // Update form when client changes - Issue 3: Incluir todos los campos
  useEffect(() => {
    if (client) {
      setFormData({
        rut: client.rut || '',
        nombre_sap: client.nombre_sap || '',
        codigo: client.codigo || '',
        // Contacto 1
        nombre_contacto_1: client.nombre_contacto_1 || '',
        cargo_contacto_1: client.cargo_contacto_1 || '',
        email_contacto_1: client.email_contacto_1 || '',
        phone_contacto_1: client.phone_contacto_1 || '',
        direccion_contacto_1: client.direccion_contacto_1 || '',
        // Contacto 2
        nombre_contacto_2: client.nombre_contacto_2 || '',
        cargo_contacto_2: client.cargo_contacto_2 || '',
        email_contacto_2: client.email_contacto_2 || '',
        phone_contacto_2: client.phone_contacto_2 || '',
        direccion_contacto_2: client.direccion_contacto_2 || '',
        // Contacto 3
        nombre_contacto_3: client.nombre_contacto_3 || '',
        cargo_contacto_3: client.cargo_contacto_3 || '',
        email_contacto_3: client.email_contacto_3 || '',
        phone_contacto_3: client.phone_contacto_3 || '',
        direccion_contacto_3: client.direccion_contacto_3 || '',
        clasificacion_id: client.clasificacion_id || null,
      });
    }
  }, [client]);

  // Cargar instalaciones cuando el cliente existe (modo edicion) - Issue 4: Usando installationsApi
  const loadInstalaciones = useCallback(async () => {
    if (!client?.id) {
      setInstalaciones([]);
      setErrorInstalaciones(null);
      return;
    }

    console.log('[ClientForm] Cargando instalaciones para cliente ID:', client.id);
    setLoadingInstalaciones(true);
    setErrorInstalaciones(null);

    try {
      const data = await installationsApi.getByClient(client.id);
      console.log('[ClientForm] Instalaciones recibidas:', data);
      setInstalaciones(data || []);
    } catch (err: unknown) {
      console.error('[ClientForm] Error cargando instalaciones:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar instalaciones';
      setErrorInstalaciones(errorMessage);
      setInstalaciones([]);
    } finally {
      setLoadingInstalaciones(false);
    }
  }, [client?.id]);

  useEffect(() => {
    loadInstalaciones();
  }, [loadInstalaciones]);

  // Issue 4: Funciones CRUD de instalaciones
  const handleAddInstallation = useCallback(() => {
    setEditingInstallation(null);
    setShowInstallationModal(true);
  }, []);

  const handleEditInstallation = useCallback(async (installationId: number) => {
    setInstallationLoading(true);
    try {
      const detail = await installationsApi.get(installationId);
      setEditingInstallation(detail);
      setShowInstallationModal(true);
    } catch (err) {
      console.error('[ClientForm] Error cargando instalación:', err);
      alert('Error al cargar la instalación');
    } finally {
      setInstallationLoading(false);
    }
  }, []);

  const handleInstallationSubmit = useCallback(async (data: InstallationCreate | InstallationUpdate, isNew: boolean) => {
    if (!client?.id) return;

    setInstallationLoading(true);
    try {
      if (isNew) {
        await installationsApi.create(data as InstallationCreate);
      } else if (editingInstallation) {
        await installationsApi.update(editingInstallation.id, data as InstallationUpdate);
      }
      setShowInstallationModal(false);
      setEditingInstallation(null);
      await loadInstalaciones(); // Recargar lista
    } catch (err) {
      console.error('[ClientForm] Error guardando instalación:', err);
      alert('Error al guardar la instalación');
    } finally {
      setInstallationLoading(false);
    }
  }, [client?.id, editingInstallation, loadInstalaciones]);

  const handleDeleteInstallation = useCallback(async (installationId: number) => {
    setInstallationLoading(true);
    try {
      await installationsApi.delete(installationId);
      setShowInstallationModal(false);
      setEditingInstallation(null);
      await loadInstalaciones(); // Recargar lista
    } catch (err) {
      console.error('[ClientForm] Error eliminando instalación:', err);
      alert('Error al eliminar la instalación');
    } finally {
      setInstallationLoading(false);
    }
  }, [loadInstalaciones]);

  const handleCloseInstallationModal = useCallback(() => {
    setShowInstallationModal(false);
    setEditingInstallation(null);
  }, []);

  // Validate field
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'rut':
        if (!value) return 'RUT es requerido';
        if (!validateRut(value)) return 'RUT invalido';
        return undefined;
      case 'nombre_sap':
        if (!value) return 'Nombre es requerido';
        if (value.length < 3) return 'Nombre debe tener al menos 3 caracteres';
        return undefined;
      case 'email_contacto_1':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email invalido';
        }
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Format RUT if needed
    const finalValue = name === 'rut' ? formatRut(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'clasificacion_id' ? (value ? Number(value) : null) : finalValue,
    }));

    // Validate on change if already touched
    if (touched[name]) {
      const error = validateField(name, finalValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Handle blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    newErrors.rut = validateField('rut', formData.rut);
    newErrors.nombre_sap = validateField('nombre_sap', formData.nombre_sap);
    newErrors.email_contacto_1 = validateField('email_contacto_1', formData.email_contacto_1);

    setErrors(newErrors);
    setTouched({ rut: true, nombre_sap: true, email_contacto_1: true });

    // Check if there are errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    // Build submit data - Issue 3: Incluir todos los campos de contacto
    const submitData: ClientCreate | ClientUpdate = {
      nombre_sap: formData.nombre_sap,
      codigo: formData.codigo || undefined,
      // Contacto 1
      nombre_contacto_1: formData.nombre_contacto_1 || undefined,
      cargo_contacto_1: formData.cargo_contacto_1 || undefined,
      email_contacto_1: formData.email_contacto_1 || undefined,
      phone_contacto_1: formData.phone_contacto_1 || undefined,
      direccion_contacto_1: formData.direccion_contacto_1 || undefined,
      // Contacto 2
      nombre_contacto_2: formData.nombre_contacto_2 || undefined,
      cargo_contacto_2: formData.cargo_contacto_2 || undefined,
      email_contacto_2: formData.email_contacto_2 || undefined,
      phone_contacto_2: formData.phone_contacto_2 || undefined,
      direccion_contacto_2: formData.direccion_contacto_2 || undefined,
      // Contacto 3
      nombre_contacto_3: formData.nombre_contacto_3 || undefined,
      cargo_contacto_3: formData.cargo_contacto_3 || undefined,
      email_contacto_3: formData.email_contacto_3 || undefined,
      phone_contacto_3: formData.phone_contacto_3 || undefined,
      direccion_contacto_3: formData.direccion_contacto_3 || undefined,
      clasificacion_id: formData.clasificacion_id || undefined,
    };

    // Only include RUT when creating
    if (!isEditing) {
      (submitData as ClientCreate).rut = formData.rut;
    }

    onSubmit(submitData);
  }, [formData, validateField, isEditing, onSubmit]);

  return (
    <FormCard>
      <FormHeader>
        {isEditing ? `Editando Cliente: ${client?.nombre_sap}` : 'Nuevo Cliente'}
      </FormHeader>
      <FormBody>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            {/* RUT */}
            <FormGroup>
              <Label>
                RUT
                <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="12.345.678-9"
                disabled={isEditing}
                maxLength={12}
              />
              {errors.rut && touched.rut && <ErrorText>{errors.rut}</ErrorText>}
              <HelpText>Formato: 12.345.678-9</HelpText>
            </FormGroup>

            {/* Nombre */}
            <FormGroup>
              <Label>
                Nombre
                <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                type="text"
                name="nombre_sap"
                value={formData.nombre_sap}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nombre del cliente"
                maxLength={255}
              />
              {errors.nombre_sap && touched.nombre_sap && <ErrorText>{errors.nombre_sap}</ErrorText>}
            </FormGroup>

            {/* Codigo */}
            <FormGroup>
              <Label>Codigo</Label>
              <Input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Codigo interno"
                maxLength={50}
              />
            </FormGroup>

            {/* Clasificacion */}
            <FormGroup>
              <Label>Clasificacion</Label>
              <Select
                name="clasificacion_id"
                value={formData.clasificacion_id || ''}
                onChange={handleChange}
              >
                <option value="">Sin clasificacion</option>
                {clasificaciones.map(c => (
                  <option key={c.id} value={c.id}>{c.descripcion}</option>
                ))}
              </Select>
            </FormGroup>

            {/* Contacto 1 - Issue 3: Todos los campos */}
            <SectionTitle style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>Contacto Principal</SectionTitle>

            <FormGroup>
              <Label>Nombre Contacto</Label>
              <Input
                type="text"
                name="nombre_contacto_1"
                value={formData.nombre_contacto_1}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Cargo</Label>
              <Input
                type="text"
                name="cargo_contacto_1"
                value={formData.cargo_contacto_1}
                onChange={handleChange}
                placeholder="Cargo del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email_contacto_1"
                value={formData.email_contacto_1}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="correo@ejemplo.com"
                maxLength={255}
              />
              {errors.email_contacto_1 && touched.email_contacto_1 && <ErrorText>{errors.email_contacto_1}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Teléfono</Label>
              <Input
                type="text"
                name="phone_contacto_1"
                value={formData.phone_contacto_1}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                maxLength={20}
              />
            </FormGroup>

            <FormGroup $fullWidth>
              <Label>Dirección</Label>
              <Input
                type="text"
                name="direccion_contacto_1"
                value={formData.direccion_contacto_1}
                onChange={handleChange}
                placeholder="Dirección del contacto"
                maxLength={255}
              />
            </FormGroup>

            {/* Contacto 2 - Issue 3: Todos los campos */}
            <SectionTitle style={{ gridColumn: '1 / -1' }}>Contacto Secundario</SectionTitle>

            <FormGroup>
              <Label>Nombre Contacto</Label>
              <Input
                type="text"
                name="nombre_contacto_2"
                value={formData.nombre_contacto_2}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Cargo</Label>
              <Input
                type="text"
                name="cargo_contacto_2"
                value={formData.cargo_contacto_2}
                onChange={handleChange}
                placeholder="Cargo del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email_contacto_2"
                value={formData.email_contacto_2}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Teléfono</Label>
              <Input
                type="text"
                name="phone_contacto_2"
                value={formData.phone_contacto_2}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                maxLength={20}
              />
            </FormGroup>

            <FormGroup $fullWidth>
              <Label>Dirección</Label>
              <Input
                type="text"
                name="direccion_contacto_2"
                value={formData.direccion_contacto_2}
                onChange={handleChange}
                placeholder="Dirección del contacto"
                maxLength={255}
              />
            </FormGroup>

            {/* Contacto 3 - Issue 3: Todos los campos */}
            <SectionTitle style={{ gridColumn: '1 / -1' }}>Contacto Adicional</SectionTitle>

            <FormGroup>
              <Label>Nombre Contacto</Label>
              <Input
                type="text"
                name="nombre_contacto_3"
                value={formData.nombre_contacto_3}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Cargo</Label>
              <Input
                type="text"
                name="cargo_contacto_3"
                value={formData.cargo_contacto_3}
                onChange={handleChange}
                placeholder="Cargo del contacto"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email_contacto_3"
                value={formData.email_contacto_3}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                maxLength={255}
              />
            </FormGroup>

            <FormGroup>
              <Label>Teléfono</Label>
              <Input
                type="text"
                name="phone_contacto_3"
                value={formData.phone_contacto_3}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                maxLength={20}
              />
            </FormGroup>

            <FormGroup $fullWidth>
              <Label>Dirección</Label>
              <Input
                type="text"
                name="direccion_contacto_3"
                value={formData.direccion_contacto_3}
                onChange={handleChange}
                placeholder="Dirección del contacto"
                maxLength={255}
              />
            </FormGroup>
          </FormGrid>

          {/* Seccion de Instalaciones (solo en modo edicion) - Issue 4: CRUD completo */}
          {isEditing && (
            <>
              <SectionTitle>Instalaciones del Cliente</SectionTitle>
              {loadingInstalaciones ? (
                <NoDataText>Cargando instalaciones...</NoDataText>
              ) : errorInstalaciones ? (
                <ErrorText>{errorInstalaciones}</ErrorText>
              ) : instalaciones.length > 0 ? (
                <InstallationsList>
                  {instalaciones.map(inst => (
                    <InstallationItem key={inst.id}>
                      <InstallationInfo>
                        <InstallationName>{inst.nombre || 'Sin nombre'}</InstallationName>
                        {inst.tipo_pallet_nombre && (
                          <InstallationAddress>Pallet: {inst.tipo_pallet_nombre}</InstallationAddress>
                        )}
                        {inst.pais_nombre && (
                          <InstallationAddress>País: {inst.pais_nombre}</InstallationAddress>
                        )}
                      </InstallationInfo>
                      <InstallationActions>
                        <ActionButton
                          type="button"
                          $variant="edit"
                          onClick={() => handleEditInstallation(inst.id)}
                          disabled={installationLoading}
                        >
                          Editar
                        </ActionButton>
                      </InstallationActions>
                    </InstallationItem>
                  ))}
                </InstallationsList>
              ) : (
                <NoDataText>Este cliente no tiene instalaciones registradas.</NoDataText>
              )}
              <AddButton type="button" onClick={handleAddInstallation} disabled={installationLoading}>
                + Agregar Instalación
              </AddButton>
            </>
          )}

          <FormActions>
            <Button type="button" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" $variant="primary" disabled={isLoading}>
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </FormActions>
        </form>
      </FormBody>

      {/* Modal de Instalación - Issue 4 */}
      {showInstallationModal && client?.id && (
        <Modal onClick={handleCloseInstallationModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <InstallationForm
              installation={editingInstallation}
              clientId={client.id}
              onSubmit={handleInstallationSubmit}
              onCancel={handleCloseInstallationModal}
              onDelete={editingInstallation ? handleDeleteInstallation : undefined}
              isLoading={installationLoading}
            />
          </ModalContent>
        </Modal>
      )}
    </FormCard>
  );
}
