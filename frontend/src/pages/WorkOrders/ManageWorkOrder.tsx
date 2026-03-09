/**
 * ManageWorkOrder Component
 * Gestion de OT: visualizar y transicionar por workflow
 * Incluye seccion de Gestionar Muestras segun logica Laravel
 */

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { theme } from '../../theme';
import { useManagementHistory, useWorkflowOptions, useTransitionWorkOrder, useWorkOrderDetail } from '../../hooks/useWorkOrders';
import { pdfsApi, muestrasApi, authApi, cotizacionesApi, type TransitionRequest, type MuestraListItem, type MuestraUpdate, type MuestraDetalle, type MuestraOptions } from '../../services/api';

// IDs de roles (sincronizados con App.tsx)
const ROLES = {
  Vendedor: 4,
  JefeVenta: 3,
  JefeDesarrollo: 5,
  Ingeniero: 6,
  JefeMuestras: 13,
  TecnicoMuestras: 14,
  SuperAdministrador: 18,
  Admin: 1,
};

// Constantes de áreas (work_space_id)
const AREAS = {
  Ventas: 1,
  Desarrollo: 2,
  Diseno: 3,
  Precatalogacion: 4,
  Catalogacion: 5,
  SalaMuestras: 6,
};

// Estados de muestra
const ESTADO_MUESTRA = {
  SinAsignar: 0,
  EnProceso: 1,
  Rechazada: 2,
  Terminada: 3,
  Anulada: 4,
  Devuelta: 5,
};

// ============================================================
// HELPER para validar coincidencia de sala_corte (Laravel línea 120)
// TecnicoMuestras solo puede actuar si su sala_corte_id coincide con
// alguna de las sala_corte_* de la muestra.
// JefeMuestras y JefeDesarrollo NO requieren esta validación.
// ============================================================
const matchesSalaCorte = (
  userSalaCorteId: number | null | undefined,
  muestra: MuestraListItem
): boolean => {
  if (!userSalaCorteId) return false;
  return (
    userSalaCorteId === muestra.sala_corte_vendedor ||
    userSalaCorteId === muestra.sala_corte_disenador ||
    userSalaCorteId === muestra.sala_corte_laboratorio ||
    userSalaCorteId === muestra.sala_corte_1 ||
    userSalaCorteId === muestra.sala_corte_2 ||
    userSalaCorteId === muestra.sala_corte_3 ||
    userSalaCorteId === muestra.sala_corte_4 ||
    userSalaCorteId === muestra.sala_corte_disenador_revision
  );
};

// Helper para verificar si rol puede ver muestras
const canViewMuestras = (roleId: number) => ([
  ROLES.Ingeniero, ROLES.JefeVenta, ROLES.Vendedor,
  ROLES.TecnicoMuestras, ROLES.JefeMuestras, ROLES.JefeDesarrollo,
  ROLES.SuperAdministrador, ROLES.Admin
] as number[]).includes(roleId);

// Helper para verificar si rol puede crear muestras
// Según Laravel muestras-ot.blade.php línea 12:
// - Ingeniero: siempre puede crear
// - Vendedor/JefeVenta: solo si OT está en área 1 (Ventas)
const canCreateMuestra = (roleId: number, currentAreaId?: number) => {
  if (roleId === ROLES.Ingeniero || roleId === ROLES.JefeDesarrollo) {
    return true;
  }
  if ((roleId === ROLES.Vendedor || roleId === ROLES.JefeVenta) && currentAreaId === AREAS.Ventas) {
    return true;
  }
  return false;
};

// ============================================================
// LÓGICA DE PERMISOS PARA ACCIONES DE MUESTRAS (según Laravel)
// Ver: resources/views/partials/muestras-ot.blade.php líneas 119-256
// ============================================================

// Helper para verificar si puede EDITAR muestra
// Reglas Laravel:
// - Vendedor/JefeVenta: Solo si área OT = 1
// - Ingeniero/JefeDesarrollo: Solo si área OT = 2 y estado != Rechazada(2), Terminada(3)
// - TecnicoMuestras: Solo si área OT = 6, estado válido, Y matchesSalaCorte (Laravel línea 120)
// - JefeMuestras/JefeDesarrollo: área OT = 6, estado válido, SIN validación sala_corte
const canEditMuestra = (
  roleId: number,
  currentAreaId?: number,
  estadoMuestra?: number,
  userSalaCorteId?: number | null,
  muestra?: MuestraListItem
) => {
  // Vendedor/JefeVenta: solo en área Ventas
  if ((roleId === ROLES.Vendedor || roleId === ROLES.JefeVenta)) {
    return currentAreaId === AREAS.Ventas;
  }
  // Ingeniero/JefeDesarrollo: solo en área Desarrollo y estado válido
  if ((roleId === ROLES.Ingeniero || roleId === ROLES.JefeDesarrollo)) {
    return currentAreaId === AREAS.Desarrollo &&
           estadoMuestra !== ESTADO_MUESTRA.Rechazada &&
           estadoMuestra !== ESTADO_MUESTRA.Terminada;
  }
  // JefeMuestras: área Sala de Muestras y estado válido (sin validación sala_corte)
  if (roleId === ROLES.JefeMuestras) {
    return currentAreaId === AREAS.SalaMuestras &&
           estadoMuestra !== ESTADO_MUESTRA.Rechazada &&
           estadoMuestra !== ESTADO_MUESTRA.Terminada &&
           estadoMuestra !== ESTADO_MUESTRA.Anulada;
  }
  // TecnicoMuestras: área Sala de Muestras, estado válido, Y matchesSalaCorte
  if (roleId === ROLES.TecnicoMuestras) {
    const estadoValido = currentAreaId === AREAS.SalaMuestras &&
           estadoMuestra !== ESTADO_MUESTRA.Rechazada &&
           estadoMuestra !== ESTADO_MUESTRA.Terminada &&
           estadoMuestra !== ESTADO_MUESTRA.Anulada;
    if (!estadoValido) return false;
    // Validar sala_corte (Laravel línea 120)
    if (!muestra) return false;
    return matchesSalaCorte(userSalaCorteId, muestra);
  }
  return false;
};

// Helper para verificar si puede TERMINAR muestra
// Reglas Laravel (líneas 189-234):
// - Solo TecnicoMuestras en área 6, estado En Proceso(1) o Devuelta(5), Y matchesSalaCorte
const canTerminarMuestra = (
  roleId: number,
  currentAreaId?: number,
  estadoMuestra?: number,
  userSalaCorteId?: number | null,
  muestra?: MuestraListItem
) => {
  if (roleId === ROLES.TecnicoMuestras && currentAreaId === AREAS.SalaMuestras) {
    const estadoValido = estadoMuestra === ESTADO_MUESTRA.EnProceso || estadoMuestra === ESTADO_MUESTRA.Devuelta;
    if (!estadoValido) return false;
    // Validar sala_corte (Laravel línea 120)
    if (!muestra) return false;
    return matchesSalaCorte(userSalaCorteId, muestra);
  }
  return false;
};

