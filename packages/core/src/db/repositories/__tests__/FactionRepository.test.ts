/**
 * FactionRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { CharacterRepository } from '../CharacterRepository.js';
import { FactionRepository } from '../FactionRepository.js';
import type { CharacterRole } from '../../../types/entities.js';

describe('FactionRepository', () => {
  let db: Database;
  let charRepo: CharacterRepository;
  let repo: FactionRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    charRepo = new CharacterRepository(db);
    repo = new FactionRepository(db);

    // Create test characters for leader references
    charRepo.create({ name: '掌门人', role: 'supporting' as CharacterRole });
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a faction with required fields', () => {
      const faction = repo.create({
        name: '青云宗',
      });

      expect(faction.id).toBe('F001');
      expect(faction.name).toBe('青云宗');
    });

    it('should create a faction with all fields', () => {
      const faction = repo.create({
        name: '魔教',
        type: 'sect',
        status: 'first_rate',
        leaderId: 'C001',
        stanceToMC: 'hostile',
        goals: ['统一江湖', '消灭正道'],
        resources: ['魔功', '毒药', '暗器'],
        internalConflict: '长老争权',
      });

      expect(faction.leaderId).toBe('C001');
      expect(faction.stanceToMC).toBe('hostile');
      expect(faction.goals).toHaveLength(2);
      expect(faction.resources).toContain('魔功');
      expect(faction.internalConflict).toBe('长老争权');
    });
  });

  describe('findById', () => {
    it('should find a faction by ID', () => {
      repo.create({ name: '青云宗' });

      const found = repo.findById('F001');

      expect(found?.name).toBe('青云宗');
    });
  });

  describe('findByType and findByStatus', () => {
    beforeEach(() => {
      repo.create({ name: '势力1', type: 'sect', status: 'first_rate' });
      repo.create({ name: '势力2', type: 'clan', status: 'second_rate' });
      repo.create({ name: '势力3', type: 'sect', status: 'first_rate' });
    });

    it('should filter by type', () => {
      const sects = repo.findByType('sect');

      expect(sects).toHaveLength(2);
    });

    it('should filter by status', () => {
      const firstRate = repo.findByStatus('first_rate');

      expect(firstRate).toHaveLength(2);
    });
  });

  describe('findByStance', () => {
    beforeEach(() => {
      repo.create({ name: '友方1', stanceToMC: 'friendly' });
      repo.create({ name: '中立1', stanceToMC: 'neutral' });
      repo.create({ name: '敌方1', stanceToMC: 'hostile' });
      repo.create({ name: '敌方2', stanceToMC: 'hostile' });
    });

    it('should filter by stance to MC', () => {
      const hostile = repo.findByStance('hostile');

      expect(hostile).toHaveLength(2);
    });
  });

  describe('findByLeader', () => {
    it('should find factions led by a character', () => {
      repo.create({ name: '势力1', leaderId: 'C001' });
      repo.create({ name: '势力2', leaderId: 'C001' });
      repo.create({ name: '势力3' }); // No leader

      const factions = repo.findByLeader('C001');

      expect(factions).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update faction fields', () => {
      repo.create({ name: '青云宗', stanceToMC: 'neutral' });

      const updated = repo.update('F001', {
        stanceToMC: 'friendly',
        goals: ['支持主角', '维护正道'],
      });

      expect(updated.stanceToMC).toBe('friendly');
      expect(updated.goals).toHaveLength(2);
    });
  });

  describe('clearLeader', () => {
    it('should clear leader when character is deleted', () => {
      repo.create({ name: '势力1', leaderId: 'C001' });
      repo.create({ name: '势力2', leaderId: 'C001' });

      const clearedCount = repo.clearLeader('C001');

      expect(clearedCount).toBe(2);
      expect(repo.findById('F001')?.leaderId).toBeUndefined();
      expect(repo.findById('F002')?.leaderId).toBeUndefined();
    });
  });

  describe('getTypes and getStatuses', () => {
    beforeEach(() => {
      repo.create({ name: '势力1', type: 'sect', status: 'first_rate' });
      repo.create({ name: '势力2', type: 'clan', status: 'second_rate' });
      repo.create({ name: '势力3', type: 'sect', status: 'first_rate' });
    });

    it('should return unique types', () => {
      const types = repo.getTypes();

      expect(types).toHaveLength(2);
      expect(types).toContain('sect');
      expect(types).toContain('clan');
    });

    it('should return unique statuses', () => {
      const statuses = repo.getStatuses();

      expect(statuses).toHaveLength(2);
      expect(statuses).toContain('first_rate');
      expect(statuses).toContain('second_rate');
    });
  });
});
