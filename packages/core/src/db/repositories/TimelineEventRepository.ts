/**
 * TimelineEventRepository - Data access layer for timeline events
 *
 * Handles all database operations for the timeline_events table.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { TimelineEvent, CharacterId, LocationId } from '../../types/entities.js';
import type { CreateTimelineEventInput } from '../../types/services.js';

/** Raw database row type */
interface TimelineEventRow {
  id: number;
  event_date: string | null;
  description: string;
  related_characters: string | null;
  related_locations: string | null;
  created_at: string;
}

/**
 * Repository for TimelineEvent entity operations.
 */
export class TimelineEventRepository extends BaseRepository<TimelineEvent, number> {
  constructor(db: Database) {
    super(db, 'timeline_events');
  }

  /**
   * Create a new timeline event.
   */
  create(input: CreateTimelineEventInput): TimelineEvent {
    const now = this.now();

    const result = this.db.run(
      `INSERT INTO timeline_events (
        event_date, description, related_characters, related_locations,
        created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        input.eventDate ?? null,
        input.description,
        this.toJson(input.relatedCharacters),
        this.toJson(input.relatedLocations),
        now,
      ]
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  /**
   * Find a timeline event by ID.
   */
  findById(id: number): TimelineEvent | null {
    const row = this.db.queryOne<TimelineEventRow>(`SELECT * FROM timeline_events WHERE id = ?`, [
      id,
    ]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all timeline events ordered by event date.
   */
  findAll(): TimelineEvent[] {
    const rows = this.db.query<TimelineEventRow>(
      `SELECT * FROM timeline_events ORDER BY event_date, created_at`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get timeline events for a specific date range.
   */
  findByDateRange(startDate: string, endDate: string): TimelineEvent[] {
    const rows = this.db.query<TimelineEventRow>(
      `SELECT * FROM timeline_events
       WHERE event_date >= ? AND event_date <= ?
       ORDER BY event_date`,
      [startDate, endDate]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get timeline events involving a specific character.
   */
  findByCharacter(characterId: CharacterId): TimelineEvent[] {
    // SQLite JSON functions to search within JSON array
    const rows = this.db.query<TimelineEventRow>(
      `SELECT * FROM timeline_events
       WHERE related_characters LIKE ?
       ORDER BY event_date`,
      [`%"${characterId}"%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get timeline events involving a specific location.
   */
  findByLocation(locationId: LocationId): TimelineEvent[] {
    const rows = this.db.query<TimelineEventRow>(
      `SELECT * FROM timeline_events
       WHERE related_locations LIKE ?
       ORDER BY event_date`,
      [`%"${locationId}"%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Search timeline events by description.
   */
  search(query: string): TimelineEvent[] {
    const rows = this.db.query<TimelineEventRow>(
      `SELECT * FROM timeline_events
       WHERE description LIKE ?
       ORDER BY event_date`,
      [`%${query}%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a timeline event.
   */
  update(id: number, input: Partial<CreateTimelineEventInput>): TimelineEvent {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Timeline event ${id} not found`);
    }

    // Build dynamic update
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.eventDate !== undefined) {
      updates.push('event_date = ?');
      params.push(input.eventDate);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }
    if (input.relatedCharacters !== undefined) {
      updates.push('related_characters = ?');
      params.push(this.toJson(input.relatedCharacters));
    }
    if (input.relatedLocations !== undefined) {
      updates.push('related_locations = ?');
      params.push(this.toJson(input.relatedLocations));
    }

    if (updates.length === 0) {
      return existing;
    }

    params.push(id);

    this.db.run(`UPDATE timeline_events SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Add a character to a timeline event.
   */
  addCharacter(id: number, characterId: CharacterId): TimelineEvent {
    const event = this.findById(id);
    if (!event) {
      throw new Error(`Timeline event ${id} not found`);
    }

    const characters = event.relatedCharacters ?? [];
    if (!characters.includes(characterId)) {
      characters.push(characterId);
      return this.update(id, { relatedCharacters: characters });
    }

    return event;
  }

  /**
   * Remove a character from a timeline event.
   */
  removeCharacter(id: number, characterId: CharacterId): TimelineEvent {
    const event = this.findById(id);
    if (!event) {
      throw new Error(`Timeline event ${id} not found`);
    }

    const characters = event.relatedCharacters?.filter((c) => c !== characterId) ?? [];
    return this.update(id, { relatedCharacters: characters });
  }

  /**
   * Remove a character from all timeline events.
   * Used when deleting a character.
   */
  removeCharacterFromAll(characterId: CharacterId): void {
    const events = this.findByCharacter(characterId);
    for (const event of events) {
      this.removeCharacter(event.id, characterId);
    }
  }

  /**
   * Map database row to TimelineEvent entity.
   */
  private mapRow(row: TimelineEventRow): TimelineEvent {
    const event: TimelineEvent = {
      id: row.id,
      description: row.description,
      createdAt: row.created_at,
    };

    // Only add optional fields if they have values
    if (row.event_date) event.eventDate = row.event_date;

    // Parse JSON fields with explicit null checks
    const relatedCharacters = this.parseJson<CharacterId[]>(row.related_characters);
    if (relatedCharacters) event.relatedCharacters = relatedCharacters;

    const relatedLocations = this.parseJson<LocationId[]>(row.related_locations);
    if (relatedLocations) event.relatedLocations = relatedLocations;

    return event;
  }
}
