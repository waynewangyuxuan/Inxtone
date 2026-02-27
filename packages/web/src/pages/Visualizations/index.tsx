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
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import styles from './Visualizations.module.css';

type TabId = 'relationships' | 'timeline' | 'pacing';

const TABS = [
  { id: 'relationships', label: 'Relationship Map' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'pacing', label: 'Pacing' },
];

export function Visualizations(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('relationships');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Visualizations</h1>
        <p className={styles.subtitle}>See and verify your story&apos;s structural integrity</p>
      </header>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />

      <div className={styles.content}>
        <TabPanel id="relationships" activeTab={activeTab}>
          <ErrorBoundary>
            <RelationshipMap />
          </ErrorBoundary>
        </TabPanel>
        <TabPanel id="timeline" activeTab={activeTab}>
          <ErrorBoundary>
            <TimelineView />
          </ErrorBoundary>
        </TabPanel>
        <TabPanel id="pacing" activeTab={activeTab}>
          <ErrorBoundary>
            <PacingView />
          </ErrorBoundary>
        </TabPanel>
      </div>
    </div>
  );
}
