/**
 * ContextPreview — displays built AI context items with toggle support
 *
 * L1 items are always included (disabled checkbox).
 * L2-L5 items can be toggled on/off to exclude from AI generation.
 */

import React from 'react';
import { Badge } from '../../components/ui';
import {
  useBuiltContextState,
  useExcludedContextIds,
  useInjectedEntities,
  useEditorActions,
} from '../../stores/useEditorStore';
import type { ContextItemType } from '@inxtone/core';
import styles from './ContextPreview.module.css';

const typeLabels: Record<ContextItemType, string> = {
  chapter_content: 'Content',
  chapter_outline: 'Outline',
  chapter_prev_tail: 'Prev Tail',
  character: 'Character',
  relationship: 'Relationship',
  location: 'Location',
  arc: 'Arc',
  foreshadowing: 'Foreshadowing',
  hook: 'Hook',
  power_system: 'Power System',
  social_rules: 'Social Rules',
  custom: 'Custom',
};

const layerMap: Record<ContextItemType, string> = {
  chapter_content: 'L1',
  chapter_outline: 'L1',
  chapter_prev_tail: 'L1',
  character: 'L2',
  relationship: 'L2',
  location: 'L2',
  arc: 'L2',
  foreshadowing: 'L3',
  hook: 'L3',
  power_system: 'L4',
  social_rules: 'L4',
  custom: 'L5',
};

const L1_TYPES = new Set<ContextItemType>([
  'chapter_content',
  'chapter_outline',
  'chapter_prev_tail',
]);

export function ContextPreview(): React.ReactElement {
  const context = useBuiltContextState();
  const excludedIds = useExcludedContextIds();
  const injectedEntities = useInjectedEntities();
  const { toggleContextItem, removeInjectedEntity } = useEditorActions();
  const [open, setOpen] = React.useState(false);

  const injectedIds = React.useMemo(
    () => new Set(injectedEntities.map((e) => e.id).filter(Boolean)),
    [injectedEntities]
  );

  if (!context) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.label}>Context</span>
          <span className={styles.meta}>Not built</span>
        </div>
      </div>
    );
  }

  const activeCount = context.items.filter((item, i) => {
    const itemId = item.id ?? `idx-${i}`;
    return !excludedIds.has(itemId);
  }).length;

  return (
    <div className={styles.wrapper}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.label}>Context</span>
        <span className={styles.meta}>
          {activeCount}/{context.items.length} items &middot; ~{context.totalTokens} tokens
          {context.truncated && ' (truncated)'}
        </span>
      </button>
      {open && (
        <div className={styles.items}>
          {context.items.map((item, i) => {
            const itemId = item.id ?? `idx-${i}`;
            const isL1 = L1_TYPES.has(item.type);
            const isExcluded = !isL1 && excludedIds.has(itemId);
            const isPinned = injectedIds.has(itemId);

            return (
              <div
                key={itemId}
                className={`${styles.item} ${isExcluded ? styles.itemExcluded : ''}`}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={!isExcluded}
                  disabled={isL1}
                  onChange={() => toggleContextItem(itemId)}
                  title={isL1 ? 'L1 items are always included' : 'Toggle this context item'}
                />
                <Badge variant={isPinned ? 'primary' : 'muted'} size="sm">
                  {isPinned ? 'Pinned' : layerMap[item.type]}
                </Badge>
                <span className={styles.itemType}>{typeLabels[item.type]}</span>
                <span className={styles.itemPreview}>
                  {item.content.length > 50 ? item.content.slice(0, 50) + '...' : item.content}
                </span>
                {isPinned && (
                  <button
                    className={styles.unpinButton}
                    onClick={() => removeInjectedEntity(itemId)}
                    title="Unpin from context"
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
