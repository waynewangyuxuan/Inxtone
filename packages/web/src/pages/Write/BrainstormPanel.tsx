/**
 * BrainstormPanel — renders parsed brainstorm suggestions as selectable cards
 *
 * Each card shows a title + body. User can:
 * - "Use" a suggestion → feeds it as instruction into Continue mode
 * - "Regenerate" → re-run brainstorm with same topic
 */

import React from 'react';
import type { BrainstormSuggestion } from '../../lib/parseBrainstorm';
import { Button } from '../../components/ui';
import styles from './BrainstormPanel.module.css';

interface BrainstormPanelProps {
  suggestions: BrainstormSuggestion[];
  onUseAsInstruction: (suggestion: BrainstormSuggestion) => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isRegenerating?: boolean;
}

export function BrainstormPanel({
  suggestions,
  onUseAsInstruction,
  onRegenerate,
  onDismiss,
  isRegenerating,
}: BrainstormPanelProps): React.ReactElement {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.label}>Brainstorm Ideas</span>
        {!isRegenerating && <span className={styles.count}>{suggestions.length}</span>}
      </div>
      <div className={styles.cards}>
        {isRegenerating ? (
          <div className={styles.regenerating}>
            <span className={styles.pulse} />
            Regenerating ideas...
          </div>
        ) : (
          suggestions.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{s.title}</span>
                <button
                  className={styles.useBtn}
                  onClick={() => onUseAsInstruction(s)}
                  title="Use this idea as instruction for Continue"
                >
                  Use
                </button>
              </div>
              {s.body && <p className={styles.cardBody}>{s.body}</p>}
            </div>
          ))
        )}
      </div>
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={isRegenerating}>
          Regenerate
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
