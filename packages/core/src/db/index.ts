/**
 * Database Module
 *
 * Provides SQLite database management for Inxtone.
 *
 * @module db
 */

export { Database } from './Database.js';
export type { DatabaseOptions, TransactionResult } from './Database.js';

export { MigrationRunner } from './MigrationRunner.js';
export type { Migration, MigrationResult } from './MigrationRunner.js';

export { migrations } from './migrations/index.js';

// Repositories
export {
  BaseRepository,
  CharacterRepository,
  RelationshipRepository,
  WorldRepository,
  LocationRepository,
  FactionRepository,
  TimelineEventRepository,
  ArcRepository,
  ForeshadowingRepository,
  HookRepository,
} from './repositories/index.js';
