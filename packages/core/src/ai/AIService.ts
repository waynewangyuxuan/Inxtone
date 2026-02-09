/**
 * AIService - AI generation with provider abstraction
 *
 * Orchestrates GeminiProvider, ContextBuilder, and PromptAssembler
 * to implement the IAIService interface.
 *
 * Responsible for:
 * - Building context for chapters (FK-based 5-layer assembly)
 * - Assembling prompts from templates
 * - Streaming AI generation responses
 * - Emitting events for generation lifecycle
 *
 * @see Meta/Modules/03_ai_service.md
 */

import { randomUUID } from 'node:crypto';
import type {
  IAIService,
  IEventBus,
  AIProvider,
  AIGenerationOptions,
  ContextItem,
  BuiltContext,
  AIStreamChunk,
} from '../types/services.js';
import type { ChapterId, CharacterId, LocationId } from '../types/entities.js';
import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import { GeminiProvider, type GeminiProviderOptions } from './GeminiProvider.js';
import { ContextBuilder } from './ContextBuilder.js';
import { PromptAssembler } from './PromptAssembler.js';
import { countTokens } from './tokenCounter.js';

/**
 * Dependencies for AIService.
 * Uses dependency injection for testability.
 */
export interface AIServiceDeps {
  writingRepo: WritingRepository;
  characterRepo: CharacterRepository;
  locationRepo: LocationRepository;
  arcRepo: ArcRepository;
  relationshipRepo: RelationshipRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
  worldRepo: WorldRepository;
  eventBus: IEventBus;
}

export interface AIServiceOptions {
  geminiApiKey?: string | undefined;
  geminiOptions?: GeminiProviderOptions | undefined;
}

export class AIService implements IAIService {
  private provider: GeminiProvider;
  private contextBuilder: ContextBuilder;
  private promptAssembler: PromptAssembler;

  constructor(
    private deps: AIServiceDeps,
    options?: AIServiceOptions
  ) {
    this.provider = new GeminiProvider(options?.geminiApiKey, options?.geminiOptions);
    this.contextBuilder = new ContextBuilder({
      writingRepo: deps.writingRepo,
      characterRepo: deps.characterRepo,
      locationRepo: deps.locationRepo,
      arcRepo: deps.arcRepo,
      relationshipRepo: deps.relationshipRepo,
      foreshadowingRepo: deps.foreshadowingRepo,
      hookRepo: deps.hookRepo,
      worldRepo: deps.worldRepo,
    });
    this.promptAssembler = new PromptAssembler();
  }

  // ===================================
  // Generation Methods
  // ===================================

  /**
   * Continue writing from the current point in a chapter.
   */
  continueScene(
    chapterId: ChapterId,
    options?: AIGenerationOptions,
    userInstruction?: string
  ): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();
    const generationType = 'continue' as const;

