/**
 * Header Component
 *
 * Top navigation bar with logo and global actions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { VERSION } from '@inxtone/core';
import styles from './Header.module.css';

export function Header(): React.ReactElement {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/" className={styles.logoLink}>
          <span className={styles.logoText}>Inxtone</span>
          <span className={styles.version}>v{VERSION}</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <a
          href="https://github.com/waynewang/inxtone"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
