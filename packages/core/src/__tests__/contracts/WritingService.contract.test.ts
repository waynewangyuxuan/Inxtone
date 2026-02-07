/**
 * Contract Tests for IWritingService
 *
 * These tests verify that implementations conform to the interface contract.
 * They test return value structures, not implementation details.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockWritingService } from '../mocks/MockWritingService.js';
import type { IWritingService } from '../../types/services.js';

describe('IWritingService Contract', () => {
  let service: IWritingService;

  beforeEach(() => {
    service = new MockWritingService();
  });

  describe('Chapter Operations', () => {
    it('createChapter returns a Chapter with required fields', async () => {
      const chapter = await service.createChapter({
        title: 'Test Chapter',
      });

      expect(chapter).toHaveProperty('id');
      expect(typeof chapter.id).toBe('number');
      expect(chapter).toHaveProperty('status', 'outline');
      expect(chapter).toHaveProperty('wordCount', 0);
      expect(chapter).toHaveProperty('createdAt');
      expect(chapter).toHaveProperty('updatedAt');
    });

    it('createChapter accepts optional fields', async () => {
      const chapter = await service.createChapter({
        title: 'Chapter 1',
        volumeId: 1,
        arcId: 'ARC001',
        outline: {
          goal: 'Introduce protagonist',
          scenes: ['Scene 1', 'Scene 2'],
          hookEnding: 'Mysterious stranger appears',
        },
      });

      expect(chapter.volumeId).toBe(1);
      expect(chapter.arcId).toBe('ARC001');
      expect(chapter.outline).toBeDefined();
      expect(chapter.outline!.goal).toBe('Introduce protagonist');
    });

    it('getChapter returns null for non-existent id', async () => {
      const chapter = await service.getChapter(9999);
      expect(chapter).toBeNull();
    });

    it('getChapter returns the created chapter', async () => {
      const created = await service.createChapter({ title: 'Find Me' });
      const found = await service.getChapter(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('Find Me');
    });

    it('getChapterWithContent returns chapter', async () => {
      const created = await service.createChapter({ title: 'Content Test' });
      await service.saveContent({ chapterId: created.id, content: 'Some content here' });

      const found = await service.getChapterWithContent(created.id);

      expect(found).not.toBeNull();
      expect(found!.content).toBe('Some content here');
    });

    it('getAllChapters returns sorted array', async () => {
      await service.createChapter({ title: 'Chapter 1' });
      await service.createChapter({ title: 'Chapter 2' });
      await service.createChapter({ title: 'Chapter 3' });

      const chapters = await service.getAllChapters();

      expect(Array.isArray(chapters)).toBe(true);
      expect(chapters.length).toBe(3);
      // Should be sorted by id
      expect(chapters[0].id).toBeLessThan(chapters[1].id);
      expect(chapters[1].id).toBeLessThan(chapters[2].id);
    });

    it('getChaptersByVolume filters correctly', async () => {
      const vol1 = await service.createVolume({ status: 'in_progress' });
      const vol2 = await service.createVolume({ status: 'planned' });

      await service.createChapter({ title: 'Vol1 Ch1', volumeId: vol1.id });
      await service.createChapter({ title: 'Vol1 Ch2', volumeId: vol1.id });
      await service.createChapter({ title: 'Vol2 Ch1', volumeId: vol2.id });

      const vol1Chapters = await service.getChaptersByVolume(vol1.id);

      expect(vol1Chapters.length).toBe(2);
      expect(vol1Chapters.every((c) => c.volumeId === vol1.id)).toBe(true);
    });

    it('getChaptersByArc filters correctly', async () => {
      await service.createChapter({ title: 'Arc1 Ch1', arcId: 'ARC001' });
      await service.createChapter({ title: 'Arc1 Ch2', arcId: 'ARC001' });
      await service.createChapter({ title: 'Arc2 Ch1', arcId: 'ARC002' });

      const arcChapters = await service.getChaptersByArc('ARC001');

      expect(arcChapters.length).toBe(2);
      expect(arcChapters.every((c) => c.arcId === 'ARC001')).toBe(true);
    });

    it('getChaptersByStatus filters correctly', async () => {
      await service.createChapter({ title: 'Draft 1' });
      const ch2 = await service.createChapter({ title: 'Draft 2' });
      await service.updateChapter(ch2.id, { status: 'draft' });

      const drafts = await service.getChaptersByStatus('draft');

      expect(drafts.length).toBe(1);
      expect(drafts[0].status).toBe('draft');
    });

    it('updateChapter returns updated chapter', async () => {
      const created = await service.createChapter({ title: 'Original' });
      const updated = await service.updateChapter(created.id, {
        title: 'Updated',
        status: 'draft',
      });

      expect(updated.title).toBe('Updated');
      expect(updated.status).toBe('draft');
      expect(updated.id).toBe(created.id);
    });

    it('updateChapter throws for non-existent id', async () => {
      await expect(service.updateChapter(9999, { title: 'Test' })).rejects.toThrow();
    });

    it('deleteChapter removes the chapter', async () => {
      const created = await service.createChapter({ title: 'Delete Me' });
      await service.deleteChapter(created.id);

      const found = await service.getChapter(created.id);
      expect(found).toBeNull();
    });

    it('reorderChapters validates chapters exist', async () => {
      const ch1 = await service.createChapter({ title: 'Chapter 1' });
      const ch2 = await service.createChapter({ title: 'Chapter 2' });

      // Should not throw for valid chapters
      await expect(service.reorderChapters([ch2.id, ch1.id])).resolves.not.toThrow();

      // Should throw for invalid chapter
      await expect(service.reorderChapters([ch1.id, 9999])).rejects.toThrow();
    });
  });

  describe('Content Editing', () => {
    it('saveContent updates chapter content and word count', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      const saved = await service.saveContent({
        chapterId: chapter.id,
        content: 'This is a test with seven words here.',
      });

      expect(saved.content).toBe('This is a test with seven words here.');
      expect(saved.wordCount).toBe(8);
    });

    it('saveContent can create version', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      await service.saveContent({
        chapterId: chapter.id,
        content: 'First content',
        createVersion: true,
      });

      const versions = await service.getVersions(chapter.id);
      expect(versions.length).toBeGreaterThan(0);
    });

    it('getWordCount returns correct count', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      await service.saveContent({
        chapterId: chapter.id,
        content: 'One two three four five',
      });

      const count = await service.getWordCount(chapter.id);
      expect(count).toBe(5);
    });

    it('getTotalWordCount sums all chapters', async () => {
      const ch1 = await service.createChapter({ title: 'Chapter 1' });
      const ch2 = await service.createChapter({ title: 'Chapter 2' });

      await service.saveContent({ chapterId: ch1.id, content: 'One two three' });
      await service.saveContent({ chapterId: ch2.id, content: 'Four five' });

      const total = await service.getTotalWordCount();
      expect(total).toBe(5);
    });
  });

  describe('Volume Operations', () => {
    it('createVolume returns a Volume with required fields', async () => {
      const volume = await service.createVolume({
        name: 'Volume 1',
        status: 'planned',
      });

      expect(volume).toHaveProperty('id');
      expect(typeof volume.id).toBe('number');
      expect(volume).toHaveProperty('name', 'Volume 1');
      expect(volume).toHaveProperty('status', 'planned');
      expect(volume).toHaveProperty('createdAt');
      expect(volume).toHaveProperty('updatedAt');
    });

    it('getAllVolumes returns sorted array', async () => {
      await service.createVolume({ status: 'planned' });
      await service.createVolume({ status: 'in_progress' });

      const volumes = await service.getAllVolumes();

      expect(Array.isArray(volumes)).toBe(true);
      expect(volumes.length).toBe(2);
    });

    it('updateVolume returns updated volume', async () => {
      const created = await service.createVolume({ name: 'Original', status: 'planned' });
      const updated = await service.updateVolume(created.id, {
        name: 'Updated',
        status: 'in_progress',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.status).toBe('in_progress');
    });
  });

  describe('Version Control', () => {
    it('createVersion returns a Version', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      await service.saveContent({ chapterId: chapter.id, content: 'Some content' });

      const version = await service.createVersion(chapter.id, 'Initial version');

      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('entityType', 'chapter');
      expect(version).toHaveProperty('entityId', String(chapter.id));
      expect(version).toHaveProperty('content');
      expect(version).toHaveProperty('createdAt');
      expect(version.changeSummary).toBe('Initial version');
    });

    it('getVersions returns versions for chapter', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      await service.saveContent({ chapterId: chapter.id, content: 'v1' });
      await service.createVersion(chapter.id);
      await service.saveContent({ chapterId: chapter.id, content: 'v2' });
      await service.createVersion(chapter.id);

      const versions = await service.getVersions(chapter.id);

      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBe(2);
    });

    it('getVersion returns specific version', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      await service.saveContent({ chapterId: chapter.id, content: 'content' });
      const created = await service.createVersion(chapter.id);

      const found = await service.getVersion(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('compareVersions returns diff', async () => {
      const chapter = await service.createChapter({ title: 'Test' });

      await service.saveContent({ chapterId: chapter.id, content: 'one two three' });
      const v1 = await service.createVersion(chapter.id);

      await service.saveContent({ chapterId: chapter.id, content: 'one two three four five' });
      const v2 = await service.createVersion(chapter.id);

      const diff = await service.compareVersions(v1.id, v2.id);

      expect(diff).toHaveProperty('added');
      expect(diff).toHaveProperty('removed');
      expect(diff).toHaveProperty('wordCountDelta');
      expect(diff.wordCountDelta).toBe(2); // 5 - 3
    });

    it('rollbackToVersion restores content', async () => {
      const chapter = await service.createChapter({ title: 'Test' });

      await service.saveContent({ chapterId: chapter.id, content: 'original content' });
      const v1 = await service.createVersion(chapter.id);

      await service.saveContent({ chapterId: chapter.id, content: 'new content' });

      const restored = await service.rollbackToVersion(chapter.id, v1.id);

      expect(restored.content).toBe('original content');
    });

    it('cleanupOldVersions returns count of deleted', async () => {
      const deleted = await service.cleanupOldVersions(30);
      expect(typeof deleted).toBe('number');
    });
  });

  describe('Goal Operations', () => {
    it('setDailyGoal returns a WritingGoal', async () => {
      const goal = await service.setDailyGoal(1000);

      expect(goal).toHaveProperty('id');
      expect(goal).toHaveProperty('type', 'daily');
      expect(goal).toHaveProperty('targetWords', 1000);
      expect(goal).toHaveProperty('status', 'active');
      expect(goal).toHaveProperty('date');
    });

    it('setChapterGoal returns a WritingGoal', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      const goal = await service.setChapterGoal(chapter.id, 500);

      expect(goal).toHaveProperty('id');
      expect(goal).toHaveProperty('type', 'chapter');
      expect(goal).toHaveProperty('targetWords', 500);
      expect(goal).toHaveProperty('chapterId', chapter.id);
    });

    it('getActiveGoals returns only active goals', async () => {
      await service.setDailyGoal(1000);
      const goal2 = await service.setDailyGoal(500);
      await service.completeGoal(goal2.id);

      const activeGoals = await service.getActiveGoals();

      expect(activeGoals.length).toBe(1);
      expect(activeGoals[0].status).toBe('active');
    });

    it('updateGoalProgress updates word count', async () => {
      const goal = await service.setDailyGoal(1000);

      const updated = await service.updateGoalProgress(goal.id, 500);

      expect(updated.currentWords).toBe(500);
    });

    it('updateGoalProgress marks goal completed when target reached', async () => {
      const goal = await service.setDailyGoal(100);
      await service.updateGoalProgress(goal.id, 50);

      const updated = await service.updateGoalProgress(goal.id, 50);

      expect(updated.status).toBe('completed');
      expect(updated.currentWords).toBe(100);
    });

    it('completeGoal marks goal as completed', async () => {
      const goal = await service.setDailyGoal(1000);
      const completed = await service.completeGoal(goal.id);

      expect(completed.status).toBe('completed');
    });
  });

  describe('Session Operations', () => {
    it('startSession returns a WritingSession', async () => {
      const session = await service.startSession();

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('startedAt');
      expect(session).toHaveProperty('wordsWritten', 0);
      expect(session.endedAt).toBeUndefined();
    });

    it('startSession accepts optional chapterId', async () => {
      const chapter = await service.createChapter({ title: 'Test' });
      const session = await service.startSession(chapter.id);

      expect(session.chapterId).toBe(chapter.id);
    });

    it('endSession returns completed session', async () => {
      const started = await service.startSession();
      const ended = await service.endSession(started.id);

      expect(ended.id).toBe(started.id);
      expect(ended.endedAt).toBeDefined();
      expect(typeof ended.durationMinutes).toBe('number');
    });

    it('endSession throws for non-existent session', async () => {
      await expect(service.endSession(9999)).rejects.toThrow();
    });

    it('getSession returns session', async () => {
      const created = await service.startSession();
      const found = await service.getSession(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('getTodaySessions returns array', async () => {
      await service.startSession();

      const sessions = await service.getTodaySessions();

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Operations', () => {
    it('getWritingStats returns statistics object', async () => {
      const today = new Date().toISOString().split('T')[0];
      const stats = await service.getWritingStats(today, today);

      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('totalTime');
      expect(stats).toHaveProperty('chaptersEdited');
      expect(stats).toHaveProperty('avgWordsPerDay');
      expect(stats).toHaveProperty('streak');
    });

    it('getCurrentStreak returns number', async () => {
      const streak = await service.getCurrentStreak();

      expect(typeof streak).toBe('number');
    });
  });
});
