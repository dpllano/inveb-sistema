/**
 * ForgotPassword - Pantalla para solicitar recuperación de contraseña
 */
import { useState } from 'react';
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

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.small};
  text-align: center;
  background: ${({ $type }) => {
    switch ($type) {
      case 'success': return `${theme.colors.success}15`;
      case 'error': return `${theme.colors.danger}15`;
      case 'info': return `${theme.colors.primary}15`;
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.danger;
      case 'info': return theme.colors.primary;
    }
  }};
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

const DevInfo = styled.div`
  margin-top: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  background: ${theme.colors.bgLight};
  border-radius: ${theme.radius.md};
  border: 1px dashed ${theme.colors.border};
`;

const DevTitle = styled.div`
  font-size: ${theme.typography.sizes.tiny};
  color: ${theme.colors.textMuted};
  margin-bottom: ${theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DevValue = styled.div`
  font-size: ${theme.typography.sizes.small};
  color: ${theme.colors.textSecondary};
  word-break: break-all;
  font-family: monospace;
`;

// =============================================
// TYPES
// =============================================

interface ForgotPasswordProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

// =============================================
// COMPONENT
// =============================================

export default function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setDevToken(null);
    setDevResetUrl(null);

    if (!email.trim()) {
      setError('Ingrese su correo electronico');
      return;
    }

    if (!validateEmail(email)) {
      setError('Ingrese un correo electronico valido');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setSuccess(true);

      // Guardar info de desarrollo si existe
      if (response._dev_token) {
        setDevToken(response._dev_token);
        setDevResetUrl(response._dev_reset_url || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            'Error al procesar la solicitud';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToReset = () => {
    if (devToken) {
      onNavigate('reset-password', { token: devToken, email });
    }
  };

  return (
    <Container>
      <Card>
        <Logo>
          <LogoText>INVEB</LogoText>
          <LogoSubtext>Sistema de Gestion</LogoSubtext>
        </Logo>

        <Title>Recuperar Contrasena</Title>
        <Description>
          Ingresa tu correo electronico y te enviaremos instrucciones para restablecer tu contrasena.
        </Description>

        {success && (
          <Message $type="success">
            Si el correo esta registrado, recibiras instrucciones para restablecer tu contrasena.
          </Message>
        )}

        {error && <Message $type="error">{error}</Message>}

        {!success && (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Correo Electronico</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </FormGroup>

            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </Button>
          </Form>
        )}

        {/* Info de desarrollo - solo si hay token */}
        {devToken && (
          <DevInfo>
            <DevTitle>Modo Desarrollo</DevTitle>
            <DevValue>Token: {devToken.substring(0, 20)}...</DevValue>
            {devResetUrl && (
              <>
                <DevValue style={{ marginTop: '8px' }}>URL: {devResetUrl}</DevValue>
                <Button
                  type="button"
                  onClick={handleGoToReset}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  Ir a Restablecer Contrasena
                </Button>
              </>
            )}
          </DevInfo>
        )}

        <BackLink onClick={() => onNavigate('login')}>
          Volver a Iniciar Sesion
        </BackLink>
      </Card>
    </Container>
  );
}
