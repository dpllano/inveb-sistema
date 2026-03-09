/**
 * AprobacionOTsList Component
 * Muestra las OTs pendientes de aprobación
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { workOrdersApi, ApprovalListItem } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type PageType = 'dashboard' | 'crear-ot' | 'editar-ot' | 'gestionar-ot' | 'notificaciones' | 'cascade-form' | 'aprobacion-ots';

interface AprobacionOTsListProps {
  onNavigate: (page: PageType, otId?: number) => void;
}

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

const Badge = styled.span<{ $type?: 'info' | 'warning' | 'success' | 'state' }>`
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

const ActionButton = styled.button<{ $variant?: 'approve' | 'reject' | 'view' }>`
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.25rem;

  ${props => {
    switch (props.$variant) {
      case 'approve':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
          &:hover {
            background: ${theme.colors.success};
            color: white;
          }
        `;
      case 'reject':
        return `
          background: ${theme.colors.danger}15;
          color: ${theme.colors.danger};
          &:hover {
            background: ${theme.colors.danger};
            color: white;
          }
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
          &:hover {
            background: ${theme.colors.primary};
            color: white;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 1rem;
  margin: 0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  background: ${props => props.$active ? theme.colors.primary : 'white'};
  color: ${props => props.$active ? 'white' : theme.colors.textPrimary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
    color: ${props => props.$active ? 'white' : theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TruncatedCell = styled.span`
  display: block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
`;

// Component
export function AprobacionOTsList({ onNavigate }: AprobacionOTsListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const queryClient = useQueryClient();

  // Query para lista de OTs pendientes
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingApproval', page],
    queryFn: () => workOrdersApi.getPendingApproval(page, pageSize),
  });

  // Mutations para aprobar/rechazar
  const approveMutation = useMutation({
    mutationFn: (id: number) => workOrdersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => workOrdersApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApproval'] });
    },
  });

  const handleApprove = useCallback((id: number) => {
    if (window.confirm(`¿Aprobar OT ${id}?`)) {
      approveMutation.mutate(id);
    }
  }, [approveMutation]);

  const handleReject = useCallback((id: number) => {
    if (window.confirm(`¿Rechazar OT ${id}?`)) {
      rejectMutation.mutate(id);
    }
  }, [rejectMutation]);

  const handleView = useCallback((id: number) => {
    onNavigate('gestionar-ot', id);
  }, [onNavigate]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>OTs por Aprobar</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>Volver</BackButton>
        </Header>
        <LoadingSpinner>Cargando...</LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>OTs por Aprobar</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>Volver</BackButton>
        </Header>
        <EmptyState>
          <EmptyIcon>!</EmptyIcon>
          <EmptyText>Error al cargar las OTs pendientes</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  const items = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const total = data?.total || 0;

  return (
    <Container>
      <Header>
        <Title>OTs por Aprobar ({total})</Title>
        <BackButton onClick={() => onNavigate('dashboard')}>Volver</BackButton>
      </Header>

      {items.length === 0 ? (
        <TableContainer>
          <EmptyState>
            <EmptyIcon>&#10003;</EmptyIcon>
            <EmptyText>No hay OTs pendientes de aprobacion</EmptyText>
          </EmptyState>
        </TableContainer>
      ) : (
        <>
          <TableContainer>
            <Table>
              <thead>
                <Tr>
                  <Th style={{ width: '60px' }}>OT</Th>
                  <Th style={{ width: '80px' }}>Creacion</Th>
                  <Th>Creador</Th>
                  <Th>Cliente</Th>
                  <Th>Descripcion</Th>
                  <Th style={{ width: '80px' }}>Canal</Th>
                  <Th style={{ width: '80px' }}>Item</Th>
                  <Th style={{ width: '60px' }}>Estado</Th>
                  <Th style={{ width: '120px', textAlign: 'center' }}>Acciones</Th>
                </Tr>
              </thead>
              <tbody>
                {items.map((item: ApprovalListItem) => (
                  <Tr key={item.id}>
                    <Td>
                      <Badge>{item.id}</Badge>
                    </Td>
                    <Td>{formatDate(item.created_at)}</Td>
                    <Td>
                      <TruncatedCell title={item.creador_nombre}>
                        {item.creador_nombre}
                      </TruncatedCell>
                    </Td>
                    <Td>
                      <TruncatedCell title={item.client_name}>
                        {item.client_name}
                      </TruncatedCell>
                    </Td>
                    <Td>
                      <TruncatedCell title={item.descripcion}>
                        {item.descripcion}
                      </TruncatedCell>
                    </Td>
                    <Td>{item.canal || '-'}</Td>
                    <Td>{item.item_tipo || '-'}</Td>
                    <Td>
                      <Badge $type="state" title={item.estado}>
                        {item.estado_abrev}
                      </Badge>
                    </Td>
                    <Td>
                      <ActionsCell>
                        <ActionButton
                          $variant="view"
                          onClick={() => handleView(item.id)}
                          title="Ver OT"
                        >
                          Ver
                        </ActionButton>
                        <ActionButton
                          $variant="approve"
                          onClick={() => handleApprove(item.id)}
                          disabled={approveMutation.isPending}
                          title="Aprobar OT"
                        >
                          &#10003;
                        </ActionButton>
                        <ActionButton
                          $variant="reject"
                          onClick={() => handleReject(item.id)}
                          disabled={rejectMutation.isPending}
                          title="Rechazar OT"
                        >
                          &#10007;
                        </ActionButton>
                      </ActionsCell>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </PageButton>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <PageButton
                    key={pageNum}
                    $active={pageNum === page}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              })}
              <PageButton
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}

export default AprobacionOTsList;
