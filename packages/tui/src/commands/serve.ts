/**
 * Serve Command
 *
 * Starts the HTTP server and optionally the TUI interface.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { render, type Instance } from 'ink';
import React from 'react';
import { App } from '../app.js';

export interface ServeOptions {
  port: string;
  tui: boolean;
}

/**
 * Check if current directory is an Inxtone project
 */
function isInxtoneProject(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, 'inxtone.db')) || fs.existsSync(path.join(dir, 'inxtone.yaml'))
  );
}

/**
 * Start the Inxtone server
 */
export async function serve(options: ServeOptions): Promise<void> {
  const port = parseInt(options.port, 10);
  const cwd = process.cwd();

  console.log(chalk.cyan('\n📚 Inxtone Server\n'));

  // Check if we're in an Inxtone project
  if (!isInxtoneProject(cwd)) {
    console.log(chalk.yellow('⚠️  No Inxtone project found in current directory.'));
    console.log(chalk.gray('   Run "inxtone init" to create a new project, or'));
    console.log(chalk.gray('   navigate to an existing project directory.\n'));

    // Still allow running for development
    console.log(chalk.gray('   Starting server anyway (development mode)...\n'));
  }

  // Dynamic import of server to avoid loading Fastify if not needed
  const { createServer } = await import('@inxtone/server');

  try {
    const server = await createServer({ port });

    // Start listening
    await server.listen({ port, host: '0.0.0.0' });

    console.log(chalk.green(`✅ Server running at http://localhost:${port}`));
    console.log(chalk.gray(`   Health check: http://localhost:${port}/api/health\n`));

    // Start TUI if enabled
    let inkInstance: Instance | null = null;

    if (options.tui) {
      console.log(chalk.gray('   Starting TUI interface...\n'));

      // Clear console and render TUI
      console.clear();
      inkInstance = render(React.createElement(App));
    } else {
      console.log(chalk.gray('   Running in headless mode (--no-tui)'));
      console.log(chalk.gray('   Press Ctrl+C to stop the server.\n'));
    }

    // Handle shutdown
    const shutdown = async () => {
      console.log(chalk.gray('\n\n   Shutting down...'));

      if (inkInstance) {
        inkInstance.unmount();
      }

      await server.close();
      console.log(chalk.green('   Server stopped.\n'));
      process.exit(0);
    };

    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to start server:`));
    console.error(chalk.gray(`   ${error instanceof Error ? error.message : error}\n`));
    process.exitCode = 1;
  }
}
