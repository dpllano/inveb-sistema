/**
 * Componente de Ruta Protegida
 * Sprint K - Task K.5
 *
 * Uso:
 * <ProtectedRoute permiso="VER_REPORTES">
 *   <ReportsPage />
 * </ProtectedRoute>
 *
 * <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useUser, type PermisoKey, type RoleId } from '../../contexts/UserContext';
import { theme } from '../../theme';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================
const AccessDeniedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
`;

const AccessDeniedIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const AccessDeniedTitle = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const AccessDeniedMessage = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 1rem;
  max-width: 400px;
`;

const BackButton = styled.button`
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover {
    background: ${theme.colors.primaryDark};
  }
`;

// =============================================================================
// COMPONENTE ACCESO DENEGADO
// =============================================================================
interface AccessDeniedProps {
  message?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function AccessDenied({
  message = 'No tienes permisos para acceder a esta sección.',
  showBackButton = true,
  onBack,
}: AccessDeniedProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <AccessDeniedContainer>
      <AccessDeniedIcon>🔒</AccessDeniedIcon>
      <AccessDeniedTitle>Acceso Restringido</AccessDeniedTitle>
      <AccessDeniedMessage>{message}</AccessDeniedMessage>
      {showBackButton && (
        <BackButton onClick={handleBack}>
          Volver
        </BackButton>
      )}
    </AccessDeniedContainer>
  );
}

// =============================================================================
// COMPONENTE RUTA PROTEGIDA
// =============================================================================
interface ProtectedRouteProps {
  children: ReactNode;
  permiso?: PermisoKey;
  roles?: RoleId | RoleId[];
  requireAuth?: boolean;
  fallback?: ReactNode;
  accessDeniedMessage?: string;
}

export function ProtectedRoute({
  children,
  permiso,
  roles,
  requireAuth = true,
  fallback,
  accessDeniedMessage,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasRole } = useUser();

  // Mostrar loading mientras carga
  if (isLoading) {
    return (
      <AccessDeniedContainer>
        <div>Cargando...</div>
      </AccessDeniedContainer>
    );
  }

  // Verificar autenticación
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDenied
        message="Debes iniciar sesión para acceder a esta sección."
        showBackButton={false}
      />
    );
  }

  // Verificar permiso
  if (permiso && !hasPermission(permiso)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied message={accessDeniedMessage} />;
  }

  // Verificar rol
  if (roles && !hasRole(roles)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AccessDenied message={accessDeniedMessage} />;
  }

  return <>{children}</>;
}

// =============================================================================
// HOC PARA RUTAS PROTEGIDAS
// =============================================================================
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

export default ProtectedRoute;
