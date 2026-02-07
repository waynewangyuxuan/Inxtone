/**
 * EmptyState Component
 *
 * Placeholder for empty content areas
 */

import React from 'react';
import styles from './EmptyState.module.css';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <Button variant="secondary" onClick={action.onClick} className={styles.action}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
