/**
 * Timeline React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../lib/api';
import { showError } from '../lib/utils';
import type { TimelineEvent, CharacterId, LocationId } from '@inxtone/core';

// Query Keys
export const timelineKeys = {
  all: ['timeline'] as const,
  list: () => [...timelineKeys.all, 'list'] as const,
};

// Input type for creating timeline events
interface CreateTimelineEventInput {
  eventDate?: string;
  description: string;
  relatedCharacters?: CharacterId[];
  relatedLocations?: LocationId[];
}

// List all timeline events
export function useTimeline() {
  return useQuery({
    queryKey: timelineKeys.list(),
    queryFn: () => apiGet<TimelineEvent[]>('/timeline'),
  });
}

// Create timeline event
export function useCreateTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimelineEventInput) =>
      apiPost<TimelineEvent, CreateTimelineEventInput>('/timeline', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    onError: (error) => showError('Failed to create timeline event', error),
  });
}

// Delete timeline event
export function useDeleteTimelineEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiDelete(`/timeline/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timelineKeys.all });
    },
    onError: (error) => showError('Failed to delete timeline event', error),
  });
}
