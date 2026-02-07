/**
 * ForeshadowingList Component
 *
 * Displays foreshadowing elements using CrudTable
 */

import React from 'react';
import { CrudTable, Badge, type ColumnDef } from '../../components/ui';
import { useForeshadowing, useDeleteForeshadowing } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ForeshadowingForm } from './ForeshadowingForm';
import type { Foreshadowing, ForeshadowingStatus } from '@inxtone/core';

export function ForeshadowingList(): React.ReactElement {
  const { data: items, isLoading } = useForeshadowing();
  const deleteForeshadowing = useDeleteForeshadowing();
  const { openForm } = useStoryBibleActions();

  const columns: ColumnDef<Foreshadowing>[] = [
    {
      key: 'content',
      header: 'Content',
      render: (item) => {
        const text = item.content;
        return text.length > 50 ? `${text.slice(0, 50)}...` : text;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const status = item.status;
        const variants: Record<ForeshadowingStatus, 'primary' | 'success' | 'muted'> = {
          active: 'primary',
          resolved: 'success',
          abandoned: 'muted',
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      },
    },
    { key: 'term', header: 'Term', render: (item) => item.term ?? '—' },
    {
      key: 'plantedChapter',
      header: 'Planted',
      render: (item) => (item.plantedChapter ? `Ch. ${item.plantedChapter}` : '—'),
    },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Foreshadowing) => {
    // Edit functionality would open a form modal
    console.log('Edit foreshadowing:', item);
  };

  const handleDelete = (item: Foreshadowing): void => {
    deleteForeshadowing.mutate(item.id);
  };

  return (
    <>
      <CrudTable<Foreshadowing>
        title="Foreshadowing"
        columns={columns}
        items={items ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No foreshadowing elements yet. Add hints and setup to pay off later in your story."
        getRowKey={(item) => item.id}
      />
      <ForeshadowingForm />
    </>
  );
}
