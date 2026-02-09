/**
 * RelationshipDetail Component
 *
 * Detail panel showing Wayne Principles and relationship evolution.
 * Pattern follows CharacterDetail.tsx.
 */

import React from 'react';
import { Button, Badge } from '../../components/ui';
import { useRelationship, useCharacters } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CharacterId, RelationshipType } from '@inxtone/core';
import styles from './RelationshipDetail.module.css';

const TYPE_VARIANTS: Record<
  RelationshipType,
  'primary' | 'success' | 'danger' | 'warning' | 'default' | 'muted'
> = {
  companion: 'success',
  rival: 'warning',
  enemy: 'danger',
  mentor: 'primary',
  confidant: 'default',
  lover: 'primary',
};

function ExpandableList({ label, items }: { label: string; items: string[] }): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <button className={styles.listHeader} onClick={() => setExpanded(!expanded)}>
        <span className={`${styles.expandIcon}${expanded ? ` ${styles.expanded}` : ''}`}>
          &#x25B6;
        </span>
        <span className={styles.listLabel}>{label}</span>
        <span className={styles.listCount}>{items.length}</span>
      </button>
      {expanded && (
        <ul className={styles.scenarioList}>
          {items.map((item, i) => (
            <li key={i} className={styles.scenarioItem}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface RelationshipDetailProps {
  relationshipId: number;
  onDelete: (id: number) => void;
}

export function RelationshipDetail({
  relationshipId,
  onDelete,
}: RelationshipDetailProps): React.ReactElement {
  const { data: rel, isLoading } = useRelationship(relationshipId);
  const { data: characters } = useCharacters();
  const { openForm } = useStoryBibleActions();

  const charMap = React.useMemo(() => {
    if (!characters) return new Map<CharacterId, string>();
    return new Map(characters.map((c) => [c.id, c.name]));
  }, [characters]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading relationship...</span>
        </div>
      </div>
    );
  }

  if (!rel) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Relationship not found</div>
      </div>
    );
  }

  const sourceName = charMap.get(rel.sourceId) ?? rel.sourceId;
  const targetName = charMap.get(rel.targetId) ?? rel.targetId;

  const handleEdit = () => {
    openForm('edit');
  };

  const handleDelete = () => {
    onDelete(rel.id);
  };

  const hasWaynePrinciples = Boolean(
    rel.joinReason ??
    rel.independentGoal ??
    rel.mcNeeds ??
    (rel.disagreeScenarios && rel.disagreeScenarios.length > 0 ? true : null) ??
    (rel.leaveScenarios && rel.leaveScenarios.length > 0 ? true : null)
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerNames}>
          <span className={styles.name}>{sourceName}</span>
          <span className={styles.arrow}>&rarr;</span>
          <span className={styles.name}>{targetName}</span>
        </div>
        <div className={styles.meta}>
          <Badge variant={TYPE_VARIANTS[rel.type]}>{rel.type}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Wayne Principles */}
        {hasWaynePrinciples && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Wayne Principles</h3>
            <div className={styles.layers}>
              {rel.joinReason && (
                <div className={`${styles.layer} ${styles.primary}`}>
                  <span className={styles.layerLabel}>Why They Joined</span>
                  <p className={styles.layerText}>{rel.joinReason}</p>
                </div>
              )}
              {rel.independentGoal && (
                <div className={styles.layer}>
                  <span className={styles.layerLabel}>Independent Goal</span>
                  <p className={styles.layerText}>{rel.independentGoal}</p>
                </div>
              )}
              {rel.disagreeScenarios && rel.disagreeScenarios.length > 0 && (
                <ExpandableList label="Disagree Scenarios" items={rel.disagreeScenarios} />
              )}
              {rel.leaveScenarios && rel.leaveScenarios.length > 0 && (
                <ExpandableList label="Leave Scenarios" items={rel.leaveScenarios} />
              )}
              {rel.mcNeeds && (
                <div className={`${styles.layer} ${styles.accent}`}>
                  <span className={styles.layerLabel}>What MC Needs</span>
                  <p className={styles.layerText}>{rel.mcNeeds}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Evolution */}
        {rel.evolution && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Evolution</h3>
            <p className={styles.evolutionText}>{rel.evolution}</p>
          </section>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={handleEdit} variant="primary" size="md">
          Edit Relationship
        </Button>
        <Button onClick={handleDelete} variant="danger" size="md">
          Delete
        </Button>
      </div>
    </div>
  );
}
