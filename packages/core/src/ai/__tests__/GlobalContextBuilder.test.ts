/**
 * GlobalContextBuilder Integration Tests
 *
 * Tests GlobalContextBuilder against a real in-memory SQLite database.
 * Verifies buildFull() and buildSummary() for global context assembly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { GlobalContextBuilder } from '../GlobalContextBuilder.js';

describe('GlobalContextBuilder', () => {
  let db: Database;
  let builder: GlobalContextBuilder;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let arcRepo: ArcRepository;
  let relationshipRepo: RelationshipRepository;
  let foreshadowingRepo: ForeshadowingRepository;
  let worldRepo: WorldRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();

    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    arcRepo = new ArcRepository(db);
    relationshipRepo = new RelationshipRepository(db);
    foreshadowingRepo = new ForeshadowingRepository(db);
    worldRepo = new WorldRepository(db);

    builder = new GlobalContextBuilder({
      writingRepo: new WritingRepository(db),
      characterRepo,
      locationRepo,
      arcRepo,
      relationshipRepo,
      foreshadowingRepo,
      hookRepo: new HookRepository(db),
      worldRepo,
    });
  });

  afterEach(() => {
    db.close();
  });

  // ============================================
  // buildFull
  // ============================================

  describe('buildFull', () => {
    it('returns empty context with no data', () => {
      const result = builder.buildFull();
      expect(result.items).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('includes characters with motivation and facets', () => {
      const c1 = characterRepo.create({
        name: '林墨渊',
        role: 'main',
        motivation: { surface: '寻找真相' },
      });
      characterRepo.update(c1.id, { facets: { public: '冷静' } });
      characterRepo.create({ name: '苏瑶', role: 'supporting' });

      const result = builder.buildFull();
      const charItem = result.items.find((i) => i.type === 'character');
      expect(charItem).toBeDefined();
      expect(charItem!.content).toContain('林墨渊');
      expect(charItem!.content).toContain('寻找真相');
      expect(charItem!.content).toContain('冷静');
      expect(charItem!.content).toContain('苏瑶');
    });

    it('includes all relationships with name resolution', () => {
      const c1 = characterRepo.create({ name: '林墨渊', role: 'main' });
      const c2 = characterRepo.create({ name: '苏瑶', role: 'supporting' });
      relationshipRepo.create({
        sourceId: c1.id,
        targetId: c2.id,
        type: 'companion',
      });

      const result = builder.buildFull();
      const relItem = result.items.find((i) => i.type === 'relationship');
      expect(relItem).toBeDefined();
      expect(relItem!.content).toContain('林墨渊');
      expect(relItem!.content).toContain('苏瑶');
      expect(relItem!.content).toContain('companion');
    });

    it('includes all arcs', () => {
      arcRepo.create({ name: '觉醒之路', type: 'main', status: 'in_progress' });
      arcRepo.create({ name: '师门阴谋', type: 'sub', status: 'planned' });

      const result = builder.buildFull();
      const arcItem = result.items.find((i) => i.type === 'arc');
      expect(arcItem).toBeDefined();
      expect(arcItem!.content).toContain('觉醒之路');
      expect(arcItem!.content).toContain('师门阴谋');
    });

    it('includes all locations', () => {
      locationRepo.create({ name: '青云宗', type: '宗门' });
      locationRepo.create({ name: '万妖林' });

      const result = builder.buildFull();
      const locItem = result.items.find((i) => i.type === 'location');
      expect(locItem).toBeDefined();
      expect(locItem!.content).toContain('青云宗');
      expect(locItem!.content).toContain('万妖林');
    });

    it('includes all foreshadowing', () => {
      foreshadowingRepo.create({ content: '神秘黑影' });
      foreshadowingRepo.create({ content: '古老预言' });

      const result = builder.buildFull();
      const fsItem = result.items.find((i) => i.type === 'foreshadowing');
      expect(fsItem).toBeDefined();
      expect(fsItem!.content).toContain('神秘黑影');
      expect(fsItem!.content).toContain('古老预言');
    });

    it('includes world power system and social rules', () => {
      worldRepo.upsert({
        powerSystem: { name: '灵气', coreRules: ['不能逆天而行'] },
        socialRules: { 宗门规矩: '尊师重道' },
      });

      const result = builder.buildFull();
      const psItem = result.items.find((i) => i.type === 'power_system');
      expect(psItem).toBeDefined();
      expect(psItem!.content).toContain('灵气');

      const srItem = result.items.find((i) => i.type === 'social_rules');
      expect(srItem).toBeDefined();
      expect(srItem!.content).toContain('尊师重道');
    });

    it('formatted context includes all sections', () => {
      characterRepo.create({ name: '林墨渊', role: 'main' });
      arcRepo.create({ name: '觉醒之路', type: 'main', status: 'in_progress' });
      foreshadowingRepo.create({ content: '神秘黑影' });
      worldRepo.upsert({ powerSystem: { name: '灵气', coreRules: ['规则'] } });

      const result = builder.buildFull();
      const formatted = builder.formatContext(result.items);

      expect(formatted).toContain('<context>');
      expect(formatted).toContain('</context>');
      expect(formatted).toContain('林墨渊');
      expect(formatted).toContain('觉醒之路');
      expect(formatted).toContain('神秘黑影');
      expect(formatted).toContain('灵气');
    });
  });

  // ============================================
  // buildSummary
  // ============================================

  describe('buildSummary', () => {
    it('returns empty context with no data', () => {
      const result = builder.buildSummary();
      expect(result.items).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
    });

    it('includes character names with roles', () => {
      characterRepo.create({ name: '林墨渊', role: 'main' });
      characterRepo.create({ name: '苏瑶', role: 'supporting' });

      const result = builder.buildSummary();
      const charItem = result.items.find((i) => i.type === 'character');
      expect(charItem).toBeDefined();
      expect(charItem!.content).toContain('林墨渊(main)');
      expect(charItem!.content).toContain('苏瑶(supporting)');
    });

    it('includes arc names with status', () => {
      arcRepo.create({ name: '觉醒之路', type: 'main', status: 'in_progress' });

      const result = builder.buildSummary();
      const arcItem = result.items.find((i) => i.type === 'arc');
      expect(arcItem).toBeDefined();
      expect(arcItem!.content).toContain('觉醒之路(in_progress)');
    });

    it('includes active foreshadowing only', () => {
      foreshadowingRepo.create({ content: '神秘黑影' }); // defaults to 'active'
      const resolved = foreshadowingRepo.create({ content: '已解决的伏笔' });
      foreshadowingRepo.abandon(resolved.id); // change to non-active

      const result = builder.buildSummary();
      const fsItem = result.items.find((i) => i.type === 'foreshadowing');
      expect(fsItem).toBeDefined();
      expect(fsItem!.content).toContain('神秘黑影');
      expect(fsItem!.content).not.toContain('已解决的伏笔');
    });

    it('summary is more compact than full', () => {
      const c = characterRepo.create({
        name: '林墨渊',
        role: 'main',
        motivation: { surface: '寻找真相', hidden: '复仇', core: '正义' },
      });
      characterRepo.update(c.id, { facets: { public: '冷静', private: '温柔' } });
      arcRepo.create({ name: '觉醒之路', type: 'main', status: 'in_progress' });

      const full = builder.buildFull();
      const summary = builder.buildSummary();

      // Summary should use fewer tokens
      expect(summary.totalTokens).toBeLessThan(full.totalTokens);
    });
  });
});
