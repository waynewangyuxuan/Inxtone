/**
 * LocationList Component
 *
 * Displays locations using CrudTable
 */

import React from 'react';
import { CrudTable, type ColumnDef } from '../../components/ui';
import { useLocations, useDeleteLocation } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { LocationForm } from './LocationForm';
import type { Location } from '@inxtone/core';

export function LocationList(): React.ReactElement {
  const { data: locations, isLoading } = useLocations();
  const deleteLocation = useDeleteLocation();
  const { openForm, select } = useStoryBibleActions();

  const columns: ColumnDef<Location>[] = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (item) => item.type ?? '—' },
    {
      key: 'significance',
      header: 'Significance',
      render: (item) => {
        const text = item.significance;
        if (!text) return '—';
        return text.length > 60 ? `${text.slice(0, 60)}...` : text;
      },
    },
  ];

  const handleCreate = () => {
    openForm('create');
  };

  const handleEdit = (item: Location) => {
    select(item.id);
    openForm('edit');
  };

  const handleDelete = (item: Location): void => {
    deleteLocation.mutate(item.id);
  };

  return (
    <>
      <CrudTable<Location>
        title="Locations"
        columns={columns}
        items={locations ?? []}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No locations defined yet. Add locations to build your story's geography."
        getRowKey={(item) => item.id}
      />
      <LocationForm />
    </>
  );
}
