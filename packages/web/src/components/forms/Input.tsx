/**
 * Input Component
 *
 * Text input with dark background and gold focus border
 */

import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const classNames = [styles.input, error ? styles.error : '', className ?? '']
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} className={classNames} {...props} />;
  }
);

Input.displayName = 'Input';
