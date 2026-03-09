/**
 * ReportAnulaciones Component
 * Reporte de OTs anuladas con motivos y tendencias
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
import { reportsApi, type AnulacionesResponse } from '../../services/api';

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
interface ReportAnulacionesProps {
  onNavigate: (page: string, id?: number) => void;
}

const motivoColors: Record<string, string> = {
  'Cancelacion del cliente': '#DC2626',
  'Error en especificaciones': '#D97706',
  'Duplicado': '#7C3AED',
  'Cambio de prioridades': '#059669',
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

export default function ReportAnulaciones({ onNavigate }: ReportAnulacionesProps) {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<AnulacionesResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getAnulaciones({
        page,
        page_size: 20,
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
  }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchData();
  };

  // Group motivos
  const motivosAgrupados = useMemo(() => {
    if (!apiData) return [];
    const grouped: Record<string, number> = {};
    apiData.items.forEach(item => {
      const motivo = item.motivo || 'Otros';
      if (!grouped[motivo]) grouped[motivo] = 0;
      grouped[motivo]++;
    });
    return Object.entries(grouped)
      .map(([motivo, cantidad]) => ({ motivo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [apiData]);

  const promedioMensual = useMemo(() => {
    if (!apiData?.por_mes?.length) return 0;
    const total = apiData.por_mes.reduce((s, m) => s + m.cantidad, 0);
    return (total / apiData.por_mes.length).toFixed(1);
  }, [apiData]);

  const barChartData = useMemo(() => {
    if (!apiData?.por_mes?.length) return null;
    return {
      labels: apiData.por_mes.map(m => m.mes),
      datasets: [{
        label: 'Anulaciones',
        data: apiData.por_mes.map(m => m.cantidad),
        backgroundColor: theme.colors.danger,
      }],
    };
  }, [apiData]);

  const doughnutData = useMemo(() => {
    if (!motivosAgrupados.length) return null;
    return {
      labels: motivosAgrupados.map(r => r.motivo),
      datasets: [{
        data: motivosAgrupados.map(r => r.cantidad),
        backgroundColor: motivosAgrupados.map(r => motivoColors[r.motivo] || '#6B7280'),
        borderWidth: 0,
      }],
    };
  }, [motivosAgrupados]);

  const motivoPrincipal = motivosAgrupados[0]?.motivo || '-';
  const ultimoMes = apiData?.por_mes?.length
    ? apiData.por_mes[apiData.por_mes.length - 1].cantidad
    : 0;

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Anulaciones de OTs</PageTitle>

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
              <SummaryLabel>Total Anulaciones</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{promedioMensual}</SummaryValue>
              <SummaryLabel>Promedio Mensual</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{ultimoMes}</SummaryValue>
              <SummaryLabel>Ultimo Mes</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{motivoPrincipal.split(' ')[0]}</SummaryValue>
              <SummaryLabel>Motivo Principal</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Anulaciones por Mes</ChartTitle>
                <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
              </ChartCard>
            )}
            {doughnutData && (
              <ChartCard>
                <ChartTitle>Distribucion por Motivo</ChartTitle>
                <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCard>
            <ChartTitle>Ultimas Anulaciones ({apiData.total} registros)</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>OT ID</Th>
                  <Th>Cliente</Th>
                  <Th>Descripcion</Th>
                  <Th>Motivo</Th>
                  <Th>Fecha</Th>
                  <Th>Usuario</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={6} style={{ textAlign: 'center' }}>
                      No hay anulaciones en el periodo seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((a) => (
                    <tr key={a.id}>
                      <Td style={{ fontWeight: 600 }}>#{a.id}</Td>
                      <Td>{a.client_name || 'Sin cliente'}</Td>
                      <Td>{a.descripcion?.substring(0, 40) || '-'}...</Td>
                      <Td>
                        <Badge $color={motivoColors[a.motivo || 'Otros'] || '#6B7280'}>
                          {a.motivo || 'Sin motivo'}
                        </Badge>
                      </Td>
                      <Td>{a.fecha}</Td>
                      <Td>{a.usuario}</Td>
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
          </ChartCard>
        </>
      )}
    </Container>
  );
}
