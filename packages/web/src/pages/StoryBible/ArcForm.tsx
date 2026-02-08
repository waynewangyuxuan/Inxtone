/**
 * ArcForm Component
 *
 * Modal form for creating and editing arcs
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms';
import { Input, Select, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateArc, useUpdateArc, useArc } from '../../hooks';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CreateArcInput, ArcStatus } from '@inxtone/core';

interface FormData {
  name: string;
  type: 'main' | 'sub' | '';
  chapterStart: number | '';
  chapterEnd: number | '';
  status: ArcStatus | '';
}

export function ArcForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const { data: existingArc } = useArc(formMode === 'edit' ? (selectedId as string) : null);
  const createMutation = useCreateArc();
  const updateMutation = useUpdateArc();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    chapterStart: '',
    chapterEnd: '',
    status: '',
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (formMode === 'edit' && existingArc) {
      setFormData({
        name: existingArc.name,
        type: existingArc.type,
        chapterStart: existingArc.chapterStart ?? '',
        chapterEnd: existingArc.chapterEnd ?? '',
        status: existingArc.status ?? '',
      });
    } else if (formMode === 'create') {
      setFormData({
        name: '',
        type: '',
        chapterStart: '',
        chapterEnd: '',
        status: '',
      });
    }
  }, [formMode, existingArc]);

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter an arc name');
      return;
    }

    if (!formData.type) {
      alert('Please select an arc type');
      return;
    }

    const input: CreateArcInput = {
      name: formData.name.trim(),
      type: formData.type,
      ...(formData.chapterStart !== '' && { chapterStart: formData.chapterStart }),
      ...(formData.chapterEnd !== '' && { chapterEnd: formData.chapterEnd }),
      ...(formData.status && { status: formData.status }),
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

  const typeOptions = [
    { value: '', label: 'Select type...' },
    { value: 'main', label: 'Main Arc' },
    { value: 'sub', label: 'Sub Arc' },
  ];

  const statusOptions = [
    { value: '', label: 'Not specified' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={closeForm}
      title={formMode === 'create' ? 'Create Arc' : 'Edit Arc'}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter arc name"
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Type" required>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as FormData['type'] })}
            options={typeOptions}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Start Chapter">
          <Input
            type="number"
            value={formData.chapterStart}
            onChange={(e) =>
              setFormData({
                ...formData,
                chapterStart: e.target.value ? parseInt(e.target.value, 10) : '',
              })
            }
            placeholder="e.g., 1"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="End Chapter">
          <Input
            type="number"
            value={formData.chapterEnd}
            onChange={(e) =>
              setFormData({
                ...formData,
                chapterEnd: e.target.value ? parseInt(e.target.value, 10) : '',
              })
            }
            placeholder="e.g., 10"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Status">
          <Select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as FormData['status'] })
            }
            options={statusOptions}
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
