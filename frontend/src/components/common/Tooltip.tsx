/**
 * Tooltip Component - INVEB
 * Sprint T.1 - Help/Tooltips
 *
 * Componente de tooltip reutilizable basado en el comportamiento de Laravel Bootstrap.
 * Soporta posicionamiento, contenido HTML y estilos personalizados.
 */

import { useState, useRef, useEffect, ReactNode, CSSProperties } from 'react';
import styled from 'styled-components';
import { theme } from '../../theme';

// =============================================================================
// TIPOS
// =============================================================================

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Contenido del tooltip */
  content: ReactNode;
  /** Elementos hijos (trigger) */
  children: ReactNode;
  /** Posicion del tooltip */
  position?: TooltipPosition;
  /** Delay antes de mostrar (ms) */
  delay?: number;
  /** Ancho maximo del tooltip */
  maxWidth?: number;
  /** Si el tooltip esta deshabilitado */
  disabled?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const TooltipWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const TooltipContent = styled.div<{
  $position: TooltipPosition;
  $visible: boolean;
  $maxWidth: number;
}>`
  position: absolute;
  z-index: 1000;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  background-color: ${theme.colors.textPrimary};
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
  max-width: ${({ $maxWidth }) => $maxWidth}px;
  white-space: ${({ $maxWidth }) => ($maxWidth < 300 ? 'nowrap' : 'normal')};
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  /* Posicionamiento */
  ${({ $position }) => {
    switch ($position) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        `;
      case 'bottom':
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        `;
      case 'left':
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        `;
      case 'right':
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        `;
    }
  }}

  /* Flecha */
  &::after {
    content: '';
    position: absolute;
    border: 6px solid transparent;

    ${({ $position }) => {
      switch ($position) {
        case 'top':
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-top-color: ${theme.colors.textPrimary};
          `;
        case 'bottom':
          return `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-bottom-color: ${theme.colors.textPrimary};
          `;
        case 'left':
          return `
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-left-color: ${theme.colors.textPrimary};
          `;
        case 'right':
          return `
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-right-color: ${theme.colors.textPrimary};
          `;
      }
    }}
  }
`;

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = 250,
  disabled = false,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!content || disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipWrapper
      className={className}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <TooltipContent
        $position={position}
        $visible={visible}
        $maxWidth={maxWidth}
        role="tooltip"
      >
        {content}
      </TooltipContent>
    </TooltipWrapper>
  );
}

// =============================================================================
// COMPONENTES ESPECIALIZADOS
// =============================================================================

/**
 * Tooltip para iconos de acciones (ver, editar, eliminar)
 */
export function ActionTooltip({
  children,
  label,
  position = 'top',
}: {
  children: ReactNode;
  label: string;
  position?: TooltipPosition;
}) {
  return (
    <Tooltip content={label} position={position} delay={100}>
      {children}
    </Tooltip>
  );
}

/**
 * Tooltip para texto truncado que muestra el texto completo
 */
export function TruncatedTooltip({
  text,
  maxLength = 30,
  className,
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate
    ? `${text.substring(0, maxLength)}...`
    : text;

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <Tooltip content={text} maxWidth={350}>
      <span className={className} style={{ cursor: 'help' }}>
        {displayText}
      </span>
    </Tooltip>
  );
}

/**
 * Tooltip para fechas que muestra tiempo relativo
 */
export function DateTooltip({
  date,
  format = 'short',
}: {
  date: Date | string;
  format?: 'short' | 'long';
}) {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formattedDate =
    format === 'short'
      ? d.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })
      : d.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

  const relativeTime = getRelativeTime(d);

  return (
    <Tooltip content={relativeTime}>
      <span style={{ cursor: 'help' }}>{formattedDate}</span>
    </Tooltip>
  );
}

/**
 * Tooltip para iconos de tipo de OT
 */
export function OTTypeTooltip({
  typeId,
  children,
}: {
  typeId: number;
  children: ReactNode;
}) {
  const typeLabels: Record<number, string> = {
    1: 'Desarrollo Completo',
    2: 'Arte Sin Material',
    3: 'Desarrollo Rapido',
    4: 'Modificacion',
    5: 'Arte Con Material',
    6: 'Cotizacion',
    7: 'Catalogacion',
    8: 'Licitacion',
    9: 'Ficha Tecnica',
    10: 'Estudio Benchmarking',
    11: 'Proyecto Innovacion',
  };

  return (
    <Tooltip content={typeLabels[typeId] || 'Tipo desconocido'}>
      {children}
    </Tooltip>
  );
}

/**
 * Tooltip de ayuda con icono de interrogacion
 */
const HelpIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${theme.colors.textSecondary}30;
  color: ${theme.colors.textSecondary};
  font-size: 10px;
  font-weight: bold;
  cursor: help;
  margin-left: 4px;
`;

export function HelpTooltip({
  content,
  position = 'top',
}: {
  content: ReactNode;
  position?: TooltipPosition;
}) {
  return (
    <Tooltip content={content} position={position} maxWidth={300}>
      <HelpIcon>?</HelpIcon>
    </Tooltip>
  );
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Calcula tiempo relativo (hace X dias, etc.)
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} dias`;
  if (diffWeeks === 1) return 'hace 1 semana';
  if (diffWeeks < 4) return `hace ${diffWeeks} semanas`;
  if (diffMonths === 1) return 'hace 1 mes';
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  if (diffYears === 1) return 'hace 1 ano';
  return `hace ${diffYears} anos`;
}

export default Tooltip;
