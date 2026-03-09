/**
 * AprobacionExternaCotizaciones - Pantalla para aprobar/rechazar cotizaciones como vendedor externo
 * Basado en: Laravel aprobar_externo.blade.php y aprobacion-cotizaciones-externo.blade.php
 */
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { cotizacionesApi } from '../../services/api';

// =============================================
// STYLED COMPONENTS
// =============================================

const Container = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const Title = styled.h1`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h2};
  font-weight: ${theme.typography.weights.bold};
  margin: 0;
`;

const FiltersCard = styled.div`
  background: ${theme.colors.bgWhite};
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.sm};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  align-items: end;
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

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  font-weight: ${theme.typography.weights.medium};
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  ${({ $variant = 'primary' }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${theme.colors.success};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'danger':
        return `
          background: ${theme.colors.danger};
          color: white;
          &:hover { opacity: 0.9; }
        `;
      case 'secondary':
        return `
          background: ${theme.colors.bgLight};
          color: ${theme.colors.textPrimary};
          border: 1px solid ${theme.colors.border};
          &:hover { background: ${theme.colors.bgMedium}; }
        `;
      default:
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover { opacity: 0.9; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${theme.colors.bgWhite};
  border-radius: ${theme.radius.lg};
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
`;

const Th = styled.th`
  background: ${theme.colors.primary};
  color: white;
  padding: ${theme.spacing.md};
  text-align: left;
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.semibold};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  font-size: ${theme.typography.sizes.small};
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:hover {
    background: ${theme.colors.bgLight};
  }
`;

const Badge = styled.span<{ $variant?: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.tiny};
  font-weight: ${theme.typography.weights.medium};

  ${({ $variant = 'info' }) => {
    switch ($variant) {
      case 'success':
        return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
      case 'warning':
        return `background: ${theme.colors.warning}20; color: ${theme.colors.warning};`;
      case 'danger':
        return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
      default:
        return `background: ${theme.colors.primary}20; color: ${theme.colors.primary};`;
    }
  }}
