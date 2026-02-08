/**
 * Arcs React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { Arc, ArcId, CreateArcInput } from '@inxtone/core';

// Query Keys
export const arcKeys = {
  all: ['arcs'] as const,
  list: () => [...arcKeys.all, 'list'] as const,
  detail: (id: ArcId) => [...arcKeys.all, id] as const,
};

// List all arcs
export function useArcs() {
  return useQuery({
    queryKey: arcKeys.list(),
    queryFn: () => apiGet<Arc[]>('/arcs'),
  });
}

// Get single arc
export function useArc(id: ArcId | null) {
  return useQuery({
    queryKey: arcKeys.detail(id!),
    queryFn: () => apiGet<Arc>(`/arcs/${id}`),
    enabled: !!id,
  });
}

// Create arc
export function useCreateArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateArcInput) => apiPost<Arc, CreateArcInput>('/arcs', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: arcKeys.all });
    },
    onError: (error) => showError('Failed to create arc', error),
  });
}

// Update arc
export function useUpdateArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: ArcId; data: Partial<CreateArcInput> }) =>
      apiPatch<Arc, Partial<CreateArcInput>>(`/arcs/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: arcKeys.all });
      void queryClient.invalidateQueries({ queryKey: arcKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update arc', error),
  });
}

// Delete arc
export function useDeleteArc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ArcId) => apiDelete(`/arcs/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: arcKeys.all });
      void queryClient.removeQueries({ queryKey: arcKeys.detail(id) });
    },
    onError: (error) => showError('Failed to delete arc', error),
  });
}
