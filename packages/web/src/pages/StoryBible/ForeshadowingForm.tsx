/**
 * ForeshadowingForm Component
 *
 * Modal form for creating foreshadowing entries
 */

import React, { useState } from 'react';
import { Modal } from '../../components/forms';
import { Input, Textarea, Select, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateForeshadowing } from '../../hooks';
import { useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';

interface FormData {
  content: string;
  plantedChapter: number | '';
  term: 'short' | 'mid' | 'long' | '';
}

export function ForeshadowingForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const { closeForm } = useStoryBibleActions();

  const createMutation = useCreateForeshadowing();

  const [formData, setFormData] = useState<FormData>({
    content: '',
    plantedChapter: '',
    term: '',
  });

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      alert('Please enter foreshadowing content');
      return;
    }

    createMutation.mutate(
      {
        content: formData.content.trim(),
        ...(formData.plantedChapter !== '' && { plantedChapter: formData.plantedChapter }),
        ...(formData.term && { term: formData.term }),
      },
      {
        onSuccess: () => {
          closeForm();
          setFormData({
            content: '',
            plantedChapter: '',
            term: '',
          });
        },
      }
    );
  };

  const isLoading = createMutation.isPending;

  const termOptions = [
    { value: '', label: 'Not specified' },
    { value: 'short', label: 'Short-term (1-5 chapters)' },
    { value: 'mid', label: 'Mid-term (5-20 chapters)' },
    { value: 'long', label: 'Long-term (20+ chapters)' },
  ];

  return (
    <Modal isOpen={true} onClose={closeForm} title="Create Foreshadowing">
      <form onSubmit={handleSubmit}>
        <FormField label="Content" required>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="What are you foreshadowing?"
            rows={4}
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Planted Chapter">
          <Input
            type="number"
            value={formData.plantedChapter}
            onChange={(e) =>
              setFormData({
                ...formData,
                plantedChapter: e.target.value ? parseInt(e.target.value, 10) : '',
              })
            }
            placeholder="e.g., 1"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Term">
          <Select
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value as FormData['term'] })}
            options={termOptions}
            disabled={isLoading}
          />
        </FormField>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <Button type="button" variant="ghost" onClick={closeForm} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
