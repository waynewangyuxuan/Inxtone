/**
 * Modal Component
 *
 * Overlay modal container for forms
 */

import React, { useEffect } from 'react';
import styles from './Modal.module.css';
import { Button } from '../ui/Button';

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  isOpen,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
  children,
  size = 'md',
}: ModalProps): React.ReactElement | null {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={loading ? undefined : onClose}>
      <div className={`${styles.modal} ${styles[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onSubmit && (
            <Button variant="primary" onClick={onSubmit} loading={loading}>
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
