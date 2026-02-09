/**
 * ContextPreview — displays built AI context items
 */

import React from 'react';
import { Badge } from '../../components/ui';
import { useBuiltContextState } from '../../stores/useEditorStore';
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

export function ContextPreview(): React.ReactElement {
  const context = useBuiltContextState();
  const [open, setOpen] = React.useState(false);

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
          {context.items.map((item, i) => (
            <div key={i} className={styles.item}>
              <Badge variant="muted" size="sm">
                {layerMap[item.type]}
              </Badge>
              <span className={styles.itemType}>{typeLabels[item.type]}</span>
              <span className={styles.itemPreview}>
                {item.content.length > 50 ? item.content.slice(0, 50) + '...' : item.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
