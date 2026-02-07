/**
 * Database Tests
 *
 * Tests for the Database class functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';

describe('Database', () => {
  let db: Database;

  beforeEach(async () => {
    db = new Database({
      path: ':memory:',
      migrate: false, // Manual control for tests
    });
    await db.connect();
  });

  afterEach(() => {
    if (db.isConnected) {
      db.close();
    }
  });

  // ============================================
  // Connection Management
  // ============================================

  describe('Connection', () => {
    it('should connect to in-memory database', () => {
      expect(db.isConnected).toBe(true);
    });

    it('should close database connection', () => {
      db.close();
      expect(db.isConnected).toBe(false);
    });

    it('should throw when accessing connection without connecting', () => {
      const newDb = new Database({ path: ':memory:', migrate: false });
      expect(() => newDb.connection).toThrow('Database not connected');
    });

    it('should not reconnect if already connected', async () => {
      const conn1 = db.connection;
      await db.connect();
      const conn2 = db.connection;
      expect(conn1).toBe(conn2);
    });
  });

  // ============================================
  // Query Operations
  // ============================================

  describe('Query Operations', () => {
    beforeEach(() => {
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT, value INTEGER)');
    });

    it('should run INSERT statements', () => {
      const result = db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 42]);

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);
    });

    it('should query all rows', () => {
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 1]);
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['bar', 2]);

      const rows = db.query<{ id: number; name: string; value: number }>('SELECT * FROM test');

      expect(rows).toHaveLength(2);
      expect(rows[0]!.name).toBe('foo');
      expect(rows[1]!.name).toBe('bar');
    });

    it('should query with parameters', () => {
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 1]);
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['bar', 2]);

      const rows = db.query<{ name: string }>('SELECT name FROM test WHERE value > ?', [1]);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.name).toBe('bar');
    });

    it('should query one row', () => {
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 42]);

      const row = db.queryOne<{ name: string; value: number }>(
        'SELECT name, value FROM test WHERE id = ?',
        [1]
      );

      expect(row).toBeDefined();
      expect(row?.name).toBe('foo');
      expect(row?.value).toBe(42);
    });

    it('should return undefined for non-existent row', () => {
      const row = db.queryOne('SELECT * FROM test WHERE id = ?', [999]);
      expect(row).toBeUndefined();
    });

    it('should execute UPDATE statements', () => {
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 1]);

      const result = db.run('UPDATE test SET value = ? WHERE name = ?', [100, 'foo']);

      expect(result.changes).toBe(1);

      const row = db.queryOne<{ value: number }>('SELECT value FROM test WHERE name = ?', ['foo']);
      expect(row?.value).toBe(100);
    });

    it('should execute DELETE statements', () => {
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['foo', 1]);
      db.run('INSERT INTO test (name, value) VALUES (?, ?)', ['bar', 2]);

      const result = db.run('DELETE FROM test WHERE name = ?', ['foo']);

      expect(result.changes).toBe(1);

      const rows = db.query('SELECT * FROM test');
      expect(rows).toHaveLength(1);
    });
  });

  // ============================================
  // Transactions
  // ============================================

  describe('Transactions', () => {
    beforeEach(() => {
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value INTEGER)');
    });

    it('should commit successful transaction', () => {
      const result = db.transaction(() => {
        db.run('INSERT INTO test (value) VALUES (?)', [1]);
        db.run('INSERT INTO test (value) VALUES (?)', [2]);
        return 'done';
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('done');

      const rows = db.query('SELECT * FROM test');
      expect(rows).toHaveLength(2);
    });

    it('should rollback failed transaction', () => {
      const result = db.transaction(() => {
        db.run('INSERT INTO test (value) VALUES (?)', [1]);
        throw new Error('Intentional error');
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Intentional error');

      const rows = db.query('SELECT * FROM test');
      expect(rows).toHaveLength(0);
    });

    it('should execute transactionSync successfully', () => {
      const result = db.transactionSync(() => {
        db.run('INSERT INTO test (value) VALUES (?)', [42]);
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should throw on transactionSync error', () => {
      expect(() => {
        db.transactionSync(() => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });
  });

  // ============================================
  // Schema Utilities
  // ============================================

  describe('Schema Utilities', () => {
    it('should check if table exists', () => {
      expect(db.tableExists('nonexistent')).toBe(false);

      db.exec('CREATE TABLE test_table (id INTEGER)');

      expect(db.tableExists('test_table')).toBe(true);
    });

    it('should get all table names', () => {
      db.exec('CREATE TABLE alpha (id INTEGER)');
      db.exec('CREATE TABLE beta (id INTEGER)');

      const tables = db.getTables();

      expect(tables).toContain('alpha');
      expect(tables).toContain('beta');
    });

    it('should get table info', () => {
      db.exec(`
        CREATE TABLE test_info (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          value REAL
        )
      `);

      const info = db.getTableInfo('test_info');

      expect(info).toHaveLength(3);
      expect(info[0]!.name).toBe('id');
      expect(info[0]!.pk).toBe(1);
      expect(info[1]!.name).toBe('name');
      expect(info[1]!.notnull).toBe(1);
      expect(info[2]!.name).toBe('value');
    });

    it('should get schema version', () => {
      // Initially 0 (no schema_version table)
      expect(db.getSchemaVersion()).toBe(0);

      // Create schema_version table and insert
      db.exec(`
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        )
      `);
      db.run('INSERT INTO schema_version (version, description) VALUES (?, ?)', [
        1,
        'Initial schema',
      ]);

      expect(db.getSchemaVersion()).toBe(1);
    });

    it('should set schema version', () => {
      db.exec(`
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        )
      `);

      db.setSchemaVersion(5, 'Test migration');

      const row = db.queryOne<{ version: number; description: string }>(
        'SELECT version, description FROM schema_version WHERE version = 5'
      );

      expect(row?.version).toBe(5);
      expect(row?.description).toBe('Test migration');
    });
  });

  // ============================================
  // Exec (Raw SQL)
  // ============================================

  describe('Exec', () => {
    it('should execute multiple statements', () => {
      db.exec(`
        CREATE TABLE t1 (id INTEGER);
        CREATE TABLE t2 (id INTEGER);
        INSERT INTO t1 VALUES (1);
        INSERT INTO t2 VALUES (2);
      `);

      expect(db.tableExists('t1')).toBe(true);
      expect(db.tableExists('t2')).toBe(true);

      const r1 = db.queryOne<{ id: number }>('SELECT id FROM t1');
      const r2 = db.queryOne<{ id: number }>('SELECT id FROM t2');

      expect(r1?.id).toBe(1);
      expect(r2?.id).toBe(2);
    });
  });

  // ============================================
  // Foreign Keys
  // ============================================

  describe('Foreign Keys', () => {
    it('should enforce foreign key constraints', () => {
      db.exec(`
        CREATE TABLE parent (id INTEGER PRIMARY KEY);
        CREATE TABLE child (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER REFERENCES parent(id)
        );
      `);

      // Insert parent
      db.run('INSERT INTO parent (id) VALUES (?)', [1]);

      // Insert child with valid parent
      db.run('INSERT INTO child (id, parent_id) VALUES (?, ?)', [1, 1]);

      // Insert child with invalid parent should fail
      expect(() => {
        db.run('INSERT INTO child (id, parent_id) VALUES (?, ?)', [2, 999]);
      }).toThrow();
    });
  });
});
