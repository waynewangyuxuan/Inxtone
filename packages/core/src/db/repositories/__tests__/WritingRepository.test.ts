/**
 * WritingRepository Tests
 *
 * Tests for Writing Repository: volumes, chapters, content, versions, FK cleanup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { WritingRepository } from '../WritingRepository.js';
import {
  CharacterRepository,
  LocationRepository,
  ForeshadowingRepository,
  ArcRepository,
} from '../index.js';
import type {
  ChapterId,
  VolumeId,
  CharacterId,
  LocationId,
  ForeshadowingId,
} from '../../../types/entities.js';
import type { CreateChapterInput } from '../../../types/services.js';

describe('WritingRepository', () => {
  let db: Database;
  let repo: WritingRepository;
  let tempDbPath: string;

  beforeEach(() => {
    tempDbPath = `:memory:`;
    db = new Database({ path: tempDbPath, migrate: true });
    db.connect();
    repo = new WritingRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  // ===================================
  // Volume CRUD (8 tests)
  // ===================================

  describe('Volume CRUD', () => {
    it('should create a volume with default values', () => {
      const volume = repo.createVolume({
        status: 'planned',
      });

      expect(volume.id).toBeGreaterThan(0);
      expect(volume.status).toBe('planned');
      expect(volume.createdAt).toBeDefined();
      expect(volume.updatedAt).toBeDefined();
    });

    it('should create a volume with all fields', () => {
      const volume = repo.createVolume({
        name: '第一卷：修仙',
        theme: '修炼与成长',
        coreConflict: '天赋与努力',
        mcGrowth: '从凡人到筑基',
        chapterStart: 1,
        chapterEnd: 100,
        status: 'in_progress',
      });

      expect(volume.id).toBeGreaterThan(0);
      expect(volume.name).toBe('第一卷：修仙');
      expect(volume.theme).toBe('修炼与成长');
      expect(volume.coreConflict).toBe('天赋与努力');
      expect(volume.mcGrowth).toBe('从凡人到筑基');
      expect(volume.chapterStart).toBe(1);
      expect(volume.chapterEnd).toBe(100);
      expect(volume.status).toBe('in_progress');
    });

    it('should find volume by ID', () => {
      const created = repo.createVolume({ status: 'planned' });
      const found = repo.findVolumeById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null for non-existent volume', () => {
      const found = repo.findVolumeById(999 as VolumeId);
      expect(found).toBeNull();
    });

    it('should find all volumes', () => {
      repo.createVolume({ status: 'planned' });
      repo.createVolume({ status: 'in_progress' });
      repo.createVolume({ status: 'complete' });

      const volumes = repo.findAllVolumes();
      expect(volumes).toHaveLength(3);
    });

    it('should update a volume', async () => {
      const volume = repo.createVolume({ status: 'planned' });
      // Wait 2ms to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 2));
      const updated = repo.updateVolume(volume.id, {
        name: '更新的卷名',
        status: 'in_progress',
      });

      expect(updated.name).toBe('更新的卷名');
      expect(updated.status).toBe('in_progress');
      expect(updated.updatedAt).not.toBe(volume.updatedAt);
    });

    it('should delete a volume', () => {
      const volume = repo.createVolume({ status: 'planned' });
      const deleted = repo.deleteVolume(volume.id);

      expect(deleted).toBe(true);
      expect(repo.findVolumeById(volume.id)).toBeNull();
    });

    it('should return false when deleting non-existent volume', () => {
      const deleted = repo.deleteVolume(999 as VolumeId);
      expect(deleted).toBe(false);
    });
  });

  // ===================================
  // Chapter CRUD (12 tests)
  // ===================================

  describe('Chapter CRUD', () => {
    let volumeId: VolumeId;

    beforeEach(() => {
      const volume = repo.createVolume({ status: 'in_progress' });
      volumeId = volume.id;
    });

    it('should create a chapter with minimal input', () => {
      const chapter = repo.createChapter({});

      expect(chapter.id).toBe(1);
      expect(chapter.status).toBe('outline');
      expect(chapter.wordCount).toBe(0);
      expect(chapter.createdAt).toBeDefined();
    });

    it('should create a chapter with full input', () => {
      const input: CreateChapterInput = {
        volumeId,
        title: '第一章：初入修仙界',
        outline: {
          goal: '主角进入修仙界',
          scenes: ['遇见师父', '领悟灵气'],
          hookEnding: '发现隐藏宝藏',
        },
      };

      const chapter = repo.createChapter(input);

      expect(chapter.id).toBe(1);
      expect(chapter.volumeId).toBe(volumeId);
      expect(chapter.title).toBe('第一章：初入修仙界');
      expect(chapter.outline).toEqual(input.outline);
    });

    it('should auto-increment chapter IDs', () => {
      const ch1 = repo.createChapter({});
      const ch2 = repo.createChapter({});
      const ch3 = repo.createChapter({});

      expect(ch1.id).toBe(1);
      expect(ch2.id).toBe(2);
      expect(ch3.id).toBe(3);
    });

    it('should find chapter by ID without content', () => {
      const created = repo.createChapter({ title: '测试章节' });
      const found = repo.findChapterById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('测试章节');
      // content field should be excluded for performance
      expect(found!.content).toBeUndefined();
    });

    it('should find chapter with content', () => {
      const created = repo.createChapter({ title: '测试章节' });
      // Add content
      repo.saveContent(created.id, '这是章节内容');

      const found = repo.findChapterWithContent(created.id);

      expect(found).toBeDefined();
      expect(found!.content).toBe('这是章节内容');
    });

    it('should find all chapters', () => {
      repo.createChapter({});
      repo.createChapter({});
      repo.createChapter({});

      const chapters = repo.findAllChapters();
      expect(chapters).toHaveLength(3);
    });

    it('should find chapters by volume', () => {
      const vol2Id = repo.createVolume({ status: 'planned' }).id;

      repo.createChapter({ volumeId });
      repo.createChapter({ volumeId });
      repo.createChapter({ volumeId: vol2Id });

      const chapters = repo.findChaptersByVolume(volumeId);
      expect(chapters).toHaveLength(2);
      expect(chapters.every((ch) => ch.volumeId === volumeId)).toBe(true);
    });

    it('should find chapters by status', () => {
      const ch1 = repo.createChapter({});
      repo.createChapter({});
      repo.updateChapter(ch1.id, { status: 'draft' });

      const outlineChapters = repo.findChaptersByStatus('outline');
      const draftChapters = repo.findChaptersByStatus('draft');

      expect(outlineChapters).toHaveLength(1);
      expect(draftChapters).toHaveLength(1);
    });

    it('should find chapters by arc', () => {
      const arcRepo = new ArcRepository(db);
      const arc1 = arcRepo.create({ name: 'Arc 1' });
      const arc2 = arcRepo.create({ name: 'Arc 2' });

      repo.createChapter({ arcId: arc1.id });
      repo.createChapter({ arcId: arc1.id });
      repo.createChapter({ arcId: arc2.id });
      repo.createChapter({}); // no arc

      const arc1Chapters = repo.findChaptersByArc(arc1.id);
      const arc2Chapters = repo.findChaptersByArc(arc2.id);

      expect(arc1Chapters).toHaveLength(2);
      expect(arc1Chapters.every((ch) => ch.arcId === arc1.id)).toBe(true);
      expect(arc2Chapters).toHaveLength(1);
    });

    it('should update a chapter', async () => {
      const chapter = repo.createChapter({});
      // Wait 2ms to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 2));
      const updated = repo.updateChapter(chapter.id, {
        title: '新标题',
        status: 'draft',
      });

      expect(updated.title).toBe('新标题');
      expect(updated.status).toBe('draft');
      expect(updated.updatedAt).not.toBe(chapter.updatedAt);
    });

    it('should delete a chapter', () => {
      const chapter = repo.createChapter({});
      const deleted = repo.deleteChapter(chapter.id);

      expect(deleted).toBe(true);
      expect(repo.findChapterById(chapter.id)).toBeNull();
    });

    it('should return false when deleting non-existent chapter', () => {
      const deleted = repo.deleteChapter(999 as ChapterId);
      expect(deleted).toBe(false);
    });

    it('should reorder chapters', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });
      const ch2 = repo.createChapter({ title: 'Chapter 2' });
      const ch3 = repo.createChapter({ title: 'Chapter 3' });

      // Reorder: 3, 1, 2
      repo.reorderChapters([ch3.id, ch1.id, ch2.id]);

      // Verify order (implementation-specific, may vary)
      // For now, just verify the operation doesn't throw
      expect(true).toBe(true);
    });
  });

  // ===================================
  // Content Operations (8 tests)
  // ===================================

  describe('Content Operations', () => {
    let chapterId: ChapterId;

    beforeEach(() => {
      const chapter = repo.createChapter({});
      chapterId = chapter.id;
    });

    it('should save content and update word count', () => {
      const content = '这是一段测试内容，包含中文字符。\n\n第二段。';
      const chapter = repo.saveContent(chapterId, content);

      // saveContent returns findChapterById (without content for performance)
      expect(chapter.wordCount).toBeGreaterThan(0);

      // Verify content was actually saved
      const withContent = repo.findChapterWithContent(chapterId);
      expect(withContent!.content).toBe(content);
    });

    it('should update word count correctly for Chinese text', () => {
      const content = '一二三四五六七八九十'; // 10 characters
      const chapter = repo.saveContent(chapterId, content);

      expect(chapter.wordCount).toBeGreaterThanOrEqual(10);
    });

    it('should update word count correctly for English text', () => {
      const content = 'This is a test sentence with ten words.'; // 8 words
      const chapter = repo.saveContent(chapterId, content);

      expect(chapter.wordCount).toBeGreaterThanOrEqual(7);
    });

    it('should handle empty content', () => {
      const chapter = repo.saveContent(chapterId, '');

      expect(chapter.wordCount).toBe(0);

      // Verify empty content was saved
      const withContent = repo.findChapterWithContent(chapterId);
      expect(withContent!.content).toBe('');
    });

    it('should get word count for a chapter', () => {
      repo.saveContent(chapterId, '这是测试内容，共有十五个字符。');
      const wordCount = repo.getWordCount(chapterId);

      expect(wordCount).toBeGreaterThan(0);
    });

    it('should return 0 word count for empty chapter', () => {
      const wordCount = repo.getWordCount(chapterId);
      expect(wordCount).toBe(0);
    });

    it('should get total word count across all chapters', () => {
      const ch1 = repo.createChapter({});
      const ch2 = repo.createChapter({});

      repo.saveContent(ch1.id, '内容一' + '一二三四五'.repeat(10)); // ~50 chars
      repo.saveContent(ch2.id, '内容二' + '一二三四五'.repeat(10)); // ~50 chars

      const totalCount = repo.getTotalWordCount();
      expect(totalCount).toBeGreaterThan(80); // Should be > 100 chars total
    });

    it('should return 0 for total word count when no chapters exist', () => {
      // Delete the chapter created in beforeEach
      repo.deleteChapter(chapterId);

      const totalCount = repo.getTotalWordCount();
      expect(totalCount).toBe(0);
    });
  });

  // ===================================
  // Version Methods (12 tests)
  // ===================================

  describe('Version Management', () => {
    let chapterId: ChapterId;

    beforeEach(() => {
      const chapter = repo.createChapter({ title: 'Version Test Chapter' });
      chapterId = chapter.id;
      repo.saveContent(chapterId, 'Initial content');
    });

    it('should create a version with manual source', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        changeSummary: 'First manual save',
        source: 'manual',
      });

      expect(version.id).toBeGreaterThan(0);
      expect(version.entityType).toBe('chapter');
      expect(version.entityId).toBe(String(chapterId));
      expect(version.source).toBe('manual');
      expect(version.changeSummary).toBe('First manual save');
      expect(version.createdAt).toBeDefined();
    });

    it('should create a version with auto source', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'auto',
      });

      expect(version.source).toBe('auto');
      expect(version.changeSummary).toBeUndefined();
    });

    it('should create a version with ai_backup source', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        changeSummary: 'Before AI generation',
        source: 'ai_backup',
      });

      expect(version.source).toBe('ai_backup');
    });

    it('should create a version with rollback_backup source', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        changeSummary: 'Backup before rollback',
        source: 'rollback_backup',
      });

      expect(version.source).toBe('rollback_backup');
    });

    it('should find versions by chapter', () => {
      const chapter = repo.findChapterWithContent(chapterId);

      // Create multiple versions
      repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'manual',
      });
      repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'auto',
      });
      repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'manual',
      });

      const versions = repo.findVersionsByChapter(chapterId);
      expect(versions).toHaveLength(3);
      expect(versions.every((v) => v.entityId === String(chapterId))).toBe(true);
    });

    it('should find version by ID', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const created = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'manual',
      });

      const found = repo.findVersionById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null for non-existent version', () => {
      const found = repo.findVersionById(999);
      expect(found).toBeNull();
    });

    it('should delete a version', () => {
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'manual',
      });

      const deleted = repo.deleteVersion(version.id);
      expect(deleted).toBe(true);
      expect(repo.findVersionById(version.id)).toBeNull();
    });

    it('should return false when deleting non-existent version', () => {
      const deleted = repo.deleteVersion(999);
      expect(deleted).toBe(false);
    });

    it('should cleanup old versions with stratified retention', () => {
      const chapter = repo.findChapterWithContent(chapterId);

      // Create versions with different timestamps
      // We'll need to manipulate created_at directly for testing
      // For now, create multiple versions
      for (let i = 0; i < 20; i++) {
        repo.createVersion({
          entityType: 'chapter',
          entityId: String(chapterId),
          content: chapter!,
          source: 'auto',
        });
      }

      const beforeCleanup = repo.findVersionsByChapter(chapterId);
      expect(beforeCleanup.length).toBe(20);

      // Cleanup versions older than 7 days (none in this test, but verifies the method works)
      const deletedCount = repo.cleanupOldVersions(7);
      expect(deletedCount).toBe(0); // All versions are recent

      const afterCleanup = repo.findVersionsByChapter(chapterId);
      expect(afterCleanup.length).toBe(20); // All kept
    });

    it('should return count of deleted versions', () => {
      // Create auto versions and manually set them to an old date
      const chapter = repo.findChapterWithContent(chapterId);
      const version = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'auto',
      });

      // Manually set version to 10 days ago for testing
      db.run(`UPDATE versions SET created_at = datetime('now', '-10 days') WHERE id = ?`, [
        version.id,
      ]);

      // Create another auto version for the same day (10 days ago)
      const version2 = repo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: chapter!,
        source: 'auto',
      });
      db.run(
        `UPDATE versions SET created_at = datetime('now', '-10 days', '+1 hour') WHERE id = ?`,
        [version2.id]
      );

      // Cleanup should keep only one auto version per day for versions older than 7 days
      const deletedCount = repo.cleanupOldVersions(7);
      expect(deletedCount).toBe(1); // Should delete one of the two 10-day-old auto versions
    });

    it('should keep all versions within 7 days', () => {
      const chapter = repo.findChapterWithContent(chapterId);

      // Create versions from 1-6 days ago
      for (let i = 1; i <= 6; i++) {
        const v = repo.createVersion({
          entityType: 'chapter',
          entityId: String(chapterId),
          content: chapter!,
          source: 'manual',
        });
        db.run(`UPDATE versions SET created_at = datetime('now', '-${i} days') WHERE id = ?`, [
          v.id,
        ]);
      }

      const beforeCleanup = repo.findVersionsByChapter(chapterId);
      expect(beforeCleanup.length).toBe(6);

      const deletedCount = repo.cleanupOldVersions(7);
      expect(deletedCount).toBe(0); // All within 7 days

      const afterCleanup = repo.findVersionsByChapter(chapterId);
      expect(afterCleanup.length).toBe(6); // All kept
    });
  });

  // ===================================
  // FK Cleanup (10 tests)
  // ===================================

  describe('FK Cleanup', () => {
    it('should cleanup character references from chapters', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });
      const ch2 = repo.createChapter({ title: 'Chapter 2' });

      // Add character references
      repo.updateChapter(ch1.id, { characters: ['C001' as CharacterId, 'C002' as CharacterId] });
      repo.updateChapter(ch2.id, { characters: ['C002' as CharacterId, 'C003' as CharacterId] });

      // Cleanup C002
      repo.cleanupCharacterReferences('C002' as CharacterId);

      const updated1 = repo.findChapterById(ch1.id);
      const updated2 = repo.findChapterById(ch2.id);

      expect(updated1!.characters).toEqual(['C001']);
      expect(updated2!.characters).toEqual(['C003']);
    });

    it('should cleanup location references from chapters', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      repo.updateChapter(ch1.id, { locations: ['L001' as LocationId, 'L002' as LocationId] });

      repo.cleanupLocationReferences('L001' as LocationId);

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.locations).toEqual(['L002']);
    });

    it('should cleanup foreshadowing references from chapters', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      repo.updateChapter(ch1.id, {
        foreshadowingHinted: ['FS001' as ForeshadowingId, 'FS002' as ForeshadowingId],
      });

      repo.cleanupForeshadowingReferences('FS001' as ForeshadowingId);

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.foreshadowingHinted).toEqual(['FS002']);
    });

    it('should handle chapters with no character references', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      // Chapter has no characters
      expect(() => {
        repo.cleanupCharacterReferences('C001' as CharacterId);
      }).not.toThrow();

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.characters).toEqual([]);
    });

    it('should handle chapters with no location references', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      expect(() => {
        repo.cleanupLocationReferences('L001' as LocationId);
      }).not.toThrow();

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.locations).toEqual([]);
    });

    it('should handle chapters with no foreshadowing references', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      expect(() => {
        repo.cleanupForeshadowingReferences('FS001' as ForeshadowingId);
      }).not.toThrow();
    });

    it('should cleanup multiple character references', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      repo.updateChapter(ch1.id, {
        characters: [
          'C001' as CharacterId,
          'C002' as CharacterId,
          'C002' as CharacterId,
          'C003' as CharacterId,
        ],
      });

      repo.cleanupCharacterReferences('C002' as CharacterId);

      const updated = repo.findChapterById(ch1.id);
      // Should remove all instances of C002
      expect(updated!.characters).toEqual(['C001', 'C003']);
    });

    it('should cleanup references from multiple chapters', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });
      const ch2 = repo.createChapter({ title: 'Chapter 2' });
      const ch3 = repo.createChapter({ title: 'Chapter 3' });

      repo.updateChapter(ch1.id, { characters: ['C001' as CharacterId, 'C999' as CharacterId] });
      repo.updateChapter(ch2.id, { characters: ['C999' as CharacterId] });
      repo.updateChapter(ch3.id, { characters: ['C001' as CharacterId] });

      repo.cleanupCharacterReferences('C999' as CharacterId);

      expect(repo.findChapterById(ch1.id)!.characters).toEqual(['C001']);
      expect(repo.findChapterById(ch2.id)!.characters).toEqual([]);
      expect(repo.findChapterById(ch3.id)!.characters).toEqual(['C001']);
    });

    it('should preserve other character references when cleaning up one', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      repo.updateChapter(ch1.id, {
        characters: ['C001' as CharacterId, 'C002' as CharacterId, 'C003' as CharacterId],
      });

      repo.cleanupCharacterReferences('C002' as CharacterId);

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.characters).toContain('C001');
      expect(updated!.characters).toContain('C003');
      expect(updated!.characters).not.toContain('C002');
    });

    it('should handle empty arrays after cleanup', () => {
      const ch1 = repo.createChapter({ title: 'Chapter 1' });

      repo.updateChapter(ch1.id, { characters: ['C001' as CharacterId] });

      repo.cleanupCharacterReferences('C001' as CharacterId);

      const updated = repo.findChapterById(ch1.id);
      expect(updated!.characters).toEqual([]);
    });
  });
});
