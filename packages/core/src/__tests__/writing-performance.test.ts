/**
 * Writing + Context Performance Tests
 *
 * Benchmarks for large content operations, version management,
 * and context building with fully-loaded chapters.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Database } from '../db/Database.js';
import { WritingRepository } from '../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../db/repositories/LocationRepository.js';
import { ArcRepository } from '../db/repositories/ArcRepository.js';
import { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../db/repositories/HookRepository.js';
import { WorldRepository } from '../db/repositories/WorldRepository.js';
import { ChapterContextBuilder } from '../ai/ChapterContextBuilder.js';
import { WritingService, type WritingServiceDeps } from '../services/WritingService.js';
import { EventBus } from '../services/EventBus.js';
import type { ChapterId, VolumeId } from '../types/entities.js';

/**
 * Generate a large content string (~10K words of Chinese + English).
 */
function generateLargeContent(wordTarget: number): string {
  const paragraphs: string[] = [];
  const templates = [
    '月光洒落在庭院中，林墨渊静静地站在石阶之上，望着远处山峦叠嶂的轮廓。',
    '风从北方吹来，带着冰冷的气息，仿佛在诉说着一段被遗忘的往事。',
    '他的手指轻轻抚过腰间的长剑，那是师父临终前留下的唯一遗物。',
    'The ancient texts spoke of a power beyond mortal comprehension.',
    '「你真的要走这条路吗？」身后传来一个苍老的声音。',
    '修炼之路漫漫，每一步都需要付出常人难以想象的代价。',
  ];

  let approxWords = 0;
  while (approxWords < wordTarget) {
    const template = templates[paragraphs.length % templates.length]!;
    paragraphs.push(template);
    // Rough estimate: ~20 Chinese chars = ~20 words, English sentence ~10 words
    approxWords += 20;
  }
  return paragraphs.join('\n\n');
}

