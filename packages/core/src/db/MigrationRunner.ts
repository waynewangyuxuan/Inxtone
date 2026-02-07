/**
 * Migration Runner
 *
 * Manages database schema migrations.
 * Migrations are defined as TypeScript/JavaScript files in the migrations directory.
 */

import type { Database } from './Database.js';
import { migrations } from './migrations/index.js';

export interface Migration {
  /** Unique version number (must be sequential) */
  version: number;
  /** Human-readable description */
  description: string;
  /** SQL or function to execute */
  up: string | ((db: Database) => void);
  /** Optional rollback SQL or function */
  down?: string | ((db: Database) => void);
}

export interface MigrationResult {
  version: number;
  description: string;
  success: boolean;
  error?: string;
  duration: number; // ms
}

/**
 * Manages database migrations.
 *
 * Features:
 * - Sequential version-based migrations
 * - Tracks applied migrations in schema_version table
 * - Supports SQL strings or functions
 * - Optional rollback support
 *
 * @example
 * ```typescript
 * const runner = new MigrationRunner(db);
 * const results = await runner.runMigrations();
 *
 * // Check status
 * const pending = runner.getPendingMigrations();
 * console.log(`${pending.length} migrations pending`);
 * ```
 */
export class MigrationRunner {
  private readonly db: Database;

  constructor(db: Database, _migrationsDir = '') {
    this.db = db;
    // migrationsDir reserved for future dynamic migration loading
  }

  /**
   * Get all registered migrations.
   */
  getAllMigrations(): Migration[] {
    return migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Get currently applied migration versions from the database.
   */
  getAppliedVersions(): number[] {
    try {
      const results = this.db.query<{ version: number }>(
        'SELECT version FROM schema_version ORDER BY version ASC'
      );
      return results.map((r) => r.version);
    } catch {
      // Table doesn't exist yet
      return [];
    }
  }

  /**
   * Get migrations that haven't been applied yet.
   */
  getPendingMigrations(): Migration[] {
    const applied = new Set(this.getAppliedVersions());
    return this.getAllMigrations().filter((m) => !applied.has(m.version));
  }

  /**
   * Run all pending migrations.
   *
   * @returns Array of migration results
   */
  runMigrations(): MigrationResult[] {
    const results: MigrationResult[] = [];

    // Ensure schema_version table exists
    this.ensureSchemaVersionTable();

    // Get pending migrations
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      return results;
    }

    // Run each migration in order
    for (const migration of pending) {
      const startTime = Date.now();

      try {
        this.runMigration(migration);

        results.push({
          version: migration.version,
          description: migration.description,
          success: true,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          version: migration.version,
          description: migration.description,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });

        // Stop on first error
        break;
      }
    }

    return results;
  }

  /**
   * Run a single migration.
   */
  private runMigration(migration: Migration): void {
    // Use transaction for atomicity
    const txResult = this.db.transaction(() => {
      // Execute migration
      if (typeof migration.up === 'string') {
        this.db.exec(migration.up);
      } else {
        migration.up(this.db);
      }

      // Record migration
      this.db.setSchemaVersion(migration.version, migration.description);
    });

    if (!txResult.success) {
      throw txResult.error ?? new Error('Transaction failed');
    }
  }

  /**
   * Rollback the last migration.
   *
   * @returns Rollback result
   */
  rollbackLast(): MigrationResult | null {
    const applied = this.getAppliedVersions();

    if (applied.length === 0) {
      return null;
    }

    const lastVersion = applied[applied.length - 1];
    const migration = this.getAllMigrations().find((m) => m.version === lastVersion);

    if (!migration) {
      throw new Error(`Migration ${lastVersion} not found`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${lastVersion} does not support rollback`);
    }

    const startTime = Date.now();

    try {
      const txResult = this.db.transaction(() => {
        // Execute rollback
        if (typeof migration.down === 'string') {
          this.db.exec(migration.down);
        } else if (migration.down) {
          migration.down(this.db);
        }

        // Remove from schema_version
        this.db.run('DELETE FROM schema_version WHERE version = ?', [migration.version]);
      });

      if (!txResult.success) {
        throw txResult.error ?? new Error('Rollback transaction failed');
      }

      return {
        version: migration.version,
        description: migration.description,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        version: migration.version,
        description: migration.description,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Ensure the schema_version table exists.
   */
  private ensureSchemaVersionTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);
  }

  /**
   * Get migration status report.
   */
  getStatus(): {
    currentVersion: number;
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    pending: Array<{ version: number; description: string }>;
  } {
    const all = this.getAllMigrations();
    const applied = this.getAppliedVersions();
    const pending = this.getPendingMigrations();

    return {
      currentVersion: applied.length > 0 ? applied[applied.length - 1]! : 0,
      totalMigrations: all.length,
      appliedMigrations: applied.length,
      pendingMigrations: pending.length,
      pending: pending.map((m) => ({ version: m.version, description: m.description })),
    };
  }
}
