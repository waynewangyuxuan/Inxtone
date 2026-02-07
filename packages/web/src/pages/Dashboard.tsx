/**
 * Dashboard Page
 *
 * Main dashboard with project overview and quick actions
 */

import React from 'react';
import styles from './Page.module.css';

export function Dashboard(): React.ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p className={styles.description}>Welcome to Inxtone. Start crafting your story.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.card}>
          <h3>Quick Start</h3>
          <p>
            Use the sidebar to navigate between modules. Start with the <strong>Story Bible</strong>{' '}
            to define your characters and world, then move to <strong>Write</strong> to craft your
            chapters.
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Characters</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Chapters</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>Words</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>—</span>
            <span className={styles.statLabel}>Last Edit</span>
          </div>
        </div>
      </section>
    </div>
  );
}