describe('Writing Performance Tests', () => {
  let db: Database;
  let dbPath: string;
  let writingRepo: WritingRepository;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let arcRepo: ArcRepository;
  let relationshipRepo: RelationshipRepository;
  let foreshadowingRepo: ForeshadowingRepository;
  let hookRepo: HookRepository;
  let worldRepo: WorldRepository;
  let writingService: WritingService;
  let builder: ChapterContextBuilder;

  // Shared test data IDs
  let volumeId: VolumeId;
  let chapterId: ChapterId;

  const largeContent = generateLargeContent(10000);

  beforeAll(() => {
    const tempDir = os.tmpdir();
    dbPath = path.join(tempDir, `inxtone-writing-perf-${Date.now()}.db`);

    db = new Database({ path: dbPath, migrate: true });
    db.connect();

    writingRepo = new WritingRepository(db);
    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    arcRepo = new ArcRepository(db);
    relationshipRepo = new RelationshipRepository(db);
    foreshadowingRepo = new ForeshadowingRepository(db);
    hookRepo = new HookRepository(db);
    worldRepo = new WorldRepository(db);

    const eventBus = new EventBus();
    writingService = new WritingService({
      db,
      writingRepo,
      characterRepo,
      locationRepo,
      arcRepo,
      foreshadowingRepo,
      eventBus,
    } as WritingServiceDeps);

    builder = new ChapterContextBuilder({
      writingRepo,
      characterRepo,
      locationRepo,
      arcRepo,
      relationshipRepo,
      foreshadowingRepo,
      hookRepo,
      worldRepo,
    });

    // Seed shared volume and chapter
    const vol = writingRepo.createVolume({ name: 'Perf Vol', status: 'in_progress' });
    volumeId = vol.id;
    const ch = writingRepo.createChapter({ volumeId, title: 'Perf Chapter' });
    chapterId = ch.id;
  }, 15000);

  afterAll(() => {
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  // ============================================
  // Large Content Save
  // ============================================

  describe('Large Content Save', () => {
    it('should save 10K+ word content in under 50ms', async () => {
      const start = Date.now();
      await writingService.saveContent({
        chapterId,
        content: largeContent,
        createVersion: false,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      console.log(`  ⏱️  Saved ${largeContent.length} chars in ${duration}ms`);
    });
  });

  // ============================================
  // Large Chapter Load
  // ============================================

  describe('Large Chapter Load', () => {
    it('should load large chapter with content in under 20ms', () => {
      const start = Date.now();
      const chapter = writingRepo.findChapterWithContent(chapterId);
      const duration = Date.now() - start;

      expect(chapter).not.toBeNull();
      expect(chapter!.content).toBe(largeContent);
      expect(duration).toBeLessThan(20);

      console.log(`  ⏱️  Loaded chapter with ${chapter!.content!.length} chars in ${duration}ms`);
    });

    it('should load chapter without content faster', () => {
      const start = Date.now();
      const chapter = writingRepo.findChapterById(chapterId);
      const duration = Date.now() - start;

      expect(chapter).not.toBeNull();
      expect(duration).toBeLessThan(10);

      console.log(`  ⏱️  Loaded chapter metadata in ${duration}ms`);
    });
  });

  // ============================================
  // Version Create + Rollback
  // ============================================

  describe('Version Management', () => {
    it('should create version for large content in under 50ms', async () => {
      const start = Date.now();
      await writingService.saveContent({
        chapterId,
        content: largeContent,
        createVersion: true,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50);
      console.log(`  ⏱️  Save + version create in ${duration}ms`);
    });

    it('should rollback large content in under 100ms', async () => {
      // Create a version, change content, then rollback
      await writingService.saveContent({
        chapterId,
        content: 'Modified content for rollback test',
        createVersion: true,
      });

      const versions = await writingService.getVersions(chapterId);
      expect(versions.length).toBeGreaterThan(0);
      const targetVersion = versions[versions.length - 1]!;

      const start = Date.now();
      await writingService.rollbackToVersion(chapterId, targetVersion.id);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      console.log(`  ⏱️  Rollback in ${duration}ms`);
    });
  });

  // ============================================
  // Context Build Performance
  // ============================================

  describe('Context Build Performance', () => {
    it('should build context for minimal chapter in under 100ms', () => {
      // Minimal chapter — just content, no FKs
      const start = Date.now();
      const ctx = builder.build(chapterId);
      const duration = Date.now() - start;

      expect(ctx.items.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);

      console.log(
        `  ⏱️  Minimal context: ${ctx.items.length} items, ${ctx.totalTokens} tokens in ${duration}ms`
      );
    });

    it('should build context for fully-loaded chapter in under 500ms', () => {
      // Seed a chapter with characters, locations, arc, foreshadowing
      const arc = arcRepo.create({ name: 'Perf Arc', type: 'main' });
      const ch = writingRepo.createChapter({
        volumeId,
        title: 'Full Chapter',
        arcId: arc.id,
      });
      writingRepo.saveContent(ch.id, largeContent);

      // Add characters
      const charIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const c = characterRepo.create({
          name: `角色${i + 1}`,
          role: i === 0 ? 'main' : 'supporting',
        });
        charIds.push(c.id);
      }
      writingRepo.updateChapter(ch.id, { characters: charIds });

      // Add locations
      const locIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const l = locationRepo.create({ name: `地点${i + 1}` });
        locIds.push(l.id);
      }
      writingRepo.updateChapter(ch.id, { locations: locIds });

      // Add relationships between characters
      for (let i = 1; i < charIds.length; i++) {
        relationshipRepo.create({
          sourceId: charIds[0]!,
          targetId: charIds[i]!,
          type: 'companion',
        });
      }

      // Add foreshadowing
      foreshadowingRepo.create({
        content: '伏笔内容',
        plantedChapter: ch.chapterNumber!,
      });

      // Build context
      const start = Date.now();
      const ctx = builder.build(ch.id);
      const duration = Date.now() - start;

      expect(ctx.items.length).toBeGreaterThan(5); // L1 + characters + locations + arc + relationships
      expect(duration).toBeLessThan(500);

      console.log(
        `  ⏱️  Full context: ${ctx.items.length} items, ${ctx.totalTokens} tokens in ${duration}ms`
      );
    });
  });
});
