/**
 * CharacterList Component
 *
 * Displays list of characters with card view
 */

import React from 'react';
import { Button, Card, EmptyState, RoleBadge, LoadingSpinner } from '../../components/ui';
import { useCharacters, useDeleteCharacter } from '../../hooks';
import { useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { CharacterForm } from './CharacterForm';
import { CharacterDetail } from './CharacterDetail';
import type { CharacterId } from '@inxtone/core';
import styles from './shared.module.css';
import detailStyles from './CharacterList.module.css';

export function CharacterList(): React.ReactElement {
  const { data: characters, isLoading, error } = useCharacters();
  const deleteCharacter = useDeleteCharacter();
  const selectedId = useSelectedId();
  const { select, openForm } = useStoryBibleActions();

  if (isLoading) {
    return <LoadingSpinner text="Loading characters..." />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Failed to load characters: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleCreate = () => {
    openForm('create');
  };

  const handleSelect = (id: CharacterId) => {
    select(id);
  };

  const handleDelete = (id: CharacterId) => {
    if (window.confirm('Delete this character?')) {
      deleteCharacter.mutate(id);
      if (selectedId === id) {
        select(null);
      }
    }
  };

  if (!characters || characters.length === 0) {
    return (
      <>
        <EmptyState
          title="No characters yet"
          description="Create your first character to start building your story's cast."
          action={{ label: 'Create Character', onClick: handleCreate }}
        />
        <CharacterForm />
      </>
    );
  }

  // Stats based on actual CharacterRole values
  const stats = {
    total: characters.length,
    main: characters.filter((c) => c.role === 'main').length,
    antagonists: characters.filter((c) => c.role === 'antagonist').length,
    supporting: characters.filter((c) => c.role === 'supporting').length,
  };

  return (
    <>
      <div className={detailStyles.layout}>
        <div className={detailStyles.listPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Characters ({stats.total})</h2>
            <Button onClick={handleCreate}>+ Add Character</Button>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.main}</span>
              <span className={styles.statLabel}>Main</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.antagonists}</span>
              <span className={styles.statLabel}>Antagonists</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stats.supporting}</span>
              <span className={styles.statLabel}>Supporting</span>
            </div>
          </div>

          <div className={`${styles.grid} ${styles.grid2}`}>
            {characters.map((character) => (
              <Card
                key={character.id}
                onClick={() => handleSelect(character.id)}
                selected={selectedId === character.id}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{character.name}</h3>
                  <RoleBadge role={character.role} />
                </div>
                {character.appearance && (
                  <p className={styles.cardDescription}>
                    {character.appearance.slice(0, 100)}
                    {character.appearance.length > 100 ? '...' : ''}
                  </p>
                )}
                {character.motivation?.surface && (
                  <p className={styles.cardMeta}>
                    Goal: {character.motivation.surface.slice(0, 80)}
                    {character.motivation.surface.length > 80 ? '...' : ''}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(character.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {selectedId && (
          <div className={detailStyles.detailPanel}>
            <CharacterDetail characterId={selectedId as CharacterId} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <CharacterForm />
    </>
  );
}
