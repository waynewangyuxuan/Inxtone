/**
 * PromptPresets — horizontal scrollable chip bar
 *
 * Click a chip to append its instruction to the prompt textarea.
 */

import React from 'react';
import { PROMPT_PRESETS, PRESET_CATEGORIES } from '@inxtone/core';
import type { PresetCategory } from '@inxtone/core';
import styles from './PromptPresets.module.css';

interface PromptPresetsProps {
  onSelect: (instruction: string) => void;
}

export function PromptPresets({ onSelect }: PromptPresetsProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = React.useState<PresetCategory | null>(null);

  const filtered = activeCategory
    ? PROMPT_PRESETS.filter((p) => p.category === activeCategory)
    : PROMPT_PRESETS;

  const categories = Object.entries(PRESET_CATEGORIES) as [PresetCategory, string][];

  return (
    <div className={styles.wrapper}>
      <div className={styles.categories}>
        <button
          className={`${styles.catChip} ${activeCategory === null ? styles.catChipActive : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            className={`${styles.catChip} ${activeCategory === key ? styles.catChipActive : ''}`}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.chips}>
        {filtered.map((preset) => (
          <button
            key={preset.id}
            className={styles.chip}
            onClick={() => onSelect(preset.instruction)}
            title={preset.instruction}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
