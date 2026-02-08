/**
 * Select Component
 *
 * Dropdown with custom styling
 */

import React from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, ...props }, ref) => {
    const classNames = [styles.select, error ? styles.error : '', className ?? '']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        <select ref={ref} className={classNames} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>▼</span>
      </div>
    );
  }
);

Select.displayName = 'Select';
