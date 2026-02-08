/**
 * CharacterDetail Component
 *
 * Displays full character information in a detail panel
 */

import React from 'react';
import { Button, RoleBadge, Badge } from '../../components/ui';
import { useCharacter } from '../../hooks/useCharacters';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CharacterId } from '@inxtone/core';
import styles from './CharacterDetail.module.css';

export interface CharacterDetailProps {
  characterId: CharacterId;
  onDelete: (id: CharacterId) => void;
}

export function CharacterDetail({
  characterId,
  onDelete,
}: CharacterDetailProps): React.ReactElement {
  const { data: character, isLoading } = useCharacter(characterId);
  const { openForm } = useStoryBibleActions();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading character...</span>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Character not found</div>
      </div>
    );
  }

  const handleEdit = () => {
    openForm('edit');
  };

  const handleDelete = () => {
    onDelete(character.id);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.name}>{character.name}</h2>
          <RoleBadge role={character.role} />
        </div>
        <div className={styles.meta}>
          <span className={styles.id}>{character.id}</span>
          {character.template && <Badge variant="default">{character.template}</Badge>}
          {character.conflictType && (
            <Badge variant="muted">{character.conflictType.replace(/_/g, ' ')}</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* External */}
        {character.appearance && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <p className={styles.text}>{character.appearance}</p>
          </section>
        )}

        {character.voiceSamples && character.voiceSamples.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Voice Samples</h3>
            <ul className={styles.list}>
              {character.voiceSamples.map((sample, index) => (
                <li key={index} className={styles.listItem}>
                  &ldquo;{sample}&rdquo;
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Motivation Layers */}
        {character.motivation && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Motivation Layers</h3>
            <div className={styles.layers}>
              {character.motivation.surface && (
                <div className={styles.layer}>
                  <span className={styles.layerLabel}>Surface Goal</span>
                  <p className={styles.layerText}>{character.motivation.surface}</p>
                </div>
              )}
              {character.motivation.hidden && (
                <div className={styles.layer}>
                  <span className={styles.layerLabel}>Hidden Driver</span>
                  <p className={styles.layerText}>{character.motivation.hidden}</p>
                </div>
              )}
              {character.motivation.core && (
                <div className={styles.layer}>
                  <span className={styles.layerLabel}>Core Need</span>
                  <p className={styles.layerText}>{character.motivation.core}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Facets */}
        {character.facets && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Character Facets</h3>
            <div className={styles.facets}>
              {character.facets.public && (
                <div className={styles.facet}>
                  <span className={styles.facetLabel}>Public Persona</span>
                  <p className={styles.facetText}>{character.facets.public}</p>
                </div>
              )}
              {character.facets.private && (
                <div className={styles.facet}>
                  <span className={styles.facetLabel}>Private Self</span>
                  <p className={styles.facetText}>{character.facets.private}</p>
                </div>
              )}
              {character.facets.hidden && (
                <div className={styles.facet}>
                  <span className={styles.facetLabel}>Hidden Aspects</span>
                  <p className={styles.facetText}>{character.facets.hidden}</p>
                </div>
              )}
              {character.facets.underPressure && (
                <div className={styles.facet}>
                  <span className={styles.facetLabel}>Under Pressure</span>
                  <p className={styles.facetText}>{character.facets.underPressure}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Character Arc */}
        {character.arc && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Character Arc</h3>
            <div className={styles.arc}>
              <div className={styles.arcHeader}>
                <Badge variant="primary">{character.arc.type}</Badge>
                <div className={styles.arcStates}>
                  <span className={styles.arcState}>{character.arc.startState}</span>
                  <span className={styles.arcArrow}>→</span>
                  <span className={styles.arcState}>{character.arc.endState}</span>
                </div>
              </div>
              {character.arc.phases && character.arc.phases.length > 0 && (
                <div className={styles.phases}>
                  <h4 className={styles.phasesTitle}>Transformation Phases</h4>
                  <ul className={styles.phasesList}>
                    {character.arc.phases.map((phase, index) => (
                      <li key={index} className={styles.phase}>
                        <span className={styles.phaseChapter}>Chapter {phase.chapter}</span>
                        <span className={styles.phaseEvent}>{phase.event}</span>
                        <span className={styles.phaseChange}>→ {phase.change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Metadata */}
        {character.firstAppearance && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Metadata</h3>
            <div className={styles.metadata}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>First Appearance</span>
                <span className={styles.metaValue}>Chapter {character.firstAppearance}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Created</span>
                <span className={styles.metaValue}>
                  {new Date(character.createdAt).toLocaleDateString()}
                </span>
              </div>
              {character.updatedAt !== character.createdAt && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Updated</span>
                  <span className={styles.metaValue}>
                    {new Date(character.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={handleEdit} variant="primary" size="md">
          Edit Character
        </Button>
        <Button onClick={handleDelete} variant="danger" size="md">
          Delete Character
        </Button>
      </div>
    </div>
  );
}
