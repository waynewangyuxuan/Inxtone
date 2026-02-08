/**
 * HookList Component
 *
 * Displays narrative hooks using CrudTable
 */

import React from 'react';
import { CrudTable, Badge, type ColumnDef } from '../../components/ui';
import { useHooks, useDeleteHook } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { HookForm } from './HookForm';
import type { Hook, HookType } from '@inxtone/core';

export function HookList(): React.ReactElement {
  const { data: hooks, isLoading } = useHooks();
  const deleteHook = useDeleteHook();
  const { openForm, select } = useStoryBibleActions();

  const columns: ColumnDef<Hook>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (item) => {
        const variants: Record<HookType, 'primary' | 'warning' | 'default'> = {
          opening: 'primary',
          arc: 'warning',
          chapter: 'default',
        };
        return <Badge variant={variants[item.type]}>{item.type}</Badge>;
      },
    },
    {
      key: 'content',
      header: 'Content',
      render: (item) => {
        const text = item.content;
        return text.length > 60 ? `${text.slice(0, 60)}...` : text;
      },
    },
    { key: 'hookType', header: 'Style', render: (item) => item.hookType ?? '—' },
    {
      key: 'strength',
      header: 'Strength',
      render: (item) => (item.strength !== undefined ? `${item.strength}%` : '—'),
    },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Hook) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Hook): void => {
    deleteHook.mutate(item.id);
  };

  return (
    <>
      <CrudTable<Hook>
        title="Narrative Hooks"
        columns={columns}
        items={hooks ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No hooks defined yet. Add hooks to keep readers engaged with questions, mysteries, and promises."
        getRowKey={(item) => item.id}
      />
      <HookForm />
    </>
  );
}
