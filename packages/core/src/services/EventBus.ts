/**
 * EventBus - Pub/sub event system for Inxtone
 *
 * Provides type-safe event emission and subscription.
 * Supports both synchronous and asynchronous event handling.
 */

import { randomUUID } from 'crypto';
import type { IEventBus, EventHandler, Unsubscribe } from '../types/services.js';
import type { EventMeta } from '../types/events.js';

/**
 * EventBus implementation with support for typed events.
 *
 * @example
 * ```typescript
 * const eventBus = new EventBus();
 *
 * // Subscribe to specific event
 * const unsubscribe = eventBus.on('CHARACTER_CREATED', (event) => {
 *   console.log('Character created:', event.character.name);
 * });
 *
 * // Subscribe to all events
 * eventBus.onAny((event) => {
 *   console.log('Event:', event.type);
 * });
 *
 * // Emit event
 * eventBus.emit({ type: 'CHARACTER_CREATED', character });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class EventBus implements IEventBus {
  /** Map of event type -> handlers */
  private handlers = new Map<string, Set<EventHandler>>();

  /** Handlers that receive all events */
  private anyHandlers = new Set<EventHandler>();

  /**
   * Subscribe to a specific event type.
   *
   * @param eventType - The event type to subscribe to
   * @param handler - The handler function
   * @returns Unsubscribe function
   */
  on<T>(eventType: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to all events.
   *
   * @param handler - The handler function that receives all events
   * @returns Unsubscribe function
   */
  onAny(handler: EventHandler): Unsubscribe {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  /**
   * Unsubscribe from a specific event type.
   *
   * @param eventType - The event type to unsubscribe from
   * @param handler - The handler function to remove
   */
  off<T>(eventType: string, handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler as EventHandler);
  }

  /**
   * Emit an event synchronously.
   * All handlers are called immediately, but async handlers may complete later.
   *
   * @param event - The event to emit (must have a `type` property)
   */
  emit<T extends { type: string }>(event: T): void {
    const eventWithMeta = this.addMeta(event);

    // Type-specific handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          void handler(eventWithMeta);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    // Universal handlers
    for (const handler of this.anyHandlers) {
      try {
        void handler(eventWithMeta);
      } catch (error) {
        console.error(`Error in universal event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Emit an event and wait for all handlers to complete.
   * Useful when you need to ensure all handlers have finished processing.
   *
   * @param event - The event to emit (must have a `type` property)
   */
  async emitAsync<T extends { type: string }>(event: T): Promise<void> {
    const eventWithMeta = this.addMeta(event);
    const promises: Promise<void>[] = [];

    // Type-specific handlers
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(eventWithMeta);
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    // Universal handlers
    for (const handler of this.anyHandlers) {
      try {
        const result = handler(eventWithMeta);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`Error in universal event handler for ${event.type}:`, error);
      }
    }

    await Promise.all(promises);
  }

  /**
   * Add metadata to an event.
   */
  private addMeta<T extends { type: string }>(event: T): T & EventMeta {
    return {
      ...event,
      _id: randomUUID(),
      _timestamp: Date.now(),
    };
  }

  /**
   * Get the number of handlers for a specific event type.
   * Useful for debugging and testing.
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  /**
   * Get the number of universal handlers.
   * Useful for debugging and testing.
   */
  getAnyHandlerCount(): number {
    return this.anyHandlers.size;
  }

  /**
   * Remove all handlers for a specific event type.
   * Useful for testing cleanup.
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
      this.anyHandlers.clear();
    }
  }
}
