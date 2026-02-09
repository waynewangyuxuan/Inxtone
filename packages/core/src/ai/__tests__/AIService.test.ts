/**
 * AIService Integration Tests
 *
 * Tests AIService with real in-memory SQLite for context building
 * and mocked GeminiProvider for streaming.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Database } from '../../db/Database.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { EventBus } from '../../services/EventBus.js';
import type { AIStreamChunk } from '../../types/services.js';

// Mock @google/genai before AIService import
const mockGenerateContentStream = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContentStream: mockGenerateContentStream,
    },
  })),
}));

import { AIService } from '../AIService.js';

/** Helper: collect all chunks from an async iterable */
async function collectChunks(iterable: AsyncIterable<AIStreamChunk>): Promise<AIStreamChunk[]> {
  const chunks: AIStreamChunk[] = [];
  for await (const chunk of iterable) {
    chunks.push(chunk);
  }
  return chunks;
}

/** Helper: create mock async generator for streaming */
async function* mockAsyncGen(texts: string[]) {
  for (const text of texts) {
    yield { text };
  }
}

describe('AIService', () => {
  let db: Database;
  let eventBus: EventBus;
  let service: AIService;
  let writingRepo: WritingRepository;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let worldRepo: WorldRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    eventBus = new EventBus();

    writingRepo = new WritingRepository(db);
    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    worldRepo = new WorldRepository(db);

    service = new AIService(
      {
        writingRepo,
        characterRepo,
        locationRepo,
        arcRepo: new ArcRepository(db),
        relationshipRepo: new RelationshipRepository(db),
        foreshadowingRepo: new ForeshadowingRepository(db),
        hookRepo: new HookRepository(db),
        worldRepo,
        eventBus,
      },
      { geminiApiKey: 'test-api-key' }
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    db.close();
  });

  // ============================================
  // continueScene
  // ============================================

  describe('continueScene', () => {
    it('builds context, assembles prompt, and streams chunks', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['Once', ' upon']));

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '从前有一座山');

      const chunks = await collectChunks(service.continueScene(chapter.id));

      expect(chunks).toEqual([
        { type: 'content', content: 'Once' },
        { type: 'content', content: ' upon' },
        { type: 'done' },
      ]);

      // Verify prompt was assembled with context
      expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('从前有一座山');
    });

    it('emits AI lifecycle events', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['Hello']));

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      const events: Array<{ type: string }> = [];
      eventBus.on('AI_GENERATION_STARTED', (e) => events.push(e));
      eventBus.on('AI_CONTEXT_BUILT', (e) => events.push(e));
      eventBus.on('AI_GENERATION_PROGRESS', (e) => events.push(e));
      eventBus.on('AI_GENERATION_COMPLETED', (e) => events.push(e));

      await collectChunks(service.continueScene(chapter.id));

      const eventTypes = events.map((e) => e.type);
      expect(eventTypes).toContain('AI_GENERATION_STARTED');
      expect(eventTypes).toContain('AI_CONTEXT_BUILT');
      expect(eventTypes).toContain('AI_GENERATION_PROGRESS');
      expect(eventTypes).toContain('AI_GENERATION_COMPLETED');
    });

    it('yields error for nonexistent chapter', async () => {
      const chunks = await collectChunks(service.continueScene(999 as never));

      expect(chunks.length).toBe(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('999');
    });

    it('emits error event on provider failure', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('401 Unauthorized'));

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      const errors: Array<{ type: string; error: string }> = [];
      eventBus.on('AI_GENERATION_ERROR', (e) => errors.push(e));

      const chunks = await collectChunks(service.continueScene(chapter.id));

      expect(chunks.some((c) => c.type === 'error')).toBe(true);
      expect(errors.length).toBe(1);
    });
  });

  // ============================================
  // generateDialogue
  // ============================================

  describe('generateDialogue', () => {
    it('generates dialogue for characters', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['"你好"，林逸说道。']));

      const char1 = characterRepo.create({ name: '林逸', role: 'main' });
      const char2 = characterRepo.create({ name: '陈浩', role: 'supporting' });

      const chunks = await collectChunks(
        service.generateDialogue([char1.id, char2.id], '两人在擂台相遇')
      );

      expect(chunks.some((c) => c.type === 'content')).toBe(true);
      expect(chunks[chunks.length - 1].type).toBe('done');

      // Prompt should contain character names
      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('林逸');
      expect(callArgs.contents).toContain('陈浩');
    });

    it('yields error for no valid characters', async () => {
      const chunks = await collectChunks(
        service.generateDialogue(['nonexistent' as never], 'context')
      );

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('No valid characters');
    });
  });

  // ============================================
  // describeScene
  // ============================================

  describe('describeScene', () => {
    it('generates scene description for a location', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['一座古朴的擂台...']));

      const loc = locationRepo.create({ name: '宗门擂台', type: '建筑', atmosphere: '紧张' });

      const chunks = await collectChunks(service.describeScene(loc.id, '紧张激烈'));

      expect(chunks.some((c) => c.type === 'content')).toBe(true);
      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('宗门擂台');
      expect(callArgs.contents).toContain('紧张激烈');
    });

    it('yields error for nonexistent location', async () => {
      const chunks = await collectChunks(service.describeScene('LOC999' as never, 'mood'));

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('not found');
    });
  });

  // ============================================
  // brainstorm
  // ============================================

  describe('brainstorm', () => {
    it('generates brainstorm ideas', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['方向1: ...']));

      const chunks = await collectChunks(service.brainstorm('如何让主角成长'));

      expect(chunks[0]).toEqual({ type: 'content', content: '方向1: ...' });
      expect(chunks[1]).toEqual({ type: 'done' });

      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('如何让主角成长');
    });
  });

  // ============================================
  // askStoryBible
  // ============================================

  describe('askStoryBible', () => {
    it('answers questions with world context', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['灵气修炼的核心...']));

      worldRepo.upsert({
        powerSystem: { name: '灵气', coreRules: ['不能逆天而行'] },
      });

      const chunks = await collectChunks(service.askStoryBible('力量体系是什么？'));

      expect(chunks[0].type).toBe('content');
      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('灵气');
      expect(callArgs.contents).toContain('力量体系是什么');
    });
  });

  // ============================================
  // complete
  // ============================================

  describe('complete', () => {
    it('completes with custom prompt', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['完成']));

      const chunks = await collectChunks(service.complete('请帮我写一段'));

      expect(chunks[0]).toEqual({ type: 'content', content: '完成' });
    });

    it('includes context when provided', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['结果']));

      await collectChunks(
        service.complete('继续', [{ type: 'custom', content: '参考资料', priority: 200 }])
      );

      const callArgs = mockGenerateContentStream.mock.calls[0][0];
      expect(callArgs.contents).toContain('参考资料');
    });
  });

  // ============================================
  // buildContext
  // ============================================

  describe('buildContext', () => {
    it('delegates to ContextBuilder', async () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      const result = await service.buildContext(chapter.id);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(typeof result.truncated).toBe('boolean');
    });
  });

  // ============================================
  // searchRelevantContext (stub)
  // ============================================

  describe('searchRelevantContext', () => {
    it('returns empty array (stub for M4)', async () => {
      const result = await service.searchRelevantContext('query');
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // Provider Management
  // ============================================

  describe('provider management', () => {
    it('getAvailableProviders returns gemini', () => {
      expect(service.getAvailableProviders()).toEqual(['gemini']);
    });

    it('isProviderConfigured returns true for gemini with key', () => {
      expect(service.isProviderConfigured('gemini')).toBe(true);
    });

    it('isProviderConfigured returns false for unsupported provider', () => {
      expect(service.isProviderConfigured('openai')).toBe(false);
    });

    it('setDefaultProvider sets the provider', () => {
      service.setDefaultProvider('claude');
      // No error thrown, just sets internal state
      expect(service.getAvailableProviders()).toEqual(['gemini']);
    });

    it('countTokens estimates tokens', () => {
      expect(service.countTokens('你好世界')).toBe(6);
      expect(service.countTokens('Hello world')).toBeGreaterThan(0);
    });
  });

  // ============================================
  // No API key configured
  // ============================================

  describe('no API key', () => {
    it('yields error when Gemini API key is not set', async () => {
      const serviceNoKey = new AIService(
        {
          writingRepo,
          characterRepo,
          locationRepo,
          arcRepo: new ArcRepository(db),
          relationshipRepo: new RelationshipRepository(db),
          foreshadowingRepo: new ForeshadowingRepository(db),
          hookRepo: new HookRepository(db),
          worldRepo,
          eventBus,
        },
        { geminiApiKey: undefined }
      );

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      const chunks = await collectChunks(serviceNoKey.continueScene(chapter.id));

      expect(chunks.some((c) => c.type === 'error')).toBe(true);
      expect(chunks.some((c) => c.error?.includes('API key'))).toBe(true);
    });
  });
});
