/**
 * AI API Route Integration Tests
 *
 * Tests the HTTP endpoints for AI generation using mocked IAIService.
 * SSE endpoints are tested for correct headers and data format.
 * JSON endpoints are tested for correct response structure.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import type { IAIService, AIStreamChunk, BuiltContext, ContextItem } from '@inxtone/core';
import { errorHandler } from '../../middleware/errorHandler.js';
import { aiRoutes } from '../ai.js';

/**
 * Create an AsyncIterable from an array of chunks (simulates streaming).
 */
async function* mockStream(chunks: AIStreamChunk[]): AsyncGenerator<AIStreamChunk> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

/**
 * Create a mock IAIService for testing.
 */
function createMockAIService(overrides: Partial<IAIService> = {}): IAIService {
  return {
    continueScene: vi.fn(() =>
      mockStream([
        { type: 'content', content: '月光洒落' },
        { type: 'content', content: '在庭院中' },
        { type: 'done', content: '' },
      ])
    ),
    generateDialogue: vi.fn(() =>
      mockStream([
        { type: 'content', content: '"你来了。"' },
        { type: 'done', content: '' },
      ])
    ),
    describeScene: vi.fn(() =>
      mockStream([
        { type: 'content', content: '远处山峦叠嶂' },
        { type: 'done', content: '' },
      ])
    ),
    brainstorm: vi.fn(() =>
      mockStream([
        { type: 'content', content: '1. 师徒矛盾' },
        { type: 'done', content: '' },
      ])
    ),
    askStoryBible: vi.fn(() =>
      mockStream([
        { type: 'content', content: '根据设定，林墨渊的修为...' },
        { type: 'done', content: '' },
      ])
    ),
    complete: vi.fn(() =>
      mockStream([
        { type: 'content', content: 'Generated text' },
        { type: 'done', content: '' },
      ])
    ),
    buildContext: vi.fn(async () => ({
      items: [
        { type: 'chapter_content', content: '第一章内容', priority: 1000, tokenCount: 100 },
      ] as ContextItem[],
      totalTokens: 100,
      truncated: false,
    })) as unknown as IAIService['buildContext'],
    searchRelevantContext: vi.fn(async () => []) as unknown as IAIService['searchRelevantContext'],
    getAvailableProviders: vi.fn(() => ['gemini' as const]),
    isProviderConfigured: vi.fn((provider) => provider === 'gemini'),
    setDefaultProvider: vi.fn(),
    countTokens: vi.fn(() => 42),
    ...overrides,
  };
}

/**
 * Parse SSE response body into an array of data objects.
 */
