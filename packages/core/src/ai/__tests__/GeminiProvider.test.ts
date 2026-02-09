/**
 * GeminiProvider Unit Tests
 *
 * Mocks @google/genai SDK to test streaming, retry, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @google/genai before any imports
const mockGenerateContentStream = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContentStream: mockGenerateContentStream,
    },
  })),
}));

import { GeminiProvider } from '../GeminiProvider.js';

/** Helper: collect all chunks from an async generator */
async function collectChunks(
  gen: AsyncGenerator<{ type: string; content?: string; error?: string }>
) {
  const chunks: Array<{ type: string; content?: string; error?: string }> = [];
  for await (const chunk of gen) {
    chunks.push(chunk);
  }
  return chunks;
}

/** Helper: create a mock async generator that yields chunks */
async function* mockAsyncGen(texts: string[]) {
  for (const text of texts) {
    yield { text };
  }
}

describe('GeminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // isConfigured
  // ============================================

  describe('isConfigured', () => {
    it('returns true when API key is set', () => {
      const provider = new GeminiProvider('test-api-key');
      expect(provider.isConfigured()).toBe(true);
    });

    it('returns false when API key is undefined', () => {
      const provider = new GeminiProvider(undefined);
      expect(provider.isConfigured()).toBe(false);
    });

    it('returns false when API key is empty string', () => {
      const provider = new GeminiProvider('');
      expect(provider.isConfigured()).toBe(false);
    });
  });

  // ============================================
  // stream - success
  // ============================================

  describe('stream - success', () => {
    it('yields content chunks and done', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['Hello', ' World']));

      const provider = new GeminiProvider('test-key');
      const chunks = await collectChunks(provider.stream('test prompt'));

      expect(chunks).toEqual([
        { type: 'content', content: 'Hello' },
        { type: 'content', content: ' World' },
        { type: 'done' },
      ]);
    });

    it('passes model and config to SDK', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['ok']));

      const provider = new GeminiProvider('test-key', {
        model: 'gemini-2.5-pro',
        temperature: 0.5,
        maxOutputTokens: 2000,
      });
      await collectChunks(provider.stream('prompt', { temperature: 0.3, maxTokens: 1000 }));

      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.5-pro',
        contents: 'prompt',
        config: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      });
    });

    it('uses option overrides from AIGenerationOptions', async () => {
      mockGenerateContentStream.mockResolvedValue(mockAsyncGen(['ok']));

      const provider = new GeminiProvider('test-key');
      await collectChunks(
        provider.stream('prompt', { model: 'gemini-2.5-flash', temperature: 0.9 })
      );

      expect(mockGenerateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.5-flash' })
      );
    });

    it('skips chunks with no text', async () => {
      async function* genWithEmpty() {
        yield { text: 'Hello' };
        yield { text: undefined };
        yield { text: '' };
        yield { text: ' World' };
      }
      mockGenerateContentStream.mockResolvedValue(genWithEmpty());

      const provider = new GeminiProvider('test-key');
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks).toEqual([
        { type: 'content', content: 'Hello' },
        { type: 'content', content: ' World' },
        { type: 'done' },
      ]);
    });
  });

  // ============================================
  // stream - no API key
  // ============================================

  describe('stream - no API key', () => {
    it('yields error when no API key configured', async () => {
      const provider = new GeminiProvider(undefined);
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks.length).toBe(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('API key not configured');
    });
  });

  // ============================================
  // stream - error handling
  // ============================================

  describe('stream - error handling', () => {
    it('maps auth error (401)', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('401 Unauthorized'));

      const provider = new GeminiProvider('bad-key', { retryCount: 1 });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks.length).toBe(1);
      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('AI_PROVIDER_ERROR');
      expect(chunks[0].error).toContain('Invalid API key');
    });

    it('maps content filter error', async () => {
      mockGenerateContentStream.mockRejectedValue(
        new Error('Content was blocked by safety settings')
      );

      const provider = new GeminiProvider('test-key', { retryCount: 1 });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('AI_CONTENT_FILTERED');
    });

    it('maps token limit error', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('Token limit exceeded for this model'));

      const provider = new GeminiProvider('test-key', { retryCount: 1 });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('AI_CONTEXT_TOO_LARGE');
    });

    it('maps unknown error', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('Something weird happened'));

      const provider = new GeminiProvider('test-key', { retryCount: 1 });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('AI_PROVIDER_ERROR');
      expect(chunks[0].error).toContain('Something weird happened');
    });
  });

  // ============================================
  // stream - retry
  // ============================================

  describe('stream - retry', () => {
    it('retries on rate limit error (429)', async () => {
      // First call fails with 429, second succeeds
      mockGenerateContentStream
        .mockRejectedValueOnce(new Error('429 Resource Exhausted'))
        .mockResolvedValueOnce(mockAsyncGen(['Success']));

      const provider = new GeminiProvider('test-key', {
        retryCount: 3,
        retryDelayMs: 10, // Fast for tests
      });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks).toEqual([{ type: 'content', content: 'Success' }, { type: 'done' }]);
      expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
    });

    it('retries on network error', async () => {
      mockGenerateContentStream
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(mockAsyncGen(['OK']));

      const provider = new GeminiProvider('test-key', {
        retryCount: 2,
        retryDelayMs: 10,
      });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks).toEqual([{ type: 'content', content: 'OK' }, { type: 'done' }]);
    });

    it('gives up after max retries on retriable error', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('429 Rate limit'));

      const provider = new GeminiProvider('test-key', {
        retryCount: 2,
        retryDelayMs: 10,
      });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks[0].type).toBe('error');
      expect(chunks[0].error).toContain('AI_RATE_LIMITED');
      expect(mockGenerateContentStream).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-retriable errors (auth)', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('401 Unauthorized'));

      const provider = new GeminiProvider('test-key', {
        retryCount: 3,
        retryDelayMs: 10,
      });
      const chunks = await collectChunks(provider.stream('prompt'));

      expect(chunks[0].type).toBe('error');
      expect(mockGenerateContentStream).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // countTokens
  // ============================================

  describe('countTokens', () => {
    it('delegates to tokenCounter', () => {
      const provider = new GeminiProvider('test-key');
      const count = provider.countTokens('Hello world');
      expect(count).toBeGreaterThan(0);
    });

    it('counts Chinese text', () => {
      const provider = new GeminiProvider('test-key');
      const count = provider.countTokens('你好世界');
      expect(count).toBe(6); // 4 chars × 1.5
    });
  });
});
