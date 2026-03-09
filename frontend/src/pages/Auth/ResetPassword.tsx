/**
 * ResetPassword - Pantalla para restablecer contraseña con token
 */
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { authApi } from '../../services/api';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${theme.colors.bgLight} 0%, ${theme.colors.bgMedium} 100%);
  padding: ${theme.spacing.lg};
`;

const Card = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing.xxl};
  width: 100%;
  max-width: 420px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
`;

const LogoText = styled.h1`
  color: ${theme.colors.primary};
  font-size: 2rem;
  font-weight: ${theme.typography.weights.bold};
  margin: 0;
`;

const LogoSubtext = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const Title = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h3};
  font-weight: ${theme.typography.weights.semibold};
  margin: 0 0 ${theme.spacing.sm} 0;
  text-align: center;
`;

const Description = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  margin: 0 0 ${theme.spacing.xl} 0;
  text-align: center;
  line-height: 1.5;
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
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }

  &::placeholder {
    color: ${theme.colors.textMuted};
  }

  &:disabled {
    background: ${theme.colors.bgLight};
    cursor: not-allowed;
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

const Button = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s;
  background: ${theme.colors.primary};
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' | 'info' | 'warning' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.small};
  text-align: center;
  background: ${({ $type }) => {
    switch ($type) {
      case 'success': return `${theme.colors.success}15`;
      case 'error': return `${theme.colors.danger}15`;
      case 'info': return `${theme.colors.primary}15`;
      case 'warning': return `${theme.colors.warning}15`;
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.danger;
      case 'info': return theme.colors.primary;
      case 'warning': return theme.colors.warning;
    }
  }};
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

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  padding: 0;
  margin-top: ${theme.spacing.lg};
  display: block;
  width: 100%;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

// =============================================
// TYPES
// =============================================

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
  token?: string;
  email?: string;
}

// =============================================
// COMPONENT
// =============================================

export default function ResetPassword({ onNavigate, token, email: initialEmail }: ResetPasswordProps) {
  const [email, _setEmail] = useState(initialEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const hasMinLength = newPassword.length >= 6;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const isValid = hasMinLength && passwordsMatch;

  // Validar token al montar
  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setValidating(false);
        setError('Enlace invalido. Por favor solicita uno nuevo.');
        return;
      }

      try {
        const response = await authApi.validateResetToken(token, email);
        setTokenValid(response.valid);
        if (!response.valid) {
          setError(response.message || 'El enlace es invalido o ha expirado.');
        }
      } catch {
        setError('Error al validar el enlace.');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('La contrasena no cumple con los requisitos');
      return;
    }

    if (!token) {
      setError('Token no valido');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, email, newPassword);
      setSuccess(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            'Error al restablecer la contrasena';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras valida
  if (validating) {
    return (
      <Container>
        <Card>
          <Logo>
            <LogoText>INVEB</LogoText>
            <LogoSubtext>Sistema de Gestion</LogoSubtext>
          </Logo>
          <LoadingContainer>
            Validando enlace...
          </LoadingContainer>
        </Card>
      </Container>
    );
  }

  // Mostrar error si token invalido
  if (!tokenValid && !success) {
    return (
      <Container>
        <Card>
          <Logo>
            <LogoText>INVEB</LogoText>
            <LogoSubtext>Sistema de Gestion</LogoSubtext>
          </Logo>

          <Title>Enlace Invalido</Title>

          <Message $type="error">
            {error || 'El enlace de recuperacion es invalido o ha expirado.'}
          </Message>

          <Button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          >
            Solicitar Nuevo Enlace
          </Button>

          <BackLink onClick={() => onNavigate('login')}>
            Volver a Iniciar Sesion
          </BackLink>
        </Card>
      </Container>
    );
  }

  // Mostrar exito
  if (success) {
    return (
      <Container>
        <Card>
          <Logo>
            <LogoText>INVEB</LogoText>
            <LogoSubtext>Sistema de Gestion</LogoSubtext>
          </Logo>

          <Title>Contrasena Restablecida</Title>

          <Message $type="success">
            Tu contrasena ha sido restablecida exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.
          </Message>

          <Button
            type="button"
            onClick={() => onNavigate('login')}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          >
            Ir a Iniciar Sesion
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Logo>
          <LogoText>INVEB</LogoText>
          <LogoSubtext>Sistema de Gestion</LogoSubtext>
        </Logo>

        <Title>Nueva Contrasena</Title>
        <Description>
          Ingresa tu nueva contrasena para la cuenta: <strong>{email}</strong>
        </Description>

        {error && <Message $type="error">{error}</Message>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Nueva Contrasena</Label>
            <PasswordWrapper>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contrasena"
                disabled={loading}
                autoComplete="new-password"
                autoFocus
              />
              <ToggleButton
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </ToggleButton>
            </PasswordWrapper>

            <Requirements>
              <RequirementTitle>Requisitos de la contrasena:</RequirementTitle>
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
            <Label>Confirmar Contrasena</Label>
            <PasswordWrapper>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contrasena"
                disabled={loading}
                autoComplete="new-password"
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
                Las contrasenas no coinciden
              </span>
            )}
            {passwordsMatch && (
              <span style={{ color: theme.colors.success, fontSize: theme.typography.sizes.tiny }}>
                ✓ Las contrasenas coinciden
              </span>
            )}
          </FormGroup>

          <Button type="submit" disabled={loading || !isValid}>
            {loading ? 'Guardando...' : 'Restablecer Contrasena'}
          </Button>
        </Form>

        <BackLink onClick={() => onNavigate('login')}>
          Volver a Iniciar Sesion
        </BackLink>
      </Card>
    </Container>
  );
}
