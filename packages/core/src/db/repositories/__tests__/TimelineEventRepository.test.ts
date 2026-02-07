/**
 * TimelineEventRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { CharacterRepository } from '../CharacterRepository.js';
import { LocationRepository } from '../LocationRepository.js';
import { TimelineEventRepository } from '../TimelineEventRepository.js';
import type { CharacterRole } from '../../../types/entities.js';

describe('TimelineEventRepository', () => {
  let db: Database;
  let repo: TimelineEventRepository;
  let charRepo: CharacterRepository;
  let locRepo: LocationRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new TimelineEventRepository(db);
    charRepo = new CharacterRepository(db);
    locRepo = new LocationRepository(db);

    // Create test data for references
    charRepo.create({ name: '张三', role: 'main' as CharacterRole });
    charRepo.create({ name: '李四', role: 'supporting' as CharacterRole });
    locRepo.create({ name: '青云宗' });
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a timeline event with required fields', () => {
      const event = repo.create({
        description: '张三拜入青云宗',
      });

      expect(event.id).toBe(1);
      expect(event.description).toBe('张三拜入青云宗');
      expect(event.createdAt).toBeDefined();
    });

    it('should create a timeline event with all fields', () => {
      const event = repo.create({
        eventDate: '第一年春',
        description: '张三与李四在青云宗相遇',
        relatedCharacters: ['C001', 'C002'],
        relatedLocations: ['L001'],
      });

      expect(event.eventDate).toBe('第一年春');
      expect(event.relatedCharacters).toEqual(['C001', 'C002']);
      expect(event.relatedLocations).toEqual(['L001']);
    });

    it('should auto-increment IDs', () => {
      const e1 = repo.create({ description: '事件1' });
      const e2 = repo.create({ description: '事件2' });

      expect(e1.id).toBe(1);
      expect(e2.id).toBe(2);
    });
  });

  describe('findById', () => {
    it('should find a timeline event by ID', () => {
      repo.create({ description: '测试事件' });

      const found = repo.findById(1);

      expect(found).not.toBeNull();
      expect(found?.description).toBe('测试事件');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById(999);

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all events ordered by event_date', () => {
      repo.create({ eventDate: '第二年', description: '事件B' });
      repo.create({ eventDate: '第一年', description: '事件A' });

      const all = repo.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].description).toBe('事件A');
    });

    it('should return empty array when no events', () => {
      const all = repo.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByDateRange', () => {
    beforeEach(() => {
      repo.create({ eventDate: '0001', description: '第一年事件' });
      repo.create({ eventDate: '0002', description: '第二年事件' });
      repo.create({ eventDate: '0003', description: '第三年事件' });
      repo.create({ eventDate: '0005', description: '第五年事件' });
    });

    it('should filter by date range', () => {
      const events = repo.findByDateRange('0001', '0003');

      expect(events).toHaveLength(3);
    });

    it('should return empty for non-matching range', () => {
      const events = repo.findByDateRange('0010', '0020');

      expect(events).toHaveLength(0);
    });
  });

  describe('findByCharacter', () => {
    beforeEach(() => {
      repo.create({ description: '事件1', relatedCharacters: ['C001'] });
      repo.create({ description: '事件2', relatedCharacters: ['C001', 'C002'] });
      repo.create({ description: '事件3', relatedCharacters: ['C002'] });
    });

    it('should find events involving a character', () => {
      const events = repo.findByCharacter('C001');

      expect(events).toHaveLength(2);
    });

    it('should return empty for character with no events', () => {
      const events = repo.findByCharacter('C999');

      expect(events).toHaveLength(0);
    });
  });

  describe('findByLocation', () => {
    beforeEach(() => {
      repo.create({ description: '事件1', relatedLocations: ['L001'] });
      repo.create({ description: '事件2', relatedLocations: ['L001'] });
      repo.create({ description: '事件3' });
    });

    it('should find events at a location', () => {
      const events = repo.findByLocation('L001');

      expect(events).toHaveLength(2);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repo.create({ description: '张三拜入青云宗' });
      repo.create({ description: '李四下山历练' });
      repo.create({ description: '张三突破筑基期' });
    });

    it('should search by description keyword', () => {
      const results = repo.search('张三');

      expect(results).toHaveLength(2);
    });

    it('should return empty for no matches', () => {
      const results = repo.search('王五');

      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update event fields', () => {
      repo.create({ description: '原始描述', eventDate: '第一年' });

      const updated = repo.update(1, {
        description: '更新后的描述',
        eventDate: '第二年',
      });

      expect(updated.description).toBe('更新后的描述');
      expect(updated.eventDate).toBe('第二年');
    });

    it('should update related characters', () => {
      repo.create({ description: '事件', relatedCharacters: ['C001'] });

      const updated = repo.update(1, {
        relatedCharacters: ['C001', 'C002'],
      });

      expect(updated.relatedCharacters).toEqual(['C001', 'C002']);
    });

    it('should return unchanged event when no updates provided', () => {
      repo.create({ description: '事件' });

      const updated = repo.update(1, {});

      expect(updated.description).toBe('事件');
    });

    it('should throw for non-existent event', () => {
      expect(() => repo.update(999, { description: 'test' })).toThrow(
        'Timeline event 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete a timeline event', () => {
      repo.create({ description: '事件' });

      const deleted = repo.delete(1);

      expect(deleted).toBe(true);
      expect(repo.findById(1)).toBeNull();
    });

    it('should return false for non-existent event', () => {
      const deleted = repo.delete(999);

      expect(deleted).toBe(false);
    });
  });

  describe('addCharacter', () => {
    it('should add a character to an event', () => {
      repo.create({ description: '事件' });

      const updated = repo.addCharacter(1, 'C001');

      expect(updated.relatedCharacters).toContain('C001');
    });

    it('should not duplicate existing character', () => {
      repo.create({ description: '事件', relatedCharacters: ['C001'] });

      const updated = repo.addCharacter(1, 'C001');

      expect(updated.relatedCharacters).toHaveLength(1);
    });

    it('should throw for non-existent event', () => {
      expect(() => repo.addCharacter(999, 'C001')).toThrow('Timeline event 999 not found');
    });
  });

  describe('removeCharacter', () => {
    it('should remove a character from an event', () => {
      repo.create({ description: '事件', relatedCharacters: ['C001', 'C002'] });

      const updated = repo.removeCharacter(1, 'C001');

      expect(updated.relatedCharacters).toEqual(['C002']);
    });

    it('should throw for non-existent event', () => {
      expect(() => repo.removeCharacter(999, 'C001')).toThrow('Timeline event 999 not found');
    });
  });

  describe('removeCharacterFromAll', () => {
    it('should remove a character from all events', () => {
      repo.create({ description: '事件1', relatedCharacters: ['C001', 'C002'] });
      repo.create({ description: '事件2', relatedCharacters: ['C001'] });
      repo.create({ description: '事件3', relatedCharacters: ['C002'] });

      repo.removeCharacterFromAll('C001');

      expect(repo.findByCharacter('C001')).toHaveLength(0);
      // C002 should still be present
      const event1 = repo.findById(1);
      expect(event1?.relatedCharacters).toEqual(['C002']);
    });
  });

  describe('count and exists', () => {
    it('should count events', () => {
      expect(repo.count()).toBe(0);

      repo.create({ description: '事件1' });
      repo.create({ description: '事件2' });

      expect(repo.count()).toBe(2);
    });

    it('should check existence', () => {
      expect(repo.exists(1)).toBe(false);

      repo.create({ description: '事件1' });

      expect(repo.exists(1)).toBe(true);
      expect(repo.exists(999)).toBe(false);
    });
  });
});