`;

const DiasBadge = styled.span<{ $dias: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.radius.full};
  font-size: ${theme.typography.sizes.tiny};
  font-weight: ${theme.typography.weights.bold};

  ${({ $dias }) => {
    if ($dias <= 2) return `background: ${theme.colors.success}; color: white;`;
    if ($dias <= 5) return `background: ${theme.colors.warning}; color: white;`;
    return `background: ${theme.colors.danger}; color: white;`;
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const ActionButton = styled.button<{ $variant?: 'view' | 'approve' | 'reject' }>`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${theme.radius.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  ${({ $variant = 'view' }) => {
    switch ($variant) {
      case 'approve':
        return `
          background: ${theme.colors.success}20;
          color: ${theme.colors.success};
          &:hover { background: ${theme.colors.success}; color: white; }
        `;
      case 'reject':
        return `
          background: ${theme.colors.danger}20;
          color: ${theme.colors.danger};
          &:hover { background: ${theme.colors.danger}; color: white; }
        `;
      default:
        return `
          background: ${theme.colors.primary}20;
          color: ${theme.colors.primary};
          &:hover { background: ${theme.colors.primary}; color: white; }
        `;
    }
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl};
  color: ${theme.colors.textSecondary};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl};
  color: ${theme.colors.textSecondary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${theme.radius.md};
  background: ${({ $active }) => $active ? theme.colors.primary : 'white'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h3};
  margin: 0 0 ${theme.spacing.lg} 0;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.xl};
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
`;

const HistorialTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
  font-size: ${theme.typography.sizes.small};

  th, td {
    padding: ${theme.spacing.sm};
    border: 1px solid ${theme.colors.border};
    text-align: left;
  }

  th {
    background: ${theme.colors.bgLight};
    font-weight: ${theme.typography.weights.semibold};
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.lg};
  background: ${({ $type }) => $type === 'success' ? `${theme.colors.success}15` : `${theme.colors.danger}15`};
  color: ${({ $type }) => $type === 'success' ? theme.colors.success : theme.colors.danger};
`;

// =============================================
// TYPES
// =============================================

interface CotizacionPendiente {
  id: number;
  client_id: number;
  cliente_nombre: string;
  creador_nombre: string;
  estado_nombre: string;
  total_detalles: number;
  detalles_ganados: number;
  detalles_perdidos: number;
  primer_detalle_descripcion: string | null;
  primer_detalle_cad: string | null;
  dias_pendiente: number;
  version_number: number | null;
  created_at: string;
}

interface HistorialItem {
  id: number;
  usuario_nombre: string;
  rol_nombre: string;
  action_made: string;
  motivo: string | null;
  created_at: string;
}

interface AprobacionExternaCotizacionesProps {
  onNavigate: (page: string, id?: number) => void;
}

// =============================================
// COMPONENT
// =============================================

export default function AprobacionExternaCotizaciones({ onNavigate }: AprobacionExternaCotizacionesProps) {
  // State
  const [cotizaciones, setCotizaciones] = useState<CotizacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    date_desde: '',
    date_hasta: '',
    cotizacion_id: ''
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'aprobar' | 'rechazar' | 'historial'>('aprobar');
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionPendiente | null>(null);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  // Load cotizaciones
  const loadCotizaciones = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 20
      };

      if (filters.date_desde) params.date_desde = filters.date_desde;
      if (filters.date_hasta) params.date_hasta = filters.date_hasta;
      if (filters.cotizacion_id) params.cotizacion_id = parseInt(filters.cotizacion_id);

      const response = await cotizacionesApi.getPendientesAprobacionExterno(params);

      setCotizaciones((response.items || []) as any);
      setTotal(response.total || 0);
      setTotalPages(response.total_pages || 1);
    } catch (err) {
      console.error('Error loading cotizaciones:', err);
      setError('Error al cargar las cotizaciones pendientes');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadCotizaciones();
  }, [loadCotizaciones]);

  // Handlers
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    loadCotizaciones();
  };

  const handleClearFilters = () => {
    setFilters({ date_desde: '', date_hasta: '', cotizacion_id: '' });
    setPage(1);
  };

  const openModal = (cotizacion: CotizacionPendiente, action: 'aprobar' | 'rechazar' | 'historial') => {
    setSelectedCotizacion(cotizacion);
    setModalAction(action);
    setMotivo('');
    setModalOpen(true);

    if (action === 'historial') {
      loadHistorial(cotizacion.id);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCotizacion(null);
    setMotivo('');
    setHistorial([]);
  };

  const loadHistorial = async (cotizacionId: number) => {
    try {
      const response = await cotizacionesApi.getHistorialAprobaciones(cotizacionId);
      setHistorial(response.historial || []);
    } catch (err) {
      console.error('Error loading historial:', err);
    }
  };

  const handleGestionarAprobacion = async () => {
    if (!selectedCotizacion) return;

    setSubmitting(true);
    setError(null);

    try {
      await cotizacionesApi.gestionarAprobacionExterno(selectedCotizacion.id, {
        action: modalAction === 'aprobar' ? 'aprobar' : 'rechazar',
        motivo: motivo || undefined
      });

      setSuccess(`Cotización #${selectedCotizacion.id} ${modalAction === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`);
      closeModal();
      loadCotizaciones();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error gestionando aprobación:', err);
      setError('Error al procesar la acción');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Container>
      <Header>
        <Title>Aprobación Externa de Cotizaciones</Title>
        <Badge $variant="info">{total} pendientes</Badge>
      </Header>

      {success && <Message $type="success">{success}</Message>}
      {error && <Message $type="error">{error}</Message>}

      {/* Filtros */}
      <FiltersCard>
        <FiltersGrid>
          <FormGroup>
            <Label>Fecha Desde</Label>
            <Input
              type="date"
              value={filters.date_desde}
              onChange={(e) => handleFilterChange('date_desde', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Fecha Hasta</Label>
            <Input
              type="date"
              value={filters.date_hasta}
              onChange={(e) => handleFilterChange('date_hasta', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>N° Cotización</Label>
            <Input
              type="number"
              placeholder="ID"
              value={filters.cotizacion_id}
              onChange={(e) => handleFilterChange('cotizacion_id', e.target.value)}
            />
          </FormGroup>

          <FormGroup style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm }}>
            <Button onClick={handleApplyFilters}>Filtrar</Button>
            <Button $variant="secondary" onClick={handleClearFilters}>Limpiar</Button>
          </FormGroup>
        </FiltersGrid>
      </FiltersCard>

      {/* Tabla */}
      {loading ? (
        <LoadingState>Cargando cotizaciones...</LoadingState>
      ) : cotizaciones.length === 0 ? (
        <EmptyState>
          <div style={{ fontSize: '3rem', marginBottom: theme.spacing.md }}>📋</div>
          <div>No hay cotizaciones pendientes de aprobación externa</div>
        </EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>N°</Th>
                <Th>Días</Th>
                <Th>Cliente</Th>
                <Th>Descripción</Th>
                <Th>CAD</Th>
                <Th>Detalles</Th>
                <Th>Versión</Th>
                <Th>Creador</Th>
                <Th>Fecha</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((cot) => (
                <Tr key={cot.id}>
                  <Td><strong>{cot.id}</strong></Td>
                  <Td>
                    <DiasBadge $dias={cot.dias_pendiente}>
                      {cot.dias_pendiente}d
                    </DiasBadge>
                  </Td>
                  <Td>{cot.cliente_nombre || '-'}</Td>
                  <Td>{cot.primer_detalle_descripcion || '-'}</Td>
                  <Td>{cot.primer_detalle_cad || '-'}</Td>
                  <Td>
                    <span>{cot.total_detalles}</span>
                    {cot.detalles_ganados > 0 && (
                      <Badge $variant="success" style={{ marginLeft: '4px' }}>
                        +{cot.detalles_ganados}
                      </Badge>
                    )}
                    {cot.detalles_perdidos > 0 && (
                      <Badge $variant="danger" style={{ marginLeft: '4px' }}>
                        -{cot.detalles_perdidos}
                      </Badge>
                    )}
                  </Td>
                  <Td>v{cot.version_number || 1}</Td>
                  <Td>{cot.creador_nombre || '-'}</Td>
                  <Td>{formatDate(cot.created_at)}</Td>
                  <Td>
                    <ActionButtons>
                      <ActionButton
                        $variant="view"
                        onClick={() => onNavigate('cotizacion-editar', cot.id)}
                        title="Ver detalle"
                      >
                        👁️
                      </ActionButton>
                      <ActionButton
                        $variant="view"
                        onClick={() => openModal(cot, 'historial')}
                        title="Ver historial"
                      >
                        📋
                      </ActionButton>
                      <ActionButton
                        $variant="approve"
                        onClick={() => openModal(cot, 'aprobar')}
                        title="Aprobar"
                      >
                        ✓
                      </ActionButton>
                      <ActionButton
                        $variant="reject"
                        onClick={() => openModal(cot, 'rechazar')}
                        title="Rechazar"
                      >
                        ✕
                      </ActionButton>
                    </ActionButtons>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ←
              </PageButton>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <PageButton
                    key={pageNum}
                    $active={page === pageNum}
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
                →
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && selectedCotizacion && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            {modalAction === 'historial' ? (
              <>
                <ModalTitle>Historial de Aprobaciones - Cotización #{selectedCotizacion.id}</ModalTitle>

                {historial.length === 0 ? (
                  <EmptyState>No hay historial de aprobaciones</EmptyState>
                ) : (
                  <HistorialTable>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Acción</th>
                        <th>Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDate(item.created_at)}</td>
                          <td>{item.usuario_nombre || '-'}</td>
                          <td>{item.rol_nombre}</td>
                          <td>
                            <Badge $variant={item.action_made.includes('Rechazo') ? 'danger' : 'success'}>
                              {item.action_made}
                            </Badge>
                          </td>
                          <td>{item.motivo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </HistorialTable>
                )}

                <ModalActions>
                  <Button $variant="secondary" onClick={closeModal}>Cerrar</Button>
                </ModalActions>
              </>
            ) : (
              <>
                <ModalTitle>
                  {modalAction === 'aprobar' ? '✓ Aprobar' : '✕ Rechazar'} Cotización #{selectedCotizacion.id}
                </ModalTitle>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <p><strong>Cliente:</strong> {selectedCotizacion.cliente_nombre}</p>
                  <p><strong>Descripción:</strong> {selectedCotizacion.primer_detalle_descripcion || '-'}</p>
                  <p><strong>Detalles:</strong> {selectedCotizacion.total_detalles}</p>
                </div>

                <FormGroup>
                  <Label>
                    {modalAction === 'aprobar' ? 'Observaciones (opcional)' : 'Motivo del rechazo'}
                  </Label>
                  <Textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder={modalAction === 'aprobar'
                      ? 'Ingrese observaciones adicionales...'
                      : 'Indique el motivo del rechazo...'
                    }
                    required={modalAction === 'rechazar'}
                  />
                </FormGroup>

                <ModalActions>
                  <Button $variant="secondary" onClick={closeModal} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button
                    $variant={modalAction === 'aprobar' ? 'success' : 'danger'}
                    onClick={handleGestionarAprobacion}
                    disabled={submitting || (modalAction === 'rechazar' && !motivo.trim())}
                  >
                    {submitting ? 'Procesando...' : modalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                  </Button>
                </ModalActions>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
