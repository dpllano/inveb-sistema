/**
 * ReportsDashboard Component
 * Dashboard de reportes disponibles en el sistema
 * Lista los reportes con acceso directo a cada uno
 */

import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

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

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1.5rem 0;
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const CategorySection = styled.div`
  margin-bottom: 2rem;
`;

const CategoryTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const ReportCard = styled.div<{ $status: 'available' | 'pending' | 'disabled' }>`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  cursor: ${({ $status }) => $status === 'available' ? 'pointer' : 'default'};
  transition: all 0.2s;
  opacity: ${({ $status }) => $status === 'disabled' ? 0.5 : 1};

  &:hover {
    ${({ $status }) => $status === 'available' && `
      border-color: ${theme.colors.primary};
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `}
  }
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const ReportTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const StatusBadge = styled.span<{ $status: 'available' | 'pending' | 'disabled' }>`
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;

  ${({ $status }) => {
    switch ($status) {
      case 'available':
        return `
          background: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      case 'pending':
        return `
          background: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
      case 'disabled':
        return `
          background: ${theme.colors.textSecondary}20;
          color: ${theme.colors.textSecondary};
        `;
    }
  }}
`;

const ReportDescription = styled.p`
  font-size: 0.8rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
`;

const IconContainer = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const InfoCard = styled.div`
  background: ${theme.colors.primary}10;
  border: 1px solid ${theme.colors.primary}30;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: ${theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

// Types
interface Report {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'pending' | 'disabled';
  route?: string;
}

interface ReportCategory {
  name: string;
  reports: Report[];
}

interface ReportsDashboardProps {
  onNavigate: (page: string, id?: number) => void;
}

// Report definitions
const reportCategories: ReportCategory[] = [
  {
    name: 'OTs y Gestion',
    reports: [
      {
        id: 'active-ots-per-area',
        title: 'OTs Activas por Usuario',
        description: 'Visualiza la distribucion de OTs activas por usuario y area',
        icon: '📊',
        status: 'available',
        route: 'reporte-ots-activas',
      },
      {
        id: 'completed-ots',
        title: 'OTs Completadas',
        description: 'Resumen de OTs completadas con metricas de tiempo',
        icon: '✅',
        status: 'available',
        route: 'reporte-ots-completadas',
      },
      {
        id: 'completed-ots-dates',
        title: 'OTs Completadas Entre Fechas',
        description: 'Filtro avanzado de OTs completadas por rango de fechas',
        icon: '📅',
        status: 'available',
        route: 'reporte-ots-completadas-fechas',
      },
      {
        id: 'gestion-ot-actives',
        title: 'Gestion OTs Activas',
        description: 'Dashboard de gestion de OTs en proceso',
        icon: '⚙️',
        status: 'available',
        route: 'reporte-gestion-ots-activas',
      },
      {
        id: 'gestion-load-month',
        title: 'Carga de OTs por Mes',
        description: 'Analisis de carga de trabajo mensual',
        icon: '📈',
        status: 'available',
        route: 'reporte-carga-mensual',
      },
    ],
  },
  {
    name: 'Tiempos y Rendimiento',
    reports: [
      {
        id: 'time-by-area',
        title: 'Tiempo por Area',
        description: 'Tiempo promedio de OTs por area mensual',
        icon: '⏱️',
        status: 'available',
        route: 'reporte-tiempo-area',
      },
      {
        id: 'tiempo-disenador-externo',
        title: 'Tiempo Disenador Externo',
        description: 'Metricas de tiempo para disenadores externos',
        icon: '🎨',
        status: 'available',
        route: 'reporte-tiempo-disenador-externo',
      },
      {
        id: 'tiempo-primera-muestra',
        title: 'Tiempo Primera Muestra',
        description: 'Tiempo hasta la primera muestra por OT',
        icon: '🧪',
        status: 'available',
        route: 'reporte-tiempo-primera-muestra',
      },
    ],
  },
  {
    name: 'Sala de Muestras',
    reports: [
      {
        id: 'sala-muestra',
        title: 'Sala de Muestra',
        description: 'Estado y gestion de la sala de muestras',
        icon: '🏭',
        status: 'available',
        route: 'reporte-sala-muestra',
      },
      {
        id: 'indicador-sala-muestra',
        title: 'Indicador Sala Muestra',
        description: 'KPIs de la sala de muestras',
        icon: '📍',
        status: 'available',
        route: 'reporte-indicador-sala-muestra',
      },
      {
        id: 'diseno-estructural-sala',
        title: 'Diseno Estructural y Sala Muestra',
        description: 'Relacion entre diseno y sala de muestras',
        icon: '📐',
        status: 'available',
        route: 'reporte-diseno-estructural-sala',
      },
      {
        id: 'muestras',
        title: 'Muestras',
        description: 'Listado y estado de muestras',
        icon: '📦',
        status: 'available',
        route: 'reporte-muestras',
      },
    ],
  },
  {
    name: 'Rechazos y Anulaciones',
    reports: [
      {
        id: 'anulaciones',
        title: 'Anulaciones',
        description: 'Registro de OTs anuladas con motivos y tendencias',
        icon: '❌',
        status: 'available',
        route: 'reporte-anulaciones',
      },
      {
        id: 'rechazos-mes',
        title: 'Rechazos por Mes',
        description: 'Tendencia de rechazos mensual',
        icon: '📉',
        status: 'available',
        route: 'reporte-rechazos',
      },
      {
        id: 'reasons-rejection',
        title: 'Motivos de Rechazo',
        description: 'Analisis de razones de rechazo por mes',
        icon: '🔍',
        status: 'available',
        route: 'reporte-motivos-rechazo',
      },
    ],
  },
];

export default function ReportsDashboard({ onNavigate }: ReportsDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleReportClick = (report: Report) => {
    if (report.status === 'available' && report.route) {
      onNavigate(report.route);
    } else if (report.status === 'pending') {
      setSelectedReport(report.id);
      setTimeout(() => setSelectedReport(null), 2000);
    }
  };

  const getStatusLabel = (status: Report['status']) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'pending':
        return 'En desarrollo';
      case 'disabled':
        return 'Deshabilitado';
    }
  };

  const totalReports = reportCategories.reduce((sum, cat) => sum + cat.reports.length, 0);
  const availableReports = reportCategories.reduce(
    (sum, cat) => sum + cat.reports.filter(r => r.status === 'available').length,
    0
  );

  return (
    <Container>
      <BackLink onClick={() => onNavigate('dashboard')}>← Volver</BackLink>
      <Title>Reporteria ({availableReports}/{totalReports} disponibles)</Title>

      <InfoCard>
        <InfoText>
          Los reportes estan siendo migrados desde el sistema Laravel. Cada reporte mostrara
          graficos interactivos con Chart.js y permitira filtrar por fechas, areas y usuarios.
          Los reportes marcados como "En desarrollo" estaran disponibles proximamente.
        </InfoText>
      </InfoCard>

      {selectedReport && (
        <InfoCard style={{ background: `${theme.colors.warning}10`, borderColor: `${theme.colors.warning}30` }}>
          <InfoText style={{ color: theme.colors.warning }}>
            Este reporte esta en desarrollo. Estara disponible proximamente.
          </InfoText>
        </InfoCard>
      )}

      {reportCategories.map((category) => (
        <CategorySection key={category.name}>
          <CategoryTitle>{category.name}</CategoryTitle>
          <ReportsGrid>
            {category.reports.map((report) => (
              <ReportCard
                key={report.id}
                $status={report.status}
                onClick={() => handleReportClick(report)}
              >
                <IconContainer>{report.icon}</IconContainer>
                <ReportHeader>
                  <ReportTitle>{report.title}</ReportTitle>
                  <StatusBadge $status={report.status}>
                    {getStatusLabel(report.status)}
                  </StatusBadge>
                </ReportHeader>
                <ReportDescription>{report.description}</ReportDescription>
              </ReportCard>
            ))}
          </ReportsGrid>
        </CategorySection>
      ))}
    </Container>
  );
}
