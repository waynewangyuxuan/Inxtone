/**
 * FactionList Component
 *
 * Displays factions using CrudTable
 */

import React from 'react';
import { CrudTable, Badge, type ColumnDef } from '../../components/ui';
import { useFactions, useDeleteFaction } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { FactionForm } from './FactionForm';
import type { Faction } from '@inxtone/core';

export function FactionList(): React.ReactElement {
  const { data: factions, isLoading } = useFactions();
  const deleteFaction = useDeleteFaction();
  const { openForm, select } = useStoryBibleActions();

  const columns: ColumnDef<Faction>[] = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (item) => item.type ?? '—' },
    { key: 'status', header: 'Status', render: (item) => item.status ?? '—' },
    {
      key: 'stanceToMC',
      header: 'Stance',
      render: (item) => {
        if (!item.stanceToMC) return '—';
        const variants: Record<
          NonNullable<Faction['stanceToMC']>,
          'success' | 'default' | 'danger'
        > = {
          friendly: 'success',
          neutral: 'default',
          hostile: 'danger',
        };
        return <Badge variant={variants[item.stanceToMC]}>{item.stanceToMC}</Badge>;
      },
    },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Faction) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Faction): void => {
    deleteFaction.mutate(item.id);
  };

  return (
    <>
      <CrudTable<Faction>
        title="Factions"
        columns={columns}
        items={factions ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No factions defined yet. Add factions to create political intrigue and alliances."
        getRowKey={(item) => item.id}
      />
      <FactionForm />
    </>
  );
}
