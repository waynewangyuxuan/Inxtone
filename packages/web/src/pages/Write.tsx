/**
 * Write Page
 *
 * Chapter editor with AI assistance
 */

import React from 'react';
import styles from './Page.module.css';

export function Write(): React.ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Write</h1>
        <p className={styles.description}>Craft your chapters with AI-powered assistance.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
          <h3 className={styles.emptyTitle}>No chapters yet</h3>
          <p className={styles.emptyText}>
            Create your first chapter to start writing. The AI will help you maintain consistency
            with your Story Bible as you write.
          </p>
        </div>
      </section>
    </div>
  );
}
