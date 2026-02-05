#!/usr/bin/env node
import { Command } from 'commander';
import { render } from 'ink';
import { VERSION } from '@inxtone/core';
import { App } from './app.js';

const program = new Command();

program
  .name('inxtone')
  .description('AI-Native Storytelling Framework')
  .version(VERSION);

program
  .command('serve')
  .description('Start HTTP server')
  .option('-p, --port <port>', 'Port number', '3456')
  .option('--no-tui', 'Run in headless mode')
  .action((options: { port: string; tui: boolean }) => {
    // TODO: Implement server startup
    console.log(`Starting server on port ${options.port}...`);
    if (options.tui) {
      render(<App />);
    }
  });

program
  .command('init [name]')
  .description('Create a new project')
  .option('-t, --template <template>', 'Project template')
  .action((name: string | undefined, options: { template?: string }) => {
    // TODO: Implement project initialization
    console.log(`Creating project: ${name ?? 'my-novel'}`);
    if (options.template) {
      console.log(`Using template: ${options.template}`);
    }
  });

// Default action: start TUI mode
program.action(() => {
  render(<App />);
});

program.parse();
