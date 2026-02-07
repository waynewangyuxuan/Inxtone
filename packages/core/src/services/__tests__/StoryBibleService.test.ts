/**
 * StoryBibleService Integration Tests
 *
 * Tests the REAL StoryBibleService against a real in-memory SQLite database.
 * Focuses on service-layer logic: validation, event emission, cross-entity operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Database } from '../../db/Database.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { FactionRepository } from '../../db/repositories/FactionRepository.js';
import { TimelineEventRepository } from '../../db/repositories/TimelineEventRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { EventBus } from '../EventBus.js';
import { StoryBibleService } from '../StoryBibleService.js';

describe('StoryBibleService', () => {
  let db: Database;
  let eventBus: EventBus;
  let service: StoryBibleService;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    eventBus = new EventBus();
    service = new StoryBibleService({
      characterRepo: new CharacterRepository(db),
      relationshipRepo: new RelationshipRepository(db),
      worldRepo: new WorldRepository(db),
      locationRepo: new LocationRepository(db),
      factionRepo: new FactionRepository(db),
      timelineEventRepo: new TimelineEventRepository(db),
      arcRepo: new ArcRepository(db),
      foreshadowingRepo: new ForeshadowingRepository(db),
      hookRepo: new HookRepository(db),
      eventBus,
    });
  });

  afterEach(() => {
    db.close();
  });

  // ============================================
  // Characters
  // ============================================

  describe('Characters', () => {
    describe('createCharacter', () => {
      it('should create a character with valid input', async () => {
        const character = await service.createCharacter({
          name: '张三',
          role: 'main',
        });

        expect(character.id).toBe('C001');
        expect(character.name).toBe('张三');
        expect(character.role).toBe('main');
      });

      it('should throw when name is empty', async () => {
        await expect(service.createCharacter({ name: '', role: 'main' })).rejects.toThrow(
          'Character name is required'
        );
      });

      it('should throw when name is whitespace only', async () => {
        await expect(service.createCharacter({ name: '   ', role: 'main' })).rejects.toThrow(
          'Character name is required'
        );
      });

      it('should throw when role is missing', async () => {
        await expect(service.createCharacter({ name: '张三', role: '' as never })).rejects.toThrow(
          'Character role is required'
        );
      });

      it('should throw when role is invalid', async () => {
        await expect(
          service.createCharacter({ name: '张三', role: 'hero' as never })
        ).rejects.toThrow('Invalid character role: hero');
      });

      it('should emit CHARACTER_CREATED event', async () => {
        const handler = vi.fn();
        eventBus.on('CHARACTER_CREATED', handler);

        await service.createCharacter({ name: '张三', role: 'main' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'CHARACTER_CREATED',
            character: expect.objectContaining({ name: '张三' }),
          })
        );
      });
    });

    describe('updateCharacter', () => {
      it('should throw when character does not exist', async () => {
        await expect(service.updateCharacter('C999', { name: 'New Name' })).rejects.toThrow(
          'Character C999 not found'
        );
      });

      it('should throw when name is set to empty string', async () => {
        await service.createCharacter({ name: '张三', role: 'main' });

        await expect(service.updateCharacter('C001', { name: '' })).rejects.toThrow(
          'Character name cannot be empty'
        );
      });

      it('should update character successfully with valid input', async () => {
        await service.createCharacter({ name: '张三', role: 'main' });

        const updated = await service.updateCharacter('C001', {
          name: '张三丰',
          appearance: '仙风道骨',
        });

        expect(updated.name).toBe('张三丰');
        expect(updated.appearance).toBe('仙风道骨');
      });
    });

    describe('deleteCharacter', () => {
      it('should delete character and cascade delete relationships', async () => {
        const char1 = await service.createCharacter({ name: '张三', role: 'main' });
        const char2 = await service.createCharacter({ name: '李四', role: 'supporting' });

        await service.createRelationship({
          sourceId: char1.id,
          targetId: char2.id,
          type: 'companion',
        });

        // Verify relationship exists
        const relsBefore = await service.getRelationshipsForCharacter(char1.id);
        expect(relsBefore).toHaveLength(1);

        // Delete character
        await service.deleteCharacter(char1.id);

        // Character should be gone
        const found = await service.getCharacter(char1.id);
        expect(found).toBeNull();

        // Relationships should also be gone
        const relsAfter = await service.getRelationshipsForCharacter(char1.id);
        expect(relsAfter).toHaveLength(0);
      });

      it('should throw when character does not exist', async () => {
        await expect(service.deleteCharacter('C999')).rejects.toThrow('Character C999 not found');
      });
    });

    describe('searchCharacters', () => {
      it('should return empty array for blank query', async () => {
        await service.createCharacter({ name: '张三', role: 'main' });

        const results = await service.searchCharacters('');
        expect(results).toEqual([]);
      });

      it('should return empty array for whitespace-only query', async () => {
        await service.createCharacter({ name: '张三', role: 'main' });

        const results = await service.searchCharacters('   ');
        expect(results).toEqual([]);
      });
    });

    describe('getCharacterWithRelations', () => {
      it('should enrich relationships with targetName', async () => {
        const char1 = await service.createCharacter({ name: '张三', role: 'main' });
        const char2 = await service.createCharacter({ name: '李四', role: 'supporting' });

        await service.createRelationship({
          sourceId: char1.id,
          targetId: char2.id,
          type: 'companion',
        });

        const enriched = await service.getCharacterWithRelations(char1.id);

        expect(enriched).not.toBeNull();
        expect(enriched!.relationships).toHaveLength(1);
        expect(enriched!.relationships[0].targetName).toBe('李四');
      });

      it('should return null for non-existent character', async () => {
        const result = await service.getCharacterWithRelations('C999');
        expect(result).toBeNull();
      });
    });
  });

  // ============================================
  // Relationships
  // ============================================

  describe('Relationships', () => {
    describe('createRelationship', () => {
      it('should reject self-relationships', async () => {
        const char = await service.createCharacter({ name: '张三', role: 'main' });

        await expect(
          service.createRelationship({
            sourceId: char.id,
            targetId: char.id,
            type: 'companion',
          })
        ).rejects.toThrow('Cannot create relationship with self');
      });

      it('should reject when source character does not exist', async () => {
        const char = await service.createCharacter({ name: '张三', role: 'main' });

        await expect(
          service.createRelationship({
            sourceId: 'C999',
            targetId: char.id,
            type: 'companion',
          })
        ).rejects.toThrow('Source character C999 not found');
      });

      it('should reject when target character does not exist', async () => {
        const char = await service.createCharacter({ name: '张三', role: 'main' });

        await expect(
          service.createRelationship({
            sourceId: char.id,
            targetId: 'C999',
            type: 'companion',
          })
        ).rejects.toThrow('Target character C999 not found');
      });

      it('should reject invalid relationship type', async () => {
        const char1 = await service.createCharacter({ name: '张三', role: 'main' });
        const char2 = await service.createCharacter({ name: '李四', role: 'supporting' });

        await expect(
          service.createRelationship({
            sourceId: char1.id,
            targetId: char2.id,
            type: 'friend' as never,
          })
        ).rejects.toThrow('Invalid relationship type: friend');
      });

      it('should create a valid relationship', async () => {
        const char1 = await service.createCharacter({ name: '张三', role: 'main' });
        const char2 = await service.createCharacter({ name: '李四', role: 'supporting' });

        const rel = await service.createRelationship({
          sourceId: char1.id,
          targetId: char2.id,
          type: 'companion',
        });

        expect(rel.sourceId).toBe(char1.id);
        expect(rel.targetId).toBe(char2.id);
        expect(rel.type).toBe('companion');
      });
    });

    describe('deleteRelationship', () => {
      it('should throw when relationship does not exist', async () => {
        await expect(service.deleteRelationship(999)).rejects.toThrow('Relationship 999 not found');
      });

      it('should delete an existing relationship', async () => {
        const char1 = await service.createCharacter({ name: '张三', role: 'main' });
        const char2 = await service.createCharacter({ name: '李四', role: 'supporting' });

        const rel = await service.createRelationship({
          sourceId: char1.id,
          targetId: char2.id,
          type: 'rival',
        });

        await service.deleteRelationship(rel.id);

        const found = await service.getRelationship(rel.id);
        expect(found).toBeNull();
      });
    });
  });

  // ============================================
  // World
  // ============================================

  describe('World', () => {
    it('should round-trip updateWorld and getWorld', async () => {
      const powerSystem = {
        name: '灵力体系',
        levels: ['练气', '筑基', '金丹'],
        coreRules: ['需要灵根'],
      };

      await service.updateWorld({ powerSystem });

      const world = await service.getWorld();
      expect(world).not.toBeNull();
      expect(world!.powerSystem).toEqual(powerSystem);
    });

    it('should set power system via setPowerSystem', async () => {
      const powerSystem = {
        name: '魔力体系',
        levels: ['初级', '中级', '高级'],
      };

      await service.setPowerSystem(powerSystem);

      const world = await service.getWorld();
      expect(world).not.toBeNull();
      expect(world!.powerSystem!.name).toBe('魔力体系');
    });

    it('should set social rules via setSocialRules', async () => {
      const rules = {
        hierarchy: '实力为尊',
        currency: '灵石',
      };

      await service.setSocialRules(rules);

      const world = await service.getWorld();
      expect(world).not.toBeNull();
      expect(world!.socialRules).toEqual(rules);
    });
  });

  // ============================================
  // Locations
  // ============================================

  describe('Locations', () => {
    describe('createLocation', () => {
      it('should create a location with valid name', async () => {
        const location = await service.createLocation({
          name: '灵山',
          type: 'mountain',
          atmosphere: '仙气飘飘',
        });

        expect(location.id).toBe('L001');
        expect(location.name).toBe('灵山');
      });

      it('should throw when name is empty', async () => {
        await expect(service.createLocation({ name: '' })).rejects.toThrow(
          'Location name is required'
        );
      });

      it('should throw when name is whitespace only', async () => {
        await expect(service.createLocation({ name: '   ' })).rejects.toThrow(
          'Location name is required'
        );
      });
    });

    describe('updateLocation', () => {
      it('should throw when location does not exist', async () => {
        await expect(service.updateLocation('L999', { name: 'New Name' })).rejects.toThrow(
          'Location L999 not found'
        );
      });

      it('should throw when name is set to empty string', async () => {
        await service.createLocation({ name: '灵山' });

        await expect(service.updateLocation('L001', { name: '' })).rejects.toThrow(
          'Location name cannot be empty'
        );
      });

      it('should update location successfully', async () => {
        await service.createLocation({ name: '灵山' });

        const updated = await service.updateLocation('L001', {
          name: '灵鹫峰',
          atmosphere: '云雾缭绕',
        });

        expect(updated.name).toBe('灵鹫峰');
        expect(updated.atmosphere).toBe('云雾缭绕');
      });
    });
  });

  // ============================================
  // Factions
  // ============================================

  describe('Factions', () => {
    describe('createFaction', () => {
      it('should throw when name is empty', async () => {
        await expect(service.createFaction({ name: '' })).rejects.toThrow(
          'Faction name is required'
        );
      });

      it('should throw when leader does not exist', async () => {
        await expect(service.createFaction({ name: '天山派', leaderId: 'C999' })).rejects.toThrow(
          'Leader character C999 not found'
        );
      });

      it('should create faction with existing leader', async () => {
        const char = await service.createCharacter({ name: '掌门', role: 'supporting' });

        const faction = await service.createFaction({
          name: '天山派',
          leaderId: char.id,
        });

        expect(faction.name).toBe('天山派');
        expect(faction.leaderId).toBe(char.id);
      });
    });

    describe('updateFaction', () => {
      it('should throw when leader does not exist', async () => {
        await service.createFaction({ name: '天山派' });

        const factions = await service.getAllFactions();
        const factionId = factions[0].id;

        await expect(service.updateFaction(factionId, { leaderId: 'C999' })).rejects.toThrow(
          'Leader character C999 not found'
        );
      });

      it('should throw when faction does not exist', async () => {
        await expect(service.updateFaction('F999', { name: 'New Name' })).rejects.toThrow(
          'Faction F999 not found'
        );
      });
    });
  });

  // ============================================
  // Timeline Events
  // ============================================

  describe('Timeline Events', () => {
    describe('createTimelineEvent', () => {
      it('should throw when description is empty', async () => {
        await expect(service.createTimelineEvent({ description: '' })).rejects.toThrow(
          'Timeline event description is required'
        );
      });

      it('should throw when description is whitespace only', async () => {
        await expect(service.createTimelineEvent({ description: '   ' })).rejects.toThrow(
          'Timeline event description is required'
        );
      });

      it('should create a timeline event with valid description', async () => {
        const event = await service.createTimelineEvent({
          description: '大战爆发',
          eventDate: '第一年春',
        });

        expect(event.description).toBe('大战爆发');
        expect(event.eventDate).toBe('第一年春');
      });
    });
  });

  // ============================================
  // Arcs
  // ============================================

  describe('Arcs', () => {
    describe('createArc', () => {
      it('should throw when name is empty', async () => {
        await expect(service.createArc({ name: '', type: 'main' })).rejects.toThrow(
          'Arc name is required'
        );
      });

      it('should create arc and emit ARC_CREATED event', async () => {
        const handler = vi.fn();
        eventBus.on('ARC_CREATED', handler);

        const arc = await service.createArc({ name: '第一卷', type: 'main' });

        expect(arc.name).toBe('第一卷');
        expect(arc.type).toBe('main');
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'ARC_CREATED',
            arc: expect.objectContaining({ name: '第一卷' }),
          })
        );
      });
    });

    describe('updateArc', () => {
      it('should throw when arc does not exist', async () => {
        await expect(service.updateArc('ARC999', { name: 'New Name' })).rejects.toThrow(
          'Arc ARC999 not found'
        );
      });

      it('should throw when name is set to empty string', async () => {
        const arc = await service.createArc({ name: '第一卷', type: 'main' });

        await expect(service.updateArc(arc.id, { name: '' })).rejects.toThrow(
          'Arc name cannot be empty'
        );
      });

      it('should update arc successfully', async () => {
        const arc = await service.createArc({ name: '第一卷', type: 'main' });

        const updated = await service.updateArc(arc.id, {
          name: '第一卷：起源',
          progress: 50,
        });

        expect(updated.name).toBe('第一卷：起源');
        expect(updated.progress).toBe(50);
      });
    });
  });

  // ============================================
  // Foreshadowing
  // ============================================

  describe('Foreshadowing', () => {
    describe('createForeshadowing', () => {
      it('should throw when content is empty', async () => {
        await expect(service.createForeshadowing({ content: '' })).rejects.toThrow(
          'Foreshadowing content is required'
        );
      });

      it('should throw when content is whitespace only', async () => {
        await expect(service.createForeshadowing({ content: '   ' })).rejects.toThrow(
          'Foreshadowing content is required'
        );
      });

      it('should create foreshadowing with valid content', async () => {
        const fs = await service.createForeshadowing({
          content: '神秘的黑影出现在远处',
          plantedChapter: 1,
          term: 'mid',
        });

        expect(fs.content).toBe('神秘的黑影出现在远处');
        expect(fs.status).toBe('active');
      });
    });

    describe('addForeshadowingHint', () => {
      it('should emit FORESHADOWING_HINT_ADDED event (not FORESHADOWING_UPDATED)', async () => {
        const hintHandler = vi.fn();
        const updateHandler = vi.fn();
        eventBus.on('FORESHADOWING_HINT_ADDED', hintHandler);
        eventBus.on('FORESHADOWING_UPDATED', updateHandler);

        const fs = await service.createForeshadowing({
          content: '黑影的秘密',
          plantedChapter: 1,
        });

        await service.addForeshadowingHint(fs.id, 3, '黑影再次出现');

        expect(hintHandler).toHaveBeenCalledTimes(1);
        expect(hintHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'FORESHADOWING_HINT_ADDED',
            hintChapter: 3,
          })
        );
        expect(updateHandler).not.toHaveBeenCalled();
      });

      it('should add hint to foreshadowing', async () => {
        const fs = await service.createForeshadowing({
          content: '黑影的秘密',
          plantedChapter: 1,
        });

        const updated = await service.addForeshadowingHint(fs.id, 3, '黑影再次出现');

        expect(updated.hints).toBeDefined();
        expect(updated.hints).toHaveLength(1);
        expect(updated.hints![0].chapter).toBe(3);
        expect(updated.hints![0].text).toBe('黑影再次出现');
      });
    });

    describe('resolveForeshadowing', () => {
      it('should emit FORESHADOWING_RESOLVED event', async () => {
        const handler = vi.fn();
        eventBus.on('FORESHADOWING_RESOLVED', handler);

        const fs = await service.createForeshadowing({
          content: '伏笔内容',
          plantedChapter: 1,
        });

        await service.resolveForeshadowing(fs.id, 10);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'FORESHADOWING_RESOLVED',
            resolvedChapter: 10,
          })
        );
      });

      it('should set status to resolved', async () => {
        const fs = await service.createForeshadowing({
          content: '伏笔内容',
          plantedChapter: 1,
        });

        const resolved = await service.resolveForeshadowing(fs.id, 10);

        expect(resolved.status).toBe('resolved');
        expect(resolved.resolvedChapter).toBe(10);
      });
    });

    describe('abandonForeshadowing', () => {
      it('should emit FORESHADOWING_ABANDONED event', async () => {
        const handler = vi.fn();
        eventBus.on('FORESHADOWING_ABANDONED', handler);

        const fs = await service.createForeshadowing({
          content: '被放弃的伏笔',
          plantedChapter: 1,
        });

        await service.abandonForeshadowing(fs.id);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'FORESHADOWING_ABANDONED',
            foreshadowing: expect.objectContaining({ status: 'abandoned' }),
          })
        );
      });

      it('should set status to abandoned', async () => {
        const fs = await service.createForeshadowing({
          content: '被放弃的伏笔',
          plantedChapter: 1,
        });

        const abandoned = await service.abandonForeshadowing(fs.id);

        expect(abandoned.status).toBe('abandoned');
      });
    });
  });

  // ============================================
  // Hooks
  // ============================================

  describe('Hooks', () => {
    describe('createHook', () => {
      it('should throw when content is empty', async () => {
        await expect(service.createHook({ content: '', type: 'chapter' })).rejects.toThrow(
          'Hook content is required'
        );
      });

      it('should throw when content is whitespace only', async () => {
        await expect(service.createHook({ content: '   ', type: 'chapter' })).rejects.toThrow(
          'Hook content is required'
        );
      });

      it('should throw when type is invalid', async () => {
        await expect(
          service.createHook({ content: 'A hook', type: 'invalid' as never })
        ).rejects.toThrow('Invalid hook type: invalid');
      });

      it('should create hook with valid input', async () => {
        const hook = await service.createHook({
          content: '谁是真正的凶手？',
          type: 'chapter',
          chapterId: 5,
          hookType: 'mystery',
          strength: 80,
        });

        expect(hook.content).toBe('谁是真正的凶手？');
        expect(hook.type).toBe('chapter');
        expect(hook.chapterId).toBe(5);
        expect(hook.hookType).toBe('mystery');
        expect(hook.strength).toBe(80);
      });
    });

    describe('updateHook', () => {
      it('should throw when hook does not exist', async () => {
        await expect(service.updateHook('HK999', { content: 'Updated' })).rejects.toThrow(
          'Hook HK999 not found'
        );
      });

      it('should throw when content is set to empty string', async () => {
        const hook = await service.createHook({
          content: '原始钩子',
          type: 'chapter',
        });

        await expect(service.updateHook(hook.id, { content: '' })).rejects.toThrow(
          'Hook content cannot be empty'
        );
      });

      it('should throw when content is set to whitespace only', async () => {
        const hook = await service.createHook({
          content: '原始钩子',
          type: 'chapter',
        });

        await expect(service.updateHook(hook.id, { content: '   ' })).rejects.toThrow(
          'Hook content cannot be empty'
        );
      });

      it('should update hook successfully', async () => {
        const hook = await service.createHook({
          content: '原始钩子',
          type: 'chapter',
        });

        const updated = await service.updateHook(hook.id, {
          content: '更新后的钩子',
          strength: 90,
        });

        expect(updated.content).toBe('更新后的钩子');
        expect(updated.strength).toBe(90);
      });
    });
  });
});
