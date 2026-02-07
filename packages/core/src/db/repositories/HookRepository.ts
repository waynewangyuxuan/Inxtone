/**
 * HookRepository - Data access layer for hooks/读者钩子
 *
 * Handles all database operations for the hooks table.
 * Hooks are used to maintain reader engagement at different levels:
 * - opening: Overall story hook
 * - arc: Arc-level tension builders
 * - chapter: Chapter-specific hooks
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type { Hook, HookId, HookType, HookStyle, ChapterId } from '../../types/entities.js';
import type { CreateHookInput } from '../../types/services.js';

/** Raw database row type */
interface HookRow {
  id: string;
  type: string;
  chapter_id: number | null;
  content: string;
  hook_type: string | null;
  strength: number | null;
  created_at: string;
}

/**
 * Repository for Hook entity operations.
 */
export class HookRepository extends BaseRepository<Hook, HookId> {
  constructor(db: Database) {
    super(db, 'hooks');
  }

  /**
   * Create a new hook.
   */
  create(input: CreateHookInput): Hook {
    const id = this.generatePrefixedId('HK');
    const now = this.now();

    this.db.run(
      `INSERT INTO hooks (
        id, type, chapter_id, content, hook_type, strength, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.type,
        input.chapterId ?? null,
        input.content,
        input.hookType ?? null,
        input.strength ?? null,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find a hook by ID.
   */
  findById(id: HookId): Hook | null {
    const row = this.db.queryOne<HookRow>(`SELECT * FROM hooks WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all hooks.
   */
  findAll(): Hook[] {
    const rows = this.db.query<HookRow>(`SELECT * FROM hooks ORDER BY created_at DESC`);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find hooks by type.
   */
  findByType(type: HookType): Hook[] {
    const rows = this.db.query<HookRow>(
      `SELECT * FROM hooks WHERE type = ? ORDER BY created_at DESC`,
      [type]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find hooks for a specific chapter.
   */
  findByChapter(chapterId: ChapterId): Hook[] {
    const rows = this.db.query<HookRow>(
      `SELECT * FROM hooks WHERE chapter_id = ? ORDER BY created_at`,
      [chapterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find hooks by hook style (suspense, anticipation, emotion, mystery).
   */
  findByHookStyle(hookStyle: HookStyle): Hook[] {
    const rows = this.db.query<HookRow>(
      `SELECT * FROM hooks WHERE hook_type = ? ORDER BY created_at DESC`,
      [hookStyle]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get the opening hook (main story hook).
   */
  getOpeningHook(): Hook | null {
    const row = this.db.queryOne<HookRow>(`SELECT * FROM hooks WHERE type = 'opening' LIMIT 1`);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get arc-level hooks.
   */
  getArcHooks(): Hook[] {
    return this.findByType('arc');
  }

  /**
   * Find strong hooks (strength >= threshold).
   */
  findStrong(threshold = 70): Hook[] {
    const rows = this.db.query<HookRow>(
      `SELECT * FROM hooks WHERE strength >= ? ORDER BY strength DESC`,
      [threshold]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find weak hooks (strength < threshold).
   * Useful for identifying hooks that need strengthening.
   */
  findWeak(threshold = 50): Hook[] {
    const rows = this.db.query<HookRow>(
      `SELECT * FROM hooks WHERE strength IS NOT NULL AND strength < ? ORDER BY strength ASC`,
      [threshold]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a hook.
   */
  update(id: HookId, input: Partial<CreateHookInput>): Hook {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Hook ${id} not found`);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.type !== undefined) {
      updates.push('type = ?');
      params.push(input.type);
    }
    if (input.chapterId !== undefined) {
      updates.push('chapter_id = ?');
      params.push(input.chapterId);
    }
    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }
    if (input.hookType !== undefined) {
      updates.push('hook_type = ?');
      params.push(input.hookType);
    }
    if (input.strength !== undefined) {
      updates.push('strength = ?');
      params.push(input.strength);
    }

    if (updates.length === 0) {
      return existing;
    }

    params.push(id);

    this.db.run(`UPDATE hooks SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Update hook strength.
   */
  updateStrength(id: HookId, strength: number): Hook {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Hook ${id} not found`);
    }

    // Clamp strength to 0-100
    const clampedStrength = Math.max(0, Math.min(100, strength));

    this.db.run(`UPDATE hooks SET strength = ? WHERE id = ?`, [clampedStrength, id]);

    return this.findById(id)!;
  }

  /**
   * Get statistics about hooks.
   */
  getStats(): {
    total: number;
    byType: Record<HookType, number>;
    avgStrength: number | null;
    weakCount: number;
  } {
    const total = this.count();

    const typeStats = this.db.query<{ type: string; count: number }>(`
      SELECT type, COUNT(*) as count FROM hooks GROUP BY type
    `);

    const byType: Record<HookType, number> = {
      opening: 0,
      arc: 0,
      chapter: 0,
    };
    for (const stat of typeStats) {
      byType[stat.type as HookType] = stat.count;
    }

    const strengthResult = this.db.queryOne<{ avg: number | null }>(`
      SELECT AVG(strength) as avg FROM hooks WHERE strength IS NOT NULL
    `);

    const weakResult = this.db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM hooks WHERE strength IS NOT NULL AND strength < 50
    `);

    return {
      total,
      byType,
      avgStrength: strengthResult?.avg ?? null,
      weakCount: weakResult?.count ?? 0,
    };
  }

  /**
   * Map database row to Hook entity.
   */
  private mapRow(row: HookRow): Hook {
    const hook: Hook = {
      id: row.id,
      type: row.type as HookType,
      content: row.content,
      createdAt: row.created_at,
    };

    if (row.chapter_id !== null) hook.chapterId = row.chapter_id;
    if (row.hook_type) hook.hookType = row.hook_type as HookStyle;
    if (row.strength !== null) hook.strength = row.strength;

    return hook;
  }
}
