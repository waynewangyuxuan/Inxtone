/**
 * WritingService - Manages writing workspace: volumes, chapters, content, versions
 *
 * This service provides business logic for all Writing entities,
 * including validation, event emission, and version control.
 *
 * Methods are async to match IWritingService interface (Promise return types)
 * even though underlying repositories are synchronous. This ensures consistent
 * error handling (throws become rejected promises) and future-proofs for
 * potential async repository implementations.
 */

/* eslint-disable @typescript-eslint/require-await */

import type {
  IWritingService,
  IEventBus,
  CreateVolumeInput,
  UpdateVolumeInput,
  CreateChapterInput,
  UpdateChapterInput,
  SaveContentInput,
  VersionDiff,
  WritingStats,
} from '../types/services.js';
import type {
  Volume,
  VolumeId,
  VolumeStatus,
  Chapter,
  ChapterId,
  ChapterStatus,
  Version,
  CharacterId,
  LocationId,
  ForeshadowingId,
  ArcId,
  WritingGoal,
  WritingSession,
} from '../types/entities.js';
import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { Database } from '../db/Database.js';
import {
  EntityNotFoundError,
  ValidationError,
  ReferenceNotFoundError,
  TransactionError,
} from '../errors/index.js';

/**
 * Dependencies for WritingService.
 * Uses dependency injection for testability.
 */
export interface WritingServiceDeps {
  db: Database;
  writingRepo: WritingRepository;
  characterRepo: CharacterRepository; // For FK validation
  locationRepo: LocationRepository; // For FK validation
  arcRepo: ArcRepository; // For FK validation
  foreshadowingRepo: ForeshadowingRepository; // For FK validation
  eventBus: IEventBus;
}

/**
 * WritingService implementation.
 *
 * @example
 * ```typescript
 * const service = new WritingService({
 *   db,
 *   writingRepo,
 *   characterRepo,
 *   locationRepo,
 *   arcRepo,
 *   foreshadowingRepo,
 *   eventBus,
 * });
 *
 * const volume = await service.createVolume({ name: 'Volume 1', status: 'planned' });
 * const chapter = await service.createChapter({ volumeId: volume.id, title: 'Prologue' });
 * await service.saveContent({ chapterId: chapter.id, content: '...', createVersion: true });
 * ```
 */
export class WritingService implements IWritingService {
  constructor(private deps: WritingServiceDeps) {}

  // ===================================
  // Private Validation Helpers
  // ===================================

