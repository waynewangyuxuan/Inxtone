/**
 * ArcList Component
 *
 * Compact card grid for story arcs with progress bars.
 * Rich visualization lives in the Plot page; this is the Bible tab view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Badge, LoadingSpinner } from '../../components/ui';
import { useArcs, useDeleteArc } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ArcForm } from './ArcForm';
import type { Arc, ArcStatus } from '@inxtone/core';
import styles from './shared.module.css';

const STATUS_VARIANTS: Record<ArcStatus, 'muted' | 'warning' | 'success'> = {
  planned: 'muted',
  in_progress: 'warning',
  complete: 'success',
};

export function ArcList(): React.ReactElement {
  const { data: arcs, isLoading } = useArcs();
  const deleteArc = useDeleteArc();
  const { openForm, select } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner text="Loading arcs..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Arc) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Arc): void => {
    deleteArc.mutate(item.id);
  };

  if (!arcs || arcs.length === 0) {
    return (
      <>
        <EmptyState
          title="No arcs yet"
          description="Add arcs to organize your story's major plot threads."
          action={{ label: 'Add Arc', onClick: handleCreate }}
        />
        <ArcForm />
      </>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Story Arcs ({arcs.length})</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
            View in Plot &rarr;
          </Button>
          <Button onClick={handleCreate}>+ Add Arc</Button>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {arcs.map((arc) => (
          <Card key={arc.id}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{arc.name}</h3>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Badge variant={arc.type === 'main' ? 'primary' : 'default'}>{arc.type}</Badge>
                <Badge variant={STATUS_VARIANTS[arc.status]}>{arc.status.replace('_', ' ')}</Badge>
              </div>
            </div>
            {/* Mini progress bar */}
            <div
              style={{
                height: '3px',
                background: 'var(--color-border)',
                borderRadius: '2px',
                margin: '0 0 var(--space-3)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${arc.progress}%`,
                  background: 'var(--color-gold)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
              {arc.progress}% complete
            </span>
            <div className={styles.cardActions}>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(arc)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(arc)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ArcForm />
    </>
  );
}
