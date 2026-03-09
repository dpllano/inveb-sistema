/**
 * MuestrasList Component
 * Lista las muestras de una OT específica con acciones de gestión.
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { muestrasApi, pdfsApi, ESTADO_MUESTRA, type MuestraListItem } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MuestrasListProps {
  otId: number;
  onNavigate: (page: string, id?: number) => void;
  onCreateMuestra: () => void;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
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

const CreateButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 50px;
  background: ${theme.colors.primary};
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.primaryDark};
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

const Badge = styled.span<{ $type?: 'info' | 'warning' | 'success' | 'danger' | 'state' | 'priority' }>`
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
      case 'priority':
        return `
          background: #ff572215;
          color: #ff5722;
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

const EstadoBadge = styled.span<{ $estado: number }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => {
    switch (props.$estado) {
      case 0: // Sin Asignar
        return `background: #6c757d15; color: #6c757d;`;
      case 1: // En Proceso
        return `background: #2196f315; color: #2196f3;`;
      case 2: // Rechazada
        return `background: ${theme.colors.danger}15; color: ${theme.colors.danger};`;
      case 3: // Terminada
        return `background: ${theme.colors.success}15; color: ${theme.colors.success};`;
      case 4: // Anulada
        return `background: #9e9e9e15; color: #9e9e9e;`;
      case 5: // Devuelta
        return `background: #ff980015; color: #ff9800;`;
      case 6: // Sala de Corte
        return `background: #9c27b015; color: #9c27b0;`;
      default:
        return `background: #6c757d15; color: #6c757d;`;
    }
  }}
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' }>`
  padding: 0.35rem 0.6rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.25rem;

  ${props => {
    switch (props.$variant) {
      case 'success':
        return `
          background: ${theme.colors.success}15;
          color: ${theme.colors.success};
          &:hover { background: ${theme.colors.success}; color: white; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.danger}15;
          color: ${theme.colors.danger};
          &:hover { background: ${theme.colors.danger}; color: white; }
        `;
      case 'warning':
        return `
          background: #ffc10715;
          color: #ffc107;
          &:hover { background: #ffc107; color: white; }
        `;
      case 'info':
        return `
          background: #2196f315;
          color: #2196f3;
          &:hover { background: #2196f3; color: white; }
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
          &:hover { background: ${theme.colors.primary}; color: white; }
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

const ActionsCell = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const TruncatedCell = styled.span`
  display: block;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PriorityIcon = styled.span`
  color: #ff5722;
  font-weight: bold;
  margin-right: 0.25rem;
`;

const Modal = styled.div`
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
  padding: 1.5rem;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: ${theme.colors.textPrimary};
`;

const ModalInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
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
  justify-content: flex-end;
  gap: 0.5rem;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.$primary ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  background: ${props => props.$primary ? theme.colors.primary : 'white'};
  color: ${props => props.$primary ? 'white' : theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Component
export function MuestrasList({ otId, onNavigate, onCreateMuestra }: MuestrasListProps) {
  const queryClient = useQueryClient();
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showSalaCorteModal, setShowSalaCorteModal] = useState(false);
  const [selectedMuestraId, setSelectedMuestraId] = useState<number | null>(null);
  const [observacion, setObservacion] = useState('');
  const [selectedSalaCorte, setSelectedSalaCorte] = useState<number | null>(null);

  // Query para lista de muestras
  const { data, isLoading, error } = useQuery({
    queryKey: ['muestras', otId],
    queryFn: () => muestrasApi.listByOT(otId),
  });

  // Query para opciones (salas de corte)
  const { data: options } = useQuery({
    queryKey: ['muestras-options'],
    queryFn: () => muestrasApi.getOptions(),
  });

  // Mutations
  const terminarMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.terminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['muestras', otId] }),
  });

  const rechazarMutation = useMutation({
    mutationFn: ({ id, obs }: { id: number; obs?: string }) => muestrasApi.rechazar(id, obs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras', otId] });
      setShowRechazoModal(false);
      setObservacion('');
    },
  });

  const anularMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.anular(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['muestras', otId] }),
  });

  const devolverMutation = useMutation({
    mutationFn: ({ id, obs }: { id: number; obs?: string }) => muestrasApi.devolver(id, obs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras', otId] });
      setShowDevolucionModal(false);
      setObservacion('');
    },
  });

  const togglePrioritariaMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.togglePrioritaria(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['muestras', otId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['muestras', otId] }),
  });

  const salaCorteAssignMutation = useMutation({
    mutationFn: ({ id, salaId }: { id: number; salaId: number }) => muestrasApi.asignarSalaCorte(id, salaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras', otId] });
      setShowSalaCorteModal(false);
      setSelectedSalaCorte(null);
    },
  });

  const iniciarProcesoMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.iniciarProceso(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['muestras', otId] }),
  });

  // Handlers
  const handleTerminar = useCallback((id: number) => {
    if (window.confirm('¿Marcar muestra como terminada?')) {
      terminarMutation.mutate(id);
    }
  }, [terminarMutation]);

  const handleRechazar = useCallback((id: number) => {
    setSelectedMuestraId(id);
    setShowRechazoModal(true);
  }, []);

  const handleAnular = useCallback((id: number) => {
    if (window.confirm('¿Anular esta muestra?')) {
      anularMutation.mutate(id);
    }
  }, [anularMutation]);

  const handleDevolver = useCallback((id: number) => {
    setSelectedMuestraId(id);
    setShowDevolucionModal(true);
  }, []);

  const handleTogglePrioritaria = useCallback((id: number) => {
    togglePrioritariaMutation.mutate(id);
  }, [togglePrioritariaMutation]);

  const handleDelete = useCallback((id: number) => {
    if (window.confirm('¿Eliminar esta muestra? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleAsignarSalaCorte = useCallback((id: number) => {
    setSelectedMuestraId(id);
    setShowSalaCorteModal(true);
  }, []);

  const handleIniciarProceso = useCallback((id: number) => {
    if (window.confirm('¿Iniciar proceso de esta muestra?')) {
      iniciarProcesoMutation.mutate(id);
    }
  }, [iniciarProcesoMutation]);

  const confirmRechazar = () => {
    if (selectedMuestraId) {
      rechazarMutation.mutate({ id: selectedMuestraId, obs: observacion });
    }
  };

  const confirmDevolver = () => {
    if (selectedMuestraId) {
      devolverMutation.mutate({ id: selectedMuestraId, obs: observacion });
    }
  };

  const confirmSalaCorte = () => {
    if (selectedMuestraId && selectedSalaCorte) {
      salaCorteAssignMutation.mutate({ id: selectedMuestraId, salaId: selectedSalaCorte });
    }
  };

  // Determinar acciones disponibles según estado
  const getAvailableActions = (item: MuestraListItem) => {
    const actions: JSX.Element[] = [];
    const estado = item.estado;

    // Siempre permitir ver detalles
    actions.push(
      <ActionButton
        key="ver"
        $variant="primary"
        onClick={() => onNavigate('muestra-detalle', item.id)}
        title="Ver detalle"
      >
        Ver
      </ActionButton>
    );

    // Etiquetas PDF (siempre disponibles)
    actions.push(
      <ActionButton
        key="etq-prod"
        $variant="info"
        onClick={() => pdfsApi.downloadEtiquetaMuestra(item.id, 'producto')}
        title="Etiqueta Producto (10x10cm)"
      >
        Etq
      </ActionButton>
    );
    actions.push(
      <ActionButton
        key="etq-cli"
        $variant="info"
        onClick={() => pdfsApi.downloadEtiquetaMuestra(item.id, 'cliente')}
        title="Etiqueta Cliente (A4)"
      >
        Envío
      </ActionButton>
    );

    // Prioridad (siempre disponible excepto terminada/anulada)
    if (estado !== 3 && estado !== 4) {
      actions.push(
        <ActionButton
          key="priority"
          $variant={item.prioritaria ? 'warning' : 'info'}
          onClick={() => handleTogglePrioritaria(item.id)}
          title={item.prioritaria ? 'Quitar prioridad' : 'Marcar prioritaria'}
          disabled={togglePrioritariaMutation.isPending}
        >
          {item.prioritaria ? '★' : '☆'}
        </ActionButton>
      );
    }

    switch (estado) {
      case 0: // Sin Asignar
        actions.push(
          <ActionButton
            key="sala"
            $variant="info"
            onClick={() => handleAsignarSalaCorte(item.id)}
            title="Asignar sala de corte"
          >
            Sala
          </ActionButton>
        );
        actions.push(
          <ActionButton
            key="delete"
            $variant="danger"
            onClick={() => handleDelete(item.id)}
            title="Eliminar"
            disabled={deleteMutation.isPending}
          >
            ✕
          </ActionButton>
        );
        break;

      case 1: // En Proceso
        actions.push(
          <ActionButton
            key="terminar"
            $variant="success"
            onClick={() => handleTerminar(item.id)}
            title="Terminar"
            disabled={terminarMutation.isPending}
          >
            ✓
          </ActionButton>
        );
        actions.push(
          <ActionButton
            key="rechazar"
            $variant="danger"
            onClick={() => handleRechazar(item.id)}
            title="Rechazar"
          >
            ✕
          </ActionButton>
        );
        actions.push(
          <ActionButton
            key="devolver"
            $variant="warning"
            onClick={() => handleDevolver(item.id)}
            title="Devolver"
          >
            ↩
          </ActionButton>
        );
        break;

      case 6: // Sala de Corte
        actions.push(
          <ActionButton
            key="iniciar"
            $variant="info"
            onClick={() => handleIniciarProceso(item.id)}
            title="Iniciar proceso"
            disabled={iniciarProcesoMutation.isPending}
          >
            ▶
          </ActionButton>
        );
        break;

      case 3: // Terminada
      case 4: // Anulada
        // Sin acciones adicionales
        break;

      default:
        // Para otros estados, permitir anular si no está anulada
        if (estado !== 4) {
          actions.push(
            <ActionButton
              key="anular"
              $variant="danger"
              onClick={() => handleAnular(item.id)}
              title="Anular"
              disabled={anularMutation.isPending}
            >
              Anular
            </ActionButton>
          );
        }
    }

    return actions;
  };

  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Muestras de OT #{otId}</Title>
          <BackButton onClick={() => onNavigate('gestionar-ot', otId)}>Volver a OT</BackButton>
        </Header>
        <LoadingSpinner>Cargando...</LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Muestras de OT #{otId}</Title>
          <BackButton onClick={() => onNavigate('gestionar-ot', otId)}>Volver a OT</BackButton>
        </Header>
        <EmptyState>
          <EmptyIcon>!</EmptyIcon>
          <EmptyText>Error al cargar las muestras</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <Container>
      <Header>
        <Title>Muestras de OT #{otId} ({total})</Title>
        <HeaderActions>
          <CreateButton onClick={onCreateMuestra}>+ Nueva Muestra</CreateButton>
          <BackButton onClick={() => onNavigate('gestionar-ot', otId)}>Volver a OT</BackButton>
        </HeaderActions>
      </Header>

      {items.length === 0 ? (
        <TableContainer>
          <EmptyState>
            <EmptyIcon>📦</EmptyIcon>
            <EmptyText>No hay muestras para esta OT</EmptyText>
          </EmptyState>
        </TableContainer>
      ) : (
        <TableContainer>
          <Table>
            <thead>
              <Tr>
                <Th style={{ width: '60px' }}>ID</Th>
                <Th style={{ width: '90px' }}>Estado</Th>
                <Th>CAD</Th>
                <Th>Cartón</Th>
                <Th>Sala Corte</Th>
                <Th style={{ width: '80px' }}>Cantidad</Th>
                <Th style={{ width: '100px' }}>Creado</Th>
                <Th>Creador</Th>
                <Th style={{ width: '180px' }}>Acciones</Th>
              </Tr>
            </thead>
            <tbody>
              {items.map((item: MuestraListItem) => (
                <Tr key={item.id}>
                  <Td>
                    {item.prioritaria && <PriorityIcon title="Prioritaria">★</PriorityIcon>}
                    <Badge>{item.id}</Badge>
                  </Td>
                  <Td>
                    <EstadoBadge $estado={item.estado}>
                      {ESTADO_MUESTRA[item.estado as keyof typeof ESTADO_MUESTRA] || 'Desconocido'}
                    </EstadoBadge>
                  </Td>
                  <Td>
                    <TruncatedCell title={item.cad || ''}>
                      {item.cad || '-'}
                    </TruncatedCell>
                  </Td>
                  <Td>
                    <TruncatedCell title={item.carton || ''}>
                      {item.carton || '-'}
                    </TruncatedCell>
                  </Td>
                  <Td>
                    <TruncatedCell title={item.sala_corte || ''}>
                      {item.sala_corte || '-'}
                    </TruncatedCell>
                  </Td>
                  <Td>{item.cantidad_total}</Td>
                  <Td>{item.created_at}</Td>
                  <Td>
                    <TruncatedCell title={item.creador_nombre || ''}>
                      {item.creador_nombre || '-'}
                    </TruncatedCell>
                  </Td>
                  <Td>
                    <ActionsCell>
                      {getAvailableActions(item)}
                    </ActionsCell>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}

      {/* Modal Rechazar */}
      {showRechazoModal && (
        <Modal onClick={() => setShowRechazoModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Rechazar Muestra</ModalTitle>
            <ModalInput
              placeholder="Motivo del rechazo (opcional)"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
            />
            <ModalActions>
              <ModalButton onClick={() => setShowRechazoModal(false)}>Cancelar</ModalButton>
              <ModalButton $primary onClick={confirmRechazar} disabled={rechazarMutation.isPending}>
                {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Devolver */}
      {showDevolucionModal && (
        <Modal onClick={() => setShowDevolucionModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Devolver Muestra</ModalTitle>
            <ModalInput
              placeholder="Motivo de la devolución (opcional)"
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
            />
            <ModalActions>
              <ModalButton onClick={() => setShowDevolucionModal(false)}>Cancelar</ModalButton>
              <ModalButton $primary onClick={confirmDevolver} disabled={devolverMutation.isPending}>
                {devolverMutation.isPending ? 'Devolviendo...' : 'Devolver'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Modal Sala de Corte */}
      {showSalaCorteModal && (
        <Modal onClick={() => setShowSalaCorteModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Asignar Sala de Corte</ModalTitle>
            <ModalSelect
              value={selectedSalaCorte || ''}
              onChange={e => setSelectedSalaCorte(Number(e.target.value) || null)}
            >
              <option value="">Seleccionar sala...</option>
              {options?.salas_corte?.map(sala => (
                <option key={sala.id} value={sala.id}>{sala.nombre}</option>
              ))}
            </ModalSelect>
            <ModalActions>
              <ModalButton onClick={() => setShowSalaCorteModal(false)}>Cancelar</ModalButton>
              <ModalButton
                $primary
                onClick={confirmSalaCorte}
                disabled={!selectedSalaCorte || salaCorteAssignMutation.isPending}
              >
                {salaCorteAssignMutation.isPending ? 'Asignando...' : 'Asignar'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default MuestrasList;
