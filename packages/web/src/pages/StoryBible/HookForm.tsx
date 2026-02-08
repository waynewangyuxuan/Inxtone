/**
 * HookForm Component
 *
 * Modal form for creating and editing hooks
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms';
import { Input, Textarea, Select, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateHook, useUpdateHook, useHook } from '../../hooks';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CreateHookInput, HookType, HookStyle } from '@inxtone/core';

interface FormData {
  type: HookType | '';
  content: string;
  chapterId: number | '';
  hookType: HookStyle | '';
  strength: string; // Will parse to number
}

export function HookForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const { data: existingHook } = useHook(formMode === 'edit' ? (selectedId as string) : null);
  const createMutation = useCreateHook();
  const updateMutation = useUpdateHook();

  const [formData, setFormData] = useState<FormData>({
    type: '',
    content: '',
    chapterId: '',
    hookType: '',
    strength: '',
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (formMode === 'edit' && existingHook) {
      setFormData({
        type: existingHook.type,
        content: existingHook.content,
        chapterId: existingHook.chapterId ?? '',
        hookType: existingHook.hookType ?? '',
        strength: existingHook.strength?.toString() ?? '',
      });
    } else if (formMode === 'create') {
      setFormData({
        type: '',
        content: '',
        chapterId: '',
        hookType: '',
        strength: '',
      });
    }
  }, [formMode, existingHook]);

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      alert('Please select a hook type');
      return;
    }

    if (!formData.content.trim()) {
      alert('Please enter hook content');
      return;
    }

    const strength = formData.strength.trim() ? parseInt(formData.strength, 10) : undefined;
    if (strength !== undefined && (isNaN(strength) || strength < 0 || strength > 100)) {
      alert('Strength must be a number between 0 and 100');
      return;
    }

    const input: CreateHookInput = {
      type: formData.type,
      content: formData.content.trim(),
      ...(formData.chapterId !== '' && { chapterId: formData.chapterId }),
      ...(formData.hookType && { hookType: formData.hookType }),
      ...(strength !== undefined && { strength }),
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
    { value: 'opening', label: 'Opening Hook' },
    { value: 'arc', label: 'Arc Hook' },
    { value: 'chapter', label: 'Chapter Hook' },
  ];

  const hookStyleOptions = [
    { value: '', label: 'Not specified' },
    { value: 'suspense', label: 'Suspense' },
    { value: 'anticipation', label: 'Anticipation' },
    { value: 'emotion', label: 'Emotion' },
    { value: 'mystery', label: 'Mystery' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={closeForm}
      title={formMode === 'create' ? 'Create Hook' : 'Edit Hook'}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Type" required>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as FormData['type'] })}
            options={typeOptions}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Content" required>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Describe the hook"
            rows={4}
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Chapter ID">
          <Input
            type="number"
            value={formData.chapterId}
            onChange={(e) =>
              setFormData({
                ...formData,
                chapterId: e.target.value ? parseInt(e.target.value, 10) : '',
              })
            }
            placeholder="e.g., 1"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Hook Style">
          <Select
            value={formData.hookType}
            onChange={(e) =>
              setFormData({ ...formData, hookType: e.target.value as FormData['hookType'] })
            }
            options={hookStyleOptions}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Strength" helpText="0-100">
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.strength}
            onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
            placeholder="0-100"
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
