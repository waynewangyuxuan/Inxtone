/**
 * ArcList Component
 *
 * Displays story arcs using CrudTable
 */

import React from 'react';
import { CrudTable, Badge, type ColumnDef } from '../../components/ui';
import { useArcs, useDeleteArc } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { ArcForm } from './ArcForm';
import type { Arc, ArcStatus } from '@inxtone/core';

export function ArcList(): React.ReactElement {
  const { data: arcs, isLoading } = useArcs();
  const deleteArc = useDeleteArc();
  const { openForm, select } = useStoryBibleActions();

  const columns: ColumnDef<Arc>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <Badge variant={item.type === 'main' ? 'primary' : 'default'}>{item.type}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const status = item.status;
        const variants: Record<ArcStatus, 'muted' | 'warning' | 'success'> = {
          planned: 'muted',
          in_progress: 'warning',
          complete: 'success',
        };
        return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>;
      },
    },
    { key: 'progress', header: 'Progress', render: (item) => `${item.progress}%` },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Arc) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Arc): void => {
    deleteArc.mutate(item.id);
  };

  return (
    <>
      <CrudTable<Arc>
        title="Story Arcs"
        columns={columns}
        items={arcs ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No arcs defined yet. Add arcs to organize your story's major plot threads."
        getRowKey={(item) => item.id}
      />
      <ArcForm />
    </>
  );
}
