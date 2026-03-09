/**
 * AsignacionesList Component
 * Muestra las OTs pendientes de asignación de profesional
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { assignmentsApi, AssignmentListItem, AssignmentFilters, Professional } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type PageType = 'dashboard' | 'crear-ot' | 'editar-ot' | 'gestionar-ot' | 'notificaciones' | 'cascade-form' | 'aprobacion-ots' | 'asignaciones';

interface AsignacionesListProps {
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

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FilterLabel = styled.label`
  font-size: 0.7rem;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 150px;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FilterInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${theme.colors.primary};
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  align-self: flex-end;

  &:hover {
    opacity: 0.9;
  }
`;

const ClearButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  align-self: flex-end;

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

const Badge = styled.span<{ $type?: 'info' | 'warning' | 'success' | 'danger' }>`
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
      case 'danger':
        return `
          background: ${theme.colors.danger}15;
          color: ${theme.colors.danger};
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const ActionButton = styled.button<{ $variant?: 'assign' | 'view' }>`
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.25rem;

  ${props => {
    switch (props.$variant) {
      case 'assign':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
          &:hover {
            background: ${theme.colors.success};
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
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
`;

// Modal styles
const ModalOverlay = styled.div`
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
  padding: 1.5rem;
  min-width: 400px;
  max-width: 500px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: ${theme.colors.textPrimary};
`;

const ModalInfo = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: ${theme.colors.textSecondary};
`;

const ModalSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$primary ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  background: ${props => props.$primary ? theme.colors.primary : 'white'};
  color: ${props => props.$primary ? 'white' : theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Component
export function AsignacionesList({ onNavigate }: AsignacionesListProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AssignmentFilters>({
    page: 1,
    page_size: 20,
  });
  const [tempFilters, setTempFilters] = useState<AssignmentFilters>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOT, setSelectedOT] = useState<AssignmentListItem | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | ''>('');

  const queryClient = useQueryClient();

  // Query para lista de OTs pendientes de asignacion
  const { data, isLoading, error } = useQuery({
    queryKey: ['pendingAssignment', filters],
    queryFn: () => assignmentsApi.getPendingAssignment(filters),
  });

  // Query para profesionales
  const { data: professionals } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => assignmentsApi.getProfessionals(),
    enabled: showAssignModal,
  });

  // Mutation para asignar profesional
  const assignMutation = useMutation({
    mutationFn: ({ otId, profesionalId }: { otId: number; profesionalId: number }) =>
      assignmentsApi.assign(otId, profesionalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAssignment'] });
      setShowAssignModal(false);
      setSelectedOT(null);
      setSelectedProfessional('');
    },
  });

  const handleApplyFilters = useCallback(() => {
    setFilters({
      ...tempFilters,
      page: 1,
      page_size: 20,
    });
    setPage(1);
  }, [tempFilters]);

  const handleClearFilters = useCallback(() => {
    setTempFilters({});
    setFilters({ page: 1, page_size: 20 });
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleOpenAssignModal = useCallback((ot: AssignmentListItem) => {
    setSelectedOT(ot);
    setSelectedProfessional('');
    setShowAssignModal(true);
  }, []);

  const handleAssign = useCallback(() => {
    if (selectedOT && selectedProfessional !== '') {
      assignMutation.mutate({
        otId: selectedOT.id,
        profesionalId: selectedProfessional as number,
      });
    }
  }, [selectedOT, selectedProfessional, assignMutation]);

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

  const getDiasBadgeType = (dias: number): 'info' | 'warning' | 'danger' => {
    if (dias >= 7) return 'danger';
    if (dias >= 3) return 'warning';
    return 'info';
  };

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Asignacion de OTs</Title>
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
          <Title>Asignacion de OTs</Title>
          <BackButton onClick={() => onNavigate('dashboard')}>Volver</BackButton>
        </Header>
        <EmptyState>
          <EmptyIcon>!</EmptyIcon>
          <EmptyText>Error al cargar las OTs pendientes de asignacion</EmptyText>
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
        <Title>Asignacion de OTs ({total})</Title>
        <BackButton onClick={() => onNavigate('dashboard')}>Volver</BackButton>
      </Header>

      {/* Filtros */}
      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Estado Asignacion</FilterLabel>
          <FilterSelect
            value={tempFilters.asignado ?? ''}
            onChange={(e) => setTempFilters(prev => ({
              ...prev,
              asignado: e.target.value === '' ? undefined : e.target.value as 'SI' | 'NO'
            }))}
          >
            <option value="">Todos</option>
            <option value="NO">Sin Asignar</option>
            <option value="SI">Asignados</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Tipo Solicitud</FilterLabel>
          <FilterSelect
            value={tempFilters.tipo_solicitud ?? ''}
            onChange={(e) => setTempFilters(prev => ({
              ...prev,
              tipo_solicitud: e.target.value || undefined
            }))}
          >
            <option value="">Todos</option>
            <option value="NUEVO">Nuevo</option>
            <option value="REPETICION">Repeticion</option>
            <option value="MODIFICACION">Modificacion</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Desde</FilterLabel>
          <FilterInput
            type="date"
            value={tempFilters.date_desde ?? ''}
            onChange={(e) => setTempFilters(prev => ({
              ...prev,
              date_desde: e.target.value || undefined
            }))}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Hasta</FilterLabel>
          <FilterInput
            type="date"
            value={tempFilters.date_hasta ?? ''}
            onChange={(e) => setTempFilters(prev => ({
              ...prev,
              date_hasta: e.target.value || undefined
            }))}
          />
        </FilterGroup>

        <FilterButton onClick={handleApplyFilters}>Filtrar</FilterButton>
        <ClearButton onClick={handleClearFilters}>Limpiar</ClearButton>
      </FiltersContainer>

      {items.length === 0 ? (
        <TableContainer>
          <EmptyState>
            <EmptyIcon>&#10003;</EmptyIcon>
            <EmptyText>No hay OTs pendientes de asignacion</EmptyText>
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
                  <Th>Cliente</Th>
                  <Th>Vendedor</Th>
                  <Th style={{ width: '90px' }}>Tipo</Th>
                  <Th style={{ width: '80px' }}>Canal</Th>
                  <Th>Jerarquia</Th>
                  <Th style={{ width: '80px' }}>CAD</Th>
                  <Th>Profesional</Th>
                  <Th style={{ width: '60px' }}>Dias</Th>
                  <Th style={{ width: '100px', textAlign: 'center' }}>Acciones</Th>
                </Tr>
              </thead>
              <tbody>
                {items.map((item: AssignmentListItem) => (
                  <Tr key={item.id}>
                    <Td>
                      <Badge>{item.id}</Badge>
                    </Td>
                    <Td>{formatDate(item.created_at)}</Td>
                    <Td>
                      <TruncatedCell title={item.client_name}>
                        {item.client_name}
                      </TruncatedCell>
                    </Td>
                    <Td>
                      <TruncatedCell title={item.vendedor_nombre}>
                        {item.vendedor_nombre}
                      </TruncatedCell>
                    </Td>
                    <Td>
                      <Badge $type="info">{item.tipo_solicitud}</Badge>
                    </Td>
                    <Td>{item.canal || '-'}</Td>
                    <Td>
                      <TruncatedCell title={`${item.jerarquia_1 || ''} > ${item.jerarquia_2 || ''} > ${item.jerarquia_3 || ''}`}>
                        {item.jerarquia_1 || '-'}
                      </TruncatedCell>
                    </Td>
                    <Td>{item.cad || '-'}</Td>
                    <Td>
                      <TruncatedCell title={item.profesional_asignado || 'Sin asignar'}>
                        {item.profesional_asignado || (
                          <Badge $type="warning">Sin asignar</Badge>
                        )}
                      </TruncatedCell>
                    </Td>
                    <Td>
                      <Badge $type={getDiasBadgeType(item.dias_sin_asignar)}>
                        {item.dias_sin_asignar}d
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
                        {!item.profesional_asignado && (
                          <ActionButton
                            $variant="assign"
                            onClick={() => handleOpenAssignModal(item)}
                            title="Asignar Profesional"
                          >
                            Asignar
                          </ActionButton>
                        )}
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
                onClick={() => handlePageChange(Math.max(1, page - 1))}
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
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              })}
              <PageButton
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {/* Modal de Asignacion */}
      {showAssignModal && selectedOT && (
        <ModalOverlay onClick={() => setShowAssignModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Asignar Profesional</ModalTitle>
            <ModalInfo>
              OT #{selectedOT.id} - {selectedOT.client_name}
            </ModalInfo>
            <ModalSelect
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Seleccione un profesional...</option>
              {professionals?.map((prof: Professional) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} ({prof.rol})
                </option>
              ))}
            </ModalSelect>
            <ModalActions>
              <ModalButton onClick={() => setShowAssignModal(false)}>
                Cancelar
              </ModalButton>
              <ModalButton
                $primary
                onClick={handleAssign}
                disabled={!selectedProfessional || assignMutation.isPending}
              >
                {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default AsignacionesList;
