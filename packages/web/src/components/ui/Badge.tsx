/**
 * Badge Component
 *
 * Role/status pills with color variants
 */

import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps): React.ReactElement {
  const classNames = [styles.badge, styles[variant], styles[size], className ?? '']
    .filter(Boolean)
    .join(' ');

  return <span className={classNames}>{children}</span>;
}

// Pre-defined badges for common use cases
export function RoleBadge({ role }: { role: string }): React.ReactElement {
  const variantMap: Record<string, BadgeProps['variant']> = {
    main: 'primary',
    supporting: 'default',
    antagonist: 'danger',
    mentioned: 'muted',
  };

  return <Badge variant={variantMap[role.toLowerCase()] ?? 'default'}>{role}</Badge>;
}

export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const variantMap: Record<string, BadgeProps['variant']> = {
    active: 'success',
    resolved: 'muted',
    abandoned: 'danger',
    planned: 'warning',
    'in-progress': 'primary',
    completed: 'success',
  };

  return <Badge variant={variantMap[status.toLowerCase()] ?? 'default'}>{status}</Badge>;
}
