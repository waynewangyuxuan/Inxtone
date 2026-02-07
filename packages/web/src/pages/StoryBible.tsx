/**
 * Story Bible Page
 *
 * Manage characters, world, and plot elements
 */

import React from 'react';
import styles from './Page.module.css';

export function StoryBible(): React.ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Story Bible</h1>
        <p className={styles.description}>
          Define your characters, build your world, and plan your plot.
        </p>
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
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h3 className={styles.emptyTitle}>No story elements yet</h3>
          <p className={styles.emptyText}>
            Start by creating characters, defining your world&apos;s rules, or outlining your plot
            structure. The Story Bible keeps everything organized and consistent.
          </p>
        </div>
      </section>
    </div>
  );
}
