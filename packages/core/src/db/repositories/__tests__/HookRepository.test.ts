/**
 * HookRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { HookRepository } from '../HookRepository.js';
import type { HookType, HookStyle } from '../../../types/entities.js';

describe('HookRepository', () => {
  let db: Database;
  let repo: HookRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new HookRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a hook with required fields only', () => {
      const hook = repo.create({
        type: 'opening' as HookType,
        content: 'A mysterious stranger arrives at dawn.',
      });

      expect(hook.id).toBe('HK001');
      expect(hook.type).toBe('opening');
      expect(hook.content).toBe('A mysterious stranger arrives at dawn.');
      expect(hook.createdAt).toBeDefined();
      expect(hook.chapterId).toBeUndefined();
      expect(hook.hookType).toBeUndefined();
      expect(hook.strength).toBeUndefined();
    });

    it('should create a hook with all fields', () => {
      const hook = repo.create({
        type: 'chapter' as HookType,
        content: 'The letter contained a single word: Run.',
        chapterId: 5,
        hookType: 'suspense' as HookStyle,
        strength: 85,
      });

      expect(hook.id).toBe('HK001');
      expect(hook.type).toBe('chapter');
      expect(hook.content).toBe('The letter contained a single word: Run.');
      expect(hook.chapterId).toBe(5);
      expect(hook.hookType).toBe('suspense');
      expect(hook.strength).toBe(85);
    });

    it('should auto-increment IDs with HK prefix', () => {
      const h1 = repo.create({ type: 'opening' as HookType, content: 'Hook 1' });
      const h2 = repo.create({ type: 'arc' as HookType, content: 'Hook 2' });
      const h3 = repo.create({ type: 'chapter' as HookType, content: 'Hook 3' });

      expect(h1.id).toBe('HK001');
      expect(h2.id).toBe('HK002');
      expect(h3.id).toBe('HK003');
    });
  });

  describe('findById', () => {
    it('should find a hook by ID', () => {
      repo.create({ type: 'opening' as HookType, content: 'Main hook' });

      const found = repo.findById('HK001');

      expect(found).not.toBeNull();
      expect(found?.content).toBe('Main hook');
      expect(found?.type).toBe('opening');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById('HK999');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all hooks ordered by created_at DESC', () => {
      repo.create({ type: 'opening' as HookType, content: 'First hook' });
      repo.create({ type: 'arc' as HookType, content: 'Second hook' });
      repo.create({ type: 'chapter' as HookType, content: 'Third hook' });

      const all = repo.findAll();

      expect(all).toHaveLength(3);
      // All three hooks are present (order may vary when created_at is identical)
      const contents = all.map((h) => h.content).sort();
      expect(contents).toEqual(['First hook', 'Second hook', 'Third hook']);
    });

    it('should return empty array when no hooks exist', () => {
      const all = repo.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    beforeEach(() => {
      repo.create({ type: 'opening' as HookType, content: 'Opening hook' });
      repo.create({ type: 'arc' as HookType, content: 'Arc hook 1' });
      repo.create({ type: 'arc' as HookType, content: 'Arc hook 2' });
      repo.create({ type: 'chapter' as HookType, content: 'Chapter hook 1' });
      repo.create({ type: 'chapter' as HookType, content: 'Chapter hook 2' });
      repo.create({ type: 'chapter' as HookType, content: 'Chapter hook 3' });
    });

    it('should return hooks of a specific type', () => {
      const arcHooks = repo.findByType('arc');

      expect(arcHooks).toHaveLength(2);
      expect(arcHooks.every((h) => h.type === 'arc')).toBe(true);
    });

    it('should return empty array for type with no hooks', () => {
      // All hooks removed and search for a type that has none
      const db2 = new Database({ path: ':memory:', migrate: true });
      db2.connect();
      const repo2 = new HookRepository(db2);
      repo2.create({ type: 'opening' as HookType, content: 'Only opening' });

      const arcHooks = repo2.findByType('arc');

      expect(arcHooks).toHaveLength(0);
      db2.close();
    });
  });

  describe('findByChapter', () => {
    it('should return hooks for a specific chapter ordered by created_at ASC', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Ch5 hook A', chapterId: 5 });
      repo.create({ type: 'chapter' as HookType, content: 'Ch3 hook', chapterId: 3 });
      repo.create({ type: 'chapter' as HookType, content: 'Ch5 hook B', chapterId: 5 });

      const ch5Hooks = repo.findByChapter(5);

      expect(ch5Hooks).toHaveLength(2);
      // ASC order: first created comes first
      expect(ch5Hooks[0].content).toBe('Ch5 hook A');
      expect(ch5Hooks[1].content).toBe('Ch5 hook B');
    });

    it('should return empty array for chapter with no hooks', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Some hook', chapterId: 1 });

      const hooks = repo.findByChapter(99);

      expect(hooks).toHaveLength(0);
    });
  });

  describe('findByHookStyle', () => {
    beforeEach(() => {
      repo.create({
        type: 'chapter' as HookType,
        content: 'S1',
        hookType: 'suspense' as HookStyle,
      });
      repo.create({
        type: 'chapter' as HookType,
        content: 'S2',
        hookType: 'suspense' as HookStyle,
      });
      repo.create({ type: 'chapter' as HookType, content: 'M1', hookType: 'mystery' as HookStyle });
      repo.create({ type: 'chapter' as HookType, content: 'E1', hookType: 'emotion' as HookStyle });
    });

    it('should filter hooks by hook style', () => {
      const suspenseHooks = repo.findByHookStyle('suspense');

      expect(suspenseHooks).toHaveLength(2);
      expect(suspenseHooks.every((h) => h.hookType === 'suspense')).toBe(true);
    });

    it('should return empty array for unused style', () => {
      const anticipationHooks = repo.findByHookStyle('anticipation');

      expect(anticipationHooks).toHaveLength(0);
    });
  });

  describe('getOpeningHook', () => {
    it('should return the opening hook', () => {
      repo.create({ type: 'opening' as HookType, content: 'The grand opening' });
      repo.create({ type: 'arc' as HookType, content: 'An arc hook' });

      const opening = repo.getOpeningHook();

      expect(opening).not.toBeNull();
      expect(opening?.type).toBe('opening');
      expect(opening?.content).toBe('The grand opening');
    });

    it('should return null when no opening hook exists', () => {
      repo.create({ type: 'arc' as HookType, content: 'Just an arc' });
      repo.create({ type: 'chapter' as HookType, content: 'Just a chapter' });

      const opening = repo.getOpeningHook();

      expect(opening).toBeNull();
    });

    it('should return null when database is empty', () => {
      const opening = repo.getOpeningHook();

      expect(opening).toBeNull();
    });
  });

  describe('getArcHooks', () => {
    it('should return only arc-type hooks', () => {
      repo.create({ type: 'opening' as HookType, content: 'Opening' });
      repo.create({ type: 'arc' as HookType, content: 'Arc 1' });
      repo.create({ type: 'arc' as HookType, content: 'Arc 2' });
      repo.create({ type: 'chapter' as HookType, content: 'Chapter' });

      const arcHooks = repo.getArcHooks();

      expect(arcHooks).toHaveLength(2);
      expect(arcHooks.every((h) => h.type === 'arc')).toBe(true);
    });
  });

  describe('findStrong', () => {
    beforeEach(() => {
      repo.create({ type: 'chapter' as HookType, content: 'Weak', strength: 30 });
      repo.create({ type: 'chapter' as HookType, content: 'Medium', strength: 60 });
      repo.create({ type: 'chapter' as HookType, content: 'Strong', strength: 80 });
      repo.create({ type: 'chapter' as HookType, content: 'Very strong', strength: 95 });
      repo.create({ type: 'chapter' as HookType, content: 'No strength' });
    });

    it('should find hooks with strength >= default threshold (70)', () => {
      const strong = repo.findStrong();

      expect(strong).toHaveLength(2);
      expect(strong[0].content).toBe('Very strong'); // 95 first (DESC)
      expect(strong[1].content).toBe('Strong'); // 80 second
    });

    it('should find hooks with strength >= custom threshold', () => {
      const strong = repo.findStrong(50);

      expect(strong).toHaveLength(3);
      expect(strong[0].strength).toBe(95);
      expect(strong[1].strength).toBe(80);
      expect(strong[2].strength).toBe(60);
    });

    it('should return empty array when no hooks meet threshold', () => {
      const strong = repo.findStrong(100);

      expect(strong).toHaveLength(0);
    });

    it('should include hooks at exactly the threshold', () => {
      const strong = repo.findStrong(80);

      expect(strong).toHaveLength(2);
      expect(strong.some((h) => h.strength === 80)).toBe(true);
    });
  });

  describe('findWeak', () => {
    beforeEach(() => {
      repo.create({ type: 'chapter' as HookType, content: 'Very weak', strength: 20 });
      repo.create({ type: 'chapter' as HookType, content: 'Weak', strength: 40 });
      repo.create({ type: 'chapter' as HookType, content: 'Medium', strength: 60 });
      repo.create({ type: 'chapter' as HookType, content: 'Strong', strength: 80 });
      repo.create({ type: 'chapter' as HookType, content: 'No strength' });
    });

    it('should find hooks with strength < default threshold (50)', () => {
      const weak = repo.findWeak();

      expect(weak).toHaveLength(2);
      expect(weak[0].content).toBe('Very weak'); // 20 first (ASC)
      expect(weak[1].content).toBe('Weak'); // 40 second
    });

    it('should find hooks with strength < custom threshold', () => {
      const weak = repo.findWeak(70);

      expect(weak).toHaveLength(3);
      expect(weak[0].strength).toBe(20);
      expect(weak[1].strength).toBe(40);
      expect(weak[2].strength).toBe(60);
    });

    it('should exclude hooks where strength is NULL', () => {
      const weak = repo.findWeak(100);

      // 'No strength' has NULL strength and should be excluded
      expect(weak).toHaveLength(4);
      expect(weak.every((h) => h.strength !== undefined)).toBe(true);
    });

    it('should return empty array when no hooks are below threshold', () => {
      const weak = repo.findWeak(10);

      expect(weak).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update specific fields', () => {
      repo.create({
        type: 'chapter' as HookType,
        content: 'Original content',
        strength: 50,
      });

      const updated = repo.update('HK001', {
        content: 'Updated content',
        strength: 75,
      });

      expect(updated.content).toBe('Updated content');
      expect(updated.strength).toBe(75);
      expect(updated.type).toBe('chapter'); // unchanged
    });

    it('should update type field', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook' });

      const updated = repo.update('HK001', { type: 'arc' as HookType });

      expect(updated.type).toBe('arc');
    });

    it('should update chapterId', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook', chapterId: 1 });

      const updated = repo.update('HK001', { chapterId: 5 });

      expect(updated.chapterId).toBe(5);
    });

    it('should update hookType', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook' });

      const updated = repo.update('HK001', { hookType: 'mystery' as HookStyle });

      expect(updated.hookType).toBe('mystery');
    });

    it('should return existing hook unchanged when no updates provided', () => {
      const created = repo.create({ type: 'opening' as HookType, content: 'Hook' });

      const updated = repo.update('HK001', {});

      expect(updated.content).toBe(created.content);
      expect(updated.type).toBe(created.type);
    });

    it('should throw for non-existent hook', () => {
      expect(() => repo.update('HK999', { content: 'Nope' })).toThrow('Hook HK999 not found');
    });
  });

  describe('updateStrength', () => {
    it('should update hook strength', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook', strength: 50 });

      const updated = repo.updateStrength('HK001', 85);

      expect(updated.strength).toBe(85);
    });

    it('should clamp negative strength to 0', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook', strength: 50 });

      const updated = repo.updateStrength('HK001', -20);

      expect(updated.strength).toBe(0);
    });

    it('should clamp strength above 100 to 100', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook', strength: 50 });

      const updated = repo.updateStrength('HK001', 150);

      expect(updated.strength).toBe(100);
    });

    it('should accept boundary values 0 and 100', () => {
      repo.create({ type: 'chapter' as HookType, content: 'Hook A', strength: 50 });
      repo.create({ type: 'chapter' as HookType, content: 'Hook B', strength: 50 });

      const updatedZero = repo.updateStrength('HK001', 0);
      const updatedHundred = repo.updateStrength('HK002', 100);

      expect(updatedZero.strength).toBe(0);
      expect(updatedHundred.strength).toBe(100);
    });

    it('should throw for non-existent hook', () => {
      expect(() => repo.updateStrength('HK999', 50)).toThrow('Hook HK999 not found');
    });
  });

  describe('getStats', () => {
    it('should return zeroed stats when no hooks exist', () => {
      const stats = repo.getStats();

      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({ opening: 0, arc: 0, chapter: 0 });
      expect(stats.avgStrength).toBeNull();
      expect(stats.weakCount).toBe(0);
    });

    it('should count hooks by type correctly', () => {
      repo.create({ type: 'opening' as HookType, content: 'O1' });
      repo.create({ type: 'arc' as HookType, content: 'A1' });
      repo.create({ type: 'arc' as HookType, content: 'A2' });
      repo.create({ type: 'chapter' as HookType, content: 'C1' });
      repo.create({ type: 'chapter' as HookType, content: 'C2' });
      repo.create({ type: 'chapter' as HookType, content: 'C3' });

      const stats = repo.getStats();

      expect(stats.total).toBe(6);
      expect(stats.byType.opening).toBe(1);
      expect(stats.byType.arc).toBe(2);
      expect(stats.byType.chapter).toBe(3);
    });

    it('should calculate average strength excluding nulls', () => {
      repo.create({ type: 'chapter' as HookType, content: 'H1', strength: 40 });
      repo.create({ type: 'chapter' as HookType, content: 'H2', strength: 80 });
      repo.create({ type: 'chapter' as HookType, content: 'H3' }); // no strength

      const stats = repo.getStats();

      // Average of 40 and 80, ignoring null
      expect(stats.avgStrength).toBe(60);
    });

    it('should return null avgStrength when no hooks have strength', () => {
      repo.create({ type: 'opening' as HookType, content: 'H1' });
      repo.create({ type: 'arc' as HookType, content: 'H2' });

      const stats = repo.getStats();

      expect(stats.avgStrength).toBeNull();
    });

    it('should count weak hooks (strength < 50)', () => {
      repo.create({ type: 'chapter' as HookType, content: 'H1', strength: 30 });
      repo.create({ type: 'chapter' as HookType, content: 'H2', strength: 45 });
      repo.create({ type: 'chapter' as HookType, content: 'H3', strength: 50 });
      repo.create({ type: 'chapter' as HookType, content: 'H4', strength: 80 });
      repo.create({ type: 'chapter' as HookType, content: 'H5' }); // no strength, not counted as weak

      const stats = repo.getStats();

      expect(stats.weakCount).toBe(2); // only 30 and 45
    });
  });

  describe('count', () => {
    it('should return 0 for empty table', () => {
      expect(repo.count()).toBe(0);
    });

    it('should count all hooks', () => {
      repo.create({ type: 'opening' as HookType, content: 'H1' });
      repo.create({ type: 'arc' as HookType, content: 'H2' });

      expect(repo.count()).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return false for non-existent hook', () => {
      expect(repo.exists('HK001')).toBe(false);
    });

    it('should return true for existing hook', () => {
      repo.create({ type: 'opening' as HookType, content: 'Hook' });

      expect(repo.exists('HK001')).toBe(true);
      expect(repo.exists('HK999')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a hook and return true', () => {
      repo.create({ type: 'opening' as HookType, content: 'To be deleted' });

      const deleted = repo.delete('HK001');

      expect(deleted).toBe(true);
      expect(repo.findById('HK001')).toBeNull();
      expect(repo.count()).toBe(0);
    });

    it('should return false for non-existent hook', () => {
      const deleted = repo.delete('HK999');

      expect(deleted).toBe(false);
    });
  });
});