// Helper para verificar si puede TOGGLE PRIORITARIA
// Reglas Laravel (líneas 122-139, 267-284):
// - Solo JefeMuestras o JefeDesarrollo en área 6 (Sala de Muestras)
const canTogglePrioritaria = (roleId: number, currentAreaId?: number) => {
  if ((roleId === ROLES.JefeMuestras || roleId === ROLES.JefeDesarrollo)) {
    return currentAreaId === AREAS.SalaMuestras;
  }
  return false;
};

// Helper para verificar si puede ANULAR muestra
// Reglas Laravel (líneas 244-249):
// - Solo Ingeniero/JefeDesarrollo en área 2 y estado != Terminada(3), Rechazada(2)
const canAnularMuestra = (roleId: number, currentAreaId?: number, estadoMuestra?: number) => {
  if ((roleId === ROLES.Ingeniero || roleId === ROLES.JefeDesarrollo)) {
    return currentAreaId === AREAS.Desarrollo &&
           estadoMuestra !== ESTADO_MUESTRA.Terminada &&
           estadoMuestra !== ESTADO_MUESTRA.Rechazada;
  }
  return false;
};

// Helper para verificar si puede RECHAZAR muestra
// Reglas Laravel (líneas 170-178):
// - TecnicoMuestras: área 6, estado válido, Y matchesSalaCorte
// - JefeMuestras: área 6, estado válido, SIN validación sala_corte
const canRechazarMuestra = (
  roleId: number,
  currentAreaId?: number,
  estadoMuestra?: number,
  userSalaCorteId?: number | null,
  muestra?: MuestraListItem
) => {
  const estadoValido = currentAreaId === AREAS.SalaMuestras &&
         estadoMuestra !== ESTADO_MUESTRA.Rechazada &&
         estadoMuestra !== ESTADO_MUESTRA.Terminada;
  if (!estadoValido) return false;

  // JefeMuestras: sin validación sala_corte
  if (roleId === ROLES.JefeMuestras) {
    return true;
  }
  // TecnicoMuestras: requiere matchesSalaCorte
  if (roleId === ROLES.TecnicoMuestras) {
    if (!muestra) return false;
    return matchesSalaCorte(userSalaCorteId, muestra);
  }
  return false;
};

// Helper para verificar si puede DEVOLVER muestra
// Reglas Laravel (líneas 179-185):
// - TecnicoMuestras: área 6, estado válido, Y matchesSalaCorte
// - JefeMuestras: área 6, estado válido, SIN validación sala_corte
const canDevolverMuestra = (
  roleId: number,
  currentAreaId?: number,
  estadoMuestra?: number,
  userSalaCorteId?: number | null,
  muestra?: MuestraListItem
) => {
  const estadoValido = currentAreaId === AREAS.SalaMuestras &&
         estadoMuestra !== ESTADO_MUESTRA.Devuelta &&
         estadoMuestra !== ESTADO_MUESTRA.Anulada &&
         estadoMuestra !== ESTADO_MUESTRA.Terminada &&
         estadoMuestra !== ESTADO_MUESTRA.Rechazada;
  if (!estadoValido) return false;

  // JefeMuestras: sin validación sala_corte
  if (roleId === ROLES.JefeMuestras) {
    return true;
  }
  // TecnicoMuestras: requiere matchesSalaCorte
  if (roleId === ROLES.TecnicoMuestras) {
    if (!muestra) return false;
    return matchesSalaCorte(userSalaCorteId, muestra);
  }
  return false;
};

// Helper para verificar si puede VER detalles de muestra
// Reglas Laravel (línea 250-255):
// - Todos pueden ver si estado = Terminada(3)
const canVerDetalleMuestra = (roleId: number, estadoMuestra?: number) => {
  if (estadoMuestra === ESTADO_MUESTRA.Terminada) {
    return [ROLES.TecnicoMuestras, ROLES.JefeMuestras, ROLES.JefeDesarrollo, ROLES.Ingeniero].includes(roleId);
  }
  return false;
};

// ============================================================
// LÓGICA PARA BOTÓN "COTIZAR OT" (según Laravel gestionar-ot.blade.php líneas 10-33)
// ============================================================
// Helper para verificar si OT tiene campos completos para cotizar
// Campos requeridos: area_hc (calculado), golpes_largo, golpes_ancho, largura_hm, anchura_hm, process_id, carton_id
const getCamposFaltantesCotizacion = (ot: Record<string, unknown>): string[] => {
  const camposFaltantes: string[] = [];

  // Verificar campos directos
  if (!ot.golpes_largo) camposFaltantes.push('Golpes al Largo');
  if (!ot.golpes_ancho) camposFaltantes.push('Golpes al Ancho');
  if (!ot.largura_hm) camposFaltantes.push('Largura HM');
  if (!ot.anchura_hm) camposFaltantes.push('Anchura HM');
  if (!ot.process_id) camposFaltantes.push('Proceso');
  if (!ot.carton_id) camposFaltantes.push('Cartón');

  // area_hc es calculado - si faltan golpes o largura/anchura, ya está incluido
  // La validación de area_hc se hace implícitamente con los campos anteriores
  if (camposFaltantes.length === 0) {
    // Si todos los campos base están, verificar que area_hc se pueda calcular
    // area_hc = (larguraHc * anchuraHc) / 1000000 / (golpes_largo * golpes_ancho)
    // larguraHc y anchuraHc requieren también carton y proceso
    if (!ot.carton_id || !ot.process_id) {
      camposFaltantes.push('Área HC (requiere Cartón y Proceso)');
    }
  } else {
    camposFaltantes.push('Área HC');
  }

  return camposFaltantes;
};

// Helper para verificar si puede cotizar OT
// Reglas Laravel (gestionar-ot.blade.php líneas 10-27):
// - El botón SIEMPRE se muestra si tipo_solicitud != 6
// - Solo está HABILITADO si: usuario es Vendedor Y OT tiene campos completos
// - Para otros casos: botón deshabilitado con tooltip mostrando campos faltantes
const canCotizarOT = (roleId: number, ot: Record<string, unknown>): { canCotizar: boolean; camposFaltantes: string[] } => {
  const camposFaltantes = getCamposFaltantesCotizacion(ot);

  // Solo Vendedor puede cotizar, y solo si tiene todos los campos
  if (roleId === ROLES.Vendedor && camposFaltantes.length === 0) {
    return { canCotizar: true, camposFaltantes: [] };
  }

  // Para otros roles o si faltan campos, mostrar qué falta
  if (roleId !== ROLES.Vendedor) {
    // No es vendedor - agregar mensaje
    return { canCotizar: false, camposFaltantes: ['Solo el rol Vendedor puede cotizar', ...camposFaltantes] };
  }

  // Es vendedor pero faltan campos
  return { canCotizar: false, camposFaltantes };
};

// Helper para verificar si se debe mostrar el botón Cotizar OT
const shouldShowCotizarButton = (ot: Record<string, unknown>): boolean => {
  // Solo se muestra si tipo_solicitud != 6
  return ot.tipo_solicitud !== 6;
};

