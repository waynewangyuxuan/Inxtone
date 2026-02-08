/**
 * CharacterRepository - Data access layer for characters
 *
 * Handles all database operations for the characters table,
 * including FTS5 full-text search integration.
 */

import { BaseRepository } from './BaseRepository.js';
import type { Database } from '../Database.js';
import type {
  Character,
  CharacterId,
  CharacterRole,
  ConflictType,
  CharacterTemplate,
  CharacterMotivation,
  CharacterFacets,
  CharacterArc,
  ChapterId,
} from '../../types/entities.js';
import type { CreateCharacterInput, UpdateCharacterInput } from '../../types/services.js';

/** Raw database row type */
interface CharacterRow {
  id: string;
  name: string;
  role: string;
  appearance: string | null;
  voice_samples: string | null;
  motivation: string | null;
  conflict_type: string | null;
  template: string | null;
  facets: string | null;
  arc: string | null;
  first_appearance: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Repository for Character entity operations.
 */
export class CharacterRepository extends BaseRepository<Character, CharacterId> {
  constructor(db: Database) {
    super(db, 'characters');
  }

  /**
   * Create a new character.
   */
  create(input: CreateCharacterInput): Character {
    const id = this.generatePrefixedId('C');
    const now = this.now();

    this.db.run(
      `INSERT INTO characters (
        id, name, role, appearance, voice_samples,
        motivation, conflict_type, template, first_appearance,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.role,
        input.appearance ?? null,
        this.toJson(input.voiceSamples),
        this.toJson(input.motivation),
        input.conflictType ?? null,
        input.template ?? null,
        input.firstAppearance ?? null,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  /**
   * Find a character by ID.
   */
  findById(id: CharacterId): Character | null {
    const row = this.db.queryOne<CharacterRow>(`SELECT * FROM characters WHERE id = ?`, [id]);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Get all characters.
   */
  findAll(): Character[] {
    const rows = this.db.query<CharacterRow>(`SELECT * FROM characters ORDER BY created_at DESC`);
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Find characters by role.
   */
  findByRole(role: CharacterRole): Character[] {
    const rows = this.db.query<CharacterRow>(
      `SELECT * FROM characters WHERE role = ? ORDER BY created_at DESC`,
      [role]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Update a character.
   */
  update(id: CharacterId, input: UpdateCharacterInput): Character {
    const existing = this.findById(id);
    if (!existing) {
      throw new Error(`Character ${id} not found`);
    }

    const now = this.now();

    // Build dynamic update
    const updates: string[] = ['updated_at = ?'];
    const params: unknown[] = [now];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.role !== undefined) {
      updates.push('role = ?');
      params.push(input.role);
    }
    if (input.appearance !== undefined) {
      updates.push('appearance = ?');
      params.push(input.appearance);
    }
    if (input.voiceSamples !== undefined) {
      updates.push('voice_samples = ?');
      params.push(this.toJson(input.voiceSamples));
    }
    if (input.motivation !== undefined) {
      updates.push('motivation = ?');
      params.push(this.toJson(input.motivation));
    }
    if (input.conflictType !== undefined) {
      updates.push('conflict_type = ?');
      params.push(input.conflictType);
    }
    if (input.template !== undefined) {
      updates.push('template = ?');
      params.push(input.template);
    }
    if (input.facets !== undefined) {
      updates.push('facets = ?');
      params.push(this.toJson(input.facets));
    }
    if (input.arc !== undefined) {
      updates.push('arc = ?');
      params.push(this.toJson(input.arc));
    }
    if (input.firstAppearance !== undefined) {
      updates.push('first_appearance = ?');
      params.push(input.firstAppearance);
    }

    params.push(id);

    this.db.run(`UPDATE characters SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id)!;
  }

  /**
   * Search characters using FTS5.
   *
   * @param query - Search query (supports FTS5 syntax)
   * @returns Matching characters
   */
  search(query: string): Character[] {
    // Escape special FTS5 characters and format query
    const sanitizedQuery = this.sanitizeFtsQuery(query);

    const rows = this.db.query<CharacterRow>(
      `SELECT c.* FROM characters c
       JOIN characters_fts fts ON c.rowid = fts.rowid
       WHERE characters_fts MATCH ?
       ORDER BY rank`,
      [sanitizedQuery]
    );

    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Search characters by name (simple LIKE query).
   * Useful as a fallback if FTS search returns no results.
   */
  searchByName(name: string): Character[] {
    const rows = this.db.query<CharacterRow>(
      `SELECT * FROM characters WHERE name LIKE ? ORDER BY name`,
      [`%${name}%`]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Get characters that appear in a specific chapter.
   */
  findByChapter(chapterId: ChapterId): Character[] {
    // Note: This requires the chapters table to have characters JSON field
    // We'll query based on first_appearance for now
    const rows = this.db.query<CharacterRow>(
      `SELECT * FROM characters WHERE first_appearance = ? ORDER BY name`,
      [chapterId]
    );
    return rows.map((row) => this.mapRow(row));
  }

  /**
   * Sanitize query for FTS5.
   */
  private sanitizeFtsQuery(query: string): string {
    // Remove special FTS5 operators for simple searches
    // For advanced users, we could allow these
    const sanitized = query
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[*^]/g, '') // Remove special operators
      .trim();

    // Add prefix matching for partial word matches
    if (sanitized && !sanitized.includes(' ')) {
      return `${sanitized}*`;
    }

    return sanitized;
  }

  /**
   * Map database row to Character entity.
   */
  private mapRow(row: CharacterRow): Character {
    const character: Character = {
      id: row.id,
      name: row.name,
      role: row.role as CharacterRole,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Only add optional fields if they have values
    if (row.appearance) character.appearance = row.appearance;
    if (row.conflict_type) character.conflictType = row.conflict_type as ConflictType;
    if (row.template) character.template = row.template as CharacterTemplate;
    if (row.first_appearance !== null) character.firstAppearance = Number(row.first_appearance);

    // Parse JSON fields with explicit null checks
    const voiceSamples = this.parseJson<string[]>(row.voice_samples);
    if (voiceSamples) character.voiceSamples = voiceSamples;

    const motivation = this.parseJson<CharacterMotivation>(row.motivation);
    if (motivation) character.motivation = motivation;

    const facets = this.parseJson<CharacterFacets>(row.facets);
    if (facets) character.facets = facets;

    const arc = this.parseJson<CharacterArc>(row.arc);
    if (arc) character.arc = arc;

    return character;
  }
}
