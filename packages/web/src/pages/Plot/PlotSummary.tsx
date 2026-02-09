/**
 * PlotSummary — Horizontal arc timeline bar with stats
 *
 * Shows proportionally-sized arc segments and key plot statistics.
 * Displayed above the tab bar on the Plot page.
 */

import React from 'react';
import { useArcs, useChapters, useForeshadowing } from '../../hooks';
import type { Arc } from '@inxtone/core';
import styles from './PlotSummary.module.css';

export function PlotSummary(): React.ReactElement | null {
  const { data: arcs } = useArcs();
  const { data: chapters } = useChapters();
  const { data: foreshadowing } = useForeshadowing();

  if (!arcs || arcs.length === 0) return null;

  const totalChapters = chapters?.length ?? 0;
  const activeArcs = arcs.filter((a) => a.status === 'in_progress').length;
  const activeForeshadowing = foreshadowing?.filter((f) => f.status === 'active').length ?? 0;

  // Compute proportional widths based on chapter ranges or equal distribution
  const segments = computeSegments(arcs, totalChapters);

  return (
    <div className={styles.container}>
      {/* Arc Track */}
      <div className={styles.track}>
        {segments.map((seg) => (
          <div
            key={seg.id}
            className={`${styles.segment} ${styles[seg.status]}`}
            style={{ flex: seg.weight }}
            title={`${seg.name} (${seg.status.replace('_', ' ')})`}
          >
            {seg.name}
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className={styles.stats}>
        <span className={styles.stat}>
          <span className={styles.statHighlight}>{totalChapters}</span> chapters
        </span>
        <span className={styles.stat}>
          <span className={styles.statHighlight}>{activeArcs}</span> arcs active
        </span>
        <span className={styles.stat}>
          <span className={styles.statHighlight}>{activeForeshadowing}</span> foreshadowing planted
        </span>
      </div>
    </div>
  );
}

interface Segment {
  id: string;
  name: string;
  status: string;
  weight: number;
}

function computeSegments(arcs: Arc[], totalChapters: number): Segment[] {
  return arcs.map((arc) => {
    let weight = 1;
    if (arc.chapterStart != null && arc.chapterEnd != null) {
      weight = Math.max(1, arc.chapterEnd - arc.chapterStart + 1);
    } else if (totalChapters > 0 && arc.progress > 0) {
      weight = Math.max(1, Math.round((arc.progress / 100) * totalChapters));
    }
    return {
      id: arc.id,
      name: arc.name,
      status: arc.status,
      weight,
    };
  });
}