    return this.generateWithContext(
      taskId,
      generationType,
      chapterId,
      options,
      (context, chapter) => {
        // Filter out chapter_content — it's passed separately as current_content (#20)
        const contextWithoutCurrent = context.items.filter((i) => i.type !== 'chapter_content');
        const formattedContext = this.contextBuilder.formatContext(contextWithoutCurrent);
        return this.promptAssembler.assemble('continue', {
          context: formattedContext,
          current_content: chapter.content ?? '',
          user_instruction: userInstruction ?? '',
        });
      }
    );
  }

  /**
   * Generate dialogue for specific characters.
   */
  generateDialogue(
    characterIds: CharacterId[],
    context: string,
    options?: AIGenerationOptions,
    userInstruction?: string
  ): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();

    // Fetch full character profiles (#21)
    const characters = characterIds
      .map((id) => this.deps.characterRepo.findById(id))
      .filter((c) => c !== null);

    if (characters.length === 0) {
      return this.yieldError('No valid characters found for dialogue generation.');
    }

    // Build rich context: full profiles + scoped relationships
    const charContext = characters.map((c) => this.contextBuilder.formatCharacter(c)).join('\n\n');

    const relationships = this.contextBuilder.getScopedRelationships(characterIds);
    const relContext = relationships
      .map((r) => {
        const source = characters.find((c) => c.id === r.sourceId);
        const target = characters.find((c) => c.id === r.targetId);
        const parts = [`${source?.name ?? r.sourceId} → ${target?.name ?? r.targetId}: ${r.type}`];
        if (r.joinReason) parts.push(`  结缘原因: ${r.joinReason}`);
        if (r.independentGoal) parts.push(`  独立目标: ${r.independentGoal}`);
        return `[关系] ${parts.join('\n')}`;
      })
      .join('\n');

    const fullContext = relContext ? `${charContext}\n\n${relContext}` : charContext;
    const characterNames = characters.map((c) => `${c.name} (${c.role})`).join('\n');

    const prompt = this.promptAssembler.assemble('dialogue', {
      context: fullContext,
      characters: characterNames,
      scene_description: context,
      user_instruction: userInstruction ?? '',
    });

    return this.streamWithEvents(taskId, 'dialogue', prompt, options);
  }

  /**
   * Generate a scene description.
   */
  describeScene(
    locationId: LocationId,
    mood: string,
    options?: AIGenerationOptions,
    userInstruction?: string
  ): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();
    const location = this.deps.locationRepo.findById(locationId);

    if (!location) {
      return this.yieldError(`Location ${locationId} not found.`);
    }

    const locDescription = [
      location.name,
      location.type,
      location.atmosphere,
      location.significance,
    ]
      .filter(Boolean)
      .join('\n');

    // Build world context for scene description (#23)
    const contextParts: string[] = [];
    const world = this.deps.worldRepo.get();
    if (world?.powerSystem?.name) {
      contextParts.push(`力量体系: ${world.powerSystem.name}`);
    }
    if (world?.socialRules && Object.keys(world.socialRules).length > 0) {
      contextParts.push(
        '社会规则: ' +
          Object.entries(world.socialRules)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
      );
    }

    const prompt = this.promptAssembler.assemble('describe', {
      context: contextParts.join('\n'),
      location: locDescription,
      mood,
      user_instruction: userInstruction ?? '',
    });

    return this.streamWithEvents(taskId, 'describe', prompt, options);
  }

  /**
   * Brainstorm ideas for a given topic.
   */
  brainstorm(
    topic: string,
    options?: AIGenerationOptions,
    userInstruction?: string
  ): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();

    // Build lightweight story context (#23)
    const contextParts: string[] = [];

    const characters = this.deps.characterRepo.findAll();
    if (characters.length > 0) {
      contextParts.push('角色: ' + characters.map((c) => `${c.name}(${c.role})`).join(', '));
    }

    const arcs = this.deps.arcRepo.findAll();
    if (arcs.length > 0) {
      contextParts.push('故事弧: ' + arcs.map((a) => `${a.name}(${a.status})`).join(', '));
    }

    const activeForeshadowing = this.deps.foreshadowingRepo.findActive();
    if (activeForeshadowing.length > 0) {
      contextParts.push('活跃伏笔: ' + activeForeshadowing.map((f) => f.content).join('; '));
    }

    const prompt = this.promptAssembler.assemble('brainstorm', {
      context: contextParts.join('\n'),
      topic,
      user_instruction: userInstruction ?? '',
    });

    return this.streamWithEvents(taskId, 'brainstorm', prompt, options);
  }

  /**
   * Ask a question about the story bible.
   */
  askStoryBible(question: string, options?: AIGenerationOptions): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();

    // Build comprehensive Story Bible context (#23)
    const contextParts: string[] = [];

    // Characters summary
    const characters = this.deps.characterRepo.findAll();
    if (characters.length > 0) {
      contextParts.push(
        '## 角色\n' +
          characters
            .map((c) => {
              const parts = [`- ${c.name} (${c.role})`];
              if (c.motivation?.surface) parts.push(`  动机: ${c.motivation.surface}`);
              if (c.facets?.public) parts.push(`  性格: ${c.facets.public}`);
              return parts.join('\n');
            })
            .join('\n')
      );
    }

    // Relationships
    const relationships = this.deps.relationshipRepo.findAll();
    if (relationships.length > 0) {
      const charMap = new Map(characters.map((c) => [c.id, c.name]));
      contextParts.push(
        '## 关系\n' +
          relationships
            .map((r) => {
              const src = charMap.get(r.sourceId) ?? r.sourceId;
              const tgt = charMap.get(r.targetId) ?? r.targetId;
              return `- ${src} → ${tgt}: ${r.type}`;
            })
            .join('\n')
      );
    }

    // Arcs
    const arcs = this.deps.arcRepo.findAll();
    if (arcs.length > 0) {
      contextParts.push(
        '## 故事弧\n' + arcs.map((a) => `- ${a.name} (${a.type}, ${a.status})`).join('\n')
      );
    }

    // Locations
    const locations = this.deps.locationRepo.findAll();
    if (locations.length > 0) {
      contextParts.push(
        '## 地点\n' + locations.map((l) => `- ${l.name}${l.type ? ` (${l.type})` : ''}`).join('\n')
      );
    }

    // Foreshadowing
    const foreshadowing = this.deps.foreshadowingRepo.findAll();
    if (foreshadowing.length > 0) {
      contextParts.push(
        '## 伏笔\n' + foreshadowing.map((f) => `- ${f.content} (${f.status})`).join('\n')
      );
    }

    // World rules (existing logic)
    const world = this.deps.worldRepo.get();
    if (world?.powerSystem) {
      const rulesParts = [`## 力量体系: ${world.powerSystem.name}`];
      if (world.powerSystem.coreRules?.length) {
        rulesParts.push(`核心规则: ${world.powerSystem.coreRules.join(', ')}`);
      }
      contextParts.push(rulesParts.join('\n'));
    }
    if (world?.socialRules && Object.keys(world.socialRules).length > 0) {
      contextParts.push(
        '## 社会规则\n' +
          Object.entries(world.socialRules)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')
      );
    }

    const prompt = this.promptAssembler.assemble('ask_bible', {
      context: contextParts.join('\n\n'),
      question,
    });

    return this.streamWithEvents(taskId, 'ask', prompt, options);
  }

  /**
   * Generic completion with custom prompt.
   */
  complete(
    prompt: string,
    context?: ContextItem[],
    options?: AIGenerationOptions
  ): AsyncIterable<AIStreamChunk> {
    const taskId = randomUUID();
    let finalPrompt = prompt;

    if (context?.length) {
      const formatted = this.contextBuilder.formatContext(context);
      finalPrompt = `${formatted}\n\n${prompt}`;
    }

    return this.streamWithEvents(taskId, 'complete', finalPrompt, options);
  }

  // ===================================
  // Context Building
  // ===================================

  /**
   * Build context for a chapter.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async buildContext(chapterId: ChapterId, additionalItems?: ContextItem[]): Promise<BuiltContext> {
    return this.contextBuilder.build(chapterId, additionalItems);
  }

  /**
   * Search for relevant context items.
   * Stub: returns empty array (semantic search deferred to M4).
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async searchRelevantContext(_query: string, _maxItems?: number): Promise<ContextItem[]> {
    return [];
  }

  // ===================================
  // Provider Management
  // ===================================

  /**
   * Get all available AI providers.
   * Currently only Gemini is supported; more providers planned for M4+.
   */
  getAvailableProviders(): AIProvider[] {
    return ['gemini'];
  }

  /**
   * Check if a provider has been configured with valid credentials.
   *
   * @param provider - The provider to check
   * @returns true if the provider's API key is set
   */
  isProviderConfigured(provider: AIProvider): boolean {
    if (provider === 'gemini') {
      return this.provider.isConfigured();
    }
    return false;
  }

  /**
   * Set the default provider for generation requests.
   * No-op in M3 — multi-provider routing is planned for M4+.
   *
   * @param _provider - The provider to set as default
   */
  setDefaultProvider(_provider: AIProvider): void {
    // No-op until multi-provider routing is added (M4+)
  }

  /**
   * Estimate token count for the given text.
   * Uses heuristic estimation (CJK×1.5, English words×1.3).
   *
   * @param text - Text to count tokens for
   * @param _provider - Ignored in M3 (provider-specific tokenizers planned for M4+)
   * @returns Estimated token count
   */
  countTokens(text: string, _provider?: AIProvider): number {
    return countTokens(text);
  }

  // ===================================
  // Private Helpers
  // ===================================

  /**
   * Generate content with context building for a chapter.
   * Handles the full flow: build context → assemble prompt → stream.
   */
  private generateWithContext(
    taskId: string,
    generationType: 'continue' | 'dialogue' | 'describe' | 'brainstorm' | 'ask' | 'complete',
    chapterId: ChapterId,
    options: AIGenerationOptions | undefined,
    buildPrompt: (context: BuiltContext, chapter: { content?: string }) => string
  ): AsyncIterable<AIStreamChunk> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed for async iterator closure
    const self = this;

    return {
      [Symbol.asyncIterator](): AsyncIterator<AIStreamChunk> {
        let started = false;
        let innerIterator: AsyncIterator<AIStreamChunk> | null = null;

        return {
          async next(): Promise<IteratorResult<AIStreamChunk>> {
            if (!started) {
              started = true;

              try {
                // Build context
                const chapter = self.deps.writingRepo.findChapterWithContent(chapterId);
                if (!chapter) {
                  return {
                    done: false,
                    value: { type: 'error', error: `Chapter ${chapterId} not found.` },
                  };
                }

                // Create ai_backup version before generation (#22)
                if (chapter.content) {
                  self.deps.writingRepo.createVersion({
                    entityType: 'chapter',
                    entityId: String(chapterId),
                    content: { content: chapter.content, wordCount: chapter.wordCount },
                    changeSummary: 'AI generation backup',
                    source: 'ai_backup',
                  });
                }

                const context = self.contextBuilder.build(chapterId);

                const startTime = Date.now();

                // Emit events
                self.deps.eventBus.emit({
                  type: 'AI_GENERATION_STARTED',
                  taskId,
                  generationType,
                });
                self.deps.eventBus.emit({
                  type: 'AI_CONTEXT_BUILT',
                  taskId,
                  tokensUsed: context.totalTokens,
                  itemCount: context.items.length,
                  truncated: context.truncated,
                });

                // Build and stream prompt
                const prompt = buildPrompt(context, chapter);
                const inputTokens = countTokens(prompt);
                const stream = self.provider.stream(prompt, options);
                innerIterator = self.wrapStreamWithEvents(
                  taskId,
                  stream[Symbol.asyncIterator](),
                  inputTokens,
                  startTime
                );
              } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                self.deps.eventBus.emit({
                  type: 'AI_GENERATION_ERROR',
                  taskId,
                  error: errorMsg,
                  retriable: false,
                });
                return { done: false, value: { type: 'error', error: errorMsg } };
              }
            }

            if (innerIterator) {
              return innerIterator.next();
            }

            return { done: true, value: undefined };
          },
        };
      },
    };
  }

  /**
   * Stream with lifecycle events (no context building).
   */
  private streamWithEvents(
    taskId: string,
    generationType: 'continue' | 'dialogue' | 'describe' | 'brainstorm' | 'ask' | 'complete',
    prompt: string,
    options: AIGenerationOptions | undefined
  ): AsyncIterable<AIStreamChunk> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed for async iterator closure
    const self = this;

    return {
      [Symbol.asyncIterator](): AsyncIterator<AIStreamChunk> {
        let started = false;
        let innerIterator: AsyncIterator<AIStreamChunk> | null = null;

        return {
          async next(): Promise<IteratorResult<AIStreamChunk>> {
            if (!started) {
              started = true;
              const startTime = Date.now();

              self.deps.eventBus.emit({
                type: 'AI_GENERATION_STARTED',
                taskId,
                generationType,
              });

              const inputTokens = countTokens(prompt);
              const stream = self.provider.stream(prompt, options);
              innerIterator = self.wrapStreamWithEvents(
                taskId,
                stream[Symbol.asyncIterator](),
                inputTokens,
                startTime
              );
            }

            if (innerIterator) {
              return innerIterator.next();
            }

            return { done: true, value: undefined };
          },
        };
      },
    };
  }

  /**
   * Wrap a stream iterator to emit progress/completion/error events.
   * Tracks input/output token counts and latency for monitoring metrics
   * (ai.token.input, ai.token.output, ai.request.latency).
   *
   * @param taskId - Unique task identifier
   * @param inner - The underlying stream iterator
   * @param inputTokens - Number of tokens in the prompt (for ai.token.input metric)
   * @param startTime - Timestamp when generation started (for ai.request.latency metric)
   */
  private wrapStreamWithEvents(
    taskId: string,
    inner: AsyncIterator<AIStreamChunk>,
    inputTokens: number,
    startTime: number
  ): AsyncIterator<AIStreamChunk> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed for async iterator closure
    const self = this;
    let accumulatedContent = '';
    let tokensGenerated = 0;

    return {
      async next(): Promise<IteratorResult<AIStreamChunk>> {
        const result = await inner.next();
        if (result.done) {
          return result;
        }

        const chunk = result.value;

        if (chunk.type === 'content' && chunk.content) {
          accumulatedContent += chunk.content;
          tokensGenerated += countTokens(chunk.content);

          self.deps.eventBus.emit({
            type: 'AI_GENERATION_PROGRESS',
            taskId,
            chunk: chunk.content,
            tokensGenerated,
          });
        } else if (chunk.type === 'done') {
          // Prefer provider-reported token counts when available; fall back to estimates
          const finalInput = chunk.usage?.promptTokens ?? inputTokens;
          const finalOutput = chunk.usage?.completionTokens ?? tokensGenerated;

          self.deps.eventBus.emit({
            type: 'AI_GENERATION_COMPLETED',
            taskId,
            result: accumulatedContent,
            tokensUsed: { input: finalInput, output: finalOutput },
            latencyMs: Date.now() - startTime,
          });
        } else if (chunk.type === 'error') {
          self.deps.eventBus.emit({
            type: 'AI_GENERATION_ERROR',
            taskId,
            error: chunk.error ?? 'Unknown error',
            retriable: chunk.error?.includes('RATE_LIMITED') ?? false,
          });
        }

        return result;
      },
    };
  }

  /**
   * Helper: yield a single error chunk as an async iterable.
   */
  private yieldError(message: string): AsyncIterable<AIStreamChunk> {
    return {
      [Symbol.asyncIterator]() {
        let yielded = false;
        return {
          next(): Promise<IteratorResult<AIStreamChunk>> {
            if (!yielded) {
              yielded = true;
              return Promise.resolve({
                done: false,
                value: { type: 'error' as const, error: message },
              });
            }
            return Promise.resolve({ done: true as const, value: undefined });
          },
        };
      },
    };
  }
}
