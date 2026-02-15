/**
 * CharacterForm Component
 *
 * Modal form for creating and editing characters
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Select } from '../../components/forms/Select';
import { Textarea } from '../../components/forms/Textarea';
import { useCharacter, useCreateCharacter, useUpdateCharacter } from '../../hooks/useCharacters';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type {
  CharacterRole,
  ConflictType,
  CharacterTemplate,
  CreateCharacterInput,
} from '@inxtone/core';

interface FormData {
  name: string;
  role: CharacterRole;
  appearance: string;
  motivationSurface: string;
  motivationHidden: string;
  motivationCore: string;
  conflictType: ConflictType | '';
  template: CharacterTemplate | '';
  voiceSamples: string;
}

const ROLE_OPTIONS = [
  { value: 'main', label: 'Main Character' },
  { value: 'supporting', label: 'Supporting' },
  { value: 'antagonist', label: 'Antagonist' },
  { value: 'mentioned', label: 'Mentioned' },
];

const CONFLICT_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'desire_vs_morality', label: 'Desire vs Morality' },
  { value: 'ideal_vs_reality', label: 'Ideal vs Reality' },
  { value: 'self_vs_society', label: 'Self vs Society' },
  { value: 'love_vs_duty', label: 'Love vs Duty' },
  { value: 'survival_vs_dignity', label: 'Survival vs Dignity' },
];

const TEMPLATE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'avenger', label: 'Avenger' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'seeker', label: 'Seeker' },
  { value: 'rebel', label: 'Rebel' },
  { value: 'redeemer', label: 'Redeemer' },
  { value: 'bystander', label: 'Bystander' },
  { value: 'martyr', label: 'Martyr' },
  { value: 'fallen', label: 'Fallen' },
];

const INITIAL_FORM_DATA: FormData = {
  name: '',
  role: 'supporting',
  appearance: '',
  motivationSurface: '',
  motivationHidden: '',
  motivationCore: '',
  conflictType: '',
  template: '',
  voiceSamples: '',
};

export function CharacterForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: existingCharacter, isLoading: loadingCharacter } = useCharacter(
    formMode === 'edit' ? (selectedId as string) : null
  );
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Populate form when editing
  useEffect(() => {
    if (formMode === 'edit' && existingCharacter) {
      setFormData({
        name: existingCharacter.name,
        role: existingCharacter.role,
        appearance: existingCharacter.appearance ?? '',
        motivationSurface: existingCharacter.motivation?.surface ?? '',
        motivationHidden: existingCharacter.motivation?.hidden ?? '',
        motivationCore: existingCharacter.motivation?.core ?? '',
        conflictType: existingCharacter.conflictType ?? '',
        template: existingCharacter.template ?? '',
        voiceSamples: existingCharacter.voiceSamples?.join('\n') ?? '',
      });
    } else if (formMode === 'create') {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [formMode, existingCharacter]);

  // Reset form when closed
  useEffect(() => {
    if (!formMode) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
  }, [formMode]);

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const voiceSamplesArray = formData.voiceSamples
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const input: CreateCharacterInput = {
      name: formData.name.trim(),
      role: formData.role,
      ...(formData.appearance && { appearance: formData.appearance.trim() }),
      ...(formData.motivationSurface && {
        motivation: {
          surface: formData.motivationSurface.trim(),
          ...(formData.motivationHidden && { hidden: formData.motivationHidden.trim() }),
          ...(formData.motivationCore && { core: formData.motivationCore.trim() }),
        },
      }),
      ...(formData.conflictType && { conflictType: formData.conflictType }),
      ...(formData.template && { template: formData.template }),
      ...(voiceSamplesArray.length > 0 && { voiceSamples: voiceSamplesArray }),
    };

    if (formMode === 'create') {
      createMutation.mutate(input, {
        onSuccess: () => {
          closeForm();
        },
      });
    } else if (formMode === 'edit' && selectedId) {
      updateMutation.mutate(
        { id: selectedId as string, data: input },
        {
          onSuccess: () => {
            closeForm();
          },
        }
      );
    }
  };

  if (!formMode) return null;
  if (formMode === 'edit' && loadingCharacter) {
    return (
      <Modal isOpen title="Loading..." onClose={closeForm} size="lg">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading character data...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      title={formMode === 'create' ? 'Create Character' : 'Edit Character'}
      onClose={closeForm}
      onSubmit={handleSubmit}
      submitLabel={formMode === 'create' ? 'Create' : 'Save'}
      loading={isLoading}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Basic Info */}
        <FormField
          label="Name"
          required
          {...(errors.name && { error: errors.name })}
          htmlFor="char-name"
        >
          <Input
            id="char-name"
            value={formData.name}
            onChange={handleChange('name')}
            placeholder="Character name"
            error={!!errors.name}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Role" required htmlFor="char-role">
          <Select
            id="char-role"
            options={ROLE_OPTIONS}
            value={formData.role}
            onChange={handleChange('role')}
            disabled={isLoading}
          />
        </FormField>

        <FormField
          label="Appearance"
          htmlFor="char-appearance"
          hint="Physical description, clothing, distinctive features"
        >
          <Textarea
            id="char-appearance"
            value={formData.appearance}
            onChange={handleChange('appearance')}
            placeholder="Describe the character's appearance..."
            rows={3}
            disabled={isLoading}
          />
        </FormField>

        {/* Motivation */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h3
            style={{
              marginBottom: '1rem',
              fontSize: 'var(--text-md)',
              color: 'var(--color-accent)',
            }}
          >
            Motivation Layers
          </h3>

          <FormField
            label="Surface Goal"
            htmlFor="char-mot-surface"
            hint="What the character says they want"
          >
            <Textarea
              id="char-mot-surface"
              value={formData.motivationSurface}
              onChange={handleChange('motivationSurface')}
              placeholder="Visible, stated goal..."
              rows={2}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Hidden Motivation"
            htmlFor="char-mot-hidden"
            hint="Psychological driver they may not admit"
          >
            <Textarea
              id="char-mot-hidden"
              value={formData.motivationHidden}
              onChange={handleChange('motivationHidden')}
              placeholder="Hidden psychological driver..."
              rows={2}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Core Need" htmlFor="char-mot-core" hint="Unconscious, deep-seated need">
            <Textarea
              id="char-mot-core"
              value={formData.motivationCore}
              onChange={handleChange('motivationCore')}
              placeholder="Unconscious core need..."
              rows={2}
              disabled={isLoading}
            />
          </FormField>
        </div>

        {/* Character Design */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h3
            style={{
              marginBottom: '1rem',
              fontSize: 'var(--text-md)',
              color: 'var(--color-accent)',
            }}
          >
            Character Design
          </h3>

          <FormField label="Conflict Type" htmlFor="char-conflict">
            <Select
              id="char-conflict"
              options={CONFLICT_OPTIONS}
              value={formData.conflictType}
              onChange={handleChange('conflictType')}
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Template" htmlFor="char-template">
            <Select
              id="char-template"
              options={TEMPLATE_OPTIONS}
              value={formData.template}
              onChange={handleChange('template')}
              disabled={isLoading}
            />
          </FormField>
        </div>

        {/* Voice Samples */}
        <FormField
          label="Voice Samples"
          htmlFor="char-voice"
          hint="One sample per line. Examples of how this character speaks."
        >
          <Textarea
            id="char-voice"
            value={formData.voiceSamples}
            onChange={handleChange('voiceSamples')}
            placeholder={
              '"I never back down from a fight."\n"Family comes first, always."\n"...what?"'
            }
            rows={4}
            disabled={isLoading}
          />
        </FormField>
      </div>
    </Modal>
  );
}
