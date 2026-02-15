/**
 * FactionList Component
 *
 * Card grid with split layout: cards on left, detail panel on right.
 */

import React from 'react';
import { Button, Card, EmptyState, Badge, LoadingSpinner } from '../../components/ui';
import { useFactions, useDeleteFaction, useCharacters } from '../../hooks';
import { useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { FactionDetail } from './FactionDetail';
import type { Faction, CharacterId, FactionId } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './FactionList.module.css';
import layoutStyles from './CharacterList.module.css';

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
  const selectedId = useSelectedId();
  const { select, openForm } = useStoryBibleActions();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  if (isLoading) {
    return <LoadingSpinner text="Loading factions..." />;
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: FactionId) => {
    select(id);
  };

  const handleDelete = (id: FactionId) => {
    deleteFaction.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  if (!factions || factions.length === 0) {
    return (
      <EmptyState
        title="No factions yet"
        description="Add factions to create political intrigue and alliances."
        action={{ label: 'Add Faction', onClick: handleCreate }}
      />
    );
  }

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Factions ({factions.length})</h2>
          <Button onClick={handleCreate}>+ Add Faction</Button>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {factions.map((faction) => (
            <Card
              key={faction.id}
              onClick={() => handleSelect(faction.id)}
              selected={selectedId === faction.id}
            >
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
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(faction.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedId && (
        <div className={layoutStyles.detailPanel}>
          <FactionDetail factionId={selectedId as FactionId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
