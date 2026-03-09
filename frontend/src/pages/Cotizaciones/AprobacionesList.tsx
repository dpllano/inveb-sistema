/**
 * AprobacionesList Component
 * Lista de Cotizaciones pendientes de aprobacion
 * Permite aprobar, rechazar y ver detalles de cotizaciones
 */

import { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          border-color: ${theme.colors.primary};
          &:hover { background: #002d66; }
        `;
      case 'success':
        return `
          background: ${theme.colors.success};
          color: white;
          border-color: ${theme.colors.success};
          &:hover { background: #218838; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.danger};
          color: white;
          border-color: ${theme.colors.danger};
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: white;
          color: ${theme.colors.textSecondary};
          border-color: ${theme.colors.border};
          &:hover {
            border-color: ${theme.colors.primary};
            color: ${theme.colors.primary};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FiltersCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
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

const Badge = styled.span<{ $type?: 'warning' | 'success' | 'danger' | 'info' }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => {
    switch (props.$type) {
      case 'warning':
        return `
          background: ${theme.colors.warning}15;
          color: ${theme.colors.warning};
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

const ActionButton = styled.button<{ $variant?: 'view' | 'approve' | 'reject' }>`
  padding: 0.35rem 0.65rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 0.25rem;

  ${props => {
    switch (props.$variant) {
      case 'view':
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { background: #002d66; }
        `;
      case 'approve':
        return `
          background: ${theme.colors.success};
          color: white;
          &:hover { background: #218838; }
        `;
      case 'reject':
        return `
          background: ${theme.colors.danger};
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: ${theme.colors.border};
          color: ${theme.colors.textPrimary};
        `;
    }
  }}

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

const TruncatedText = styled.span`
  display: block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MoneyCell = styled.span`
  font-family: 'Consolas', monospace;
  font-weight: 500;
`;

// Modal Components
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
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  color: ${theme.colors.textPrimary};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

// Types
interface CotizacionAprobacion {
  id: number;
  client_id: number;
  cliente_nombre: string;
  usuario_nombre: string;
  user_id: number;
  estado_id: number;
  nivel_aprobacion: number;
  role_can_show: number;
  version_number: number;
  total_detalles: number;
  monto_total_usd?: number;
  created_at: string;
  updated_at: string;
}

interface AprobacionesListProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function AprobacionesList({ onNavigate }: AprobacionesListProps) {
  // State
  const [cotizaciones, setCotizaciones] = useState<CotizacionAprobacion[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [creadorFilter, setCreadorFilter] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionAprobacion | null>(null);
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cotizaciones pendientes de aprobacion
  const fetchCotizaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', '20');
      params.append('estado_id', '2'); // Por Aprobar

      if (creadorFilter) {
        params.append('user_id', creadorFilter);
      }
      if (searchTerm) {
        params.append('cotizacion_id', searchTerm);
      }

      const response = await fetch(`${API_BASE_URL}/cotizaciones/?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al cargar cotizaciones');
      }

      const data = await response.json();
      setCotizaciones(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      setErrorMessage('Error al cargar las cotizaciones pendientes');
      // Usar datos de ejemplo si la API falla
      setCotizaciones([
        {
          id: 1,
          client_id: 1,
          cliente_nombre: 'Vina Concha y Toro S.A.',
          usuario_nombre: 'Juan Perez',
          user_id: 1,
          estado_id: 2,
          nivel_aprobacion: 1,
          role_can_show: 3,
          version_number: 1,
          total_detalles: 3,
          monto_total_usd: 12500.00,
          created_at: '2024-01-15T10:30:00',
          updated_at: '2024-01-15T10:30:00',
        },
        {
          id: 2,
          client_id: 2,
          cliente_nombre: 'Frutas del Sur Ltda.',
          usuario_nombre: 'Maria Garcia',
          user_id: 2,
          estado_id: 2,
          nivel_aprobacion: 2,
          role_can_show: 15,
          version_number: 1,
          total_detalles: 2,
          monto_total_usd: 8750.50,
          created_at: '2024-01-14T14:20:00',
          updated_at: '2024-01-14T14:20:00',
        },
      ]);
      setTotal(2);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, creadorFilter]);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setCreadorFilter('');
    setPage(1);
  }, []);

  const handleView = useCallback((id: number) => {
    onNavigate('cotizacion-editar', id);
  }, [onNavigate]);

  const openApprovalModal = useCallback((cotizacion: CotizacionAprobacion, action: 'aprobar' | 'rechazar') => {
    setSelectedCotizacion(cotizacion);
    setModalAction(action);
    setObservacion('');
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedCotizacion(null);
    setObservacion('');
    setIsSubmitting(false);
  }, []);

  const handleSubmitApproval = useCallback(async () => {
    if (!selectedCotizacion) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/cotizaciones/${selectedCotizacion.id}/gestionar-aprobacion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: modalAction,
            motivo: observacion,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al procesar la aprobacion');
      }

      const actionText = modalAction === 'aprobar' ? 'aprobada' : 'rechazada';
      setSuccessMessage(`Cotizacion #${selectedCotizacion.id} ${actionText} correctamente`);
      closeModal();
      fetchCotizaciones();

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error al procesar la aprobacion');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCotizacion, modalAction, observacion, closeModal, fetchCotizaciones]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getNivelAprobacionLabel = (nivel: number) => {
    switch (nivel) {
      case 1:
        return 'Jefe Ventas';
      case 2:
        return 'Gerente Comercial';
      case 3:
        return 'Gerente General';
      default:
        return `Nivel ${nivel}`;
    }
  };

  // Render loading
  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Aprobaciones</Title>
          <HeaderActions>
            <Button onClick={() => onNavigate('cotizaciones')}>
              Ir a Cotizaciones
            </Button>
          </HeaderActions>
        </Header>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando cotizaciones pendientes...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Cotizaciones por Aprobar</Title>
        <HeaderActions>
          <Button onClick={() => fetchCotizaciones()}>
            Actualizar
          </Button>
          <Button onClick={() => onNavigate('cotizaciones')}>
            Ir a Cotizaciones
          </Button>
        </HeaderActions>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* Filters */}
      <FiltersCard>
        <form onSubmit={handleSearch}>
          <FiltersGrid>
            <FormGroup>
              <Label>N Cotizacion</Label>
              <Input
                type="text"
                placeholder="ID de cotizacion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Creador</Label>
              <Select
                value={creadorFilter}
                onChange={(e) => setCreadorFilter(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="1">Juan Perez</option>
                <option value="2">Maria Garcia</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>&nbsp;</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button type="submit" $variant="primary">Filtrar</Button>
                <Button type="button" onClick={handleClearFilters}>Limpiar</Button>
              </div>
            </FormGroup>
          </FiltersGrid>
        </form>
      </FiltersCard>

      <ResultsInfo>
        {total === 0
          ? 'No hay cotizaciones pendientes de aprobacion'
          : `${total} cotizacion${total !== 1 ? 'es' : ''} pendiente${total !== 1 ? 's' : ''} de aprobacion`}
      </ResultsInfo>

      <TableContainer>
        {cotizaciones.length === 0 ? (
          <EmptyState>
            <p>No hay cotizaciones pendientes de aprobacion</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Las cotizaciones aparecen aqui cuando un vendedor solicita su aprobacion.
            </p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Cotizacion N</Th>
                  <Th>Fecha Creacion</Th>
                  <Th>Creador</Th>
                  <Th>Cliente</Th>
                  <Th>N Productos</Th>
                  <Th>Monto Total (USD)</Th>
                  <Th>Version</Th>
                  <Th>Nivel</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map(cotizacion => (
                  <Tr key={cotizacion.id}>
                    <Td>
                      <strong>{cotizacion.id}</strong>
                    </Td>
                    <Td>{formatDate(cotizacion.created_at)}</Td>
                    <Td>{cotizacion.usuario_nombre || '-'}</Td>
                    <Td>
                      <TruncatedText title={cotizacion.cliente_nombre}>
                        {cotizacion.cliente_nombre || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <Badge $type="info">{cotizacion.total_detalles}</Badge>
                    </Td>
                    <Td>
                      <MoneyCell>
                        {cotizacion.monto_total_usd
                          ? formatCurrency(cotizacion.monto_total_usd)
                          : '-'}
                      </MoneyCell>
                    </Td>
                    <Td>{cotizacion.version_number || 1}</Td>
                    <Td>
                      <Badge $type="warning">
                        {getNivelAprobacionLabel(cotizacion.nivel_aprobacion)}
                      </Badge>
                    </Td>
                    <Td>
                      <ActionButton
                        $variant="view"
                        onClick={() => handleView(cotizacion.id)}
                        title="Ver detalle"
                      >
                        Ver
                      </ActionButton>
                      <ActionButton
                        $variant="approve"
                        onClick={() => openApprovalModal(cotizacion, 'aprobar')}
                        title="Aprobar"
                      >
                        Aprobar
                      </ActionButton>
                      <ActionButton
                        $variant="reject"
                        onClick={() => openApprovalModal(cotizacion, 'rechazar')}
                        title="Rechazar"
                      >
                        Rechazar
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

      {/* Modal de Aprobacion/Rechazo */}
      {showModal && selectedCotizacion && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {modalAction === 'aprobar' ? 'Aprobar' : 'Rechazar'} Cotizacion #{selectedCotizacion.id}
            </ModalTitle>

            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Cliente:</strong> {selectedCotizacion.cliente_nombre}</p>
              <p><strong>Creador:</strong> {selectedCotizacion.usuario_nombre}</p>
              <p><strong>Productos:</strong> {selectedCotizacion.total_detalles}</p>
            </div>

            <FormGroup>
              <Label>Observacion {modalAction === 'rechazar' && '(Requerido)'}</Label>
              <TextArea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder={
                  modalAction === 'aprobar'
                    ? 'Ingrese una observacion opcional...'
                    : 'Ingrese el motivo del rechazo...'
                }
                required={modalAction === 'rechazar'}
              />
            </FormGroup>

            <ModalActions>
              <Button onClick={closeModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                $variant={modalAction === 'aprobar' ? 'success' : 'danger'}
                onClick={handleSubmitApproval}
                disabled={isSubmitting || (modalAction === 'rechazar' && !observacion.trim())}
              >
                {isSubmitting
                  ? 'Procesando...'
                  : modalAction === 'aprobar'
                  ? 'Confirmar Aprobacion'
                  : 'Confirmar Rechazo'}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
