/**
 * RelationshipList Component
 *
 * Split layout: card grid (left) + RelationshipDetail panel (right).
 * Follows CharacterList pattern.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Button, Card, EmptyState, Badge, ConfirmDialog } from '../../components/ui';
import { useRelationships, useCharacters, useDeleteRelationship } from '../../hooks';
import { useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { RelationshipForm } from './RelationshipForm';
import { RelationshipDetail } from './RelationshipDetail';
import type { Relationship, CharacterId } from '@inxtone/core';
import styles from './shared.module.css';
import layoutStyles from './CharacterList.module.css';

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
  const selectedId = useSelectedId();
  const { openForm, select } = useStoryBibleActions();
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const hasRelationships = relationships && relationships.length > 0;

  const characterMap = useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  const getCharacterName = useCallback(
    (id: CharacterId): string => characterMap.get(id) ?? `Character ${id}`,
    [characterMap]
  );

  const handleDelete = useCallback((id: number) => {
    setDeleteTarget(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget !== null) {
      deleteRelationship.mutate(deleteTarget);
      if (selectedId === deleteTarget) {
        select(null);
      }
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteRelationship, selectedId, select]);

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

  const handleSelect = (id: number) => {
    select(id);
  };

  const handleEdit = (id: number) => {
    select(id);
    openForm('edit');
  };

  if (!hasRelationships) {
    return (
      <>
        <EmptyState
          title="No relationships yet"
          description="Define relationships between your characters to build a rich social network."
          action={{ label: 'Add Relationship', onClick: handleCreate }}
        />
        <RelationshipForm />
      </>
    );
  }

  // Stats
  const typeCounts = relationships.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <>
      <div className={layoutStyles.layout}>
        <div className={layoutStyles.listPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Relationships ({relationships.length})</h2>
            <Button onClick={handleCreate}>+ Add Relationship</Button>
          </div>

          <div className={styles.stats}>
            {topTypes.map(([type, count]) => (
              <div key={type} className={styles.stat}>
                <span className={styles.statValue}>{count}</span>
                <span className={styles.statLabel}>{type}</span>
              </div>
            ))}
          </div>

          <div className={`${styles.grid} ${styles.grid2}`}>
            {relationships.map((rel) => (
              <Card
                key={rel.id}
                onClick={() => handleSelect(rel.id)}
                selected={selectedId === rel.id}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>
                    {getCharacterName(rel.sourceId)}
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>
                      &rarr;
                    </span>
                    {getCharacterName(rel.targetId)}
                  </h3>
                  <TypeBadge type={rel.type} />
                </div>
                {rel.joinReason && (
                  <p className={styles.cardDescription}>
                    {rel.joinReason.slice(0, 100)}
                    {rel.joinReason.length > 100 ? '...' : ''}
                  </p>
                )}
                {rel.evolution && (
                  <p className={styles.cardMeta}>
                    {rel.evolution.slice(0, 80)}
                    {rel.evolution.length > 80 ? '...' : ''}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(rel.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rel.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {selectedId != null && (
          <div className={layoutStyles.detailPanel}>
            <RelationshipDetail relationshipId={selectedId as number} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <RelationshipForm />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Relationship"
        message="Are you sure you want to delete this relationship? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteRelationship.isPending}
      />
    </>
  );
}
