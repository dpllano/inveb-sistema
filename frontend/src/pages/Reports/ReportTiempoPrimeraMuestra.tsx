/**
 * ReportTiempoPrimeraMuestra Component
 * Reporte de tiempo hasta la primera muestra por OT
 * Conectado a API real de QAS
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
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type TiempoPrimeraMuestraResponse } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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
interface ReportTiempoPrimeraMuestraProps {
  onNavigate: (page: string, id?: number) => void;
}

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

export default function ReportTiempoPrimeraMuestra({ onNavigate }: ReportTiempoPrimeraMuestraProps) {
  const defaultDates = getDefaultDates();
  const [fechaDesde, setFechaDesde] = useState(defaultDates.firstDay);
  const [fechaHasta, setFechaHasta] = useState(defaultDates.lastDayStr);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<TiempoPrimeraMuestraResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getTiempoPrimeraMuestra({
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

  // Distribution chart
  const barChartData = useMemo(() => {
    if (!apiData?.items?.length) return null;
    const ranges = [
      { label: '0-5 dias', min: 0, max: 5, color: theme.colors.success },
      { label: '6-10 dias', min: 6, max: 10, color: '#60A5FA' },
      { label: '11-15 dias', min: 11, max: 15, color: theme.colors.warning },
      { label: '16+ dias', min: 16, max: 999, color: theme.colors.danger },
    ];

    const counts = ranges.map(range =>
      apiData.items.filter(item =>
        item.dias_hasta_muestra !== null &&
        item.dias_hasta_muestra >= range.min &&
        item.dias_hasta_muestra <= range.max
      ).length
    );

    return {
      labels: ranges.map(r => r.label),
      datasets: [{
        label: 'OTs',
        data: counts,
        backgroundColor: ranges.map(r => r.color),
      }],
    };
  }, [apiData]);

  // Variable para uso futuro: cantidad de items con muestra
  // const conMuestra = apiData?.items?.filter(i => i.dias_hasta_muestra !== null).length || 0;

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>Tiempo Primera Muestra</PageTitle>

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
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{apiData.total}</SummaryValue>
              <SummaryLabel>Total OTs</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.warning}>
              <SummaryValue>{apiData.promedio_dias.toFixed(1)}d</SummaryValue>
              <SummaryLabel>Tiempo Promedio</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{apiData.minimo_dias.toFixed(1)}d</SummaryValue>
              <SummaryLabel>Tiempo Minimo</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.danger}>
              <SummaryValue>{apiData.maximo_dias.toFixed(1)}d</SummaryValue>
              <SummaryLabel>Tiempo Maximo</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          <ChartsGrid>
            {barChartData && (
              <ChartCard>
                <ChartTitle>Distribucion por Tiempo hasta Primera Muestra</ChartTitle>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </ChartCard>
            )}
          </ChartsGrid>

          <ChartCard>
            <ChartTitle>Detalle de OTs ({apiData.total} registros)</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>OT ID</Th>
                  <Th>Cliente</Th>
                  <Th>Descripcion</Th>
                  <Th>Creacion</Th>
                  <Th>Primera Muestra</Th>
                  <Th>Dias</Th>
                  <Th>Estado</Th>
                </tr>
              </thead>
              <tbody>
                {apiData.items.length === 0 ? (
                  <tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      No hay datos en el periodo seleccionado
                    </Td>
                  </tr>
                ) : (
                  apiData.items.map((m) => (
                    <tr key={m.id}>
                      <Td style={{ fontWeight: 600 }}>#{m.id}</Td>
                      <Td>{m.client_name || 'Sin cliente'}</Td>
                      <Td>{m.descripcion?.substring(0, 40) || '-'}...</Td>
                      <Td>{m.created_at}</Td>
                      <Td>{m.primera_muestra_at || '-'}</Td>
                      <Td style={{
                        fontWeight: 600,
                        color: m.dias_hasta_muestra === null
                          ? theme.colors.textSecondary
                          : m.dias_hasta_muestra <= 10
                          ? theme.colors.success
                          : m.dias_hasta_muestra <= 15
                          ? theme.colors.warning
                          : theme.colors.danger
                      }}>
                        {m.dias_hasta_muestra !== null ? `${m.dias_hasta_muestra}d` : 'Pendiente'}
                      </Td>
                      <Td>
                        <Badge $color={m.dias_hasta_muestra !== null ? theme.colors.success : theme.colors.warning}>
                          {m.dias_hasta_muestra !== null ? 'Con muestra' : 'Sin muestra'}
                        </Badge>
                      </Td>
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
