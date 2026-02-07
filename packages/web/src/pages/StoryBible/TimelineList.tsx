/**
 * TimelineList Component
 *
 * Displays timeline events using CrudTable
 */

import React from 'react';
import { CrudTable, type ColumnDef } from '../../components/ui';
import { useTimeline, useDeleteTimelineEvent } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { TimelineForm } from './TimelineForm';
import type { TimelineEvent } from '@inxtone/core';

export function TimelineList(): React.ReactElement {
  const { data: events, isLoading } = useTimeline();
  const deleteEvent = useDeleteTimelineEvent();
  const { openForm } = useStoryBibleActions();

  const columns: ColumnDef<TimelineEvent>[] = [
    { key: 'eventDate', header: 'Date', render: (item) => item.eventDate ?? '—' },
    {
      key: 'description',
      header: 'Description',
      render: (item) => {
        const text = item.description;
        if (!text) return '—';
        return text.length > 80 ? `${text.slice(0, 80)}...` : text;
      },
    },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: TimelineEvent) => {
    // Timeline events don't support editing yet
    console.log('Edit timeline event:', item);
  };

  const handleDelete = (item: TimelineEvent): void => {
    deleteEvent.mutate(item.id);
  };

  return (
    <>
      <CrudTable<TimelineEvent>
        title="Timeline"
        columns={columns}
        items={events ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No timeline events yet. Add events to track your story's chronology."
      />
      <TimelineForm />
    </>
  );
}
