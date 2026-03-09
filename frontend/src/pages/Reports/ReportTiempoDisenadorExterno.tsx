/**
 * ReportTiempoDisenadorExterno Component
 * Métricas de tiempo para diseñadores externos
 * Conectado a API real
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
import { reportsApi, type TiempoDisenadorExternoResponse } from '../../services/api';

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
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
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

const PerformanceBadge = styled.span<{ $level: 'excellent' | 'good' | 'regular' | 'poor' }>`
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  ${({ $level }) => {
    switch ($level) {
      case 'excellent':
        return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
      case 'good':
        return `background: ${theme.colors.primary}20; color: ${theme.colors.primary};`;
      case 'regular':
        return `background: ${theme.colors.warning}20; color: ${theme.colors.warning};`;
      case 'poor':
        return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
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

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.bgLight};
  border-radius: 8px;
`;

// Types
interface ReportTiempoDisenadorExternoProps {
  onNavigate: (page: string, id?: number) => void;
}

// Helper function to get default dates (last 6 months)
const getDefaultDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Last day of current month
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  // 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const startYear = sixMonthsAgo.getFullYear();
  const startMonth = sixMonthsAgo.getMonth() + 1;
  const firstDay = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
  return { firstDay, lastDayStr };
};

// Helper to determine performance level based on average time
const getPerformanceLevel = (tiempoPromedio: number): 'excellent' | 'good' | 'regular' | 'poor' => {
  if (tiempoPromedio <= 3) return 'excellent';
  if (tiempoPromedio <= 5) return 'good';
  if (tiempoPromedio <= 7) return 'regular';
  return 'poor';
};

const getPerformanceLabel = (level: 'excellent' | 'good' | 'regular' | 'poor') => {
  switch (level) {
    case 'excellent': return 'Excelente';
    case 'good': return 'Bueno';
    case 'regular': return 'Regular';
    case 'poor': return 'Bajo';
  }
};

export default function ReportTiempoDisenadorExterno({ onNavigate }: ReportTiempoDisenadorExternoProps) {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<TiempoDisenadorExternoResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getTiempoDisenadorExterno({
        date_desde: fechaDesde,
        date_hasta: fechaHasta,
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

  // Calculate summary values
  const summary = useMemo(() => {
    if (!apiData || !apiData.disenadores.length) {
      return {
        totalDisenadores: 0,
        totalOTs: 0,
        tiempoPromedio: 0,
      };
    }

    const totalOTs = apiData.disenadores.reduce((sum, d) => sum + d.total_ots, 0);
    const tiempoPromedio = apiData.disenadores.reduce((sum, d) => sum + d.tiempo_promedio, 0) / apiData.disenadores.length;

    return {
      totalDisenadores: apiData.total_disenadores,
      totalOTs,
      tiempoPromedio: tiempoPromedio.toFixed(1),
    };
  }, [apiData]);

  // Chart: Tiempo por diseñador
  const barChartData = useMemo(() => {
    if (!apiData || !apiData.disenadores.length) return null;

    return {
      labels: apiData.disenadores.map(d => d.nombre),
      datasets: [
        {
          label: 'Tiempo Promedio (dias)',
          data: apiData.disenadores.map(d => d.tiempo_promedio),
          backgroundColor: apiData.disenadores.map(d =>
            d.tiempo_promedio <= 5 ? theme.colors.success : theme.colors.warning
          ),
        },
      ],
    };
  }, [apiData]);

  // Chart: OTs por diseñador (doughnut)
  const doughnutData = useMemo(() => {
    if (!apiData || !apiData.disenadores.length) return null;

    const colors = [
      theme.colors.primary,
      theme.colors.success,
      '#7C3AED',
      theme.colors.warning,
      '#EC4899',
      '#06B6D4',
      '#F59E0B',
      '#10B981',
    ];

    return {
      labels: apiData.disenadores.map(d => d.nombre),
      datasets: [{
        data: apiData.disenadores.map(d => d.total_ots),
        backgroundColor: apiData.disenadores.map((_, i) => colors[i % colors.length]),
      }],
    };
  }, [apiData]);

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Dias' } } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' as const } },
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Tiempo Disenador Externo</PageTitle>

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
          <Button $variant="primary" onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Filtrar'}
          </Button>
        </FiltersRow>
      </FiltersCard>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>Cargando datos del reporte...</LoadingMessage>
      ) : apiData && apiData.disenadores.length > 0 ? (
        <>
          <SummaryGrid>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{summary.totalDisenadores}</SummaryValue>
              <SummaryLabel>Disenadores Activos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{summary.totalOTs}</SummaryValue>
              <SummaryLabel>OTs Totales</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{summary.tiempoPromedio}d</SummaryValue>
              <SummaryLabel>Tiempo Promedio</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{apiData.disenadores.filter(d => d.tiempo_promedio <= 5).length}</SummaryValue>
              <SummaryLabel>Dentro de Meta</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Tiempo Promedio por Disenador</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {doughnutData && (
              <ChartCard>
                <ChartTitle>OTs por Disenador</ChartTitle>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCardFull>
            <ChartTitle>Detalle por Disenador</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Disenador</Th>
                  <Th>OTs Totales</Th>
                  <Th>Tiempo Promedio</Th>
                  <Th>Performance</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.disenadores.map((d) => {
                  const perfLevel = getPerformanceLevel(d.tiempo_promedio);
                  return (
                    <tr key={d.id}>
                      <Td>{d.id}</Td>
                      <Td style={{ fontWeight: 600 }}>{d.nombre}</Td>
                      <Td>{d.total_ots}</Td>
                      <Td style={{ color: d.tiempo_promedio <= 5 ? theme.colors.success : theme.colors.warning }}>
                        {d.tiempo_promedio.toFixed(1)} dias
                      </Td>
                      <Td>
                        <PerformanceBadge $level={perfLevel}>
                          {getPerformanceLabel(perfLevel)}
                        </PerformanceBadge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </ChartCardFull>
        </>
      ) : (
        <NoDataMessage>
          No hay datos de disenadores externos para el periodo seleccionado.
        </NoDataMessage>
      )}
    </Container>
  );
}
