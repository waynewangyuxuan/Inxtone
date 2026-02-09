/**
 * RejectReasonModal — required reason input when rejecting AI response
 */

import React from 'react';
import { Modal, FormField, Textarea } from '../../components/forms';
import styles from './RejectReasonModal.module.css';

interface RejectReasonModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectReasonModal({
  isOpen,
  onConfirm,
  onCancel,
}: RejectReasonModalProps): React.ReactElement | null {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      title="Reject AI Response"
      onClose={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Reject"
      size="sm"
    >
      <div className={styles.content}>
        <p className={styles.hint}>
          Explain why this response doesn&apos;t work. This helps generate a better one.
        </p>
        <FormField label="Reason" required error={error} htmlFor="reject-reason">
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={3}
            placeholder="e.g., tone doesn't match character, too verbose, wrong direction..."
          />
        </FormField>
      </div>
    </Modal>
  );
}
