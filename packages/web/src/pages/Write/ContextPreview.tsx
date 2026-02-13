/**
 * ContextPreview — displays built AI context items grouped by type
 *
 * Shows expandable cards for each entity type (Characters, Locations, etc.)
 * with counts and individual entity previews when expanded.
 */

import React from 'react';
import { Badge } from '../../components/ui';
import {
  useBuiltContextState,
  useInjectedEntities,
  useEditorActions,
} from '../../stores/useEditorStore';
import type { ContextItemType, ContextItem } from '@inxtone/core';
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

export function ContextPreview(): React.ReactElement {
  const context = useBuiltContextState();
  const injectedEntities = useInjectedEntities();
  const { removeInjectedEntity } = useEditorActions();
  const [open, setOpen] = React.useState(false);
  const [expandedTypes, setExpandedTypes] = React.useState<Set<ContextItemType>>(new Set());

  const injectedIds = React.useMemo(
    () => new Set(injectedEntities.map((e) => e.id).filter(Boolean)),
    [injectedEntities]
  );

  // Group items by type
  const itemsByType = React.useMemo(() => {
    if (!context) return new Map<ContextItemType, ContextItem[]>();
    const groups = new Map<ContextItemType, ContextItem[]>();
    context.items.forEach((item) => {
      const existing = groups.get(item.type) ?? [];
      existing.push(item);
      groups.set(item.type, existing);
    });
    return groups;
  }, [context]);

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

  const toggleTypeExpansion = (type: ContextItemType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.label}>Context</span>
        <span className={styles.meta}>
          {context.items.length} items &middot; ~{context.totalTokens} tokens
          {context.truncated && ' (truncated)'}
        </span>
      </button>
      {open && (
        <div className={styles.items}>
          {Array.from(itemsByType.entries()).map(([type, items]) => {
            const isExpanded = expandedTypes.has(type);
            return (
              <div key={type} className={styles.typeCard}>
                <button className={styles.typeHeader} onClick={() => toggleTypeExpansion(type)}>
                  <span className={styles.typeChevron}>{isExpanded ? '\u25BE' : '\u25B8'}</span>
                  <Badge variant="muted" size="sm">
                    {layerMap[type]}
                  </Badge>
                  <span className={styles.typeLabel}>
                    {typeLabels[type]} ({items.length})
                  </span>
                </button>
                {isExpanded && (
                  <div className={styles.typeItems}>
                    {items.map((item, i) => {
                      const itemId = item.id ?? `idx-${i}`;
                      const isPinned = injectedIds.has(itemId);
                      return (
                        <div key={itemId} className={styles.item}>
                          {isPinned && (
                            <Badge variant="primary" size="sm">
                              Pinned
                            </Badge>
                          )}
                          <span className={styles.itemPreview}>
                            {item.content.length > 60
                              ? item.content.slice(0, 60) + '...'
                              : item.content}
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
          })}
        </div>
      )}
    </div>
  );
}
