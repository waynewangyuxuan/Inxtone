/**
 * ForeshadowingList Component
 *
 * Compact card grid for foreshadowing elements.
 * Rich tracker lives in the Plot page; this is the Bible tab view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useForeshadowing, useDeleteForeshadowing } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ForeshadowingForm } from './ForeshadowingForm';
import type { Foreshadowing, ForeshadowingStatus, ForeshadowingTerm } from '@inxtone/core';
import styles from './shared.module.css';

const STATUS_VARIANTS: Record<ForeshadowingStatus, 'primary' | 'success' | 'muted'> = {
  active: 'primary',
  resolved: 'success',
  abandoned: 'muted',
};

const TERM_VARIANTS: Record<ForeshadowingTerm, 'default' | 'warning' | 'danger'> = {
  short: 'default',
  mid: 'warning',
  long: 'danger',
};

export function ForeshadowingList(): React.ReactElement {
  const { data: items, isLoading } = useForeshadowing();
  const deleteForeshadowing = useDeleteForeshadowing();
  const { openForm } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading foreshadowing...</span>
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleDelete = (item: Foreshadowing): void => {
    deleteForeshadowing.mutate(item.id);
  };

  if (!items || items.length === 0) {
    return (
      <>
        <EmptyState
          title="No foreshadowing yet"
          description="Add hints and setup to pay off later in your story."
          action={{ label: 'Add Foreshadowing', onClick: handleCreate }}
        />
        <ForeshadowingForm />
      </>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Foreshadowing ({items.length})</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
            View Tracker &rarr;
          </Button>
          <Button onClick={handleCreate}>+ Add Foreshadowing</Button>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {items.map((item) => (
          <Card key={item.id}>
            <div className={styles.cardHeader}>
              <Badge variant={STATUS_VARIANTS[item.status]}>{item.status}</Badge>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {item.term && <Badge variant={TERM_VARIANTS[item.term]}>{item.term}</Badge>}
              </div>
            </div>
            <p className={styles.cardDescription}>
              {item.content.length > 120 ? `${item.content.slice(0, 120)}...` : item.content}
            </p>
            {item.plantedChapter && (
              <p className={styles.cardMeta}>Planted in Ch. {item.plantedChapter}</p>
            )}
            <div className={styles.cardActions}>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ForeshadowingForm />
    </>
  );
}
