/**
 * ReportGestionOTsActivas Component
 * Dashboard de gestion de OTs en proceso con metricas de productividad
 * Conectado a API real de QAS
 */

import { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type GestionOTsActivasResponse } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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
  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr); }
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

const AlertBadge = styled.span<{ $level: 'critical' | 'warning' | 'normal' }>`
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  ${({ $level }) => {
    switch ($level) {
      case 'critical': return `background: ${theme.colors.danger}20; color: ${theme.colors.danger};`;
      case 'warning': return `background: ${theme.colors.warning}20; color: ${theme.colors.warning};`;
      default: return `background: ${theme.colors.success}20; color: ${theme.colors.success};`;
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

// Types
interface ReportGestionOTsActivasProps {
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

export default function ReportGestionOTsActivas({ onNavigate }: ReportGestionOTsActivasProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<GestionOTsActivasResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getGestionOTsActivas();
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

  // Summary calculations
  const totalAtrasadas = useMemo(() => {
    if (!apiData?.por_area) return 0;
    return apiData.por_area.reduce((s, a) => s + a.ots_atrasadas, 0);
  }, [apiData]);

  const promedioGeneral = useMemo(() => {
    if (!apiData?.por_area?.length) return 0;
    const total = apiData.por_area.reduce((s, a) => s + a.dias_promedio * a.total_ots, 0);
    const count = apiData.por_area.reduce((s, a) => s + a.total_ots, 0);
    return count > 0 ? (total / count).toFixed(1) : '0';
  }, [apiData]);

  // Bar chart - OTs by area with status
  const barChartData = useMemo(() => {
    if (!apiData?.por_area?.length) return null;
    return {
      labels: apiData.por_area.map(a => a.area_nombre),
      datasets: [
        {
          label: 'Normal',
          data: apiData.por_area.map(a => Math.max(0, a.total_ots - a.ots_atrasadas)),
          backgroundColor: theme.colors.success,
        },
        {
          label: 'Atrasadas',
          data: apiData.por_area.map(a => a.ots_atrasadas),
          backgroundColor: theme.colors.danger,
        },
      ],
    };
  }, [apiData]);

  // Doughnut chart - Distribution by area
  const doughnutData = useMemo(() => {
    if (!apiData?.por_area?.length) return null;
    return {
      labels: apiData.por_area.map(e => e.area_nombre),
      datasets: [{
        data: apiData.por_area.map(e => e.total_ots),
        backgroundColor: apiData.por_area.map(e => areaColors[e.area_nombre] || '#6B7280'),
        borderWidth: 0,
      }],
    };
  }, [apiData]);

  const getAlertLevel = (atrasadas: number, total: number): 'critical' | 'warning' | 'normal' => {
    const percent = total > 0 ? (atrasadas / total) * 100 : 0;
    if (percent > 20) return 'critical';
    if (percent > 10) return 'warning';
    return 'normal';
  };

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Gestion de OTs Activas</PageTitle>

      <FiltersCard>
        <FiltersRow>
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
              <SummaryValue>{apiData.total_activas}</SummaryValue>
              <SummaryLabel>Total OTs Activas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{apiData.total_activas - totalAtrasadas}</SummaryValue>
              <SummaryLabel>En Tiempo</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{totalAtrasadas}</SummaryValue>
              <SummaryLabel>Atrasadas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{promedioGeneral}d</SummaryValue>
              <SummaryLabel>Dias Promedio</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{apiData.por_area?.length || 0}</SummaryValue>
              <SummaryLabel>Areas con OTs</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Estado de OTs por Area</ChartTitle>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { x: { stacked: true }, y: { stacked: true } }
                  }}
                />
              </ChartCard>
            )}
            {doughnutData && (
              <ChartCard>
                <ChartTitle>Distribucion por Area</ChartTitle>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCard>
            <ChartTitle>Detalle por Area</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Area</Th>
                  <Th>Total OTs</Th>
                  <Th>Dias Promedio</Th>
                  <Th>Atrasadas</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.por_area?.length === 0 ? (
                  <tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      No hay OTs activas actualmente
                    </Td>
                  </tr>
                ) : (
                  apiData.por_area?.map((area) => (
                    <tr key={area.area_id || area.area_nombre}>
                      <Td>
                        <Badge $color={areaColors[area.area_nombre] || '#6B7280'}>
                          {area.area_nombre}
                        </Badge>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{area.total_ots}</Td>
                      <Td>{area.dias_promedio.toFixed(1)}d</Td>
                      <Td style={{ fontWeight: 600, color: area.ots_atrasadas > 0 ? theme.colors.danger : 'inherit' }}>
                        {area.ots_atrasadas}
                      </Td>
                      <Td>
                        <AlertBadge $level={getAlertLevel(area.ots_atrasadas, area.total_ots)}>
                          {getAlertLevel(area.ots_atrasadas, area.total_ots) === 'critical'
                            ? 'Critico'
                            : getAlertLevel(area.ots_atrasadas, area.total_ots) === 'warning'
                            ? 'Alerta'
                            : 'Normal'}
                        </AlertBadge>
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
