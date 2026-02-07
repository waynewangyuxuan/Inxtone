/**
 * MigrationRunner Tests
 *
 * Tests for the database migration system.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { MigrationRunner, type Migration } from '../../db/MigrationRunner.js';

// Test migrations
const testMigrations: Migration[] = [
  {
    version: 1,
    description: 'Create users table',
    up: `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `,
    down: 'DROP TABLE users;',
  },
  {
    version: 2,
    description: 'Add email to users',
    up: 'ALTER TABLE users ADD COLUMN email TEXT;',
    down: `
      CREATE TABLE users_backup AS SELECT id, name FROM users;
      DROP TABLE users;
      ALTER TABLE users_backup RENAME TO users;
    `,
  },
  {
    version: 3,
    description: 'Create posts table',
    up: `
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title TEXT
      );
    `,
    down: 'DROP TABLE posts;',
  },
];

describe('MigrationRunner', () => {
  let db: Database;
  let runner: MigrationRunner;

  beforeEach(async () => {
    db = new Database({
      path: ':memory:',
      migrate: false,
    });
    await db.connect();

    // Create runner with test migrations
    runner = new MigrationRunner(db);

    // Replace migrations with test migrations
    // Override getAllMigrations for testing
    runner.getAllMigrations = () => testMigrations;
  });

  afterEach(() => {
    if (db.isConnected) {
      db.close();
    }
  });

  // ============================================
  // Migration Status
  // ============================================

  describe('Migration Status', () => {
    it('should return all migrations', () => {
      const all = runner.getAllMigrations();
      expect(all).toHaveLength(3);
    });

    it('should return empty applied versions initially', () => {
      const applied = runner.getAppliedVersions();
      expect(applied).toHaveLength(0);
    });

    it('should return all migrations as pending initially', () => {
      const pending = runner.getPendingMigrations();
      expect(pending).toHaveLength(3);
    });

    it('should get migration status', () => {
      const status = runner.getStatus();

      expect(status.currentVersion).toBe(0);
      expect(status.totalMigrations).toBe(3);
      expect(status.appliedMigrations).toBe(0);
      expect(status.pendingMigrations).toBe(3);
    });
  });

  // ============================================
  // Running Migrations
  // ============================================

  describe('Running Migrations', () => {
    it('should run all pending migrations', async () => {
      const results = await runner.runMigrations();

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify tables exist
      expect(db.tableExists('users')).toBe(true);
      expect(db.tableExists('posts')).toBe(true);

      // Verify schema version
      expect(db.getSchemaVersion()).toBe(3);
    });

    it('should track applied versions', async () => {
      await runner.runMigrations();

      const applied = runner.getAppliedVersions();
      expect(applied).toEqual([1, 2, 3]);
    });

    it('should not re-run applied migrations', async () => {
      await runner.runMigrations();

      // Run again
      const results = await runner.runMigrations();

      expect(results).toHaveLength(0);
    });

    it('should run migrations in order', async () => {
      const results = await runner.runMigrations();

      expect(results[0]!.version).toBe(1);
      expect(results[1]!.version).toBe(2);
      expect(results[2]!.version).toBe(3);
    });

    it('should stop on first error', async () => {
      // Create migration that will fail
      const failingMigrations: Migration[] = [
        testMigrations[0]!,
        {
          version: 2,
          description: 'This will fail',
          up: 'INVALID SQL STATEMENT',
        },
        testMigrations[2]!,
      ];

      // Override getAllMigrations for testing
      runner.getAllMigrations = () => failingMigrations;

      const results = await runner.runMigrations();

      // Should have attempted 2, second one failed
      expect(results).toHaveLength(2);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(false);

      // Third migration should not have run
      expect(db.tableExists('posts')).toBe(false);
    });

    it('should include duration in results', async () => {
      const results = await runner.runMigrations();

      for (const result of results) {
        expect(typeof result.duration).toBe('number');
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================
  // Function-based Migrations
  // ============================================

  describe('Function-based Migrations', () => {
    it('should support function-based migrations', async () => {
      const functionMigration: Migration = {
        version: 1,
        description: 'Function migration',
        up: (database: Database) => {
          database.exec('CREATE TABLE func_test (id INTEGER)');
          database.run('INSERT INTO func_test (id) VALUES (?)', [42]);
        },
        down: (database: Database) => {
          database.exec('DROP TABLE func_test');
        },
      };

      // Override getAllMigrations for testing
      runner.getAllMigrations = () => [functionMigration];

      await runner.runMigrations();

      expect(db.tableExists('func_test')).toBe(true);

      const row = db.queryOne<{ id: number }>('SELECT id FROM func_test');
      expect(row?.id).toBe(42);
    });
  });

  // ============================================
  // Rollback
  // ============================================

  describe('Rollback', () => {
    it('should rollback last migration', async () => {
      await runner.runMigrations();

      expect(db.tableExists('posts')).toBe(true);

      const result = runner.rollbackLast();

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.version).toBe(3);

      expect(db.tableExists('posts')).toBe(false);
      expect(db.getSchemaVersion()).toBe(2);
    });

    it('should return null when no migrations to rollback', () => {
      const result = runner.rollbackLast();
      expect(result).toBeNull();
    });

    it('should throw for migration without rollback', async () => {
      const noDownMigration: Migration = {
        version: 1,
        description: 'No rollback',
        up: 'CREATE TABLE no_down (id INTEGER)',
        // No down property
      };

      // Override getAllMigrations for testing
      runner.getAllMigrations = () => [noDownMigration];

      await runner.runMigrations();

      expect(() => runner.rollbackLast()).toThrow('does not support rollback');
    });

    it('should rollback multiple times', async () => {
      await runner.runMigrations();

      runner.rollbackLast(); // Removes 3
      expect(db.getSchemaVersion()).toBe(2);

      runner.rollbackLast(); // Removes 2
      expect(db.getSchemaVersion()).toBe(1);

      runner.rollbackLast(); // Removes 1
      expect(db.getSchemaVersion()).toBe(0);

      expect(db.tableExists('users')).toBe(false);
    });
  });

  // ============================================
  // Status Report
  // ============================================

  describe('Status Report', () => {
    it('should return accurate status after partial migration', async () => {
      await runner.runMigrations();

      const status = runner.getStatus();

      expect(status.currentVersion).toBe(3);
      expect(status.appliedMigrations).toBe(3);
      expect(status.pendingMigrations).toBe(0);
      expect(status.pending).toHaveLength(0);
    });

    it('should return pending migrations info', () => {
      const status = runner.getStatus();

      expect(status.pending).toHaveLength(3);
      expect(status.pending[0]).toEqual({
        version: 1,
        description: 'Create users table',
      });
    });
  });

  // ============================================
  // Transaction Safety
  // ============================================

  describe('Transaction Safety', () => {
    it('should rollback failed migration atomically', async () => {
      // Create table first
      db.exec('CREATE TABLE existing (id INTEGER)');
      db.run('INSERT INTO existing (id) VALUES (?)', [1]);

      const atomicMigrations: Migration[] = [
        {
          version: 1,
          description: 'Atomic test',
          up: `
            INSERT INTO existing (id) VALUES (2);
            INVALID SQL;
          `,
        },
      ];

      // Override getAllMigrations for testing
      runner.getAllMigrations = () => atomicMigrations;

      await runner.runMigrations();

      // The insert should be rolled back
      const count = db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM existing');
      expect(count?.cnt).toBe(1); // Only original row
    });
  });
});
