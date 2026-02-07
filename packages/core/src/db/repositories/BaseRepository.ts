/**
 * BaseRepository - Abstract base class for all repositories
 *
 * Provides common functionality for CRUD operations on SQLite.
 */

import type { Database } from '../Database.js';
import type { ISODateTime } from '../../types/entities.js';

/**
 * Abstract base repository providing common database operations.
 *
 * @typeParam T - Entity type
 * @typeParam ID - Entity ID type (string for prefixed IDs, number for auto-increment)
 */
export abstract class BaseRepository<_T, ID> {
  constructor(
    protected db: Database,
    protected tableName: string
  ) {}

  /**
   * Get current ISO datetime string.
   */
  protected now(): ISODateTime {
    return new Date().toISOString();
  }

  /**
   * Generate a prefixed ID (e.g., C001, L001, F001).
   *
   * @param prefix - ID prefix (e.g., 'C', 'L', 'F')
   * @param padLength - Number of digits to pad (default: 3)
   * @returns Generated ID string
   */
  protected generatePrefixedId(prefix: string, padLength = 3): string {
    const result = this.db.queryOne<{ maxNum: number | null }>(
      `SELECT MAX(CAST(SUBSTR(id, ${prefix.length + 1}) AS INTEGER)) as maxNum FROM ${this.tableName}`
    );
    const nextNum = (result?.maxNum ?? 0) + 1;
    return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
  }

  /**
   * Parse JSON field safely.
   *
   * @param value - JSON string or null
   * @returns Parsed value or undefined
   */
  protected parseJson<R>(value: string | null | undefined): R | undefined {
    if (!value) return undefined;
    try {
      return JSON.parse(value) as R;
    } catch {
      return undefined;
    }
  }

  /**
   * Stringify value for JSON storage.
   *
   * @param value - Value to stringify
   * @returns JSON string or null
   */
  protected toJson<R>(value: R | undefined): string | null {
    if (value === undefined || value === null) return null;
    return JSON.stringify(value);
  }

  /**
   * Count all records in the table.
   */
  count(): number {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count ?? 0;
  }

  /**
   * Check if a record exists by ID.
   */
  exists(id: ID): boolean {
    const result = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`,
      [id as unknown]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Delete a record by ID.
   * Returns true if a record was deleted.
   */
  delete(id: ID): boolean {
    const result = this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id as unknown]);
    return result.changes > 0;
  }
}
