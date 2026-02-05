/**
 * Mock WritingService
 *
 * In-memory implementation for testing and parallel development.
 * Conforms to IWritingService interface.
 */

import type {
  IWritingService,
  CreateChapterInput,
  SaveContentInput,
  VersionDiff,
  WritingStats,
} from '../../types/services.js';

import type {
  Chapter,
  ChapterId,
  ChapterStatus,
  Volume,
  VolumeId,
  ArcId,
  WritingGoal,
  WritingSession,
  Version,
} from '../../types/entities.js';

export class MockWritingService implements IWritingService {
  private chapters: Map<ChapterId, Chapter> = new Map();
  private volumes: Map<VolumeId, Volume> = new Map();
  private goals: Map<number, WritingGoal> = new Map();
  private sessions: Map<number, WritingSession> = new Map();
  private versions: Map<number, Version> = new Map();

  private nextGoalId = 1;
  private nextSessionId = 1;
  private nextVersionId = 1;
  private nextChapterId = 1;
  private nextVolumeId = 1;

  private activeSessionId: number | null = null;

  private now(): string {
    return new Date().toISOString();
  }

  // === Volumes ===

  async createVolume(input: Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Volume> {
    const id = this.nextVolumeId++;
    const volume: Volume = {
      ...input,
      id,
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.volumes.set(id, volume);
    return volume;
  }

  async getVolume(id: VolumeId): Promise<Volume | null> {
    return this.volumes.get(id) ?? null;
  }

  async getAllVolumes(): Promise<Volume[]> {
    return Array.from(this.volumes.values()).sort((a, b) => a.id - b.id);
  }

  async updateVolume(id: VolumeId, input: Partial<Volume>): Promise<Volume> {
    const volume = this.volumes.get(id);
    if (!volume) {
      throw new Error(`Volume not found: ${id}`);
    }

    const updated: Volume = {
      ...volume,
      ...input,
      updatedAt: this.now(),
    };
    this.volumes.set(id, updated);
    return updated;
  }

  async deleteVolume(id: VolumeId): Promise<void> {
    this.volumes.delete(id);
  }

  // === Chapters ===

  async createChapter(input: CreateChapterInput): Promise<Chapter> {
    const id = this.nextChapterId++;
    const chapter: Chapter = {
      id,
      volumeId: input.volumeId,
      arcId: input.arcId,
      title: input.title,
      status: 'outline',
      outline: input.outline,
      content: '',
      wordCount: 0,
      characters: [],
      locations: [],
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.chapters.set(id, chapter);
    return chapter;
  }

  async getChapter(id: ChapterId): Promise<Chapter | null> {
    return this.chapters.get(id) ?? null;
  }

  async getChapterWithContent(id: ChapterId): Promise<Chapter | null> {
    return this.chapters.get(id) ?? null;
  }

  async getAllChapters(): Promise<Chapter[]> {
    return Array.from(this.chapters.values()).sort((a, b) => a.id - b.id);
  }

  async getChaptersByVolume(volumeId: VolumeId): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter((c) => c.volumeId === volumeId)
      .sort((a, b) => a.id - b.id);
  }

  async getChaptersByArc(arcId: ArcId): Promise<Chapter[]> {
    return Array.from(this.chapters.values())
      .filter((c) => c.arcId === arcId)
      .sort((a, b) => a.id - b.id);
  }

  async getChaptersByStatus(status: ChapterStatus): Promise<Chapter[]> {
    return Array.from(this.chapters.values()).filter((c) => c.status === status);
  }

  async updateChapter(id: ChapterId, input: Partial<Chapter>): Promise<Chapter> {
    const chapter = this.chapters.get(id);
    if (!chapter) {
      throw new Error(`Chapter not found: ${id}`);
    }

    const updated: Chapter = {
      ...chapter,
      ...input,
      updatedAt: this.now(),
    };

    // Recalculate word count if content changed
    if (input.content !== undefined) {
      updated.wordCount = input.content.split(/\s+/).filter(Boolean).length;
    }

    this.chapters.set(id, updated);
    return updated;
  }

  async deleteChapter(id: ChapterId): Promise<void> {
    this.chapters.delete(id);
  }

  async reorderChapters(chapterIds: ChapterId[]): Promise<void> {
    // In a real implementation, this would update ordering in DB
    // For mock, we just verify all chapters exist
    for (const id of chapterIds) {
      if (!this.chapters.has(id)) {
        throw new Error(`Chapter not found: ${id}`);
      }
    }
  }

  // === Content Editing ===

  async saveContent(input: SaveContentInput): Promise<Chapter> {
    const chapter = this.chapters.get(input.chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${input.chapterId}`);
    }

    // Create version if requested
    if (input.createVersion) {
      await this.createVersion(input.chapterId, 'Auto-save');
    }

    const newWordCount = input.content.split(/\s+/).filter(Boolean).length;

    chapter.content = input.content;
    chapter.wordCount = newWordCount;
    chapter.updatedAt = this.now();

    // Update active session if exists
    if (this.activeSessionId !== null) {
      const session = this.sessions.get(this.activeSessionId);
      if (session) {
        session.wordsWritten = newWordCount;
      }
    }

    return chapter;
  }

  async getWordCount(chapterId: ChapterId): Promise<number> {
    const chapter = this.chapters.get(chapterId);
    return chapter?.wordCount ?? 0;
  }

  async getTotalWordCount(): Promise<number> {
    return Array.from(this.chapters.values()).reduce((sum, c) => sum + c.wordCount, 0);
  }

  // === Version Control ===

  async createVersion(chapterId: ChapterId, summary?: string): Promise<Version> {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    const id = this.nextVersionId++;
    const version: Version = {
      id,
      entityType: 'chapter',
      entityId: String(chapterId),
      content: { content: chapter.content, wordCount: chapter.wordCount },
      changeSummary: summary,
      createdAt: this.now(),
    };
    this.versions.set(id, version);
    return version;
  }

  async getVersions(chapterId: ChapterId): Promise<Version[]> {
    return Array.from(this.versions.values())
      .filter((v) => v.entityType === 'chapter' && v.entityId === String(chapterId))
      .sort((a, b) => b.id - a.id);
  }

  async getVersion(versionId: number): Promise<Version | null> {
    return this.versions.get(versionId) ?? null;
  }

  async compareVersions(versionId1: number, versionId2: number): Promise<VersionDiff> {
    const v1 = this.versions.get(versionId1);
    const v2 = this.versions.get(versionId2);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    const c1 = v1.content as { content: string; wordCount: number };
    const c2 = v2.content as { content: string; wordCount: number };

    return {
      added: Math.max(0, c2.wordCount - c1.wordCount),
      removed: Math.max(0, c1.wordCount - c2.wordCount),
      wordCountDelta: c2.wordCount - c1.wordCount,
    };
  }

  async rollbackToVersion(chapterId: ChapterId, versionId: number): Promise<Chapter> {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }

    const version = this.versions.get(versionId);
    if (!version || version.entityType !== 'chapter' || version.entityId !== String(chapterId)) {
      throw new Error(`Version not found: ${versionId}`);
    }

    const restoredContent = version.content as { content: string; wordCount: number };
    chapter.content = restoredContent.content;
    chapter.wordCount = restoredContent.wordCount;
    chapter.updatedAt = this.now();

    return chapter;
  }

  async cleanupOldVersions(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoff = cutoffDate.toISOString();

    let deleted = 0;
    for (const [id, version] of this.versions) {
      if (version.createdAt < cutoff) {
        this.versions.delete(id);
        deleted++;
      }
    }
    return deleted;
  }

  // === Writing Goals ===

  async setDailyGoal(targetWords: number): Promise<WritingGoal> {
    const today = new Date().toISOString().split('T')[0];
    const id = this.nextGoalId++;
    const goal: WritingGoal = {
      id,
      type: 'daily',
      targetWords,
      date: today,
      currentWords: 0,
      status: 'active',
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async setChapterGoal(chapterId: ChapterId, targetWords: number): Promise<WritingGoal> {
    const id = this.nextGoalId++;
    const goal: WritingGoal = {
      id,
      type: 'chapter',
      targetWords,
      chapterId,
      currentWords: 0,
      status: 'active',
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async getActiveGoals(): Promise<WritingGoal[]> {
    return Array.from(this.goals.values()).filter((g) => g.status === 'active');
  }

  async updateGoalProgress(goalId: number, wordsWritten: number): Promise<WritingGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    goal.currentWords += wordsWritten;
    if (goal.currentWords >= goal.targetWords) {
      goal.status = 'completed';
    }
    goal.updatedAt = this.now();

    return goal;
  }

  async completeGoal(goalId: number): Promise<WritingGoal> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }

    goal.status = 'completed';
    goal.updatedAt = this.now();
    return goal;
  }

  // === Writing Sessions ===

  async startSession(chapterId?: ChapterId): Promise<WritingSession> {
    const id = this.nextSessionId++;
    const session: WritingSession = {
      id,
      startedAt: this.now(),
      chapterId,
      wordsWritten: 0,
      createdAt: this.now(),
    };
    this.sessions.set(id, session);
    this.activeSessionId = id;
    return session;
  }

  async endSession(sessionId: number): Promise<WritingSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.endedAt = this.now();
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(session.endedAt).getTime();
    session.durationMinutes = Math.round((endTime - startTime) / 60000);

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    return session;
  }

  async getSession(sessionId: number): Promise<WritingSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async getTodaySessions(): Promise<WritingSession[]> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.sessions.values()).filter((s) => s.startedAt.startsWith(today));
  }

  // === Statistics ===

  async getWritingStats(startDate: string, endDate: string): Promise<WritingStats> {
    const sessions = Array.from(this.sessions.values()).filter(
      (s) => s.startedAt >= startDate && s.startedAt <= endDate && s.endedAt
    );

    const totalWords = sessions.reduce((sum, s) => sum + s.wordsWritten, 0);
    const totalTime = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

    const days = new Set(sessions.map((s) => s.startedAt.split('T')[0])).size;

    return {
      totalWords,
      totalTime,
      chaptersEdited: new Set(sessions.map((s) => s.chapterId).filter(Boolean)).size,
      avgWordsPerDay: days > 0 ? Math.round(totalWords / days) : 0,
      streak: 0, // Would need more complex calculation
    };
  }

  async getCurrentStreak(): Promise<number> {
    // Simplified streak calculation
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasSession = Array.from(this.sessions.values()).some(
        (s) => s.startedAt.startsWith(dateStr) && s.endedAt
      );

      if (!hasSession) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  // === Test Helpers ===

  reset(): void {
    this.chapters.clear();
    this.volumes.clear();
    this.goals.clear();
    this.sessions.clear();
    this.versions.clear();
    this.nextGoalId = 1;
    this.nextSessionId = 1;
    this.nextVersionId = 1;
    this.nextChapterId = 1;
    this.nextVolumeId = 1;
    this.activeSessionId = null;
  }
}
