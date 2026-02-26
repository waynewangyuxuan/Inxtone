/**
 * Visualizations Page
 *
 * Three-tab page: Relationship Map, Timeline, Pacing.
 * Each tab is an independent visualization component.
 */

import React, { useState } from 'react';
import { RelationshipMap } from './RelationshipMap';
import { TimelineView } from './TimelineView';
import { PacingView } from './PacingView';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import styles from './Visualizations.module.css';

type Tab = 'relationships' | 'timeline' | 'pacing';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'relationships', label: 'Relationship Map' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'pacing', label: 'Pacing' },
];

export function Visualizations(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('relationships');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Visualizations</h1>
        <p className={styles.subtitle}>See and verify your story&apos;s structural integrity</p>
      </header>

      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <ErrorBoundary>
          {activeTab === 'relationships' && <RelationshipMap />}
          {activeTab === 'timeline' && <TimelineView />}
          {activeTab === 'pacing' && <PacingView />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
