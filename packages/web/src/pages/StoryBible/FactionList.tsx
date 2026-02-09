/**
 * FactionList Component
 *
 * Card grid display for factions with badges, goals, leader, stance.
 */

import React from 'react';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useFactions, useDeleteFaction, useCharacters } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { FactionForm } from './FactionForm';
import type { Faction, CharacterId } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './FactionList.module.css';

const STANCE_VARIANTS: Record<
  NonNullable<Faction['stanceToMC']>,
  'success' | 'default' | 'danger'
> = {
  friendly: 'success',
  neutral: 'default',
  hostile: 'danger',
};

export function FactionList(): React.ReactElement {
  const { data: factions, isLoading } = useFactions();
  const { data: characters } = useCharacters();
  const deleteFaction = useDeleteFaction();
  const { openForm, select } = useStoryBibleActions();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading factions...</span>
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Faction) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Faction): void => {
    deleteFaction.mutate(item.id);
  };

  if (!factions || factions.length === 0) {
    return (
      <>
        <EmptyState
          title="No factions yet"
          description="Add factions to create political intrigue and alliances."
          action={{ label: 'Add Faction', onClick: handleCreate }}
        />
        <FactionForm />
      </>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Factions ({factions.length})</h2>
        <Button onClick={handleCreate}>+ Add Faction</Button>
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {factions.map((faction) => (
          <Card key={faction.id}>
            <div className={cardStyles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{faction.name}</h3>
                <div className={cardStyles.badges}>
                  {faction.type && <Badge variant="default">{faction.type}</Badge>}
                  {faction.status && <Badge variant="muted">{faction.status}</Badge>}
                  {faction.stanceToMC && (
                    <Badge variant={STANCE_VARIANTS[faction.stanceToMC]}>
                      {faction.stanceToMC}
                    </Badge>
                  )}
                </div>
              </div>
              {faction.goals && faction.goals.length > 0 && (
                <>
                  <ul className={cardStyles.goals}>
                    {faction.goals.slice(0, 3).map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                  {faction.goals.length > 3 && (
                    <span className={cardStyles.moreGoals}>+{faction.goals.length - 3} more</span>
                  )}
                </>
              )}
              {faction.leaderId && (
                <p className={cardStyles.leader}>
                  Led by <strong>{charMap.get(faction.leaderId) ?? faction.leaderId}</strong>
                </p>
              )}
              {faction.internalConflict && (
                <p className={cardStyles.conflict}>{faction.internalConflict}</p>
              )}
              <div className={styles.cardActions}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(faction)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(faction)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <FactionForm />
    </>
  );
}
