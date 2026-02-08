/**
 * Textarea Component
 *
 * Multi-line input with dark background
 */

import React from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const classNames = [styles.textarea, error ? styles.error : '', className ?? '']
      .filter(Boolean)
      .join(' ');

    return <textarea ref={ref} className={classNames} {...props} />;
  }
);

Textarea.displayName = 'Textarea';
