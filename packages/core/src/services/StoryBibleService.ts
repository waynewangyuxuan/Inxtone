/**
 * StoryBibleService - Manages story bible: characters, world, plot
 *
 * This service provides business logic for all Story Bible entities,
 * including validation, event emission, and cross-entity operations.
 *
 * Methods are async to match IStoryBibleService interface (Promise return types)
 * even though underlying repositories are synchronous. This ensures consistent
 * error handling (throws become rejected promises) and future-proofs for
 * potential async repository implementations.
 */

/* eslint-disable @typescript-eslint/require-await */

import type {
  IStoryBibleService,
  IEventBus,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateRelationshipInput,
  CreateLocationInput,
  CreateFactionInput,
  CreateTimelineEventInput,
  CreateForeshadowingInput,
  CreateArcInput,
  CreateHookInput,
  CharacterWithRelations,
} from '../types/services.js';
import type {
  Character,
  CharacterId,
  CharacterRole,
  Relationship,
  World,
  PowerSystem,
  Location,
  LocationId,
  Faction,
  FactionId,
  TimelineEvent,
  Arc,
  ArcId,
  Foreshadowing,
  ForeshadowingId,
  Hook,
  HookId,
  ChapterId,
} from '../types/entities.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { FactionRepository } from '../db/repositories/FactionRepository.js';
import type { TimelineEventRepository } from '../db/repositories/TimelineEventRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';

/**
 * Dependencies for StoryBibleService.
 * Uses dependency injection for testability.
 */
export interface StoryBibleServiceDeps {
  characterRepo: CharacterRepository;
  relationshipRepo: RelationshipRepository;
  worldRepo: WorldRepository;
  locationRepo: LocationRepository;
  factionRepo: FactionRepository;
  timelineEventRepo: TimelineEventRepository;
  arcRepo: ArcRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
  eventBus: IEventBus;
}

/**
 * StoryBibleService implementation.
 *
 * @example
 * ```typescript
 * const service = new StoryBibleService({
 *   characterRepo,
 *   relationshipRepo,
 *   worldRepo,
 *   locationRepo,
 *   factionRepo,
 *   timelineEventRepo,
 *   arcRepo,
 *   foreshadowingRepo,
 *   hookRepo,
 *   eventBus,
 * });
 *
 * const character = await service.createCharacter({
 *   name: '张三',
 *   role: 'main',
 * });
 * ```
 */
export class StoryBibleService implements IStoryBibleService {
  constructor(private deps: StoryBibleServiceDeps) {}

  // ============================================
  // Characters
  // ============================================

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    // Validation
    this.validateCharacterInput(input);

    // Create
    const character = this.deps.characterRepo.create(input);

    // Emit event
    this.deps.eventBus.emit({
      type: 'CHARACTER_CREATED',
      character,
    });

