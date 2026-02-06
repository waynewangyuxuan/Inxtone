/**
 * Contract Tests for IConfigService
 *
 * These tests verify that implementations conform to the interface contract.
 * They test return value structures, not implementation details.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockConfigService } from '../mocks/MockConfigService.js';
import type { IConfigService } from '../../types/services.js';

describe('IConfigService Contract', () => {
  let service: IConfigService;

  beforeEach(() => {
    service = new MockConfigService();
  });

  describe('Project Operations', () => {
    it('getProject returns null before initialization', async () => {
      const project = await service.getProject();
      expect(project).toBeNull();
    });

    it('initProject returns a Project with required fields', async () => {
      const project = await service.initProject('Test Project', 'A test project');

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name', 'Test Project');
      expect(project).toHaveProperty('description', 'A test project');
      expect(project).toHaveProperty('config');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
    });

    it('initProject works without description', async () => {
      const project = await service.initProject('Minimal Project');

      expect(project.name).toBe('Minimal Project');
      expect(project.description).toBeUndefined();
    });

    it('getProject returns initialized project', async () => {
      await service.initProject('My Project');
      const project = await service.getProject();

      expect(project).not.toBeNull();
      expect(project!.name).toBe('My Project');
    });

    it('updateProject updates project config', async () => {
      await service.initProject('Test Project');

      const updated = await service.updateProject({
        ai: {
          provider: 'openai',
          maxContextTokens: 50000,
        },
      });

      expect(updated.config.ai).toEqual({
        provider: 'openai',
        maxContextTokens: 50000,
      });
    });

    it('updateProject throws if project not initialized', async () => {
      await expect(service.updateProject({ ai: { provider: 'openai' } })).rejects.toThrow();
    });

    it('updateProject updates timestamp', async () => {
      const initial = await service.initProject('Test Project');
      const initialTime = new Date(initial.updatedAt).getTime();

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await service.updateProject({
        export: { defaultFormat: 'txt' },
      });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(initialTime);
    });
  });

  describe('Config Access', () => {
    it('get returns undefined for non-existent key', async () => {
      const value = await service.get('ui.theme');
      // May return undefined or default depending on implementation
      expect(value === undefined || typeof value === 'string').toBe(true);
    });

    it('get returns value for existing key', async () => {
      await service.set('ai.provider', 'claude');
      const value = await service.get<string>('ai.provider');

      expect(value).toBe('claude');
    });

    it('set stores value correctly', async () => {
      await service.set('ai.maxContextTokens', 200000);
      const value = await service.get<number>('ai.maxContextTokens');

      expect(value).toBe(200000);
    });

    it('set overwrites existing value', async () => {
      await service.set('export.defaultFormat', 'md');
      await service.set('export.defaultFormat', 'docx');
      const value = await service.get<string>('export.defaultFormat');

      expect(value).toBe('docx');
    });

    it('getAll returns all configuration', async () => {
      await service.set('ai.provider', 'gemini');
      await service.set('export.defaultFormat', 'pdf');

      const config = await service.getAll();

      expect(config).toHaveProperty('ai');
      expect(config).toHaveProperty('export');
    });

    it('getAll returns nested structure', async () => {
      await service.set('ai.provider', 'gemini');
      await service.set('ai.maxContextTokens', 100000);

      const config = await service.getAll();

      expect(config.ai).toEqual(
        expect.objectContaining({
          provider: 'gemini',
          maxContextTokens: 100000,
        })
      );
    });
  });

  describe('Reset Operations', () => {
    it('resetToDefaults restores default values', async () => {
      // Change some values
      await service.set('ai.provider', 'custom');
      await service.set('ai.maxContextTokens', 999999);

      // Reset
      await service.resetToDefaults();

      // Verify defaults are restored
      const provider = await service.get<string>('ai.provider');
      expect(provider).toBe('gemini'); // Default value
    });

    it('resetToDefaults clears custom values', async () => {
      await service.set('writing.autoSaveInterval', 60000);
      await service.resetToDefaults();

      // Should have default value
      const interval = await service.get<number>('writing.autoSaveInterval');
      expect(interval).toBe(30000); // Default value
    });
  });

  describe('Type Safety', () => {
    it('handles string config values', async () => {
      await service.set('ai.provider', 'openai');
      const value = await service.get<string>('ai.provider');

      expect(typeof value).toBe('string');
    });

    it('handles number config values', async () => {
      await service.set('ai.maxContextTokens', 128000);
      const value = await service.get<number>('ai.maxContextTokens');

      expect(typeof value).toBe('number');
    });

    it('handles array config values', async () => {
      await service.set('quality.enabledRules', ['rule1', 'rule2', 'rule3']);
      const value = await service.get<string[]>('quality.enabledRules');

      expect(Array.isArray(value)).toBe(true);
      expect(value).toEqual(['rule1', 'rule2', 'rule3']);
    });
  });
});
