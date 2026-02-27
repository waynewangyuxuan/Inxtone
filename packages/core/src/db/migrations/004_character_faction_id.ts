/**
 * Migration 004: Add faction_id to characters table.
 *
 * Enables direct character→faction membership lookup, which was previously
 * impossible because the only link was faction.leader_id (faction→character).
 * Without this field the "By Faction" colour mode in RelationshipMap can only
 * colour faction leaders; all other members fall back to role colour.
 */

import type { Migration } from '../MigrationRunner.js';

export const migration004: Migration = {
  version: 4,
  description: 'Add faction_id column to characters table',
  up: `
ALTER TABLE characters ADD COLUMN faction_id TEXT REFERENCES factions(id) ON DELETE SET NULL;
CREATE INDEX idx_characters_faction_id ON characters(faction_id);
  `.trim(),

  down: `
DROP INDEX IF EXISTS idx_characters_faction_id;
  `.trim(),
  // SQLite does not support DROP COLUMN in older versions; the column is left
  // in place on rollback but is harmless without the index.
};
