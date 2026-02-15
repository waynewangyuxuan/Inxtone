/**
 * Intake Page
 *
 * Smart Intake — AI-powered Story Bible entity extraction.
 * User selects a topic, pastes/uploads text, reviews extracted entities,
 * then commits accepted ones to the Story Bible.
 */

import React from 'react';
import { Icon } from '../../components/Icon';
import { useIntakeStore, useIntakeResult } from '../../stores/useIntakeStore';
import { IntakeTextPanel } from './IntakeTextPanel';
import { EntityReviewPanel } from './EntityReviewPanel';
import { EntityEditModal } from './EntityEditModal';
import type { IntakeHint } from '@inxtone/core';
import styles from './Intake.module.css';
import pageStyles from '../Page.module.css';

interface TopicChip {
  hint: IntakeHint;
  label: string;
  description: string;
}

const TOPICS: TopicChip[] = [
  { hint: 'character', label: 'Characters', description: 'Extract character profiles' },
  { hint: 'world', label: 'World', description: 'World rules, magic systems' },
  { hint: 'plot', label: 'Plot', description: 'Arcs, hooks, foreshadowing' },
  { hint: 'location', label: 'Locations', description: 'Places and settings' },
  { hint: 'faction', label: 'Factions', description: 'Groups and organizations' },
  { hint: 'auto', label: 'Auto-detect', description: 'AI identifies all types' },
];

export function Intake(): React.ReactElement {
  const { hint, setHint, reset } = useIntakeStore();
  const result = useIntakeResult();

  const handleTopicSelect = (selected: IntakeHint) => {
    if (selected === hint) {
      setHint(undefined);
    } else {
      setHint(selected);
    }
  };

  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.header}>
        <h1>
          <span className={styles.headerIcon}>
            <Icon name="sparkle" />
          </span>
          Smart Intake
        </h1>
        <p className={pageStyles.subtitle}>
          Paste your notes or story content — AI will extract structured entities for your Story
          Bible.
        </p>
      </header>

      {/* Topic Selector */}
      <section className={styles.topicSection}>
        <label className={styles.topicLabel}>What are you importing?</label>
        <div className={styles.topicGrid}>
          {TOPICS.map((topic) => (
            <button
              key={topic.hint}
              className={`${styles.topicChip} ${hint === topic.hint ? styles.topicChipActive : ''}`}
              onClick={() => handleTopicSelect(topic.hint)}
            >
              <span className={styles.topicChipLabel}>{topic.label}</span>
              <span className={styles.topicChipDesc}>{topic.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Text Input */}
      <section className={styles.inputSection}>
        <IntakeTextPanel />
      </section>

      {/* Results */}
      {result && (
        <section className={styles.resultsSection}>
          <div className={styles.resultsDivider}>
            <span>Extraction Results</span>
          </div>
          <EntityReviewPanel />
          <div className={styles.resetRow}>
            <button className={styles.resetButton} onClick={reset}>
              Start Over
            </button>
          </div>
        </section>
      )}

      {/* Edit Modal */}
      <EntityEditModal />
    </div>
  );
}