    return character;
  }

  async getCharacter(id: CharacterId): Promise<Character | null> {
    return this.deps.characterRepo.findById(id);
  }

  async getCharacterWithRelations(id: CharacterId): Promise<CharacterWithRelations | null> {
    const character = this.deps.characterRepo.findById(id);
    if (!character) return null;

    const relationships = this.deps.relationshipRepo.findByCharacter(id);

    // Enrich relationships with target names
    const relationshipsWithNames = relationships.map((rel) => {
      const targetId = rel.sourceId === id ? rel.targetId : rel.sourceId;
      const target = this.deps.characterRepo.findById(targetId);
      return {
        ...rel,
        targetName: target?.name ?? 'Unknown',
      };
    });

    return {
      ...character,
      relationships: relationshipsWithNames,
    };
  }

  async getAllCharacters(): Promise<Character[]> {
    return this.deps.characterRepo.findAll();
  }

  async getCharactersByRole(role: CharacterRole): Promise<Character[]> {
    return this.deps.characterRepo.findByRole(role);
  }

  async updateCharacter(id: CharacterId, input: UpdateCharacterInput): Promise<Character> {
    const existing = this.deps.characterRepo.findById(id);
    if (!existing) {
      throw new Error(`Character ${id} not found`);
    }

    // Validate update input
    if (input.name?.trim() === '') {
      throw new Error('Character name cannot be empty');
    }

    const character = this.deps.characterRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'CHARACTER_UPDATED',
      character,
      changes: input,
    });

    return character;
  }

  async deleteCharacter(id: CharacterId): Promise<void> {
    const character = this.deps.characterRepo.findById(id);
    if (!character) {
      throw new Error(`Character ${id} not found`);
    }

    // Delete related relationships first
    this.deps.relationshipRepo.deleteByCharacter(id);

    // Delete character
    this.deps.characterRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'CHARACTER_DELETED',
      characterId: id,
    });
  }

  async searchCharacters(query: string): Promise<Character[]> {
    if (!query.trim()) {
      return [];
    }
    return this.deps.characterRepo.search(query);
  }

  private validateCharacterInput(input: CreateCharacterInput): void {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Character name is required');
    }

    if (!input.role) {
      throw new Error('Character role is required');
    }

    const validRoles: CharacterRole[] = ['main', 'supporting', 'antagonist', 'mentioned'];
    if (!validRoles.includes(input.role)) {
      throw new Error(`Invalid character role: ${input.role}`);
    }
  }

  // ============================================
  // Relationships
  // ============================================

  async createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
    // Validation
    this.validateRelationshipInput(input);

    // Create
    const relationship = this.deps.relationshipRepo.create(input);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_CREATED',
      relationship,
    });

    return relationship;
  }

  async getRelationship(id: number): Promise<Relationship | null> {
    return this.deps.relationshipRepo.findById(id);
  }

  async getRelationshipsForCharacter(characterId: CharacterId): Promise<Relationship[]> {
    return this.deps.relationshipRepo.findByCharacter(characterId);
  }

  async updateRelationship(
    id: number,
    input: Partial<CreateRelationshipInput>
  ): Promise<Relationship> {
    const existing = this.deps.relationshipRepo.findById(id);
    if (!existing) {
      throw new Error(`Relationship ${id} not found`);
    }

    const relationship = this.deps.relationshipRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_UPDATED',
      relationship,
      changes: input,
    });

    return relationship;
  }

  async deleteRelationship(id: number): Promise<void> {
    const relationship = this.deps.relationshipRepo.findById(id);
    if (!relationship) {
      throw new Error(`Relationship ${id} not found`);
    }

    this.deps.relationshipRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_DELETED',
      relationshipId: id,
    });
  }

  private validateRelationshipInput(input: CreateRelationshipInput): void {
    if (!input.sourceId || !input.targetId) {
      throw new Error('Source and target character IDs are required');
    }

    if (input.sourceId === input.targetId) {
      throw new Error('Cannot create relationship with self');
    }

    // Verify both characters exist
    const source = this.deps.characterRepo.findById(input.sourceId);
    const target = this.deps.characterRepo.findById(input.targetId);

    if (!source) {
      throw new Error(`Source character ${input.sourceId} not found`);
    }
    if (!target) {
      throw new Error(`Target character ${input.targetId} not found`);
    }

    const validTypes = ['companion', 'rival', 'enemy', 'mentor', 'confidant', 'lover'] as const;
    if (!validTypes.includes(input.type)) {
      throw new Error(`Invalid relationship type: ${input.type}`);
    }
  }

  // ============================================
  // World
  // ============================================

  async getWorld(): Promise<World | null> {
    return this.deps.worldRepo.get();
  }

  async updateWorld(input: Partial<World>): Promise<World> {
    const world = this.deps.worldRepo.upsert(input);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      world,
      changes: input,
    });

    return world;
  }

  async setPowerSystem(powerSystem: PowerSystem): Promise<void> {
    this.deps.worldRepo.setPowerSystem(powerSystem);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      changes: { powerSystem },
    });
  }

  async setSocialRules(rules: Record<string, string>): Promise<void> {
    this.deps.worldRepo.setSocialRules(rules);

    this.deps.eventBus.emit({
      type: 'WORLD_UPDATED',
      changes: { socialRules: rules },
    });
  }

  // ============================================
  // Locations
  // ============================================

  async createLocation(input: CreateLocationInput): Promise<Location> {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Location name is required');
    }

    const location = this.deps.locationRepo.create(input);

    this.deps.eventBus.emit({
      type: 'LOCATION_CREATED',
      location,
    });

    return location;
  }

  async getLocation(id: LocationId): Promise<Location | null> {
    return this.deps.locationRepo.findById(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return this.deps.locationRepo.findAll();
  }

  async updateLocation(id: LocationId, input: Partial<CreateLocationInput>): Promise<Location> {
    const existing = this.deps.locationRepo.findById(id);
    if (!existing) {
      throw new Error(`Location ${id} not found`);
    }

    if (input.name?.trim() === '') {
      throw new Error('Location name cannot be empty');
    }

    const location = this.deps.locationRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'LOCATION_UPDATED',
      location,
      changes: input,
    });

    return location;
  }

  async deleteLocation(id: LocationId): Promise<void> {
    const location = this.deps.locationRepo.findById(id);
    if (!location) {
      throw new Error(`Location ${id} not found`);
    }

    this.deps.locationRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'LOCATION_DELETED',
      locationId: id,
    });
  }

  // ============================================
  // Factions
  // ============================================

  async createFaction(input: CreateFactionInput): Promise<Faction> {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Faction name is required');
    }

    // Validate leader exists if provided
    if (input.leaderId) {
      const leader = this.deps.characterRepo.findById(input.leaderId);
      if (!leader) {
        throw new Error(`Leader character ${input.leaderId} not found`);
      }
    }

    const faction = this.deps.factionRepo.create(input);

    this.deps.eventBus.emit({
      type: 'FACTION_CREATED',
      faction,
    });

    return faction;
  }

  async getFaction(id: FactionId): Promise<Faction | null> {
    return this.deps.factionRepo.findById(id);
  }

  async getAllFactions(): Promise<Faction[]> {
    return this.deps.factionRepo.findAll();
  }

  async updateFaction(id: FactionId, input: Partial<CreateFactionInput>): Promise<Faction> {
    const existing = this.deps.factionRepo.findById(id);
    if (!existing) {
      throw new Error(`Faction ${id} not found`);
    }

    if (input.name?.trim() === '') {
      throw new Error('Faction name cannot be empty');
    }

    // Validate leader exists if provided
    if (input.leaderId) {
      const leader = this.deps.characterRepo.findById(input.leaderId);
      if (!leader) {
        throw new Error(`Leader character ${input.leaderId} not found`);
      }
    }

    const faction = this.deps.factionRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'FACTION_UPDATED',
      faction,
      changes: input,
    });

    return faction;
  }

  async deleteFaction(id: FactionId): Promise<void> {
    const faction = this.deps.factionRepo.findById(id);
    if (!faction) {
      throw new Error(`Faction ${id} not found`);
    }

    this.deps.factionRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'FACTION_DELETED',
      factionId: id,
    });
  }

  // ============================================
  // Timeline Events
  // ============================================

  async createTimelineEvent(input: CreateTimelineEventInput): Promise<TimelineEvent> {
    if (!input.description || input.description.trim() === '') {
      throw new Error('Timeline event description is required');
    }

    const event = this.deps.timelineEventRepo.create(input);

    this.deps.eventBus.emit({
      type: 'TIMELINE_EVENT_CREATED',
      event,
    });

    return event;
  }

  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return this.deps.timelineEventRepo.findAll();
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    const event = this.deps.timelineEventRepo.findById(id);
    if (!event) {
      throw new Error(`Timeline event ${id} not found`);
    }

    this.deps.timelineEventRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'TIMELINE_EVENT_DELETED',
      eventId: id,
    });
  }

  // ============================================
  // Arcs
  // ============================================

  async createArc(input: CreateArcInput): Promise<Arc> {
    if (!input.name || input.name.trim() === '') {
      throw new Error('Arc name is required');
    }

    const arc = this.deps.arcRepo.create(input);

    this.deps.eventBus.emit({
      type: 'ARC_CREATED',
      arc,
    });

    return arc;
  }

  async getArc(id: ArcId): Promise<Arc | null> {
    return this.deps.arcRepo.findById(id);
  }

  async getAllArcs(): Promise<Arc[]> {
    return this.deps.arcRepo.findAll();
  }

  async updateArc(id: ArcId, input: Partial<CreateArcInput> & { progress?: number }): Promise<Arc> {
    const existing = this.deps.arcRepo.findById(id);
    if (!existing) {
      throw new Error(`Arc ${id} not found`);
    }

    if (input.name?.trim() === '') {
      throw new Error('Arc name cannot be empty');
    }

    const arc = this.deps.arcRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'ARC_UPDATED',
      arc,
      changes: input,
    });

    return arc;
  }

  async deleteArc(id: ArcId): Promise<void> {
    const arc = this.deps.arcRepo.findById(id);
    if (!arc) {
      throw new Error(`Arc ${id} not found`);
    }

    this.deps.arcRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'ARC_DELETED',
      arcId: id,
    });
  }

  // ============================================
  // Foreshadowing
  // ============================================

  async createForeshadowing(input: CreateForeshadowingInput): Promise<Foreshadowing> {
    if (!input.content || input.content.trim() === '') {
      throw new Error('Foreshadowing content is required');
    }

    const foreshadowing = this.deps.foreshadowingRepo.create(input);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_CREATED',
      foreshadowing,
    });

    return foreshadowing;
  }

  async getForeshadowing(id: ForeshadowingId): Promise<Foreshadowing | null> {
    return this.deps.foreshadowingRepo.findById(id);
  }

  async getAllForeshadowing(): Promise<Foreshadowing[]> {
    return this.deps.foreshadowingRepo.findAll();
  }

  async getActiveForeshadowing(): Promise<Foreshadowing[]> {
    return this.deps.foreshadowingRepo.findActive();
  }

  async addForeshadowingHint(
    id: ForeshadowingId,
    chapter: ChapterId,
    text: string
  ): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.addHint(id, chapter, text);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_HINT_ADDED',
      foreshadowing,
      hintChapter: chapter,
    });

    return foreshadowing;
  }

  async resolveForeshadowing(
    id: ForeshadowingId,
    resolvedChapter: ChapterId
  ): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.resolve(id, resolvedChapter);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_RESOLVED',
      foreshadowing,
      resolvedChapter,
    });

    return foreshadowing;
  }

  async abandonForeshadowing(id: ForeshadowingId): Promise<Foreshadowing> {
    const foreshadowing = this.deps.foreshadowingRepo.abandon(id);

    this.deps.eventBus.emit({
      type: 'FORESHADOWING_ABANDONED',
      foreshadowing,
    });

    return foreshadowing;
  }

  // ============================================
  // Hooks
  // ============================================

  async createHook(input: CreateHookInput): Promise<Hook> {
    if (!input.content || input.content.trim() === '') {
      throw new Error('Hook content is required');
    }

    const validTypes = ['opening', 'arc', 'chapter'] as const;
    if (!validTypes.includes(input.type)) {
      throw new Error(`Invalid hook type: ${input.type}`);
    }

    const hook = this.deps.hookRepo.create(input);

    this.deps.eventBus.emit({
      type: 'HOOK_CREATED',
      hook,
    });

    return hook;
  }

  async getHook(id: HookId): Promise<Hook | null> {
    return this.deps.hookRepo.findById(id);
  }

  async getHooksForChapter(chapterId: ChapterId): Promise<Hook[]> {
    return this.deps.hookRepo.findByChapter(chapterId);
  }

  async updateHook(id: HookId, input: Partial<CreateHookInput>): Promise<Hook> {
    const existing = this.deps.hookRepo.findById(id);
    if (!existing) {
      throw new Error(`Hook ${id} not found`);
    }

    if (input.content?.trim() === '') {
      throw new Error('Hook content cannot be empty');
    }

    const hook = this.deps.hookRepo.update(id, input);

    this.deps.eventBus.emit({
      type: 'HOOK_UPDATED',
      hook,
      changes: input,
    });

    return hook;
  }

  async deleteHook(id: HookId): Promise<void> {
    const hook = this.deps.hookRepo.findById(id);
    if (!hook) {
      throw new Error(`Hook ${id} not found`);
    }

    this.deps.hookRepo.delete(id);

    this.deps.eventBus.emit({
      type: 'HOOK_DELETED',
      hookId: id,
    });
  }
}
