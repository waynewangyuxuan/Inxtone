/**
 * LocationList Component
 *
 * Card grid display for locations with name, type, significance, atmosphere.
 */

import React from 'react';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useLocations, useDeleteLocation } from '../../hooks';
import { useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { LocationForm } from './LocationForm';
import type { Location } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './LocationList.module.css';

export function LocationList(): React.ReactElement {
  const { data: locations, isLoading } = useLocations();
  const deleteLocation = useDeleteLocation();
  const { openForm, select } = useStoryBibleActions();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading locations...</span>
      </div>
    );
  }

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

  if (!locations || locations.length === 0) {
    return (
      <>
        <EmptyState
          title="No locations yet"
          description="Add locations to build your story's geography."
          action={{ label: 'Add Location', onClick: handleCreate }}
        />
        <LocationForm />
      </>
    );
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Locations ({locations.length})</h2>
        <Button onClick={handleCreate}>+ Add Location</Button>
      </div>

      <div className={`${styles.grid} ${styles.grid2}`}>
        {locations.map((loc) => (
          <Card key={loc.id}>
            <div className={cardStyles.card}>
              <div className={styles.cardHeader}>
                <h3 className={cardStyles.cardName}>{loc.name}</h3>
                {loc.type && <Badge variant="default">{loc.type}</Badge>}
              </div>
              {loc.significance && <p className={cardStyles.significance}>{loc.significance}</p>}
              {loc.atmosphere && <p className={cardStyles.atmosphere}>{loc.atmosphere}</p>}
              <div className={styles.cardActions}>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(loc)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(loc)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <LocationForm />
    </>
  );
}
