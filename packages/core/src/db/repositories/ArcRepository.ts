/**
 * ArcRepository - Data access layer for story arcs
 *
 * Handles all database operations for the arcs table,
 * including main arcs and sub-arcs with chapter tracking.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type {
  Arc,
  ArcId,
  ArcStatus,
  ArcSection,
  ChapterId,
  CharacterId,
} from '../../types/entities.js';
import type { CreateArcInput } from '../../types/services.js';

/** Raw database row type */
interface ArcRow {
  id: string;
  name: string;
  type: string;
  chapter_start: number | null;
  chapter_end: number | null;
  status: string;
  progress: number;
  sections: string | null;
  character_arcs: string | null;
  main_arc_relation: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Arc entity operations.
 */
export class ArcRepository extends BaseRepository<Arc, ArcId> {
  constructor(db: Database) {
    super(db, 'arcs');
  }

  /**
   * Create a new arc.
   */
  create(input: CreateArcInput): Arc {
    const id = this.generatePrefixedId('ARC');
    const now = this.now();

    this.db.run(
      `INSERT INTO arcs (
        id, name, type, chapter_start, chapter_end,
        status, progress, sections, character_arcs, main_arc_relation,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.type,
        input.chapterStart ?? null,
        input.chapterEnd ?? null,
        input.status ?? 'planned',
        0,
        this.toJson(input.sections),
        this.toJson(input.characterArcs),
        input.mainArcRelation ?? null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find an arc by ID.
   */
  findById(id: ArcId): Arc | null {
    const row = this.db.queryOne<ArcRow>(`SELECT * FROM arcs WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all arcs.
   */
  findAll(): Arc[] {
    const rows = this.db.query<ArcRow>(`SELECT * FROM arcs ORDER BY created_at`);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find arcs by type.
   */
  findByType(type: 'main' | 'sub'): Arc[] {
    const rows = this.db.query<ArcRow>(`SELECT * FROM arcs WHERE type = ? ORDER BY created_at`, [
      type,
    ]);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find arcs by status.
   */
  findByStatus(status: ArcStatus): Arc[] {
    const rows = this.db.query<ArcRow>(`SELECT * FROM arcs WHERE status = ? ORDER BY created_at`, [
      status,
    ]);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get the main arc (assumes only one main arc).
   */
  getMainArc(): Arc | null {
    const row = this.db.queryOne<ArcRow>(`SELECT * FROM arcs WHERE type = 'main' LIMIT 1`);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find arc containing a specific chapter.
   */
  findByChapter(chapterId: ChapterId): Arc | null {
    const row = this.db.queryOne<ArcRow>(
      `SELECT * FROM arcs
       WHERE chapter_start <= ? AND (chapter_end IS NULL OR chapter_end >= ?)
       ORDER BY type DESC LIMIT 1`,
      [chapterId, chapterId]
    );
    return row ? this.mapRow(row) : null;
  }

  /**
   * Update an arc.
   */
  update(id: ArcId, input: Partial<CreateArcInput> & { progress?: number }): Arc {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Arc ${id} not found`);
    }

    const now = this.now();
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
    if (input.chapterStart !== undefined) {
      updates.push('chapter_start = ?');
      params.push(input.chapterStart);
    }
    if (input.chapterEnd !== undefined) {
      updates.push('chapter_end = ?');
      params.push(input.chapterEnd);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }
    if (input.progress !== undefined) {
      updates.push('progress = ?');
      params.push(input.progress);
    }
    if (input.sections !== undefined) {
      updates.push('sections = ?');
      params.push(this.toJson(input.sections));
    }
    if (input.characterArcs !== undefined) {
      updates.push('character_arcs = ?');
      params.push(this.toJson(input.characterArcs));
    }
    if (input.mainArcRelation !== undefined) {
      updates.push('main_arc_relation = ?');
      params.push(input.mainArcRelation);
    }

    params.push(id);

    this.db.run(`UPDATE arcs SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Update arc progress.
   */
  updateProgress(id: ArcId, progress: number): Arc {
    return this.update(id, { progress: Math.max(0, Math.min(100, progress)) });
  }

  /**
   * Update arc status.
   */
  updateStatus(id: ArcId, status: ArcStatus): Arc {
    return this.update(id, { status });
  }

  /**
   * Add a character arc mapping.
   */
  addCharacterArc(id: ArcId, characterId: CharacterId, phase: string): Arc {
    const arc = this.findById(id);
    if (!arc) {
      throw new Error(`Arc ${id} not found`);
    }

    const characterArcs = arc.characterArcs ?? {};
    characterArcs[characterId] = phase;

    return this.update(id, { characterArcs });
  }

  /**
   * Remove a character arc mapping.
   */
  removeCharacterArc(id: ArcId, characterId: CharacterId): Arc {
    const arc = this.findById(id);
    if (!arc) {
      throw new Error(`Arc ${id} not found`);
    }

    const characterArcs = arc.characterArcs ?? {};
    delete characterArcs[characterId];

    return this.update(id, { characterArcs });
  }

  /**
   * Map database row to Arc entity.
   */
  private mapRow(row: ArcRow): Arc {
    const arc: Arc = {
      id: row.id,
      name: row.name,
      type: row.type as 'main' | 'sub',
      status: row.status as ArcStatus,
      progress: row.progress,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (row.chapter_start !== null) arc.chapterStart = row.chapter_start;
    if (row.chapter_end !== null) arc.chapterEnd = row.chapter_end;
    if (row.main_arc_relation) arc.mainArcRelation = row.main_arc_relation;

    const sections = this.parseJson<ArcSection[]>(row.sections);
    if (sections) arc.sections = sections;

    const characterArcs = this.parseJson<Record<CharacterId, string>>(row.character_arcs);
    if (characterArcs) arc.characterArcs = characterArcs;

    return arc;
  }
}
