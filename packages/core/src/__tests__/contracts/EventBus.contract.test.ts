/**
 * Contract Tests for IEventBus
 *
 * These tests verify that implementations conform to the interface contract.
 * They test return value structures and event handling behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockEventBus } from '../mocks/MockEventBus.js';
import type { IEventBus } from '../../types/services.js';

describe('IEventBus Contract', () => {
  let eventBus: IEventBus;

  beforeEach(() => {
    eventBus = new MockEventBus();
  });

  describe('Basic Event Subscription', () => {
    it('on() returns an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('CHAPTER_CREATED', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('emit() triggers subscribed handlers synchronously', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_CREATED', handler);

      eventBus.emit({
        type: 'CHAPTER_CREATED',
        chapter: {
          id: 1,
          status: 'outline',
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emit() passes event to handlers', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_SAVED', handler);

      eventBus.emit({
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 100,
        newWordCount: 500,
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHAPTER_SAVED',
          chapterId: 1,
          wordDelta: 100,
        })
      );
    });

    it('unsubscribe function removes handler', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on('CHAPTER_DELETED', handler);

      unsubscribe();

      eventBus.emit({
        type: 'CHAPTER_DELETED',
        chapterId: 1,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('multiple handlers receive same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('CHARACTER_CREATED', handler1);
      eventBus.on('CHARACTER_CREATED', handler2);

      eventBus.emit({
        type: 'CHARACTER_CREATED',
        character: {
          id: 'C001',
          name: 'Test',
          role: 'main',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('handlers only receive events of subscribed type', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_CREATED', handler);

      eventBus.emit({
        type: 'CHAPTER_DELETED',
        chapterId: 1,
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Wildcard Subscription', () => {
    it('onAny() returns an unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.onAny(handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('onAny() handler receives all events', () => {
      const handler = vi.fn();
      eventBus.onAny(handler);

      eventBus.emit({
        type: 'CHAPTER_CREATED',
        chapter: {
          id: 1,
          status: 'outline',
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      eventBus.emit({
        type: 'CHARACTER_DELETED',
        characterId: 'C001',
      });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('onAny() unsubscribe works', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.onAny(handler);

      unsubscribe();

      eventBus.emit({
        type: 'CHAPTER_DELETED',
        chapterId: 1,
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('off() Method', () => {
    it('off() removes specific handler', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_SAVED', handler);
      eventBus.off('CHAPTER_SAVED', handler);

      eventBus.emit({
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 0,
        newWordCount: 0,
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('off() only removes specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      eventBus.on('CHAPTER_SAVED', handler1);
      eventBus.on('CHAPTER_SAVED', handler2);

      eventBus.off('CHAPTER_SAVED', handler1);

      eventBus.emit({
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 0,
        newWordCount: 0,
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emitAsync() Method', () => {
    it('emitAsync() returns a promise', () => {
      const result = eventBus.emitAsync({
        type: 'CHAPTER_CREATED',
        chapter: {
          id: 1,
          status: 'outline',
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      expect(result).toBeInstanceOf(Promise);
    });

    it('emitAsync() waits for async handlers', async () => {
      let completed = false;
      const asyncHandler = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        completed = true;
      };

      eventBus.on('CHAPTER_SAVED', asyncHandler);

      await eventBus.emitAsync({
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 0,
        newWordCount: 0,
      });

      expect(completed).toBe(true);
    });

    it('emitAsync() continues if handler throws', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const successHandler = vi.fn();

      eventBus.on('CHAPTER_SAVED', errorHandler);
      eventBus.on('CHAPTER_SAVED', successHandler);

      // Should not throw
      await eventBus.emitAsync({
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 0,
        newWordCount: 0,
      });

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  describe('Event Types', () => {
    it('correctly handles Chapter events', () => {
      const handler = vi.fn();
      eventBus.on('CHAPTER_ROLLBACK', handler);

      eventBus.emit({
        type: 'CHAPTER_ROLLBACK',
        chapterId: 1,
        versionId: 5,
        previousWordCount: 1000,
        newWordCount: 800,
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHAPTER_ROLLBACK',
          versionId: 5,
        })
      );
    });

    it('correctly handles AI events', () => {
      const handler = vi.fn();
      eventBus.on('AI_GENERATION_STARTED', handler);

      eventBus.emit({
        type: 'AI_GENERATION_STARTED',
        taskId: 'task-123',
        generationType: 'continue',
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'AI_GENERATION_STARTED',
          taskId: 'task-123',
          generationType: 'continue',
        })
      );
    });

    it('correctly handles Check events', () => {
      const handler = vi.fn();
      eventBus.on('CHECK_COMPLETED', handler);

      eventBus.emit({
        type: 'CHECK_COMPLETED',
        chapterId: 1,
        result: {
          id: 1,
          checkType: 'consistency',
          status: 'pass',
          createdAt: new Date().toISOString(),
        },
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHECK_COMPLETED',
          result: expect.objectContaining({
            checkType: 'consistency',
            status: 'pass',
          }),
        })
      );
    });
  });
});
