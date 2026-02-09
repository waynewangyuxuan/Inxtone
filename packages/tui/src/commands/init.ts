/**
 * Init Command
 *
 * Creates a new Inxtone project with database and configuration.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';

export interface InitOptions {
  template?: string;
}

/**
 * Default project configuration
 */
const DEFAULT_CONFIG = `# Inxtone Project Configuration
# See https://github.com/VW-ai/Inxtone for documentation

project:
  name: "{PROJECT_NAME}"
  description: ""
  author: ""

ai:
  provider: gemini
  model: gemini-2.0-flash
  maxContextTokens: 100000

export:
  defaultFormat: md
  includeMetadata: false

rules:
  consistency:
    enabled: true
    severity: warning
  wayne_principles:
    enabled: true
    severity: info
`;

/**
 * Initialize a new Inxtone project
 */
export async function initProject(name: string, options: InitOptions): Promise<void> {
  const projectName = name || 'my-novel';
  const projectPath = path.resolve(process.cwd(), projectName);

  console.log(chalk.cyan('\n📚 Inxtone - Creating new project\n'));

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    const files = fs.readdirSync(projectPath);
    if (files.length > 0) {
      console.log(chalk.yellow(`⚠️  Directory "${projectName}" already exists and is not empty.`));
      console.log(chalk.gray('   Use a different name or clear the directory.\n'));
      process.exitCode = 1;
      return;
    }
  }

  // Create project directory
  console.log(chalk.gray(`   Creating directory: ${projectPath}`));
  fs.mkdirSync(projectPath, { recursive: true });

  // Create subdirectories
  const dirs = ['exports', 'exports/story-bible', 'exports/draft', 'assets'];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  }

  // Create config file
  const configContent = DEFAULT_CONFIG.replace('{PROJECT_NAME}', projectName);
  const configPath = path.join(projectPath, 'inxtone.yaml');
  fs.writeFileSync(configPath, configContent, 'utf-8');
  console.log(chalk.gray(`   Created: inxtone.yaml`));

  // Create database
  const dbPath = path.join(projectPath, 'inxtone.db');
  await initializeDatabase(dbPath);
  console.log(chalk.gray(`   Created: inxtone.db`));

  // Create .gitignore
  const gitignore = `# Inxtone
*.db-journal
*.db-wal
*.db-shm

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
`;
  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore, 'utf-8');
  console.log(chalk.gray(`   Created: .gitignore`));

  // Apply template if specified
  if (options.template) {
    console.log(chalk.gray(`   Applying template: ${options.template}`));
    applyTemplate(projectPath, options.template);
  }

  // Success message
  console.log(chalk.green(`\n✅ Project "${projectName}" created successfully!\n`));
  console.log(chalk.white('   Next steps:'));
  console.log(chalk.gray(`   1. cd ${projectName}`));
  console.log(chalk.gray(`   2. inxtone serve`));
  console.log(chalk.gray(`   3. Open http://localhost:3456 in your browser\n`));
}

/**
 * Initialize the SQLite database with schema
 */
async function initializeDatabase(dbPath: string): Promise<void> {
  // Dynamic import to avoid loading better-sqlite3 if not needed
  const { Database } = await import('@inxtone/core/db');

  const db = new Database({
    path: dbPath,
    migrate: true, // Run migrations to create schema
  });

  db.connect();

  // Insert default project record
  db.run(`INSERT INTO project (id, name, description) VALUES (?, ?, ?)`, [
    'main',
    path.basename(path.dirname(dbPath)),
    '',
  ]);

  // Insert default world record
  db.run(`INSERT INTO world (id) VALUES (?)`, ['main']);

  db.close();
}

/**
 * Apply a project template
 */
function applyTemplate(_projectPath: string, templateName: string): void {
  // TODO: Implement template loading from ~/.inxtone/templates/
  // For now, just show a message
  const templatePath = path.join(process.env.HOME ?? '~', '.inxtone', 'templates', templateName);

  if (!fs.existsSync(templatePath)) {
    console.log(chalk.yellow(`   ⚠️  Template "${templateName}" not found at ${templatePath}`));
    console.log(chalk.gray(`   Available templates: default`));
    return;
  }

  // Template application would go here
  console.log(chalk.gray(`   Template "${templateName}" applied.`));
}
