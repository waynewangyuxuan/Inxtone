/**
 * Card Component
 *
 * Content container with gradient background and gold border hover
 */

import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hoverable?: boolean;
}

export function Card({
  children,
  className,
  onClick,
  selected = false,
  hoverable = true,
}: CardProps): React.ReactElement {
  const classNames = [
    styles.card,
    hoverable ? styles.hoverable : '',
    selected ? styles.selected : '',
    onClick ? styles.clickable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.header} ${className ?? ''}`}>{children}</div>;
}

export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.body} ${className ?? ''}`}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${styles.footer} ${className ?? ''}`}>{children}</div>;
}
