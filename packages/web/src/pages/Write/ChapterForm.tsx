/**
 * ChapterForm — create/edit chapter modal
 *
 * Follows the CharacterForm pattern: modal with form fields,
 * create/edit modes, mutation hooks.
 */

import React from 'react';
import { Modal, FormField, Input, Select } from '../../components/forms';
import { useCreateChapter, useUpdateChapter, useChapterWithContent, useArcs } from '../../hooks';
import {
  useChapterFormMode,
  useEditingChapterId,
  useEditorActions,
} from '../../stores/useEditorStore';
import type { ChapterStatus } from '@inxtone/core';

const statusOptions = [
  { value: 'outline', label: 'Outline' },
  { value: 'draft', label: 'Draft' },
  { value: 'revision', label: 'Revision' },
  { value: 'done', label: 'Done' },
];

interface FormData {
  title: string;
  arcId: string;
  status: ChapterStatus;
}

const INITIAL: FormData = {
  title: '',
  arcId: '',
  status: 'outline',
};

export function ChapterForm(): React.ReactElement | null {
  const formMode = useChapterFormMode();
  const editingId = useEditingChapterId();
  const { closeChapterForm, selectChapter } = useEditorActions();

  const { data: existing } = useChapterWithContent(formMode === 'edit' ? editingId : null);
  const { data: arcs } = useArcs();
  const createMutation = useCreateChapter();
  const updateMutation = useUpdateChapter();

  const [formData, setFormData] = React.useState<FormData>(INITIAL);

  React.useEffect(() => {
    if (formMode === 'edit' && existing) {
      setFormData({
        title: existing.title ?? '',
        arcId: existing.arcId ?? '',
        status: existing.status,
      });
    } else if (formMode === 'create') {
      setFormData(INITIAL);
    }
  }, [formMode, existing]);

  if (formMode === null) return null;

  const arcOptions = [
    { value: '', label: 'No Arc' },
    ...(arcs ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = () => {
    if (formMode === 'create') {
      const input: Record<string, unknown> = {};
      if (formData.title.trim()) input.title = formData.title.trim();
      if (formData.arcId) input.arcId = formData.arcId;
      if (formData.status !== 'outline') input.status = formData.status;

      createMutation.mutate(input as Parameters<typeof createMutation.mutate>[0], {
        onSuccess: (chapter) => {
          closeChapterForm();
          selectChapter(chapter.id);
        },
      });
    } else if (formMode === 'edit' && editingId != null) {
      const data: Record<string, unknown> = {};
      if (formData.title.trim()) data.title = formData.title.trim();
      data.arcId = formData.arcId || null;
      data.status = formData.status;

      updateMutation.mutate(
        {
          id: editingId,
          data: data as Parameters<typeof updateMutation.mutate>[0]['data'],
        },
        { onSuccess: () => closeChapterForm() }
      );
    }
  };

  return (
    <Modal
      isOpen
      title={formMode === 'create' ? 'New Chapter' : 'Edit Chapter'}
      onClose={closeChapterForm}
      onSubmit={handleSubmit}
      submitLabel={formMode === 'create' ? 'Create' : 'Save'}
      loading={createMutation.isPending || updateMutation.isPending}
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <FormField label="Title" htmlFor="ch-title">
          <Input
            id="ch-title"
            value={formData.title}
            onChange={handleChange('title')}
            placeholder="Chapter title (optional)"
          />
        </FormField>

        <FormField label="Arc" htmlFor="ch-arc">
          <Select
            id="ch-arc"
            options={arcOptions}
            value={formData.arcId}
            onChange={handleChange('arcId')}
          />
        </FormField>

        <FormField label="Status" htmlFor="ch-status">
          <Select
            id="ch-status"
            options={statusOptions}
            value={formData.status}
            onChange={handleChange('status')}
          />
        </FormField>
      </div>
    </Modal>
  );
}
