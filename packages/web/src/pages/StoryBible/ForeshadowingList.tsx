/**
 * ForeshadowingList Component
 *
 * Read-only card grid for foreshadowing elements.
 * Foreshadowing is managed by AI during writing sessions.
 * Rich tracker lives in the Plot page.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Badge, LoadingSpinner } from '../../components/ui';
import { useForeshadowing } from '../../hooks';
import type { ForeshadowingStatus, ForeshadowingTerm } from '@inxtone/core';
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
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner text="Loading foreshadowing..." />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No foreshadowing yet"
        description="Foreshadowing is planted by AI during writing sessions. Start writing to build your story's hidden threads."
      />
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Foreshadowing ({items.length})</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
          View Tracker &rarr;
        </Button>
      </div>

      <p
        style={{
          fontSize: 'var(--font-xs)',
          color: 'var(--color-text-tertiary)',
          fontStyle: 'italic',
          margin: '0 0 var(--space-4)',
        }}
      >
        Managed by AI during writing sessions. View the full tracker in Plot.
      </p>

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
          </Card>
        ))}
      </div>
    </>
  );
}
