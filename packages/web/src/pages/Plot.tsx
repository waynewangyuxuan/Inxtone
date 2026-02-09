/**
 * Plot Page — Arc Outliner, Foreshadowing Tracker, Hook Tracker
 *
 * Standalone page for visualizing and managing plot structure.
 * All API routes and React Query hooks already exist.
 */

import React from 'react';
import { Tabs } from '../components/ui';
import type { Tab } from '../components/ui';
import { ArcOutliner } from './Plot/ArcOutliner';
import { ForeshadowingTracker } from './Plot/ForeshadowingTracker';
import { HookTracker } from './Plot/HookTracker';
import { PlotSummary } from './Plot/PlotSummary';
import styles from './Plot.module.css';

type PlotTab = 'arcs' | 'foreshadowing' | 'hooks';

const TABS: Tab[] = [
  { id: 'arcs', label: 'Arcs' },
  { id: 'foreshadowing', label: 'Foreshadowing' },
  { id: 'hooks', label: 'Hooks' },
];

const TAB_CONTENT: Record<PlotTab, React.ComponentType> = {
  arcs: ArcOutliner,
  foreshadowing: ForeshadowingTracker,
  hooks: HookTracker,
};

export function Plot(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<PlotTab>('arcs');

  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Plot</h1>
        <p className={styles.subtitle}>
          Visualize story arcs, track foreshadowing, and manage narrative hooks
        </p>
      </header>

      <PlotSummary />

      <nav className={styles.tabBar}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as PlotTab)} />
      </nav>

      <main className={styles.content}>
        <ActiveContent />
      </main>
    </div>
  );
}

export default Plot;
