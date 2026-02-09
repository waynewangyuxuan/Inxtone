/**
 * StoryBiblePanel — quick-reference for chapter FK refs
 *
 * Shows characters, locations, and foreshadowing linked to the selected chapter.
 */

import React from 'react';
import { Badge } from '../../components/ui';
import { useChapterWithContent, useCharacters, useLocations, useForeshadowing } from '../../hooks';
import { useSelectedChapterId } from '../../stores/useEditorStore';
import styles from './StoryBiblePanel.module.css';

interface SectionProps {
  title: string;
  items: {
    id: string;
    name: string;
    badge?: string;
    badgeVariant?: 'default' | 'primary' | 'muted';
  }[];
  defaultOpen?: boolean;
}

function Section({ title, items, defaultOpen = true }: SectionProps): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.count}>{items.length}</span>
      </button>
      {open && (
        <div className={styles.sectionContent}>
          {items.length === 0 && <p className={styles.emptySection}>None linked</p>}
          {items.map((item) => (
            <div key={item.id} className={styles.refItem}>
              <span className={styles.refName}>{item.name}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant ?? 'default'} size="sm">
                  {item.badge}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StoryBiblePanel(): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const { data: chapter } = useChapterWithContent(selectedId);
  const { data: allChars } = useCharacters();
  const { data: allLocations } = useLocations();
  const { data: allForeshadowing } = useForeshadowing();

  if (!selectedId || !chapter) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>Select a chapter to see its Story Bible references</div>
      </div>
    );
  }

  const characters = (allChars ?? [])
    .filter((c) => chapter.characters?.includes(c.id))
    .map((c) => ({ id: c.id, name: c.name, badge: c.role, badgeVariant: 'primary' as const }));

  const locations = (allLocations ?? [])
    .filter((l) => chapter.locations?.includes(l.id))
    .map((l) => ({ id: l.id, name: l.name }));

  const foreshadowing = (allForeshadowing ?? [])
    .filter((f) => chapter.foreshadowingHinted?.includes(f.id))
    .map((f) => ({
      id: f.id,
      name: f.content.length > 60 ? f.content.slice(0, 60) + '...' : f.content,
      badge: f.status,
      badgeVariant: f.status === 'active' ? ('primary' as const) : ('muted' as const),
    }));

  return (
    <div className={styles.panel}>
      <Section title="Characters" items={characters} />
      <Section title="Locations" items={locations} />
      <Section title="Foreshadowing" items={foreshadowing} />
    </div>
  );
}
