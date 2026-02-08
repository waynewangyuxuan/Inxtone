/**
 * StoryBible Page
 *
 * Main page for the Story Bible with tab-based navigation across 9 domains:
 * Characters, Relationships, World, Locations, Factions, Timeline, Arcs, Foreshadowing, Hooks
 */

import React from 'react';
import { Tabs } from '../components/ui';
import { useActiveTab, useStoryBibleActions } from '../stores/useStoryBibleStore';
import type { StoryBibleTab } from '../stores/useStoryBibleStore';
import styles from './StoryBible.module.css';

// Domain components
import { CharacterList } from './StoryBible/CharacterList';
import { RelationshipList } from './StoryBible/RelationshipList';
import { WorldSettings } from './StoryBible/WorldSettings';
import { LocationList } from './StoryBible/LocationList';
import { FactionList } from './StoryBible/FactionList';
import { TimelineList } from './StoryBible/TimelineList';
import { ArcList } from './StoryBible/ArcList';
import { ForeshadowingList } from './StoryBible/ForeshadowingList';
import { HookList } from './StoryBible/HookList';

// Tab configuration
const TABS: { id: StoryBibleTab; label: string }[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'world', label: 'World' },
  { id: 'locations', label: 'Locations' },
  { id: 'factions', label: 'Factions' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'arcs', label: 'Arcs' },
  { id: 'foreshadowing', label: 'Foreshadowing' },
  { id: 'hooks', label: 'Hooks' },
];

// Tab content components mapping
const TAB_CONTENT: Record<StoryBibleTab, React.ComponentType> = {
  characters: CharacterList,
  relationships: RelationshipList,
  world: WorldSettings,
  locations: LocationList,
  factions: FactionList,
  timeline: TimelineList,
  arcs: ArcList,
  foreshadowing: ForeshadowingList,
  hooks: HookList,
};

export function StoryBible(): React.ReactElement {
  const activeTab = useActiveTab();
  const { setTab } = useStoryBibleActions();

  const handleTabChange = (tabId: string) => {
    setTab(tabId as StoryBibleTab);
  };

  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Story Bible</h1>
        <p className={styles.subtitle}>
          Manage your story&apos;s characters, world, and narrative elements
        </p>
      </header>

      <nav className={styles.tabBar}>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
      </nav>

      <main className={styles.content}>
        <ActiveContent />
      </main>
    </div>
  );
}

export default StoryBible;
