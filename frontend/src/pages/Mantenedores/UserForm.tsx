/**
 * UserForm Component
 * Formulario para crear/editar usuarios
 */

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import type { UserDetail, UserCreate, UserUpdate, RoleOption } from '../../services/api';

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

// Types
interface UserFormProps {
  user: UserDetail | null;
  roles: RoleOption[];
  onSubmit: (data: UserCreate | UserUpdate) => void;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormErrors {
  rut?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
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

export default function UserForm({
  user,
  roles,
  onSubmit,
  onCancel,
  isLoading,
}: UserFormProps) {
  const isEditing = !!user;

  // Form state
  const [formData, setFormData] = useState({
    rut: user?.rut || '',
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    password: '',
    role_id: user?.role_id || null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        rut: user.rut || '',
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
        password: '',
        role_id: user.role_id || null,
      });
    }
  }, [user]);

  // Validate field
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'rut':
        if (!value) return 'RUT es requerido';
        if (!validateRut(value)) return 'RUT invalido';
        return undefined;
      case 'nombre':
        if (!value) return 'Nombre es requerido';
        if (value.length < 2) return 'Nombre debe tener al menos 2 caracteres';
        return undefined;
      case 'apellido':
        if (!value) return 'Apellido es requerido';
        if (value.length < 2) return 'Apellido debe tener al menos 2 caracteres';
        return undefined;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email invalido';
        }
        return undefined;
      case 'password':
        if (!isEditing && !value) return 'Contraseña es requerida';
        if (value && value.length < 6) return 'Contraseña debe tener al menos 6 caracteres';
        return undefined;
      default:
        return undefined;
    }
  }, [isEditing]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Format RUT if needed
    const finalValue = name === 'rut' ? formatRut(value) : value;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'role_id'
        ? (value ? Number(value) : null)
        : finalValue,
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
    newErrors.nombre = validateField('nombre', formData.nombre);
    newErrors.apellido = validateField('apellido', formData.apellido);
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);

    setErrors(newErrors);
    setTouched({ rut: true, nombre: true, apellido: true, email: true, password: true });

    // Check if there are errors
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    // Build submit data
    if (isEditing) {
      const submitData: UserUpdate = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        password: formData.password || undefined,
        role_id: formData.role_id || undefined,
      };
      onSubmit(submitData);
    } else {
      const submitData: UserCreate = {
        rut: formData.rut,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        password: formData.password,
        role_id: formData.role_id || undefined,
      };
      onSubmit(submitData);
    }
  }, [formData, validateField, isEditing, onSubmit]);

  return (
    <FormCard>
      <FormHeader>
        {isEditing ? `Editando Usuario: ${user?.nombre} ${user?.apellido}` : 'Nuevo Usuario'}
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
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nombre"
                maxLength={100}
              />
              {errors.nombre && touched.nombre && <ErrorText>{errors.nombre}</ErrorText>}
            </FormGroup>

            {/* Apellido */}
            <FormGroup>
              <Label>
                Apellido
                <RequiredMark>*</RequiredMark>
              </Label>
              <Input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Apellido"
                maxLength={100}
              />
              {errors.apellido && touched.apellido && <ErrorText>{errors.apellido}</ErrorText>}
            </FormGroup>

            {/* Email */}
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="correo@ejemplo.com"
                maxLength={100}
              />
              {errors.email && touched.email && <ErrorText>{errors.email}</ErrorText>}
            </FormGroup>

            {/* Telefono */}
            <FormGroup>
              <Label>Telefono</Label>
              <Input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                maxLength={20}
              />
            </FormGroup>

            {/* Password */}
            <FormGroup>
              <Label>
                Contraseña
                {!isEditing && <RequiredMark>*</RequiredMark>}
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={isEditing ? 'Dejar vacio para no cambiar' : 'Minimo 6 caracteres'}
                maxLength={100}
              />
              {errors.password && touched.password && <ErrorText>{errors.password}</ErrorText>}
              {isEditing && <HelpText>Dejar vacio para mantener contraseña actual</HelpText>}
            </FormGroup>

            {/* Rol */}
            <FormGroup>
              <Label>Rol</Label>
              <Select
                name="role_id"
                value={formData.role_id || ''}
                onChange={handleChange}
              >
                <option value="">Sin rol asignado</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </Select>
            </FormGroup>
          </FormGrid>

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
    </FormCard>
  );
}
