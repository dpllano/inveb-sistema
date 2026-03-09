/**
 * CrearOTDesdeCotizacion
 * Pantalla para crear OT desde detalles de cotizaciones aprobadas.
 * Permite seleccionar un detalle y tipo de solicitud, y navega a crear OT con datos pre-cargados.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { cotizacionesApi, DetalleParaOTItem, DatosOTFromCotizacion } from '../../services/api';

const Container = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  box-shadow: ${theme.shadows.md};
  padding: ${theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const Title = styled.h2`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h2};
  font-weight: ${theme.typography.weights.semibold};
  margin: 0;
`;

const BackButton = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.bgLight};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${theme.colors.primary}15;
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const InfoCard = styled.div`
  background: ${theme.colors.bgBlueLight};
  border-left: 4px solid ${theme.colors.primary};
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.lg};
`;

const InfoText = styled.p`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.body};
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
`;

const Th = styled.th`
  text-align: left;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.cardHeader};
  color: white;
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.semibold};

  &:first-child {
    border-radius: ${theme.radius.md} 0 0 0;
  }

  &:last-child {
    border-radius: 0 ${theme.radius.md} 0 0;
  }
`;

const Td = styled.td`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  font-size: ${theme.typography.sizes.small};
  color: ${theme.colors.textPrimary};
`;

const Tr = styled.tr`
  &:hover {
    background-color: ${theme.colors.bgLight};
  }
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: ${theme.colors.success};
  color: white;
  border: none;
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${theme.colors.success}dd;
  }
`;

const Badge = styled.span<{ $color?: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: ${({ $color }) => $color || theme.colors.primary}20;
  color: ${({ $color }) => $color || theme.colors.primary};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.tiny};
  font-weight: ${theme.typography.weights.medium};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.lg};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background-color: ${({ $active }) => $active ? theme.colors.primary : 'white'};
  color: ${({ $active }) => $active ? 'white' : theme.colors.textPrimary};
  border: 1px solid ${({ $active }) => $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${theme.radius.sm};
  font-size: ${theme.typography.sizes.small};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.textSecondary};
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: ${theme.shadows.lg};
`;

const ModalTitle = styled.h3`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.typography.sizes.h3};
  margin: 0 0 ${theme.spacing.lg};
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${theme.spacing.xs};
  font-size: ${theme.typography.sizes.small};
  font-weight: ${theme.typography.weights.medium};
  color: ${theme.colors.textPrimary};
`;

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  color: ${theme.colors.textPrimary};
  background-color: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
`;

const CancelButton = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background-color: ${theme.colors.bgLight};
  color: ${theme.colors.textSecondary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${theme.colors.border};
  }
`;

const ConfirmButton = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background-color: ${theme.colors.success};
  color: white;
  border: none;
  border-radius: ${theme.radius.md};
  font-size: ${theme.typography.sizes.body};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${theme.colors.success}dd;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DetalleInfo = styled.div`
  background: ${theme.colors.bgLight};
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.lg};
`;

const DetalleRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing.xs} 0;
  font-size: ${theme.typography.sizes.small};

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
`;

const DetalleLabel = styled.span`
  color: ${theme.colors.textSecondary};
`;

const DetalleValue = styled.span`
  color: ${theme.colors.textPrimary};
  font-weight: ${theme.typography.weights.medium};
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.radius.md};
  margin-bottom: ${theme.spacing.lg};
  background-color: ${({ $type }) => $type === 'success' ? theme.colors.success : theme.colors.danger}15;
  color: ${({ $type }) => $type === 'success' ? theme.colors.success : theme.colors.danger};
  border: 1px solid ${({ $type }) => $type === 'success' ? theme.colors.success : theme.colors.danger}30;
`;

interface CrearOTDesdeCotizacionProps {
  onNavigate: (page: string, id?: number, data?: DatosOTFromCotizacion) => void;
}

const TIPOS_SOLICITUD = [
  { id: 1, nombre: 'Desarrollo Completo' },
  { id: 5, nombre: 'Arte con Material' },
];

export default function CrearOTDesdeCotizacion({ onNavigate }: CrearOTDesdeCotizacionProps) {
  const [detalles, setDetalles] = useState<DetalleParaOTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDetalle, setSelectedDetalle] = useState<DetalleParaOTItem | null>(null);
  const [tipoSolicitud, setTipoSolicitud] = useState<number>(1);
  const [procesando, setProcesando] = useState(false);

  const loadDetalles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cotizacionesApi.getDetallesParaOT(undefined, page, 20);
      setDetalles(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      console.error('Error cargando detalles:', err);
      setError('Error al cargar los detalles de cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadDetalles();
  }, [loadDetalles]);

  const handleCrearOT = (detalle: DetalleParaOTItem) => {
    setSelectedDetalle(detalle);
    setTipoSolicitud(1);
    setShowModal(true);
  };

  const handleConfirmarCrearOT = async () => {
    if (!selectedDetalle) return;

    setProcesando(true);
    try {
      const response = await cotizacionesApi.getDetalleParaOT(
        selectedDetalle.detalle_id,
        tipoSolicitud
      );

      if (response.success) {
        setShowModal(false);
        // Navegar a crear OT con los datos pre-cargados
        onNavigate('crear-ot-desde-cotizacion', undefined, response.datos_ot);
      }
    } catch (err) {
      console.error('Error obteniendo datos para OT:', err);
      setError('Error al preparar los datos para la OT');
    } finally {
      setProcesando(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CL');
    } catch {
      return dateStr;
    }
  };

  const formatDimensions = (l?: number, a?: number, h?: number) => {
    if (!l && !a && !h) return '-';
    return `${l || 0} x ${a || 0} x ${h || 0}`;
  };

  return (
    <Container>
      <Header>
        <Title>Crear OT desde Cotizacion</Title>
        <BackButton onClick={() => onNavigate('cotizaciones')}>
          Volver a Cotizaciones
        </BackButton>
      </Header>

      <InfoCard>
        <InfoText>
          Seleccione un detalle de cotizacion aprobada para crear una nueva Orden de Trabajo.
          Solo se muestran detalles de cotizaciones aprobadas que aun no tienen OT asociada.
        </InfoText>
      </InfoCard>

      {error && (
        <Alert $type="error">{error}</Alert>
      )}

      {loading ? (
        <LoadingSpinner>Cargando detalles...</LoadingSpinner>
      ) : detalles.length === 0 ? (
        <EmptyState>
          <p>No hay detalles disponibles para crear OT.</p>
          <p>Los detalles deben pertenecer a cotizaciones aprobadas.</p>
        </EmptyState>
      ) : (
        <>
          <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.small }}>
            Mostrando {detalles.length} de {total} detalles disponibles
          </p>

          <Table>
            <thead>
              <tr>
                <Th>Cot. #</Th>
                <Th>Cliente</Th>
                <Th>Descripcion</Th>
                <Th>Dimensiones</Th>
                <Th>CAD</Th>
                <Th>Carton</Th>
                <Th>Estado</Th>
                <Th>Fecha</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle) => (
                <Tr key={detalle.detalle_id}>
                  <Td>
                    <strong>#{detalle.cotizacion_id}</strong>
                  </Td>
                  <Td>{detalle.cliente_nombre}</Td>
                  <Td>
                    {detalle.descripcion_material_detalle || detalle.descripcion || '-'}
                  </Td>
                  <Td>
                    {formatDimensions(detalle.largura, detalle.anchura, detalle.altura)}
                  </Td>
                  <Td>{detalle.cad_codigo || '-'}</Td>
                  <Td>{detalle.carton_codigo || '-'}</Td>
                  <Td>
                    <Badge $color={theme.colors.success}>
                      {detalle.estado_nombre}
                    </Badge>
                  </Td>
                  <Td>{formatDate(detalle.cotizacion_fecha)}</Td>
                  <Td>
                    <ActionButton onClick={() => handleCrearOT(detalle)}>
                      Crear OT
                    </ActionButton>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </PageButton>
              <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.small }}>
                Pagina {page} de {totalPages}
              </span>
              <PageButton
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      {/* Modal de Tipo de Solicitud */}
      {showModal && selectedDetalle && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Crear Orden de Trabajo</ModalTitle>

            <DetalleInfo>
              <DetalleRow>
                <DetalleLabel>Cotizacion:</DetalleLabel>
                <DetalleValue>#{selectedDetalle.cotizacion_id}</DetalleValue>
              </DetalleRow>
              <DetalleRow>
                <DetalleLabel>Cliente:</DetalleLabel>
                <DetalleValue>{selectedDetalle.cliente_nombre}</DetalleValue>
              </DetalleRow>
              <DetalleRow>
                <DetalleLabel>Descripcion:</DetalleLabel>
                <DetalleValue>
                  {selectedDetalle.descripcion_material_detalle || selectedDetalle.descripcion || '-'}
                </DetalleValue>
              </DetalleRow>
            </DetalleInfo>

            <FormGroup>
              <Label htmlFor="tipo_solicitud">Tipo de Solicitud *</Label>
              <Select
                id="tipo_solicitud"
                value={tipoSolicitud}
                onChange={(e) => setTipoSolicitud(Number(e.target.value))}
              >
                {TIPOS_SOLICITUD.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <ModalActions>
              <CancelButton onClick={() => setShowModal(false)}>
                Cancelar
              </CancelButton>
              <ConfirmButton
                onClick={handleConfirmarCrearOT}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : 'Continuar'}
              </ConfirmButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
