/**
 * WorkOrderDetailModal Component
 * Modal reutilizable para mostrar detalles de una OT
 *
 * Uso:
 * - En listados de OTs para vista rápida
 * - En páginas que necesitan mostrar resumen de OT
 *
 * Fuente Laravel: modal-ot-licitacion.blade.php, modal-ot-view.blade.php
 */

import { useMemo } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { theme } from '../../theme';

// =============================================
// TIPOS
// =============================================

export interface WorkOrderDetail {
  id: number;
  numero_ot?: string;
  descripcion?: string;
  codigo_producto?: string;
  // Cliente
  client_id?: number;
  client_name?: string;
  // Estado
  state_id?: number;
  state_name?: string;
  state_color?: string;
  // Fechas
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_compromiso?: string;
  // Comercial
  tipo_solicitud_id?: number;
  tipo_solicitud_name?: string;
  canal_id?: number;
  canal_name?: string;
  // Contacto
  nombre_contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  // Planta
  planta_id?: number;
  planta_name?: string;
  // OT Especial
  ajuste_area_desarrollo?: number;
  // Cantidad
  cantidad?: number;
  // Usuario asignado
  user_asignado_id?: number;
  user_asignado_name?: string;
  // Observaciones
  observacion?: string;
}

export interface WorkOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderDetail | null;
  onEdit?: (id: number) => void;
  onManage?: (id: number) => void;
}

// =============================================
// STYLED COMPONENTS
// =============================================

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  background: ${theme.colors.bgLight};
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid ${theme.colors.border};
  font-size: 0.8rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const SectionBody = styled.div`
  padding: 0.75rem;
`;

const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.35rem 0;
  border-bottom: 1px dashed ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const FieldLabel = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  flex-shrink: 0;
`;

const FieldValue = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.textPrimary};
  text-align: right;
  word-break: break-word;
`;

const Badge = styled.span<{ $color?: string }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  background: ${({ $color }) => $color || theme.colors.primary}20;
  color: ${({ $color }) => $color || theme.colors.primary};
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid ${theme.colors.border};
`;

const OTNumber = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${theme.colors.primary};
  margin: 0;
`;

const OTDescription = styled.p`
  font-size: 0.9rem;
  color: ${theme.colors.textPrimary};
  margin: 0.25rem 0 0 0;
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${theme.colors.border};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
        background: ${theme.colors.primary};
        color: white;
        &:hover { opacity: 0.9; }
      `
      : `
        background: ${theme.colors.bgLight};
        color: ${theme.colors.textSecondary};
        border: 1px solid ${theme.colors.border};
        &:hover { background: white; }
      `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
`;

// =============================================
// HELPER FUNCTIONS
// =============================================

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getOTTypeLabel(ajusteArea?: number): string | null {
  switch (ajusteArea) {
    case 1:
      return 'Licitación';
    case 2:
      return 'Ficha Técnica';
    case 3:
      return 'Estudio Benchmarking';
    default:
      return null;
  }
}

// =============================================
// COMPONENT
// =============================================

export default function WorkOrderDetailModal({
  isOpen,
  onClose,
  workOrder,
  onEdit,
  onManage,
}: WorkOrderDetailModalProps) {
  const otTypeLabel = useMemo(() => {
    return workOrder ? getOTTypeLabel(workOrder.ajuste_area_desarrollo) : null;
  }, [workOrder]);

  if (!workOrder) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Detalle de OT" size="lg">
        <EmptyState>No se encontraron datos de la OT</EmptyState>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle OT ${workOrder.numero_ot || `#${workOrder.id}`}`}
      size="lg"
    >
      {/* Header con número y descripción */}
      <HeaderInfo>
        <div>
          <OTNumber>OT {workOrder.numero_ot || `#${workOrder.id}`}</OTNumber>
          {workOrder.descripcion && <OTDescription>{workOrder.descripcion}</OTDescription>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {workOrder.state_name && (
            <Badge $color={workOrder.state_color}>{workOrder.state_name}</Badge>
          )}
          {otTypeLabel && <Badge $color="#9c27b0">{otTypeLabel}</Badge>}
        </div>
      </HeaderInfo>

      {/* Grid de secciones */}
      <SectionGrid>
        {/* Datos Comerciales */}
        <Section>
          <SectionHeader>Datos Comerciales</SectionHeader>
          <SectionBody>
            <FieldRow>
              <FieldLabel>Cliente</FieldLabel>
              <FieldValue>{workOrder.client_name || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Tipo Solicitud</FieldLabel>
              <FieldValue>{workOrder.tipo_solicitud_name || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Canal</FieldLabel>
              <FieldValue>{workOrder.canal_name || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Código Producto</FieldLabel>
              <FieldValue>{workOrder.codigo_producto || '-'}</FieldValue>
            </FieldRow>
          </SectionBody>
        </Section>

        {/* Contacto */}
        <Section>
          <SectionHeader>Contacto</SectionHeader>
          <SectionBody>
            <FieldRow>
              <FieldLabel>Nombre</FieldLabel>
              <FieldValue>{workOrder.nombre_contacto || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Email</FieldLabel>
              <FieldValue>{workOrder.email_contacto || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Teléfono</FieldLabel>
              <FieldValue>{workOrder.telefono_contacto || '-'}</FieldValue>
            </FieldRow>
          </SectionBody>
        </Section>

        {/* Producción */}
        <Section>
          <SectionHeader>Producción</SectionHeader>
          <SectionBody>
            <FieldRow>
              <FieldLabel>Planta</FieldLabel>
              <FieldValue>{workOrder.planta_name || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Cantidad</FieldLabel>
              <FieldValue>{workOrder.cantidad?.toLocaleString() || '-'}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Asignado a</FieldLabel>
              <FieldValue>{workOrder.user_asignado_name || '-'}</FieldValue>
            </FieldRow>
          </SectionBody>
        </Section>

        {/* Fechas */}
        <Section>
          <SectionHeader>Fechas</SectionHeader>
          <SectionBody>
            <FieldRow>
              <FieldLabel>Creación</FieldLabel>
              <FieldValue>{formatDate(workOrder.fecha_creacion)}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Actualización</FieldLabel>
              <FieldValue>{formatDate(workOrder.fecha_actualizacion)}</FieldValue>
            </FieldRow>
            <FieldRow>
              <FieldLabel>Compromiso</FieldLabel>
              <FieldValue>{formatDate(workOrder.fecha_compromiso)}</FieldValue>
            </FieldRow>
          </SectionBody>
        </Section>
      </SectionGrid>

      {/* Observaciones */}
      {workOrder.observacion && (
        <Section style={{ marginBottom: '1rem' }}>
          <SectionHeader>Observaciones</SectionHeader>
          <SectionBody>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              {workOrder.observacion}
            </p>
          </SectionBody>
        </Section>
      )}

      {/* Botones de acción */}
      <ButtonsRow>
        <Button onClick={onClose}>Cerrar</Button>
        {onManage && (
          <Button $variant="secondary" onClick={() => onManage(workOrder.id)}>
            Gestionar
          </Button>
        )}
        {onEdit && (
          <Button $variant="primary" onClick={() => onEdit(workOrder.id)}>
            Editar
          </Button>
        )}
      </ButtonsRow>
    </Modal>
  );
}
