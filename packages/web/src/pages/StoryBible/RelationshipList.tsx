/**
 * RelationshipList Component
 *
 * Displays list of character relationships
 */

import React, { useMemo, useCallback } from 'react';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useRelationships, useCharacters, useDeleteRelationship } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { RelationshipForm } from './RelationshipForm';
import type { Relationship, CharacterId } from '@inxtone/core';
import styles from './shared.module.css';

// Relationship type badge with correct variants
function TypeBadge({ type }: { type: Relationship['type'] }): React.ReactElement {
  const variants: Record<
    Relationship['type'],
    'primary' | 'success' | 'danger' | 'warning' | 'default' | 'muted'
  > = {
    companion: 'success',
    rival: 'warning',
    enemy: 'danger',
    mentor: 'primary',
    confidant: 'default',
    lover: 'primary',
  };
  return <Badge variant={variants[type]}>{type}</Badge>;
}

export function RelationshipList(): React.ReactElement {
  const { data: relationships, isLoading, error } = useRelationships();
  const { data: characters } = useCharacters();
  const deleteRelationship = useDeleteRelationship();
  const { openForm, select } = useStoryBibleActions();

  const hasRelationships = relationships && relationships.length > 0;

  // Memoize character name map for O(1) lookups
  const characterMap = useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  // Memoized character name getter
  const getCharacterName = useCallback(
    (id: CharacterId): string => characterMap.get(id) ?? `Character ${id}`,
    [characterMap]
  );

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading relationships...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load relationships: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (id: number) => {
    select(id);
    openForm('edit');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this relationship?')) {
      deleteRelationship.mutate(id);
    }
  };

  if (!hasRelationships) {
    return (
      <EmptyState
        title="No relationships yet"
        description="Define relationships between your characters to build a rich social network."
        action={{ label: 'Add Relationship', onClick: handleCreate }}
      />
    );
  }

  return (
    <>
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Relationships ({relationships.length})</h2>
          <Button onClick={handleCreate}>+ Add Relationship</Button>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {relationships.map((rel) => (
            <Card key={rel.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-gold)' }}>
                    {getCharacterName(rel.sourceId)}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>→</span>
                  <span style={{ color: 'var(--color-gold)' }}>
                    {getCharacterName(rel.targetId)}
                  </span>
                </div>
                <TypeBadge type={rel.type} />
              </div>
              {rel.joinReason && (
                <p
                  style={{
                    margin: '0.5rem 0',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Why: {rel.joinReason}
                </p>
              )}
              {rel.evolution && (
                <p
                  style={{
                    margin: '0.5rem 0',
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Evolution: {rel.evolution}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(rel.id)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(rel.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <RelationshipForm />
    </>
  );
}
