/**
 * TimelineView
 *
 * Chronological display of story timeline events with arc boundary markers.
 * Data source: /timeline and /arcs APIs.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimeline } from '../../hooks/useTimeline';
import { useArcs } from '../../hooks/useArcs';
import { useCharacters } from '../../hooks/useCharacters';
import { useStoryBibleStore } from '../../stores/useStoryBibleStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { CharacterId } from '@inxtone/core';
import styles from './TimelineView.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterState {
  arcId: string;
  characterId: CharacterId;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Undated';
  return dateStr;
}

const ARC_COLORS = ['var(--color-accent)', '#6b8cba', '#4ade80', '#a78bfa', '#f59e0b', '#f472b6'];

// ─── Component ───────────────────────────────────────────────────────────────

export function TimelineView(): React.ReactElement {
  const { data: events = [], isLoading: eventsLoading } = useTimeline();
  const navigate = useNavigate();
  const { data: arcs = [], isLoading: arcsLoading } = useArcs();
  const { data: characters = [] } = useCharacters();

  const [filters, setFilters] = useState<FilterState>({ arcId: 'all', characterId: 'all' });
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

  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.localeCompare(b.eventDate);
    });
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((event) => {
      if (
        filters.characterId !== 'all' &&
        !event.relatedCharacters?.includes(filters.characterId)
      ) {
        return false;
      }
      return true;
    });
  }, [sortedEvents, filters]);

  // Compute arc boundaries for the sorted event list
  const arcBoundaries = useMemo(() => {
    const boundaries: Array<{ arcId: string; name: string; color: string; startIndex: number }> =
      [];
    // Simple heuristic: mark arc start when a new arc appears in sequence
    // (real arc boundaries would come from arc.chapterStart)
    arcs.forEach((arc) => {
      boundaries.push({
        arcId: arc.id,
        name: arc.name,
        color: arcColorMap.get(arc.id) ?? 'var(--color-accent)',
        startIndex: 0,
      });
    });
    return boundaries;
  }, [arcs, arcColorMap]);

  if (eventsLoading || arcsLoading) return <LoadingSpinner text="Loading timeline..." />;
  if (!events.length) {
    return (
      <EmptyState
        title="No timeline events yet"
        description="Add events in Story Bible → Timeline to visualize your story's chronology."
      />
    );
  }

  const characterMap = new Map(characters.map((c) => [c.id, c.name]));

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={filters.arcId}
          onChange={(e) => setFilters((f) => ({ ...f, arcId: e.target.value }))}
        >
          <option value="all">All Arcs</option>
          {arcs.map((arc) => (
            <option key={arc.id} value={arc.id}>
              {arc.name}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filters.characterId}
          onChange={(e) => setFilters((f) => ({ ...f, characterId: e.target.value }))}
        >
          <option value="all">All Characters</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className={styles.filterStats}>
          {filteredEvents.length} of {events.length} events
        </span>
      </div>

      {/* Arc legend */}
      {arcs.length > 0 && (
        <div className={styles.arcLegend}>
          {arcs.map((arc) => (
            <button
              key={arc.id}
              className={`${styles.arcChip} ${filters.arcId === arc.id ? styles.arcChipActive : ''}`}
              style={
                {
                  '--arc-color': arcColorMap.get(arc.id) ?? 'var(--color-accent)',
                } as React.CSSProperties
              }
              onClick={() =>
                setFilters((f) => ({ ...f, arcId: f.arcId === arc.id ? 'all' : arc.id }))
              }
            >
              <span className={styles.arcDot} style={{ background: arcColorMap.get(arc.id) }} />
              {arc.name}
            </button>
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

        {/* Arc boundary markers */}
        {arcBoundaries.map((boundary) => (
          <div key={boundary.arcId} className={styles.arcMarker}>
            <div className={styles.arcMarkerLine} style={{ borderColor: boundary.color }} />
            <span className={styles.arcMarkerLabel} style={{ color: boundary.color }}>
              {boundary.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
