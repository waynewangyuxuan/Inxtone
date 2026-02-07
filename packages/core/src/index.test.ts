import { describe, it, expect } from 'vitest';
import { VERSION } from './index.js';

// Import types to verify they compile correctly
import type {
  // Entities
  Character,
  Chapter,
  Volume,
  Arc,
  Foreshadowing,
  World,
  Location,
  Faction,
  Relationship,
  Hook,
  WritingGoal,
  WritingSession,
  Version,
  CheckResult,
  Project,

  // Services
  IStoryBibleService,
  IWritingService,
  IAIService,
  IQualityService,
  ISearchService,
  IExportService,
  IConfigService,
  IEventBus,
  IDatabaseManager,

  // API
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  GetCharactersResponse,
  CreateCharacterRequest,

  // Events
  AppEvent,
  EventType,
  ChapterSavedEvent,
  CharacterCreatedEvent,
} from './index.js';

describe('core', () => {
  it('should export VERSION', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('should export entity types', () => {
    // Type-level tests - if these compile, the types are exported correctly
    const character: Partial<Character> = { name: 'Test', role: 'main' };
    const chapter: Partial<Chapter> = { id: 1, status: 'draft', wordCount: 0 };
    const arc: Partial<Arc> = {
      id: 'ARC001',
      name: 'Test Arc',
      type: 'main',
      status: 'planned',
      progress: 0,
    };

    expect(character.name).toBe('Test');
    expect(chapter.id).toBe(1);
    expect(arc.name).toBe('Test Arc');
  });

  it('should export event type utilities', () => {
    // Verify event type union works
    const eventTypes: EventType[] = ['CHAPTER_SAVED', 'CHARACTER_CREATED'];
    expect(eventTypes).toContain('CHAPTER_SAVED');
  });

  it('should export API response types', () => {
    // Verify API types work
    const successResponse: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: '123' },
    };
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Not found' },
    };

    expect(successResponse.success).toBe(true);
    expect(errorResponse.success).toBe(false);
  });
});
