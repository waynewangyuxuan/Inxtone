/**
 * FactionForm Component
 *
 * Modal form for creating and editing factions
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms';
import { Input, Select, FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useCreateFaction, useUpdateFaction, useFaction, useCharacters } from '../../hooks';
import { useFormMode, useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import type { CreateFactionInput, CharacterId } from '@inxtone/core';

interface FormData {
  name: string;
  type: string;
  status: string;
  leaderId: CharacterId | ''; // eslint-disable-line @typescript-eslint/no-redundant-type-constituents
  stanceToMC: 'friendly' | 'neutral' | 'hostile' | '';
  goals: string; // Comma-separated, will parse to array
}

export function FactionForm(): React.ReactElement | null {
  const formMode = useFormMode();
  const selectedId = useSelectedId();
  const { closeForm } = useStoryBibleActions();

  const { data: existingFaction } = useFaction(formMode === 'edit' ? (selectedId as string) : null);
  const { data: characters = [] } = useCharacters();
  const createMutation = useCreateFaction();
  const updateMutation = useUpdateFaction();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    status: '',
    leaderId: '',
    stanceToMC: '',
    goals: '',
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (formMode === 'edit' && existingFaction) {
      setFormData({
        name: existingFaction.name,
        type: existingFaction.type ?? '',
        status: existingFaction.status ?? '',
        leaderId: existingFaction.leaderId ?? '',
        stanceToMC: existingFaction.stanceToMC ?? '',
        goals: existingFaction.goals?.join(', ') ?? '',
      });
    } else if (formMode === 'create') {
      setFormData({
        name: '',
        type: '',
        status: '',
        leaderId: '',
        stanceToMC: '',
        goals: '',
      });
    }
  }, [formMode, existingFaction]);

  if (!formMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a faction name');
      return;
    }

    const goalsArray = formData.goals
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);

    const input: CreateFactionInput = {
      name: formData.name.trim(),
      ...(formData.type.trim() && { type: formData.type.trim() }),
      ...(formData.status.trim() && { status: formData.status.trim() }),
      ...(formData.leaderId && { leaderId: formData.leaderId }),
      ...(formData.stanceToMC && { stanceToMC: formData.stanceToMC }),
      ...(goalsArray.length > 0 && { goals: goalsArray }),
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

  const characterOptions = [
    { value: '', label: 'None' },
    ...(characters.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const stanceOptions = [
    { value: '', label: 'Not specified' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'hostile', label: 'Hostile' },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={closeForm}
      title={formMode === 'create' ? 'Create Faction' : 'Edit Faction'}
    >
      <form onSubmit={handleSubmit}>
        <FormField label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter faction name"
            disabled={isLoading}
            autoFocus
          />
        </FormField>

        <FormField label="Type">
          <Input
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., Guild, Kingdom, Sect"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Status">
          <Input
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            placeholder="e.g., Active, Declining, Rising"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Leader">
          <Select
            value={formData.leaderId}
            onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
            options={characterOptions}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Stance to MC">
          <Select
            value={formData.stanceToMC}
            onChange={(e) =>
              setFormData({ ...formData, stanceToMC: e.target.value as FormData['stanceToMC'] })
            }
            options={stanceOptions}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Goals" helpText="Comma-separated list">
          <Input
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            placeholder="e.g., Expand territory, Gain power"
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
