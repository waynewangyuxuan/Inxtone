/**
 * Factions React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { Faction, FactionId, CreateFactionInput } from '@inxtone/core';

// Query Keys
export const factionKeys = {
  all: ['factions'] as const,
  list: () => [...factionKeys.all, 'list'] as const,
  detail: (id: FactionId) => [...factionKeys.all, id] as const,
};

// List all factions
export function useFactions() {
  return useQuery({
    queryKey: factionKeys.list(),
    queryFn: () => apiGet<Faction[]>('/factions'),
  });
}

// Get single faction
export function useFaction(id: FactionId | null) {
  return useQuery({
    queryKey: factionKeys.detail(id!),
    queryFn: () => apiGet<Faction>(`/factions/${id}`),
    enabled: !!id,
  });
}

// Create faction
export function useCreateFaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFactionInput) =>
      apiPost<Faction, CreateFactionInput>('/factions', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: factionKeys.all });
    },
    onError: (error) => showError('Failed to create faction', error),
  });
}

// Update faction
export function useUpdateFaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: FactionId; data: Partial<CreateFactionInput> }) =>
      apiPatch<Faction, Partial<CreateFactionInput>>(`/factions/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: factionKeys.all });
      void queryClient.invalidateQueries({ queryKey: factionKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update faction', error),
  });
}

// Delete faction
export function useDeleteFaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: FactionId) => apiDelete(`/factions/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: factionKeys.all });
      void queryClient.removeQueries({ queryKey: factionKeys.detail(id) });
    },
    onError: (error) => showError('Failed to delete faction', error),
  });
}
