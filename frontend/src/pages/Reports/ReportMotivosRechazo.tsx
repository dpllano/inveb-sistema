/**
 * ReportMotivosRechazo Component
 * Analisis detallado de razones de rechazo por mes y area
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type MotivosRechazoResponse } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  @media (max-width: 1200px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 768px) { grid-template-columns: 1fr; }
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
interface ReportMotivosRechazoProps {
  onNavigate: (page: string, id?: number) => void;
}

const motivoColors: Record<string, string> = {
  'Error de diseno': '#DC2626',
  'Colores incorrectos': '#D97706',
  'Dimensiones erroneas': '#7C3AED',
  'Materiales inadecuados': '#059669',
  'Texto ilegible': '#4F46E5',
  'Otros': '#6B7280',
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

export default function ReportMotivosRechazo({ onNavigate }: ReportMotivosRechazoProps) {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<MotivosRechazoResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getMotivosRechazo({
        date_desde: fechaDesde || undefined,
        date_hasta: fechaHasta || undefined,
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

  const handleApplyFilters = () => {
    fetchData();
  };

  const motivoPrincipal = apiData?.items?.[0] || null;
  const ultimoMes = apiData?.por_mes?.length
    ? apiData.por_mes[apiData.por_mes.length - 1]
    : null;

  const pieData = useMemo(() => {
    if (!apiData?.items?.length) return null;
    return {
      labels: apiData.items.map(m => m.motivo),
      datasets: [{
        data: apiData.items.map(m => m.cantidad),
        backgroundColor: apiData.items.map(m => motivoColors[m.motivo] || '#6B7280'),
        borderWidth: 0,
      }],
    };
  }, [apiData]);

  const barData = useMemo(() => {
    if (!apiData?.items?.length) return null;
    return {
      labels: apiData.items.map(a => a.motivo),
      datasets: [{
        label: 'Rechazos',
        data: apiData.items.map(a => a.cantidad),
        backgroundColor: apiData.items.map(a => motivoColors[a.motivo] || '#6B7280'),
      }],
    };
  }, [apiData]);

  const lineData = useMemo(() => {
    if (!apiData?.por_mes?.length) return null;
    return {
      labels: apiData.por_mes.map(t => t.mes),
      datasets: [{
        label: 'Cantidad Rechazos',
        data: apiData.por_mes.map(t => t.cantidad),
        borderColor: theme.colors.danger,
        backgroundColor: `${theme.colors.danger}20`,
        fill: true,
        tension: 0.4,
      }],
    };
  }, [apiData]);

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Motivos de Rechazo</PageTitle>

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
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{apiData.total}</SummaryValue>
              <SummaryLabel>Total Rechazos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={motivoPrincipal ? motivoColors[motivoPrincipal.motivo] || '#6B7280' : theme.colors.warning}>
              <SummaryValue>{motivoPrincipal?.cantidad || 0}</SummaryValue>
              <SummaryLabel>Motivo: {motivoPrincipal?.motivo || '-'}</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{apiData.items?.length || 0}</SummaryValue>
              <SummaryLabel>Tipos de Motivos</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{ultimoMes?.cantidad || 0}</SummaryValue>
              <SummaryLabel>Ultimo Mes</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsRow>
            {pieData && (
              <ChartCard>
                <ChartTitle>Distribucion por Motivo</ChartTitle>
                <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
              </ChartCard>
            )}
            {barData && (
              <ChartCard>
                <ChartTitle>Rechazos por Motivo</ChartTitle>
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </ChartCard>
            )}
            {lineData && (
              <ChartCard>
                <ChartTitle>Tendencia Mensual</ChartTitle>
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </ChartCard>
            )}
          </ChartsRow>

          <ChartCard>
            <ChartTitle>Ranking de Motivos</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Motivo</Th>
                  <Th>Cantidad</Th>
                  <Th>Porcentaje</Th>
                  <Th style={{ width: '40%' }}>Distribucion</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={5} style={{ textAlign: 'center' }}>
                      No hay datos de motivos de rechazo
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((m, idx) => (
                    <tr key={m.motivo}>
                      <Td style={{ fontWeight: 600 }}>{idx + 1}</Td>
                      <Td>
                        <Badge $color={motivoColors[m.motivo] || '#6B7280'}>{m.motivo}</Badge>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{m.cantidad}</Td>
                      <Td>{m.porcentaje.toFixed(1)}%</Td>
                      <Td>
                        <ProgressBar $value={m.porcentaje * 3} $color={motivoColors[m.motivo] || '#6B7280'} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </ChartCard>

          {apiData.por_mes && apiData.por_mes.length > 0 && (
            <ChartCard style={{ marginTop: '1.5rem' }}>
              <ChartTitle>Rechazos por Mes</ChartTitle>
              <Table>
                <thead>
                  <tr>
                    <Th>Mes</Th>
                    <Th>Cantidad</Th>
                  </tr>
                </thead>
                <tbody>
                  {apiData.por_mes.map((m) => (
                    <tr key={m.mes}>
                      <Td style={{ fontWeight: 600 }}>{m.mes}</Td>
                      <Td style={{ fontWeight: 600, color: theme.colors.danger }}>{m.cantidad}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ChartCard>
          )}
        </>
      )}
    </Container>
  );
}
