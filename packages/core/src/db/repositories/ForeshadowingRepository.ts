/**
 * ForeshadowingRepository - Data access layer for foreshadowing/伏笔
 *
 * Handles all database operations for the foreshadowing table,
 * supporting the complete lifecycle: planted → hinted → resolved/abandoned.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type {
  Foreshadowing,
  ForeshadowingId,
  ForeshadowingStatus,
  ForeshadowingTerm,
  ForeshadowingHint,
  ChapterId,
} from '../../types/entities.js';
import type { CreateForeshadowingInput } from '../../types/services.js';

/** Raw database row type */
interface ForeshadowingRow {
  id: string;
  content: string;
  planted_chapter: number | null;
  planted_text: string | null;
  hints: string | null;
  planned_payoff: number | null;
  resolved_chapter: number | null;
  status: string;
  term: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Foreshadowing entity operations.
 */
export class ForeshadowingRepository extends BaseRepository<Foreshadowing, ForeshadowingId> {
  constructor(db: Database) {
    super(db, 'foreshadowing');
  }

  /**
   * Create a new foreshadowing.
   */
  create(input: CreateForeshadowingInput): Foreshadowing {
    const id = this.generatePrefixedId('FS');
    const now = this.now();

    this.db.run(
      `INSERT INTO foreshadowing (
        id, content, planted_chapter, planted_text,
        hints, planned_payoff, status, term,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.content,
        input.plantedChapter ?? null,
        input.plantedText ?? null,
        '[]', // Empty hints array
        input.plannedPayoff ?? null,
        'active',
        input.term ?? null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find a foreshadowing by ID.
   */
  findById(id: ForeshadowingId): Foreshadowing | null {
    const row = this.db.queryOne<ForeshadowingRow>(`SELECT * FROM foreshadowing WHERE id = ?`, [
      id,
    ]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all foreshadowing.
   */
  findAll(): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing ORDER BY created_at DESC`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get active (unresolved) foreshadowing.
   */
  findActive(): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE status = 'active' ORDER BY created_at`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get resolved foreshadowing.
   */
  findResolved(): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE status = 'resolved' ORDER BY resolved_chapter`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get abandoned foreshadowing.
   */
  findAbandoned(): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE status = 'abandoned' ORDER BY updated_at DESC`
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find by status.
   */
  findByStatus(status: ForeshadowingStatus): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE status = ? ORDER BY created_at`,
      [status]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find by term (short/mid/long).
   */
  findByTerm(term: ForeshadowingTerm): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE term = ? ORDER BY created_at`,
      [term]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find foreshadowing planted in a specific chapter.
   */
  findByPlantedChapter(chapterId: ChapterId): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE planted_chapter = ? ORDER BY created_at`,
      [chapterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find foreshadowing resolved in a specific chapter.
   */
  findByResolvedChapter(chapterId: ChapterId): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing WHERE resolved_chapter = ? ORDER BY created_at`,
      [chapterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find active foreshadowing that should be resolved by a certain chapter.
   */
  findOverdue(currentChapter: ChapterId): Foreshadowing[] {
    const rows = this.db.query<ForeshadowingRow>(
      `SELECT * FROM foreshadowing
       WHERE status = 'active'
       AND planned_payoff IS NOT NULL
       AND planned_payoff < ?
       ORDER BY planned_payoff`,
      [currentChapter]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a foreshadowing.
   */
  update(id: ForeshadowingId, input: Partial<CreateForeshadowingInput>): Foreshadowing {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Foreshadowing ${id} not found`);
    }

    const now = this.now();
    const updates: string[] = ['updated_at = ?'];
    const params: unknown[] = [now];

    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }
    if (input.plantedChapter !== undefined) {
      updates.push('planted_chapter = ?');
      params.push(input.plantedChapter);
    }
    if (input.plantedText !== undefined) {
      updates.push('planted_text = ?');
      params.push(input.plantedText);
    }
    if (input.plannedPayoff !== undefined) {
      updates.push('planned_payoff = ?');
      params.push(input.plannedPayoff);
    }
    if (input.term !== undefined) {
      updates.push('term = ?');
      params.push(input.term);
    }

    params.push(id);

    this.db.run(`UPDATE foreshadowing SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Add a hint to a foreshadowing.
   */
  addHint(id: ForeshadowingId, chapter: ChapterId, text: string): Foreshadowing {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Foreshadowing ${id} not found`);
    }

    const hints: ForeshadowingHint[] = existing.hints ?? [];
    hints.push({ chapter, text });

    this.db.run(`UPDATE foreshadowing SET hints = ?, updated_at = ? WHERE id = ?`, [
      this.toJson(hints),
      this.now(),
      id,
    ]);

    return this.findById(id)!;
  }

  /**
   * Resolve a foreshadowing.
   */
  resolve(id: ForeshadowingId, resolvedChapter: ChapterId): Foreshadowing {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Foreshadowing ${id} not found`);
    }

    if (existing.status !== 'active') {
      throw new Error(`Foreshadowing ${id} is not active (status: ${existing.status})`);
    }

    this.db.run(
      `UPDATE foreshadowing
       SET status = 'resolved', resolved_chapter = ?, updated_at = ?
       WHERE id = ?`,
      [resolvedChapter, this.now(), id]
    );

    return this.findById(id)!;
  }

  /**
   * Abandon a foreshadowing.
   */
  abandon(id: ForeshadowingId): Foreshadowing {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Foreshadowing ${id} not found`);
    }

    if (existing.status !== 'active') {
      throw new Error(`Foreshadowing ${id} is not active (status: ${existing.status})`);
    }

    this.db.run(`UPDATE foreshadowing SET status = 'abandoned', updated_at = ? WHERE id = ?`, [
      this.now(),
      id,
    ]);

    return this.findById(id)!;
  }

  /**
   * Reactivate an abandoned foreshadowing.
   */
  reactivate(id: ForeshadowingId): Foreshadowing {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Foreshadowing ${id} not found`);
    }

    if (existing.status !== 'abandoned') {
      throw new Error(`Foreshadowing ${id} is not abandoned (status: ${existing.status})`);
    }

    this.db.run(`UPDATE foreshadowing SET status = 'active', updated_at = ? WHERE id = ?`, [
      this.now(),
      id,
    ]);

    return this.findById(id)!;
  }

  /**
   * Get statistics about foreshadowing.
   */
  getStats(): { active: number; resolved: number; abandoned: number; total: number } {
    const result = this.db.queryOne<{
      active: number;
      resolved: number;
      abandoned: number;
      total: number;
    }>(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved,
        COALESCE(SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END), 0) as abandoned,
        COUNT(*) as total
      FROM foreshadowing
    `);

    return result ?? { active: 0, resolved: 0, abandoned: 0, total: 0 };
  }

  /**
   * Map database row to Foreshadowing entity.
   */
  private mapRow(row: ForeshadowingRow): Foreshadowing {
    const foreshadowing: Foreshadowing = {
      id: row.id,
      content: row.content,
      status: row.status as ForeshadowingStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.planted_chapter !== null) foreshadowing.plantedChapter = row.planted_chapter;
    if (row.planted_text) foreshadowing.plantedText = row.planted_text;
    if (row.planned_payoff !== null) foreshadowing.plannedPayoff = row.planned_payoff;
    if (row.resolved_chapter !== null) foreshadowing.resolvedChapter = row.resolved_chapter;
    if (row.term) foreshadowing.term = row.term as ForeshadowingTerm;

    const hints = this.parseJson<ForeshadowingHint[]>(row.hints);
    if (hints && hints.length > 0) foreshadowing.hints = hints;

    return foreshadowing;
  }
}
