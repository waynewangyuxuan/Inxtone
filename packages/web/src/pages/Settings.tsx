/**
 * Settings Page
 *
 * Project and application settings
 */

import React from 'react';
import styles from './Page.module.css';

export function Settings(): React.ReactElement {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.description}>Configure your project and AI preferences.</p>
      </header>

      <section className={styles.section}>
        <div className={styles.card}>
          <h3>AI Provider</h3>
          <p>
            Configure your AI provider and model settings. Inxtone supports Gemini, OpenAI, and
            Claude.
          </p>
        </div>

        <div className={styles.card}>
          <h3>Export</h3>
          <p>Set default export formats and templates for your manuscripts.</p>
        </div>

        <div className={styles.card}>
          <h3>Writing Rules</h3>
          <p>Define custom consistency rules and quality checks for your writing.</p>
        </div>
      </section>
    </div>
  );
}
