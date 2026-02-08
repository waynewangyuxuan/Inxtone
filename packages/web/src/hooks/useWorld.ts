/**
 * World React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPut } from '../lib/api';
import { showError } from '../lib/utils';
import type { World, PowerSystem } from '@inxtone/core';

// Query Keys
export const worldKeys = {
  all: ['world'] as const,
};

// Get world settings
export function useWorld() {
  return useQuery({
    queryKey: worldKeys.all,
    queryFn: () => apiGet<World>('/world'),
  });
}

// Update world settings
export function useUpdateWorld() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<World>) => apiPatch<World, Partial<World>>('/world', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: worldKeys.all });
    },
    onError: (error) => showError('Failed to update world', error),
  });
}

// Set power system
export function useSetPowerSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (powerSystem: PowerSystem) =>
      apiPut<World, PowerSystem>('/world/power-system', powerSystem),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: worldKeys.all });
    },
  });
}
