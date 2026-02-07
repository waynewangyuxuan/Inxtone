/**
 * Database Module
 *
 * SQLite database wrapper using better-sqlite3.
 * Provides connection management, migration support, and common utilities.
 */

import BetterSqlite3 from 'better-sqlite3';
import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import { MigrationRunner } from './MigrationRunner.js';

export interface DatabaseOptions {
  /** Path to SQLite database file, or ':memory:' for in-memory database */
  path: string;
  /** Enable WAL mode for better concurrent access (default: true) */
  wal?: boolean;
  /** Enable foreign key constraints (default: true) */
  foreignKeys?: boolean;
  /** Run migrations on connection (default: true) */
  migrate?: boolean;
  /** Custom migrations directory */
  migrationsDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

export interface TransactionResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
}

/**
 * Database wrapper providing SQLite connection management and utilities.
 *
 * Features:
 * - Connection management (open/close)
 * - Automatic migration on connection
 * - Transaction support
 * - Common query helpers
 *
 * @example
 * ```typescript
 * const db = new Database({ path: './myproject.db' });
 * await db.connect();
 *
 * // Use the database
 * const chapters = db.query<Chapter>('SELECT * FROM chapters');
 *
 * // Transactions
 * db.transaction(() => {
 *   db.run('INSERT INTO chapters (title) VALUES (?)', ['Chapter 1']);
 *   db.run('INSERT INTO chapters (title) VALUES (?)', ['Chapter 2']);
 * });
 *
 * db.close();
 * ```
 */
export class Database {
  private db: BetterSqlite3Database | null = null;
  private readonly options: Required<DatabaseOptions>;
  private migrationRunner: MigrationRunner | null = null;

  constructor(options: DatabaseOptions) {
    this.options = {
      path: options.path,
      wal: options.wal ?? true,
      foreignKeys: options.foreignKeys ?? true,
      migrate: options.migrate ?? true,
      migrationsDir: options.migrationsDir ?? '',
      verbose: options.verbose ?? false,
    };
  }

  /**
   * Connect to the database and optionally run migrations.
   */
  connect(): void {
    if (this.db) {
      return; // Already connected
    }

    // Create database connection
    this.db = new BetterSqlite3(this.options.path, {
      verbose: this.options.verbose ? console.log : undefined,
    });

    // Configure database
    if (this.options.foreignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    if (this.options.wal && this.options.path !== ':memory:') {
      this.db.pragma('journal_mode = WAL');
    }

    // Run migrations if enabled
    if (this.options.migrate) {
      this.migrationRunner = new MigrationRunner(this, this.options.migrationsDir);
      this.migrationRunner.runMigrations();
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get the underlying better-sqlite3 database instance.
   * Throws if not connected.
   */
  get connection(): BetterSqlite3Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Check if database is connected.
   */
  get isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Execute a SQL statement that doesn't return data (INSERT, UPDATE, DELETE, CREATE, etc.).
   *
   * @param sql - SQL statement
   * @param params - Parameters for prepared statement
   * @returns Run result with changes count and lastInsertRowid
   */
  run(sql: string, params: unknown[] = []): BetterSqlite3.RunResult {
    return this.connection.prepare(sql).run(...params);
  }

  /**
   * Execute a SQL query and return all matching rows.
   *
   * @param sql - SQL query
   * @param params - Parameters for prepared statement
   * @returns Array of rows
   */
  query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    return this.connection.prepare(sql).all(...params) as T[];
  }

  /**
   * Execute a SQL query and return the first matching row.
   *
   * @param sql - SQL query
   * @param params - Parameters for prepared statement
   * @returns First row or undefined
   */
  queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    return this.connection.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Execute multiple statements in a transaction.
   * Automatically rolls back on error.
   *
   * @param fn - Function containing database operations
   * @returns Transaction result with success status and optional result/error
   */
  transaction<T>(fn: () => T): TransactionResult<T> {
    const transaction = this.connection.transaction(fn);

    try {
      const result = transaction();
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Execute multiple statements in a transaction (sync version that throws on error).
   *
   * @param fn - Function containing database operations
   * @returns Result of the function
   * @throws Error if transaction fails
   */
  transactionSync<T>(fn: () => T): T {
    return this.connection.transaction(fn)();
  }

  /**
   * Execute raw SQL (multiple statements).
   * Useful for running migration scripts.
   *
   * @param sql - SQL statements
   */
  exec(sql: string): void {
    this.connection.exec(sql);
  }

  /**
   * Get the current schema version from the database.
   *
   * @returns Current schema version number, or 0 if not initialized
   */
  getSchemaVersion(): number {
    try {
      const result = this.queryOne<{ version: number }>(
        'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
      );
      return result?.version ?? 0;
    } catch {
      // Table doesn't exist yet
      return 0;
    }
  }

  /**
   * Set the schema version.
   *
   * @param version - Version number
   * @param description - Description of the migration
   */
  setSchemaVersion(version: number, description: string): void {
    this.run('INSERT INTO schema_version (version, description) VALUES (?, ?)', [
      version,
      description,
    ]);
  }

  /**
   * Check if a table exists in the database.
   *
   * @param tableName - Name of the table
   * @returns True if table exists
   */
  tableExists(tableName: string): boolean {
    const result = this.queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return (result?.count ?? 0) > 0;
  }

  /**
   * Get all table names in the database.
   *
   * @returns Array of table names
   */
  getTables(): string[] {
    const results = this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    return results.map((r) => r.name);
  }

  /**
   * Get column information for a table.
   *
   * @param tableName - Name of the table
   * @returns Array of column info
   */
  getTableInfo(tableName: string): Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: unknown;
    pk: number;
  }> {
    return this.query(`PRAGMA table_info(${tableName})`);
  }

  /**
   * Backup database to a file.
   *
   * @param destinationPath - Path to backup file
   */
  async backup(destinationPath: string): Promise<void> {
    await this.connection.backup(destinationPath);
  }

  /**
   * Vacuum the database to reclaim space.
   */
  vacuum(): void {
    this.exec('VACUUM');
  }

  /**
   * Analyze the database to update query planner statistics.
   */
  analyze(): void {
    this.exec('ANALYZE');
  }
}
