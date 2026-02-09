/**
 * ContextBuilder Integration Tests
 *
 * Tests the real ContextBuilder against a real in-memory SQLite database.
 * Verifies 5-layer context assembly, token budget management, and formatting.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../db/Database.js';
import { WritingRepository } from '../../db/repositories/WritingRepository.js';
import { CharacterRepository } from '../../db/repositories/CharacterRepository.js';
import { LocationRepository } from '../../db/repositories/LocationRepository.js';
import { ArcRepository } from '../../db/repositories/ArcRepository.js';
import { RelationshipRepository } from '../../db/repositories/RelationshipRepository.js';
import { ForeshadowingRepository } from '../../db/repositories/ForeshadowingRepository.js';
import { HookRepository } from '../../db/repositories/HookRepository.js';
import { WorldRepository } from '../../db/repositories/WorldRepository.js';
import { ChapterContextBuilder } from '../ChapterContextBuilder.js';
import { EntityNotFoundError } from '../../errors/index.js';
import type { ContextItem } from '../../types/services.js';

describe('ChapterContextBuilder', () => {
  let db: Database;
  let builder: ChapterContextBuilder;
  let writingRepo: WritingRepository;
  let characterRepo: CharacterRepository;
  let locationRepo: LocationRepository;
  let arcRepo: ArcRepository;
  let relationshipRepo: RelationshipRepository;
  let foreshadowingRepo: ForeshadowingRepository;
  let hookRepo: HookRepository;
  let worldRepo: WorldRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();

    writingRepo = new WritingRepository(db);
    characterRepo = new CharacterRepository(db);
    locationRepo = new LocationRepository(db);
    arcRepo = new ArcRepository(db);
    relationshipRepo = new RelationshipRepository(db);
    foreshadowingRepo = new ForeshadowingRepository(db);
    hookRepo = new HookRepository(db);
    worldRepo = new WorldRepository(db);

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
  });

  afterEach(() => {
    db.close();
  });

  // ============================================
  // Error Handling
  // ============================================

  describe('error handling', () => {
    it('throws EntityNotFoundError for nonexistent chapter', () => {
      expect(() => builder.build(999 as never)).toThrow(EntityNotFoundError);
    });
  });

  // ============================================
  // Layer 1: Required
  // ============================================

  describe('L1 - Required', () => {
    it('includes current chapter content', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '这是第一章的内容。');

      const result = builder.build(chapter.id);
      const contentItems = result.items.filter(
        (i) => i.type === 'chapter_content' && i.id === String(chapter.id)
      );
      expect(contentItems.length).toBe(1);
      expect(contentItems[0].content).toBe('这是第一章的内容。');
      expect(contentItems[0].priority).toBe(1000);
    });

    it('includes current chapter outline', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.updateChapter(chapter.id, {
        outline: {
          goal: '主角觉醒',
          scenes: ['开场', '冲突', '高潮'],
          hookEnding: '神秘人出现',
        },
      });

      const result = builder.build(chapter.id);
      const outlineItems = result.items.filter(
        (i) => i.type === 'chapter_outline' && i.id === String(chapter.id)
      );
      expect(outlineItems.length).toBe(1);
      expect(outlineItems[0].content).toContain('主角觉醒');
      expect(outlineItems[0].content).toContain('开场');
      expect(outlineItems[0].content).toContain('神秘人出现');
    });

    it('includes previous chapter tail', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const ch1 = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      const ch2 = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch2' });

      // Save content for ch1
      const longContent = '前文内容'.repeat(200); // Lots of content
      writingRepo.saveContent(ch1.id, longContent);

      const result = builder.build(ch2.id);
      const prevItems = result.items.filter(
        (i) => i.type === 'chapter_prev_tail' && i.id === `prev-${ch1.id}`
      );
      expect(prevItems.length).toBe(1);
      expect(prevItems[0].content).toContain('[前一章末尾]');
      // Should be truncated to ~500 chars
      expect(prevItems[0].content.length).toBeLessThan(600);
    });

    it('handles chapter with no content', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      // Should still work, just no content items
      expect(result.items.length).toBe(0);
    });

    it('handles first chapter (no previous)', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      const result = builder.build(chapter.id);
      const prevItems = result.items.filter((i) => i.id?.startsWith('prev-'));
      expect(prevItems.length).toBe(0);
    });
  });

  // ============================================
  // Layer 2: FK Expansion
  // ============================================

  describe('L2 - FK Expansion', () => {
    it('includes character profiles from chapter.characters[]', () => {
      const char = characterRepo.create({
        name: '林逸',
        role: 'main',
        appearance: '黑发少年',
        motivation: { surface: '变强' },
      });
      // facets are not inserted by create(), must use update()
      characterRepo.update(char.id, { facets: { public: '阳光开朗' } });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.updateChapter(chapter.id, { characters: [char.id] });

      const result = builder.build(chapter.id);
      const charItems = result.items.filter((i) => i.type === 'character' && i.id === char.id);
      expect(charItems.length).toBe(1);
      expect(charItems[0].content).toContain('林逸');
      expect(charItems[0].content).toContain('黑发少年');
      expect(charItems[0].content).toContain('变强');
      expect(charItems[0].content).toContain('阳光开朗');
      expect(charItems[0].priority).toBe(800);
    });

    it('includes scoped relationships between chapter characters', () => {
      const char1 = characterRepo.create({ name: '林逸', role: 'main' });
      const char2 = characterRepo.create({ name: '陈浩', role: 'supporting' });
      relationshipRepo.create({
        sourceId: char1.id,
        targetId: char2.id,
        type: 'rival',
        joinReason: '因比赛结仇',
      });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.updateChapter(chapter.id, { characters: [char1.id, char2.id] });

      const result = builder.build(chapter.id);
      const relItems = result.items.filter(
        (i) => i.type === 'relationship' && i.id?.startsWith('rel-')
      );
      expect(relItems.length).toBe(1);
      expect(relItems[0].content).toContain('林逸');
      expect(relItems[0].content).toContain('陈浩');
      expect(relItems[0].content).toContain('rival');
    });

    it('includes locations from chapter.locations[]', () => {
      const loc = locationRepo.create({
        name: '宗门擂台',
        type: '建筑',
        atmosphere: '紧张激烈',
        significance: '重要场所',
      });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.updateChapter(chapter.id, { locations: [loc.id] });

      const result = builder.build(chapter.id);
      const locItems = result.items.filter((i) => i.type === 'location' && i.id === loc.id);
      expect(locItems.length).toBe(1);
      expect(locItems[0].content).toContain('宗门擂台');
      expect(locItems[0].content).toContain('紧张激烈');
    });

    it('includes arc structure from chapter.arcId', () => {
      const arc = arcRepo.create({
        name: '天才对决',
        type: 'main',
        status: 'in_progress',
        sections: [
          { name: '序幕', chapters: [], type: 'intro', status: 'complete' },
          { name: '冲突', chapters: [], type: 'conflict', status: 'in_progress' },
        ],
      });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({
        volumeId: volume.id,
        title: 'Ch1',
        arcId: arc.id,
      });

      const result = builder.build(chapter.id);
      const arcItems = result.items.filter((i) => i.type === 'arc' && i.id === arc.id);
      expect(arcItems.length).toBe(1);
      expect(arcItems[0].content).toContain('天才对决');
      expect(arcItems[0].content).toContain('序幕');
      expect(arcItems[0].content).toContain('冲突');
    });

    it('handles empty character/location arrays', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      const l2Items = result.items.filter((i) => i.priority === 800);
      expect(l2Items.length).toBe(0);
    });
  });

  // ============================================
  // Layer 3: Plot Awareness
  // ============================================

  describe('L3 - Plot Awareness', () => {
    it('includes foreshadowing hinted in current chapter', () => {
      const fs = foreshadowingRepo.create({ content: '老爷子的真实身份' });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.updateChapter(chapter.id, { foreshadowingHinted: [fs.id] });

      const result = builder.build(chapter.id);
      const fsItems = result.items.filter((i) => i.type === 'foreshadowing' && i.id === fs.id);
      expect(fsItems.length).toBe(1);
      expect(fsItems[0].content).toContain('老爷子的真实身份');
      expect(fsItems[0].priority).toBe(600);
    });

    it('includes active foreshadowing in current arc', () => {
      const fs = foreshadowingRepo.create({ content: '隐藏的宝藏' });
      const arc = arcRepo.create({ name: 'Arc1', type: 'main', status: 'in_progress' });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({
        volumeId: volume.id,
        title: 'Ch1',
        arcId: arc.id,
      });

      const result = builder.build(chapter.id);
      const activeFs = result.items.filter(
        (i) => i.type === 'foreshadowing' && i.id === `active-${fs.id}`
      );
      expect(activeFs.length).toBe(1);
      expect(activeFs[0].content).toContain('隐藏的宝藏');
    });

    it('does not duplicate foreshadowing that is both hinted and active', () => {
      const fs = foreshadowingRepo.create({ content: '重复伏笔' });
      const arc = arcRepo.create({ name: 'Arc1', type: 'main', status: 'in_progress' });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({
        volumeId: volume.id,
        title: 'Ch1',
        arcId: arc.id,
      });
      writingRepo.updateChapter(chapter.id, { foreshadowingHinted: [fs.id] });

      const result = builder.build(chapter.id);
      const fsItems = result.items.filter(
        (i) => i.type === 'foreshadowing' && (i.id === fs.id || i.id === `active-${fs.id}`)
      );
      // Should have only the hinted one, not the active duplicate
      expect(fsItems.length).toBe(1);
      expect(fsItems[0].id).toBe(fs.id);
    });

    it('includes previous chapter hook', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const ch1 = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      const ch2 = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch2' });

      hookRepo.create({ chapterId: ch1.id, content: '谁在暗中窥视？', type: 'chapter' });

      const result = builder.build(ch2.id);
      const hookItems = result.items.filter((i) => i.type === 'hook' && i.content.includes('窥视'));
      expect(hookItems.length).toBe(1);
      expect(hookItems[0].content).toContain('上章钩子');
    });
  });

  // ============================================
  // Layer 4: World Rules
  // ============================================

  describe('L4 - World Rules', () => {
    it('includes power system core rules', () => {
      worldRepo.upsert({
        powerSystem: {
          name: '灵气修炼',
          levels: ['练气', '筑基', '金丹', '元婴'],
          coreRules: ['灵气循环需打通经脉', '突破需消耗灵石'],
          constraints: ['一日只能修炼两个时辰'],
        },
      });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      const worldItems = result.items.filter(
        (i) => i.type === 'power_system' && i.id === 'power-system'
      );
      expect(worldItems.length).toBe(1);
      expect(worldItems[0].content).toContain('灵气修炼');
      expect(worldItems[0].content).toContain('灵气循环需打通经脉');
      expect(worldItems[0].content).toContain('练气');
      expect(worldItems[0].priority).toBe(400);
    });

    it('includes social rules', () => {
      worldRepo.upsert({
        socialRules: {
          尊卑: '以修为定地位',
          门规: '叛门者死',
        },
      });

      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      const socialItems = result.items.filter(
        (i) => i.type === 'social_rules' && i.id === 'social-rules'
      );
      expect(socialItems.length).toBe(1);
      expect(socialItems[0].content).toContain('以修为定地位');
    });

    it('handles missing world settings', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      const worldItems = result.items.filter((i) => i.priority === 400);
      expect(worldItems.length).toBe(0);
    });
  });

  // ============================================
  // Layer 5: User-Selected
  // ============================================

  describe('L5 - User-Selected', () => {
    it('includes additional items', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const additionalItems: ContextItem[] = [
        { type: 'custom', content: '参考资料', priority: 200 },
      ];

      const result = builder.build(chapter.id, additionalItems);
      const customItems = result.items.filter((i) => i.content === '参考资料');
      expect(customItems.length).toBe(1);
    });

    it('handles no additional items', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });

      const result = builder.build(chapter.id);
      const l5Items = result.items.filter((i) => i.priority === 200);
      expect(l5Items.length).toBe(0);
    });
  });

  // ============================================
  // Token Budget
  // ============================================

  describe('token budget management', () => {
    it('tracks total token count', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '这是一些内容');

      const result = builder.build(chapter.id);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.truncated).toBe(false);
    });

    it('sets truncated flag when items exceed budget', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '内容');

      // Create a massive L5 item that exceeds budget
      // Use Chinese chars: each counts as 1.5 tokens, so 700K chars ≈ 1.05M tokens > 994K budget
      const hugeContent = '测'.repeat(700_000);
      const additionalItems: ContextItem[] = [
        { type: 'custom', content: hugeContent, priority: 200 },
      ];

      const result = builder.build(chapter.id, additionalItems);
      expect(result.truncated).toBe(true);
      // The L1 items (higher priority) should still be included
      const l1Items = result.items.filter((i) => i.priority === 1000);
      expect(l1Items.length).toBeGreaterThan(0);
    });

    it('preserves higher priority items when truncating', () => {
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const chapter = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(chapter.id, '章节内容');

      const hugeL5 = '测'.repeat(700_000);
      const result = builder.build(chapter.id, [
        { type: 'custom', content: hugeL5, priority: 200 },
      ]);

      // L1 content should be present, L5 huge content should be truncated
      const hasChapterContent = result.items.some(
        (i) => i.type === 'chapter_content' && i.content === '章节内容'
      );
      expect(hasChapterContent).toBe(true);

      const hasHugeL5 = result.items.some((i) => i.content === hugeL5);
      expect(hasHugeL5).toBe(false);
    });
  });

  // ============================================
  // formatContext
  // ============================================

  describe('formatContext', () => {
    it('formats items into structured markdown', () => {
      const items: ContextItem[] = [
        { type: 'character', id: 'C001', content: '### 林逸\n主角', priority: 800 },
        { type: 'power_system', id: 'power', content: '灵气体系', priority: 400 },
        { type: 'chapter_prev_tail', id: 'prev-1', content: '前文内容', priority: 1000 },
        { type: 'chapter_outline', id: '1', content: '大纲', priority: 1000 },
      ];

      const result = builder.formatContext(items);
      expect(result).toContain('<context>');
      expect(result).toContain('</context>');
      expect(result).toContain('## 角色档案');
      expect(result).toContain('## 世界规则');
      expect(result).toContain('## 前文');
      expect(result).toContain('## 本章大纲');
    });

    it('omits empty sections', () => {
      const items: ContextItem[] = [
        { type: 'chapter_content', id: '1', content: '内容', priority: 1000 },
      ];

      const result = builder.formatContext(items);
      expect(result).toContain('## 前文');
      expect(result).not.toContain('## 角色档案');
      expect(result).not.toContain('## 世界规则');
    });
  });

  // ============================================
  // Full Integration
  // ============================================

  describe('full integration', () => {
    it('assembles all 5 layers for a well-configured chapter', () => {
      // Set up world
      worldRepo.upsert({
        powerSystem: {
          name: '灵气',
          coreRules: ['不能逆天而行'],
        },
        socialRules: { 门规: '服从长老' },
      });

      // Create characters
      const char1 = characterRepo.create({
        name: '林逸',
        role: 'main',
        motivation: { surface: '变强' },
        facets: { public: '阳光' },
      });
      const char2 = characterRepo.create({ name: '陈浩', role: 'supporting' });
      relationshipRepo.create({ sourceId: char1.id, targetId: char2.id, type: 'rival' });

      // Create location
      const loc = locationRepo.create({ name: '宗门', type: '建筑' });

      // Create arc
      const arc = arcRepo.create({ name: '天才对决', type: 'main', status: 'in_progress' });

      // Create foreshadowing
      const fs = foreshadowingRepo.create({ content: '秘密身份' });

      // Create chapters
      const volume = writingRepo.createVolume({ name: 'V1', status: 'in_progress' });
      const ch1 = writingRepo.createChapter({ volumeId: volume.id, title: 'Ch1' });
      writingRepo.saveContent(ch1.id, '第一章内容结尾');
      hookRepo.create({ chapterId: ch1.id, content: '悬念', type: 'chapter' });

      const ch2 = writingRepo.createChapter({
        volumeId: volume.id,
        title: 'Ch2',
        arcId: arc.id,
      });
      writingRepo.saveContent(ch2.id, '第二章正文');
      writingRepo.updateChapter(ch2.id, {
        outline: { goal: '对决开始', scenes: ['入场'], hookEnding: '反转' },
        characters: [char1.id, char2.id],
        locations: [loc.id],
        foreshadowingHinted: [fs.id],
      });

      // Build context
      const result = builder.build(ch2.id, [
        { type: 'custom', content: '额外参考', priority: 200 },
      ]);

      // Verify all layers present
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalTokens).toBeGreaterThan(0);

      // L1: chapter content + outline + prev tail
      expect(
        result.items.some((i) => i.type === 'chapter_content' && i.content === '第二章正文')
      ).toBe(true);
      expect(
        result.items.some((i) => i.type === 'chapter_outline' && i.content.includes('对决开始'))
      ).toBe(true);
      expect(result.items.some((i) => i.content.includes('第一章内容结尾'))).toBe(true);

      // L2: characters + relationship + location + arc
      expect(result.items.some((i) => i.content.includes('林逸'))).toBe(true);
      expect(result.items.some((i) => i.content.includes('rival'))).toBe(true);
      expect(result.items.some((i) => i.content.includes('宗门'))).toBe(true);
      expect(result.items.some((i) => i.content.includes('天才对决'))).toBe(true);

      // L3: foreshadowing + hook
      expect(result.items.some((i) => i.content.includes('秘密身份'))).toBe(true);
      expect(result.items.some((i) => i.content.includes('悬念'))).toBe(true);

      // L4: world rules
      expect(result.items.some((i) => i.content.includes('不能逆天而行'))).toBe(true);
      expect(result.items.some((i) => i.content.includes('服从长老'))).toBe(true);

      // L5: user-selected
      expect(result.items.some((i) => i.content === '额外参考')).toBe(true);

      // Format context
      const formatted = builder.formatContext(result.items);
      expect(formatted).toContain('<context>');
      expect(formatted).toContain('</context>');
    });
  });
});
