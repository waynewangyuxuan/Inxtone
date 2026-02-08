/**
 * Integration Tests for EventBus
 *
 * Tests the real EventBus implementation against expected behaviors:
 * metadata injection, synchronous/async emit, error isolation,
 * subscription management, and handler counting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventBus } from '../EventBus.js';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================
  // Metadata Injection
  // ===========================================

  describe('emit() metadata injection', () => {
    it('adds _id in UUID format to emitted events', () => {
      const handler = vi.fn();
      eventBus.on('TEST_EVENT', handler);

      eventBus.emit({ type: 'TEST_EVENT', data: 'hello' });

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0];
      // UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(event._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('adds _timestamp as a number to emitted events', () => {
      const handler = vi.fn();
      eventBus.on('TEST_EVENT', handler);

      const before = Date.now();
      eventBus.emit({ type: 'TEST_EVENT' });
      const after = Date.now();

      const event = handler.mock.calls[0][0];
      expect(typeof event._timestamp).toBe('number');
      expect(event._timestamp).toBeGreaterThanOrEqual(before);
      expect(event._timestamp).toBeLessThanOrEqual(after);
    });

    it('preserves original event properties alongside metadata', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_SAVED', handler);

      eventBus.emit({ type: 'CHAPTER_SAVED', chapterId: 42, wordDelta: 150 });

      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('CHAPTER_SAVED');
      expect(event.chapterId).toBe(42);
      expect(event.wordDelta).toBe(150);
      expect(event._id).toBeDefined();
      expect(event._timestamp).toBeDefined();
    });

    it('generates unique _id for each emit call', () => {
      const ids: string[] = [];
      const handler = vi.fn((event: { _id: string }) => {
        ids.push(event._id);
      });
      eventBus.on('TEST_EVENT', handler);

      eventBus.emit({ type: 'TEST_EVENT' });
      eventBus.emit({ type: 'TEST_EVENT' });
      eventBus.emit({ type: 'TEST_EVENT' });

      expect(ids).toHaveLength(3);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  // ===========================================
  // Synchronous emit()
  // ===========================================

  describe('emit() synchronous behavior', () => {
    it('calls all handlers for the subscribed event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      eventBus.on('CHARACTER_CREATED', handler1);
      eventBus.on('CHARACTER_CREATED', handler2);
      eventBus.on('CHARACTER_CREATED', handler3);

      eventBus.emit({ type: 'CHARACTER_CREATED', name: 'Alice' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('does not call handlers subscribed to a different event type', () => {
      const chapterHandler = vi.fn();
      const characterHandler = vi.fn();
      eventBus.on('CHAPTER_CREATED', chapterHandler);
      eventBus.on('CHARACTER_CREATED', characterHandler);

      eventBus.emit({ type: 'CHAPTER_CREATED', chapter: {} });

      expect(chapterHandler).toHaveBeenCalledTimes(1);
      expect(characterHandler).not.toHaveBeenCalled();
    });

    it('catches errors in handlers and continues to the next handler', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('handler exploded');
      });
      const normalHandler = vi.fn();

      eventBus.on('TEST_EVENT', errorHandler);
      eventBus.on('TEST_EVENT', normalHandler);

      eventBus.emit({ type: 'TEST_EVENT' });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in event handler for TEST_EVENT'),
        expect.any(Error)
      );
    });

    it('does not throw when emitting an event with no subscribers', () => {
      expect(() => {
        eventBus.emit({ type: 'NOBODY_LISTENS' });
      }).not.toThrow();
    });
  });

  // ===========================================
  // Async emitAsync()
  // ===========================================

  describe('emitAsync()', () => {
    it('returns a promise', () => {
      const result = eventBus.emitAsync({ type: 'TEST_EVENT' });
      expect(result).toBeInstanceOf(Promise);
    });

    it('waits for all async handlers to complete', async () => {
      let completed1 = false;
      let completed2 = false;

      const asyncHandler1 = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        completed1 = true;
      });
      const asyncHandler2 = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        completed2 = true;
      });

      eventBus.on('ASYNC_EVENT', asyncHandler1);
      eventBus.on('ASYNC_EVENT', asyncHandler2);

      await eventBus.emitAsync({ type: 'ASYNC_EVENT' });

      expect(completed1).toBe(true);
      expect(completed2).toBe(true);
    });

    it('injects metadata on async emitted events', async () => {
      const handler = vi.fn();
      eventBus.on('ASYNC_EVENT', handler);

      await eventBus.emitAsync({ type: 'ASYNC_EVENT', payload: 'data' });

      const event = handler.mock.calls[0][0];
      expect(event._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(typeof event._timestamp).toBe('number');
      expect(event.payload).toBe('data');
    });

    it('catches errors in async handlers without rejecting', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('sync error in async emit');
      });
      const normalHandler = vi.fn();

      eventBus.on('ASYNC_EVENT', errorHandler);
      eventBus.on('ASYNC_EVENT', normalHandler);

      await expect(eventBus.emitAsync({ type: 'ASYNC_EVENT' })).resolves.toBeUndefined();

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('handles mix of sync and async handlers', async () => {
      const callOrder: string[] = [];

      const syncHandler = vi.fn(() => {
        callOrder.push('sync');
      });
      const asyncHandler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        callOrder.push('async');
      });

      eventBus.on('MIXED_EVENT', syncHandler);
      eventBus.on('MIXED_EVENT', asyncHandler);

      await eventBus.emitAsync({ type: 'MIXED_EVENT' });

      expect(callOrder).toContain('sync');
      expect(callOrder).toContain('async');
      expect(syncHandler).toHaveBeenCalledTimes(1);
      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });

    it('calls onAny handlers during async emit', async () => {
      const anyHandler = vi.fn();
      eventBus.onAny(anyHandler);

      await eventBus.emitAsync({ type: 'SOME_ASYNC_EVENT' });

      expect(anyHandler).toHaveBeenCalledTimes(1);
      expect(anyHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SOME_ASYNC_EVENT' })
      );
    });
  });

  // ===========================================
  // onAny() - Universal subscription
  // ===========================================

  describe('onAny()', () => {
    it('receives events of all types', () => {
      const anyHandler = vi.fn();
      eventBus.onAny(anyHandler);

      eventBus.emit({ type: 'EVENT_A' });
      eventBus.emit({ type: 'EVENT_B' });
      eventBus.emit({ type: 'EVENT_C' });

      expect(anyHandler).toHaveBeenCalledTimes(3);
      expect(anyHandler).toHaveBeenNthCalledWith(1, expect.objectContaining({ type: 'EVENT_A' }));
      expect(anyHandler).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: 'EVENT_B' }));
      expect(anyHandler).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: 'EVENT_C' }));
    });

    it('receives events alongside type-specific handlers', () => {
      const specificHandler = vi.fn();
      const anyHandler = vi.fn();
      eventBus.on('CHAPTER_SAVED', specificHandler);
      eventBus.onAny(anyHandler);

      eventBus.emit({ type: 'CHAPTER_SAVED', chapterId: 1 });

      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(anyHandler).toHaveBeenCalledTimes(1);
      // Both should receive the same event object (with metadata)
      expect(specificHandler.mock.calls[0][0].type).toBe('CHAPTER_SAVED');
      expect(anyHandler.mock.calls[0][0].type).toBe('CHAPTER_SAVED');
    });

    it('error in onAny handler does not prevent other universal handlers', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorAnyHandler = vi.fn(() => {
        throw new Error('universal handler error');
      });
      const normalAnyHandler = vi.fn();

      eventBus.onAny(errorAnyHandler);
      eventBus.onAny(normalAnyHandler);

      eventBus.emit({ type: 'TEST_EVENT' });

      expect(errorAnyHandler).toHaveBeenCalledTimes(1);
      expect(normalAnyHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in universal event handler for TEST_EVENT'),
        expect.any(Error)
      );
    });
  });

  // ===========================================
  // Unsubscribe via returned function
  // ===========================================

  describe('unsubscribe function from on()', () => {
    it('prevents handler from receiving future events', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('MY_EVENT', handler);

      eventBus.emit({ type: 'MY_EVENT' });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      eventBus.emit({ type: 'MY_EVENT' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not affect other handlers for the same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const unsubscribe1 = eventBus.on('MY_EVENT', handler1);
      eventBus.on('MY_EVENT', handler2);

      unsubscribe1();

      eventBus.emit({ type: 'MY_EVENT' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe function from onAny()', () => {
    it('prevents universal handler from receiving future events', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.onAny(handler);

      eventBus.emit({ type: 'EVENT_X' });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      eventBus.emit({ type: 'EVENT_Y' });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================
  // off() - Explicit unsubscription
  // ===========================================

  describe('off()', () => {
    it('removes a specific handler by reference', () => {
      const handler = vi.fn();
      eventBus.on('MY_EVENT', handler);

      eventBus.off('MY_EVENT', handler);

      eventBus.emit({ type: 'MY_EVENT' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('only removes the specified handler, leaving others intact', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('MY_EVENT', handler1);
      eventBus.on('MY_EVENT', handler2);

      eventBus.off('MY_EVENT', handler1);

      eventBus.emit({ type: 'MY_EVENT' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('does not throw when removing a handler that was never registered', () => {
      const handler = vi.fn();
      expect(() => {
        eventBus.off('NONEXISTENT_EVENT', handler);
      }).not.toThrow();
    });
  });

  // ===========================================
  // removeAllListeners()
  // ===========================================

  describe('removeAllListeners()', () => {
    it('removes all handlers for a specific event type when eventType is provided', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('TARGET_EVENT', handler1);
      eventBus.on('TARGET_EVENT', handler2);

      eventBus.removeAllListeners('TARGET_EVENT');

      eventBus.emit({ type: 'TARGET_EVENT' });
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('does not affect handlers for other event types when eventType is provided', () => {
      const targetHandler = vi.fn();
      const otherHandler = vi.fn();
      eventBus.on('TARGET_EVENT', targetHandler);
      eventBus.on('OTHER_EVENT', otherHandler);

      eventBus.removeAllListeners('TARGET_EVENT');

      eventBus.emit({ type: 'OTHER_EVENT' });
      expect(otherHandler).toHaveBeenCalledTimes(1);
    });

    it('does not remove onAny handlers when called with a specific eventType', () => {
      const anyHandler = vi.fn();
      eventBus.onAny(anyHandler);
      eventBus.on('TARGET_EVENT', vi.fn());

      eventBus.removeAllListeners('TARGET_EVENT');

      eventBus.emit({ type: 'TARGET_EVENT' });
      expect(anyHandler).toHaveBeenCalledTimes(1);
    });

    it('removes all type-specific and universal handlers when called without arguments', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const anyHandler = vi.fn();
      eventBus.on('EVENT_A', handler1);
      eventBus.on('EVENT_B', handler2);
      eventBus.onAny(anyHandler);

      eventBus.removeAllListeners();

      eventBus.emit({ type: 'EVENT_A' });
      eventBus.emit({ type: 'EVENT_B' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(anyHandler).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // getHandlerCount() and getAnyHandlerCount()
  // ===========================================

  describe('getHandlerCount()', () => {
    it('returns 0 for an event type with no handlers', () => {
      expect(eventBus.getHandlerCount('NONEXISTENT')).toBe(0);
    });

    it('returns the correct count after subscribing handlers', () => {
      eventBus.on('MY_EVENT', vi.fn());
      eventBus.on('MY_EVENT', vi.fn());
      eventBus.on('MY_EVENT', vi.fn());

      expect(eventBus.getHandlerCount('MY_EVENT')).toBe(3);
    });

    it('decrements after unsubscribing a handler', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('MY_EVENT', handler);
      eventBus.on('MY_EVENT', vi.fn());

      expect(eventBus.getHandlerCount('MY_EVENT')).toBe(2);

      unsubscribe();

      expect(eventBus.getHandlerCount('MY_EVENT')).toBe(1);
    });

    it('does not count onAny handlers', () => {
      eventBus.on('MY_EVENT', vi.fn());
      eventBus.onAny(vi.fn());

      expect(eventBus.getHandlerCount('MY_EVENT')).toBe(1);
    });
  });

  describe('getAnyHandlerCount()', () => {
    it('returns 0 when no universal handlers are registered', () => {
      expect(eventBus.getAnyHandlerCount()).toBe(0);
    });

    it('returns the correct count of universal handlers', () => {
      eventBus.onAny(vi.fn());
      eventBus.onAny(vi.fn());

      expect(eventBus.getAnyHandlerCount()).toBe(2);
    });

    it('decrements after unsubscribing a universal handler', () => {
      const unsubscribe = eventBus.onAny(vi.fn());
      eventBus.onAny(vi.fn());

      expect(eventBus.getAnyHandlerCount()).toBe(2);

      unsubscribe();

      expect(eventBus.getAnyHandlerCount()).toBe(1);
    });

    it('does not count type-specific handlers', () => {
      eventBus.on('MY_EVENT', vi.fn());
      eventBus.onAny(vi.fn());

      expect(eventBus.getAnyHandlerCount()).toBe(1);
    });
  });

  // ===========================================
  // Error isolation across handler types
  // ===========================================

  describe('error isolation', () => {
    it('error in type-specific handler does not prevent onAny handlers from running', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('specific handler error');
      });
      const anyHandler = vi.fn();

      eventBus.on('FAIL_EVENT', errorHandler);
      eventBus.onAny(anyHandler);

      eventBus.emit({ type: 'FAIL_EVENT' });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(anyHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('error in onAny handler during emitAsync does not reject the promise', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorAnyHandler = vi.fn(() => {
        throw new Error('universal async error');
      });
      const normalHandler = vi.fn();

      eventBus.onAny(errorAnyHandler);
      eventBus.on('ASYNC_FAIL', normalHandler);

      await expect(eventBus.emitAsync({ type: 'ASYNC_FAIL' })).resolves.toBeUndefined();

      expect(normalHandler).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
