/**
 * TimelineForm Component
 *
 * Modal form for creating timeline events
 */

import React, { useState } from 'react';
import { Modal } from '../../components/forms';
import { Input, Textarea, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateTimelineEvent } from '../../hooks';
import { useFormMode, useStoryBibleActions } from '../../stores/useStoryBibleStore';

interface FormData {
  eventDate: string;
  description: string;
  relatedCharacters: string; // Comma-separated IDs
  relatedLocations: string; // Comma-separated IDs
}

export function TimelineForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const { closeForm } = useStoryBibleActions();

  const createMutation = useCreateTimelineEvent();

  const [formData, setFormData] = useState<FormData>({
    eventDate: '',
    description: '',
    relatedCharacters: '',
    relatedLocations: '',
  });

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }

    const relatedCharacters = formData.relatedCharacters
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    const relatedLocations = formData.relatedLocations
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    createMutation.mutate(
      {
        description: formData.description.trim(),
        ...(formData.eventDate.trim() && { eventDate: formData.eventDate.trim() }),
        ...(relatedCharacters.length > 0 && { relatedCharacters }),
        ...(relatedLocations.length > 0 && { relatedLocations }),
      },
      {
        onSuccess: () => {
          closeForm();
          setFormData({
            eventDate: '',
            description: '',
            relatedCharacters: '',
            relatedLocations: '',
          });
        },
      }
    );
  };

  const isLoading = createMutation.isPending;

  return (
    <Modal isOpen={true} onClose={closeForm} title="Create Timeline Event">
      <form onSubmit={handleSubmit}>
        <FormField label="Event Date">
          <Input
            type="date"
            value={formData.eventDate}
            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Description" required>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what happened"
            rows={3}
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Related Characters" helpText="Comma-separated character IDs">
          <Input
            value={formData.relatedCharacters}
            onChange={(e) => setFormData({ ...formData, relatedCharacters: e.target.value })}
            placeholder="e.g., char_1, char_2"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Related Locations" helpText="Comma-separated location IDs">
          <Input
            value={formData.relatedLocations}
            onChange={(e) => setFormData({ ...formData, relatedLocations: e.target.value })}
            placeholder="e.g., loc_1, loc_2"
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
