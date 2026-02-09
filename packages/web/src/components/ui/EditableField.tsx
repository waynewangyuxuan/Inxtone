/**
 * EditableField Component
 *
 * Click-to-edit component: display mode shows text, click to edit inline.
 * Saves on blur/Enter (input/select) or Ctrl+Enter (textarea).
 * Escape cancels. No change = no save call.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './EditableField.module.css';

export interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  as?: 'input' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  label?: string;
  heading?: boolean;
  className?: string;
}

export function EditableField({
  value,
  onSave,
  as = 'input',
  options,
  placeholder = 'Click to edit...',
  label,
  heading,
  className,
}: EditableFieldProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Sync draft when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  // Auto-focus on enter edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end for input/textarea
      if (as !== 'select' && 'setSelectionRange' in inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isEditing, as]);

  const commit = useCallback(() => {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
        return;
      }
      if (as === 'textarea') {
        // Ctrl+Enter / Cmd+Enter saves textarea
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          commit();
        }
      } else {
        // Enter saves input/select
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
      }
    },
    [as, commit, cancel]
  );

  const handleClick = () => {
    if (!isEditing) {
      setDraft(value);
      setIsEditing(true);
    }
  };

  // Display mode
  if (!isEditing) {
    const displayClass = heading ? styles.headingDisplay : styles.display;
    // For select, show label instead of raw value
    const displayText =
      as === 'select' && options ? (options.find((o) => o.value === value)?.label ?? value) : value;

    return (
      <div className={`${styles.wrapper} ${className ?? ''}`}>
        {label && <span className={styles.label}>{label}</span>}
        <div className={displayClass} onClick={handleClick} role="button" tabIndex={0}>
          {displayText || <span className={styles.placeholder}>{placeholder}</span>}
        </div>
      </div>
    );
  }

  // Edit mode
  const inputClass = heading ? styles.headingInput : styles.input;

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      {as === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={styles.textarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      ) : as === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          className={styles.select}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            // Auto-save on select change
            const newVal = e.target.value;
            setIsEditing(false);
            if (newVal !== value) {
              onSave(newVal);
            }
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className={inputClass}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
