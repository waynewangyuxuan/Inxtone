/**
 * LocationRepository - Data access layer for story locations
 *
 * Handles all database operations for the locations table.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { Location, LocationId } from '../../types/entities.js';
import type { CreateLocationInput } from '../../types/services.js';

/** Raw database row type */
interface LocationRow {
  id: string;
  name: string;
  type: string | null;
  significance: string | null;
  atmosphere: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Location entity operations.
 */
export class LocationRepository extends BaseRepository<Location, LocationId> {
  constructor(db: Database) {
    super(db, 'locations');
  }

  /**
   * Create a new location.
   */
  create(input: CreateLocationInput): Location {
    const id = this.generatePrefixedId('L');
    const now = this.now();

    this.db.run(
      `INSERT INTO locations (
        id, name, type, significance, atmosphere, details,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.type ?? null,
        input.significance ?? null,
        input.atmosphere ?? null,
        this.toJson(input.details),
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find a location by ID.
   */
  findById(id: LocationId): Location | null {
    const row = this.db.queryOne<LocationRow>(`SELECT * FROM locations WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find multiple locations by IDs in a single query.
   * Returns only found locations (missing IDs are silently skipped).
   */
  findByIds(ids: LocationId[]): Location[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = this.db.query<LocationRow>(
      `SELECT * FROM locations WHERE id IN (${placeholders})`,
      ids
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get all locations.
   */
  findAll(): Location[] {
    const rows = this.db.query<LocationRow>(`SELECT * FROM locations ORDER BY name`);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find locations by type.
   */
  findByType(type: string): Location[] {
    const rows = this.db.query<LocationRow>(
      `SELECT * FROM locations WHERE type = ? ORDER BY name`,
      [type]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Search locations by name.
   */
  searchByName(name: string): Location[] {
    const rows = this.db.query<LocationRow>(
      `SELECT * FROM locations WHERE name LIKE ? ORDER BY name`,
      [`%${name}%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a location.
   */
  update(id: LocationId, input: Partial<CreateLocationInput>): Location {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Location ${id} not found`);
    }

    const now = this.now();

    // Build dynamic update
    const updates: string[] = ['updated_at = ?'];
    const params: unknown[] = [now];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.significance !== undefined) {
      updates.push('significance = ?');
      params.push(input.significance);
    }
    if (input.atmosphere !== undefined) {
      updates.push('atmosphere = ?');
      params.push(input.atmosphere);
    }
    if (input.details !== undefined) {
      updates.push('details = ?');
      params.push(this.toJson(input.details));
    }

    params.push(id);

    this.db.run(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Get all unique location types.
   */
  getTypes(): string[] {
    const rows = this.db.query<{ type: string }>(
      `SELECT DISTINCT type FROM locations WHERE type IS NOT NULL ORDER BY type`
    );
    return rows.map((r) => r.type);
  }

  /**
   * Map database row to Location entity.
   */
  private mapRow(row: LocationRow): Location {
    const location: Location = {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Only add optional fields if they have values
    if (row.type) location.type = row.type;
    if (row.significance) location.significance = row.significance;
    if (row.atmosphere) location.atmosphere = row.atmosphere;

    // Parse JSON fields with explicit null checks
    const details = this.parseJson<Record<string, unknown>>(row.details);
    if (details) location.details = details;

    return location;
  }
}
