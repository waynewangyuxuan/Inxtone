/**
 * Migrations Index
 *
 * Exports all database migrations in order.
 * Add new migrations to the array when created.
 */

import type { Migration } from '../MigrationRunner.js';
import { migration001 } from './001_initial_schema.js';

/**
 * All migrations in order of execution.
 * Each migration must have a unique, sequential version number.
 */
export const migrations: Migration[] = [
  migration001,
  // Add new migrations here:
  // migration002,
  // migration003,
  // ...
];
