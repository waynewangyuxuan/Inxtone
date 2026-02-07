/**
 * WorldRepository - Data access layer for world settings
 *
 * The world table is a singleton - only one row with id='main'.
 * Uses upsert pattern for all operations.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { World, PowerSystem } from '../../types/entities.js';

/** Raw database row type */
interface WorldRow {
  id: string;
  power_system: string | null;
  social_rules: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for World entity operations.
 */
export class WorldRepository extends BaseRepository<World, string> {
  private static readonly MAIN_ID = 'main';

  constructor(db: Database) {
    super(db, 'world');
  }

  /**
   * Get the world settings.
   * Returns null if not yet initialized.
   */
  get(): World | null {
    const row = this.db.queryOne<WorldRow>(`SELECT * FROM world WHERE id = ?`, [
      WorldRepository.MAIN_ID,
    ]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Alias for get() to maintain consistency with other repositories.
   */
  findById(_id?: string): World | null {
    return this.get();
  }

  /**
   * Create or update world settings (upsert).
   */
  upsert(input: Partial<World>): World {
    const existing = this.get();
    const now = this.now();

    if (!existing) {
      // Create
      this.db.run(
        `INSERT INTO world (id, power_system, social_rules, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          WorldRepository.MAIN_ID,
          this.toJson(input.powerSystem),
          this.toJson(input.socialRules),
          now,
          now,
        ]
      );
    } else {
      // Update
      const updates: string[] = ['updated_at = ?'];
      const params: unknown[] = [now];

      if (input.powerSystem !== undefined) {
        updates.push('power_system = ?');
        params.push(this.toJson(input.powerSystem));
      }
      if (input.socialRules !== undefined) {
        updates.push('social_rules = ?');
        params.push(this.toJson(input.socialRules));
      }

      params.push(WorldRepository.MAIN_ID);

      this.db.run(`UPDATE world SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return this.get()!;
  }

  /**
   * Update only the power system.
   */
  setPowerSystem(powerSystem: PowerSystem): World {
    return this.upsert({ powerSystem });
  }

  /**
   * Update only the social rules.
   */
  setSocialRules(socialRules: Record<string, string>): World {
    return this.upsert({ socialRules });
  }

  /**
   * Initialize world with default values if not exists.
   */
  initialize(): World {
    const existing = this.get();
    if (existing) return existing;

    return this.upsert({
      socialRules: {},
    });
  }

  /**
   * Map database row to World entity.
   */
  private mapRow(row: WorldRow): World {
    const world: World = {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Parse JSON fields with explicit null checks
    const powerSystem = this.parseJson<PowerSystem>(row.power_system);
    if (powerSystem) world.powerSystem = powerSystem;

    const socialRules = this.parseJson<Record<string, string>>(row.social_rules);
    if (socialRules) world.socialRules = socialRules;

    return world;
  }
}
