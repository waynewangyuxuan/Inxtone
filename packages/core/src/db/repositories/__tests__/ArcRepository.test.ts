/**
 * ArcRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { ArcRepository } from '../ArcRepository.js';
import type { ArcStatus, ArcSection } from '../../../types/entities.js';

describe('ArcRepository', () => {
  let db: Database;
  let repo: ArcRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new ArcRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create an arc with required fields only', () => {
      const arc = repo.create({
        name: '主线剧情',
        type: 'main',
      });

      expect(arc.id).toBe('ARC001');
      expect(arc.name).toBe('主线剧情');
      expect(arc.type).toBe('main');
      expect(arc.status).toBe('planned');
      expect(arc.progress).toBe(0);
      expect(arc.createdAt).toBeDefined();
      expect(arc.updatedAt).toBeDefined();
    });

    it('should create an arc with all fields', () => {
      const sections: ArcSection[] = [
        { name: '序章', chapters: [1, 2, 3], type: 'intro', status: 'planned' },
        { name: '发展', chapters: [4, 5, 6], type: 'rising', status: 'planned' },
      ];

      const arc = repo.create({
        name: '复仇之路',
        type: 'sub',
        chapterStart: 1,
        chapterEnd: 10,
        status: 'in_progress',
        sections,
        characterArcs: { C001: 'redemption', C002: 'fall' },
        mainArcRelation: '主线的补充',
      });

      expect(arc.id).toBe('ARC001');
      expect(arc.name).toBe('复仇之路');
      expect(arc.type).toBe('sub');
      expect(arc.chapterStart).toBe(1);
      expect(arc.chapterEnd).toBe(10);
      expect(arc.status).toBe('in_progress');
      expect(arc.progress).toBe(0);
      expect(arc.sections).toEqual(sections);
      expect(arc.characterArcs).toEqual({ C001: 'redemption', C002: 'fall' });
      expect(arc.mainArcRelation).toBe('主线的补充');
    });

    it('should auto-increment IDs', () => {
      const arc1 = repo.create({ name: '剧情1', type: 'main' });
      const arc2 = repo.create({ name: '剧情2', type: 'sub' });
      const arc3 = repo.create({ name: '剧情3', type: 'sub' });

      expect(arc1.id).toBe('ARC001');
      expect(arc2.id).toBe('ARC002');
      expect(arc3.id).toBe('ARC003');
    });

    it('should default status to planned when not provided', () => {
      const arc = repo.create({ name: '新剧情', type: 'main' });

      expect(arc.status).toBe('planned');
    });

    it('should default progress to 0', () => {
      const arc = repo.create({
        name: '新剧情',
        type: 'main',
        status: 'in_progress',
      });

      expect(arc.progress).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find an arc by ID', () => {
      repo.create({ name: '主线', type: 'main' });

      const found = repo.findById('ARC001');

      expect(found).not.toBeNull();
      expect(found?.name).toBe('主线');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById('ARC999');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all arcs ordered by created_at', () => {
      repo.create({ name: '剧情A', type: 'main' });
      repo.create({ name: '剧情B', type: 'sub' });
      repo.create({ name: '剧情C', type: 'sub' });

      const all = repo.findAll();

      expect(all).toHaveLength(3);
      expect(all[0].name).toBe('剧情A');
      expect(all[1].name).toBe('剧情B');
      expect(all[2].name).toBe('剧情C');
    });

    it('should return empty array when no arcs exist', () => {
      const all = repo.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByType', () => {
    it('should filter arcs by type', () => {
      repo.create({ name: '主线', type: 'main' });
      repo.create({ name: '支线1', type: 'sub' });
      repo.create({ name: '支线2', type: 'sub' });

      const subArcs = repo.findByType('sub');

      expect(subArcs).toHaveLength(2);
      expect(subArcs.every((a) => a.type === 'sub')).toBe(true);
    });

    it('should return empty array when no arcs match type', () => {
      repo.create({ name: '支线', type: 'sub' });

      const mainArcs = repo.findByType('main');

      expect(mainArcs).toHaveLength(0);
    });
  });

  describe('findByStatus', () => {
    it('should filter arcs by status', () => {
      repo.create({ name: '已完成', type: 'main', status: 'complete' });
      repo.create({ name: '进行中', type: 'sub', status: 'in_progress' });
      repo.create({ name: '计划中', type: 'sub' }); // defaults to 'planned'

      const planned = repo.findByStatus('planned');

      expect(planned).toHaveLength(1);
      expect(planned[0].name).toBe('计划中');
    });

    it('should return empty array when no arcs match status', () => {
      repo.create({ name: '计划中', type: 'main' });

      const complete = repo.findByStatus('complete');

      expect(complete).toHaveLength(0);
    });
  });

  describe('getMainArc', () => {
    it('should return the first main arc', () => {
      repo.create({ name: '主线剧情', type: 'main' });
      repo.create({ name: '支线', type: 'sub' });

      const mainArc = repo.getMainArc();

      expect(mainArc).not.toBeNull();
      expect(mainArc?.name).toBe('主线剧情');
      expect(mainArc?.type).toBe('main');
    });

    it('should return null when no main arc exists', () => {
      repo.create({ name: '支线', type: 'sub' });

      const mainArc = repo.getMainArc();

      expect(mainArc).toBeNull();
    });
  });

  describe('findByChapter', () => {
    it('should find arc containing a chapter within range', () => {
      repo.create({
        name: '第一篇',
        type: 'main',
        chapterStart: 1,
        chapterEnd: 10,
      });

      const found = repo.findByChapter(5);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('第一篇');
    });

    it('should find arc at exact start boundary', () => {
      repo.create({
        name: '第一篇',
        type: 'main',
        chapterStart: 1,
        chapterEnd: 10,
      });

      const found = repo.findByChapter(1);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('第一篇');
    });

    it('should find arc at exact end boundary', () => {
      repo.create({
        name: '第一篇',
        type: 'main',
        chapterStart: 1,
        chapterEnd: 10,
      });

      const found = repo.findByChapter(10);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('第一篇');
    });

    it('should find arc when chapter_end is null (open-ended arc)', () => {
      repo.create({
        name: '进行中的剧情',
        type: 'main',
        chapterStart: 5,
      });

      const found = repo.findByChapter(50);

      expect(found).not.toBeNull();
      expect(found?.name).toBe('进行中的剧情');
    });

    it('should return null when chapter is outside range', () => {
      repo.create({
        name: '第一篇',
        type: 'main',
        chapterStart: 1,
        chapterEnd: 10,
      });

      const found = repo.findByChapter(11);

      expect(found).toBeNull();
    });

    it('should return null when no arcs have chapter ranges', () => {
      repo.create({ name: '无范围', type: 'main' });

      const found = repo.findByChapter(1);

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update arc name', () => {
      repo.create({ name: '旧名字', type: 'main' });

      const updated = repo.update('ARC001', { name: '新名字' });

      expect(updated.name).toBe('新名字');
    });

    it('should update multiple fields', () => {
      const created = repo.create({ name: '剧情', type: 'main' });

      const updated = repo.update('ARC001', {
        name: '更新后的剧情',
        type: 'sub',
        status: 'in_progress' as ArcStatus,
        chapterStart: 1,
        chapterEnd: 20,
        mainArcRelation: '与主线相关',
      });

      expect(updated.name).toBe('更新后的剧情');
      expect(updated.type).toBe('sub');
      expect(updated.status).toBe('in_progress');
      expect(updated.chapterStart).toBe(1);
      expect(updated.chapterEnd).toBe(20);
      expect(updated.mainArcRelation).toBe('与主线相关');
      expect(updated.createdAt).toBe(created.createdAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    it('should update sections JSON field', () => {
      repo.create({ name: '剧情', type: 'main' });

      const sections: ArcSection[] = [
        { name: '序', chapters: [1, 2], type: 'intro', status: 'complete' },
      ];
      const updated = repo.update('ARC001', { sections });

      expect(updated.sections).toEqual(sections);
    });

    it('should update characterArcs JSON field', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.update('ARC001', {
        characterArcs: { C001: 'growth', C002: 'decline' },
      });

      expect(updated.characterArcs).toEqual({ C001: 'growth', C002: 'decline' });
    });

    it('should update updated_at timestamp', () => {
      const created = repo.create({ name: '剧情', type: 'main' });

      const updated = repo.update('ARC001', { name: '更新' });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.updatedAt).getTime()
      );
    });

    it('should return existing arc when called with no changes', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.update('ARC001', {});

      expect(updated.name).toBe('剧情');
      expect(updated.type).toBe('main');
    });

    it('should throw for non-existent arc', () => {
      expect(() => repo.update('ARC999', { name: 'Test' })).toThrow('Arc ARC999 not found');
    });
  });

  describe('updateProgress', () => {
    it('should update progress within valid range', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.updateProgress('ARC001', 50);

      expect(updated.progress).toBe(50);
    });

    it('should clamp progress to 0 when negative', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.updateProgress('ARC001', -10);

      expect(updated.progress).toBe(0);
    });

    it('should clamp progress to 100 when over 100', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.updateProgress('ARC001', 150);

      expect(updated.progress).toBe(100);
    });

    it('should set progress to exact boundary values', () => {
      repo.create({ name: '剧情', type: 'main' });

      const atZero = repo.updateProgress('ARC001', 0);
      expect(atZero.progress).toBe(0);

      const atHundred = repo.updateProgress('ARC001', 100);
      expect(atHundred.progress).toBe(100);
    });
  });

  describe('updateStatus', () => {
    it('should update status to in_progress', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.updateStatus('ARC001', 'in_progress');

      expect(updated.status).toBe('in_progress');
    });

    it('should update status to complete', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.updateStatus('ARC001', 'complete');

      expect(updated.status).toBe('complete');
    });

    it('should update status back to planned', () => {
      repo.create({ name: '剧情', type: 'main', status: 'in_progress' });

      const updated = repo.updateStatus('ARC001', 'planned');

      expect(updated.status).toBe('planned');
    });
  });

  describe('addCharacterArc', () => {
    it('should add a character arc mapping', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.addCharacterArc('ARC001', 'C001', 'redemption');

      expect(updated.characterArcs).toEqual({ C001: 'redemption' });
    });

    it('should add multiple character arcs', () => {
      repo.create({ name: '剧情', type: 'main' });

      repo.addCharacterArc('ARC001', 'C001', 'redemption');
      const updated = repo.addCharacterArc('ARC001', 'C002', 'fall');

      expect(updated.characterArcs).toEqual({ C001: 'redemption', C002: 'fall' });
    });

    it('should overwrite existing character arc phase', () => {
      repo.create({ name: '剧情', type: 'main' });

      repo.addCharacterArc('ARC001', 'C001', 'redemption');
      const updated = repo.addCharacterArc('ARC001', 'C001', 'growth');

      expect(updated.characterArcs).toEqual({ C001: 'growth' });
    });

    it('should throw for non-existent arc', () => {
      expect(() => repo.addCharacterArc('ARC999', 'C001', 'test')).toThrow('Arc ARC999 not found');
    });
  });

  describe('removeCharacterArc', () => {
    it('should remove a character arc mapping', () => {
      repo.create({
        name: '剧情',
        type: 'main',
        characterArcs: { C001: 'redemption', C002: 'fall' },
      });

      const updated = repo.removeCharacterArc('ARC001', 'C001');

      expect(updated.characterArcs).toEqual({ C002: 'fall' });
    });

    it('should handle removing from empty characterArcs', () => {
      repo.create({ name: '剧情', type: 'main' });

      const updated = repo.removeCharacterArc('ARC001', 'C001');

      expect(updated.characterArcs).toEqual({});
    });

    it('should throw for non-existent arc', () => {
      expect(() => repo.removeCharacterArc('ARC999', 'C001')).toThrow('Arc ARC999 not found');
    });
  });

  describe('count', () => {
    it('should return 0 when no arcs exist', () => {
      expect(repo.count()).toBe(0);
    });

    it('should count all arcs', () => {
      repo.create({ name: '剧情1', type: 'main' });
      repo.create({ name: '剧情2', type: 'sub' });

      expect(repo.count()).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return false for non-existent arc', () => {
      expect(repo.exists('ARC001')).toBe(false);
    });

    it('should return true for existing arc', () => {
      repo.create({ name: '剧情', type: 'main' });

      expect(repo.exists('ARC001')).toBe(true);
      expect(repo.exists('ARC999')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an arc and return true', () => {
      repo.create({ name: '剧情', type: 'main' });

      const deleted = repo.delete('ARC001');

      expect(deleted).toBe(true);
      expect(repo.findById('ARC001')).toBeNull();
    });

    it('should return false for non-existent arc', () => {
      const deleted = repo.delete('ARC999');

      expect(deleted).toBe(false);
    });

    it('should decrement count after deletion', () => {
      repo.create({ name: '剧情1', type: 'main' });
      repo.create({ name: '剧情2', type: 'sub' });

      expect(repo.count()).toBe(2);

      repo.delete('ARC001');

      expect(repo.count()).toBe(1);
    });
  });

  describe('JSON serialization', () => {
    it('should correctly round-trip sections through JSON', () => {
      const sections: ArcSection[] = [
        { name: '序', chapters: [1, 2, 3], type: 'intro', status: 'planned' },
        { name: '发展', chapters: [4, 5], type: 'rising', status: 'in_progress' },
        { name: '高潮', chapters: [6, 7, 8], type: 'climax', status: 'planned' },
      ];

      repo.create({ name: '剧情', type: 'main', sections });

      const found = repo.findById('ARC001');

      expect(found?.sections).toEqual(sections);
    });

    it('should correctly round-trip characterArcs through JSON', () => {
      const characterArcs = { C001: 'hero_journey', C002: 'redemption', C003: 'tragic_fall' };

      repo.create({ name: '剧情', type: 'main', characterArcs });

      const found = repo.findById('ARC001');

      expect(found?.characterArcs).toEqual(characterArcs);
    });

    it('should omit sections and characterArcs when not provided', () => {
      repo.create({ name: '简单剧情', type: 'main' });

      const found = repo.findById('ARC001');

      expect(found?.sections).toBeUndefined();
      expect(found?.characterArcs).toBeUndefined();
    });
  });
});
