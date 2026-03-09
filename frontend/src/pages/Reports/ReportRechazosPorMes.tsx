/**
 * ReportRechazosPorMes Component
 * Reporte de rechazos de OTs con analisis de motivos
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type RechazosMesResponse } from '../../services/api';

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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
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

const SummarySubtext = styled.div`
  font-size: 0.7rem;
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

const RejectionReasonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RejectionReasonItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
`;

const ReasonLabel = styled.span`
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
`;

const ReasonCount = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${theme.colors.danger};
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  margin: 0 1rem;
  height: 8px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ $color }) => $color};
  border-radius: 4px;
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
interface ReportRechazosPorMesProps {
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

export default function ReportRechazosPorMes({ onNavigate }: ReportRechazosPorMesProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<RechazosMesResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getRechazosMes(selectedYear);
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

  // Group data by month
  const monthlyData = useMemo(() => {
    if (!apiData) return [];
    const grouped: Record<string, number> = {};
    apiData.items.forEach(item => {
      if (!grouped[item.mes]) grouped[item.mes] = 0;
      grouped[item.mes] += item.total_rechazos;
    });
    return Object.entries(grouped).map(([mes, rechazos]) => ({
      mes,
      rechazos,
    }));
  }, [apiData]);

  // Bar chart - Rejections by month
  const barChartData = useMemo(() => {
    if (!monthlyData.length) return null;
    return {
      labels: monthlyData.map(m => m.mes),
      datasets: [{
        label: 'Rechazos',
        data: monthlyData.map(m => m.rechazos),
        backgroundColor: theme.colors.danger,
      }],
    };
  }, [monthlyData]);

  // Line chart - Rejection trend
  const lineChartData = useMemo(() => {
    if (!monthlyData.length) return null;
    return {
      labels: monthlyData.map(m => m.mes),
      datasets: [{
        label: 'Rechazos por Mes',
        data: monthlyData.map(m => m.rechazos),
        borderColor: theme.colors.danger,
        backgroundColor: `${theme.colors.danger}20`,
        fill: true,
        tension: 0.3,
      }],
    };
  }, [monthlyData]);

  // Doughnut chart - By area
  const doughnutChartData = useMemo(() => {
    if (!apiData?.por_area?.length) return null;
    return {
      labels: apiData.por_area.map(a => a.area),
      datasets: [{
        data: apiData.por_area.map(a => a.cantidad),
        backgroundColor: apiData.por_area.map(a => areaColors[a.area] || '#6B7280'),
        borderWidth: 0,
      }],
    };
  }, [apiData]);

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } } },
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right' as const } },
  };

  const maxAreaCount = apiData?.por_area?.length
    ? Math.max(...apiData.por_area.map(a => a.cantidad))
    : 0;

  // Calculate trend
  const tendencia = useMemo(() => {
    if (monthlyData.length < 2) return 'stable';
    const lastMonth = monthlyData[monthlyData.length - 1]?.rechazos || 0;
    const prevMonth = monthlyData[monthlyData.length - 2]?.rechazos || 0;
    if (lastMonth < prevMonth) return 'down';
    if (lastMonth > prevMonth) return 'up';
    return 'stable';
  }, [monthlyData]);

  const lastMonthRechazos = monthlyData.length > 0
    ? monthlyData[monthlyData.length - 1].rechazos
    : 0;

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Rechazos por Mes</PageTitle>

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
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{apiData.total_rechazos}</SummaryValue>
              <SummaryLabel>Total Rechazos (Ano)</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{apiData.promedio_mensual.toFixed(1)}</SummaryValue>
              <SummaryLabel>Promedio Mensual</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={tendencia === 'down' ? theme.colors.success : theme.colors.danger}>
              <SummaryValue>{lastMonthRechazos}</SummaryValue>
              <SummaryLabel>Rechazos Ultimo Mes</SummaryLabel>
              <SummarySubtext>
                {tendencia === 'down' ? '↓ Mejorando' : tendencia === 'up' ? '↑ Aumentando' : '→ Estable'}
              </SummarySubtext>
            </SummaryCard>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{apiData.por_area?.[0]?.area?.split(' ')[0] || '-'}</SummaryValue>
              <SummaryLabel>Area con mas Rechazos</SummaryLabel>
              <SummarySubtext>
                {apiData.por_area?.[0] ? `${apiData.por_area[0].cantidad} casos` : ''}
              </SummarySubtext>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Rechazos por Mes</ChartTitle>
                <Bar data={barChartData} options={barOptions} />
              </ChartCard>
            )}
            {doughnutChartData && (
              <ChartCard>
                <ChartTitle>Distribucion por Area</ChartTitle>
                <Doughnut data={doughnutChartData} options={doughnutOptions} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartsGrid>
            {lineChartData && (
              <ChartCard>
                <ChartTitle>Tendencia de Rechazos</ChartTitle>
                <Line data={lineChartData} options={lineOptions} />
              </ChartCard>
            )}
            {apiData.por_area && apiData.por_area.length > 0 && (
              <ChartCard>
                <ChartTitle>Rechazos por Area</ChartTitle>
                <RejectionReasonList>
                  {apiData.por_area.map((area) => (
                    <RejectionReasonItem key={area.area}>
                      <ReasonLabel>{area.area}</ReasonLabel>
                      <ProgressBarContainer>
                        <ProgressBarFill
                          $width={(area.cantidad / maxAreaCount) * 100}
                          $color={areaColors[area.area] || '#6B7280'}
                        />
                      </ProgressBarContainer>
                      <ReasonCount>{area.cantidad}</ReasonCount>
                    </RejectionReasonItem>
                  ))}
                </RejectionReasonList>
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCard>
            <ChartTitle>Detalle por Mes y Area</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>Area</Th>
                  <Th>Rechazos</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={3} style={{ textAlign: 'center' }}>
                      No hay datos de rechazos para el ano seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((item, idx) => (
                    <tr key={idx}>
                      <Td style={{ fontWeight: 600 }}>{item.mes}</Td>
                      <Td>
                        <Badge $color={areaColors[item.area_nombre || ''] || '#6B7280'}>
                          {item.area_nombre || 'Sin area'}
                        </Badge>
                      </Td>
                      <Td style={{ fontWeight: 600, color: theme.colors.danger }}>
                        {item.total_rechazos}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </ChartCard>
        </>
      )}
    </Container>
  );
}
