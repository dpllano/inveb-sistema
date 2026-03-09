/**
 * CotizadorExternoList Component
 * Lista de Cotizaciones para usuarios externos
 * Versión simplificada con filtros reducidos
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';
import { useQuery } from '@tanstack/react-query';
import { cotizacionesApi, type CotizacionListItem, type CotizacionFilters, type CotizacionEstado } from '../../services/api';

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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
  font-size: 0.8rem;
`;

const Th = styled.th`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.6rem 0.5rem;
  text-align: center;
  font-weight: 500;
  font-size: 0.7rem;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
  text-align: center;
`;

const Tr = styled.tr<{ $inactive?: boolean }>`
  ${props => props.$inactive && `
    color: #999;
  `}

  &:hover {
    background: ${theme.colors.bgLight};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const Badge = styled.span<{ $type?: 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'vencida' | 'info' }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => {
    switch (props.$type) {
      case 'borrador':
        return `
          background: #6c757d;
          color: white;
        `;
      case 'pendiente':
        return `
          background: ${theme.colors.warning};
          color: #333;
        `;
      case 'aprobada':
        return `
          background: ${theme.colors.success};
          color: white;
        `;
      case 'rechazada':
        return `
          background: ${theme.colors.danger};
          color: white;
        `;
      case 'vencida':
        return `
          background: #6c757d;
          color: white;
        `;
      default:
        return `
          background: ${theme.colors.primary}15;
          color: ${theme.colors.primary};
        `;
    }
  }}
`;

const ProductCountContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ProductCount = styled.span<{ $type?: 'total' | 'ganados' | 'perdidos' }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;

  ${props => {
    switch (props.$type) {
      case 'ganados':
        return `color: ${theme.colors.success};`;
      case 'perdidos':
        return `color: ${theme.colors.danger};`;
      default:
        return `color: #666;`;
    }
  }}
`;

const ActionButton = styled.button<{ $variant?: 'view' | 'edit' | 'pdf' }>`
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
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
      case 'edit':
        return `
          background: ${theme.colors.warning};
          color: white;
          &:hover { background: #e0a800; }
        `;
      case 'pdf':
        return `
          background: #e74c3c;
          color: white;
          &:hover { background: #c0392b; }
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
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface CotizadorExternoListProps {
  onNavigate: (page: string, id?: number) => void;
}

// Mapeo de estados
const estadoMap: Record<number, { label: string; type: 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'vencida' }> = {
  1: { label: 'Borrador', type: 'borrador' },
  2: { label: 'Pendiente', type: 'pendiente' },
  3: { label: 'Aprobada', type: 'aprobada' },
  4: { label: 'Vigente', type: 'aprobada' },
  5: { label: 'Vencida', type: 'vencida' },
  6: { label: 'Rechazada', type: 'rechazada' },
};

// Helper para obtener fecha hace 3 meses
const getDefaultFromDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date.toISOString().split('T')[0];
};

const getDefaultToDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export default function CotizadorExternoList({ onNavigate }: CotizadorExternoListProps) {
  // State para filtros
  const [filters, setFilters] = useState<CotizacionFilters>({
    page: 1,
    page_size: 20,
    date_desde: getDefaultFromDate(),
    date_hasta: getDefaultToDate(),
  });
  const [searchId, setSearchId] = useState('');
  const [dateDesde, setDateDesde] = useState(getDefaultFromDate());
  const [dateHasta, setDateHasta] = useState(getDefaultToDate());
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [cadFilter, setCadFilter] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Query para listar cotizaciones (usuario externo ve solo las suyas)
  const { data, isLoading, error } = useQuery({
    queryKey: ['cotizaciones-externo', filters],
    queryFn: () => cotizacionesApi.list(filters),
  });

  // Query para estados
  const { data: estados } = useQuery({
    queryKey: ['cotizacion-estados'],
    queryFn: () => cotizacionesApi.getEstados(),
  });

  // Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newFilters: CotizacionFilters = {
      ...filters,
      page: 1,
      date_desde: dateDesde,
      date_hasta: dateHasta,
    };

    if (searchId) {
      newFilters.cotizacion_id = parseInt(searchId, 10);
    } else {
      delete newFilters.cotizacion_id;
    }

    if (estadoFilter) {
      newFilters.estado_id = [parseInt(estadoFilter, 10)];
    } else {
      delete newFilters.estado_id;
    }

    if (cadFilter) {
      newFilters.cad = cadFilter;
    } else {
      delete newFilters.cad;
    }

    setFilters(newFilters);
  }, [filters, searchId, estadoFilter, cadFilter, dateDesde, dateHasta]);

  const handleClearFilters = useCallback(() => {
    setSearchId('');
    setEstadoFilter('');
    setCadFilter('');
    setDateDesde(getDefaultFromDate());
    setDateHasta(getDefaultToDate());
    setFilters({
      page: 1,
      page_size: 20,
      date_desde: getDefaultFromDate(),
      date_hasta: getDefaultToDate(),
    });
  }, []);

  const handleCreate = useCallback(() => {
    onNavigate('cotizacion-externa-nueva');
  }, [onNavigate]);

  const handleViewOrEdit = useCallback((cotizacion: CotizacionListItem) => {
    // Si esta aprobada (estado_id == 3), solo ver
    // Si no, permite editar
    onNavigate('cotizacion-externa-editar', cotizacion.id);
  }, [onNavigate]);

  const handleDownloadPdf = useCallback((id: number) => {
    // Abrir PDF en nueva ventana
    const pdfUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/cotizaciones/${id}/pdf`;
    window.open(pdfUrl, '_blank');
    setSuccessMessage('Descargando PDF...');
    setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado_id: number) => {
    const estado = estadoMap[estado_id] || { label: 'Desconocido', type: 'info' as const };
    return <Badge $type={estado.type}>{estado.label}</Badge>;
  };

  // Render loading
  if (isLoading) {
    return (
      <Container>
        <Header>
          <Title>Cotizaciones</Title>
          <HeaderActions>
            <Button onClick={() => onNavigate('dashboard')}>
              Volver al Dashboard
            </Button>
          </HeaderActions>
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
          <HeaderActions>
            <Button onClick={() => onNavigate('dashboard')}>
              Volver al Dashboard
            </Button>
          </HeaderActions>
        </Header>
        <Alert $type="error">Error al cargar cotizaciones: {(error as Error).message}</Alert>
      </Container>
    );
  }

  const cotizaciones = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.page || 1;

  return (
    <Container>
      <Header>
        <Title>Cotizaciones ({total})</Title>
        <HeaderActions>
          <Button $variant="primary" onClick={handleCreate}>
            Crear Cotizacion
          </Button>
        </HeaderActions>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}

      {/* Filters */}
      <FiltersCard>
        <form onSubmit={handleSearch}>
          <FiltersGrid>
            <FormGroup>
              <Label>Desde</Label>
              <Input
                type="date"
                value={dateDesde}
                onChange={(e) => setDateDesde(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={dateHasta}
                onChange={(e) => setDateHasta(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>N° Cotizacion</Label>
              <Input
                type="number"
                placeholder="ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>Estado</Label>
              <Select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <option value="">Selecciona...</option>
                {estados?.map((estado: CotizacionEstado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>CAD</Label>
              <Input
                type="text"
                placeholder="CAD..."
                value={cadFilter}
                onChange={(e) => setCadFilter(e.target.value)}
              />
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

      <TableContainer>
        {cotizaciones.length === 0 ? (
          <EmptyState>
            <p>No hay cotizaciones actualmente</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Cotizacion N°</Th>
                  <Th>N° de Productos</Th>
                  <Th>Creador</Th>
                  <Th>Cliente</Th>
                  <Th>Fecha 1ra Ver.</Th>
                  <Th>Fecha Ult. Ver.</Th>
                  <Th>Descrip.</Th>
                  <Th>CAD</Th>
                  <Th>OT</Th>
                  <Th>N° Version</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cotizacion: CotizacionListItem) => (
                  <Tr key={cotizacion.id} $inactive={cotizacion.active === 0}>
                    <Td>
                      <strong>{cotizacion.id}</strong>
                    </Td>
                    <Td>
                      <ProductCountContainer>
                        <ProductCount $type="total" title="Total Detalles">
                          {cotizacion.total_detalles || 0}
                        </ProductCount>
                        <ProductCount
                          $type="ganados"
                          title="Detalles Ganados"
                          style={{ opacity: cotizacion.estado_id >= 3 ? 1 : 0.15 }}
                        >
                          +{cotizacion.detalles_ganados || 0}
                        </ProductCount>
                        <ProductCount
                          $type="perdidos"
                          title="Detalles Perdidos"
                          style={{ opacity: cotizacion.estado_id >= 3 ? 1 : 0.15 }}
                        >
                          -{cotizacion.detalles_perdidos || 0}
                        </ProductCount>
                      </ProductCountContainer>
                    </Td>
                    <Td>
                      <TruncatedText title={cotizacion.usuario_nombre || '-'}>
                        {cotizacion.usuario_nombre || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={cotizacion.cliente_nombre || '-'}>
                        {cotizacion.cliente_nombre || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>{formatDateTime(cotizacion.fecha_primera_version || cotizacion.created_at)}</Td>
                    <Td>{formatDateTime(cotizacion.created_at)}</Td>
                    <Td>
                      <TruncatedText title={cotizacion.primer_detalle_descripcion || '-'}>
                        {cotizacion.primer_detalle_descripcion || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>
                      <TruncatedText title={cotizacion.primer_detalle_cad || '-'}>
                        {cotizacion.primer_detalle_cad || '-'}
                      </TruncatedText>
                    </Td>
                    <Td>{cotizacion.primer_detalle_ot || '-'}</Td>
                    <Td>{cotizacion.version_number || '-'}</Td>
                    <Td>{getEstadoBadge(cotizacion.estado_id)}</Td>
                    <Td>
                      <ActionButton
                        $variant={cotizacion.estado_id === 3 ? 'view' : 'edit'}
                        onClick={() => handleViewOrEdit(cotizacion)}
                        title={cotizacion.estado_id === 3 ? 'Ver' : 'Editar'}
                      >
                        {cotizacion.estado_id === 3 ? 'Ver' : 'Editar'}
                      </ActionButton>
                      {cotizacion.estado_id === 3 && (
                        <ActionButton
                          $variant="pdf"
                          onClick={() => handleDownloadPdf(cotizacion.id)}
                          title="Descargar PDF"
                        >
                          PDF
                        </ActionButton>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <Pagination>
                <PageButton
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Anterior
                </PageButton>
                <PageInfo>
                  Pagina {currentPage} de {totalPages}
                </PageInfo>
                <PageButton
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
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
