/**
 * ReportTiempoPorArea Component
 * Reporte de tiempo promedio de procesamiento por area
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
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type TiempoPorAreaResponse } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SummaryCard = styled.div<{ $color?: string }>`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid ${({ $color }) => $color || theme.colors.primary};
`;

const SummaryValue = styled.div`
  font-size: 1.5rem;
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

// Types
interface ReportTiempoPorAreaProps {
  onNavigate: (page: string, id?: number) => void;
}

const areaColors: Record<string, string> = {
  'Ventas': '#4F46E5',
  'Desarrollo': '#059669',
  'Diseno': '#D97706',
  'Catalogacion': '#DC2626',
  'Precatalogacion': '#7C3AED',
  'Muestra': '#0891B2',
};

export default function ReportTiempoPorArea({ onNavigate }: ReportTiempoPorAreaProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<TiempoPorAreaResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getTiempoPorArea(selectedYear);
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

  // Group data by area for summary
  const areaSummary = useMemo(() => {
    if (!apiData) return [];
    const grouped: Record<string, { total_tiempo: number; total_ots: number; count: number }> = {};
    apiData.items.forEach(item => {
      if (!grouped[item.area_nombre]) {
        grouped[item.area_nombre] = { total_tiempo: 0, total_ots: 0, count: 0 };
      }
      grouped[item.area_nombre].total_tiempo += item.tiempo_promedio * item.total_ots;
      grouped[item.area_nombre].total_ots += item.total_ots;
      grouped[item.area_nombre].count++;
    });
    return Object.entries(grouped).map(([area, data]) => ({
      area,
      tiempoPromedio: data.total_ots > 0 ? data.total_tiempo / data.total_ots : 0,
      totalOTs: data.total_ots,
    }));
  }, [apiData]);

  // Bar chart - average time by area
  const barChartData = useMemo(() => {
    if (!areaSummary.length) return null;
    return {
      labels: areaSummary.map(a => a.area),
      datasets: [{
        label: 'Tiempo Promedio (dias)',
        data: areaSummary.map(a => a.tiempoPromedio),
        backgroundColor: areaSummary.map(a => areaColors[a.area] || '#6B7280'),
      }],
    };
  }, [areaSummary]);

  // Line chart - trend by month
  const lineChartData = useMemo(() => {
    if (!apiData) return null;
    const areas = [...new Set(apiData.items.map(i => i.area_nombre))];
    return {
      labels: apiData.meses,
      datasets: areas.map(area => ({
        label: area,
        data: apiData.meses.map(mes => {
          const item = apiData.items.find(i => i.mes === mes && i.area_nombre === area);
          return item?.tiempo_promedio || 0;
        }),
        borderColor: areaColors[area] || '#6B7280',
        backgroundColor: `${areaColors[area] || '#6B7280'}20`,
        tension: 0.3,
      })),
    };
  }, [apiData]);

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Dias' } } },
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Dias' } } },
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Tiempo Promedio por Area</PageTitle>

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
            {areaSummary.map((area) => (
              <SummaryCard key={area.area} $color={areaColors[area.area] || '#6B7280'}>
                <SummaryValue>{area.tiempoPromedio.toFixed(1)} dias</SummaryValue>
                <SummaryLabel>{area.area} ({area.totalOTs} OTs)</SummaryLabel>
              </SummaryCard>
            ))}
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Tiempo Promedio por Area</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {lineChartData && lineChartData.datasets.length > 0 && (
              <ChartCard>
                <ChartTitle>Evolucion Mensual</ChartTitle>
                <Line data={lineChartData} options={lineOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCardFull>
            <ChartTitle>Detalle por Area y Mes</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>Area</Th>
                  <Th>Tiempo Promedio</Th>
                  <Th>OTs Procesadas</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={4} style={{ textAlign: 'center' }}>
                      No hay datos para el ano seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((item, idx) => (
                    <tr key={idx}>
                      <Td style={{ fontWeight: 600 }}>{item.mes}</Td>
                      <Td>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: areaColors[item.area_nombre] || '#6B7280',
                          marginRight: '0.5rem'
                        }} />
                        {item.area_nombre}
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{item.tiempo_promedio.toFixed(1)} dias</Td>
                      <Td>{item.total_ots}</Td>
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
