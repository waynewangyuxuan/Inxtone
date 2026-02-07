/**
 * Mock ConfigService
 *
 * In-memory implementation for testing and parallel development.
 * Conforms to IConfigService interface.
 */

import type { IConfigService, ConfigKey } from '../../types/services.js';
import type { Project, ProjectConfig } from '../../types/entities.js';

export class MockConfigService implements IConfigService {
  private project: Project | null = null;
  private config: Map<string, unknown> = new Map();

  constructor() {
    // Set default values
    this.config.set('ai.provider', 'gemini');
    this.config.set('ai.maxContextTokens', 100000);
    this.config.set('export.defaultFormat', 'md');
    this.config.set('writing.autoSaveInterval', 30000);
    this.config.set('quality.enabledRules', ['all']);
  }

  private now(): string {
    return new Date().toISOString();
  }

  // === Project ===

  async getProject(): Promise<Project | null> {
    return this.project;
  }

  async updateProject(config: Partial<ProjectConfig>): Promise<Project> {
    if (!this.project) {
      throw new Error('Project not initialized');
    }

    this.project.config = {
      ...this.project.config,
      ...config,
    };
    this.project.updatedAt = this.now();
    return this.project;
  }

  async initProject(name: string, description?: string): Promise<Project> {
    this.project = {
      id: 'proj_' + Date.now(),
      name,
      description,
      config: {
        ai: {
          provider: 'gemini',
          maxContextTokens: 100000,
        },
        export: {
          defaultFormat: 'md',
        },
      },
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    return this.project;
  }

  // === Config Access ===

  async get<T>(key: ConfigKey): Promise<T | undefined> {
    return this.config.get(key) as T | undefined;
  }

  async set<T>(key: ConfigKey, value: T): Promise<void> {
    this.config.set(key, value);
  }

  async getAll(): Promise<ProjectConfig> {
    const result: ProjectConfig = {};
    for (const [key, value] of this.config) {
      const parts = key.split('.');
      let current: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
    }
    return result;
  }

  async resetToDefaults(): Promise<void> {
    this.config.clear();
    this.config.set('ai.provider', 'gemini');
    this.config.set('ai.maxContextTokens', 100000);
    this.config.set('export.defaultFormat', 'md');
    this.config.set('writing.autoSaveInterval', 30000);
    this.config.set('quality.enabledRules', ['all']);
  }

  // === Test Helpers ===

  /**
   * Reset to initial state
   */
  reset(): void {
    this.project = null;
    this.config.clear();

    // Re-set defaults
    this.config.set('ai.provider', 'gemini');
    this.config.set('ai.maxContextTokens', 100000);
    this.config.set('export.defaultFormat', 'md');
    this.config.set('writing.autoSaveInterval', 30000);
    this.config.set('quality.enabledRules', ['all']);
  }
}
