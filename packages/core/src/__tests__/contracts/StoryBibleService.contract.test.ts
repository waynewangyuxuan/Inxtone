/**
 * Contract Tests for IStoryBibleService
 *
 * These tests verify that implementations conform to the interface contract.
 * They test return value structures, not implementation details.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockStoryBibleService } from '../mocks/MockStoryBibleService.js';
import type { IStoryBibleService } from '../../types/services.js';
import type {
  Character,
  Relationship,
  Location,
  Faction,
  Arc,
  Foreshadowing,
  Hook,
} from '../../types/entities.js';

describe('IStoryBibleService Contract', () => {
  let service: IStoryBibleService;

  beforeEach(() => {
    service = new MockStoryBibleService();
  });

  describe('Character Operations', () => {
    it('createCharacter returns a Character with required fields', async () => {
      const character = await service.createCharacter({
        name: 'Test Character',
        role: 'main',
      });

      // Verify required fields exist
      expect(character).toHaveProperty('id');
      expect(character).toHaveProperty('name', 'Test Character');
      expect(character).toHaveProperty('role', 'main');
      expect(character).toHaveProperty('createdAt');
      expect(character).toHaveProperty('updatedAt');

      // Verify id format (C followed by digits)
      expect(character.id).toMatch(/^C\d+$/);
    });

    it('createCharacter accepts optional fields', async () => {
      const character = await service.createCharacter({
        name: 'Complex Character',
        role: 'antagonist',
        appearance: 'Tall and menacing',
        voiceSamples: ['Sample 1', 'Sample 2'],
        motivation: { surface: 'Power', hidden: 'Fear of weakness' },
        conflictType: 'desire_vs_morality',
        template: 'fallen',
        firstAppearance: 1,
      });

      expect(character.appearance).toBe('Tall and menacing');
      expect(character.voiceSamples).toEqual(['Sample 1', 'Sample 2']);
      expect(character.motivation).toEqual({ surface: 'Power', hidden: 'Fear of weakness' });
      expect(character.conflictType).toBe('desire_vs_morality');
      expect(character.template).toBe('fallen');
      expect(character.firstAppearance).toBe(1);
    });

    it('getCharacter returns null for non-existent id', async () => {
      const character = await service.getCharacter('C999');
      expect(character).toBeNull();
    });

    it('getCharacter returns the created character', async () => {
      const created = await service.createCharacter({ name: 'Find Me', role: 'supporting' });
      const found = await service.getCharacter(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Find Me');
    });

    it('getCharacterWithRelations returns character with relationships array', async () => {
      const char1 = await service.createCharacter({ name: 'Character 1', role: 'main' });
      const char2 = await service.createCharacter({ name: 'Character 2', role: 'supporting' });

      await service.createRelationship({
        sourceId: char1.id,
        targetId: char2.id,
        type: 'companion',
      });

      const withRelations = await service.getCharacterWithRelations(char1.id);

      expect(withRelations).not.toBeNull();
      expect(withRelations!.relationships).toBeDefined();
      expect(Array.isArray(withRelations!.relationships)).toBe(true);
      expect(withRelations!.relationships.length).toBeGreaterThan(0);
      expect(withRelations!.relationships[0]).toHaveProperty('targetName');
    });

    it('getAllCharacters returns array', async () => {
      const characters = await service.getAllCharacters();
      expect(Array.isArray(characters)).toBe(true);
    });

    it('getCharactersByRole filters correctly', async () => {
      await service.createCharacter({ name: 'Main 1', role: 'main' });
      await service.createCharacter({ name: 'Main 2', role: 'main' });
      await service.createCharacter({ name: 'Support', role: 'supporting' });

      const mainCharacters = await service.getCharactersByRole('main');

      expect(mainCharacters.length).toBe(2);
      expect(mainCharacters.every((c) => c.role === 'main')).toBe(true);
    });

    it('updateCharacter returns updated character', async () => {
      const created = await service.createCharacter({ name: 'Original', role: 'main' });
      const updated = await service.updateCharacter(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.id).toBe(created.id);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.updatedAt).getTime()
      );
    });

    it('updateCharacter throws for non-existent id', async () => {
      await expect(service.updateCharacter('C999', { name: 'Test' })).rejects.toThrow();
    });

    it('deleteCharacter removes the character', async () => {
      const created = await service.createCharacter({ name: 'Delete Me', role: 'mentioned' });
      await service.deleteCharacter(created.id);

      const found = await service.getCharacter(created.id);
      expect(found).toBeNull();
    });

    it('searchCharacters returns matching characters', async () => {
      await service.createCharacter({ name: 'Alice Smith', role: 'main' });
      await service.createCharacter({ name: 'Bob Jones', role: 'supporting' });
      await service.createCharacter({
        name: 'Charlie',
        role: 'antagonist',
        appearance: 'Wears smith attire',
      });

      const results = await service.searchCharacters('smith');

      expect(results.length).toBe(2);
    });
  });

  describe('Relationship Operations', () => {
    let char1Id: string;
    let char2Id: string;

    beforeEach(async () => {
      const char1 = await service.createCharacter({ name: 'Char 1', role: 'main' });
      const char2 = await service.createCharacter({ name: 'Char 2', role: 'supporting' });
      char1Id = char1.id;
      char2Id = char2.id;
    });

    it('createRelationship returns Relationship with required fields', async () => {
      const relationship = await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });

      expect(relationship).toHaveProperty('id');
      expect(relationship).toHaveProperty('sourceId', char1Id);
      expect(relationship).toHaveProperty('targetId', char2Id);
      expect(relationship).toHaveProperty('type', 'companion');
      expect(relationship).toHaveProperty('createdAt');
      expect(relationship).toHaveProperty('updatedAt');
    });

    it('createRelationship accepts Wayne Principles fields', async () => {
      const relationship = await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'mentor',
        joinReason: 'Seeking guidance',
        independentGoal: 'Master the craft',
        disagreeScenarios: ['When ethics clash'],
        leaveScenarios: ['Betrayal discovered'],
        mcNeeds: 'Wisdom and experience',
      });

      expect(relationship.joinReason).toBe('Seeking guidance');
      expect(relationship.independentGoal).toBe('Master the craft');
      expect(relationship.disagreeScenarios).toEqual(['When ethics clash']);
      expect(relationship.leaveScenarios).toEqual(['Betrayal discovered']);
      expect(relationship.mcNeeds).toBe('Wisdom and experience');
    });

    it('getRelationshipsForCharacter returns array', async () => {
      await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });

      const relationships = await service.getRelationshipsForCharacter(char1Id);

      expect(Array.isArray(relationships)).toBe(true);
      expect(relationships.length).toBeGreaterThan(0);
    });
  });

  describe('World Operations', () => {
    it('getWorld returns null initially', async () => {
      const world = await service.getWorld();
      // May return null or initial world depending on implementation
      if (world !== null) {
        expect(world).toHaveProperty('id');
      }
    });

    it('updateWorld returns World object', async () => {
      const world = await service.updateWorld({
        powerSystem: {
          name: 'Magic System',
          levels: ['Novice', 'Adept', 'Master'],
          coreRules: ['Equivalent exchange'],
        },
      });

      expect(world).toHaveProperty('id');
      expect(world).toHaveProperty('powerSystem');
      expect(world.powerSystem!.name).toBe('Magic System');
    });

    it('setPowerSystem updates world power system', async () => {
      await service.setPowerSystem({
        name: 'Chi',
        levels: ['Bronze', 'Silver', 'Gold'],
      });

      const world = await service.getWorld();
      expect(world).not.toBeNull();
      expect(world!.powerSystem!.name).toBe('Chi');
    });

    it('setSocialRules updates world social rules', async () => {
      await service.setSocialRules({
        hierarchy: 'Strict caste system',
        taboo: 'Never speak of the old king',
      });

      const world = await service.getWorld();
      expect(world).not.toBeNull();
      expect(world!.socialRules).toBeDefined();
      expect(world!.socialRules!['hierarchy']).toBe('Strict caste system');
    });
  });

  describe('Location Operations', () => {
    it('createLocation returns Location with required fields', async () => {
      const location = await service.createLocation({
        name: 'Test Location',
        type: 'city',
        significance: 'Main hub',
        atmosphere: 'Bustling',
      });

      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('name', 'Test Location');
      expect(location).toHaveProperty('createdAt');
      expect(location).toHaveProperty('updatedAt');
      expect(location.id).toMatch(/^L\d+$/);
    });

    it('getLocation returns null for non-existent id', async () => {
      const location = await service.getLocation('L999');
      expect(location).toBeNull();
    });

    it('getLocation returns the created location', async () => {
      const created = await service.createLocation({ name: 'Find Me' });
      const found = await service.getLocation(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Find Me');
    });

    it('getAllLocations returns array', async () => {
      await service.createLocation({ name: 'Location 1' });
      await service.createLocation({ name: 'Location 2' });

      const locations = await service.getAllLocations();

      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBe(2);
    });

    it('updateLocation returns updated location', async () => {
      const created = await service.createLocation({ name: 'Original' });
      const updated = await service.updateLocation(created.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.id).toBe(created.id);
    });

    it('updateLocation throws for non-existent id', async () => {
      await expect(service.updateLocation('L999', { name: 'Test' })).rejects.toThrow();
    });

    it('deleteLocation removes the location', async () => {
      const created = await service.createLocation({ name: 'Delete Me' });
      await service.deleteLocation(created.id);

      const found = await service.getLocation(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Faction Operations', () => {
    it('createFaction returns Faction with required fields', async () => {
      const faction = await service.createFaction({
        name: 'Test Faction',
        type: 'guild',
        status: 'active',
        stanceToMC: 'neutral',
      });

      expect(faction).toHaveProperty('id');
      expect(faction).toHaveProperty('name', 'Test Faction');
      expect(faction).toHaveProperty('createdAt');
      expect(faction).toHaveProperty('updatedAt');
      expect(faction.id).toMatch(/^F\d+$/);
    });

    it('getFaction returns null for non-existent id', async () => {
      const faction = await service.getFaction('F999');
      expect(faction).toBeNull();
    });

    it('getFaction returns the created faction', async () => {
      const created = await service.createFaction({
        name: 'Find Me',
        type: 'military',
        status: 'active',
        stanceToMC: 'friendly',
      });
      const found = await service.getFaction(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Find Me');
    });

    it('getAllFactions returns array', async () => {
      await service.createFaction({
        name: 'Faction 1',
        type: 'guild',
        status: 'active',
        stanceToMC: 'neutral',
      });
      await service.createFaction({
        name: 'Faction 2',
        type: 'cult',
        status: 'hidden',
        stanceToMC: 'hostile',
      });

      const factions = await service.getAllFactions();

      expect(Array.isArray(factions)).toBe(true);
      expect(factions.length).toBe(2);
    });

    it('updateFaction returns updated faction', async () => {
      const created = await service.createFaction({
        name: 'Original',
        type: 'guild',
        status: 'active',
        stanceToMC: 'neutral',
      });
      const updated = await service.updateFaction(created.id, {
        name: 'Updated',
        stanceToMC: 'friendly',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.stanceToMC).toBe('friendly');
      expect(updated.id).toBe(created.id);
    });

    it('updateFaction throws for non-existent id', async () => {
      await expect(service.updateFaction('F999', { name: 'Test' })).rejects.toThrow();
    });

    it('deleteFaction removes the faction', async () => {
      const created = await service.createFaction({
        name: 'Delete Me',
        type: 'guild',
        status: 'active',
        stanceToMC: 'neutral',
      });
      await service.deleteFaction(created.id);

      const found = await service.getFaction(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Arc Operations', () => {
    it('createArc returns Arc with required fields', async () => {
      const arc = await service.createArc({
        name: 'Main Story Arc',
        type: 'main',
        status: 'planned',
        progress: 0,
      });

      expect(arc).toHaveProperty('id');
      expect(arc).toHaveProperty('name', 'Main Story Arc');
      expect(arc).toHaveProperty('type', 'main');
      expect(arc).toHaveProperty('status', 'planned');
      expect(arc).toHaveProperty('progress', 0);
      expect(arc.id).toMatch(/^ARC\d+$/);
    });

    it('getArc returns null for non-existent id', async () => {
      const arc = await service.getArc('ARC999');
      expect(arc).toBeNull();
    });

    it('getArc returns the created arc', async () => {
      const created = await service.createArc({
        name: 'Find Me',
        type: 'sub',
        status: 'active',
        progress: 50,
      });
      const found = await service.getArc(created.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Find Me');
    });

    it('getAllArcs returns array', async () => {
      await service.createArc({ name: 'Arc 1', type: 'main', status: 'active', progress: 0 });
      await service.createArc({ name: 'Arc 2', type: 'sub', status: 'planned', progress: 0 });

      const arcs = await service.getAllArcs();

      expect(Array.isArray(arcs)).toBe(true);
      expect(arcs.length).toBe(2);
    });

    it('updateArc returns updated arc', async () => {
      const created = await service.createArc({
        name: 'Original',
        type: 'main',
        status: 'planned',
        progress: 0,
      });
      const updated = await service.updateArc(created.id, { name: 'Updated', progress: 25 });

      expect(updated.name).toBe('Updated');
      expect(updated.progress).toBe(25);
      expect(updated.id).toBe(created.id);
    });

    it('updateArc throws for non-existent id', async () => {
      await expect(service.updateArc('ARC999', { name: 'Test' })).rejects.toThrow();
    });

    it('deleteArc removes the arc', async () => {
      const created = await service.createArc({
        name: 'Delete Me',
        type: 'sub',
        status: 'planned',
        progress: 0,
      });
      await service.deleteArc(created.id);

      const found = await service.getArc(created.id);
      expect(found).toBeNull();
    });
  });

  describe('Foreshadowing Operations', () => {
    it('createForeshadowing returns Foreshadowing with required fields', async () => {
      const fs = await service.createForeshadowing({
        content: 'The sword will break',
        plantedChapter: 1,
        plantedText: 'Notice the crack in the blade',
        plannedPayoff: 10,
        term: 'long',
      });

      expect(fs).toHaveProperty('id');
      expect(fs).toHaveProperty('content', 'The sword will break');
      expect(fs).toHaveProperty('status', 'active');
      expect(fs.id).toMatch(/^FS\d+$/);
    });

    it('addForeshadowingHint adds hint to foreshadowing', async () => {
      const fs = await service.createForeshadowing({
        content: 'Test foreshadowing',
      });

      const updated = await service.addForeshadowingHint(fs.id, 3, 'A subtle reminder');

      expect(updated.hints).toBeDefined();
      expect(updated.hints!.length).toBe(1);
      expect(updated.hints![0]).toEqual({ chapter: 3, text: 'A subtle reminder' });
    });

    it('resolveForeshadowing updates status to resolved', async () => {
      const fs = await service.createForeshadowing({
        content: 'Test foreshadowing',
      });

      const resolved = await service.resolveForeshadowing(fs.id, 15);

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolvedChapter).toBe(15);
    });

    it('abandonForeshadowing updates status to abandoned', async () => {
      const fs = await service.createForeshadowing({
        content: 'Abandoned plot thread',
      });

      const abandoned = await service.abandonForeshadowing(fs.id);

      expect(abandoned.status).toBe('abandoned');
    });

    it('getActiveForeshadowing only returns active items', async () => {
      const fs1 = await service.createForeshadowing({ content: 'Active 1' });
      const fs2 = await service.createForeshadowing({ content: 'Active 2' });
      const fs3 = await service.createForeshadowing({ content: 'To be resolved' });

      await service.resolveForeshadowing(fs3.id, 5);

      const active = await service.getActiveForeshadowing();

      expect(active.length).toBe(2);
      expect(active.every((f) => f.status === 'active')).toBe(true);
    });
  });

  describe('Hook Operations', () => {
    it('createHook returns Hook with required fields', async () => {
      const hook = await service.createHook({
        type: 'chapter',
        chapterId: 1,
        content: 'What lurks in the shadows?',
        hookType: 'suspense',
        strength: 80,
      });

      expect(hook).toHaveProperty('id');
      expect(hook).toHaveProperty('type', 'chapter');
      expect(hook).toHaveProperty('content', 'What lurks in the shadows?');
      expect(hook).toHaveProperty('createdAt');
      expect(hook.id).toMatch(/^H\d+$/);
    });

    it('getHooksForChapter returns hooks for specific chapter', async () => {
      await service.createHook({ type: 'chapter', chapterId: 1, content: 'Hook 1' });
      await service.createHook({ type: 'chapter', chapterId: 1, content: 'Hook 2' });
      await service.createHook({ type: 'chapter', chapterId: 2, content: 'Hook 3' });

      const hooks = await service.getHooksForChapter(1);

      expect(hooks.length).toBe(2);
      expect(hooks.every((h) => h.chapterId === 1)).toBe(true);
    });
  });

  describe('Timeline Operations', () => {
    it('createTimelineEvent returns TimelineEvent with required fields', async () => {
      const event = await service.createTimelineEvent({
        description: 'The Great War begins',
        eventDate: '1000-01-01',
        relatedCharacters: [],
      });

      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('description', 'The Great War begins');
      expect(event).toHaveProperty('createdAt');
    });

    it('getTimelineEvents returns array', async () => {
      await service.createTimelineEvent({ description: 'Event 1' });
      await service.createTimelineEvent({ description: 'Event 2' });

      const events = await service.getTimelineEvents();

      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(2);
    });

    it('deleteTimelineEvent removes the event', async () => {
      const event1 = await service.createTimelineEvent({ description: 'Keep Me' });
      const event2 = await service.createTimelineEvent({ description: 'Delete Me' });

      await service.deleteTimelineEvent(event2.id);

      const events = await service.getTimelineEvents();
      expect(events.length).toBe(1);
      expect(events[0].description).toBe('Keep Me');
    });
  });

  describe('Relationship CRUD Operations', () => {
    let char1Id: string;
    let char2Id: string;
    let char3Id: string;

    beforeEach(async () => {
      const char1 = await service.createCharacter({ name: 'Character A', role: 'main' });
      const char2 = await service.createCharacter({ name: 'Character B', role: 'supporting' });
      const char3 = await service.createCharacter({ name: 'Character C', role: 'antagonist' });
      char1Id = char1.id;
      char2Id = char2.id;
      char3Id = char3.id;
    });

    it('getRelationship returns null for non-existent id', async () => {
      const relationship = await service.getRelationship(9999);
      expect(relationship).toBeNull();
    });

    it('getRelationship returns the created relationship', async () => {
      const created = await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });
      const found = await service.getRelationship(created.id);

      expect(found).not.toBeNull();
      expect(found!.sourceId).toBe(char1Id);
      expect(found!.targetId).toBe(char2Id);
    });

    it('updateRelationship returns updated relationship', async () => {
      const created = await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });
      const updated = await service.updateRelationship(created.id, { type: 'rival' });

      expect(updated.type).toBe('rival');
      expect(updated.id).toBe(created.id);
    });

    it('updateRelationship throws for non-existent id', async () => {
      await expect(service.updateRelationship(9999, { type: 'enemy' })).rejects.toThrow();
    });

    it('deleteRelationship removes the relationship', async () => {
      const created = await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });
      await service.deleteRelationship(created.id);

      const found = await service.getRelationship(created.id);
      expect(found).toBeNull();
    });

    it('getRelationshipsForCharacter includes both directions', async () => {
      await service.createRelationship({
        sourceId: char1Id,
        targetId: char2Id,
        type: 'companion',
      });
      await service.createRelationship({
        sourceId: char3Id,
        targetId: char1Id,
        type: 'rival',
      });

      const relationships = await service.getRelationshipsForCharacter(char1Id);

      expect(relationships.length).toBe(2);
    });
  });
});
