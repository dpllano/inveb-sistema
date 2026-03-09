/**
 * ReportIndicadorSalaMuestra Component
 * KPIs de la sala de muestras
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type IndicadoresSalaMuestraResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
`;

const KPICard = styled.div<{ $color?: string }>`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1.25rem;
  border-left: 4px solid ${({ $color }) => $color || theme.colors.primary};
  position: relative;
`;

const KPIValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const KPILabel = styled.div`
  font-size: 0.85rem;
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
interface ReportIndicadorSalaMuestraProps {
  onNavigate: (page: string, id?: number) => void;
}

export default function ReportIndicadorSalaMuestra({ onNavigate }: ReportIndicadorSalaMuestraProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<IndicadoresSalaMuestraResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getIndicadoresSalaMuestra(selectedYear);
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

  // Calculate totals from por_mes
  const totals = useMemo(() => {
    if (!apiData?.por_mes?.length) return { completadas: 0, rechazadas: 0, tasaAprobacion: 0 };
    const completadas = apiData.por_mes.reduce((s, m) => s + m.completadas, 0);
    const rechazadas = apiData.por_mes.reduce((s, m) => s + m.rechazadas, 0);
    const total = completadas + rechazadas;
    return {
      completadas,
      rechazadas,
      tasaAprobacion: total > 0 ? ((completadas / total) * 100).toFixed(1) : '0',
    };
  }, [apiData]);

  // Line chart - Monthly trend
  const lineChartData = useMemo(() => {
    if (!apiData?.por_mes?.length) return null;
    return {
      labels: apiData.por_mes.map(m => m.mes),
      datasets: [
        {
          label: 'Tiempo Promedio (dias)',
          data: apiData.por_mes.map(m => m.tiempo_promedio),
          borderColor: theme.colors.primary,
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Total Muestras',
          data: apiData.por_mes.map(m => m.total_muestras),
          borderColor: theme.colors.success,
          yAxisID: 'y1',
          tension: 0.3,
        },
      ],
    };
  }, [apiData]);

  // Bar chart - Completadas vs Rechazadas by month
  const barChartData = useMemo(() => {
    if (!apiData?.por_mes?.length) return null;
    return {
      labels: apiData.por_mes.map(m => m.mes),
      datasets: [
        {
          label: 'Completadas',
          data: apiData.por_mes.map(m => m.completadas),
          backgroundColor: theme.colors.success,
        },
        {
          label: 'Rechazadas',
          data: apiData.por_mes.map(m => m.rechazadas),
          backgroundColor: theme.colors.danger,
        },
      ],
    };
  }, [apiData]);

  const lineOptions = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'Dias' } },
      y1: { type: 'linear' as const, display: true, position: 'right' as const, title: { display: true, text: 'Cantidad' }, grid: { drawOnChartArea: false } },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Indicadores Sala de Muestra</PageTitle>

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
          <KPIGrid>
            <KPICard $color={theme.colors.primary}>
              <KPIValue>{apiData.total_muestras}</KPIValue>
              <KPILabel>Total Muestras (Ano)</KPILabel>
            </KPICard>

            <KPICard $color={theme.colors.warning}>
              <KPIValue>{apiData.tiempo_promedio.toFixed(1)}d</KPIValue>
              <KPILabel>Tiempo Promedio</KPILabel>
            </KPICard>

            <KPICard $color={theme.colors.success}>
              <KPIValue>{totals.completadas}</KPIValue>
              <KPILabel>Completadas</KPILabel>
            </KPICard>

            <KPICard $color={theme.colors.danger}>
              <KPIValue>{totals.rechazadas}</KPIValue>
              <KPILabel>Rechazadas</KPILabel>
            </KPICard>
          </KPIGrid>

          <ChartsGrid>
            {lineChartData && (
              <ChartCard>
                <ChartTitle>Tendencia de KPIs</ChartTitle>
                <Line data={lineChartData} options={lineOptions} />
              </ChartCard>
            )}
            {barChartData && (
              <ChartCard>
                <ChartTitle>Completadas vs Rechazadas</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCard>
            <ChartTitle>Detalle por Mes</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>Total Muestras</Th>
                  <Th>Completadas</Th>
                  <Th>Rechazadas</Th>
                  <Th>Tiempo Prom.</Th>
                  <Th>Tasa Aprobacion</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.por_mes.length === 0 ? (
                  <tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      No hay datos para el ano seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.por_mes.map((m) => {
                    const total = m.completadas + m.rechazadas;
                    const tasa = total > 0 ? ((m.completadas / total) * 100).toFixed(1) : '0';
                    return (
                      <tr key={m.mes}>
                        <Td style={{ fontWeight: 600 }}>{m.mes}</Td>
                        <Td>{m.total_muestras}</Td>
                        <Td style={{ color: theme.colors.success, fontWeight: 600 }}>{m.completadas}</Td>
                        <Td style={{ color: theme.colors.danger, fontWeight: 600 }}>{m.rechazadas}</Td>
                        <Td>{m.tiempo_promedio.toFixed(1)}d</Td>
                        <Td style={{ color: Number(tasa) >= 90 ? theme.colors.success : theme.colors.warning }}>
                          {tasa}%
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
