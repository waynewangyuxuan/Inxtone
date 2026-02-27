/**
 * TimelineView
 *
 * Chronological display of story timeline events.
 * Data source: /timeline, /arcs, /characters APIs.
 *
 * Note: TimelineEvent has no arcId field. Arc filtering works indirectly via
 * arc.characterArcs — events whose relatedCharacters overlap with the arc's
 * character list will be shown when that arc is selected.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeline } from '../../hooks/useTimeline';
import { useArcs } from '../../hooks/useArcs';
import { useCharacters } from '../../hooks/useCharacters';
import { useStoryBibleStore } from '../../stores/useStoryBibleStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { CharacterId } from '@inxtone/core';
import styles from './TimelineView.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Undated';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // non-ISO string (e.g. "百年前") — display as-is
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ARC_COLORS = ['var(--color-accent)', '#6b8cba', '#4ade80', '#a78bfa', '#f59e0b', '#f472b6'];

// ─── Component ───────────────────────────────────────────────────────────────

export function TimelineView(): React.ReactElement {
  const { data: events = [], isLoading: eventsLoading } = useTimeline();
  const navigate = useNavigate();
  const { data: arcs = [], isLoading: arcsLoading } = useArcs();
  const { data: characters = [] } = useCharacters();

  const [arcId, setArcId] = useState<string>('all');
  const [characterId, setCharacterId] = useState<CharacterId>('all');
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  // Build arc color map
  const arcColorMap = useMemo(() => {
    const map = new Map<string, string>();
    arcs.forEach((arc, i) => {
      map.set(arc.id, ARC_COLORS[i % ARC_COLORS.length] ?? ARC_COLORS[0]!);
    });
    return map;
  }, [arcs]);

  // Memoize character id→name lookup
  const characterMap = useMemo(() => new Map(characters.map((c) => [c.id, c.name])), [characters]);

  // Sort events chronologically.
  // eventDate is a free-form string — may be an ISO date ("2024-01-15") or a
  // human-readable label ("百年前"). For ISO dates we sort numerically; for
  // non-parseable strings we fall back to id (insertion order).
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return a.id - b.id;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      const da = new Date(a.eventDate).getTime();
      const db = new Date(b.eventDate).getTime();
      if (isNaN(da) || isNaN(db)) return a.id - b.id;
      return da - db;
    });
  }, [events]);

  // Filter events by arc and/or character.
  // TimelineEvent has no direct arcId, so arc filtering works indirectly:
  // filter events whose relatedCharacters overlap with the arc's characterArcs keys.
  const filteredEvents = useMemo(() => {
    let result = sortedEvents;

    if (arcId !== 'all') {
      const arc = arcs.find((a) => a.id === arcId);
      const arcCharIds = new Set(Object.keys(arc?.characterArcs ?? {}));
      // Always apply the filter — if arc has no characterArcs, result is 0 events
      // (honest: no associations recorded) rather than silently showing all events
      result = result.filter((event) =>
        event.relatedCharacters?.some((cid) => arcCharIds.has(cid))
      );
    }

    if (characterId !== 'all') {
      result = result.filter((event) => event.relatedCharacters?.includes(characterId));
    }

    return result;
  }, [sortedEvents, arcId, characterId, arcs]);

  if (eventsLoading || arcsLoading) return <LoadingSpinner text="Loading timeline..." />;
  if (!events.length) {
    return (
      <EmptyState
        title="No timeline events yet"
        description="Add events in Story Bible → Timeline to visualize your story's chronology."
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filterBar}>
        <Select
          size="sm"
          value={arcId}
          onChange={(e) => setArcId(e.target.value)}
          options={[
            { value: 'all', label: 'All Arcs' },
            ...arcs.map((arc) => ({ value: arc.id, label: arc.name })),
          ]}
        />

        <Select
          size="sm"
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          options={[
            { value: 'all', label: 'All Characters' },
            ...characters.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <span className={styles.filterStats}>
          {filteredEvents.length} of {events.length} events
        </span>
      </div>

      {/* Arc chips — click to filter by arc */}
      {arcs.length > 0 && (
        <div className={styles.arcLegend}>
          {arcs.map((arc) => (
            <Button
              key={arc.id}
              variant="ghost"
              size="sm"
              className={`${styles.arcChip} ${arcId === arc.id ? styles.arcChipActive : ''}`}
              style={
                {
                  '--arc-color': arcColorMap.get(arc.id) ?? 'var(--color-accent)',
                } as React.CSSProperties
              }
              onClick={() => setArcId((prev) => (prev === arc.id ? 'all' : arc.id))}
            >
              <span className={styles.arcDot} style={{ background: arcColorMap.get(arc.id) }} />
              {arc.name}
            </Button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={styles.timelineAxis} />

        {filteredEvents.map((event, index) => {
          const isExpanded = expandedEventId === event.id;
          const isHovered = hoveredEventId === event.id;
          const side = index % 2 === 0 ? 'left' : 'right';

          return (
            <div
              key={event.id}
              className={`${styles.eventRow} ${styles[side]}`}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
            >
              {/* Connector line + dot */}
              <div className={styles.connector}>
                <div
                  className={`${styles.dot} ${isHovered || isExpanded ? styles.dotActive : ''}`}
                />
              </div>

              {/* Event card */}
              <div
                className={`${styles.eventCard} ${isExpanded ? styles.eventCardExpanded : ''}`}
                onClick={() => setExpandedEventId((prev) => (prev === event.id ? null : event.id))}
              >
                <div className={styles.eventDate}>{formatDate(event.eventDate)}</div>
                <div className={styles.eventDescription}>{event.description}</div>

                {isExpanded && (
                  <div className={styles.eventDetails}>
                    {event.relatedCharacters && event.relatedCharacters.length > 0 && (
                      <div className={styles.eventMeta}>
                        <span className={styles.metaLabel}>Characters</span>
                        <div className={styles.metaTags}>
                          {event.relatedCharacters.map((cid) => (
                            <span
                              key={cid}
                              className={`${styles.metaTag} ${styles.metaTagLink}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const store = useStoryBibleStore.getState();
                                store.setTab('characters');
                                store.select(cid);
                                navigate('/bible');
                              }}
                              title="Click to view character"
                            >
                              {characterMap.get(cid) ?? cid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.relatedLocations && event.relatedLocations.length > 0 && (
                      <div className={styles.eventMeta}>
                        <span className={styles.metaLabel}>Locations</span>
                        <div className={styles.metaTags}>
                          {event.relatedLocations.map((lid) => (
                            <span key={lid} className={styles.metaTag}>
                              {lid}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
