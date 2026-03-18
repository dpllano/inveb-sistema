/**
 * InstallationForm Component
 * Formulario para crear/editar instalaciones de cliente
 * Issue 4: CRUD de instalaciones en mantenedor
 * Fuente Laravel: ClientController store_installation, edit_installation, update_installation
 * CORREGIDO: Soporte para 5 contactos (extraído de Laravel migrations)
 */

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import type { InstallationDetail, InstallationCreate, InstallationUpdate } from '../../services/api';

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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FormBody = styled.div`
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => {
    if (props.$variant === 'primary') {
      return `
        background: ${theme.colors.primary};
        color: white;
        border-color: ${theme.colors.primary};
        &:hover:not(:disabled) { background: #002d66; }
      `;
    } else if (props.$variant === 'danger') {
      return `
        background: ${theme.colors.danger};
        color: white;
        border-color: ${theme.colors.danger};
        &:hover:not(:disabled) { background: #a02020; }
      `;
    } else {
      return `
        background: white;
        color: ${theme.colors.textSecondary};
        border-color: ${theme.colors.border};
        &:hover:not(:disabled) {
          border-color: ${theme.colors.primary};
          color: ${theme.colors.primary};
        }
      `;
    }
  }}

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

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 1.5rem 0 0.75rem 0;
  padding-top: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    opacity: 0.8;
  }
`;

const ContactSection = styled.div`
  background: ${theme.colors.bgLight};
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContactTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 0.75rem 0;
`;

// Types for select options
interface SelectOption {
  id: number;
  nombre?: string;
  descripcion?: string;
  name?: string;
  codigo?: string;
}

interface InstallationFormProps {
  installation: InstallationDetail | null;
  clientId: number;
  onSubmit: (data: InstallationCreate | InstallationUpdate, isNew: boolean) => void;
  onCancel: () => void;
  onDelete?: (id: number) => void;
  isLoading: boolean;
  // Opciones para selects (configuración de pallet)
  fscOptions?: SelectOption[];
  palletQaOptions?: SelectOption[];
  palletTagFormatOptions?: SelectOption[];
  targetMarketOptions?: SelectOption[];
}

interface FormErrors {
  nombre?: string;
}

export default function InstallationForm({
  installation,
  clientId,
  onSubmit,
  onCancel,
  onDelete,
  isLoading,
  fscOptions = [],
  palletQaOptions = [],
  palletTagFormatOptions = [],
  targetMarketOptions = [],
}: InstallationFormProps) {
  const isEditing = !!installation;

  // Form state - Incluye los 5 contactos según Laravel
  // IMPORTANTE: Usar ?? para campos numéricos donde 0 es un valor válido (ej: bulto_zunchado=0 significa "No")
  const [formData, setFormData] = useState({
    nombre: installation?.nombre || '',
    tipo_pallet: installation?.tipo_pallet ?? null,
    altura_pallet: installation?.altura_pallet ?? null,
    sobresalir_carga: installation?.sobresalir_carga ?? null,
    bulto_zunchado: installation?.bulto_zunchado ?? null,
    formato_etiqueta: installation?.formato_etiqueta ?? null,
    etiquetas_pallet: installation?.etiquetas_pallet ?? null,
    termocontraible: installation?.termocontraible ?? null,
    fsc: installation?.fsc ?? null,
    pais_mercado_destino: installation?.pais_mercado_destino ?? null,
    certificado_calidad: installation?.certificado_calidad ?? null,
    // Contacto 1
    nombre_contacto: installation?.nombre_contacto || '',
    cargo_contacto: installation?.cargo_contacto || '',
    email_contacto: installation?.email_contacto || '',
    phone_contacto: installation?.phone_contacto || '',
    direccion_contacto: installation?.direccion_contacto || '',
    // Contacto 2
    nombre_contacto_2: installation?.nombre_contacto_2 || '',
    cargo_contacto_2: installation?.cargo_contacto_2 || '',
    email_contacto_2: installation?.email_contacto_2 || '',
    phone_contacto_2: installation?.phone_contacto_2 || '',
    direccion_contacto_2: installation?.direccion_contacto_2 || '',
    // Contacto 3
    nombre_contacto_3: installation?.nombre_contacto_3 || '',
    cargo_contacto_3: installation?.cargo_contacto_3 || '',
    email_contacto_3: installation?.email_contacto_3 || '',
    phone_contacto_3: installation?.phone_contacto_3 || '',
    direccion_contacto_3: installation?.direccion_contacto_3 || '',
    // Contacto 4
    nombre_contacto_4: installation?.nombre_contacto_4 || '',
    cargo_contacto_4: installation?.cargo_contacto_4 || '',
    email_contacto_4: installation?.email_contacto_4 || '',
    phone_contacto_4: installation?.phone_contacto_4 || '',
    direccion_contacto_4: installation?.direccion_contacto_4 || '',
    // Contacto 5
    nombre_contacto_5: installation?.nombre_contacto_5 || '',
    cargo_contacto_5: installation?.cargo_contacto_5 || '',
    email_contacto_5: installation?.email_contacto_5 || '',
    phone_contacto_5: installation?.phone_contacto_5 || '',
    direccion_contacto_5: installation?.direccion_contacto_5 || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // Fix 2026-03-17: Prevenir doble envío con estado local
  const [submitting, setSubmitting] = useState(false);

  // Reset submitting cuando isLoading cambie a false (operación completada)
  useEffect(() => {
    if (!isLoading && submitting) {
      setSubmitting(false);
    }
  }, [isLoading, submitting]);

  // Update form when installation changes
  useEffect(() => {
    if (installation) {
      setFormData({
        nombre: installation.nombre || '',
        tipo_pallet: installation.tipo_pallet,
        altura_pallet: installation.altura_pallet,
        sobresalir_carga: installation.sobresalir_carga,
        bulto_zunchado: installation.bulto_zunchado,
        formato_etiqueta: installation.formato_etiqueta,
        etiquetas_pallet: installation.etiquetas_pallet,
        termocontraible: installation.termocontraible,
        fsc: installation.fsc,
        pais_mercado_destino: installation.pais_mercado_destino,
        certificado_calidad: installation.certificado_calidad,
        // Contacto 1
        nombre_contacto: installation.nombre_contacto || '',
        cargo_contacto: installation.cargo_contacto || '',
        email_contacto: installation.email_contacto || '',
        phone_contacto: installation.phone_contacto || '',
        direccion_contacto: installation.direccion_contacto || '',
        // Contacto 2
        nombre_contacto_2: installation.nombre_contacto_2 || '',
        cargo_contacto_2: installation.cargo_contacto_2 || '',
        email_contacto_2: installation.email_contacto_2 || '',
        phone_contacto_2: installation.phone_contacto_2 || '',
        direccion_contacto_2: installation.direccion_contacto_2 || '',
        // Contacto 3
        nombre_contacto_3: installation.nombre_contacto_3 || '',
        cargo_contacto_3: installation.cargo_contacto_3 || '',
        email_contacto_3: installation.email_contacto_3 || '',
        phone_contacto_3: installation.phone_contacto_3 || '',
        direccion_contacto_3: installation.direccion_contacto_3 || '',
        // Contacto 4
        nombre_contacto_4: installation.nombre_contacto_4 || '',
        cargo_contacto_4: installation.cargo_contacto_4 || '',
        email_contacto_4: installation.email_contacto_4 || '',
        phone_contacto_4: installation.phone_contacto_4 || '',
        direccion_contacto_4: installation.direccion_contacto_4 || '',
        // Contacto 5
        nombre_contacto_5: installation.nombre_contacto_5 || '',
        cargo_contacto_5: installation.cargo_contacto_5 || '',
        email_contacto_5: installation.email_contacto_5 || '',
        phone_contacto_5: installation.phone_contacto_5 || '',
        direccion_contacto_5: installation.direccion_contacto_5 || '',
      });
    }
  }, [installation]);

  // Validate field
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'nombre':
        if (!value) return 'Nombre es requerido';
        if (value.length < 2) return 'Nombre debe tener al menos 2 caracteres';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let finalValue: string | number | null;
    if (type === 'number' || name.includes('_pallet') || name.includes('_carga') || name.includes('_zunchado') ||
        name === 'formato_etiqueta' || name === 'termocontraible' || name === 'fsc' ||
        name === 'pais_mercado_destino' || name === 'certificado_calidad' || name === 'tipo_pallet') {
      finalValue = value ? Number(value) : null;
    } else {
      finalValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));

    // Validate on change if already touched
    if (touched[name]) {
      const error = validateField(name, value);
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

    // Fix 2026-03-17: Prevenir doble envío
    if (submitting || isLoading) {
      console.log('[InstallationForm] Envío ya en progreso, ignorando click');
      return;
    }

    // Validate all fields
    const newErrors: FormErrors = {};
    newErrors.nombre = validateField('nombre', formData.nombre);

    setErrors(newErrors);
    setTouched({ nombre: true });

    // Check if there are errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    // Marcar como enviando ANTES de llamar a onSubmit
    setSubmitting(true);

    // Build submit data - Incluye los 5 contactos
    // IMPORTANTE: Usar ?? en lugar de || para campos numéricos donde 0 es un valor válido
    const submitData: InstallationCreate | InstallationUpdate = {
      nombre: formData.nombre || undefined,
      tipo_pallet: formData.tipo_pallet ?? undefined,
      altura_pallet: formData.altura_pallet ?? undefined,
      sobresalir_carga: formData.sobresalir_carga ?? undefined,
      bulto_zunchado: formData.bulto_zunchado ?? undefined,
      formato_etiqueta: formData.formato_etiqueta ?? undefined,
      etiquetas_pallet: formData.etiquetas_pallet ?? undefined,
      termocontraible: formData.termocontraible ?? undefined,
      fsc: formData.fsc ?? undefined,
      pais_mercado_destino: formData.pais_mercado_destino || undefined,
      certificado_calidad: formData.certificado_calidad ?? undefined,
      // Contacto 1
      nombre_contacto: formData.nombre_contacto || undefined,
      cargo_contacto: formData.cargo_contacto || undefined,
      email_contacto: formData.email_contacto || undefined,
      phone_contacto: formData.phone_contacto || undefined,
      direccion_contacto: formData.direccion_contacto || undefined,
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
      // Contacto 4
      nombre_contacto_4: formData.nombre_contacto_4 || undefined,
      cargo_contacto_4: formData.cargo_contacto_4 || undefined,
      email_contacto_4: formData.email_contacto_4 || undefined,
      phone_contacto_4: formData.phone_contacto_4 || undefined,
      direccion_contacto_4: formData.direccion_contacto_4 || undefined,
      // Contacto 5
      nombre_contacto_5: formData.nombre_contacto_5 || undefined,
      cargo_contacto_5: formData.cargo_contacto_5 || undefined,
      email_contacto_5: formData.email_contacto_5 || undefined,
      phone_contacto_5: formData.phone_contacto_5 || undefined,
      direccion_contacto_5: formData.direccion_contacto_5 || undefined,
    };

    // Only include client_id when creating
    if (!isEditing) {
      (submitData as InstallationCreate).client_id = clientId;
    }

    onSubmit(submitData, !isEditing);
  }, [formData, validateField, isEditing, clientId, onSubmit, submitting, isLoading]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (installation && onDelete) {
      if (window.confirm('¿Está seguro de eliminar esta instalación? Esta acción no se puede deshacer.')) {
        onDelete(installation.id);
      }
    }
  }, [installation, onDelete]);

  // Función helper para renderizar campos de contacto (no es un componente React)
  const renderContactFields = (suffix: string, title: string) => {
    const nameField = `nombre_contacto${suffix}` as keyof typeof formData;
    const cargoField = `cargo_contacto${suffix}` as keyof typeof formData;
    const emailField = `email_contacto${suffix}` as keyof typeof formData;
    const phoneField = `phone_contacto${suffix}` as keyof typeof formData;
    const direccionField = `direccion_contacto${suffix}` as keyof typeof formData;

    return (
      <ContactSection key={suffix || 'main'}>
        <ContactTitle>{title}</ContactTitle>
        <ContactGrid>
          <FormGroup>
            <Label>Nombre</Label>
            <Input
              type="text"
              name={nameField}
              value={formData[nameField] as string || ''}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              maxLength={255}
            />
          </FormGroup>

          <FormGroup>
            <Label>Cargo</Label>
            <Input
              type="text"
              name={cargoField}
              value={formData[cargoField] as string || ''}
              onChange={handleChange}
              placeholder="Cargo del contacto"
              maxLength={255}
            />
          </FormGroup>

          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name={emailField}
              value={formData[emailField] as string || ''}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              maxLength={255}
            />
          </FormGroup>

          <FormGroup>
            <Label>Teléfono</Label>
            <Input
              type="text"
              name={phoneField}
              value={formData[phoneField] as string || ''}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              maxLength={20}
            />
          </FormGroup>

          <FormGroup $fullWidth>
            <Label>Dirección</Label>
            <Input
              type="text"
              name={direccionField}
              value={formData[direccionField] as string || ''}
              onChange={handleChange}
              placeholder="Dirección del contacto"
              maxLength={255}
            />
          </FormGroup>
        </ContactGrid>
      </ContactSection>
    );
  };

  return (
    <FormCard>
      <FormHeader>
        <span>{isEditing ? `Editando: ${installation?.nombre || 'Instalación'}` : 'Nueva Instalación'}</span>
        <CloseButton onClick={onCancel} title="Cerrar">&times;</CloseButton>
      </FormHeader>
      <FormBody>
        <form onSubmit={handleSubmit}>
          <FormGrid>
            {/* Nombre */}
            <FormGroup $fullWidth>
              <Label>
                Nombre de la Instalación
                <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: Bodega Norte, Planta Principal"
                maxLength={255}
              />
              {errors.nombre && touched.nombre && <ErrorText>{errors.nombre}</ErrorText>}
            </FormGroup>

            {/* Configuración de Pallet */}
            <SectionTitle style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>Configuración de Pallet</SectionTitle>

            <FormGroup>
              <Label>Tipo de Pallet</Label>
              <Select
                name="tipo_pallet"
                value={formData.tipo_pallet ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="1">Americano</option>
                <option value="2">Europeo</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Altura Pallet (mm)</Label>
              <Input
                type="number"
                name="altura_pallet"
                value={formData.altura_pallet ?? ''}
                onChange={handleChange}
                placeholder="Ej: 1200"
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <Label>Sobresalir Carga</Label>
              <Select
                name="sobresalir_carga"
                value={formData.sobresalir_carga ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Bulto Zunchado</Label>
              <Select
                name="bulto_zunchado"
                value={formData.bulto_zunchado ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Termocontraíble</Label>
              <Select
                name="termocontraible"
                value={formData.termocontraible ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Etiquetas por Pallet</Label>
              <Select
                name="etiquetas_pallet"
                value={formData.etiquetas_pallet ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Formato Etiqueta Pallet</Label>
              <Select
                name="formato_etiqueta"
                value={formData.formato_etiqueta ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {palletTagFormatOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.descripcion || opt.nombre || opt.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>FSC</Label>
              <Select
                name="fsc"
                value={formData.fsc ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {fscOptions.map(opt => (
                  <option key={opt.codigo || opt.id} value={opt.codigo || opt.id}>
                    {opt.descripcion || opt.nombre}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>País Mercado/Destino</Label>
              <Select
                name="pais_mercado_destino"
                value={formData.pais_mercado_destino ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {targetMarketOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.descripcion || opt.nombre || opt.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Certificado de Calidad</Label>
              <Select
                name="certificado_calidad"
                value={formData.certificado_calidad ?? ''}
                onChange={handleChange}
              >
                <option value="">Seleccionar</option>
                {palletQaOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.descripcion || opt.nombre}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormGrid>

          {/* 5 Contactos de la Instalación */}
          <SectionTitle style={{ marginTop: '1.5rem' }}>Contactos de la Instalación</SectionTitle>

          {renderContactFields('', 'Contacto 1 (Principal)')}
          {renderContactFields('_2', 'Contacto 2')}
          {renderContactFields('_3', 'Contacto 3')}
          {renderContactFields('_4', 'Contacto 4')}
          {renderContactFields('_5', 'Contacto 5')}

          <FormActions>
            {isEditing && onDelete && (
              <Button type="button" $variant="danger" onClick={handleDelete} disabled={isLoading}>
                Eliminar
              </Button>
            )}
            <Button type="button" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" $variant="primary" disabled={isLoading || submitting}>
              {(isLoading || submitting) ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </FormActions>
        </form>
      </FormBody>
    </FormCard>
  );
}
