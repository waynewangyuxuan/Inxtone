/**
 * ForeshadowingRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { ForeshadowingRepository } from '../ForeshadowingRepository.js';
import type {
  ForeshadowingStatus,
  ForeshadowingTerm,
  ForeshadowingId,
} from '../../../types/entities.js';

describe('ForeshadowingRepository', () => {
  let db: Database;
  let repo: ForeshadowingRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new ForeshadowingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  // ─── create ───────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a foreshadowing with only required fields', () => {
      const fs = repo.create({ content: '主角的剑上有神秘纹路' });

      expect(fs.id).toBe('FS001');
      expect(fs.content).toBe('主角的剑上有神秘纹路');
      expect(fs.status).toBe('active');
      expect(fs.createdAt).toBeDefined();
      expect(fs.updatedAt).toBeDefined();
      // Optional fields should be absent
      expect(fs.plantedChapter).toBeUndefined();
      expect(fs.plantedText).toBeUndefined();
      expect(fs.plannedPayoff).toBeUndefined();
      expect(fs.term).toBeUndefined();
      expect(fs.hints).toBeUndefined(); // empty array is not surfaced
    });

    it('should create a foreshadowing with all fields', () => {
      const fs = repo.create({
        content: '老人的遗言暗示了宝藏位置',
        plantedChapter: 3,
        plantedText: '他指着东方，说了最后一句话……',
        plannedPayoff: 15,
        term: 'long',
      });

      expect(fs.id).toBe('FS001');
      expect(fs.content).toBe('老人的遗言暗示了宝藏位置');
      expect(fs.plantedChapter).toBe(3);
      expect(fs.plantedText).toBe('他指着东方，说了最后一句话……');
      expect(fs.plannedPayoff).toBe(15);
      expect(fs.term).toBe('long');
      expect(fs.status).toBe('active');
    });

    it('should auto-increment IDs with FS prefix', () => {
      const fs1 = repo.create({ content: '伏笔1' });
      const fs2 = repo.create({ content: '伏笔2' });
      const fs3 = repo.create({ content: '伏笔3' });

      expect(fs1.id).toBe('FS001');
      expect(fs2.id).toBe('FS002');
      expect(fs3.id).toBe('FS003');
    });

    it('should default status to active', () => {
      const fs = repo.create({ content: '默认状态' });
      expect(fs.status).toBe('active');
    });

    it('should initialize hints as empty array (not surfaced on entity)', () => {
      const fs = repo.create({ content: '空提示列表' });
      // mapRow only sets hints if the parsed array has length > 0
      expect(fs.hints).toBeUndefined();
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should find a foreshadowing by ID', () => {
      repo.create({ content: '秘密身份' });

      const found = repo.findById('FS001' as ForeshadowingId);

      expect(found).not.toBeNull();
      expect(found?.content).toBe('秘密身份');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById('FS999' as ForeshadowingId);
      expect(found).toBeNull();
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all foreshadowing ordered by created_at DESC', () => {
      repo.create({ content: '伏笔A' });
      repo.create({ content: '伏笔B' });
      repo.create({ content: '伏笔C' });

      const all = repo.findAll();

      expect(all).toHaveLength(3);
      // DESC order: most recently created first
      for (let i = 0; i < all.length - 1; i++) {
        expect(all[i].createdAt >= all[i + 1].createdAt).toBe(true);
      }
    });

    it('should return empty array when no foreshadowing exist', () => {
      const all = repo.findAll();
      expect(all).toHaveLength(0);
    });
  });

  // ─── findActive / findResolved / findAbandoned ────────────────────────

  describe('findActive', () => {
    it('should return only active foreshadowing ordered by created_at ASC', () => {
      repo.create({ content: 'active1' });
      repo.create({ content: 'active2' });
      const fs3 = repo.create({ content: 'to-resolve' });
      repo.resolve(fs3.id, 10);

      const active = repo.findActive();

      expect(active).toHaveLength(2);
      expect(active.every((f) => f.status === 'active')).toBe(true);
      // ASC order
      expect(active[0].createdAt <= active[1].createdAt).toBe(true);
    });
  });

  describe('findResolved', () => {
    it('should return only resolved foreshadowing ordered by resolved_chapter', () => {
      const fs1 = repo.create({ content: '伏笔1' });
      const fs2 = repo.create({ content: '伏笔2' });
      repo.create({ content: '伏笔3-still-active' });

      repo.resolve(fs1.id, 20);
      repo.resolve(fs2.id, 5);

      const resolved = repo.findResolved();

      expect(resolved).toHaveLength(2);
      expect(resolved.every((f) => f.status === 'resolved')).toBe(true);
      // Ordered by resolved_chapter ASC
      expect(resolved[0].resolvedChapter).toBe(5);
      expect(resolved[1].resolvedChapter).toBe(20);
    });
  });

  describe('findAbandoned', () => {
    it('should return only abandoned foreshadowing ordered by updated_at DESC', () => {
      const fs1 = repo.create({ content: '废弃1' });
      const fs2 = repo.create({ content: '废弃2' });
      repo.create({ content: '保留' });

      repo.abandon(fs1.id);
      repo.abandon(fs2.id);

      const abandoned = repo.findAbandoned();

      expect(abandoned).toHaveLength(2);
      expect(abandoned.every((f) => f.status === 'abandoned')).toBe(true);
      // DESC order by updated_at
      expect(abandoned[0].updatedAt >= abandoned[1].updatedAt).toBe(true);
    });
  });

  // ─── findByStatus ─────────────────────────────────────────────────────

  describe('findByStatus', () => {
    it('should filter by active status', () => {
      repo.create({ content: 'a1' });
      repo.create({ content: 'a2' });
      const fs3 = repo.create({ content: 'r1' });
      repo.resolve(fs3.id, 5);

      const active = repo.findByStatus('active' as ForeshadowingStatus);
      expect(active).toHaveLength(2);
    });

    it('should filter by resolved status', () => {
      const fs1 = repo.create({ content: 'r1' });
      repo.resolve(fs1.id, 10);

      const resolved = repo.findByStatus('resolved' as ForeshadowingStatus);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].status).toBe('resolved');
    });

    it('should filter by abandoned status', () => {
      const fs1 = repo.create({ content: 'ab1' });
      repo.abandon(fs1.id);

      const abandoned = repo.findByStatus('abandoned' as ForeshadowingStatus);
      expect(abandoned).toHaveLength(1);
      expect(abandoned[0].status).toBe('abandoned');
    });
  });

  // ─── findByTerm ───────────────────────────────────────────────────────

  describe('findByTerm', () => {
    it('should filter foreshadowing by term', () => {
      repo.create({ content: '短期伏笔', term: 'short' });
      repo.create({ content: '中期伏笔', term: 'mid' });
      repo.create({ content: '长期伏笔A', term: 'long' });
      repo.create({ content: '长期伏笔B', term: 'long' });
      repo.create({ content: '无期限' }); // no term

      expect(repo.findByTerm('short' as ForeshadowingTerm)).toHaveLength(1);
      expect(repo.findByTerm('mid' as ForeshadowingTerm)).toHaveLength(1);
      expect(repo.findByTerm('long' as ForeshadowingTerm)).toHaveLength(2);
    });
  });

  // ─── findByPlantedChapter / findByResolvedChapter ─────────────────────

  describe('findByPlantedChapter', () => {
    it('should find foreshadowing planted in a specific chapter', () => {
      repo.create({ content: '第3章伏笔A', plantedChapter: 3 });
      repo.create({ content: '第3章伏笔B', plantedChapter: 3 });
      repo.create({ content: '第5章伏笔', plantedChapter: 5 });

      const ch3 = repo.findByPlantedChapter(3);
      expect(ch3).toHaveLength(2);
      expect(ch3.every((f) => f.plantedChapter === 3)).toBe(true);
    });

    it('should return empty array when no foreshadowing planted in chapter', () => {
      repo.create({ content: '其他章', plantedChapter: 1 });
      expect(repo.findByPlantedChapter(99)).toHaveLength(0);
    });
  });

  describe('findByResolvedChapter', () => {
    it('should find foreshadowing resolved in a specific chapter', () => {
      const fs1 = repo.create({ content: '伏笔A' });
      const fs2 = repo.create({ content: '伏笔B' });
      repo.resolve(fs1.id, 10);
      repo.resolve(fs2.id, 10);

      const ch10 = repo.findByResolvedChapter(10);
      expect(ch10).toHaveLength(2);
      expect(ch10.every((f) => f.resolvedChapter === 10)).toBe(true);
    });
  });

  // ─── findOverdue ──────────────────────────────────────────────────────

  describe('findOverdue', () => {
    it('should return active foreshadowing past their planned payoff', () => {
      repo.create({ content: '按时完成', plannedPayoff: 20 });
      repo.create({ content: '超期A', plannedPayoff: 5 });
      repo.create({ content: '超期B', plannedPayoff: 8 });
      repo.create({ content: '无期限' }); // no planned payoff

      const overdue = repo.findOverdue(10);
      expect(overdue).toHaveLength(2);
      expect(overdue.every((f) => f.plannedPayoff! < 10)).toBe(true);
    });

    it('should not include resolved foreshadowing even if planned_payoff < currentChapter', () => {
      const fs1 = repo.create({ content: '已解决', plannedPayoff: 3 });
      repo.resolve(fs1.id, 4);

      const overdue = repo.findOverdue(10);
      expect(overdue).toHaveLength(0);
    });

    it('should not include abandoned foreshadowing', () => {
      const fs1 = repo.create({ content: '已放弃', plannedPayoff: 3 });
      repo.abandon(fs1.id);

      const overdue = repo.findOverdue(10);
      expect(overdue).toHaveLength(0);
    });

    it('should not include active foreshadowing without planned_payoff', () => {
      repo.create({ content: '无计划' });

      const overdue = repo.findOverdue(10);
      expect(overdue).toHaveLength(0);
    });

    it('should order by planned_payoff ascending', () => {
      repo.create({ content: '后超期', plannedPayoff: 8 });
      repo.create({ content: '先超期', plannedPayoff: 3 });

      const overdue = repo.findOverdue(10);
      expect(overdue[0].plannedPayoff).toBe(3);
      expect(overdue[1].plannedPayoff).toBe(8);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update content', () => {
      repo.create({ content: '原始内容' });

      const updated = repo.update('FS001' as ForeshadowingId, { content: '修改后内容' });

      expect(updated.content).toBe('修改后内容');
    });

    it('should partial update without affecting other fields', () => {
      const created = repo.create({
        content: '原始',
        plantedChapter: 1,
        term: 'short',
      });

      const updated = repo.update(created.id, { content: '修改' });

      expect(updated.content).toBe('修改');
      expect(updated.plantedChapter).toBe(1);
      expect(updated.term).toBe('short');
    });

    it('should update plantedChapter, plantedText, plannedPayoff, term', () => {
      const fs = repo.create({ content: '伏笔' });

      const updated = repo.update(fs.id, {
        plantedChapter: 5,
        plantedText: '新种植文本',
        plannedPayoff: 20,
        term: 'mid',
      });

      expect(updated.plantedChapter).toBe(5);
      expect(updated.plantedText).toBe('新种植文本');
      expect(updated.plannedPayoff).toBe(20);
      expect(updated.term).toBe('mid');
    });

    it('should update updatedAt timestamp', () => {
      const created = repo.create({ content: '测试' });
      const updated = repo.update(created.id, { content: '更新' });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.createdAt).getTime()
      );
    });

    it('should throw for non-existent foreshadowing', () => {
      expect(() => repo.update('FS999' as ForeshadowingId, { content: 'x' })).toThrow(
        'Foreshadowing FS999 not found'
      );
    });
  });

  // ─── addHint ──────────────────────────────────────────────────────────

  describe('addHint', () => {
    it('should add a hint to a foreshadowing with no previous hints', () => {
      const fs = repo.create({ content: '谜题' });

      const updated = repo.addHint(fs.id, 5, '第一个线索');

      expect(updated.hints).toHaveLength(1);
      expect(updated.hints![0]).toEqual({ chapter: 5, text: '第一个线索' });
    });

    it('should append multiple hints preserving order', () => {
      const fs = repo.create({ content: '连续线索' });

      repo.addHint(fs.id, 3, '线索一');
      repo.addHint(fs.id, 7, '线索二');
      const updated = repo.addHint(fs.id, 12, '线索三');

      expect(updated.hints).toHaveLength(3);
      expect(updated.hints![0]).toEqual({ chapter: 3, text: '线索一' });
      expect(updated.hints![1]).toEqual({ chapter: 7, text: '线索二' });
      expect(updated.hints![2]).toEqual({ chapter: 12, text: '线索三' });
    });

    it('should throw for non-existent foreshadowing', () => {
      expect(() => repo.addHint('FS999' as ForeshadowingId, 1, 'hint')).toThrow(
        'Foreshadowing FS999 not found'
      );
    });

    it('should correctly serialize and deserialize hints JSON', () => {
      const fs = repo.create({ content: '序列化测试' });
      repo.addHint(fs.id, 1, '含有"引号"和特殊字符<>&');

      const found = repo.findById(fs.id);
      expect(found!.hints![0].text).toBe('含有"引号"和特殊字符<>&');
    });
  });

  // ─── State Machine: resolve / abandon / reactivate ────────────────────

  describe('resolve', () => {
    it('should resolve an active foreshadowing', () => {
      const fs = repo.create({ content: '待解决' });

      const resolved = repo.resolve(fs.id, 15);

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolvedChapter).toBe(15);
    });

    it('should throw when resolving a resolved foreshadowing', () => {
      const fs = repo.create({ content: '已解决' });
      repo.resolve(fs.id, 10);

      expect(() => repo.resolve(fs.id, 20)).toThrow(
        `Foreshadowing ${fs.id} is not active (status: resolved)`
      );
    });

    it('should throw when resolving an abandoned foreshadowing', () => {
      const fs = repo.create({ content: '已放弃' });
      repo.abandon(fs.id);

      expect(() => repo.resolve(fs.id, 10)).toThrow(
        `Foreshadowing ${fs.id} is not active (status: abandoned)`
      );
    });

    it('should throw for non-existent foreshadowing', () => {
      expect(() => repo.resolve('FS999' as ForeshadowingId, 10)).toThrow(
        'Foreshadowing FS999 not found'
      );
    });
  });

  describe('abandon', () => {
    it('should abandon an active foreshadowing', () => {
      const fs = repo.create({ content: '待放弃' });

      const abandoned = repo.abandon(fs.id);

      expect(abandoned.status).toBe('abandoned');
    });

    it('should throw when abandoning a resolved foreshadowing', () => {
      const fs = repo.create({ content: '已解决' });
      repo.resolve(fs.id, 10);

      expect(() => repo.abandon(fs.id)).toThrow(
        `Foreshadowing ${fs.id} is not active (status: resolved)`
      );
    });

    it('should throw when abandoning an already abandoned foreshadowing', () => {
      const fs = repo.create({ content: '已放弃' });
      repo.abandon(fs.id);

      expect(() => repo.abandon(fs.id)).toThrow(
        `Foreshadowing ${fs.id} is not active (status: abandoned)`
      );
    });
  });

  describe('reactivate', () => {
    it('should reactivate an abandoned foreshadowing', () => {
      const fs = repo.create({ content: '复活' });
      repo.abandon(fs.id);

      const reactivated = repo.reactivate(fs.id);

      expect(reactivated.status).toBe('active');
    });

    it('should throw when reactivating an active foreshadowing', () => {
      const fs = repo.create({ content: '活跃的' });

      expect(() => repo.reactivate(fs.id)).toThrow(
        `Foreshadowing ${fs.id} is not abandoned (status: active)`
      );
    });

    it('should throw when reactivating a resolved foreshadowing', () => {
      const fs = repo.create({ content: '已解决' });
      repo.resolve(fs.id, 10);

      expect(() => repo.reactivate(fs.id)).toThrow(
        `Foreshadowing ${fs.id} is not abandoned (status: resolved)`
      );
    });

    it('should allow full lifecycle: active -> abandoned -> active -> resolved', () => {
      const fs = repo.create({ content: '完整生命周期' });
      expect(fs.status).toBe('active');

      const abandoned = repo.abandon(fs.id);
      expect(abandoned.status).toBe('abandoned');

      const reactivated = repo.reactivate(fs.id);
      expect(reactivated.status).toBe('active');

      const resolved = repo.resolve(fs.id, 25);
      expect(resolved.status).toBe('resolved');
      expect(resolved.resolvedChapter).toBe(25);
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return zero counts when empty', () => {
      const stats = repo.getStats();
      expect(stats).toEqual({ active: 0, resolved: 0, abandoned: 0, total: 0 });
    });

    it('should count correctly across all statuses', () => {
      repo.create({ content: 'a1' });
      repo.create({ content: 'a2' });
      const fs3 = repo.create({ content: 'r1' });
      const fs4 = repo.create({ content: 'ab1' });
      const fs5 = repo.create({ content: 'ab2' });

      repo.resolve(fs3.id, 10);
      repo.abandon(fs4.id);
      repo.abandon(fs5.id);

      const stats = repo.getStats();

      expect(stats.active).toBe(2);
      expect(stats.resolved).toBe(1);
      expect(stats.abandoned).toBe(2);
      expect(stats.total).toBe(5);
    });
  });

  // ─── count / exists / delete (BaseRepository) ────────────────────────

  describe('count', () => {
    it('should return 0 when empty', () => {
      expect(repo.count()).toBe(0);
    });

    it('should count all foreshadowing regardless of status', () => {
      repo.create({ content: 'a' });
      const fs2 = repo.create({ content: 'b' });
      repo.resolve(fs2.id, 5);

      expect(repo.count()).toBe(2);
    });
  });

  describe('exists', () => {
    it('should return false for non-existent ID', () => {
      expect(repo.exists('FS001' as ForeshadowingId)).toBe(false);
    });

    it('should return true for existing ID', () => {
      repo.create({ content: '存在' });
      expect(repo.exists('FS001' as ForeshadowingId)).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a foreshadowing and return true', () => {
      repo.create({ content: '删除目标' });

      const deleted = repo.delete('FS001' as ForeshadowingId);

      expect(deleted).toBe(true);
      expect(repo.findById('FS001' as ForeshadowingId)).toBeNull();
      expect(repo.count()).toBe(0);
    });

    it('should return false for non-existent ID', () => {
      const deleted = repo.delete('FS999' as ForeshadowingId);
      expect(deleted).toBe(false);
    });
  });
});