// ============================================================
// LÓGICA PARA BOTÓN "VER/EDITAR OT" (según Laravel ficha-resumen.blade.php líneas 248-313)
// ============================================================
// Helper para verificar si puede editar/ver OT
// Reglas complejas según rol, área asignada, área actual de la OT
// Simplificado: si el usuario puede ver la OT en el dashboard, asumimos que está asignado
const canEditarOT = (
  roleId: number,
  ot: Record<string, unknown>
): boolean => {
  const currentAreaId = ot.current_area_id as number | undefined;

  // SuperAdministrador tiene acceso total
  if (roleId === ROLES.SuperAdministrador || roleId === ROLES.Admin) {
    return true;
  }

  // JefeDesarrollo siempre puede editar (tiene acceso global a desarrollo)
  if (roleId === ROLES.JefeDesarrollo) {
    return true;
  }

  // Vendedor/JefeVenta: Pueden editar si la OT está en área de Ventas
  // (Laravel línea 254-255: count($ot->users) < 2, simplificado a área)
  if (roleId === ROLES.Vendedor || roleId === ROLES.JefeVenta) {
    return currentAreaId === AREAS.Ventas;
  }

  // Ingeniero: Puede editar si la OT está en área de Desarrollo
  // (asumimos que si puede gestionar la OT desde el dashboard, está asignado)
  if (roleId === ROLES.Ingeniero) {
    return currentAreaId === AREAS.Desarrollo;
  }

  // Otros roles: no pueden editar desde esta vista
  return false;
};

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid ${theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const BackButton = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 50px;
  background: white;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;

const PdfButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${theme.colors.primary};
  border-radius: 50px;
  background: white;
  color: ${theme.colors.primary};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    background: ${theme.colors.primary};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Wrapper para botón con tooltip
const TooltipWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  padding: 0.5rem 0.75rem;
  background: #333;
  color: white;
  font-size: 0.75rem;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 300px;
  white-space: pre-wrap;
  z-index: 1000;
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.2s, visibility 0.2s;

  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: #333;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 50px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          border-color: ${theme.colors.primary};
          color: ${theme.colors.primary};
          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: white;
          }
        `;
      case 'success':
        return `
          border-color: #28a745;
          color: #28a745;
          &:hover:not(:disabled) {
            background: #28a745;
            color: white;
          }
        `;
      default:
        return `
          border-color: ${theme.colors.border};
          color: ${theme.colors.textSecondary};
          &:hover:not(:disabled) {
            border-color: ${theme.colors.primary};
            color: ${theme.colors.primary};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
`;

const CardHeader = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 8px 8px 0 0;
`;

const CardBody = styled.div`
  padding: 1rem;
`;

const StatusBadge = styled.span<{ $type?: 'area' | 'state' }>`
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-right: 0.5rem;

  ${props => props.$type === 'area' && `
    background: ${theme.colors.primary}15;
    color: ${theme.colors.primary};
  `}

  ${props => props.$type === 'state' && `
    background: #6c757d15;
    color: #6c757d;
  `}
`;

const CurrentStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${theme.colors.bgLight};
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const StatusLabel = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 0.25rem;
  text-transform: uppercase;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #002d66;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HistoryList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const HistoryItem = styled.div`
  padding: 0.75rem;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.bgLight};
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const HistoryBadges = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const HistoryDate = styled.span`
  font-size: 0.75rem;
  color: ${theme.colors.textSecondary};
`;

const HistoryUser = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textSecondary};
`;

const HistoryObservation = styled.div`
  font-size: 0.8rem;
  color: ${theme.colors.textPrimary};
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
  font-style: italic;
`;

const Alert = styled.div<{ $type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;

  ${props => props.$type === 'success' && `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  `}

  ${props => props.$type === 'error' && `
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  `}
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${theme.colors.textSecondary};
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.75rem;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const InfoBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: ${theme.colors.primary}15;
  color: ${theme.colors.primary};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
`;

const OTInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  padding: 0.75rem;
  background: ${theme.colors.bgLight};
  border-radius: 4px;
`;

const InfoLabel = styled.div`
  font-size: 0.7rem;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: ${theme.colors.textPrimary};
  font-weight: 500;
`;

// === Styled Components para Muestras ===
const MuestrasSection = styled.div`
  margin-top: 1.5rem;
`;

const MuestrasHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.95;
  }
`;

const MuestrasTitle = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MuestrasToggle = styled.span<{ $expanded: boolean }>`
  font-size: 1.25rem;
  transition: transform 0.2s;
  transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const MuestrasContent = styled.div<{ $expanded: boolean }>`
  max-height: ${props => props.$expanded ? '800px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  background: white;
  border: ${props => props.$expanded ? `1px solid ${theme.colors.border}` : 'none'};
  border-top: none;
  border-radius: 0 0 8px 8px;
`;

const MuestrasBody = styled.div`
  padding: 1rem;
`;

const MuestrasTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;

  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid ${theme.colors.border};
  }

  th {
    background: ${theme.colors.bgLight};
    font-weight: 600;
    color: ${theme.colors.textSecondary};
    font-size: 0.7rem;
    text-transform: uppercase;
  }

  tr:hover {
    background: ${theme.colors.bgLight};
  }

  tr.prioritaria {
    background: #d1f3d1;
  }
`;

const MuestraBadge = styled.span<{ $type?: 'estado' | 'prioritaria' }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;

  ${props => props.$type === 'estado' && `
    background: #6c757d15;
    color: #6c757d;
  `}

  ${props => props.$type === 'prioritaria' && `
    background: #28a74520;
    color: #28a745;
  `}
`;

const MuestraActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const MuestraActionBtn = styled.button`
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${theme.colors.bgLight};
  color: ${theme.colors.textPrimary};

  &:hover {
    background: ${theme.colors.primary};
    color: white;
  }

  &.danger:hover {
    background: #dc3545;
  }

  &.success:hover {
    background: #28a745;
  }
`;

const CreateMuestraBtn = styled.button`
  padding: 0.5rem 1rem;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;

  &:hover {
    background: #002d66;
  }
`;

const EmptyMuestras = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${theme.colors.textSecondary};
  font-size: 0.875rem;
`;

// Modal Styles for Edit Muestra
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  border-radius: 8px 8px 0 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
`;

const ModalCloseBtn = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    opacity: 0.8;
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
`;

const ModalSection = styled.div`
  margin-bottom: 1.25rem;
`;

const ModalSectionTitle = styled.h4`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0 0 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${theme.colors.border};
`;

const ModalFormGroup = styled.div`
  margin-bottom: 0.75rem;
`;

const ModalLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 0.25rem;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const ModalSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 2px ${theme.colors.primary}20;
  }
`;

const ModalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid ${theme.colors.border};
`;

