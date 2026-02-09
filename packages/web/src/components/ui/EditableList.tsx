/**
 * EditableList Component
 *
 * Editable array of strings. Each item is click-to-edit.
 * "+" to add, "×" on hover to remove.
 */

import React, { useState } from 'react';
import { EditableField } from './EditableField';
import { Button } from './Button';
import styles from './EditableList.module.css';

export interface EditableListProps {
  items: string[];
  onSave: (items: string[]) => void;
  label?: string;
  addLabel?: string;
  ordered?: boolean;
  className?: string;
}

export function EditableList({
  items,
  onSave,
  label,
  addLabel = 'Add item',
  ordered,
  className,
}: EditableListProps): React.ReactElement {
  const [addingNew, setAddingNew] = useState(false);

  const handleItemSave = (index: number, value: string) => {
    if (!value) {
      // Empty = remove
      const next = items.filter((_, i) => i !== index);
      onSave(next);
    } else {
      const next = [...items];
      next[index] = value;
      onSave(next);
    }
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onSave(next);
  };

  const handleAdd = (value: string) => {
    setAddingNew(false);
    if (value.trim()) {
      onSave([...items, value.trim()]);
    }
  };

  const ListTag = ordered ? 'ol' : 'ul';

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      {items.length > 0 && (
        <ListTag className={styles.list}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <div className={styles.itemContent}>
                <EditableField
                  value={item}
                  onSave={(v) => handleItemSave(i, v)}
                  as="input"
                  placeholder="Edit item..."
                />
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(i)}
                title="Remove"
                type="button"
              >
                &times;
              </button>
            </li>
          ))}
        </ListTag>
      )}
      {addingNew ? (
        <div className={styles.addRow}>
          <EditableField
            value=""
            onSave={handleAdd}
            as="input"
            placeholder="Type and press Enter..."
          />
          <Button variant="ghost" size="sm" onClick={() => setAddingNew(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setAddingNew(true)}>
          + {addLabel}
        </Button>
      )}
    </div>
  );
}
