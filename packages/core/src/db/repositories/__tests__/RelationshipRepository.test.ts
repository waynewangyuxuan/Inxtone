/**
 * RelationshipRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { CharacterRepository } from '../CharacterRepository.js';
import { RelationshipRepository } from '../RelationshipRepository.js';
import type { CharacterRole, RelationshipType } from '../../../types/entities.js';

describe('RelationshipRepository', () => {
  let db: Database;
  let charRepo: CharacterRepository;
  let repo: RelationshipRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    charRepo = new CharacterRepository(db);
    repo = new RelationshipRepository(db);

    // Create test characters
    charRepo.create({ name: '张三', role: 'main' as CharacterRole });
    charRepo.create({ name: '李四', role: 'supporting' as CharacterRole });
    charRepo.create({ name: '王五', role: 'antagonist' as CharacterRole });
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a relationship with required fields', () => {
      const relationship = repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'companion' as RelationshipType,
      });

      expect(relationship.id).toBe(1);
      expect(relationship.sourceId).toBe('C001');
      expect(relationship.targetId).toBe('C002');
      expect(relationship.type).toBe('companion');
    });

    it('should create a relationship with Wayne Principles fields', () => {
      const relationship = repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'companion' as RelationshipType,
        joinReason: '一起长大的发小',
        independentGoal: '成为最强的剑客',
        disagreeScenarios: ['关于正义的定义', '是否应该杀死反派'],
        leaveScenarios: ['主角堕入魔道', '主角伤害无辜'],
        mcNeeds: '提供情报和后勤支持',
      });

      expect(relationship.joinReason).toBe('一起长大的发小');
      expect(relationship.independentGoal).toBe('成为最强的剑客');
      expect(relationship.disagreeScenarios).toEqual(['关于正义的定义', '是否应该杀死反派']);
      expect(relationship.leaveScenarios).toEqual(['主角堕入魔道', '主角伤害无辜']);
      expect(relationship.mcNeeds).toBe('提供情报和后勤支持');
    });

    it('should enforce unique source-target constraint', () => {
      repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'companion' as RelationshipType,
      });

      expect(() =>
        repo.create({
          sourceId: 'C001',
          targetId: 'C002',
          type: 'rival' as RelationshipType,
        })
      ).toThrow();
    });
  });

  describe('findById', () => {
    it('should find a relationship by ID', () => {
      repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'mentor' as RelationshipType,
      });

      const found = repo.findById(1);

      expect(found).not.toBeNull();
      expect(found?.type).toBe('mentor');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById(999);

      expect(found).toBeNull();
    });
  });

  describe('findByCharacter', () => {
    beforeEach(() => {
      // C001 -> C002 (companion)
      repo.create({ sourceId: 'C001', targetId: 'C002', type: 'companion' as RelationshipType });
      // C001 -> C003 (enemy)
      repo.create({ sourceId: 'C001', targetId: 'C003', type: 'enemy' as RelationshipType });
      // C002 -> C003 (rival)
      repo.create({ sourceId: 'C002', targetId: 'C003', type: 'rival' as RelationshipType });
    });

    it('should find all relationships for a character', () => {
      const relationships = repo.findByCharacter('C001');

      expect(relationships).toHaveLength(2);
    });

    it('should include relationships where character is target', () => {
      const relationships = repo.findByCharacter('C002');

      // C001 -> C002 and C002 -> C003
      expect(relationships).toHaveLength(2);
    });
  });

  describe('findBySource and findByTarget', () => {
    beforeEach(() => {
      repo.create({ sourceId: 'C001', targetId: 'C002', type: 'companion' as RelationshipType });
      repo.create({ sourceId: 'C001', targetId: 'C003', type: 'enemy' as RelationshipType });
      repo.create({ sourceId: 'C002', targetId: 'C001', type: 'confidant' as RelationshipType });
    });

    it('should find relationships by source', () => {
      const relationships = repo.findBySource('C001');

      expect(relationships).toHaveLength(2);
      expect(relationships.every((r) => r.sourceId === 'C001')).toBe(true);
    });

    it('should find relationships by target', () => {
      const relationships = repo.findByTarget('C001');

      expect(relationships).toHaveLength(1);
      expect(relationships[0].targetId).toBe('C001');
    });
  });

  describe('findBetween', () => {
    it('should find relationship between two characters', () => {
      repo.create({ sourceId: 'C001', targetId: 'C002', type: 'mentor' as RelationshipType });

      const rel = repo.findBetween('C001', 'C002');

      expect(rel).not.toBeNull();
      expect(rel?.type).toBe('mentor');
    });

    it('should return null if no relationship exists', () => {
      const rel = repo.findBetween('C001', 'C002');

      expect(rel).toBeNull();
    });
  });

  describe('findByType', () => {
    beforeEach(() => {
      repo.create({ sourceId: 'C001', targetId: 'C002', type: 'companion' as RelationshipType });
      repo.create({ sourceId: 'C001', targetId: 'C003', type: 'enemy' as RelationshipType });
      repo.create({ sourceId: 'C002', targetId: 'C003', type: 'companion' as RelationshipType });
    });

    it('should filter relationships by type', () => {
      const companions = repo.findByType('companion');

      expect(companions).toHaveLength(2);
      expect(companions.every((r) => r.type === 'companion')).toBe(true);
    });
  });

  describe('update', () => {
    it('should update relationship fields', () => {
      repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'rival' as RelationshipType,
      });

      const updated = repo.update(1, {
        type: 'companion' as RelationshipType,
        joinReason: '化敌为友',
      });

      expect(updated.type).toBe('companion');
      expect(updated.joinReason).toBe('化敌为友');
    });

    it('should throw for non-existent relationship', () => {
      expect(() => repo.update(999, { type: 'enemy' as RelationshipType })).toThrow(
        'Relationship 999 not found'
      );
    });
  });

  describe('updateEvolution', () => {
    it('should update evolution field', () => {
      repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'rival' as RelationshipType,
      });

      const updated = repo.updateEvolution(1, '从对手变成了朋友');

      expect(updated.evolution).toBe('从对手变成了朋友');
    });
  });

  describe('delete', () => {
    it('should delete a relationship', () => {
      repo.create({
        sourceId: 'C001',
        targetId: 'C002',
        type: 'companion' as RelationshipType,
      });

      const deleted = repo.delete(1);

      expect(deleted).toBe(true);
      expect(repo.findById(1)).toBeNull();
    });
  });

  describe('deleteByCharacter', () => {
    it('should delete all relationships for a character', () => {
      repo.create({ sourceId: 'C001', targetId: 'C002', type: 'companion' as RelationshipType });
      repo.create({ sourceId: 'C001', targetId: 'C003', type: 'enemy' as RelationshipType });
      repo.create({ sourceId: 'C002', targetId: 'C001', type: 'confidant' as RelationshipType });
      repo.create({ sourceId: 'C002', targetId: 'C003', type: 'rival' as RelationshipType });

      const deletedCount = repo.deleteByCharacter('C001');

      expect(deletedCount).toBe(3); // 3 relationships involve C001
      expect(repo.findByCharacter('C001')).toHaveLength(0);
      expect(repo.findAll()).toHaveLength(1); // Only C002 -> C003 remains
    });
  });
});
