/**
 * Hooks para Mantenedores
 * CRUD hooks para tablas maestras del sistema
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  clientsApi,
  usersApi,
  type ClientFilters,
  type ClientCreate,
  type ClientUpdate,
  type UserFilters,
  type UserCreate,
  type UserUpdate,
} from '../services/api';

// =============================================
// HOOKS DE CLIENTES
// =============================================

/**
 * Hook para listar clientes con filtros y paginacion
 */
export function useClientsList(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsApi.list(filters),
  });
}

/**
 * Hook para obtener detalle de un cliente
 */
export function useClientDetail(id: number | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener opciones de clasificacion
 */
export function useClasificaciones() {
  return useQuery({
    queryKey: ['clasificaciones'],
    queryFn: () => clientsApi.getClasificaciones(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para crear un cliente
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreate) => clientsApi.create(data),
    onSuccess: () => {
      // Invalidar TODAS las queries que empiecen con 'clients' (incluyendo las con filtros)
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });
    },
  });
}

/**
 * Hook para actualizar un cliente
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientUpdate }) =>
      clientsApi.update(id, data),
    onSuccess: (_result, variables) => {
      // Invalidar TODAS las queries que empiecen con 'clients' (incluyendo las con filtros)
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
    },
  });
}

/**
 * Hook para activar un cliente
 */
export function useActivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientsApi.activate(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}

/**
 * Hook para desactivar un cliente
 */
export function useDeactivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientsApi.deactivate(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
  });
}

// =============================================
// HOOKS DE USUARIOS
// =============================================

/**
 * Hook para listar usuarios con filtros y paginacion
 */
export function useUsersList(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => usersApi.list(filters),
  });
}

/**
 * Hook para obtener detalle de un usuario
 */
export function useUserDetail(id: number | null) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Hook para obtener opciones de roles
 */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener opciones de areas de trabajo
 */
export function useWorkSpaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => usersApi.getWorkSpaces(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para crear un usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      usersApi.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
    },
  });
}

/**
 * Hook para activar un usuario
 */
export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.activate(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

/**
 * Hook para desactivar un usuario
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}
