/**
 * SSE Streaming Utility for AI Generation
 *
 * Uses fetch() + ReadableStream to consume POST SSE endpoints.
 * EventSource only supports GET, but our AI endpoints are POST.
 */

import type { AIStreamChunk } from '@inxtone/core';

/**
 * Stream AI generation responses from an SSE endpoint.
 *
 * @param endpoint - API endpoint path (e.g., '/ai/continue')
 * @param body - Request body
 * @param signal - AbortController signal for cancellation
 * @yields AIStreamChunk objects parsed from SSE data lines
 */
export async function* streamAI(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<AIStreamChunk> {
  const geminiKey = localStorage.getItem('gemini-api-key');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (geminiKey) headers['X-Gemini-Key'] = geminiKey;
  const init: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  };
  if (signal) init.signal = signal;
  const res = await fetch(`/api${endpoint}`, init);

  if (!res.ok) {
    const text = await res.text();
    yield { type: 'error', error: `HTTP ${res.status}: ${text}` };
    return;
  }

  if (!res.body) {
    yield { type: 'error', error: 'No response body' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE data lines: "data: {...}\n\n"
      const lines = buffer.split('\n\n');
      // Keep the last incomplete chunk in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed?.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6); // Remove "data: " prefix
        try {
          const chunk = JSON.parse(jsonStr) as AIStreamChunk;
          yield chunk;

          if (chunk.type === 'done' || chunk.type === 'error') {
            return;
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(trimmed.slice(6)) as AIStreamChunk;
          yield chunk;
        } catch {
          // Skip malformed final chunk
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
