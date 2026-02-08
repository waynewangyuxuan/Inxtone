/**
 * RelationshipForm Component
 *
 * Modal form for creating and editing relationships
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms/Modal';
import { FormField } from '../../components/forms/FormField';
import { Select } from '../../components/forms/Select';
import { Textarea } from '../../components/forms/Textarea';
import {
  useRelationship,
  useCreateRelationship,
  useUpdateRelationship,
} from '../../hooks/useRelationships';
import { useCharacters } from '../../hooks/useCharacters';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CharacterId, RelationshipType, CreateRelationshipInput } from '@inxtone/core';

interface FormData {
  sourceId: CharacterId;
  targetId: CharacterId;
  type: RelationshipType | '';
  joinReason: string;
  independentGoal: string;
  disagreeScenarios: string;
  leaveScenarios: string;
  mcNeeds: string;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Select type...' },
  { value: 'companion', label: 'Companion' },
  { value: 'rival', label: 'Rival' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'confidant', label: 'Confidant' },
  { value: 'lover', label: 'Lover' },
];

const INITIAL_FORM_DATA: FormData = {
  sourceId: '',
  targetId: '',
  type: '',
  joinReason: '',
  independentGoal: '',
  disagreeScenarios: '',
  leaveScenarios: '',
  mcNeeds: '',
};

export function RelationshipForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { data: characters, isLoading: loadingCharacters } = useCharacters();
  const { data: existingRelationship, isLoading: loadingRelationship } = useRelationship(
    formMode === 'edit' && typeof selectedId === 'number' ? selectedId : null
  );
  const createMutation = useCreateRelationship();
  const updateMutation = useUpdateRelationship();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Character options for selects
  const characterOptions = [
    { value: '', label: 'Select character...' },
    ...(characters?.map((c) => ({ value: c.id, label: c.name })) ?? []),
  ];

  // Target options exclude selected source
  const targetOptions = characterOptions.filter((opt) => opt.value !== formData.sourceId);

  // Populate form when editing
  useEffect(() => {
    if (formMode === 'edit' && existingRelationship) {
      setFormData({
        sourceId: existingRelationship.sourceId,
        targetId: existingRelationship.targetId,
        type: existingRelationship.type,
        joinReason: existingRelationship.joinReason ?? '',
        independentGoal: existingRelationship.independentGoal ?? '',
        disagreeScenarios: existingRelationship.disagreeScenarios?.join('\n') ?? '',
        leaveScenarios: existingRelationship.leaveScenarios?.join('\n') ?? '',
        mcNeeds: existingRelationship.mcNeeds ?? '',
      });
    } else if (formMode === 'create') {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [formMode, existingRelationship]);

  // Reset form when closed
  useEffect(() => {
    if (!formMode) {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    }
  }, [formMode]);

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.sourceId) {
      newErrors.sourceId = 'Source character is required';
    }
    if (!formData.targetId) {
      newErrors.targetId = 'Target character is required';
    }
    if (formData.sourceId && formData.targetId && formData.sourceId === formData.targetId) {
      newErrors.targetId = 'Target must be different from source';
    }
    if (!formData.type) {
      newErrors.type = 'Relationship type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const disagreeArray = formData.disagreeScenarios
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const leaveArray = formData.leaveScenarios
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const input: CreateRelationshipInput = {
      sourceId: formData.sourceId,
      targetId: formData.targetId,
      type: formData.type as RelationshipType,
      ...(formData.joinReason && { joinReason: formData.joinReason.trim() }),
      ...(formData.independentGoal && { independentGoal: formData.independentGoal.trim() }),
      ...(disagreeArray.length > 0 && { disagreeScenarios: disagreeArray }),
      ...(leaveArray.length > 0 && { leaveScenarios: leaveArray }),
      ...(formData.mcNeeds && { mcNeeds: formData.mcNeeds.trim() }),
    };

    if (formMode === 'create') {
      createMutation.mutate(input, {
        onSuccess: () => {
          closeForm();
        },
      });
    } else if (formMode === 'edit' && typeof selectedId === 'number') {
      updateMutation.mutate(
        { id: selectedId, data: input },
        {
          onSuccess: () => {
            closeForm();
          },
        }
      );
    }
  };

  if (!formMode) return null;
  if (loadingCharacters || (formMode === 'edit' && loadingRelationship)) {
    return (
      <Modal isOpen title="Loading..." onClose={closeForm} size="lg">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Loading {formMode === 'edit' ? 'relationship' : 'characters'}...
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      title={formMode === 'create' ? 'Create Relationship' : 'Edit Relationship'}
      onClose={closeForm}
      onSubmit={handleSubmit}
      submitLabel={formMode === 'create' ? 'Create' : 'Save'}
      loading={isLoading}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Basic Info */}
        <FormField
          label="Source Character"
          required
          {...(errors.sourceId && { error: errors.sourceId })}
          htmlFor="rel-source"
        >
          <Select
            id="rel-source"
            options={characterOptions}
            value={formData.sourceId}
            onChange={handleChange('sourceId')}
            error={!!errors.sourceId}
            disabled={isLoading || formMode === 'edit'}
          />
        </FormField>

        <FormField
          label="Target Character"
          required
          {...(errors.targetId && { error: errors.targetId })}
          htmlFor="rel-target"
        >
          <Select
            id="rel-target"
            options={targetOptions}
            value={formData.targetId}
            onChange={handleChange('targetId')}
            error={!!errors.targetId}
            disabled={isLoading || formMode === 'edit'}
          />
        </FormField>

        <FormField
          label="Relationship Type"
          required
          {...(errors.type && { error: errors.type })}
          htmlFor="rel-type"
        >
          <Select
            id="rel-type"
            options={TYPE_OPTIONS}
            value={formData.type}
            onChange={handleChange('type')}
            error={!!errors.type}
            disabled={isLoading}
          />
        </FormField>

        {/* Wayne Principles Fields */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
          <h3
            style={{
              marginBottom: '1rem',
              fontSize: 'var(--text-md)',
              color: 'var(--color-accent)',
            }}
          >
            Wayne Principles (R1 Check)
          </h3>

          <FormField
            label="Why Join?"
            htmlFor="rel-join"
            hint="Why does target join/follow source? What benefit do they get?"
          >
            <Textarea
              id="rel-join"
              value={formData.joinReason}
              onChange={handleChange('joinReason')}
              placeholder="What does the target character gain from this relationship?"
              rows={2}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Independent Goal"
            htmlFor="rel-goal"
            hint="Does target have their own goal separate from source?"
          >
            <Textarea
              id="rel-goal"
              value={formData.independentGoal}
              onChange={handleChange('independentGoal')}
              placeholder="What does the target want independently?"
              rows={2}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Disagree Scenarios"
            htmlFor="rel-disagree"
            hint="When would target disagree with source? One per line."
          >
            <Textarea
              id="rel-disagree"
              value={formData.disagreeScenarios}
              onChange={handleChange('disagreeScenarios')}
              placeholder="Source wants to kill innocent\nTarget's family is threatened\n..."
              rows={3}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Leave Scenarios"
            htmlFor="rel-leave"
            hint="When would target leave/betray source? One per line."
          >
            <Textarea
              id="rel-leave"
              value={formData.leaveScenarios}
              onChange={handleChange('leaveScenarios')}
              placeholder="Source crosses moral line\nBetter opportunity appears\n..."
              rows={3}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="What MC Needs"
            htmlFor="rel-mc"
            hint="If source is MC: what unique value does target provide?"
          >
            <Textarea
              id="rel-mc"
              value={formData.mcNeeds}
              onChange={handleChange('mcNeeds')}
              placeholder="Skills, knowledge, emotional support, connections..."
              rows={2}
              disabled={isLoading}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
