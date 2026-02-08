/**
 * FormField Component
 *
 * Label + input + error wrapper
 */

import React from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  helpText?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  hint,
  helpText,
  children,
}: FormFieldProps): React.ReactElement {
  return (
    <div className={`${styles.field} ${error ? styles.hasError : ''}`}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {helpText && !error && <p className={styles.hint}>{helpText}</p>}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
