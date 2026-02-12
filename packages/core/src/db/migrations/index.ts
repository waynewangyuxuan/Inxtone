/**
 * Migrations Index
 *
 * Exports all database migrations in order.
 * Add new migrations to the array when created.
 */

import type { Migration } from '../MigrationRunner.js';
import { migration001 } from './001_initial_schema.js';
import { migration002 } from './002_chapter_sort_order.js';

/**
 * All migrations in order of execution.
 * Each migration must have a unique, sequential version number.
 */
export const migrations: Migration[] = [
  migration001,
  migration002,
  // Add new migrations here:
  // migration003,
  // ...
];
