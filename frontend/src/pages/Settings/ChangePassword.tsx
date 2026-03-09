/**
 * ChangePassword - Pantalla para cambiar contraseña del usuario
 */
import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { authApi } from '../../services/api';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: ${theme.spacing.xl};
`;

const Card = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.xl};
`;

const Title = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h2};
  margin: 0 0 ${theme.spacing.xs} 0;
`;

const Subtitle = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  margin: 0 0 ${theme.spacing.xl} 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: ${theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  font-size: 1.1rem;

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s;

  ${({ $variant = 'primary' }) =>
    $variant === 'primary'
      ? `
        background: ${theme.colors.primary};
        color: white;
      `
      : `
        background: ${theme.colors.bgLight};
        color: ${theme.colors.textSecondary};
        border: 1px solid ${theme.colors.border};
      `}

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.small};
  background: ${({ $type }) =>
    $type === 'success' ? `${theme.colors.success}15` : `${theme.colors.danger}15`};
  color: ${({ $type }) =>
    $type === 'success' ? theme.colors.success : theme.colors.danger};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Requirements = styled.div`
  background: ${theme.colors.bgLight};
  border-radius: ${theme.radius.md};
  padding: ${theme.spacing.md};
  margin-top: ${theme.spacing.sm};
`;

const RequirementTitle = styled.div`
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xs};
`;

const RequirementItem = styled.div<{ $valid: boolean }>`
  font-size: ${theme.typography.sizes.tiny};
  color: ${({ $valid }) => ($valid ? theme.colors.success : theme.colors.textMuted)};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-top: ${theme.spacing.xs};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.body};
  cursor: pointer;
  padding: 0;
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;

// =============================================
// TYPES
// =============================================

interface ChangePasswordProps {
  onNavigate: (page: string) => void;
}

// =============================================
// COMPONENT
// =============================================

export default function ChangePassword({ onNavigate }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const hasMinLength = newPassword.length >= 6;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const isValid = hasMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError('Ingrese su contraseña actual');
      return;
    }

    if (!isValid) {
      setError('La nueva contraseña no cumple con los requisitos');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            'Error al cambiar la contraseña';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('dashboard')}>
        ← Volver al Dashboard
      </BackLink>

      <Card>
        <Title>Cambiar Contraseña</Title>
        <Subtitle>
          Ingrese su contraseña actual y luego la nueva contraseña que desea usar.
        </Subtitle>

        {success && (
          <Message $type="success">
            ✓ Su contraseña ha sido actualizada exitosamente.
          </Message>
        )}

        {error && <Message $type="error">✕ {error}</Message>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Contraseña Actual</Label>
            <PasswordWrapper>
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingrese su contraseña actual"
                disabled={loading}
              />
              <ToggleButton
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? '🙈' : '👁️'}
              </ToggleButton>
            </PasswordWrapper>
          </FormGroup>

          <FormGroup>
            <Label>Nueva Contraseña</Label>
            <PasswordWrapper>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                disabled={loading}
              />
              <ToggleButton
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? '🙈' : '👁️'}
              </ToggleButton>
            </PasswordWrapper>

            <Requirements>
              <RequirementTitle>Requisitos de la contraseña:</RequirementTitle>
              <RequirementItem $valid={hasMinLength}>
                {hasMinLength ? '✓' : '○'} Minimo 6 caracteres
              </RequirementItem>
              <RequirementItem $valid={hasUpperCase}>
                {hasUpperCase ? '✓' : '○'} Al menos una mayuscula (recomendado)
              </RequirementItem>
              <RequirementItem $valid={hasLowerCase}>
                {hasLowerCase ? '✓' : '○'} Al menos una minuscula (recomendado)
              </RequirementItem>
              <RequirementItem $valid={hasNumber}>
                {hasNumber ? '✓' : '○'} Al menos un numero (recomendado)
              </RequirementItem>
            </Requirements>
          </FormGroup>

          <FormGroup>
            <Label>Confirmar Nueva Contraseña</Label>
            <PasswordWrapper>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                disabled={loading}
              />
              <ToggleButton
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </ToggleButton>
            </PasswordWrapper>
            {confirmPassword && !passwordsMatch && (
              <span style={{ color: theme.colors.danger, fontSize: theme.typography.sizes.tiny }}>
                Las contraseñas no coinciden
              </span>
            )}
            {passwordsMatch && (
              <span style={{ color: theme.colors.success, fontSize: theme.typography.sizes.tiny }}>
                ✓ Las contraseñas coinciden
              </span>
            )}
          </FormGroup>

          <ButtonRow>
            <Button type="button" $variant="secondary" onClick={handleReset} disabled={loading}>
              Limpiar
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </ButtonRow>
        </Form>
      </Card>
    </Container>
  );
}
