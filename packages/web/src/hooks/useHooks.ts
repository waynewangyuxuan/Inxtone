/**
 * Hooks React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { Hook, HookId, ChapterId, CreateHookInput } from '@inxtone/core';

// Helper to normalize filters (remove undefined values)
function normalizeFilters<T extends Record<string, unknown>>(filters?: T): T | undefined {
  if (!filters) return undefined;
  const normalized = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as T;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// Query Keys
export const hookKeys = {
  all: ['hooks'] as const,
  list: (chapterId?: ChapterId) => [...hookKeys.all, normalizeFilters({ chapterId })] as const,
  detail: (id: HookId) => [...hookKeys.all, id] as const,
};

// List all hooks (optionally filtered by chapter)
export function useHooks(chapterId?: ChapterId) {
  const params = chapterId ? `?chapterId=${chapterId}` : '';

  return useQuery({
    queryKey: hookKeys.list(chapterId),
    queryFn: () => apiGet<Hook[]>(`/hooks${params}`),
  });
}

// Get single hook
export function useHook(id: HookId | null) {
  return useQuery({
    queryKey: hookKeys.detail(id!),
    queryFn: () => apiGet<Hook>(`/hooks/${id}`),
    enabled: !!id,
  });
}

// Create hook
export function useCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHookInput) => apiPost<Hook, CreateHookInput>('/hooks', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hookKeys.all });
    },
    onError: (error) => showError('Failed to create hook', error),
  });
}

// Update hook
export function useUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: HookId; data: Partial<CreateHookInput> }) =>
      apiPatch<Hook, Partial<CreateHookInput>>(`/hooks/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: hookKeys.all });
      void queryClient.invalidateQueries({ queryKey: hookKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update hook', error),
  });
}

// Delete hook
export function useDeleteHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: HookId) => apiDelete(`/hooks/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: hookKeys.all });
      void queryClient.removeQueries({ queryKey: hookKeys.detail(id) });
    },
    onError: (error) => showError('Failed to delete hook', error),
  });
}
