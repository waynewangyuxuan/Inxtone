/**
 * Inxtone CLI
 *
 * AI-Native Storytelling Framework
 *
 * Usage:
 *   inxtone                    # Start TUI mode
 *   inxtone serve              # Start HTTP server + TUI
 *   inxtone serve --no-tui     # Start HTTP server only (headless)
 *   inxtone init [name]        # Create a new project
 *   inxtone --version          # Show version
 *   inxtone --help             # Show help
 */

import { Command } from 'commander';
import { render } from 'ink';
import { VERSION } from '@inxtone/core';
import { App } from './app.js';
import { initProject, serve } from './commands/index.js';

const program = new Command();

program
  .name('inxtone')
  .description(
    'AI-Native Storytelling Framework - Local-first CLI + Web UI for serial fiction writers'
  )
  .version(VERSION, '-v, --version', 'Output the current version');

// Serve command
program
  .command('serve')
  .description('Start HTTP server for Web GUI')
  .option('-p, --port <port>', 'Port number', '3456')
  .option('--no-tui', 'Run in headless mode (no TUI)')
  .action(async (options: { port: string; tui: boolean }) => {
    await serve(options);
  });

// Init command
program
  .command('init [name]')
  .description('Create a new Inxtone project')
  .option('-t, --template <template>', 'Use a project template (e.g., xiuxian)')
  .action(async (name: string | undefined, options: { template?: string }) => {
    await initProject(name ?? 'my-novel', options);
  });

// Default action: start TUI mode
program.action(() => {
  render(<App />);
});

// Parse and run
program.parse();
