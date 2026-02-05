/**
 * Type Export Tests
 *
 * These tests verify that all types are properly exported and usable.
 * If these compile, the type exports are correct.
 */

import { describe, it, expect } from 'vitest';

// Import all entity types
import type {
  // Base types
  ISODateTime,
  CharacterId,
  LocationId,
  FactionId,
  ArcId,
  ForeshadowingId,
  HookId,
  ChapterId,
  VolumeId,
  Timestamps,

  // Project
  Project,
  ProjectConfig,

  // Characters
  Character,
  CharacterRole,
  CharacterMotivation,
  CharacterFacets,
  CharacterArc,
  ConflictType,
  CharacterTemplate,
  ArcType,

  // Relationships
  Relationship,
  RelationshipType,

  // World
  World,
  PowerSystem,
  Location,
  Faction,
  TimelineEvent,

  // Plot
  Arc,
  ArcStatus,
  ArcSection,
  Foreshadowing,
  ForeshadowingStatus,
  ForeshadowingTerm,
  ForeshadowingHint,
  Hook,
  HookType,
  HookStyle,

  // Chapters
  Volume,
  VolumeStatus,
  Chapter,
  ChapterStatus,
  ChapterOutline,
  EmotionCurve,
  TensionLevel,

  // Writing
  WritingGoal,
  GoalType,
  GoalStatus,
  WritingSession,

  // Versions
  Version,
  EntityType,

  // Quality
  CheckResult,
  CheckType,
  CheckStatus,
  Violation,
  Severity,

  // Embeddings
  Embedding,

  // Config
  ConfigEntry,
} from '../../index.js';

// Import service interfaces
import type {
  // Common
  PaginationOptions,
  PaginatedResult,
  SortOptions,
  FilterCondition,
  Result,

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
  IRepository,
  IRuleEngine,
  IFileWatcher,

  // Service-specific types
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateRelationshipInput,
  CharacterWithRelations,
  CreateChapterInput,
  SaveContentInput,
  VersionDiff,
  WritingStats,
  AIProvider,
  AIGenerationOptions,
  ContextItem,
  BuiltContext,
  AIGenerationResult,
  AIStreamChunk,
  Issue,
  WaynePrincipleResult,
  PacingAnalysis,
  SearchResultItem,
  SearchOptions,
  ExportFormat,
  ExportRange,
  ExportOptions,
  ExportProgress,
  ConfigKey,
  EventHandler,
  Unsubscribe,

  // RuleEngine types
  RuleSeverity,
  RuleCheckType,
  RuleDefinition,
  RuleCheckResult,
  RulePreset,

  // FileWatcher types
  SyncDirection,
  ConflictStrategy,
  FileSyncStatus,
  SyncConflict,
} from '../../index.js';

// Import event types
import type {
  EventMeta,
  AppEvent,
  EventType,
  EventByType,
  EmitEvent,
  ChapterCreatedEvent,
  ChapterSavedEvent,
  CharacterCreatedEvent,
  CharacterUpdatedEvent,
  AIGenerationStartedEvent,
  CheckCompletedEvent,
} from '../../index.js';

// Import API types
import type {
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  GetCharactersResponse,
  CreateCharacterRequest,
  CreateCharacterResponse,
  GetChapterResponse,
  SaveChapterContentRequest,
} from '../../index.js';

