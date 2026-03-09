/**
 * Notifications Component
 * Muestra las notificaciones de OT del usuario autenticado
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { useNotificationsList, useMarkNotificationRead } from '../../hooks/useWorkOrders';

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const BackButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 50px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const TableContainer = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem;
  text-align: left;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: ${theme.colors.bgLight};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ $type?: 'info' | 'warning' | 'success' | 'area' | 'state' }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => {
    switch (props.$type) {
      case 'warning':
        return `
          background: #ffc10715;
          color: #ffc107;
        `;
      case 'success':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
        `;
      case 'area':
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
        `;
      case 'state':
        return `
          background: #6c757d15;
          color: #6c757d;
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const DaysBadge = styled.span<{ $days: number }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;

  ${props => {
    if (props.$days > 5) {
      return `
        background: ${theme.colors.danger}15;
        color: ${theme.colors.danger};
      `;
    } else if (props.$days > 2) {
      return `
        background: #ffc10715;
        color: #d9a406;
      `;
    }
    return `
      background: ${theme.colors.success}15;
      color: ${theme.colors.success};
    `;
  }}
`;

const TruncatedText = styled.span`
  display: block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'success' }>`
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.5rem;

  ${props => props.$variant === 'success' ? `
    background: ${theme.colors.success};
    color: white;

    &:hover {
      background: #218838;
    }
  ` : `
    background: ${theme.colors.primary};
    color: white;

    &:hover {
      background: #002d66;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid ${theme.colors.border};
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  background: white;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const ResultsInfo = styled.div`
  margin-bottom: 1rem;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${props => props.$type === 'success' && `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}

  ${props => props.$type === 'error' && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
`;

const ObservationCell = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textSecondary};
  font-style: italic;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Types
interface NotificationsProps {
  onNavigate: (page: string, otId?: number) => void;
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [page, setPage] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useNotificationsList(page, 20);
  const markReadMutation = useMarkNotificationRead();

  const handleMarkRead = useCallback((notificationId: number) => {
    markReadMutation.mutate(notificationId, {
      onSuccess: () => {
        setSuccessMessage('Notificacion marcada como leida');
        setErrorMessage(null);
        setTimeout(() => setSuccessMessage(null), 3000);
      },
      onError: (err: Error) => {
        setErrorMessage(err.message || 'Error al marcar notificacion');
        setSuccessMessage(null);
      },
    });
  }, [markReadMutation]);

  const handleManageOT = useCallback((otId: number) => {
    onNavigate('gestionar-ot', otId);
  }, [onNavigate]);

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Notificaciones</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>
            Volver al Dashboard
          </BackButton>
        </Header>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando notificaciones...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Notificaciones</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>
            Volver al Dashboard
          </BackButton>
        </Header>
        <Alert $type="error">Error al cargar notificaciones. Intente nuevamente.</Alert>
      </Container>
    );
  }

  const notifications = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  return (
    <Container>
      <Header>
        <Title>Notificaciones</Title>
        <BackButton onClick={() => onNavigate('dashboard')}>
          Volver al Dashboard
        </BackButton>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      <ResultsInfo>
        Mostrando {notifications.length} de {total} notificaciones
      </ResultsInfo>

      <TableContainer>
        {notifications.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🔔</EmptyIcon>
            <p>No tienes notificaciones pendientes</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>OT</Th>
                  <Th>Dias</Th>
                  <Th>Cliente</Th>
                  <Th>Descripcion</Th>
                  <Th>Item</Th>
                  <Th>Estado</Th>
                  <Th>Area</Th>
                  <Th>Generador</Th>
                  <Th>Motivo</Th>
                  <Th>Observacion</Th>
                  <Th>Fecha</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(notification => (
                  <Tr key={notification.id}>
                    <Td>
                      <strong>#{notification.work_order_id}</strong>
                    </Td>
                    <Td>
                      <DaysBadge $days={notification.dias_total || 0}>
                        {notification.dias_total || 0}
                      </DaysBadge>
                    </Td>
                    <Td>
                      <TruncatedText title={notification.client_name}>
                        {notification.client_name}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={notification.ot_descripcion}>
                        {notification.ot_descripcion}
                      </TruncatedText>
                    </Td>
                    <Td>{notification.item_tipo || '-'}</Td>
                    <Td>
                      <Badge $type="state">{notification.estado}</Badge>
                    </Td>
                    <Td>
                      {notification.area && (
                        <Badge $type="area">{notification.area}</Badge>
                      )}
                    </Td>
                    <Td>{notification.generador_nombre}</Td>
                    <Td>
                      <TruncatedText title={notification.motivo}>
                        {notification.motivo}
                      </TruncatedText>
                    </Td>
                    <Td>
                      {notification.observacion && (
                        <ObservationCell title={notification.observacion}>
                          {notification.observacion}
                        </ObservationCell>
                      )}
                    </Td>
                    <Td>{notification.created_at}</Td>
                    <Td>
                      <ActionButton
                        $variant="primary"
                        onClick={() => handleManageOT(notification.work_order_id)}
                        title="Gestionar OT"
                      >
                        Gestionar
                      </ActionButton>
                      <ActionButton
                        $variant="success"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={markReadMutation.isPending}
                        title="Marcar como leida"
                      >
                        Leido
                      </ActionButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </PageButton>
                <PageInfo>
                  Pagina {page} de {totalPages}
                </PageInfo>
                <PageButton
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </PageButton>
              </Pagination>
            )}
          </>
        )}
      </TableContainer>
    </Container>
  );
}