  /**
   * Validate volume status enum.
   */
  private validateVolumeStatus(status?: VolumeStatus): void {
    const validStatuses: VolumeStatus[] = ['planned', 'in_progress', 'complete'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid volume status: ${status}`, 'status');
    }
  }

  /**
   * Validate chapter status enum.
   */
  private validateChapterStatus(status?: ChapterStatus): void {
    const validStatuses: ChapterStatus[] = ['outline', 'draft', 'revision', 'done'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Invalid chapter status: ${status}`, 'status');
    }
  }

  /**
   * Valid chapter status transitions: outline → draft → revision → done.
   * Backward transitions are allowed (e.g. done → revision for unlocking).
   */
  private static readonly STATUS_ORDER: Record<ChapterStatus, number> = {
    outline: 0,
    draft: 1,
    revision: 2,
    done: 3,
  };

  /**
   * Validate chapter status transition.
   * Forward transitions must be sequential (no skipping).
   * Backward transitions are always allowed (for unlocking/re-editing).
   */
  private validateStatusTransition(from: ChapterStatus, to: ChapterStatus): void {
    const fromOrder = WritingService.STATUS_ORDER[from];
    const toOrder = WritingService.STATUS_ORDER[to];

    // Backward transitions always allowed
    if (toOrder <= fromOrder) return;

    // Forward transitions must be sequential (no skipping steps)
    if (toOrder - fromOrder > 1) {
      throw new ValidationError(
        `Invalid status transition: ${from} → ${to}. Must progress sequentially (outline → draft → revision → done)`,
        'status'
      );
    }
  }

  /**
   * Validate that all character IDs exist.
   */
  private async validateCharacterIds(characterIds: CharacterId[]): Promise<void> {
    for (const id of characterIds) {
      const character = this.deps.characterRepo.findById(id);
      if (!character) {
        throw new ReferenceNotFoundError('Character', id, 'characters');
      }
    }
  }

  /**
   * Validate that all location IDs exist.
   */
  private async validateLocationIds(locationIds: LocationId[]): Promise<void> {
    for (const id of locationIds) {
      const location = this.deps.locationRepo.findById(id);
      if (!location) {
        throw new ReferenceNotFoundError('Location', id, 'locations');
      }
    }
  }

  /**
   * Validate that all foreshadowing IDs exist.
   */
  private async validateForeshadowingIds(foreshadowingIds: ForeshadowingId[]): Promise<void> {
    for (const id of foreshadowingIds) {
      const foreshadowing = this.deps.foreshadowingRepo.findById(id);
      if (!foreshadowing) {
        throw new ReferenceNotFoundError('Foreshadowing', id, 'foreshadowing');
      }
    }
  }

  // ===================================
  // Volume Methods (5 methods)
  // ===================================

  async createVolume(input: CreateVolumeInput): Promise<Volume> {
    // Validate status enum
    this.validateVolumeStatus(input.status);

    const volume = this.deps.writingRepo.createVolume(input);

    this.deps.eventBus.emit({ type: 'VOLUME_CREATED', volume });

    return volume;
  }

  async getVolume(id: VolumeId): Promise<Volume> {
    const volume = this.deps.writingRepo.findVolumeById(id);
    if (!volume) {
      throw new EntityNotFoundError('Volume', String(id));
    }
    return volume;
  }

  async getAllVolumes(): Promise<Volume[]> {
    return this.deps.writingRepo.findAllVolumes();
  }

  async updateVolume(id: VolumeId, input: UpdateVolumeInput): Promise<Volume> {
    // Check existence first
    const existing = this.deps.writingRepo.findVolumeById(id);
    if (!existing) {
      throw new EntityNotFoundError('Volume', String(id));
    }

    // Validate status if provided
    this.validateVolumeStatus(input.status);

    const volume = this.deps.writingRepo.updateVolume(id, input);

    this.deps.eventBus.emit({ type: 'VOLUME_UPDATED', volume, changes: input });

    return volume;
  }

  async deleteVolume(id: VolumeId): Promise<void> {
    const volume = this.deps.writingRepo.findVolumeById(id);
    if (!volume) {
      throw new EntityNotFoundError('Volume', String(id));
    }

    // Collect chapters before deletion for event emission
    const chapters = this.deps.writingRepo.findChaptersByVolume(id);

    // Use transaction for cascade delete
    const result = this.deps.db.transaction(() => {
      for (const chapter of chapters) {
        this.deps.writingRepo.deleteChapter(chapter.id);
      }

      // Delete the volume itself
      return this.deps.writingRepo.deleteVolume(id);
    });

    if (!result.success) {
      throw new TransactionError(`Failed to delete volume ${id}`, result.error);
    }

    // Emit events after transaction succeeds
    for (const chapter of chapters) {
      this.deps.eventBus.emit({ type: 'CHAPTER_DELETED', chapterId: chapter.id });
    }
    this.deps.eventBus.emit({ type: 'VOLUME_DELETED', volumeId: id });
  }

  // ===================================
  // Chapter Methods (9 methods)
  // ===================================

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    // Validate FK: volumeId
    if (input.volumeId !== undefined && input.volumeId !== null) {
      const volume = this.deps.writingRepo.findVolumeById(input.volumeId);
      if (!volume) {
        throw new ReferenceNotFoundError('Volume', String(input.volumeId), 'volumeId');
      }
    }

    // Validate FK: arcId
    if (input.arcId) {
      const arc = this.deps.arcRepo.findById(input.arcId);
      if (!arc) {
        throw new ReferenceNotFoundError('Arc', input.arcId, 'arcId');
      }
    }

    // Validate arrays
    if (input.characters) {
      await this.validateCharacterIds(input.characters);
    }
    if (input.locations) {
      await this.validateLocationIds(input.locations);
    }
    if (input.foreshadowingHinted) {
      await this.validateForeshadowingIds(input.foreshadowingHinted);
    }

    const chapter = this.deps.writingRepo.createChapter({
      ...input,
      status: input.status ?? 'outline', // Default initial status
    });

    this.deps.eventBus.emit({ type: 'CHAPTER_CREATED', chapter });

    return chapter;
  }

  async getChapter(id: ChapterId): Promise<Chapter> {
    const chapter = this.deps.writingRepo.findChapterById(id);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', id);
    }
    return chapter;
  }

  async getChapterWithContent(id: ChapterId): Promise<Chapter> {
    const chapter = this.deps.writingRepo.findChapterWithContent(id);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', id);
    }
    return chapter;
  }

  async getAllChapters(): Promise<Chapter[]> {
    return this.deps.writingRepo.findAllChapters();
  }

  async getChaptersByVolume(volumeId: VolumeId): Promise<Chapter[]> {
    return this.deps.writingRepo.findChaptersByVolume(volumeId);
  }

  async getChaptersByArc(arcId: ArcId): Promise<Chapter[]> {
    return this.deps.writingRepo.findChaptersByArc(arcId);
  }

  async getChaptersByStatus(status: ChapterStatus): Promise<Chapter[]> {
    this.validateChapterStatus(status);
    return this.deps.writingRepo.findChaptersByStatus(status);
  }

  async updateChapter(id: ChapterId, input: UpdateChapterInput): Promise<Chapter> {
    // Check existence
    const existing = this.deps.writingRepo.findChapterById(id);
    if (!existing) {
      throw new EntityNotFoundError('Chapter', id);
    }

    // Validate status if provided
    this.validateChapterStatus(input.status);

    // Validate status transition if status is changing
    if (input.status && input.status !== existing.status) {
      this.validateStatusTransition(existing.status, input.status);
    }

    // Validate FKs if provided
    if (input.volumeId !== undefined && input.volumeId !== null) {
      const volume = this.deps.writingRepo.findVolumeById(input.volumeId);
      if (!volume) {
        throw new ReferenceNotFoundError('Volume', String(input.volumeId), 'volumeId');
      }
    }

    if (input.arcId !== undefined) {
      if (input.arcId === null) {
        // Allow clearing arcId
      } else {
        const arc = this.deps.arcRepo.findById(input.arcId);
        if (!arc) {
          throw new ReferenceNotFoundError('Arc', input.arcId, 'arcId');
        }
      }
    }

    if (input.characters) {
      await this.validateCharacterIds(input.characters);
    }
    if (input.locations) {
      await this.validateLocationIds(input.locations);
    }

    const chapter = this.deps.writingRepo.updateChapter(id, input);

    // Emit status change event if status changed
    if (input.status && input.status !== existing.status) {
      this.deps.eventBus.emit({
        type: 'CHAPTER_STATUS_CHANGED',
        chapter,
        oldStatus: existing.status,
        newStatus: input.status,
      });
    }

    this.deps.eventBus.emit({ type: 'CHAPTER_UPDATED', chapter, changes: input });

    return chapter;
  }

  async deleteChapter(id: ChapterId): Promise<void> {
    const chapter = this.deps.writingRepo.findChapterById(id);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', id);
    }

    const deleted = this.deps.writingRepo.deleteChapter(id);
    if (!deleted) {
      throw new TransactionError(`Failed to delete chapter ${id}`);
    }

    this.deps.eventBus.emit({ type: 'CHAPTER_DELETED', chapterId: id });
  }

  async reorderChapters(chapterIds: ChapterId[]): Promise<void> {
    // Validate all chapters exist
    for (const id of chapterIds) {
      const chapter = this.deps.writingRepo.findChapterById(id);
      if (!chapter) {
        throw new EntityNotFoundError('Chapter', id);
      }
    }

    // Call repo method to reorder
    this.deps.writingRepo.reorderChapters(chapterIds);

    this.deps.eventBus.emit({ type: 'CHAPTERS_REORDERED', chapterIds });
  }

  // ===================================
  // Content Methods (3 methods)
  // ===================================

  async saveContent(input: SaveContentInput): Promise<Chapter> {
    const { chapterId, content, createVersion = false } = input;

    // Check chapter exists
    const existing = this.deps.writingRepo.findChapterWithContent(chapterId);
    if (!existing) {
      throw new EntityNotFoundError('Chapter', String(chapterId));
    }

    const oldWordCount = existing.wordCount;

    // Save content (repo handles word count calculation)
    const chapter = this.deps.writingRepo.saveContent(chapterId, content);

    // Create version if requested
    if (createVersion) {
      const version = this.deps.writingRepo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId), // Convert to string
        content: { content, wordCount: chapter.wordCount },
        changeSummary: 'Manual save',
        source: 'manual',
      });

      this.deps.eventBus.emit({ type: 'VERSION_CREATED', version, chapterId });
    }

    const wordCountDelta = chapter.wordCount - oldWordCount;

    this.deps.eventBus.emit({ type: 'CHAPTER_SAVED', chapter, wordCountDelta });

    return chapter;
  }

  async getWordCount(chapterId: ChapterId): Promise<number> {
    const chapter = this.deps.writingRepo.findChapterById(chapterId);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', chapterId);
    }
    return this.deps.writingRepo.getWordCount(chapterId);
  }

  async getTotalWordCount(): Promise<number> {
    return this.deps.writingRepo.getTotalWordCount();
  }

  // ===================================
  // Version Methods (5 methods)
  // ===================================

  async createVersion(input: { chapterId: ChapterId; changeSummary?: string }): Promise<Version> {
    const chapter = this.deps.writingRepo.findChapterWithContent(input.chapterId);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', String(input.chapterId));
    }

    const version = this.deps.writingRepo.createVersion({
      entityType: 'chapter',
      entityId: String(input.chapterId), // Convert to string
      content: {
        content: chapter.content,
        wordCount: chapter.wordCount,
        title: chapter.title,
        status: chapter.status,
      },
      changeSummary: input.changeSummary ?? 'Manual version',
      source: 'manual',
    });

    this.deps.eventBus.emit({ type: 'VERSION_CREATED', version, chapterId: input.chapterId });

    return version;
  }

  async getVersions(chapterId: ChapterId): Promise<Version[]> {
    return this.deps.writingRepo.findVersionsByChapter(chapterId);
  }

  async getVersion(versionId: number): Promise<Version> {
    const version = this.deps.writingRepo.findVersionById(versionId);
    if (!version) {
      throw new EntityNotFoundError('Version', String(versionId));
    }
    return version;
  }

  async compareVersions(versionId1: number, versionId2: number): Promise<VersionDiff> {
    const v1 = this.deps.writingRepo.findVersionById(versionId1);
    if (!v1) {
      throw new EntityNotFoundError('Version', String(versionId1));
    }

    const v2 = this.deps.writingRepo.findVersionById(versionId2);
    if (!v2) {
      throw new EntityNotFoundError('Version', String(versionId2));
    }

    // Parse content
    const content1 = (v1.content as { content?: string })?.content ?? '';
    const content2 = (v2.content as { content?: string })?.content ?? '';
    const wordCount1 = (v1.content as { wordCount?: number })?.wordCount ?? 0;
    const wordCount2 = (v2.content as { wordCount?: number })?.wordCount ?? 0;

    // Simple line-based diff
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    // Count added/removed lines (simple heuristic)
    const added = Math.max(0, lines2.length - lines1.length);
    const removed = Math.max(0, lines1.length - lines2.length);

    return {
      added,
      removed,
      wordCountDelta: wordCount2 - wordCount1,
    };
  }

  async rollbackToVersion(chapterId: ChapterId, versionId: number): Promise<Chapter> {
    const chapter = this.deps.writingRepo.findChapterWithContent(chapterId);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', String(chapterId));
    }

    const version = this.deps.writingRepo.findVersionById(versionId);
    if (!version) {
      throw new EntityNotFoundError('Version', String(versionId));
    }

    // Verify version belongs to this chapter
    if (version.entityId !== String(chapterId)) {
      // Compare with string
      throw new ValidationError(
        `Version ${versionId} does not belong to chapter ${chapterId}`,
        'versionId'
      );
    }

    // Wrap backup + restore in transaction for atomicity
    const versionContent = version.content as { content?: string; wordCount?: number };

    const result = this.deps.db.transaction(() => {
      // Create rollback backup first
      this.deps.writingRepo.createVersion({
        entityType: 'chapter',
        entityId: String(chapterId),
        content: {
          content: chapter.content,
          wordCount: chapter.wordCount,
          title: chapter.title,
          status: chapter.status,
        },
        changeSummary: `Rollback backup before restoring to version ${versionId}`,
        source: 'rollback_backup',
      });

      // Restore content from version
      return this.deps.writingRepo.saveContent(chapterId, versionContent.content ?? '');
    });

    if (!result.success) {
      throw new TransactionError(
        `Failed to rollback chapter ${chapterId} to version ${versionId}`,
        result.error
      );
    }

    const restoredChapter = result.result!;

    this.deps.eventBus.emit({ type: 'CHAPTER_ROLLED_BACK', chapter: restoredChapter, versionId });

    return restoredChapter;
  }

  async cleanupOldVersions(olderThanDays: number): Promise<number> {
    // Only cleanup 'auto' versions, preserve 'manual' and 'ai_backup'
    const count = this.deps.writingRepo.cleanupOldVersions(olderThanDays, 'auto');

    this.deps.eventBus.emit({ type: 'VERSIONS_CLEANED_UP', count, olderThanDays });

    return count;
  }

  // ===================================
  // FK Cleanup Methods (for StoryBibleService integration)
  // ===================================

  async cleanupCharacterReferences(characterId: CharacterId): Promise<void> {
    const result = this.deps.db.transaction(() => {
      this.deps.writingRepo.cleanupCharacterReferences(characterId);
    });

    if (!result.success) {
      throw new TransactionError(
        `Failed to cleanup character references for ${characterId}`,
        result.error
      );
    }
  }

  async cleanupLocationReferences(locationId: LocationId): Promise<void> {
    const result = this.deps.db.transaction(() => {
      this.deps.writingRepo.cleanupLocationReferences(locationId);
    });

    if (!result.success) {
      throw new TransactionError(
        `Failed to cleanup location references for ${locationId}`,
        result.error
      );
    }
  }

  async cleanupForeshadowingReferences(foreshadowingId: ForeshadowingId): Promise<void> {
    const result = this.deps.db.transaction(() => {
      this.deps.writingRepo.cleanupForeshadowingReferences(foreshadowingId);
    });

    if (!result.success) {
      throw new TransactionError(
        `Failed to cleanup foreshadowing references for ${foreshadowingId}`,
        result.error
      );
    }
  }

  // ===================================
  // Stub Methods (deferred to post-M3)
  // ===================================

  async setDailyGoal(_targetWords: number): Promise<WritingGoal> {
    throw new Error('Goals feature deferred to post-M3');
  }

  async setChapterGoal(_chapterId: ChapterId, _targetWords: number): Promise<WritingGoal> {
    throw new Error('Goals feature deferred to post-M3');
  }

  async getActiveGoals(): Promise<WritingGoal[]> {
    throw new Error('Goals feature deferred to post-M3');
  }

  async updateGoalProgress(_goalId: number, _wordsWritten: number): Promise<WritingGoal> {
    throw new Error('Goals feature deferred to post-M3');
  }

  async completeGoal(_goalId: number): Promise<WritingGoal> {
    throw new Error('Goals feature deferred to post-M3');
  }

  async startSession(_chapterId?: ChapterId): Promise<WritingSession> {
    throw new Error('Sessions feature deferred to post-M3');
  }

  async endSession(_sessionId: number): Promise<WritingSession> {
    throw new Error('Sessions feature deferred to post-M3');
  }

  async getSession(_sessionId: number): Promise<WritingSession | null> {
    throw new Error('Sessions feature deferred to post-M3');
  }

  async getTodaySessions(): Promise<WritingSession[]> {
    throw new Error('Sessions feature deferred to post-M3');
  }

  async getWritingStats(_startDate: string, _endDate: string): Promise<WritingStats> {
    throw new Error('Stats feature deferred to post-M3');
  }

  async getCurrentStreak(): Promise<number> {
    throw new Error('Streak feature deferred to post-M3');
  }
}
