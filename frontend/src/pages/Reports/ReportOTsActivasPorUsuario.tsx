/**
 * ReportOTsActivasPorUsuario Component
 * Reporte de OTs activas distribuidas por usuario y area
 * Incluye graficos de barras con Chart.js
 * Conectado a API real de QAS
 */

import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { theme } from '../../theme';
import { reportsApi, type OTsPorUsuarioResponse } from '../../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
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

  &:hover {
    text-decoration: underline;
  }
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

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $variant }) => $variant === 'primary' ? theme.colors.primary : theme.colors.border};
  background: ${({ $variant }) => $variant === 'primary' ? theme.colors.primary : 'white'};
  color: ${({ $variant }) => $variant === 'primary' ? 'white' : theme.colors.textPrimary};
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
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

const ProgressBar = styled.div<{ $percentage: number; $color: string }>`
  height: 8px;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $percentage }) => $percentage}%;
    background: ${({ $color }) => $color};
    border-radius: 4px;
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
interface ReportOTsActivasPorUsuarioProps {
  onNavigate: (page: string, id?: number) => void;
}

interface UserOTData {
  userId: number;
  userName: string;
  area: string;
  areaId: number | null;
  otsActivas: number;
  otsCompletadas: number;
  totalOTs: number;
  tiempoPromedioDias: number;
}

const areaColors: Record<string, string> = {
  'Ventas': '#4F46E5',
  'Desarrollo': '#059669',
  'Diseno Grafico': '#D97706',
  'Catalogacion': '#DC2626',
  'Precatalogacion': '#7C3AED',
  'Muestra': '#0891B2',
  'Sin asignar': '#6B7280',
};

export default function ReportOTsActivasPorUsuario({ onNavigate }: ReportOTsActivasPorUsuarioProps) {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [dateDesde, setDateDesde] = useState<string>('');
  const [dateHasta, setDateHasta] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<OTsPorUsuarioResponse | null>(null);

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.getOTsPorUsuario({
        date_desde: dateDesde || undefined,
        date_hasta: dateHasta || undefined,
        area_id: selectedArea !== 'all' ? parseInt(selectedArea) : undefined,
      });
      setApiData(response);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Error al cargar los datos del reporte. Intente nuevamente.');
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

  // Transform API data to component format
  const userData: UserOTData[] = useMemo(() => {
    if (!apiData) return [];
    return apiData.items.map(item => ({
      userId: item.usuario_id,
      userName: item.usuario_nombre,
      area: item.area_nombre,
      areaId: item.area_id,
      otsActivas: item.ots_activas,
      otsCompletadas: item.ots_completadas,
      totalOTs: item.total_ots,
      tiempoPromedioDias: item.tiempo_promedio,
    }));
  }, [apiData]);

  // Calculate summaries
  const summary = useMemo(() => {
    return {
      totalOTsActivas: userData.reduce((sum, u) => sum + u.otsActivas, 0),
      totalCompletadas: userData.reduce((sum, u) => sum + u.otsCompletadas, 0),
      totalOTs: apiData?.total_ots || 0,
      totalUsuarios: apiData?.total_usuarios || 0,
    };
  }, [userData, apiData]);

  // Chart data - Bar chart by user
  const barChartData = useMemo(() => ({
    labels: userData.slice(0, 10).map(u => u.userName.split(' ')[0]),
    datasets: [
      {
        label: 'OTs Activas',
        data: userData.slice(0, 10).map(u => u.otsActivas),
        backgroundColor: '#60A5FA',
      },
      {
        label: 'OTs Completadas',
        data: userData.slice(0, 10).map(u => u.otsCompletadas),
        backgroundColor: '#34D399',
      },
    ],
  }), [userData]);

  // Pie chart - Distribution by area
  const pieChartData = useMemo(() => {
    const areaData = userData.reduce((acc, u) => {
      const key = u.area || 'Sin asignar';
      acc[key] = (acc[key] || 0) + u.totalOTs;
      return acc;
    }, {} as Record<string, number>);

    const entries = Object.entries(areaData);

    return {
      labels: entries.map(([area]) => area),
      datasets: [{
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map(([area]) => areaColors[area] || '#6B7280'),
      }],
    };
  }, [userData]);

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const maxOTs = Math.max(...userData.map(u => u.totalOTs), 1);
  const areas = apiData?.areas || [];

  return (
    <Container>
      <BackLink onClick={() => onNavigate('reportes')}>← Volver a Reportes</BackLink>
      <PageTitle>OTs Activas por Usuario</PageTitle>

      {/* Filters */}
      <FiltersCard>
        <FiltersRow>
          <FilterGroup>
            <Label>Area</Label>
            <Select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
              <option value="all">Todas las Areas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id.toString()}>{area.nombre}</option>
              ))}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Fecha Desde</Label>
            <Input
              type="date"
              value={dateDesde}
              onChange={(e) => setDateDesde(e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Fecha Hasta</Label>
            <Input
              type="date"
              value={dateHasta}
              onChange={(e) => setDateHasta(e.target.value)}
            />
          </FilterGroup>
          <Button $variant="primary" onClick={handleApplyFilters} disabled={loading}>
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </Button>
        </FiltersRow>
      </FiltersCard>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {loading ? (
        <LoadingMessage>Cargando datos del reporte...</LoadingMessage>
      ) : (
        <>
          {/* Summary Cards */}
          <SummaryGrid>
            <SummaryCard $color={theme.colors.primary}>
              <SummaryValue>{summary.totalOTs}</SummaryValue>
              <SummaryLabel>OTs Totales</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#60A5FA">
              <SummaryValue>{summary.totalOTsActivas}</SummaryValue>
              <SummaryLabel>OTs Activas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color={theme.colors.success}>
              <SummaryValue>{summary.totalCompletadas}</SummaryValue>
              <SummaryLabel>OTs Completadas</SummaryLabel>
            </SummaryCard>
            <SummaryCard $color="#7C3AED">
              <SummaryValue>{summary.totalUsuarios}</SummaryValue>
              <SummaryLabel>Usuarios Activos</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>

          {/* Charts */}
          <ChartsGrid>
            <ChartCard>
              <ChartTitle>Top 10 Usuarios por OTs</ChartTitle>
              {userData.length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <LoadingMessage>No hay datos para mostrar</LoadingMessage>
              )}
            </ChartCard>
            <ChartCard>
              <ChartTitle>Distribucion por Area</ChartTitle>
              {userData.length > 0 ? (
                <Pie data={pieChartData} options={pieChartOptions} />
              ) : (
                <LoadingMessage>No hay datos para mostrar</LoadingMessage>
              )}
            </ChartCard>
          </ChartsGrid>

          {/* Detail Table */}
          <ChartCard>
            <ChartTitle>Detalle por Usuario ({userData.length} registros)</ChartTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Usuario</Th>
                  <Th>Area</Th>
                  <Th>OTs Totales</Th>
                  <Th>Activas</Th>
                  <Th>Completadas</Th>
                  <Th>Tiempo Prom. (dias)</Th>
                  <Th style={{ width: '150px' }}>Carga</Th>
                </tr>
              </thead>
              <tbody>
                {userData.length === 0 ? (
                  <tr>
                    <Td colSpan={7} style={{ textAlign: 'center' }}>
                      No hay datos disponibles para los filtros seleccionados
                    </Td>
                  </tr>
                ) : (
                  userData.map((user) => (
                    <tr key={`${user.userId}-${user.areaId}`}>
                      <Td style={{ fontWeight: 500 }}>{user.userName}</Td>
                      <Td>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: `${areaColors[user.area] || '#6B7280'}20`,
                          color: areaColors[user.area] || '#6B7280'
                        }}>
                          {user.area}
                        </span>
                      </Td>
                      <Td style={{ fontWeight: 600 }}>{user.totalOTs}</Td>
                      <Td>{user.otsActivas}</Td>
                      <Td>{user.otsCompletadas}</Td>
                      <Td>{user.tiempoPromedioDias.toFixed(1)}</Td>
                      <Td>
                        <ProgressBar
                          $percentage={(user.totalOTs / maxOTs) * 100}
                          $color={areaColors[user.area] || theme.colors.primary}
                        />
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
