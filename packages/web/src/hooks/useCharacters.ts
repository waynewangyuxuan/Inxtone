/**
 * Characters React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type {
  Character,
  CharacterId,
  CharacterRole,
  Relationship,
  CreateCharacterInput,
  UpdateCharacterInput,
} from '@inxtone/core';

// Helper to normalize filters (remove undefined values)
function normalizeFilters<T extends Record<string, unknown>>(filters?: T): T | undefined {
  if (!filters) return undefined;
  const normalized = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined)
  ) as T;
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// Query Keys
export const characterKeys = {
  all: ['characters'] as const,
  list: (filters?: { role?: CharacterRole; search?: string }) =>
    [...characterKeys.all, normalizeFilters(filters)] as const,
  detail: (id: CharacterId) => [...characterKeys.all, id] as const,
  relations: (id: CharacterId) => [...characterKeys.all, id, 'relations'] as const,
};

// List all characters
export function useCharacters(filters?: { role?: CharacterRole; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set('role', filters.role);
  if (filters?.search) params.set('search', filters.search);
  const query = params.toString();

  return useQuery({
    queryKey: characterKeys.list(filters),
    queryFn: () => apiGet<Character[]>(`/characters${query ? `?${query}` : ''}`),
  });
}

// Get single character
export function useCharacter(id: CharacterId | null) {
  return useQuery({
    queryKey: characterKeys.detail(id!),
    queryFn: () => apiGet<Character>(`/characters/${id}`),
    enabled: !!id,
  });
}

// Get character with relations
export function useCharacterWithRelations(id: CharacterId | null) {
  return useQuery({
    queryKey: characterKeys.relations(id!),
    queryFn: () =>
      apiGet<{ character: Character; relationships: Relationship[] }>(
        `/characters/${id}/relations`
      ),
    enabled: !!id,
  });
}

// Create character
export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCharacterInput) =>
      apiPost<Character, CreateCharacterInput>('/characters', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
    onError: (error) => showError('Failed to create character', error),
  });
}

// Update character
export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: CharacterId; data: UpdateCharacterInput }) =>
      apiPatch<Character, UpdateCharacterInput>(`/characters/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
      void queryClient.invalidateQueries({ queryKey: characterKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update character', error),
  });
}

// Delete character
export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: CharacterId) => apiDelete(`/characters/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: characterKeys.all });
      void queryClient.removeQueries({ queryKey: characterKeys.detail(id) });
    },
    onError: (error) => showError('Failed to delete character', error),
  });
}
