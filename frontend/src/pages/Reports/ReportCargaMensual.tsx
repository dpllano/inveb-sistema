/**
 * ReportCargaMensual Component
 * Reporte de carga de OTs por mes - analisis de trabajo mensual
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
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type CargaMensualResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  min-width: 120px;
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

const TrendBadge = styled.span<{ $trend: 'up' | 'down' | 'stable' }>`
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: ${({ $trend }) =>
    $trend === 'up' ? `${theme.colors.success}20` :
    $trend === 'down' ? `${theme.colors.danger}20` :
    `${theme.colors.textSecondary}20`};
  color: ${({ $trend }) =>
    $trend === 'up' ? theme.colors.success :
    $trend === 'down' ? theme.colors.danger :
    theme.colors.textSecondary};
`;

// Types
interface ReportCargaMensualProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function ReportCargaMensual({ onNavigate }: ReportCargaMensualProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<CargaMensualResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getCargaMensual(selectedYear);
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
  }, [selectedYear]);

  // Calculate pending (accumulated)
  const dataWithPending = useMemo(() => {
    if (!apiData) return [];
    let accumulated = 0;
    return apiData.items.map(item => {
      accumulated += item.total_ots - item.ots_completadas;
      return {
        ...item,
        pendientesAcum: Math.max(0, accumulated),
        balance: item.total_ots - item.ots_completadas,
      };
    });
  }, [apiData]);

  // Bar chart
  const barChartData = useMemo(() => {
    if (!dataWithPending.length) return null;
    return {
      labels: dataWithPending.map(m => m.mes),
      datasets: [
        { label: 'OTs Nuevas', data: dataWithPending.map(m => m.ots_nuevas), backgroundColor: theme.colors.primary },
        { label: 'OTs Completadas', data: dataWithPending.map(m => m.ots_completadas), backgroundColor: theme.colors.success },
      ],
    };
  }, [dataWithPending]);

  // Line chart
  const lineChartData = useMemo(() => {
    if (!dataWithPending.length) return null;
    return {
      labels: dataWithPending.map(m => m.mes),
      datasets: [
        {
          label: 'OTs Activas',
          data: dataWithPending.map(m => m.ots_activas),
          borderColor: '#7C3AED',
          backgroundColor: '#7C3AED20',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Pendientes Acum.',
          data: dataWithPending.map(m => m.pendientesAcum),
          borderColor: theme.colors.warning,
          backgroundColor: `${theme.colors.warning}20`,
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [dataWithPending]);

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const getTrend = (balance: number): 'up' | 'down' | 'stable' => {
    if (balance < 0) return 'up'; // Mas completadas que creadas
    if (balance > 5) return 'down'; // Acumulando trabajo
    return 'stable';
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Carga de OTs por Mes</PageTitle>

      <FiltersCard>
        <FiltersRow>
          <FilterGroup>
            <Label>Ano</Label>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </FilterGroup>
          <Button $variant="primary" onClick={fetchData} disabled={loading}>
            {loading ? 'Cargando...' : 'Actualizar'}
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
              <SummaryValue>{apiData.total_anual}</SummaryValue>
              <SummaryLabel>OTs Totales (Ano)</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{apiData.items.reduce((s, m) => s + m.ots_completadas, 0)}</SummaryValue>
              <SummaryLabel>OTs Completadas (Ano)</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{apiData.promedio_mensual.toFixed(0)}</SummaryValue>
              <SummaryLabel>Promedio Mensual</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{dataWithPending.length > 0 ? dataWithPending[dataWithPending.length - 1].ots_activas : 0}</SummaryValue>
              <SummaryLabel>OTs Activas Actuales</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>OTs Creadas vs Completadas</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {lineChartData && (
              <ChartCard>
                <ChartTitle>Tendencia de Carga</ChartTitle>
                <Line data={lineChartData} options={lineOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCardFull>
            <ChartTitle>Detalle Mensual</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>OTs Nuevas</Th>
                  <Th>OTs Completadas</Th>
                  <Th>Balance</Th>
                  <Th>OTs Activas</Th>
                  <Th>Tendencia</Th>
                </tr>
              </thead>
              <tbody>
                {dataWithPending.length === 0 ? (
                  <tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      No hay datos para el ano seleccionado
                    </Td>
                  </tr>
                ) : (
                  dataWithPending.map((m) => (
                    <tr key={m.mes}>
                      <Td style={{ fontWeight: 600 }}>{m.mes}</Td>
                      <Td>{m.ots_nuevas}</Td>
                      <Td>{m.ots_completadas}</Td>
                      <Td style={{ color: m.balance > 0 ? theme.colors.danger : theme.colors.success }}>
                        {m.balance > 0 ? '+' : ''}{m.balance}
                      </Td>
                      <Td>{m.ots_activas}</Td>
                      <Td>
                        <TrendBadge $trend={getTrend(m.balance)}>
                          {getTrend(m.balance) === 'up' ? '↑ Eficiente' : getTrend(m.balance) === 'down' ? '↓ Acumulando' : '→ Estable'}
                        </TrendBadge>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </ChartCardFull>
        </>
      )}
    </Container>
  );
}
