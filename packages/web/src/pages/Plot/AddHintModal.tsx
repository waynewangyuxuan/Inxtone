/**
 * AddHintModal — Quick modal to add a hint to a foreshadowing item
 */

import React from 'react';
import { Modal, Input, Textarea } from '../../components/forms';
import { useAddForeshadowingHint } from '../../hooks';
import type { ForeshadowingId } from '@inxtone/core';
import styles from './AddHintModal.module.css';

interface AddHintModalProps {
  foreshadowingId: ForeshadowingId;
  onClose: () => void;
}

export function AddHintModal({ foreshadowingId, onClose }: AddHintModalProps): React.ReactElement {
  const [chapter, setChapter] = React.useState('');
  const [text, setText] = React.useState('');
  const addHint = useAddForeshadowingHint();

  const canSubmit = chapter.trim() !== '' && text.trim() !== '';

  const handleSubmit = () => {
    if (!canSubmit) return;

    addHint.mutate(
      {
        id: foreshadowingId,
        hint: { chapter: parseInt(chapter, 10), text: text.trim() },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Modal
      isOpen={true}
      title="Add Hint"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Add Hint"
      loading={addHint.isPending}
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Chapter</label>
          <Input
            type="number"
            min="1"
            placeholder="Chapter number"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Hint Text</label>
          <Textarea
            placeholder="Describe the hint..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
