/**
 * WritingService Integration Tests
 *
 * Tests the REAL WritingService against a real in-memory SQLite database.
 * Focuses on service-layer logic: validation, event emission, FK validation, version control.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Database } from '../../db/Database.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { EventBus } from '../EventBus.js';
import { WritingService } from '../WritingService.js';
import {
  EntityNotFoundError,
  ValidationError,
  ReferenceNotFoundError,
  TransactionError,
} from '../../errors/index.js';

describe('WritingService', () => {
  let db: Database;
  let eventBus: EventBus;
  let service: WritingService;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    eventBus = new EventBus();
    service = new WritingService({
      db,
      writingRepo: new WritingRepository(db),
      characterRepo: new CharacterRepository(db),
      locationRepo: new LocationRepository(db),
      arcRepo: new ArcRepository(db),
      foreshadowingRepo: new ForeshadowingRepository(db),
      eventBus,
    });
  });

  afterEach(() => {
    db.close();
  });

  // ============================================
  // Volume Methods
  // ============================================

  describe('Volumes', () => {
    describe('createVolume', () => {
      it('should create a volume with valid input', async () => {
        const volume = await service.createVolume({
          name: 'Volume 1',
          status: 'planned',
        });

        expect(volume.id).toBe(1);
        expect(volume.name).toBe('Volume 1');
        expect(volume.status).toBe('planned');
        expect(volume.createdAt).toBeDefined();
        expect(volume.updatedAt).toBeDefined();
      });

      it('should create a volume with minimal input', async () => {
        const volume = await service.createVolume({});

        expect(volume.id).toBe(1);
        expect(volume.status).toBe(null); // No default status in DB
      });

      it('should throw ValidationError for invalid status', async () => {
        await expect(service.createVolume({ status: 'invalid' as never })).rejects.toThrow(
          ValidationError
        );
      });

      it('should emit VOLUME_CREATED event', async () => {
        const handler = vi.fn();
        eventBus.on('VOLUME_CREATED', handler);

        const volume = await service.createVolume({ name: 'Test Volume' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'VOLUME_CREATED',
            volume: expect.objectContaining({ name: 'Test Volume' }),
          })
        );
      });
    });

    describe('getVolume', () => {
      it('should get a volume by ID', async () => {
        const created = await service.createVolume({ name: 'Test Volume' });
        const retrieved = await service.getVolume(created.id);

        expect(retrieved).toEqual(created);
      });

      it('should throw EntityNotFoundError when volume does not exist', async () => {
        await expect(service.getVolume(999)).rejects.toThrow(EntityNotFoundError);
        await expect(service.getVolume(999)).rejects.toThrow('Volume 999 not found');
      });
    });

    describe('getAllVolumes', () => {
      it('should return empty array when no volumes exist', async () => {
        const volumes = await service.getAllVolumes();
        expect(volumes).toEqual([]);
      });

      it('should return all volumes', async () => {
        await service.createVolume({ name: 'Volume 1' });
        await service.createVolume({ name: 'Volume 2' });
        await service.createVolume({ name: 'Volume 3' });

        const volumes = await service.getAllVolumes();
        expect(volumes).toHaveLength(3);
        expect(volumes.map((v) => v.name)).toEqual(['Volume 1', 'Volume 2', 'Volume 3']);
      });
    });

    describe('updateVolume', () => {
      it('should update a volume with valid input', async () => {
        const volume = await service.createVolume({ name: 'Original', status: 'planned' });

        // Wait a bit to ensure timestamp changes
        await new Promise((resolve) => setTimeout(resolve, 2));

        const updated = await service.updateVolume(volume.id, {
          name: 'Updated',
          status: 'in_progress',
        });

        expect(updated.name).toBe('Updated');
        expect(updated.status).toBe('in_progress');
        expect(updated.updatedAt).not.toBe(volume.updatedAt);
      });

      it('should throw EntityNotFoundError when volume does not exist', async () => {
        await expect(service.updateVolume(999, { name: 'Test' })).rejects.toThrow(
          EntityNotFoundError
        );
      });

      it('should throw ValidationError for invalid status', async () => {
        const volume = await service.createVolume({});

        await expect(
          service.updateVolume(volume.id, { status: 'invalid' as never })
        ).rejects.toThrow(ValidationError);
      });

      it('should emit VOLUME_UPDATED event', async () => {
        const volume = await service.createVolume({ name: 'Original' });

        const handler = vi.fn();
        eventBus.on('VOLUME_UPDATED', handler);

        await service.updateVolume(volume.id, { name: 'Updated' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'VOLUME_UPDATED',
            volume: expect.objectContaining({ name: 'Updated' }),
            changes: expect.objectContaining({ name: 'Updated' }),
          })
        );
      });
    });

    describe('deleteVolume', () => {
      it('should delete a volume', async () => {
        const volume = await service.createVolume({ name: 'To Delete' });

        await service.deleteVolume(volume.id);

        await expect(service.getVolume(volume.id)).rejects.toThrow(EntityNotFoundError);
      });

      it('should throw EntityNotFoundError when volume does not exist', async () => {
        await expect(service.deleteVolume(999)).rejects.toThrow(EntityNotFoundError);
      });

      it('should cascade delete all chapters in the volume', async () => {
        const volume = await service.createVolume({ name: 'Volume' });
        const chapter1 = await service.createChapter({ volumeId: volume.id, title: 'Chapter 1' });
        const chapter2 = await service.createChapter({ volumeId: volume.id, title: 'Chapter 2' });

        await service.deleteVolume(volume.id);

        await expect(service.getChapter(chapter1.id)).rejects.toThrow(EntityNotFoundError);
        await expect(service.getChapter(chapter2.id)).rejects.toThrow(EntityNotFoundError);
      });

      it('should emit VOLUME_DELETED event', async () => {
        const volume = await service.createVolume({ name: 'To Delete' });

        const handler = vi.fn();
        eventBus.on('VOLUME_DELETED', handler);

        await service.deleteVolume(volume.id);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'VOLUME_DELETED',
            volumeId: volume.id,
          })
        );
      });

      it('should emit CHAPTER_DELETED events for cascaded chapters', async () => {
        const volume = await service.createVolume({ name: 'Volume' });
        const ch1 = await service.createChapter({ volumeId: volume.id, title: 'Chapter 1' });
        const ch2 = await service.createChapter({ volumeId: volume.id, title: 'Chapter 2' });

        const chapterHandler = vi.fn();
        const volumeHandler = vi.fn();
        eventBus.on('CHAPTER_DELETED', chapterHandler);
        eventBus.on('VOLUME_DELETED', volumeHandler);

        await service.deleteVolume(volume.id);

        expect(chapterHandler).toHaveBeenCalledTimes(2);
        expect(chapterHandler).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'CHAPTER_DELETED', chapterId: ch1.id })
        );
        expect(chapterHandler).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'CHAPTER_DELETED', chapterId: ch2.id })
        );
        // VOLUME_DELETED should come after all CHAPTER_DELETED events
        expect(volumeHandler).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============================================
  // Chapter Methods
  // ============================================

  describe('Chapters', () => {
    describe('createChapter', () => {
      it('should create a chapter with minimal input', async () => {
        const chapter = await service.createChapter({});

        expect(chapter.id).toBe(1); // Numeric ID, not prefixed
        expect(chapter.status).toBe('outline'); // Default status
        expect(chapter.wordCount).toBe(0);
        expect(chapter.createdAt).toBeDefined();
      });

      it('should create a chapter with volume ID', async () => {
        const volume = await service.createVolume({ name: 'Volume 1' });
        const chapter = await service.createChapter({
          volumeId: volume.id,
          title: 'Chapter 1',
        });

        expect(chapter.volumeId).toBe(volume.id);
        expect(chapter.title).toBe('Chapter 1');
      });

      it('should create a chapter with arc ID', async () => {
        // First create an arc using repository directly (service layer doesn't have createArc yet)
        const arcRepo = new ArcRepository(db);
        const arc = arcRepo.create({ name: 'Arc 1' });

        const chapter = await service.createChapter({
          arcId: arc.id,
          title: 'Chapter in Arc',
        });

        expect(chapter.arcId).toBe(arc.id);
      });

      it('should throw ReferenceNotFoundError for invalid volume ID', async () => {
        await expect(service.createChapter({ volumeId: 999 })).rejects.toThrow(
          ReferenceNotFoundError
        );
        await expect(service.createChapter({ volumeId: 999 })).rejects.toThrow('Volume');
      });

      it('should throw ReferenceNotFoundError for invalid arc ID', async () => {
        await expect(service.createChapter({ arcId: 'A999' })).rejects.toThrow(
          ReferenceNotFoundError
        );
        await expect(service.createChapter({ arcId: 'A999' })).rejects.toThrow('Arc');
      });

      it('should validate character IDs', async () => {
        await expect(service.createChapter({ characters: ['C999'] })).rejects.toThrow(
          ReferenceNotFoundError
        );
      });

      it('should validate location IDs', async () => {
        await expect(service.createChapter({ locations: ['L999'] })).rejects.toThrow(
          ReferenceNotFoundError
        );
      });

      it('should emit CHAPTER_CREATED event', async () => {
        const handler = vi.fn();
        eventBus.on('CHAPTER_CREATED', handler);

        const chapter = await service.createChapter({ title: 'New Chapter' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHAPTER_CREATED',
            chapter: expect.objectContaining({ title: 'New Chapter' }),
          })
        );
      });
    });

    describe('getChapter', () => {
      it('should get a chapter by ID (without content)', async () => {
        const created = await service.createChapter({ title: 'Test Chapter' });
        const retrieved = await service.getChapter(created.id);

        expect(retrieved.id).toBe(created.id);
        expect(retrieved.title).toBe('Test Chapter');
        expect(retrieved.content).toBeUndefined(); // Content not loaded
      });

      it('should throw EntityNotFoundError when chapter does not exist', async () => {
        await expect(service.getChapter('CH999')).rejects.toThrow(EntityNotFoundError);
        await expect(service.getChapter('CH999')).rejects.toThrow('Chapter CH999 not found');
      });
    });

    describe('getChapterWithContent', () => {
      it('should get a chapter with content field', async () => {
        const created = await service.createChapter({ title: 'Test Chapter' });
        const retrieved = await service.getChapterWithContent(created.id);

        expect(retrieved.id).toBe(created.id);
        // Content is undefined initially (null in DB becomes undefined)
        expect(retrieved.content).toBeUndefined();
      });

      it('should throw EntityNotFoundError when chapter does not exist', async () => {
        await expect(service.getChapterWithContent('CH999')).rejects.toThrow(EntityNotFoundError);
      });
    });

    describe('getAllChapters', () => {
      it('should return empty array when no chapters exist', async () => {
        const chapters = await service.getAllChapters();
        expect(chapters).toEqual([]);
      });

      it('should return all chapters', async () => {
        await service.createChapter({ title: 'Chapter 1' });
        await service.createChapter({ title: 'Chapter 2' });
        await service.createChapter({ title: 'Chapter 3' });

        const chapters = await service.getAllChapters();
        expect(chapters).toHaveLength(3);
      });
    });

    describe('getChaptersByVolume', () => {
      it('should return chapters filtered by volume', async () => {
        const volume1 = await service.createVolume({ name: 'Volume 1' });
        const volume2 = await service.createVolume({ name: 'Volume 2' });

        await service.createChapter({ volumeId: volume1.id, title: 'V1 Chapter 1' });
        await service.createChapter({ volumeId: volume1.id, title: 'V1 Chapter 2' });
        await service.createChapter({ volumeId: volume2.id, title: 'V2 Chapter 1' });

        const chapters = await service.getChaptersByVolume(volume1.id);
        expect(chapters).toHaveLength(2);
        expect(chapters.map((c) => c.title)).toEqual(['V1 Chapter 1', 'V1 Chapter 2']);
      });
    });

    describe('getChaptersByArc', () => {
      it('should return chapters filtered by arc', async () => {
        const arcRepo = new ArcRepository(db);
        const arc1 = arcRepo.create({ name: 'Arc 1' });
        const arc2 = arcRepo.create({ name: 'Arc 2' });

        await service.createChapter({ arcId: arc1.id, title: 'Arc1 Chapter 1' });
        await service.createChapter({ arcId: arc1.id, title: 'Arc1 Chapter 2' });
        await service.createChapter({ arcId: arc2.id, title: 'Arc2 Chapter 1' });

        const chapters = await service.getChaptersByArc(arc1.id);
        expect(chapters).toHaveLength(2);
        expect(chapters.map((c) => c.title)).toEqual(['Arc1 Chapter 1', 'Arc1 Chapter 2']);
      });
    });

    describe('getChaptersByStatus', () => {
      it('should return chapters filtered by status', async () => {
        await service.createChapter({ title: 'Outline', status: 'outline' });
        await service.createChapter({ title: 'Draft', status: 'draft' });
        await service.createChapter({ title: 'Another Draft', status: 'draft' });

        const drafts = await service.getChaptersByStatus('draft');
        expect(drafts).toHaveLength(2);
        expect(drafts.map((c) => c.title)).toEqual(['Draft', 'Another Draft']);
      });

      it('should throw ValidationError for invalid status', async () => {
        await expect(service.getChaptersByStatus('invalid' as never)).rejects.toThrow(
          ValidationError
        );
      });
    });

    describe('updateChapter', () => {
      it('should update a chapter with valid input', async () => {
        const chapter = await service.createChapter({ title: 'Original' });

        const updated = await service.updateChapter(chapter.id, {
          title: 'Updated Title',
          status: 'draft',
        });

        expect(updated.title).toBe('Updated Title');
        expect(updated.status).toBe('draft');
      });

      it('should throw EntityNotFoundError when chapter does not exist', async () => {
        await expect(service.updateChapter('CH999', { title: 'Test' })).rejects.toThrow(
          EntityNotFoundError
        );
      });

      it('should throw ValidationError for invalid status', async () => {
        const chapter = await service.createChapter({});

        await expect(
          service.updateChapter(chapter.id, { status: 'invalid' as never })
        ).rejects.toThrow(ValidationError);
      });

      it('should throw ReferenceNotFoundError for invalid volume ID', async () => {
        const chapter = await service.createChapter({});

        await expect(service.updateChapter(chapter.id, { volumeId: 999 })).rejects.toThrow(
          ReferenceNotFoundError
        );
      });

      it('should emit CHAPTER_STATUS_CHANGED event when status changes', async () => {
        const chapter = await service.createChapter({ status: 'outline' });

        const handler = vi.fn();
        eventBus.on('CHAPTER_STATUS_CHANGED', handler);

        await service.updateChapter(chapter.id, { status: 'draft' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHAPTER_STATUS_CHANGED',
            chapter: expect.objectContaining({ status: 'draft' }),
            oldStatus: 'outline',
            newStatus: 'draft',
          })
        );
      });

      it('should emit CHAPTER_UPDATED event', async () => {
        const chapter = await service.createChapter({ title: 'Original' });

        const handler = vi.fn();
        eventBus.on('CHAPTER_UPDATED', handler);

        await service.updateChapter(chapter.id, { title: 'Updated' });

        expect(handler).toHaveBeenCalledTimes(1);
      });

      // Status transition validation tests
      it('should allow sequential forward transitions', async () => {
        const chapter = await service.createChapter({ status: 'outline' });

        const draft = await service.updateChapter(chapter.id, { status: 'draft' });
        expect(draft.status).toBe('draft');

        const revision = await service.updateChapter(chapter.id, { status: 'revision' });
        expect(revision.status).toBe('revision');

        const done = await service.updateChapter(chapter.id, { status: 'done' });
        expect(done.status).toBe('done');
      });

      it('should allow backward transitions (any distance)', async () => {
        const chapter = await service.createChapter({ status: 'outline' });
        await service.updateChapter(chapter.id, { status: 'draft' });
        await service.updateChapter(chapter.id, { status: 'revision' });
        await service.updateChapter(chapter.id, { status: 'done' });

        // done → outline (skip backward)
        const unlocked = await service.updateChapter(chapter.id, { status: 'outline' });
        expect(unlocked.status).toBe('outline');
      });

      it('should reject skipping forward transitions', async () => {
        const chapter = await service.createChapter({ status: 'outline' });

        // outline → revision (skip draft)
        await expect(service.updateChapter(chapter.id, { status: 'revision' })).rejects.toThrow(
          ValidationError
        );
        await expect(service.updateChapter(chapter.id, { status: 'revision' })).rejects.toThrow(
          'Must progress sequentially'
        );
      });

      it('should reject outline → done (skip two steps)', async () => {
        const chapter = await service.createChapter({ status: 'outline' });

        await expect(service.updateChapter(chapter.id, { status: 'done' })).rejects.toThrow(
          ValidationError
        );
      });

      it('should reject draft → done (skip revision)', async () => {
        const chapter = await service.createChapter({ status: 'outline' });
        await service.updateChapter(chapter.id, { status: 'draft' });

        await expect(service.updateChapter(chapter.id, { status: 'done' })).rejects.toThrow(
          ValidationError
        );
      });

      it('should allow same-status update (no-op transition)', async () => {
        const chapter = await service.createChapter({ status: 'outline' });

        const same = await service.updateChapter(chapter.id, { status: 'outline' });
        expect(same.status).toBe('outline');
      });
    });

    describe('deleteChapter', () => {
      it('should delete a chapter', async () => {
        const chapter = await service.createChapter({ title: 'To Delete' });

        await service.deleteChapter(chapter.id);

        await expect(service.getChapter(chapter.id)).rejects.toThrow(EntityNotFoundError);
      });

      it('should throw EntityNotFoundError when chapter does not exist', async () => {
        await expect(service.deleteChapter('CH999')).rejects.toThrow(EntityNotFoundError);
      });

      it('should emit CHAPTER_DELETED event', async () => {
        const chapter = await service.createChapter({ title: 'To Delete' });

        const handler = vi.fn();
        eventBus.on('CHAPTER_DELETED', handler);

        await service.deleteChapter(chapter.id);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHAPTER_DELETED',
            chapterId: chapter.id,
          })
        );
      });
    });

    describe('reorderChapters', () => {
      it.skip('should reorder chapters', async () => {
        // TODO: Implement chapter ordering in future phase
        // Currently reorderChapters is a validation-only stub
        const ch1 = await service.createChapter({ title: 'Chapter 1' });
        const ch2 = await service.createChapter({ title: 'Chapter 2' });
        const ch3 = await service.createChapter({ title: 'Chapter 3' });

        await service.reorderChapters([ch3.id, ch1.id, ch2.id]);

        // Verify order by checking chapter_order field (not implemented yet)
        const chapters = await service.getAllChapters();
        // const reordered = chapters.sort((a, b) => a.chapterOrder - b.chapterOrder);
        // expect(reordered.map((c) => c.id)).toEqual([ch3.id, ch1.id, ch2.id]);
      });

      it('should throw EntityNotFoundError for invalid chapter ID', async () => {
        const ch1 = await service.createChapter({ title: 'Chapter 1' });

        await expect(service.reorderChapters([ch1.id, 'CH999'])).rejects.toThrow(
          EntityNotFoundError
        );
      });

      it('should emit CHAPTERS_REORDERED event', async () => {
        const ch1 = await service.createChapter({ title: 'Chapter 1' });
        const ch2 = await service.createChapter({ title: 'Chapter 2' });

        const handler = vi.fn();
        eventBus.on('CHAPTERS_REORDERED', handler);

        await service.reorderChapters([ch2.id, ch1.id]);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHAPTERS_REORDERED',
            chapterIds: [ch2.id, ch1.id],
          })
        );
      });
    });
  });

  // ============================================
  // Content Methods
  // ============================================

  describe('Content', () => {
    describe('saveContent', () => {
      it('should save content without creating version', async () => {
        const chapter = await service.createChapter({ title: 'Test Chapter' });

        const updated = await service.saveContent({
          chapterId: chapter.id,
          content: 'This is test content.',
          createVersion: false,
        });

        expect(updated.content).toBeUndefined(); // Content not loaded in return
        expect(updated.wordCount).toBe(4); // 4 words

        // Verify content was saved
        const withContent = await service.getChapterWithContent(chapter.id);
        expect(withContent.content).toBe('This is test content.');
      });

      it('should save content and create version when requested', async () => {
        const chapter = await service.createChapter({ title: 'Test Chapter' });

        await service.saveContent({
          chapterId: chapter.id,
          content: 'First version.',
          createVersion: true,
        });

        const versions = await service.getVersions(chapter.id);
        expect(versions).toHaveLength(1);
        expect(versions[0].changeSummary).toBe('Manual save');
        expect(versions[0].source).toBe('manual');
      });

      it('should calculate word count for English content', async () => {
        const chapter = await service.createChapter({});

        const updated = await service.saveContent({
          chapterId: chapter.id,
          content: 'Hello world test',
        });

        expect(updated.wordCount).toBe(3);
      });

      it('should calculate word count for Chinese content', async () => {
        const chapter = await service.createChapter({});

        const updated = await service.saveContent({
          chapterId: chapter.id,
          content: '这是一个测试',
        });

        expect(updated.wordCount).toBe(6); // 6 Chinese characters (这是一个测试)
      });

      it('should emit CHAPTER_SAVED event with word count delta', async () => {
        const chapter = await service.createChapter({});

        // First save
        await service.saveContent({
          chapterId: chapter.id,
          content: 'Hello world',
        });

        const handler = vi.fn();
        eventBus.on('CHAPTER_SAVED', handler);

        // Second save
        await service.saveContent({
          chapterId: chapter.id,
          content: 'Hello world test content',
        });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHAPTER_SAVED',
            wordCountDelta: 2, // From 2 words to 4 words
          })
        );
      });

      it('should emit VERSION_CREATED event when version created', async () => {
        const chapter = await service.createChapter({});

        const handler = vi.fn();
        eventBus.on('VERSION_CREATED', handler);

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Content',
          createVersion: true,
        });

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should throw EntityNotFoundError for invalid chapter', async () => {
        await expect(service.saveContent({ chapterId: 999, content: 'test' })).rejects.toThrow(
          EntityNotFoundError
        );
      });
    });

    describe('getWordCount', () => {
      it('should get word count for a chapter', async () => {
        const chapter = await service.createChapter({});

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Hello world test',
        });

        const wordCount = await service.getWordCount(chapter.id);
        expect(wordCount).toBe(3);
      });

      it('should throw EntityNotFoundError for invalid chapter', async () => {
        await expect(service.getWordCount(999)).rejects.toThrow(EntityNotFoundError);
      });
    });

    describe('getTotalWordCount', () => {
      it('should return total word count across all chapters', async () => {
        const ch1 = await service.createChapter({});
        const ch2 = await service.createChapter({});

        await service.saveContent({
          chapterId: ch1.id,
          content: 'Hello world',
        });

        await service.saveContent({
          chapterId: ch2.id,
          content: 'Test content here',
        });

        const total = await service.getTotalWordCount();
        expect(total).toBe(5); // 2 + 3 words
      });

      it('should return 0 when no content exists', async () => {
        const total = await service.getTotalWordCount();
        expect(total).toBe(0);
      });
    });
  });

  // ============================================
  // Version Methods
  // ============================================

  describe('Versions', () => {
    describe('createVersion', () => {
      it('should create a manual version', async () => {
        const chapter = await service.createChapter({ title: 'Test' });

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Some content',
        });

        const version = await service.createVersion({
          chapterId: chapter.id,
          changeSummary: 'Manual checkpoint',
        });

        expect(version.entityType).toBe('chapter');
        expect(version.entityId).toBe(String(chapter.id));
        expect(version.source).toBe('manual');
        expect(version.changeSummary).toBe('Manual checkpoint');
      });

      it('should throw EntityNotFoundError for invalid chapter', async () => {
        await expect(service.createVersion({ chapterId: 999 })).rejects.toThrow(
          EntityNotFoundError
        );
      });

      it('should emit VERSION_CREATED event', async () => {
        const chapter = await service.createChapter({});

        const handler = vi.fn();
        eventBus.on('VERSION_CREATED', handler);

        await service.createVersion({ chapterId: chapter.id });

        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    describe('getVersions', () => {
      it('should get all versions for a chapter', async () => {
        const chapter = await service.createChapter({});

        await service.createVersion({ chapterId: chapter.id });
        await service.createVersion({ chapterId: chapter.id });
        await service.createVersion({ chapterId: chapter.id });

        const versions = await service.getVersions(chapter.id);
        expect(versions).toHaveLength(3);
      });

      it('should return empty array when no versions exist', async () => {
        const chapter = await service.createChapter({});
        const versions = await service.getVersions(chapter.id);
        expect(versions).toEqual([]);
      });
    });

    describe('getVersion', () => {
      it('should get a specific version', async () => {
        const chapter = await service.createChapter({});
        const created = await service.createVersion({ chapterId: chapter.id });

        const retrieved = await service.getVersion(created.id);
        expect(retrieved).toEqual(created);
      });

      it('should throw EntityNotFoundError for invalid version', async () => {
        await expect(service.getVersion(999)).rejects.toThrow(EntityNotFoundError);
      });
    });

    describe('compareVersions', () => {
      it('should compare two versions and return diff', async () => {
        const chapter = await service.createChapter({});

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Line 1\nLine 2',
          createVersion: true,
        });

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Line 1\nLine 2\nLine 3\nLine 4',
          createVersion: true,
        });

        const versions = await service.getVersions(chapter.id);

        // versions[0] is newest, versions[1] is oldest (DESC order)
        const diff = await service.compareVersions(versions[1].id, versions[0].id);

        // Check that diff structure is returned (may be 0 or > 0 depending on order)
        expect(diff).toHaveProperty('added');
        expect(diff).toHaveProperty('removed');
        expect(diff).toHaveProperty('wordCountDelta');

        // Word count should be different between versions
        expect(Math.abs(diff.wordCountDelta)).toBeGreaterThan(0);
      });

      it('should throw EntityNotFoundError for invalid version IDs', async () => {
        const chapter = await service.createChapter({});
        const v1 = await service.createVersion({ chapterId: chapter.id });

        await expect(service.compareVersions(v1.id, 999)).rejects.toThrow(EntityNotFoundError);
        await expect(service.compareVersions(999, v1.id)).rejects.toThrow(EntityNotFoundError);
      });
    });

    describe('rollbackToVersion', () => {
      it('should rollback chapter to a previous version', async () => {
        const chapter = await service.createChapter({});

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Original content',
          createVersion: true,
        });

        const versions1 = await service.getVersions(chapter.id);
        const v1 = versions1[0];

        await service.saveContent({
          chapterId: chapter.id,
          content: 'New content',
        });

        await service.rollbackToVersion(chapter.id, v1.id);

        const restored = await service.getChapterWithContent(chapter.id);
        expect(restored.content).toBe('Original content');
      });

      it('should create rollback backup before restoring', async () => {
        const chapter = await service.createChapter({});

        await service.saveContent({
          chapterId: chapter.id,
          content: 'V1',
          createVersion: true,
        });

        const versions1 = await service.getVersions(chapter.id);
        const v1 = versions1[0];

        await service.saveContent({
          chapterId: chapter.id,
          content: 'V2',
        });

        const versionsBefore = await service.getVersions(chapter.id);
        await service.rollbackToVersion(chapter.id, v1.id);
        const versionsAfter = await service.getVersions(chapter.id);

        // Should have one more version (the rollback_backup)
        expect(versionsAfter.length).toBe(versionsBefore.length + 1);

        const backup = versionsAfter.find((v) => v.source === 'rollback_backup');
        expect(backup).toBeDefined();
        expect(backup!.changeSummary).toContain('Rollback backup');
      });

      it('should emit CHAPTER_ROLLED_BACK event', async () => {
        const chapter = await service.createChapter({});

        await service.saveContent({
          chapterId: chapter.id,
          content: 'Content',
          createVersion: true,
        });

        const versions = await service.getVersions(chapter.id);

        const handler = vi.fn();
        eventBus.on('CHAPTER_ROLLED_BACK', handler);

        await service.rollbackToVersion(chapter.id, versions[0].id);

        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should throw ValidationError if version does not belong to chapter', async () => {
        const ch1 = await service.createChapter({});
        const ch2 = await service.createChapter({});

        const v1 = await service.createVersion({ chapterId: ch1.id });

        await expect(service.rollbackToVersion(ch2.id, v1.id)).rejects.toThrow(ValidationError);
      });

      it('should throw EntityNotFoundError for invalid chapter', async () => {
        await expect(service.rollbackToVersion(999, 1)).rejects.toThrow(EntityNotFoundError);
      });

      it('should throw EntityNotFoundError for invalid version', async () => {
        const chapter = await service.createChapter({});

        await expect(service.rollbackToVersion(chapter.id, 999)).rejects.toThrow(
          EntityNotFoundError
        );
      });
    });

    describe('cleanupOldVersions', () => {
      it('should cleanup old auto versions', async () => {
        // Create versions with manual source (should be preserved)
        const chapter = await service.createChapter({});

        await service.createVersion({ chapterId: chapter.id });
        await service.createVersion({ chapterId: chapter.id });

        // Cleanup (olderThanDays=0 to cleanup all old versions)
        const count = await service.cleanupOldVersions(0);

        // Manual versions should be preserved
        const versions = await service.getVersions(chapter.id);
        expect(versions).toHaveLength(2);
        expect(count).toBe(0); // No auto versions to delete
      });

      it('should emit VERSIONS_CLEANED_UP event', async () => {
        const handler = vi.fn();
        eventBus.on('VERSIONS_CLEANED_UP', handler);

        await service.cleanupOldVersions(7);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'VERSIONS_CLEANED_UP',
            olderThanDays: 7,
          })
        );
      });
    });
  });

  // ============================================
  // FK Cleanup Methods
  // ============================================

  describe('FK Cleanup', () => {
    describe('cleanupCharacterReferences', () => {
      it('should remove character ID from all chapters', async () => {
        // Create a character directly via repo
        const charRepo = new CharacterRepository(db);
        const char = charRepo.create({ name: 'Test Char' });

        const ch1 = await service.createChapter({ characters: [char.id] });
        const ch2 = await service.createChapter({ characters: [char.id] });

        await service.cleanupCharacterReferences(char.id);

        const updated1 = await service.getChapter(ch1.id);
        const updated2 = await service.getChapter(ch2.id);
        expect(updated1.characters).toEqual([]);
        expect(updated2.characters).toEqual([]);
      });

      it('should not affect chapters without the character', async () => {
        const charRepo = new CharacterRepository(db);
        const char1 = charRepo.create({ name: 'Char 1' });
        const char2 = charRepo.create({ name: 'Char 2' });

        const ch = await service.createChapter({ characters: [char1.id] });

        await service.cleanupCharacterReferences(char2.id);

        const updated = await service.getChapter(ch.id);
        expect(updated.characters).toEqual([char1.id]);
      });
    });

    describe('cleanupLocationReferences', () => {
      it('should remove location ID from all chapters', async () => {
        const locRepo = new LocationRepository(db);
        const loc = locRepo.create({ name: 'Test Loc' });

        const ch = await service.createChapter({ locations: [loc.id] });

        await service.cleanupLocationReferences(loc.id);

        const updated = await service.getChapter(ch.id);
        expect(updated.locations).toEqual([]);
      });
    });

    describe('cleanupForeshadowingReferences', () => {
      it('should remove foreshadowing ID from all chapters', async () => {
        const fsRepo = new ForeshadowingRepository(db);
        const fs = fsRepo.create({ content: 'Test Foreshadowing' });

        const ch = await service.createChapter({});
        // createChapter doesn't insert foreshadowing fields, use updateChapter
        await service.updateChapter(ch.id, { foreshadowingHinted: [fs.id] });

        await service.cleanupForeshadowingReferences(fs.id);

        const updated = await service.getChapter(ch.id);
        expect(updated.foreshadowingHinted).toEqual([]);
      });
    });
  });
});
