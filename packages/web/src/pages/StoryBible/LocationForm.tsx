/**
 * LocationForm Component
 *
 * Modal form for creating and editing locations
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms';
import { Input, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateLocation, useUpdateLocation, useLocation } from '../../hooks';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CreateLocationInput } from '@inxtone/core';

interface FormData {
  name: string;
  type: string;
  significance: string;
  atmosphere: string;
}

export function LocationForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const { data: existingLocation } = useLocation(
    formMode === 'edit' ? (selectedId as string) : null
  );
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    significance: '',
    atmosphere: '',
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (formMode === 'edit' && existingLocation) {
      setFormData({
        name: existingLocation.name,
        type: existingLocation.type ?? '',
        significance: existingLocation.significance ?? '',
        atmosphere: existingLocation.atmosphere ?? '',
      });
    } else if (formMode === 'create') {
      setFormData({
        name: '',
        type: '',
        significance: '',
        atmosphere: '',
      });
    }
  }, [formMode, existingLocation]);

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a location name');
      return;
    }

    const input: CreateLocationInput = {
      name: formData.name.trim(),
      ...(formData.type.trim() && { type: formData.type.trim() }),
      ...(formData.significance.trim() && { significance: formData.significance.trim() }),
      ...(formData.atmosphere.trim() && { atmosphere: formData.atmosphere.trim() }),
    };

    if (formMode === 'create') {
      createMutation.mutate(input, {
        onSuccess: () => closeForm(),
      });
    } else {
      updateMutation.mutate(
        { id: selectedId as string, data: input },
        {
          onSuccess: () => closeForm(),
        }
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={true}
      onClose={closeForm}
      title={formMode === 'create' ? 'Create Location' : 'Edit Location'}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter location name"
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Type">
          <Input
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., City, Forest, Mountain"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Significance">
          <Input
            value={formData.significance}
            onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
            placeholder="Why is this location important?"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Atmosphere">
          <Input
            value={formData.atmosphere}
            onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
            placeholder="Describe the mood and feel"
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
            {isLoading ? 'Saving...' : formMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
