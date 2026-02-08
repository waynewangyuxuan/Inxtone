/**
 * FactionRepository - Data access layer for factions/organizations
 *
 * Handles all database operations for the factions table.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { Faction, FactionId, CharacterId } from '../../types/entities.js';
import type { CreateFactionInput } from '../../types/services.js';

/** Raw database row type */
interface FactionRow {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  leader_id: string | null;
  stance_to_mc: string | null;
  goals: string | null;
  resources: string | null;
  internal_conflict: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Faction entity operations.
 */
export class FactionRepository extends BaseRepository<Faction, FactionId> {
  constructor(db: Database) {
    super(db, 'factions');
  }

  /**
   * Create a new faction.
   */
  create(input: CreateFactionInput): Faction {
    const id = this.generatePrefixedId('F');
    const now = this.now();

    this.db.run(
      `INSERT INTO factions (
        id, name, type, status, leader_id, stance_to_mc,
        goals, resources, internal_conflict,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.type ?? null,
        input.status ?? null,
        input.leaderId ?? null,
        input.stanceToMC ?? null,
        this.toJson(input.goals),
        this.toJson(input.resources),
        input.internalConflict ?? null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find a faction by ID.
   */
  findById(id: FactionId): Faction | null {
    const row = this.db.queryOne<FactionRow>(`SELECT * FROM factions WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all factions.
   */
  findAll(): Faction[] {
    const rows = this.db.query<FactionRow>(`SELECT * FROM factions ORDER BY name`);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find factions by type.
   */
  findByType(type: string): Faction[] {
    const rows = this.db.query<FactionRow>(`SELECT * FROM factions WHERE type = ? ORDER BY name`, [
      type,
    ]);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find factions by status.
   */
  findByStatus(status: string): Faction[] {
    const rows = this.db.query<FactionRow>(
      `SELECT * FROM factions WHERE status = ? ORDER BY name`,
      [status]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find factions by stance to MC.
   */
  findByStance(stance: 'friendly' | 'neutral' | 'hostile'): Faction[] {
    const rows = this.db.query<FactionRow>(
      `SELECT * FROM factions WHERE stance_to_mc = ? ORDER BY name`,
      [stance]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find factions led by a specific character.
   */
  findByLeader(leaderId: CharacterId): Faction[] {
    const rows = this.db.query<FactionRow>(
      `SELECT * FROM factions WHERE leader_id = ? ORDER BY name`,
      [leaderId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Search factions by name.
   */
  searchByName(name: string): Faction[] {
    const rows = this.db.query<FactionRow>(
      `SELECT * FROM factions WHERE name LIKE ? ORDER BY name`,
      [`%${name}%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a faction.
   */
  update(id: FactionId, input: Partial<CreateFactionInput>): Faction {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Faction ${id} not found`);
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
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.leaderId !== undefined) {
      updates.push('leader_id = ?');
      params.push(input.leaderId);
    }
    if (input.stanceToMC !== undefined) {
      updates.push('stance_to_mc = ?');
      params.push(input.stanceToMC);
    }
    if (input.goals !== undefined) {
      updates.push('goals = ?');
      params.push(this.toJson(input.goals));
    }
    if (input.resources !== undefined) {
      updates.push('resources = ?');
      params.push(this.toJson(input.resources));
    }
    if (input.internalConflict !== undefined) {
      updates.push('internal_conflict = ?');
      params.push(input.internalConflict);
    }

    params.push(id);

    this.db.run(`UPDATE factions SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Clear the leader of a faction.
   * Used when a character is deleted.
   */
  clearLeader(leaderId: CharacterId): number {
    const result = this.db.run(
      `UPDATE factions SET leader_id = NULL, updated_at = ? WHERE leader_id = ?`,
      [this.now(), leaderId]
    );
    return result.changes;
  }

  /**
   * Get all unique faction types.
   */
  getTypes(): string[] {
    const rows = this.db.query<{ type: string }>(
      `SELECT DISTINCT type FROM factions WHERE type IS NOT NULL ORDER BY type`
    );
    return rows.map((r) => r.type);
  }

  /**
   * Get all unique faction statuses.
   */
  getStatuses(): string[] {
    const rows = this.db.query<{ status: string }>(
      `SELECT DISTINCT status FROM factions WHERE status IS NOT NULL ORDER BY status`
    );
    return rows.map((r) => r.status);
  }

  /**
   * Map database row to Faction entity.
   */
  private mapRow(row: FactionRow): Faction {
    const faction: Faction = {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Only add optional fields if they have values
    if (row.type) faction.type = row.type;
    if (row.status) faction.status = row.status;
    if (row.leader_id) faction.leaderId = row.leader_id;
    if (row.stance_to_mc)
      faction.stanceToMC = row.stance_to_mc as 'friendly' | 'neutral' | 'hostile';
    if (row.internal_conflict) faction.internalConflict = row.internal_conflict;

    // Parse JSON fields with explicit null checks
    const goals = this.parseJson<string[]>(row.goals);
    if (goals) faction.goals = goals;

    const resources = this.parseJson<string[]>(row.resources);
    if (resources) faction.resources = resources;

    return faction;
  }
}
