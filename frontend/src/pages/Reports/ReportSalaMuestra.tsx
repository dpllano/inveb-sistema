/**
 * ReportSalaMuestra Component
 * Estado y gestión de la sala de muestras
 * Conectado a API real de QAS
 */

import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type MuestrasResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &:hover { text-decoration: underline; }
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1.5rem 0;
`;

const FiltersCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 150px;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Button = styled.button<{ $variant?: 'primary' }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $variant }) => $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ $variant }) => $variant === 'primary' ? theme.colors.primary : 'white'};
  color: ${({ $variant }) => $variant === 'primary' ? 'white' : theme.colors.textPrimary};
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); }
`;

const SummaryCard = styled.div<{ $color?: string }>`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid ${({ $color }) => $color || theme.colors.primary};
`;

const SummaryValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const SummaryLabel = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const ChartCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
`;

const ChartCardFull = styled(ChartCard)`
  grid-column: 1 / -1;
`;

const ChartTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1rem 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 0.5rem;
  background: ${theme.colors.bgLight};
  border-bottom: 2px solid ${theme.colors.border};
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  font-size: 0.75rem;
  text-transform: uppercase;
`;

const Td = styled.td`
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid ${theme.colors.border};
  color: ${theme.colors.textPrimary};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  ${({ $status }) => {
    switch ($status) {
      case 'pendiente':
        return `background: ${theme.colors.warning}20; color: ${theme.colors.warning};`;
      case 'en_proceso':
        return `background: ${theme.colors.primary}20; color: ${theme.colors.primary};`;
      case 'completada':
        return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
      case 'rechazada':
        return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
      default:
        return `background: ${theme.colors.textSecondary}20; color: ${theme.colors.textSecondary};`;
    }
  }}
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.error};
  background: ${theme.colors.error}10;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
`;

// Types
interface ReportSalaMuestraProps {
  onNavigate: (page: string, id?: number) => void;
}

const estadoColors: Record<string, string> = {
  'pendiente': theme.colors.warning,
  'en_proceso': theme.colors.primary,
  'completada': theme.colors.success,
  'rechazada': theme.colors.danger,
};

// Helper function to get default dates (current month)
const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { firstDay, lastDayStr };
};

export default function ReportSalaMuestra({ onNavigate }: ReportSalaMuestraProps) {
  const defaultDates = getDefaultDates();
  const [selectedEstado, setSelectedEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<MuestrasResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getMuestras({
        page,
        page_size: 20,
        date_desde: fechaDesde || undefined,
        date_hasta: fechaHasta || undefined,
        estado: selectedEstado || undefined,
      });
      setApiData(response);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Error al cargar los datos del reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchData();
  };

  // Summary stats from por_estado
  const estadoStats = useMemo(() => {
    if (!apiData?.por_estado) return { pendientes: 0, en_proceso: 0, completadas: 0, rechazadas: 0 };
    const stats: Record<string, number> = {};
    apiData.por_estado.forEach(e => {
      stats[e.estado] = e.cantidad;
    });
    return {
      pendientes: stats['pendiente'] || 0,
      en_proceso: stats['en_proceso'] || 0,
      completadas: stats['completada'] || 0,
      rechazadas: stats['rechazada'] || 0,
    };
  }, [apiData]);

  // Doughnut chart - Distribution by estado
  const doughnutData = useMemo(() => {
    if (!apiData?.por_estado?.length) return null;
    return {
      labels: apiData.por_estado.map(e => e.estado),
      datasets: [{
        data: apiData.por_estado.map(e => e.cantidad),
        backgroundColor: apiData.por_estado.map(e => estadoColors[e.estado] || '#6B7280'),
      }],
    };
  }, [apiData]);

  // Bar chart - By tipo
  const barChartData = useMemo(() => {
    if (!apiData?.por_tipo?.length) return null;
    return {
      labels: apiData.por_tipo.map(t => t.tipo),
      datasets: [{
        label: 'Muestras',
        data: apiData.por_tipo.map(t => t.cantidad),
        backgroundColor: theme.colors.primary,
      }],
    };
  }, [apiData]);

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' as const } },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Sala de Muestra</PageTitle>

      <FiltersCard>
        <FiltersRow>
          <FilterGroup>
            <Label>Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </FilterGroup>
          <FilterGroup>
            <Label>Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </FilterGroup>
          <FilterGroup>
            <Label>Estado</Label>
            <Select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completada">Completada</option>
              <option value="rechazada">Rechazada</option>
            </Select>
          </FilterGroup>
          <Button $variant="primary" onClick={handleApplyFilters} disabled={loading}>
            {loading ? 'Cargando...' : 'Filtrar'}
          </Button>
        </FiltersRow>
      </FiltersCard>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>Cargando datos del reporte...</LoadingMessage>
      ) : apiData && (
        <>
          <SummaryGrid>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{estadoStats.pendientes}</SummaryValue>
              <SummaryLabel>Pendientes</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{estadoStats.en_proceso}</SummaryValue>
              <SummaryLabel>En Proceso</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{estadoStats.completadas}</SummaryValue>
              <SummaryLabel>Completadas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{estadoStats.rechazadas}</SummaryValue>
              <SummaryLabel>Rechazadas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{apiData.total}</SummaryValue>
              <SummaryLabel>Total Muestras</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Muestras por Tipo</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {doughnutData && (
              <ChartCard>
                <ChartTitle>Distribucion por Estado</ChartTitle>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCardFull>
            <ChartTitle>Cola de Muestras ({apiData.total} registros)</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>OT</Th>
                  <Th>Tipo</Th>
                  <Th>Fecha Solicitud</Th>
                  <Th>Completada</Th>
                  <Th>Estado</Th>
                  <Th>Responsable</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      No hay muestras en el periodo seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((m) => (
                    <tr key={m.id}>
                      <Td style={{ fontWeight: 600 }}>#{m.id}</Td>
                      <Td>OT-{m.ot_id}</Td>
                      <Td>{m.tipo}</Td>
                      <Td>{m.created_at}</Td>
                      <Td>{m.completed_at || '-'}</Td>
                      <Td>
                        <StatusBadge $status={m.estado}>
                          {m.estado}
                        </StatusBadge>
                      </Td>
                      <Td>{m.responsable}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            {apiData.total_pages > 1 && (
              <Pagination>
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span style={{ padding: '0.5rem 1rem' }}>
                  Pagina {page} de {apiData.total_pages}
                </span>
                <Button
                  onClick={() => setPage(p => Math.min(apiData.total_pages, p + 1))}
                  disabled={page === apiData.total_pages}
                >
                  Siguiente
                </Button>
              </Pagination>
            )}
          </ChartCardFull>
        </>
      )}
    </Container>
  );
}
