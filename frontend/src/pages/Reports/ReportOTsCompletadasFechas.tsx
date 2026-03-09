/**
 * ReportOTsCompletadasFechas Component
 * Reporte de OTs completadas con filtro avanzado por rango de fechas
 * Conectado a API real
 */

import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type OTsCompletadasResponse } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

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

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  &:focus { outline: none; border-color: ${theme.colors.primary}; }
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 150px;
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
  grid-template-columns: 1fr 1fr;
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

const Badge = styled.span<{ $color: string }>`
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
`;

const ProgressBar = styled.div<{ $value: number; $color: string }>`
  height: 8px;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
  overflow: hidden;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $value }) => Math.min($value, 100)}%;
    background: ${({ $color }) => $color};
    border-radius: 4px;
  }
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

// Types
interface ReportOTsCompletadasFechasProps {
  onNavigate: (page: string, id?: number) => void;
}

const areaColors: Record<string, string> = {
  'Diseno Grafico': '#4F46E5',
  'Diseno Estructural': '#059669',
  'Pre-Prensa': '#D97706',
  'Cotizaciones': '#7C3AED',
  'Sala de Muestras': '#DC2626',
  'Area de Ventas': '#0891B2',
  'Catalogacion': '#BE185D',
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

export default function ReportOTsCompletadasFechas({ onNavigate }: ReportOTsCompletadasFechasProps) {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [areaFilter, setAreaFilter] = useState('todas');
  const [clienteFilter, setClienteFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<OTsCompletadasResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getOTsCompletadas({
        date_desde: fechaDesde,
        date_hasta: fechaHasta,
        area_id: areaFilter !== 'todas' ? parseInt(areaFilter) : undefined,
        page_size: 100,
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
  }, []);

  // Calculate summary from API data
  const summary = useMemo(() => {
    if (!apiData) return { total: 0, enPlazo: 0, fueraPlazo: 0, promedioDias: 0 };
    return {
      total: apiData.resumen?.total || apiData.total || 0,
      enPlazo: apiData.resumen?.en_plazo || 0,
      fueraPlazo: apiData.resumen?.fuera_plazo || 0,
      promedioDias: apiData.resumen?.promedio_dias || 0,
    };
  }, [apiData]);

  // Group by area
  const areaBreakdown = useMemo(() => {
    if (!apiData?.items) return [];
    const byArea: Record<string, number> = {};
    apiData.items.forEach(item => {
      const area = item.area_nombre || 'Sin Area';
      byArea[area] = (byArea[area] || 0) + 1;
    });
    const total = apiData.items.length || 1;
    return Object.entries(byArea)
      .map(([area, count]) => ({
        area,
        completadas: count,
        porcentaje: (count / total) * 100,
      }))
      .sort((a, b) => b.completadas - a.completadas);
  }, [apiData]);

  // Group by week for charts
  const weeklyData = useMemo(() => {
    if (!apiData?.items) return [];
    const byWeek: Record<string, { completadas: number; enPlazo: number; fueraPlazo: number }> = {};
    apiData.items.forEach(item => {
      const date = new Date(item.completed_at || item.created_at);
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `Sem ${weekNum}`;
      if (!byWeek[weekKey]) {
        byWeek[weekKey] = { completadas: 0, enPlazo: 0, fueraPlazo: 0 };
      }
      byWeek[weekKey].completadas++;
      if (item.en_plazo) {
        byWeek[weekKey].enPlazo++;
      } else {
        byWeek[weekKey].fueraPlazo++;
      }
    });
    return Object.entries(byWeek)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [apiData]);

  const porcentajeEnPlazo = summary.total > 0
    ? ((summary.enPlazo / summary.total) * 100).toFixed(1)
    : '0';

  const barChartData = useMemo(() => ({
    labels: weeklyData.map(w => w.week),
    datasets: [
      {
        label: 'En Plazo',
        data: weeklyData.map(w => w.enPlazo),
        backgroundColor: theme.colors.success,
      },
      {
        label: 'Fuera de Plazo',
        data: weeklyData.map(w => w.fueraPlazo),
        backgroundColor: theme.colors.danger,
      },
    ],
  }), [weeklyData]);

  const lineChartData = useMemo(() => ({
    labels: weeklyData.map(w => w.week),
    datasets: [
      {
        label: 'OTs Completadas',
        data: weeklyData.map(w => w.completadas),
        borderColor: theme.colors.primary,
        backgroundColor: `${theme.colors.primary}20`,
        fill: true,
        tension: 0.4,
      },
    ],
  }), [weeklyData]);

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>OTs Completadas Entre Fechas</PageTitle>

      <FiltersCard>
        <FiltersRow>
          <FilterGroup>
            <Label>Fecha Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          </FilterGroup>
          <FilterGroup>
            <Label>Fecha Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </FilterGroup>
          <FilterGroup>
            <Label>Area</Label>
            <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
              <option value="todas">Todas las Areas</option>
              <option value="1">Area de Ventas</option>
              <option value="2">Diseno Estructural</option>
              <option value="3">Diseno Grafico</option>
              <option value="4">Pre-Prensa</option>
              <option value="5">Cotizaciones</option>
              <option value="6">Sala de Muestras</option>
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Cliente</Label>
            <Input
              type="text"
              placeholder="Buscar cliente..."
              value={clienteFilter}
              onChange={(e) => setClienteFilter(e.target.value)}
            />
          </FilterGroup>
          <Button $variant="primary" onClick={fetchData} disabled={loading}>
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
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{summary.total}</SummaryValue>
              <SummaryLabel>Total Completadas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{summary.enPlazo}</SummaryValue>
              <SummaryLabel>En Plazo</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{summary.fueraPlazo}</SummaryValue>
              <SummaryLabel>Fuera de Plazo</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{porcentajeEnPlazo}%</SummaryValue>
              <SummaryLabel>% Cumplimiento</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{summary.promedioDias.toFixed(1)}</SummaryValue>
              <SummaryLabel>Dias Promedio</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            <ChartCard>
              <ChartTitle>Completadas por Semana</ChartTitle>
              {weeklyData.length > 0 ? (
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { x: { stacked: true }, y: { stacked: true } }
                  }}
                />
              ) : (
                <LoadingMessage>No hay datos para mostrar</LoadingMessage>
              )}
            </ChartCard>
            <ChartCard>
              <ChartTitle>Tendencia de Completadas</ChartTitle>
              {weeklyData.length > 0 ? (
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } }
                  }}
                />
              ) : (
                <LoadingMessage>No hay datos para mostrar</LoadingMessage>
              )}
            </ChartCard>
          </ChartsGrid>

          <ChartCard style={{ marginBottom: '1.5rem' }}>
            <ChartTitle>Distribucion por Area</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Area</Th>
                  <Th>Completadas</Th>
                  <Th>Porcentaje</Th>
                  <Th style={{ width: '40%' }}>Progreso</Th>
                </tr>
              </thead>
              <tbody>
                {areaBreakdown.length === 0 ? (
                  <tr>
                    <Td colSpan={4} style={{ textAlign: 'center' }}>No hay datos</Td>
                  </tr>
                ) : (
                  areaBreakdown.map((area) => (
                    <tr key={area.area}>
                      <Td>
                        <Badge $color={areaColors[area.area] || '#6B7280'}>{area.area}</Badge>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{area.completadas}</Td>
                      <Td>{area.porcentaje.toFixed(1)}%</Td>
                      <Td>
                        <ProgressBar $value={area.porcentaje} $color={areaColors[area.area] || '#6B7280'} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </ChartCard>

          <ChartCard>
            <ChartTitle>Detalle de OTs Completadas ({apiData.items.length} registros)</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>OT ID</Th>
                  <Th>Cliente</Th>
                  <Th>Descripcion</Th>
                  <Th>Creacion</Th>
                  <Th>Completada</Th>
                  <Th>Dias</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      No hay OTs completadas en el rango de fechas seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.slice(0, 50).map((ot) => {
                    const diasProceso = ot.dias_proceso ||
                      Math.round((new Date(ot.completed_at).getTime() - new Date(ot.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={ot.id}>
                        <Td style={{ fontWeight: 600 }}>#{ot.id}</Td>
                        <Td>{ot.client_name || 'Sin cliente'}</Td>
                        <Td>{ot.descripcion?.substring(0, 30) || '-'}</Td>
                        <Td>{new Date(ot.created_at).toLocaleDateString()}</Td>
                        <Td>{new Date(ot.completed_at).toLocaleDateString()}</Td>
                        <Td style={{ fontWeight: 600 }}>{diasProceso}</Td>
                        <Td>
                          <Badge $color={ot.en_plazo ? theme.colors.success : theme.colors.danger}>
                            {ot.en_plazo ? 'En Plazo' : 'Fuera Plazo'}
                          </Badge>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </ChartCard>
        </>
      )}
    </Container>
  );
}