function parseSSE(body: string): unknown[] {
  return body
    .split('\n\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.replace('data: ', '')));
}

describe('AI API Routes - /api/ai', () => {
  let server: FastifyInstance;
  let aiService: IAIService;

  beforeEach(async () => {
    aiService = createMockAIService();
    server = Fastify({ logger: false });
    server.setErrorHandler(errorHandler);
    await server.register(aiRoutes({ storyBibleService: {} as never, aiService }), {
      prefix: '/api/ai',
    });
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  // ============================================
  // SSE Streaming Endpoints
  // ============================================

  describe('POST /api/ai/continue', () => {
    it('should stream SSE chunks for scene continuation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1 },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');

      const events = parseSSE(response.body);
      expect(events).toHaveLength(3);
      expect(events[0]).toEqual({ type: 'content', content: '月光洒落' });
      expect(events[1]).toEqual({ type: 'content', content: '在庭院中' });
      expect(events[2]).toEqual({ type: 'done', content: '' });

      expect(aiService.continueScene).toHaveBeenCalledWith(1, undefined, undefined, undefined);
    });

    it('should pass options to the service', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1, options: { temperature: 0.5 } },
      });

      expect(response.statusCode).toBe(200);
      expect(aiService.continueScene).toHaveBeenCalledWith(
        1,
        { temperature: 0.5 },
        undefined,
        undefined
      );
    });

    it('should pass excludedContextIds to the service', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1, excludedContextIds: ['C001', 'rel-5'] },
      });

      expect(response.statusCode).toBe(200);
      expect(aiService.continueScene).toHaveBeenCalledWith(1, undefined, undefined, [
        'C001',
        'rel-5',
      ]);
    });
  });

  describe('POST /api/ai/dialogue', () => {
    it('should stream SSE chunks for dialogue generation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/dialogue',
        payload: {
          characterIds: ['C001', 'C002'],
          context: '两人在山顶相遇',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');

      const events = parseSSE(response.body);
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: 'content', content: '"你来了。"' });

      expect(aiService.generateDialogue).toHaveBeenCalledWith(
        ['C001', 'C002'],
        '两人在山顶相遇',
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai/describe', () => {
    it('should stream SSE chunks for scene description', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/describe',
        payload: { locationId: 'L001', mood: '悲壮' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');

      const events = parseSSE(response.body);
      expect(events[0]).toEqual({ type: 'content', content: '远处山峦叠嶂' });

      expect(aiService.describeScene).toHaveBeenCalledWith(
        'L001',
        '悲壮',
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai/brainstorm', () => {
    it('should stream SSE chunks for brainstorming', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/brainstorm',
        payload: { topic: '如何展开师徒冲突' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');

      const events = parseSSE(response.body);
      expect(events[0]).toEqual({ type: 'content', content: '1. 师徒矛盾' });

      expect(aiService.brainstorm).toHaveBeenCalledWith(
        '如何展开师徒冲突',
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('POST /api/ai/ask', () => {
    it('should stream SSE chunks for story bible questions', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/ask',
        payload: { question: '林墨渊的修为到什么境界了？' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');

      const events = parseSSE(response.body);
      expect(events[0]).toEqual({ type: 'content', content: '根据设定，林墨渊的修为...' });

      expect(aiService.askStoryBible).toHaveBeenCalledWith('林墨渊的修为到什么境界了？', undefined);
    });
  });

  describe('POST /api/ai/complete', () => {
    it('should stream SSE chunks for generic completion', async () => {
      const contextItems = [{ type: 'custom', content: '春天的早晨', priority: 100 }];
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/complete',
        payload: { prompt: 'Write a poem', context: contextItems },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');

      const events = parseSSE(response.body);
      expect(events[0]).toEqual({ type: 'content', content: 'Generated text' });

      expect(aiService.complete).toHaveBeenCalledWith('Write a poem', contextItems, undefined);
    });
  });

  // ============================================
  // SSE Error Handling
  // ============================================

  describe('SSE error handling', () => {
    it('should stream error chunk when service throws', async () => {
      const errorService = createMockAIService({
        continueScene: vi.fn(() => {
          async function* errorStream(): AsyncGenerator<AIStreamChunk> {
            throw new Error('Provider unavailable');
          }
          return errorStream();
        }),
      });

      const errorServer = Fastify({ logger: false });
      errorServer.setErrorHandler(errorHandler);
      await errorServer.register(
        aiRoutes({ storyBibleService: {} as never, aiService: errorService }),
        { prefix: '/api/ai' }
      );
      await errorServer.ready();

      const response = await errorServer.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1 },
      });

      expect(response.statusCode).toBe(200);
      const events = parseSSE(response.body);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ type: 'error', error: 'Provider unavailable' });

      await errorServer.close();
    });
  });

  // ============================================
  // JSON Endpoints
  // ============================================

  describe('POST /api/ai/context', () => {
    it('should return built context as JSON', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/context',
        payload: { chapterId: 1 },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.totalTokens).toBe(100);
      expect(body.data.truncated).toBe(false);

      expect(aiService.buildContext).toHaveBeenCalledWith(1, undefined);
    });

    it('should pass additionalItems to the service', async () => {
      const additional = [{ type: 'custom', content: 'Remember the sunrise', priority: 500 }];

      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/context',
        payload: { chapterId: 1, additionalItems: additional },
      });

      expect(response.statusCode).toBe(200);
      expect(aiService.buildContext).toHaveBeenCalledWith(1, additional);
    });
  });

  describe('GET /api/ai/providers', () => {
    it('should return provider information', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/ai/providers',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.available).toEqual(['gemini']);
      expect(body.data.configured).toEqual(['gemini']);
      expect(body.data.default).toBe('gemini');
    });

    it('should show unconfigured providers', async () => {
      const unconfiguredService = createMockAIService({
        isProviderConfigured: vi.fn(() => false),
      });

      const unconfiguredServer = Fastify({ logger: false });
      unconfiguredServer.setErrorHandler(errorHandler);
      await unconfiguredServer.register(
        aiRoutes({ storyBibleService: {} as never, aiService: unconfiguredService }),
        { prefix: '/api/ai' }
      );
      await unconfiguredServer.ready();

      const response = await unconfiguredServer.inject({
        method: 'GET',
        url: '/api/ai/providers',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.available).toEqual(['gemini']);
      expect(body.data.configured).toEqual([]);

      await unconfiguredServer.close();
    });
  });

  // ============================================
  // Request Validation (Zod)
  // ============================================

  describe('request validation', () => {
    it('should return 400 for /continue with missing chapterId', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for /dialogue with empty characterIds', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/dialogue',
        payload: { characterIds: [], context: 'test' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for /describe with missing mood', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/describe',
        payload: { locationId: 'L001' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for /complete with invalid context item type', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/complete',
        payload: {
          prompt: 'test',
          context: [{ type: 'invalid_type', content: 'x', priority: 1 }],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for /continue with invalid temperature', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1, options: { temperature: 5 } },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================
  // No AI Service
  // ============================================

  describe('when aiService is not provided', () => {
    it('should not register any routes', async () => {
      const noAIServer = Fastify({ logger: false });
      noAIServer.setErrorHandler(errorHandler);
      await noAIServer.register(aiRoutes({ storyBibleService: {} as never }), {
        prefix: '/api/ai',
      });
      await noAIServer.ready();

      const response = await noAIServer.inject({
        method: 'POST',
        url: '/api/ai/continue',
        payload: { chapterId: 1 },
      });

      expect(response.statusCode).toBe(404);

      await noAIServer.close();
    });
  });
});
