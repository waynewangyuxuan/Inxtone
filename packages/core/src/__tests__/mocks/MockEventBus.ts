/**
 * Mock EventBus
 *
 * In-memory implementation for testing and parallel development.
 * Conforms to IEventBus interface.
 */

import type { IEventBus, EventHandler, Unsubscribe } from '../../types/services.js';
import type { AppEvent, EventType, EventByType } from '../../types/events.js';

export class MockEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<EventHandler> = new Set();
  private eventHistory: Array<{ type: string } & Record<string, unknown>> = [];
  private eventIdCounter = 1;

  on<T>(eventType: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  onAny(handler: EventHandler): Unsubscribe {
    this.wildcardHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  off<T>(eventType: string, handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler as EventHandler);
  }

  emit<T>(event: T & { type: string }): void {
    const fullEvent = {
      ...event,
      _id: `evt_${this.eventIdCounter++}`,
      _timestamp: Date.now(),
    };

    // Store in history
    this.eventHistory.push(fullEvent);

    // Notify specific handlers (sync)
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    // Notify wildcard handlers (sync)
    for (const handler of this.wildcardHandlers) {
      try {
        handler(fullEvent);
      } catch (error) {
        console.error(`Error in wildcard event handler:`, error);
      }
    }
  }

  async emitAsync<T>(event: T & { type: string }): Promise<void> {
    const fullEvent = {
      ...event,
      _id: `evt_${this.eventIdCounter++}`,
      _timestamp: Date.now(),
    };

    // Store in history
    this.eventHistory.push(fullEvent);

    // Notify specific handlers (async)
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(fullEvent);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      }
    }

    // Notify wildcard handlers (async)
    for (const handler of this.wildcardHandlers) {
      try {
        await handler(fullEvent);
      } catch (error) {
        console.error(`Error in wildcard event handler:`, error);
      }
    }
  }

  // === Test Helpers (not part of interface) ===

  /**
   * Get all emitted events
   */
  getEventHistory(): Array<{ type: string } & Record<string, unknown>> {
    return [...this.eventHistory];
  }

  /**
   * Get events of a specific type
   */
  getEventsOfType<T extends EventType>(eventType: T): EventByType<T>[] {
    return this.eventHistory.filter((e) => e.type === eventType) as EventByType<T>[];
  }

  /**
   * Get the last emitted event
   */
  getLastEvent(): ({ type: string } & Record<string, unknown>) | undefined {
    return this.eventHistory[this.eventHistory.length - 1];
  }

  /**
   * Get the last event of a specific type
   */
  getLastEventOfType<T extends EventType>(eventType: T): EventByType<T> | undefined {
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      if (this.eventHistory[i].type === eventType) {
        return this.eventHistory[i] as EventByType<T>;
      }
    }
    return undefined;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
      this.wildcardHandlers.clear();
    }
  }

  /**
   * Reset the entire bus (handlers and history)
   */
  reset(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.eventHistory = [];
    this.eventIdCounter = 1;
  }

  /**
   * Wait for an event to be emitted
   */
  waitForEvent<T extends EventType>(eventType: T, timeout = 5000): Promise<EventByType<T>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const unsubscribe = this.on(eventType, (event) => {
        clearTimeout(timer);
        unsubscribe();
        resolve(event as EventByType<T>);
      });
    });
  }
}
