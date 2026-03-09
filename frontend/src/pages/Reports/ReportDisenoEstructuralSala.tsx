/**
 * ReportDisenoEstructuralSala Component
 * Relación entre diseño estructural y sala de muestras
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
import { Bar, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type DisenoEstructuralSalaResponse } from '../../services/api';

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

const NoDataMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.bgLight};
  border-radius: 8px;
`;

// Types
interface ReportDisenoEstructuralSalaProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function ReportDisenoEstructuralSala({ onNavigate }: ReportDisenoEstructuralSalaProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<DisenoEstructuralSalaResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getDisenoEstructuralSala(selectedYear);
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

  // Calculate summary values
  const summary = useMemo(() => {
    if (!apiData || !apiData.por_mes.length) {
      return {
        totalOTs: 0,
        tiempoPromDiseno: 0,
        tiempoPromMuestra: 0,
        tiempoTotal: 0,
      };
    }

    const totalOTs = apiData.por_mes.reduce((sum, m) => sum + m.total_ots, 0);
    const tiempoPromDiseno = apiData.por_mes.reduce((sum, m) => sum + m.tiempo_diseno, 0) / apiData.por_mes.length;
    const tiempoPromMuestra = apiData.por_mes.reduce((sum, m) => sum + m.tiempo_muestra, 0) / apiData.por_mes.length;

    return {
      totalOTs,
      tiempoPromDiseno: tiempoPromDiseno.toFixed(1),
      tiempoPromMuestra: tiempoPromMuestra.toFixed(1),
      tiempoTotal: (tiempoPromDiseno + tiempoPromMuestra).toFixed(1),
    };
  }, [apiData]);

  // Chart: OTs por mes
  const barChartData = useMemo(() => {
    if (!apiData || !apiData.por_mes.length) return null;

    return {
      labels: apiData.por_mes.map(m => m.mes),
      datasets: [
        {
          label: 'OTs Totales',
          data: apiData.por_mes.map(m => m.total_ots),
          backgroundColor: theme.colors.primary,
        },
      ],
    };
  }, [apiData]);

  // Chart: Tiempos por mes
  const lineChartData = useMemo(() => {
    if (!apiData || !apiData.por_mes.length) return null;

    return {
      labels: apiData.por_mes.map(m => m.mes),
      datasets: [
        {
          label: 'Tiempo Diseno (dias)',
          data: apiData.por_mes.map(m => m.tiempo_diseno),
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary + '20',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Tiempo Muestra (dias)',
          data: apiData.por_mes.map(m => m.tiempo_muestra),
          borderColor: theme.colors.warning,
          backgroundColor: theme.colors.warning + '20',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [apiData]);

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Dias' } } },
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Diseno Estructural y Sala de Muestra</PageTitle>

      <FiltersCard>
        <FiltersRow>
          <FilterGroup>
            <Label>Ano</Label>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {Array.from({ length: 6 }, (_, i) => currentYear - i).map(y => (
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
      ) : apiData && apiData.por_mes.length > 0 ? (
        <>
          <SummaryGrid>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{summary.totalOTs}</SummaryValue>
              <SummaryLabel>OTs Totales (Ano)</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{summary.tiempoPromDiseno}d</SummaryValue>
              <SummaryLabel>Tiempo Prom. Diseno</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{summary.tiempoPromMuestra}d</SummaryValue>
              <SummaryLabel>Tiempo Prom. Muestra</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{summary.tiempoTotal}d</SummaryValue>
              <SummaryLabel>Tiempo Total Prom.</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>OTs por Mes</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {lineChartData && (
              <ChartCard>
                <ChartTitle>Tiempos Diseno vs Muestra</ChartTitle>
                <Line data={lineChartData} options={lineOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCardFull>
            <ChartTitle>Detalle Mensual - {selectedYear}</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>OTs Totales</Th>
                  <Th>Tiempo Diseno (dias)</Th>
                  <Th>Tiempo Muestra (dias)</Th>
                  <Th>Tiempo Total (dias)</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.por_mes.map((m, idx) => (
                  <tr key={idx}>
                    <Td style={{ fontWeight: 600 }}>{m.mes}</Td>
                    <Td>{m.total_ots}</Td>
                    <Td style={{ color: m.tiempo_diseno <= 5 ? theme.colors.success : theme.colors.warning }}>
                      {m.tiempo_diseno.toFixed(1)}
                    </Td>
                    <Td style={{ color: m.tiempo_muestra <= 3 ? theme.colors.success : theme.colors.warning }}>
                      {m.tiempo_muestra.toFixed(1)}
                    </Td>
                    <Td>{(m.tiempo_diseno + m.tiempo_muestra).toFixed(1)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ChartCardFull>
        </>
      ) : (
        <NoDataMessage>
          No hay datos de diseno y muestra para el ano seleccionado.
        </NoDataMessage>
      )}
    </Container>
  );
}
