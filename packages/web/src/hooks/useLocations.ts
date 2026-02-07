/**
 * Locations React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { Location, LocationId, CreateLocationInput } from '@inxtone/core';

// Query Keys
export const locationKeys = {
  all: ['locations'] as const,
  list: () => [...locationKeys.all, 'list'] as const,
  detail: (id: LocationId) => [...locationKeys.all, id] as const,
};

// List all locations
export function useLocations() {
  return useQuery({
    queryKey: locationKeys.list(),
    queryFn: () => apiGet<Location[]>('/locations'),
  });
}

// Get single location
export function useLocation(id: LocationId | null) {
  return useQuery({
    queryKey: locationKeys.detail(id!),
    queryFn: () => apiGet<Location>(`/locations/${id}`),
    enabled: !!id,
  });
}

// Create location
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationInput) =>
      apiPost<Location, CreateLocationInput>('/locations', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
    onError: (error) => showError('Failed to create location', error),
  });
}

// Update location
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: LocationId; data: Partial<CreateLocationInput> }) =>
      apiPatch<Location, Partial<CreateLocationInput>>(`/locations/${id}`, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
      void queryClient.invalidateQueries({ queryKey: locationKeys.detail(id) });
    },
    onError: (error) => showError('Failed to update location', error),
  });
}

// Delete location
export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: LocationId) => apiDelete(`/locations/${id}`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.all });
      void queryClient.removeQueries({ queryKey: locationKeys.detail(id) });
    },
    onError: (error) => showError('Failed to delete location', error),
  });
}
