/**
 * Mock Factory
 *
 * Factory functions for creating test data.
 * To be expanded in Phase 2 with entity types.
 */

// Placeholder - will be expanded when entity types are defined
export function createMockId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
