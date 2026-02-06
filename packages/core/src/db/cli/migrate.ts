#!/usr/bin/env tsx
/**
 * Database Migration CLI
 *
 * Usage:
 *   pnpm db:migrate [options]
 *
 * Options:
 *   --path <path>    Database file path (default: ./inxtone.db)
 *   --status         Show migration status without running
 *   --rollback       Rollback the last migration
 *   --help           Show help
 */

import { Database } from '../Database.js';
import { MigrationRunner } from '../MigrationRunner.js';

const args = process.argv.slice(2);

// Parse arguments
const options = {
  path: './inxtone.db',
  status: false,
  rollback: false,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--status' || arg === '-s') {
    options.status = true;
  } else if (arg === '--rollback' || arg === '-r') {
    options.rollback = true;
  } else if (arg === '--path' || arg === '-p') {
    options.path = args[++i] ?? options.path;
  }
}

// Show help
if (options.help) {
  console.log(`
Database Migration CLI

Usage:
  pnpm db:migrate [options]

Options:
  --path, -p <path>    Database file path (default: ./inxtone.db)
  --status, -s         Show migration status without running
  --rollback, -r       Rollback the last migration
  --help, -h           Show this help message

Examples:
  pnpm db:migrate                    # Run pending migrations
  pnpm db:migrate --status           # Show migration status
  pnpm db:migrate --rollback         # Rollback last migration
  pnpm db:migrate --path ./test.db   # Use specific database file
`);
  process.exit(0);
}

// Run migration
function main() {
  console.log(`\n📦 Inxtone Database Migration`);
  console.log(`   Database: ${options.path}\n`);

  const db = new Database({
    path: options.path,
    migrate: false, // We'll run manually
  });

  try {
    db.connect();
    const runner = new MigrationRunner(db);

    if (options.status) {
      // Show status
      const status = runner.getStatus();

      console.log(`📊 Migration Status:`);
      console.log(`   Current version: ${status.currentVersion}`);
      console.log(`   Applied: ${status.appliedMigrations}/${status.totalMigrations}`);

      if (status.pendingMigrations > 0) {
        console.log(`\n⏳ Pending migrations:`);
        for (const pending of status.pending) {
          console.log(`   • [${pending.version}] ${pending.description}`);
        }
      } else {
        console.log(`\n✅ All migrations applied!`);
      }
    } else if (options.rollback) {
      // Rollback
      console.log(`⏪ Rolling back last migration...`);

      const result = runner.rollbackLast();

      if (!result) {
        console.log(`   No migrations to rollback.`);
      } else if (result.success) {
        console.log(`   ✅ Rolled back: [${result.version}] ${result.description}`);
        console.log(`      Duration: ${result.duration}ms`);
      } else {
        console.log(`   ❌ Failed: [${result.version}] ${result.description}`);
        console.log(`      Error: ${result.error}`);
        process.exitCode = 1;
      }
    } else {
      // Run migrations
      console.log(`🚀 Running migrations...`);

      const results = runner.runMigrations();

      if (results.length === 0) {
        console.log(`   No pending migrations.`);
      } else {
        let hasErrors = false;

        for (const result of results) {
          if (result.success) {
            console.log(`   ✅ [${result.version}] ${result.description} (${result.duration}ms)`);
          } else {
            console.log(`   ❌ [${result.version}] ${result.description}`);
            console.log(`      Error: ${result.error}`);
            hasErrors = true;
          }
        }

        if (hasErrors) {
          process.exitCode = 1;
        } else {
          console.log(`\n✅ All migrations completed successfully!`);
        }
      }
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }

  console.log('');
}

main();
