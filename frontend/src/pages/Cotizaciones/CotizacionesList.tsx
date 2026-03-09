/**
 * CotizacionesList Component
 * Lista de Cotizaciones con filtros y acciones CRUD
 * Diseño identico a Laravel version
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cotizacionesApi, type CotizacionListItem, type CotizacionFilters, type CotizacionEstado } from '../../services/api';

// Styled Components - Diseño Laravel
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 400;
  color: #333;
  margin: 0;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 50px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
`;

const FiltersContainer = styled.div`
  background: white;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
`;

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 120px;
`;

const FilterLabel = styled.label`
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FilterInput = styled.input`
  padding: 0.45rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  width: 100%;
  background: white;

  &:focus {
    outline: none;
    border-color: #17a2b8;
    box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.15);
  }

  &::placeholder {
    color: #999;
  }
`;

const FilterSelect = styled.select`
  padding: 0.45rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  min-width: 140px;
  background: white;

  &:focus {
    outline: none;
    border-color: #17a2b8;
  }
`;

const FilterButton = styled.button`
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
  }
`;

const TableCard = styled.div`
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #343a40 0%, #23272b 100%);
  color: white;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: none;
  white-space: nowrap;
  border: none;
`;

const Td = styled.td`
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
  text-align: center;
  font-size: 0.82rem;
  color: #333;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f9fa;
  }

  &:last-child td {
    border-bottom: none;
  }
`;

// Badges de estado igual a Laravel
const StateBadge = styled.span<{ $state: string }>`
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;

  ${props => {
    switch (props.$state) {
      case 'rechazada':
        return `background: #dc3545; color: white;`;
      case 'liberada':
      case 'aprobada':
      case 'vigente':
        return `background: #28a745; color: white;`;
      case 'por_aprobar':
      case 'pendiente':
        return `background: #ffc107; color: #333;`;
      case 'borrador':
        return `background: #6c757d; color: white;`;
      case 'vencida':
        return `background: #6c757d; color: white;`;
      default:
        return `background: #17a2b8; color: white;`;
    }
  }}
`;

// Iconos de productos
const ProductIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
`;

const ProductIcon = styled.span<{ $type: 'box' | 'thumbsUp' | 'thumbsDown' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;

  ${props => {
    switch (props.$type) {
      case 'box':
        return `color: #333;`;
      case 'thumbsUp':
        return `color: #28a745;`;
      case 'thumbsDown':
        return `color: #dc3545;`;
      default:
        return `color: #333;`;
    }
  }}
`;

// Botones de acción como iconos
const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.25rem;
`;

const IconButton = styled.button<{ $color?: string }>`
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: all 0.15s;
  background: ${props => props.$color || '#6c757d'};
  color: white;

  &:hover {
    opacity: 0.85;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const OTLink = styled.span`
  color: #17a2b8;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #ddd;
  border-top-color: #17a2b8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 4px;
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

interface CotizacionesListProps {
  onNavigate: (page: string, id?: number) => void;
}

// Mapeo de estados Laravel
const estadoMapLaravel: Record<number, { label: string; key: string }> = {
  1: { label: 'Borrador', key: 'borrador' },
  2: { label: 'Por Aprobar', key: 'por_aprobar' },
  3: { label: 'Liberada', key: 'liberada' },
  4: { label: 'Vigente', key: 'vigente' },
  5: { label: 'Vencida', key: 'vencida' },
  6: { label: 'Rechazada', key: 'rechazada' },
};

export default function CotizacionesList({ onNavigate }: CotizacionesListProps) {
  const queryClient = useQueryClient();

  // Filtros state
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [hasta, setHasta] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [numeroCotizacion, setNumeroCotizacion] = useState('');
  const [clienteFilter, setClienteFilter] = useState<string[]>([]);
  const [estadoFilter, setEstadoFilter] = useState<string[]>([]);
  const [otFilter, setOtFilter] = useState('');
  const [cadFilter, setCadFilter] = useState('');

  const [filters, setFilters] = useState<CotizacionFilters>({
    page: 1,
    page_size: 50,
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Query para listar cotizaciones
  const { data, isLoading, error } = useQuery({
    queryKey: ['cotizaciones', filters],
    queryFn: () => cotizacionesApi.list(filters),
  });

  // Query para estados
  const { data: estados } = useQuery({
    queryKey: ['cotizacion-estados'],
    queryFn: () => cotizacionesApi.getEstados(),
  });

  // Query para clientes (simplificado - pendiente implementación)
  // const { data: clientes } = useQuery({
  //   queryKey: ['clientes-cotizacion'],
  //   queryFn: async () => {
  //     return [];
  //   },
  // });

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: number) => cotizacionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
      setSuccessMessage('Cotización eliminada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Error al eliminar cotización');
      setTimeout(() => setErrorMessage(null), 5000);
    },
  });

  // Mutation para duplicar (para uso futuro)
  // const duplicarMutation = useMutation({
  //   mutationFn: (id: number) => cotizacionesApi.duplicar(id),
  //   onSuccess: (result) => {
  //     queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
  //     setSuccessMessage(`Cotización duplicada. Nueva ID: ${result.nueva_id}`);
  //     setTimeout(() => setSuccessMessage(null), 3000);
  //   },
  //   onError: (err: Error) => {
  //     setErrorMessage(err.message || 'Error al duplicar cotización');
  //     setTimeout(() => setErrorMessage(null), 5000);
  //   },
  // });

  // Handlers
  const handleFilter = useCallback(() => {
    const newFilters: CotizacionFilters = {
      page: 1,
      page_size: 50,
    };

    if (desde) newFilters.date_desde = desde;
    if (hasta) newFilters.date_hasta = hasta;
    if (numeroCotizacion) newFilters.cotizacion_id = parseInt(numeroCotizacion, 10);
    if (estadoFilter.length > 0) newFilters.estado_id = estadoFilter.map(e => parseInt(e, 10));

    setFilters(newFilters);
  }, [desde, hasta, numeroCotizacion, estadoFilter]);

  const handleCreate = useCallback(() => {
    onNavigate('cotizacion-nueva');
  }, [onNavigate]);

  const handleView = useCallback((id: number) => {
    onNavigate('cotizacion-editar', id);
  }, [onNavigate]);

  const handleEdit = useCallback((id: number) => {
    onNavigate('cotizacion-editar', id);
  }, [onNavigate]);

  // handleCopy for future use
  // const handleCopy = useCallback((id: number) => {
  //   if (window.confirm('¿Desea duplicar esta cotización?')) {
  //     duplicarMutation.mutate(id);
  //   }
  // }, [duplicarMutation]);

  const handleDelete = useCallback((id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta cotización?')) return;
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const formatDateSimple = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}\n${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  const getEstadoBadge = (estado_id: number) => {
    const estado = estadoMapLaravel[estado_id] || { label: 'Desconocido', key: 'default' };
    return <StateBadge $state={estado.key}>{estado.label}</StateBadge>;
  };

  // Render loading
  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Cotizaciones</Title>
          <CreateButton onClick={handleCreate}>Crear Cotización</CreateButton>
        </Header>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando cotizaciones...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  // Render error
  if (error) {
    return (
      <Container>
        <Header>
          <Title>Cotizaciones</Title>
          <CreateButton onClick={handleCreate}>Crear Cotización</CreateButton>
        </Header>
        <Alert $type="error">Error al cargar cotizaciones: {(error as Error).message}</Alert>
      </Container>
    );
  }

  const cotizaciones = data?.items || [];

  return (
    <Container>
      <Header>
        <Title>Cotizaciones</Title>
        <CreateButton onClick={handleCreate}>Crear Cotización</CreateButton>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* Filtros - Estilo Laravel */}
      <FiltersContainer>
        <FiltersRow>
          <FilterGroup>
            <FilterLabel>DESDE</FilterLabel>
            <FilterInput
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>HASTA</FilterLabel>
            <FilterInput
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>N° DE COTIZACION</FilterLabel>
            <FilterInput
              type="text"
              value={numeroCotizacion}
              onChange={(e) => setNumeroCotizacion(e.target.value)}
              placeholder=""
            />
          </FilterGroup>

          <FilterGroup style={{ minWidth: '160px' }}>
            <FilterLabel>CLIENTE</FilterLabel>
            <FilterSelect
              value={clienteFilter[0] || ''}
              onChange={(e) => setClienteFilter(e.target.value ? [e.target.value] : [])}
            >
              <option value="">Selecciona...</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup style={{ minWidth: '160px' }}>
            <FilterLabel>ESTADO</FilterLabel>
            <FilterSelect
              value={estadoFilter[0] || ''}
              onChange={(e) => setEstadoFilter(e.target.value ? [e.target.value] : [])}
            >
              <option value="">Selecciona...</option>
              {estados?.map((estado: CotizacionEstado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>OT</FilterLabel>
            <FilterSelect
              value={otFilter}
              onChange={(e) => setOtFilter(e.target.value)}
            >
              <option value="">Selecciona...</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>CAD</FilterLabel>
            <FilterSelect
              value={cadFilter}
              onChange={(e) => setCadFilter(e.target.value)}
            >
              <option value="">Selecciona...</option>
            </FilterSelect>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>&nbsp;</FilterLabel>
            <FilterButton onClick={handleFilter}>
              Filtrar Cotización
            </FilterButton>
          </FilterGroup>
        </FiltersRow>
      </FiltersContainer>

      {/* Tabla - Estilo Laravel */}
      <TableCard>
        {cotizaciones.length === 0 ? (
          <EmptyState>
            <p>No se encontraron cotizaciones</p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Cotización N°</Th>
                <Th>N° de Productos</Th>
                <Th>Creador</Th>
                <Th>Cliente</Th>
                <Th>Fecha Creación<br/>1ra Ver.</Th>
                <Th>Fecha Creación<br/>Ult. Ver.</Th>
                <Th>Descrip.</Th>
                <Th>CAD</Th>
                <Th>OT</Th>
                <Th>N° Versión</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((cotizacion: CotizacionListItem) => (
                <Tr key={cotizacion.id}>
                  <Td>
                    <strong>{cotizacion.id}</strong>
                  </Td>
                  <Td>
                    <ProductIcons>
                      <ProductIcon $type="box">
                        📦 {cotizacion.total_detalles || 0}
                      </ProductIcon>
                      <ProductIcon $type="thumbsUp">
                        👍 0
                      </ProductIcon>
                      <ProductIcon $type="thumbsDown">
                        👎 0
                      </ProductIcon>
                    </ProductIcons>
                  </Td>
                  <Td>{cotizacion.usuario_nombre || 'Vendedor Ventas'}</Td>
                  <Td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cotizacion.cliente_nombre || '-'}
                  </Td>
                  <Td style={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>
                    {formatDateSimple(cotizacion.created_at)}
                  </Td>
                  <Td style={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>
                    {formatDateSimple(cotizacion.updated_at || cotizacion.created_at)}
                  </Td>
                  <Td>
                    {cotizacion.primer_detalle_descripcion || '-'}
                  </Td>
                  <Td>
                    {cotizacion.primer_detalle_cad ? <OTLink>{cotizacion.primer_detalle_cad}</OTLink> : '-'}
                  </Td>
                  <Td>
                    {cotizacion.primer_detalle_ot ? <OTLink>{cotizacion.primer_detalle_ot}</OTLink> : '-'}
                  </Td>
                  <Td>
                    {cotizacion.version_number || 1}
                  </Td>
                  <Td>
                    {getEstadoBadge(cotizacion.estado_id)}
                  </Td>
                  <Td>
                    <ActionButtons>
                      {/* Editar/Ver */}
                      <IconButton
                        $color="#ffc107"
                        onClick={() => handleEdit(cotizacion.id)}
                        title="Editar"
                      >
                        ✏️
                      </IconButton>
                      {/* Ver carpeta/detalles */}
                      <IconButton
                        $color="#17a2b8"
                        onClick={() => handleView(cotizacion.id)}
                        title="Ver detalles"
                      >
                        📁
                      </IconButton>
                      {/* Eliminar - solo borradores */}
                      {cotizacion.estado_id === 1 && (
                        <IconButton
                          $color="#dc3545"
                          onClick={() => handleDelete(cotizacion.id)}
                          disabled={deleteMutation.isPending}
                          title="Eliminar"
                        >
                          🗑️
                        </IconButton>
                      )}
                    </ActionButtons>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableCard>
    </Container>
  );
}
