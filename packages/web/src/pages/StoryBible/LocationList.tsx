/**
 * LocationList Component
 *
 * Card grid with split layout: cards on left, detail panel on right.
 */

import React from 'react';
import { Button, Card, EmptyState, Badge } from '../../components/ui';
import { useLocations, useDeleteLocation } from '../../hooks';
import { useSelectedId, useStoryBibleActions } from '../../stores/useStoryBibleStore';
import { LocationDetail } from './LocationDetail';
import type { LocationId } from '@inxtone/core';
import styles from './shared.module.css';
import cardStyles from './LocationList.module.css';
import layoutStyles from './CharacterList.module.css';

export function LocationList(): React.ReactElement {
  const { data: locations, isLoading } = useLocations();
  const deleteLocation = useDeleteLocation();
  const selectedId = useSelectedId();
  const { select, openForm } = useStoryBibleActions();

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

  const handleSelect = (id: LocationId) => {
    select(id);
  };

  const handleDelete = (id: LocationId) => {
    deleteLocation.mutate(id);
    if (selectedId === id) {
      select(null);
    }
  };

  if (!locations || locations.length === 0) {
    return (
      <EmptyState
        title="No locations yet"
        description="Add locations to build your story's geography."
        action={{ label: 'Add Location', onClick: handleCreate }}
      />
    );
  }

  return (
    <div className={layoutStyles.layout}>
      <div className={layoutStyles.listPanel}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Locations ({locations.length})</h2>
          <Button onClick={handleCreate}>+ Add Location</Button>
        </div>

        <div className={`${styles.grid} ${styles.grid2}`}>
          {locations.map((loc) => (
            <Card
              key={loc.id}
              onClick={() => handleSelect(loc.id)}
              selected={selectedId === loc.id}
            >
              <div className={cardStyles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={cardStyles.cardName}>{loc.name}</h3>
                  {loc.type && <Badge variant="default">{loc.type}</Badge>}
                </div>
                {loc.significance && <p className={cardStyles.significance}>{loc.significance}</p>}
                {loc.atmosphere && <p className={cardStyles.atmosphere}>{loc.atmosphere}</p>}
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(loc.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedId && (
        <div className={layoutStyles.detailPanel}>
          <LocationDetail locationId={selectedId as LocationId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
