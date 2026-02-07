/**
 * WorldRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { WorldRepository } from '../WorldRepository.js';

describe('WorldRepository', () => {
  let db: Database;
  let repo: WorldRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new WorldRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('get', () => {
    it('should return null when world is not initialized', () => {
      const world = repo.get();

      expect(world).toBeNull();
    });

    it('should return world after initialization', () => {
      repo.initialize();

      const world = repo.get();

      expect(world).not.toBeNull();
      expect(world?.id).toBe('main');
    });
  });

  describe('initialize', () => {
    it('should create world with default values', () => {
      const world = repo.initialize();

      expect(world.id).toBe('main');
      expect(world.createdAt).toBeDefined();
    });

    it('should return existing world if already initialized', () => {
      const world1 = repo.initialize();
      const world2 = repo.initialize();

      expect(world1.createdAt).toBe(world2.createdAt);
    });
  });

  describe('upsert', () => {
    it('should create world if not exists', () => {
      const world = repo.upsert({
        powerSystem: {
          name: '灵气体系',
          levels: ['练气', '筑基', '金丹', '元婴'],
        },
      });

      expect(world.powerSystem?.name).toBe('灵气体系');
      expect(world.powerSystem?.levels).toHaveLength(4);
    });

    it('should update world if exists', () => {
      repo.initialize();

      const updated = repo.upsert({
        socialRules: {
          尊卑: '弱肉强食',
          礼仪: '以礼相待',
        },
      });

      expect(updated.socialRules?.['尊卑']).toBe('弱肉强食');
    });
  });

  describe('setPowerSystem', () => {
    it('should update only power system', () => {
      repo.upsert({
        socialRules: { 规则1: '内容1' },
      });

      const updated = repo.setPowerSystem({
        name: '武功体系',
        levels: ['入门', '小成', '大成', '圆满'],
        coreRules: ['勤能补拙', '天赋决定上限'],
        constraints: ['需要功法', '需要资源'],
      });

      expect(updated.powerSystem?.name).toBe('武功体系');
      expect(updated.powerSystem?.coreRules).toHaveLength(2);
      expect(updated.socialRules?.['规则1']).toBe('内容1'); // Preserved
    });
  });

  describe('setSocialRules', () => {
    it('should update only social rules', () => {
      repo.upsert({
        powerSystem: { name: '灵气' },
      });

      const updated = repo.setSocialRules({
        宗门规矩: '敬重长辈',
        世俗规则: '官大一级压死人',
      });

      expect(updated.socialRules?.['宗门规矩']).toBe('敬重长辈');
      expect(updated.powerSystem?.name).toBe('灵气'); // Preserved
    });
  });
});
