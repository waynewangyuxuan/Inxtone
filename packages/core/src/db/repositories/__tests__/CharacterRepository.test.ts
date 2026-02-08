/**
 * CharacterRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { CharacterRepository } from '../CharacterRepository.js';
import type { CharacterRole, ConflictType, CharacterTemplate } from '../../../types/entities.js';

describe('CharacterRepository', () => {
  let db: Database;
  let repo: CharacterRepository;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new CharacterRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a character with required fields', () => {
      const character = repo.create({
        name: '张三',
        role: 'main' as CharacterRole,
      });

      expect(character.id).toBe('C001');
      expect(character.name).toBe('张三');
      expect(character.role).toBe('main');
      expect(character.createdAt).toBeDefined();
      expect(character.updatedAt).toBeDefined();
    });

    it('should create a character with all fields', () => {
      const character = repo.create({
        name: '李四',
        role: 'antagonist' as CharacterRole,
        appearance: '高大威猛，一头白发',
        voiceSamples: ['样本1', '样本2'],
        motivation: {
          surface: '称霸天下',
          hidden: '为父报仇',
          core: '获得认可',
        },
        conflictType: 'desire_vs_morality' as ConflictType,
        template: 'avenger' as CharacterTemplate,
        firstAppearance: 1,
      });

      expect(character.id).toBe('C001');
      expect(character.appearance).toBe('高大威猛，一头白发');
      expect(character.voiceSamples).toEqual(['样本1', '样本2']);
      expect(character.motivation?.surface).toBe('称霸天下');
      expect(character.conflictType).toBe('desire_vs_morality');
      expect(character.template).toBe('avenger');
      expect(character.firstAppearance).toBe(1);
    });

    it('should auto-increment IDs', () => {
      const char1 = repo.create({ name: '角色1', role: 'main' as CharacterRole });
      const char2 = repo.create({ name: '角色2', role: 'supporting' as CharacterRole });
      const char3 = repo.create({ name: '角色3', role: 'mentioned' as CharacterRole });

      expect(char1.id).toBe('C001');
      expect(char2.id).toBe('C002');
      expect(char3.id).toBe('C003');
    });
  });

  describe('findById', () => {
    it('should find a character by ID', () => {
      repo.create({ name: '张三', role: 'main' as CharacterRole });

      const found = repo.findById('C001');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('张三');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById('C999');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all characters', () => {
      repo.create({ name: '角色1', role: 'main' as CharacterRole });
      repo.create({ name: '角色2', role: 'supporting' as CharacterRole });

      const all = repo.findAll();

      expect(all).toHaveLength(2);
    });

    it('should return empty array when no characters', () => {
      const all = repo.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByRole', () => {
    it('should filter characters by role', () => {
      repo.create({ name: '主角1', role: 'main' as CharacterRole });
      repo.create({ name: '配角1', role: 'supporting' as CharacterRole });
      repo.create({ name: '配角2', role: 'supporting' as CharacterRole });
      repo.create({ name: '反派1', role: 'antagonist' as CharacterRole });

      const supporting = repo.findByRole('supporting');

      expect(supporting).toHaveLength(2);
      expect(supporting.every((c) => c.role === 'supporting')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update character fields', () => {
      const created = repo.create({ name: '张三', role: 'main' as CharacterRole });

      const updated = repo.update('C001', {
        name: '张三丰',
        appearance: '仙风道骨',
        conflictType: 'ideal_vs_reality' as ConflictType,
      });

      expect(updated.name).toBe('张三丰');
      expect(updated.appearance).toBe('仙风道骨');
      expect(updated.conflictType).toBe('ideal_vs_reality');
      expect(updated.createdAt).toBe(created.createdAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    it('should update facets and arc', () => {
      repo.create({ name: '张三', role: 'main' as CharacterRole });

      const updated = repo.update('C001', {
        facets: {
          public: '温和有礼',
          private: '野心勃勃',
          hidden: '内心脆弱',
          underPressure: '暴躁易怒',
        },
        arc: {
          type: 'positive',
          startState: '懦弱',
          endState: '勇敢',
        },
      });

      expect(updated.facets?.public).toBe('温和有礼');
      expect(updated.facets?.hidden).toBe('内心脆弱');
      expect(updated.arc?.type).toBe('positive');
      expect(updated.arc?.startState).toBe('懦弱');
    });

    it('should throw for non-existent character', () => {
      expect(() => repo.update('C999', { name: 'Test' })).toThrow('Character C999 not found');
    });
  });

  describe('delete', () => {
    it('should delete a character', () => {
      repo.create({ name: '张三', role: 'main' as CharacterRole });

      const deleted = repo.delete('C001');

      expect(deleted).toBe(true);
      expect(repo.findById('C001')).toBeNull();
    });

    it('should return false for non-existent character', () => {
      const deleted = repo.delete('C999');

      expect(deleted).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repo.create({ name: '张三', role: 'main' as CharacterRole, appearance: '高大威猛' });
      repo.create({ name: '李四', role: 'supporting' as CharacterRole, appearance: '矮小精悍' });
      repo.create({ name: '张无忌', role: 'main' as CharacterRole, appearance: '英俊潇洒' });
    });

    it('should search by name using FTS', () => {
      const results = repo.search('张');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((c) => c.name.includes('张'))).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = repo.search('王五');

      expect(results).toHaveLength(0);
    });
  });

  describe('searchByName', () => {
    it('should search by name using LIKE', () => {
      repo.create({ name: '张三', role: 'main' as CharacterRole });
      repo.create({ name: '张三丰', role: 'supporting' as CharacterRole });
      repo.create({ name: '李四', role: 'antagonist' as CharacterRole });

      const results = repo.searchByName('张');

      expect(results).toHaveLength(2);
    });
  });

  describe('count and exists', () => {
    it('should count characters', () => {
      expect(repo.count()).toBe(0);

      repo.create({ name: '角色1', role: 'main' as CharacterRole });
      repo.create({ name: '角色2', role: 'supporting' as CharacterRole });

      expect(repo.count()).toBe(2);
    });

    it('should check existence', () => {
      expect(repo.exists('C001')).toBe(false);

      repo.create({ name: '角色1', role: 'main' as CharacterRole });

      expect(repo.exists('C001')).toBe(true);
      expect(repo.exists('C999')).toBe(false);
    });
  });
});
