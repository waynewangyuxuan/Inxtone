/**
 * TimelineList Component
 *
 * Vertical timeline visualization with date badges and connecting lines.
 */

import React from 'react';
import { Button, EmptyState, LoadingSpinner } from '../../components/ui';
import { useTimeline, useDeleteTimelineEvent } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { TimelineEvent } from '@inxtone/core';
import styles from './shared.module.css';
import tlStyles from './TimelineList.module.css';

export function TimelineList(): React.ReactElement {
  const { data: events, isLoading } = useTimeline();
  const deleteEvent = useDeleteTimelineEvent();
  const { openForm, select } = useStoryBibleActions();

  if (isLoading) {
    return <LoadingSpinner text="Loading timeline..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: TimelineEvent) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: TimelineEvent): void => {
    deleteEvent.mutate(item.id);
  };

  if (!events || events.length === 0) {
    return (
      <>
        <EmptyState
          title="No timeline events yet"
          description="Add events to track your story's chronology."
          action={{ label: 'Add Event', onClick: handleCreate }}
        />
      </>
    );
  }

  // Sort chronologically by eventDate, fall back to createdAt
  const sorted = [...events].sort((a, b) => {
    const dateA = a.eventDate ?? a.createdAt;
    const dateB = b.eventDate ?? b.createdAt;
    return dateA.localeCompare(dateB);
  });

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Timeline ({events.length})</h2>
        <Button onClick={handleCreate}>+ Add Event</Button>
      </div>

      <div className={tlStyles.timeline}>
        {sorted.map((event) => (
          <div key={event.id} className={tlStyles.event}>
            {event.eventDate && <span className={tlStyles.dateBadge}>{event.eventDate}</span>}
            <div className={tlStyles.eventCard}>
              <p className={tlStyles.description}>{event.description}</p>
              <div className={tlStyles.actions}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
