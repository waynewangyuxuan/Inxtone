/**
 * HookList Component
 *
 * Compact card grid for narrative hooks with strength bars.
 * Rich visualization lives in the Plot page; this is the Bible tab view.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useHooks, useDeleteHook } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { HookForm } from './HookForm';
import type { Hook, HookType } from '@inxtone/core';
import styles from './shared.module.css';

const TYPE_VARIANTS: Record<HookType, 'primary' | 'warning' | 'default'> = {
  opening: 'primary',
  arc: 'warning',
  chapter: 'default',
};

function StrengthBar({ value }: { value: number }): React.ReactElement {
  const color =
    value >= 70
      ? 'var(--color-success)'
      : value >= 40
        ? 'var(--color-gold)'
        : 'var(--color-danger)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          flex: 1,
          height: '3px',
          background: 'var(--color-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)', minWidth: '30px' }}
      >
        {value}%
      </span>
    </div>
  );
}

export function HookList(): React.ReactElement {
  const { data: hooks, isLoading } = useHooks();
  const deleteHook = useDeleteHook();
  const { openForm, select } = useStoryBibleActions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading hooks...</span>
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Hook) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Hook): void => {
    deleteHook.mutate(item.id);
  };

  if (!hooks || hooks.length === 0) {
    return (
      <>
        <EmptyState
          title="No hooks yet"
          description="Add hooks to keep readers engaged with questions, mysteries, and promises."
          action={{ label: 'Add Hook', onClick: handleCreate }}
        />
        <HookForm />
      </>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Narrative Hooks ({hooks.length})</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/plot')}>
            View in Plot &rarr;
          </Button>
          <Button onClick={handleCreate}>+ Add Hook</Button>
        </div>
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {hooks.map((hook) => (
          <Card key={hook.id}>
            <div className={styles.cardHeader}>
              <Badge variant={TYPE_VARIANTS[hook.type]}>{hook.type}</Badge>
              {hook.hookType && <Badge variant="muted">{hook.hookType}</Badge>}
            </div>
            <p className={styles.cardDescription}>
              {hook.content.length > 120 ? `${hook.content.slice(0, 120)}...` : hook.content}
            </p>
            {hook.chapterId && (
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                Ch. {hook.chapterId}
              </span>
            )}
            {hook.strength !== undefined && <StrengthBar value={hook.strength} />}
            <div className={styles.cardActions}>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(hook)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(hook)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <HookForm />
    </>
  );
}
