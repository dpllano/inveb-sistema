/**
 * Hooks para Work Orders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersApi, workOrdersApiExtended, notificationsApi, type WorkOrderFilters, type WorkOrderCreateData, type WorkOrderUpdateData, type TransitionRequest, type CreateNotificationRequest, type AnswerRequest } from '../services/api';

/**
 * Hook para listar OTs con filtros y paginacion
 */
export function useWorkOrdersList(filters: WorkOrderFilters = {}) {
  return useQuery({
    queryKey: ['workOrders', filters],
    queryFn: () => workOrdersApi.list(filters),
  });
}

/**
 * Hook para obtener opciones de filtros
 */
export function useWorkOrderFilterOptions() {
  return useQuery({
    queryKey: ['workOrderFilterOptions'],
    queryFn: () => workOrdersApi.getFilterOptions(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener detalle de una OT
 */
export function useWorkOrderDetail(id: number | null) {
  return useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => workOrdersApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para crear una OT
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkOrderCreateData) => workOrdersApi.create(data),
    onSuccess: () => {
      // Invalidar la lista de OTs para refrescar
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
}

/**
 * Hook para actualizar una OT
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkOrderUpdateData }) =>
      workOrdersApi.update(id, data),
    onSuccess: (_result, variables) => {
      // Invalidar la lista y el detalle
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] });
    },
  });
}

/**
 * Hook para obtener historial de gestion de una OT
 */
export function useManagementHistory(id: number | null) {
  return useQuery({
    queryKey: ['managementHistory', id],
    queryFn: () => workOrdersApi.getManagementHistory(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener archivos de una OT agrupados por area
 */
export function useFilesByArea(id: number | null) {
  return useQuery({
    queryKey: ['filesByArea', id],
    queryFn: () => workOrdersApi.getFilesByArea(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener opciones de workflow
 */
export function useWorkflowOptions(id: number | null) {
  return useQuery({
    queryKey: ['workflowOptions', id],
    queryFn: () => workOrdersApi.getWorkflowOptions(id!),
    enabled: !!id,
  });
}

/**
 * Hook para transicionar una OT
 */
export function useTransitionWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransitionRequest }) =>
      workOrdersApi.transition(id, data),
    onSuccess: (_result, variables) => {
      // Invalidar historial, lista y archivos por área
      queryClient.invalidateQueries({ queryKey: ['managementHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['filesByArea', variables.id] });
    },
  });
}

/**
 * Hook para responder una consulta
 */
export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ otId, managementId, data }: { otId: number; managementId: number; data: AnswerRequest }) =>
      workOrdersApi.createAnswer(otId, managementId, data),
    onSuccess: (_result, variables) => {
      // Invalidar historial para mostrar respuesta
      queryClient.invalidateQueries({ queryKey: ['managementHistory', variables.otId] });
    },
  });
}

// =============================================
// HOOKS DE NOTIFICACIONES
// =============================================

/**
 * Hook para listar notificaciones del usuario
 */
export function useNotificationsList(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['notifications', page, pageSize],
    queryFn: () => notificationsApi.list(page, pageSize),
  });
}

/**
 * Hook para obtener conteo de notificaciones activas
 */
export function useNotificationsCount() {
  return useQuery({
    queryKey: ['notificationsCount'],
    queryFn: () => notificationsApi.getCount(),
    refetchInterval: 60000, // Refrescar cada minuto
  });
}

/**
 * Hook para marcar notificacion como leida
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      // Invalidar lista y conteo
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
    },
  });
}

/**
 * Hook para crear una notificacion
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationRequest) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
    },
  });
}

// =============================================
// HOOKS FORMULARIO COMPLETO OT - FASE 6.30
// =============================================

/**
 * Hook para obtener TODAS las opciones del formulario de crear/editar OT
 * Incluye todos los catálogos necesarios
 */
export function useFormOptionsComplete() {
  return useQuery({
    queryKey: ['formOptionsComplete'],
    queryFn: () => workOrdersApiExtended.getFormOptionsComplete(),
    staleTime: 0, // Siempre obtener datos frescos (temporalmente para debug)
  });
}

/**
 * Hook para duplicar una OT
 */
export function useDuplicateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (otId: number) => workOrdersApiExtended.duplicate(otId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
}
