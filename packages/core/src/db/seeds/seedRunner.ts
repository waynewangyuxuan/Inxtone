/**
 * Seed Runner - Executes raw SQL seed files against the database
 *
 * Uses pre-built SQL seed files (exported as TS string constants)
 * to populate the database with demo data including all Story Bible
 * entities, volumes, and chapters with full content.
 */

import type { Database } from '../Database.js';
import { seedSqlEn } from './sql-en.js';
import { seedSqlZh } from './sql-zh.js';

export type SeedLang = 'en' | 'zh';

/**
 * Run seed with raw SQL.
 * The SQL files include their own cleanup (DELETE FROM) statements,
 * so this effectively replaces existing demo data.
 *
 * FK enforcement is temporarily disabled because seeds have circular
 * dependencies (characters.faction_id ↔ factions.leader_id) that
 * cannot be satisfied in a single-pass insert order.
 */
export function runSeed(db: Database, lang: SeedLang): void {
  const sql = lang === 'en' ? seedSqlEn : seedSqlZh;
  db.connection.pragma('foreign_keys = OFF');
  try {
    db.exec(sql);
  } finally {
    db.connection.pragma('foreign_keys = ON');
  }
}

/**
 * Clear all content data from the database.
 * Deletes from all content tables in dependency order.
 */
export function clearAllData(db: Database): void {
  db.exec(`
    DELETE FROM hooks;
    DELETE FROM foreshadowing;
    DELETE FROM timeline_events;
    DELETE FROM factions;
    DELETE FROM arcs;
    DELETE FROM relationships;
    DELETE FROM locations;
    DELETE FROM characters;
    DELETE FROM world;
    DELETE FROM versions;
    DELETE FROM chapters;
    DELETE FROM volumes;
  `);
}

/**
 * Check if the database has any content data.
 */
export function isDatabaseEmpty(db: Database): boolean {
  const row = db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM characters');
  const chapterRow = db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM chapters');
  return (row?.cnt ?? 0) === 0 && (chapterRow?.cnt ?? 0) === 0;
}