describe('Type Exports', () => {
  describe('Entity Types', () => {
    it('should export Character type with all required fields', () => {
      const character: Character = {
        id: 'C001',
        name: 'Test Character',
        role: 'main',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(character.id).toBe('C001');
      expect(character.name).toBe('Test Character');
      expect(character.role).toBe('main');
    });

    it('should export Chapter type with all required fields', () => {
      const chapter: Chapter = {
        id: 1,
        status: 'draft',
        wordCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(chapter.id).toBe(1);
      expect(chapter.status).toBe('draft');
    });

    it('should export Arc type with all required fields', () => {
      const arc: Arc = {
        id: 'ARC001',
        name: 'Main Arc',
        type: 'main',
        status: 'planned',
        progress: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(arc.id).toBe('ARC001');
      expect(arc.type).toBe('main');
    });

    it('should export Foreshadowing type', () => {
      const foreshadowing: Foreshadowing = {
        id: 'FS001',
        content: 'A hint about the future',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(foreshadowing.status).toBe('active');
    });

    it('should export Volume type', () => {
      const volume: Volume = {
        id: 1,
        status: 'planned',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(volume.id).toBe(1);
    });

    it('should export CheckResult type', () => {
      const result: CheckResult = {
        id: 1,
        checkType: 'consistency',
        status: 'pass',
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(result.status).toBe('pass');
    });

    it('should export Embedding type', () => {
      const embedding: Embedding = {
        id: 1,
        entityType: 'character',
        entityId: 'C001',
        chunkIndex: 0,
        content: 'Test content',
        embedding: new ArrayBuffer(1536 * 4),
        createdAt: '2024-01-01T00:00:00Z',
      };

      expect(embedding.entityType).toBe('character');
    });
  });

  describe('Service Types', () => {
    it('should export Result type for error handling', () => {
      const success: Result<string> = { success: true, data: 'test' };
      const failure: Result<string> = { success: false, error: new Error('fail') };

      expect(success.success).toBe(true);
      expect(failure.success).toBe(false);
    });

    it('should export AI-related types', () => {
      const options: AIGenerationOptions = {
        provider: 'claude',
        temperature: 0.7,
      };

      const chunk: AIStreamChunk = {
        type: 'content',
        content: 'Generated text',
      };

      expect(options.provider).toBe('claude');
      expect(chunk.type).toBe('content');
    });

    it('should export Search types', () => {
      const item: SearchResultItem = {
        entityType: 'character',
        entityId: 'C001',
        title: 'Test',
        highlight: 'matched text',
        score: 0.95,
      };

      expect(item.score).toBe(0.95);
    });

    it('should export Export types', () => {
      const options: ExportOptions = {
        format: 'md',
        range: { type: 'all' },
        outputPath: '/output',
      };

      expect(options.format).toBe('md');
    });

    it('should export RuleEngine types', () => {
      const rule: RuleDefinition = {
        id: 'test_rule',
        name: 'Test Rule',
        category: 'test',
        severity: 'warning',
        enabled: true,
        priority: 100,
        check: { type: 'regex', pattern: '.*' },
      };

      expect(rule.check.type).toBe('regex');
    });

    it('should export FileWatcher types', () => {
      const status: FileSyncStatus = {
        path: '/test.md',
        entityType: 'character',
        entityId: 'C001',
        lastSynced: '2024-01-01T00:00:00Z',
        contentHash: 'abc123',
        syncSource: 'db',
      };

      expect(status.syncSource).toBe('db');
    });
  });

  describe('Event Types', () => {
    it('should export event types with proper structure', () => {
      // Type-level test: verify EventByType extracts correctly
      type ChapterSaved = EventByType<'CHAPTER_SAVED'>;

      const event: ChapterSavedEvent = {
        type: 'CHAPTER_SAVED',
        chapterId: 1,
        wordDelta: 100,
        newWordCount: 1000,
        _id: 'evt_123',
        _timestamp: Date.now(),
      };

      expect(event.type).toBe('CHAPTER_SAVED');
    });

    it('should export EmitEvent helper type', () => {
      // EmitEvent removes metadata fields
      const eventData: EmitEvent<CharacterCreatedEvent> = {
        type: 'CHARACTER_CREATED',
        character: {
          id: 'C001',
          name: 'Test',
          role: 'main',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };

      expect(eventData.type).toBe('CHARACTER_CREATED');
    });
  });

  describe('API Types', () => {
    it('should export ApiResponse wrapper', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
      };

      expect(response.success).toBe(true);
    });

    it('should export ApiErrorResponse', () => {
      const error: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };

      expect(error.success).toBe(false);
      expect(error.error.code).toBe('NOT_FOUND');
    });

    it('should export request/response types', () => {
      const request: CreateCharacterRequest = {
        name: 'New Character',
        role: 'supporting',
      };

      expect(request.name).toBe('New Character');
    });
  });
});
