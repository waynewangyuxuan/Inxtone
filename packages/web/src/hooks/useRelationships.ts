/**
 * Relationships React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { Relationship, CharacterId, CreateRelationshipInput } from '@inxtone/core';
import { characterKeys } from './useCharacters';

// Helper to normalize filters (remove undefined values)
function normalizeFilters<T extends Record<string, unknown>>(filters?: T): T | undefined {
  if (!filters) return undefined;
  const normalized = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as T;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// Query Keys
export const relationshipKeys = {
  all: ['relationships'] as const,
  list: (characterId?: CharacterId) =>
    [...relationshipKeys.all, normalizeFilters({ characterId })] as const,
  detail: (id: number) => [...relationshipKeys.all, id] as const,
};

// List all relationships (optionally filtered by character)
export function useRelationships(characterId?: CharacterId) {
  const params = characterId ? `?characterId=${characterId}` : '';

  return useQuery({
    queryKey: relationshipKeys.list(characterId),
    queryFn: () => apiGet<Relationship[]>(`/relationships${params}`),
  });
}

// Get single relationship
export function useRelationship(id: number | null) {
  return useQuery({
    queryKey: relationshipKeys.detail(id!),
    queryFn: () => apiGet<Relationship>(`/relationships/${id}`),
    enabled: id !== null,
  });
}

// Create relationship
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRelationshipInput) =>
      apiPost<Relationship, CreateRelationshipInput>('/relationships', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      // Also invalidate character relations queries
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
    onError: (error) => showError('Failed to create relationship', error),
  });
}

// Update relationship
export function useUpdateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateRelationshipInput> }) =>
      apiPatch<Relationship, Partial<CreateRelationshipInput>>(`/relationships/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      void queryClient.invalidateQueries({ queryKey: relationshipKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update relationship', error),
  });
}

// Delete relationship
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDelete(`/relationships/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: relationshipKeys.all });
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
    onError: (error) => showError('Failed to delete relationship', error),
  });
}