const ModalBtn = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$primary ? `
    background: ${theme.colors.primary};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #002d66;
    }
  ` : `
    background: white;
    color: ${theme.colors.textSecondary};
    border: 1px solid ${theme.colors.border};

    &:hover {
      border-color: ${theme.colors.primary};
      color: ${theme.colors.primary};
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Types
interface ManageWorkOrderProps {
  otId: number;
  onNavigate: (page: string, otId?: number) => void;
}

// Constantes de tipos de gestion
const MGMT_CAMBIO_ESTADO = 1;
const MGMT_CONSULTA = 2;
const MGMT_ARCHIVO = 3;
// Sprint N: Tipos de gestion para diseñador externo (Laravel ot-managements.js)
const MGMT_ENVIO_DISENADOR_EXTERNO = 9;
const MGMT_RECEPCION_DISENADOR_EXTERNO = 10;

// Estado "Rechazada" permite seleccion manual de area
const STATE_RECHAZADA = 12;

// Mapeo estado -> area (segun logica de Laravel ManagementController)
// El area se determina automaticamente segun el estado seleccionado
const STATE_TO_AREA_MAP: Record<number, number | null> = {
  1: 1,    // Proceso de Ventas -> Area de Ventas
  2: 2,    // Proceso de Diseño Estructural -> Area de Diseño Estructural
  5: 3,    // Proceso de Diseño Gráfico -> Area de Diseño Gráfico
  6: 5,    // Proceso de Cálculo Paletizado (Precatalogación) -> Area de Precatalogación
  7: 4,    // Proceso de Catalogación -> Area de Catalogación
  12: null, // Rechazada -> Usuario selecciona area
  13: 1,   // Entregada -> Area de Ventas
  // Estados que no cambian el area (se mantiene area actual)
  9: null,  // Perdida
  10: null, // Consulta Cliente
  11: null, // Anulada
  14: null, // Espera de OC
  15: null, // Falta definición del Cliente
  16: null, // Visto Bueno Cliente
  17: null, // Sala de Muestras
  18: null, // Muestras Listas
  20: null, // Hibernacion
  21: null, // Cotización
  22: null, // Muestra Devuelta
};

// Estados que cambian el area automaticamente
const STATES_WITH_AUTO_AREA = [1, 2, 5, 6, 7, 13];

export default function ManageWorkOrder({ otId, onNavigate }: ManageWorkOrderProps) {
  const [selectedManagementType, setSelectedManagementType] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [observation, setObservation] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Sprint N: Condicionales ManageWorkOrder
  const [selectedMotive, setSelectedMotive] = useState<number | null>(null);  // Motivo de rechazo (state_id=12)
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);  // Proveedor externo (mgmt_type 9 o 10)
  const [muestrasExpanded, setMuestrasExpanded] = useState(false);

  // Estado para modal de edición de muestra
  const [editingMuestra, setEditingMuestra] = useState<MuestraDetalle | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<MuestraUpdate>({});
  const [muestraOptions, setMuestraOptions] = useState<MuestraOptions | null>(null);

  // Estado para tooltip de botón Cotizar OT
  const [cotizarTooltipVisible, setCotizarTooltipVisible] = useState(false);

  // Obtener usuario actual para verificar permisos de muestras
  const currentUser = authApi.getStoredUser();
  const userRoleId = currentUser?.role_id || 0;
  const userSalaCorteId = currentUser?.sala_corte_id;

  const queryClient = useQueryClient();
  const { data: otData, isLoading: otLoading } = useWorkOrderDetail(otId);
  const { data: historyData, isLoading: historyLoading } = useManagementHistory(otId);
  const { data: workflowOptions, isLoading: optionsLoading } = useWorkflowOptions(otId);
  const transitionMutation = useTransitionWorkOrder();

  // Query para muestras de la OT (solo si el usuario tiene permiso)
  const { data: muestrasData, isLoading: muestrasLoading } = useQuery({
    queryKey: ['muestras-ot', otId],
    queryFn: () => muestrasApi.listByOT(otId),
    enabled: canViewMuestras(userRoleId) && muestrasExpanded,
  });

  // Mutaciones para acciones sobre muestras
  const terminarMuestraMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.terminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
      setSuccessMessage('Muestra terminada exitosamente');
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  const anularMuestraMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
      setSuccessMessage('Muestra anulada exitosamente');
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  const togglePrioritariaMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.togglePrioritaria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  const rechazarMuestraMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.rechazar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
      setSuccessMessage('Muestra rechazada exitosamente');
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  const devolverMuestraMutation = useMutation({
    mutationFn: (id: number) => muestrasApi.devolver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
      setSuccessMessage('Muestra devuelta exitosamente');
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  // Mutación para actualizar muestra
  const updateMuestraMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MuestraUpdate }) => muestrasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['muestras-ot', otId] });
      setSuccessMessage('Muestra actualizada exitosamente');
      setEditModalOpen(false);
      setEditingMuestra(null);
      setEditFormData({});
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  // Mutación para crear cotización desde OT
  const createCotizacionMutation = useMutation({
    mutationFn: () => cotizacionesApi.createFromOT(otId),
    onSuccess: (data) => {
      setSuccessMessage(`Cotización #${data.cotizacion_id} creada exitosamente`);
      // Navegar al formulario de cotización con el ID de la nueva cotización
      onNavigate('cotizacion-form', data.cotizacion_id);
    },
    onError: (error: Error) => {
      setErrorMessage(`Error al crear cotización: ${error.message}`);
    },
  });

  // Handler para el botón Cotizar OT
  const handleCotizarOT = useCallback(() => {
    setErrorMessage(null);
    createCotizacionMutation.mutate();
  }, [createCotizacionMutation]);

  // Función para abrir modal de edición
  const handleEditMuestra = useCallback(async (muestraId: number) => {
    try {
      // Cargar detalle de muestra y opciones
      const [muestra, options] = await Promise.all([
        muestrasApi.get(muestraId),
        muestrasApi.getOptions()
      ]);
      setEditingMuestra(muestra);
      setMuestraOptions(options);
      // Inicializar formulario con datos actuales
      setEditFormData({
        cad: muestra.cad_codigo || undefined,
        cad_id: muestra.cad_id || undefined,
        carton_id: muestra.carton_id || undefined,
        carton_muestra_id: undefined,
        pegado_id: muestra.pegado_id || undefined,
        tiempo_unitario: muestra.tiempo_unitario || undefined,
        cantidad_vendedor: muestra.cantidad_vendedor || 0,
        cantidad_disenador: muestra.cantidad_disenador || 0,
        cantidad_laboratorio: muestra.cantidad_laboratorio || 0,
        cantidad_disenador_revision: muestra.cantidad_disenador_revision || 0,
        sala_corte_vendedor: muestra.sala_corte_id || undefined,
      });
      setEditModalOpen(true);
    } catch (error) {
      setErrorMessage('Error al cargar datos de la muestra');
    }
  }, []);

  // Función para guardar cambios de muestra
  const handleSaveEditMuestra = useCallback(() => {
    if (!editingMuestra) return;

    // Solo enviar campos que tienen valor
    const dataToSend: MuestraUpdate = {};
    if (editFormData.cad_id !== undefined) dataToSend.cad_id = editFormData.cad_id;
    if (editFormData.carton_id !== undefined) dataToSend.carton_id = editFormData.carton_id;
    if (editFormData.carton_muestra_id !== undefined) dataToSend.carton_muestra_id = editFormData.carton_muestra_id;
    if (editFormData.pegado_id !== undefined) dataToSend.pegado_id = editFormData.pegado_id;
    if (editFormData.tiempo_unitario !== undefined) dataToSend.tiempo_unitario = editFormData.tiempo_unitario;
    if (editFormData.cantidad_vendedor !== undefined) dataToSend.cantidad_vendedor = editFormData.cantidad_vendedor;
    if (editFormData.cantidad_disenador !== undefined) dataToSend.cantidad_disenador = editFormData.cantidad_disenador;
    if (editFormData.cantidad_laboratorio !== undefined) dataToSend.cantidad_laboratorio = editFormData.cantidad_laboratorio;
    if (editFormData.cantidad_disenador_revision !== undefined) dataToSend.cantidad_disenador_revision = editFormData.cantidad_disenador_revision;
    if (editFormData.sala_corte_vendedor !== undefined) dataToSend.sala_corte_vendedor = editFormData.sala_corte_vendedor;

    console.log('Guardando muestra:', editingMuestra.id, dataToSend);
    updateMuestraMutation.mutate({ id: editingMuestra.id, data: dataToSend });
  }, [editingMuestra, editFormData, updateMuestraMutation]);

  const handleTransition = useCallback(() => {
    if (!selectedManagementType) {
      setErrorMessage('Debe seleccionar tipo de gestion');
      return;
    }

    // Para Cambio de Estado, requerir estado
    if (selectedManagementType === MGMT_CAMBIO_ESTADO && !selectedState) {
      setErrorMessage('Debe seleccionar un estado');
      return;
    }

    // Para estado Rechazada, requerir area
    if (selectedManagementType === MGMT_CAMBIO_ESTADO && selectedState === STATE_RECHAZADA && !selectedArea) {
      setErrorMessage('Debe seleccionar el área de destino para el rechazo');
      return;
    }

    const data: TransitionRequest = {
      management_type_id: selectedManagementType,
      work_space_id: selectedArea || undefined,
      state_id: selectedState || undefined,
      observation: observation || undefined,
      // Sprint N: Condicionales ManageWorkOrder
      motive_id: selectedState === STATE_RECHAZADA ? (selectedMotive || undefined) : undefined,
      proveedor_id: (selectedManagementType === MGMT_ENVIO_DISENADOR_EXTERNO || selectedManagementType === MGMT_RECEPCION_DISENADOR_EXTERNO) ? (selectedProveedor || undefined) : undefined,
    };

    transitionMutation.mutate(
      { id: otId, data },
      {
        onSuccess: (response) => {
          setSuccessMessage(response.message);
          setErrorMessage(null);
          setSelectedManagementType(null);
          setSelectedArea(null);
          setSelectedState(null);
          setObservation('');
          // Sprint N: Limpiar campos condicionales
          setSelectedMotive(null);
          setSelectedProveedor(null);
        },
        onError: (error: Error) => {
          setErrorMessage(error.message || 'Error al realizar la transicion');
          setSuccessMessage(null);
        },
      }
    );
  }, [otId, selectedManagementType, selectedArea, selectedState, observation, selectedMotive, selectedProveedor, transitionMutation]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (historyLoading || optionsLoading || otLoading) {
    return (
      <Container>
        <LoadingOverlay>
          <Spinner />
          <span>Cargando informacion de OT #{otId}...</span>
        </LoadingOverlay>
      </Container>
    );
  }

  const ot = otData as Record<string, unknown> | undefined;

  return (
    <Container>
      <Header>
        <Title>
          Gestionar Orden de Trabajo
          <InfoBadge>OT #{otId}</InfoBadge>
        </Title>
        <HeaderActions>
          {/* Botón Cotizar OT - según Laravel gestionar-ot.blade.php líneas 10-33 */}
          {ot && shouldShowCotizarButton(ot) && (() => {
            const { canCotizar, camposFaltantes } = canCotizarOT(userRoleId, ot);
            const tooltipText = camposFaltantes.length > 0
              ? `Para cotizar se requieren:\n- ${camposFaltantes.join('\n- ')}`
              : '';
            const isCotizando = createCotizacionMutation.isPending;

            return (
              <TooltipWrapper
                onMouseEnter={() => !canCotizar && setCotizarTooltipVisible(true)}
                onMouseLeave={() => setCotizarTooltipVisible(false)}
              >
                <ActionButton
                  $variant="primary"
                  disabled={!canCotizar || isCotizando}
                  onClick={() => canCotizar && handleCotizarOT()}
                  title={canCotizar ? 'Cotizar esta OT' : tooltipText}
                >
                  {isCotizando ? 'Creando...' : 'Cotizar OT'}
                </ActionButton>
                <TooltipContent $visible={cotizarTooltipVisible && !canCotizar}>
                  {tooltipText}
                </TooltipContent>
              </TooltipWrapper>
            );
          })()}

          {/* Botón Ver/Editar OT - según Laravel ficha-resumen.blade.php líneas 248-313 */}
          {ot && canEditarOT(userRoleId, ot) && (
            <ActionButton
              $variant="success"
              onClick={() => onNavigate('editar-ot', otId)}
              title="Ver/Editar datos de la OT"
            >
              Ver/Editar OT ✏️
            </ActionButton>
          )}

          <PdfButton onClick={() => pdfsApi.downloadFichaDiseno(otId)} title="Descargar Ficha de Diseño">
            Ficha Diseño
          </PdfButton>
          <PdfButton onClick={() => pdfsApi.downloadEstudioBench(otId)} title="Descargar Solicitud Benchmarking">
            Est. Bench
          </PdfButton>
          <BackButton onClick={() => onNavigate('dashboard')}>
            ← Volver al Dashboard
          </BackButton>
        </HeaderActions>
      </Header>

      {successMessage && <Alert $type="success">{successMessage}</Alert>}
      {errorMessage && <Alert $type="error">{errorMessage}</Alert>}

      {/* Info de la OT */}
      {ot && (
        <OTInfo>
          <InfoItem>
            <InfoLabel>Cliente</InfoLabel>
            <InfoValue>{(ot.client_name as string) || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Descripcion</InfoLabel>
            <InfoValue>{(ot.descripcion as string) || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Creador</InfoLabel>
            <InfoValue>{(ot.creador_nombre as string) || 'N/A'}</InfoValue>
          </InfoItem>
        </OTInfo>
      )}

      <Grid>
        {/* Panel de Transicion */}
        <Card>
          <CardHeader>Transicion de Estado</CardHeader>
          <CardBody>
            <CurrentStatus>
              <div>
                <StatusLabel>Area Actual</StatusLabel>
                <div>
                  <StatusBadge $type="area">
                    {historyData?.current_area || 'Sin asignar'}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <StatusLabel>Estado Actual</StatusLabel>
                <div>
                  <StatusBadge $type="state">
                    {historyData?.current_state || 'Sin estado'}
                  </StatusBadge>
                </div>
              </div>
            </CurrentStatus>

            <FormGroup>
              <Label>Tipo de Gestion</Label>
              <Select
                value={selectedManagementType || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  setSelectedManagementType(value);
                  // Limpiar selecciones al cambiar tipo
                  if (value !== MGMT_CAMBIO_ESTADO) {
                    setSelectedArea(null);
                    setSelectedState(null);
                    setSelectedMotive(null);  // Sprint N: Limpiar motivo
                  }
                  // Sprint N: Limpiar proveedor si no es tipo diseñador externo
                  if (value !== MGMT_ENVIO_DISENADOR_EXTERNO && value !== MGMT_RECEPCION_DISENADOR_EXTERNO) {
                    setSelectedProveedor(null);
                  }
                }}
              >
                <option value="">Seleccione tipo de gestion...</option>
                {workflowOptions?.management_types?.map(type => (
                  <option key={type.id} value={type.id}>{type.nombre}</option>
                ))}
              </Select>
            </FormGroup>

            {/* Sprint N: Proveedor para Envío/Recepción Diseñador Externo (Laravel ot-managements.js) */}
            {(selectedManagementType === MGMT_ENVIO_DISENADOR_EXTERNO || selectedManagementType === MGMT_RECEPCION_DISENADOR_EXTERNO) && (
              <FormGroup>
                <Label>Proveedor Externo</Label>
                <Select
                  value={selectedProveedor || ''}
                  onChange={(e) => setSelectedProveedor(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {workflowOptions?.proveedores?.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </Select>
              </FormGroup>
            )}

            {/* Solo mostrar estado/area para Cambio de Estado */}
            {selectedManagementType === MGMT_CAMBIO_ESTADO && (
              <>
                <FormGroup>
                  <Label>Estado</Label>
                  <Select
                    value={selectedState || ''}
                    onChange={(e) => {
                      const stateId = e.target.value ? Number(e.target.value) : null;
                      setSelectedState(stateId);

                      // Auto-seleccionar area segun estado (logica de Laravel)
                      if (stateId && STATES_WITH_AUTO_AREA.includes(stateId)) {
                        const autoArea = STATE_TO_AREA_MAP[stateId];
                        setSelectedArea(autoArea);
                      } else if (stateId === STATE_RECHAZADA) {
                        // Para rechazada, limpiar area para que usuario seleccione
                        setSelectedArea(null);
                      } else {
                        // Para otros estados, no se cambia el area (null)
                        setSelectedArea(null);
                      }
                      // Sprint N: Limpiar motivo al cambiar estado
                      setSelectedMotive(null);
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {workflowOptions?.states.map(state => (
                      <option key={state.id} value={state.id}>{state.nombre}</option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Area</Label>
                  <Select
                    value={selectedArea || ''}
                    onChange={(e) => setSelectedArea(e.target.value ? Number(e.target.value) : null)}
                    disabled={selectedState !== STATE_RECHAZADA}
                    style={{
                      backgroundColor: selectedState !== STATE_RECHAZADA ? '#f5f5f5' : 'white',
                      cursor: selectedState !== STATE_RECHAZADA ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {workflowOptions?.areas.map(area => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </Select>
                  {selectedState && selectedState !== STATE_RECHAZADA && selectedArea && (
                    <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Área determinada automáticamente por el estado
                    </small>
                  )}
                </FormGroup>

                {/* Sprint N: Motivo de rechazo cuando state_id=12 y area seleccionada (Laravel gestionar.blade.php) */}
                {selectedState === STATE_RECHAZADA && selectedArea && (
                  <FormGroup>
                    <Label>Motivo de Rechazo</Label>
                    <Select
                      value={selectedMotive || ''}
                      onChange={(e) => setSelectedMotive(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Seleccionar motivo...</option>
                      {workflowOptions?.motives?.map(motive => (
                        <option key={motive.id} value={motive.id}>{motive.nombre}</option>
                      ))}
                    </Select>
                  </FormGroup>
                )}
              </>
            )}

            <FormGroup>
              <Label>Observacion {selectedManagementType === MGMT_CAMBIO_ESTADO ? '(opcional)' : ''}</Label>
              <TextArea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ingrese una observacion..."
                maxLength={500}
              />
            </FormGroup>

            <SubmitButton
              onClick={handleTransition}
              disabled={
                !selectedManagementType ||
                (selectedManagementType === MGMT_CAMBIO_ESTADO && !selectedState) ||
                (selectedManagementType === MGMT_CAMBIO_ESTADO && selectedState === STATE_RECHAZADA && !selectedArea) ||
                transitionMutation.isPending
              }
            >
              {transitionMutation.isPending ? 'Procesando...' :
                selectedManagementType === MGMT_CAMBIO_ESTADO ? 'Realizar Transicion' :
                selectedManagementType === MGMT_CONSULTA ? 'Registrar Consulta' :
                selectedManagementType === MGMT_ARCHIVO ? 'Archivar OT' : 'Ejecutar'}
            </SubmitButton>
          </CardBody>
        </Card>

        {/* Panel de Historial */}
        <Card>
          <CardHeader>Historial de Gestion</CardHeader>
          <CardBody>
            <HistoryList>
              {historyData?.history.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: theme.colors.textSecondary }}>
                  No hay registros de gestion
                </div>
              )}
              {historyData?.history.map(item => (
                <HistoryItem key={item.id}>
                  <HistoryHeader>
                    <HistoryBadges>
                      <StatusBadge $type="area">{item.work_space}</StatusBadge>
                      <StatusBadge $type="state">{item.state}</StatusBadge>
                    </HistoryBadges>
                    <HistoryDate>{formatDate(item.created_at)}</HistoryDate>
                  </HistoryHeader>
                  <HistoryUser>Por: {item.user_name}</HistoryUser>
                  {item.observation && (
                    <HistoryObservation>"{item.observation}"</HistoryObservation>
                  )}
                </HistoryItem>
              ))}
            </HistoryList>
          </CardBody>
        </Card>
      </Grid>

      {/* Seccion Gestionar Muestras - solo para roles permitidos */}
      {canViewMuestras(userRoleId) && (
        <MuestrasSection>
          <MuestrasHeader onClick={() => setMuestrasExpanded(!muestrasExpanded)}>
            <MuestrasTitle>
              Gestionar Muestras
              {muestrasData && muestrasData.total > 0 && (
                <MuestraBadge $type="estado">
                  {muestrasData.total} muestra{muestrasData.total !== 1 ? 's' : ''}
                </MuestraBadge>
              )}
            </MuestrasTitle>
            <MuestrasToggle $expanded={muestrasExpanded}>▼</MuestrasToggle>
          </MuestrasHeader>

          <MuestrasContent $expanded={muestrasExpanded}>
            <MuestrasBody>
              {/* Boton crear muestra - solo para roles con permiso */}
              {canCreateMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined) && (
                <CreateMuestraBtn onClick={() => onNavigate('muestra-nueva', otId)}>
                  + Crear Muestra
                </CreateMuestraBtn>
              )}

              {muestrasLoading ? (
                <EmptyMuestras>Cargando muestras...</EmptyMuestras>
              ) : muestrasData && muestrasData.items.length > 0 ? (
                <MuestrasTable>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>CAD</th>
                      <th>Cartón</th>
                      <th>Tipo Pegado</th>
                      <th>Planta Corte</th>
                      <th>Destinatario</th>
                      <th>N° Muestras</th>
                      <th>Fecha Corte</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {muestrasData.items.map((muestra: MuestraListItem) => (
                      <tr key={muestra.id} className={muestra.prioritaria ? 'prioritaria' : ''}>
                        <td>{muestra.id}</td>
                        <td>{muestra.cad || '--'}</td>
                        <td>{muestra.carton || '--'}</td>
                        <td>{muestra.tipo_pegado || '--'}</td>
                        <td>{muestra.sala_corte || '--'}</td>
                        <td>{muestra.creador_nombre || '--'}</td>
                        <td>{muestra.cantidad_total}</td>
                        <td>{muestra.created_at || '--'}</td>
                        <td>
                          <MuestraBadge $type="estado">{muestra.estado_nombre}</MuestraBadge>
                          {muestra.prioritaria && (
                            <MuestraBadge $type="prioritaria">Prioritaria</MuestraBadge>
                          )}
                        </td>
                        <td>
                          <MuestraActions>
                            {/* Editar - según lógica Laravel por rol y área (con sala_corte para TecnicoMuestras) */}
                            {canEditMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined, muestra.estado, userSalaCorteId, muestra) && (
                              <MuestraActionBtn
                                onClick={() => handleEditMuestra(muestra.id)}
                                title="Editar muestra"
                              >
                                ✎
                              </MuestraActionBtn>
                            )}
                            {/* Ver detalle - solo si muestra terminada */}
                            {canVerDetalleMuestra(userRoleId, muestra.estado) && (
                              <MuestraActionBtn
                                onClick={() => handleEditMuestra(muestra.id)}
                                title="Ver detalle"
                              >
                                🔍
                              </MuestraActionBtn>
                            )}
                            {/* Terminar - solo TecnicoMuestras en área 6 con estado válido y sala_corte coincidente */}
                            {canTerminarMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined, muestra.estado, userSalaCorteId, muestra) && (
                              <MuestraActionBtn
                                className="success"
                                onClick={() => terminarMuestraMutation.mutate(muestra.id)}
                                disabled={terminarMuestraMutation.isPending}
                                title="Terminar muestra"
                              >
                                ✓
                              </MuestraActionBtn>
                            )}
                            {/* Toggle prioritaria - solo JefeMuestras/JefeDesarrollo en área 6 */}
                            {canTogglePrioritaria(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined) && (
                              <MuestraActionBtn
                                onClick={() => togglePrioritariaMutation.mutate(muestra.id)}
                                disabled={togglePrioritariaMutation.isPending}
                                title={muestra.prioritaria ? 'Quitar prioridad' : 'Marcar prioritaria'}
                              >
                                ★
                              </MuestraActionBtn>
                            )}
                            {/* Anular - solo Ingeniero/JefeDesarrollo en área 2 */}
                            {canAnularMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined, muestra.estado) && (
                              <MuestraActionBtn
                                className="danger"
                                onClick={() => anularMuestraMutation.mutate(muestra.id)}
                                disabled={anularMuestraMutation.isPending}
                                title="Anular muestra"
                              >
                                ✕
                              </MuestraActionBtn>
                            )}
                            {/* Rechazar - TecnicoMuestras/JefeMuestras en área 6 con sala_corte */}
                            {canRechazarMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined, muestra.estado, userSalaCorteId, muestra) && (
                              <MuestraActionBtn
                                className="danger"
                                onClick={() => rechazarMuestraMutation.mutate(muestra.id)}
                                disabled={rechazarMuestraMutation.isPending}
                                title="Rechazar muestra"
                              >
                                ⊘
                              </MuestraActionBtn>
                            )}
                            {/* Devolver - TecnicoMuestras/JefeMuestras en área 6 con sala_corte */}
                            {canDevolverMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined, muestra.estado, userSalaCorteId, muestra) && (
                              <MuestraActionBtn
                                onClick={() => devolverMuestraMutation.mutate(muestra.id)}
                                disabled={devolverMuestraMutation.isPending}
                                title="Devolver muestra"
                              >
                                ↩
                              </MuestraActionBtn>
                            )}
                          </MuestraActions>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </MuestrasTable>
              ) : (
                <EmptyMuestras>
                  No hay muestras registradas para esta OT.
                  {canCreateMuestra(userRoleId, (ot as Record<string, unknown>)?.current_area_id as number | undefined) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      Haga clic en "Crear Muestra" para agregar una.
                    </div>
                  )}
                </EmptyMuestras>
              )}
            </MuestrasBody>
          </MuestrasContent>
        </MuestrasSection>
      )}

      {/* Modal de Edición de Muestra */}
      {editModalOpen && editingMuestra && (
        <ModalOverlay onClick={() => setEditModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Editar Muestra ID {editingMuestra.id}</ModalTitle>
              <ModalCloseBtn onClick={() => setEditModalOpen(false)}>×</ModalCloseBtn>
            </ModalHeader>
            <ModalBody>
              {/* Sección: Características de Muestra */}
              <ModalSection>
                <ModalSectionTitle>Características de Muestra</ModalSectionTitle>
                <ModalRow>
                  <ModalFormGroup>
                    <ModalLabel>CAD</ModalLabel>
                    <ModalSelect
                      value={editFormData.cad_id || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, cad_id: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">Seleccionar...</option>
                      {muestraOptions?.cads.map(c => (
                        <option key={c.id} value={c.id}>{c.codigo}</option>
                      ))}
                    </ModalSelect>
                  </ModalFormGroup>
                  <ModalFormGroup>
                    <ModalLabel>Cartón</ModalLabel>
                    <ModalSelect
                      value={editFormData.carton_id || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, carton_id: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">Seleccionar...</option>
                      {muestraOptions?.cartones.map(c => (
                        <option key={c.id} value={c.id}>{c.codigo}</option>
                      ))}
                    </ModalSelect>
                  </ModalFormGroup>
                </ModalRow>
                <ModalRow>
                  <ModalFormGroup>
                    <ModalLabel>Tipo de Pegado</ModalLabel>
                    <ModalSelect
                      value={editFormData.pegado_id || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, pegado_id: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">Seleccionar...</option>
                      {muestraOptions?.pegados?.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </ModalSelect>
                  </ModalFormGroup>
                  <ModalFormGroup>
                    <ModalLabel>Tiempo Unitario</ModalLabel>
                    <ModalInput
                      type="time"
                      value={editFormData.tiempo_unitario || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, tiempo_unitario: e.target.value || undefined }))}
                    />
                  </ModalFormGroup>
                </ModalRow>
                <ModalRow>
                  <ModalFormGroup>
                    <ModalLabel>Cartón Muestra</ModalLabel>
                    <ModalSelect
                      value={editFormData.carton_muestra_id || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, carton_muestra_id: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">Seleccionar...</option>
                      {muestraOptions?.cartones.map(c => (
                        <option key={c.id} value={c.id}>{c.codigo}</option>
                      ))}
                    </ModalSelect>
                  </ModalFormGroup>
                  <ModalFormGroup>
                    <ModalLabel>Planta de Corte</ModalLabel>
                    <ModalSelect
                      value={editFormData.sala_corte_vendedor || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                    >
                      <option value="">Seleccionar...</option>
                      {muestraOptions?.salas_corte.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </ModalSelect>
                  </ModalFormGroup>
                </ModalRow>
              </ModalSection>

              {/* Sección: Enviar Muestras A (según destinatario) */}
              <ModalSection>
                <ModalSectionTitle>Enviar Muestras A</ModalSectionTitle>
                <ModalRow>
                  <ModalFormGroup style={{ width: '100%' }}>
                    <ModalSelect
                      value={editingMuestra.destinatarios_id?.[0] || ''}
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="1">Retira Ventas VB</option>
                      <option value="2">Retira Diseñador VB</option>
                      <option value="3">Envío Laboratorio</option>
                      <option value="4">Envío Cliente VB</option>
                      <option value="5">Retira Diseñador Revisión</option>
                    </ModalSelect>
                  </ModalFormGroup>
                </ModalRow>
              </ModalSection>

              {/* Sección: Datos de Muestra (campos dinámicos según destino) */}
              <ModalSection>
                <ModalSectionTitle>Datos de Muestra</ModalSectionTitle>

                {/* Destino 1: Retira Ventas VB */}
                {editingMuestra.destinatarios_id?.[0] === '1' && (
                  <>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>CANTIDAD</ModalLabel>
                        <ModalInput
                          type="number"
                          min="0"
                          value={editFormData.cantidad_vendedor || 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, cantidad_vendedor: Number(e.target.value) }))}
                        />
                      </ModalFormGroup>
                      <ModalFormGroup>
                        <ModalLabel>FORMA DE ENTREGA</ModalLabel>
                        <ModalInput
                          type="text"
                          value="Retira Vendedor"
                          disabled
                          style={{ backgroundColor: '#f5f5f5' }}
                        />
                      </ModalFormGroup>
                    </ModalRow>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>PLANTA DE CORTE</ModalLabel>
                        <ModalSelect
                          value={editFormData.sala_corte_vendedor || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                        >
                          <option value="">Seleccionar</option>
                          {muestraOptions?.salas_corte.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </ModalSelect>
                      </ModalFormGroup>
                    </ModalRow>
                  </>
                )}

                {/* Destino 2: Retira Diseñador VB */}
                {editingMuestra.destinatarios_id?.[0] === '2' && (
                  <>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>CANTIDAD</ModalLabel>
                        <ModalInput
                          type="number"
                          min="0"
                          value={editFormData.cantidad_disenador || 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, cantidad_disenador: Number(e.target.value) }))}
                        />
                      </ModalFormGroup>
                      <ModalFormGroup>
                        <ModalLabel>FORMA DE ENTREGA</ModalLabel>
                        <ModalInput
                          type="text"
                          value={editingMuestra.comentario_disenador || 'física'}
                          disabled
                          style={{ backgroundColor: '#f5f5f5' }}
                        />
                      </ModalFormGroup>
                    </ModalRow>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>PLANTA DE CORTE</ModalLabel>
                        <ModalSelect
                          value={editFormData.sala_corte_vendedor || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                        >
                          <option value="">Seleccionar</option>
                          {muestraOptions?.salas_corte.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </ModalSelect>
                      </ModalFormGroup>
                    </ModalRow>
                  </>
                )}

                {/* Destino 3: Envío Laboratorio */}
                {editingMuestra.destinatarios_id?.[0] === '3' && (
                  <>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>CANTIDAD</ModalLabel>
                        <ModalInput
                          type="number"
                          min="0"
                          value={editFormData.cantidad_laboratorio || 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, cantidad_laboratorio: Number(e.target.value) }))}
                        />
                      </ModalFormGroup>
                      <ModalFormGroup>
                        <ModalLabel>FORMA DE ENTREGA</ModalLabel>
                        <ModalInput
                          type="text"
                          value={editingMuestra.comentario_laboratorio || ''}
                          disabled
                          style={{ backgroundColor: '#f5f5f5' }}
                        />
                      </ModalFormGroup>
                    </ModalRow>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>PLANTA DE CORTE</ModalLabel>
                        <ModalSelect
                          value={editFormData.sala_corte_vendedor || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                        >
                          <option value="">Seleccionar</option>
                          {muestraOptions?.salas_corte.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </ModalSelect>
                      </ModalFormGroup>
                    </ModalRow>
                  </>
                )}

                {/* Destino 4: Envío Cliente VB */}
                {editingMuestra.destinatarios_id?.[0] === '4' && (
                  <>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>CANTIDAD</ModalLabel>
                        <ModalInput
                          type="number"
                          min="0"
                          value={editFormData.cantidad_1 || 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, cantidad_1: Number(e.target.value) }))}
                        />
                      </ModalFormGroup>
                      <ModalFormGroup>
                        <ModalLabel>PLANTA DE CORTE</ModalLabel>
                        <ModalSelect
                          value={editFormData.sala_corte_vendedor || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                        >
                          <option value="">Seleccionar</option>
                          {muestraOptions?.salas_corte.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </ModalSelect>
                      </ModalFormGroup>
                    </ModalRow>
                  </>
                )}

                {/* Destino 5: Retira Diseñador Revisión */}
                {editingMuestra.destinatarios_id?.[0] === '5' && (
                  <>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>CANTIDAD</ModalLabel>
                        <ModalInput
                          type="number"
                          min="0"
                          value={editFormData.cantidad_disenador_revision || 0}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, cantidad_disenador_revision: Number(e.target.value) }))}
                        />
                      </ModalFormGroup>
                      <ModalFormGroup>
                        <ModalLabel>FORMA DE ENTREGA</ModalLabel>
                        <ModalInput
                          type="text"
                          value={editingMuestra.comentario_disenador_revision || ''}
                          disabled
                          style={{ backgroundColor: '#f5f5f5' }}
                        />
                      </ModalFormGroup>
                    </ModalRow>
                    <ModalRow>
                      <ModalFormGroup>
                        <ModalLabel>PLANTA DE CORTE</ModalLabel>
                        <ModalSelect
                          value={editFormData.sala_corte_vendedor || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, sala_corte_vendedor: e.target.value ? Number(e.target.value) : undefined }))}
                        >
                          <option value="">Seleccionar</option>
                          {muestraOptions?.salas_corte.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </ModalSelect>
                      </ModalFormGroup>
                    </ModalRow>
                  </>
                )}
              </ModalSection>
            </ModalBody>
            <ModalFooter>
              <ModalBtn onClick={() => setEditModalOpen(false)}>
                Cancelar
              </ModalBtn>
              <ModalBtn
                $primary
                onClick={handleSaveEditMuestra}
                disabled={updateMuestraMutation.isPending}
              >
                {updateMuestraMutation.isPending ? 'Guardando...' : 'Guardar'}
              </ModalBtn>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}
