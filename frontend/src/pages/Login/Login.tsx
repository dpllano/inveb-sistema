/**
 * Login Page Component
 * Pagina de inicio de sesion con diseno Monitor One
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { Button } from '../../components/common';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  padding: ${theme.spacing.lg};
`;

const LoginCard = styled.div`
  background: ${theme.colors.bgWhite};
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
`;

const LogoText = styled.h1`
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.h1};
  font-weight: ${theme.typography.weights.bold};
  margin: 0;
`;

const LogoSubtext = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  margin: ${theme.spacing.xs} 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Label = styled.label`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
`;

const Input = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }

  &::placeholder {
    color: ${theme.colors.textSecondary};
  }
`;

const ErrorMessage = styled.div`
  background-color: ${theme.colors.danger}15;
  color: ${theme.colors.danger};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.small};
  text-align: center;
`;

const Footer = styled.div`
  margin-top: ${theme.spacing.lg};
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  padding: 0;
  margin-top: ${theme.spacing.sm};
  display: block;
  width: 100%;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

interface LoginProps {
  onLogin?: (rut: string, password: string) => Promise<boolean>;
  onNavigate?: (page: string) => void;
}

export function Login({ onLogin, onNavigate }: LoginProps) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatRut = useCallback((value: string) => {
    // Remover caracteres no validos
    let cleaned = value.replace(/[^0-9kK]/g, '');

    // Limitar longitud
    if (cleaned.length > 9) {
      cleaned = cleaned.slice(0, 9);
    }

    // Formatear con guion
    if (cleaned.length > 1) {
      const dv = cleaned.slice(-1);
      const body = cleaned.slice(0, -1);
      return `${body}-${dv.toUpperCase()}`;
    }

    return cleaned;
  }, []);

  const handleRutChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    setError(null);
  }, [formatRut]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rut || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      if (onLogin) {
        const success = await onLogin(rut, password);
        if (!success) {
          setError('RUT o contraseña incorrectos');
        }
      } else {
        // Demo mode - simulate login
        console.log('Login attempt:', { rut, password });
        setError('Modo demo - autenticacion no implementada');
      }
    } catch (err) {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [rut, password, onLogin]);

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoText>INVEB</LogoText>
          <LogoSubtext>Sistema de Ordenes de Trabajo</LogoSubtext>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="rut">RUT</Label>
            <Input
              id="rut"
              type="text"
              value={rut}
              onChange={handleRutChange}
              placeholder="12345678-9"
              autoComplete="username"
              disabled={isLoading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button
            type="submit"
            $variant="primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: theme.spacing.sm }}
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>

          {onNavigate && (
            <ForgotPasswordLink
              type="button"
              onClick={() => onNavigate('forgot-password')}
            >
              Olvide mi contrasena
            </ForgotPasswordLink>
          )}
        </Form>

        <Footer>
          MS-004 CascadeService v1.0
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
}
