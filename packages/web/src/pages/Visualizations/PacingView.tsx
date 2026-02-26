/**
 * PacingView
 *
 * Word count bar chart per chapter + emotion/tension overlays using recharts.
 * Data source: /chapters API.
 */

import React, { useMemo, useState } from 'react';
import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import { useChapters } from '../../hooks/useChapters';
import { useArcs } from '../../hooks/useArcs';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { EmotionCurve, TensionLevel } from '@inxtone/core';
import styles from './PacingView.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOTION_VALUES: Record<EmotionCurve, number> = {
  low_to_high: 75,
  high_to_low: 25,
  wave: 50,
  stable: 50,
};

const TENSION_VALUES: Record<TensionLevel, number> = {
  low: 20,
  medium: 50,
  high: 90,
};

const GOLDEN_CHAPTER_THRESHOLD = 3000; // words

type ViewMode = 'words' | 'emotion' | 'combined';

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTitle}>Ch. {label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span className={styles.tooltipLabel}>{entry.name}:</span>
          <span className={styles.tooltipValue}>{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PacingView(): React.ReactElement {
  const { data: chapters = [], isLoading } = useChapters();
  const { data: arcs = [] } = useArcs();

  const [viewMode, setViewMode] = useState<ViewMode>('combined');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  // Sort chapters by sortOrder
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.sortOrder - b.sortOrder),
    [chapters]
  );

  // Build chart data
  const chartData = useMemo(() => {
    return sortedChapters.map((ch) => ({
      id: ch.id,
      label: ch.title ? `${ch.id}: ${ch.title}` : `${ch.id}`,
      words: ch.wordCount,
      emotion: ch.emotionCurve ? EMOTION_VALUES[ch.emotionCurve] : null,
      tension: ch.tension ? TENSION_VALUES[ch.tension] : null,
      isGolden: ch.wordCount >= GOLDEN_CHAPTER_THRESHOLD,
      status: ch.status,
    }));
  }, [sortedChapters]);

  // Arc boundaries as chapter IDs
  const arcBoundaries = useMemo(() => {
    return arcs
      .filter((a) => a.chapterStart != null)
      .map((a) => ({
        chapterId: a.chapterStart!,
        name: a.name,
      }));
  }, [arcs]);

  // Stats
  const stats = useMemo(() => {
    const withWords = sortedChapters.filter((c) => c.wordCount > 0);
    const total = withWords.reduce((s, c) => s + c.wordCount, 0);
    const avg = withWords.length ? Math.round(total / withWords.length) : 0;
    const max = Math.max(...withWords.map((c) => c.wordCount), 0);
    const golden = withWords.filter((c) => c.wordCount >= GOLDEN_CHAPTER_THRESHOLD).length;
    return { total, avg, max, golden };
  }, [sortedChapters]);

  if (isLoading) return <LoadingSpinner text="Loading chapters..." />;
  if (!chapters.length) {
    return (
      <EmptyState
        title="No chapters yet"
        description="Start writing chapters to see pacing visualizations."
      />
    );
  }

  const VIEW_MODES: Array<{ value: ViewMode; label: string }> = [
    { value: 'words', label: 'Word Count' },
    { value: 'emotion', label: 'Emotion / Tension' },
    { value: 'combined', label: 'Combined' },
  ];

  return (
    <div className={styles.container}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          {VIEW_MODES.map((m) => (
            <button
              key={m.value}
              className={`${styles.viewBtn} ${viewMode === m.value ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <span className={styles.stat}>
            <span className={styles.statValue}>{stats.total.toLocaleString()}</span>
            <span className={styles.statLabel}>total words</span>
          </span>
          <span className={styles.statDivider} />
          <span className={styles.stat}>
            <span className={styles.statValue}>{stats.avg.toLocaleString()}</span>
            <span className={styles.statLabel}>avg / chapter</span>
          </span>
          <span className={styles.statDivider} />
          <span className={styles.stat}>
            <span className={styles.statValue}>{stats.golden}</span>
            <span className={styles.statLabel}>golden chapters</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartWrapper}>
        {(viewMode === 'words' || viewMode === 'combined') && (
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>Word Count per Chapter</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="id"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  label={{
                    value: 'Chapter',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: 'var(--color-text-secondary)',
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={GOLDEN_CHAPTER_THRESHOLD}
                  stroke="var(--color-accent)"
                  strokeDasharray="5 3"
                  label={{
                    value: 'Golden',
                    position: 'right',
                    fontSize: 10,
                    fill: 'var(--color-accent)',
                  }}
                />
                {/* Arc boundaries */}
                {arcBoundaries.map((b) => (
                  <ReferenceLine
                    key={b.chapterId}
                    x={b.chapterId}
                    stroke="var(--color-text-secondary)"
                    strokeDasharray="3 3"
                    opacity={0.4}
                    label={{
                      value: b.name,
                      position: 'top',
                      fontSize: 9,
                      fill: 'var(--color-text-secondary)',
                    }}
                  />
                ))}
                <Bar
                  dataKey="words"
                  name="Words"
                  fill="var(--color-accent)"
                  opacity={0.7}
                  radius={[2, 2, 0, 0]}
                  onClick={(data) => setSelectedChapterId(Number(data.id))}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {(viewMode === 'emotion' || viewMode === 'combined') && (
          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>Emotion & Tension Curve</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="id"
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  label={{
                    value: 'Chapter',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 11,
                    fill: 'var(--color-text-secondary)',
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} />
                <Line
                  type="monotone"
                  dataKey="emotion"
                  name="Emotion"
                  stroke="#6b8cba"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6b8cba' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="tension"
                  name="Tension"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  connectNulls
                  strokeDasharray="5 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chapter list */}
      <div className={styles.chapterList}>
        {sortedChapters.map((ch) => (
          <div
            key={ch.id}
            className={`${styles.chapterRow} ${selectedChapterId === ch.id ? styles.chapterRowSelected : ''}`}
            onClick={() => setSelectedChapterId((prev) => (prev === ch.id ? null : ch.id))}
          >
            <span className={styles.chapterNum}>Ch. {ch.id}</span>
            <span className={styles.chapterTitle}>{ch.title ?? 'Untitled'}</span>
            <span className={`${styles.chapterStatus} ${styles[`status_${ch.status}`]}`}>
              {ch.status}
            </span>
            <span className={styles.chapterWords}>{ch.wordCount.toLocaleString()} w</span>
            {ch.wordCount >= GOLDEN_CHAPTER_THRESHOLD && (
              <span className={styles.goldenBadge} title="Golden chapter">
                ★
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
