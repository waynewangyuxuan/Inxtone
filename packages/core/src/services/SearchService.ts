/**
 * SearchService — Full-text search across all entity types via unified search_index.
 *
 * Uses FTS5 with BM25 ranking and snippet generation.
 * Semantic search methods are stubs (deferred to M7).
 */

import type { Database } from '../db/Database.js';
import type { ISearchService, SearchResultItem, SearchOptions } from '../types/services.js';

/** Raw FTS5 result row */
interface SearchRow {
  entity_type: string;
  entity_id: string;
  title: string;
  highlight: string;
  rank: number;
}

export class SearchService implements ISearchService {
  constructor(private db: Database) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResultItem[]> {
    return this.fullTextSearch(query, options);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fullTextSearch(query: string, options?: SearchOptions): Promise<SearchResultItem[]> {
    const sanitized = this.sanitizeFtsQuery(query);
    if (!sanitized) return [];

    const limit = options?.limit ?? 20;
    const entityTypes = options?.entityTypes;

    let sql = `
      SELECT
        entity_type,
        entity_id,
        title,
        snippet(search_index, 1, '<mark>', '</mark>', '...', 32) as highlight,
        rank
      FROM search_index
      WHERE search_index MATCH ?
    `;
    const params: unknown[] = [sanitized];

    if (entityTypes && entityTypes.length > 0) {
      const placeholders = entityTypes.map(() => '?').join(',');
      sql += ` AND entity_type IN (${placeholders})`;
      params.push(...entityTypes);
    }

    sql += ` ORDER BY rank LIMIT ?`;
    params.push(limit);

    const rows = this.db.query<SearchRow>(sql, params);

    return rows.map((row) => ({
      entityType: row.entity_type as SearchResultItem['entityType'],
      entityId: row.entity_id,
      title: row.title,
      highlight: row.highlight,
      score: this.normalizeRank(row.rank),
    }));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async semanticSearch(): Promise<SearchResultItem[]> {
    // Deferred to M7
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findSimilar(): Promise<SearchResultItem[]> {
    // Deferred to M7
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateIndex(entityType: string, entityId: string): Promise<void> {
    // Triggers handle this automatically; manual update available if needed
    this.db.run(`DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?`, [
      entityType,
      entityId,
    ]);
    // Re-insert would need entity-specific logic; triggers handle this on source table updates
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async removeFromIndex(entityType: string, entityId: string): Promise<void> {
    this.db.run(`DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?`, [
      entityType,
      entityId,
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async rebuildIndexes(): Promise<void> {
    // Clear and repopulate from source tables
    this.db.run(`DELETE FROM search_index`);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT name, COALESCE(appearance, ''), 'character', id FROM characters
    `);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT COALESCE(title, ''), COALESCE(content, ''), 'chapter', CAST(id AS TEXT) FROM chapters
    `);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT name, COALESCE(significance, '') || ' ' || COALESCE(atmosphere, ''), 'location', id FROM locations
    `);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT name, COALESCE(internal_conflict, '') || ' ' || COALESCE(stance_to_mc, ''), 'faction', id FROM factions
    `);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT name, COALESCE(type, ''), 'arc', id FROM arcs
    `);
    this.db.run(`
      INSERT INTO search_index(title, body, entity_type, entity_id)
        SELECT content, COALESCE(planted_text, ''), 'foreshadowing', id FROM foreshadowing
    `);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getIndexStats(): Promise<{
    totalDocuments: number;
    totalEmbeddings: number;
    lastUpdated: string;
  }> {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_index`
    );
    return {
      totalDocuments: result?.count ?? 0,
      totalEmbeddings: 0, // No embeddings yet
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Sanitize query for FTS5 — escapes special operators, adds prefix matching.
   * Reuses the pattern from CharacterRepository.
   */
  private sanitizeFtsQuery(query: string): string {
    const sanitized = query.replace(/['"]/g, '').replace(/[*^]/g, '').trim();

    if (!sanitized) return '';

    // Add prefix matching for single-word queries
    if (!sanitized.includes(' ')) {
      return `${sanitized}*`;
    }

    return sanitized;
  }

  /**
   * Normalize FTS5 rank (negative BM25 score) to a 0-1 relevance score.
   * FTS5 rank is negative; more negative = better match.
   */
  private normalizeRank(rank: number): number {
    // rank is typically negative; convert to 0-1 where 1 is best
    return Math.max(0, Math.min(1, 1 / (1 + Math.abs(rank))));
  }
}
