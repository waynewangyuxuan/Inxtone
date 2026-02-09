/**
 * ContextBuilder - 5-layer FK-based context assembly
 *
 * The "core brain" of the AI system. Assembles context from chapter FK references
 * following a deterministic, author-intent-driven approach.
 *
 * Layer priorities (higher = included first):
 *   L1 (1000) - Required: chapter content + outline + prev chapter tail
 *   L2 (800)  - FK Expansion: characters, locations, arc, scoped relationships
 *   L3 (600)  - Plot Awareness: foreshadowing, active foreshadowing in arc, prev hook
 *   L4 (400)  - World Rules: power system core rules, social rules
 *   L5 (200)  - User-Selected: additional items passed by caller
 *
 * Token budget: 1M total - 4K output reserve - 2K prompt reserve = ~994K available
 * When budget is exceeded, lower priority items are dropped first.
 *
 * @see Meta/Modules/03_ai_service.md §二 ContextBuilder 构建流程
 */

import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type {
  Chapter,
  ChapterId,
  CharacterId,
  Character,
  Relationship,
} from '../types/entities.js';
import type { ContextItem, BuiltContext } from '../types/services.js';
import { EntityNotFoundError } from '../errors/index.js';
import { countTokens } from './tokenCounter.js';

/**
 * Dependencies for ContextBuilder.
 * All repositories needed for 5-layer context assembly.
 */
export interface ContextBuilderDeps {
  writingRepo: WritingRepository;
  characterRepo: CharacterRepository;
  locationRepo: LocationRepository;
  arcRepo: ArcRepository;
  relationshipRepo: RelationshipRepository;
  foreshadowingRepo: ForeshadowingRepository;
  hookRepo: HookRepository;
  worldRepo: WorldRepository;
}

// Layer priority constants
const L1_PRIORITY = 1000;
const L2_PRIORITY = 800;
const L3_PRIORITY = 600;
const L4_PRIORITY = 400;
const L5_PRIORITY = 200;

// Token budget constants
const TOTAL_BUDGET = 1_000_000;
const OUTPUT_RESERVE = 4_000;
const PROMPT_RESERVE = 2_000;
const PREV_CHAPTER_TAIL_LENGTH = 500;

export class ContextBuilder {
  constructor(private deps: ContextBuilderDeps) {}

  /**
   * Build context for a chapter following the 5-layer assembly.
   *
   * @param chapterId - The chapter to build context for
   * @param additionalItems - User-selected additional context (L5)
   * @returns Assembled context with token count and truncation flag
   * @throws EntityNotFoundError if chapter not found
   */
  build(chapterId: ChapterId, additionalItems?: ContextItem[]): BuiltContext {
    const chapter = this.deps.writingRepo.findChapterWithContent(chapterId);
    if (!chapter) {
      throw new EntityNotFoundError('Chapter', String(chapterId));
    }

    // Collect items from all layers
    const items: ContextItem[] = [
      ...this.buildL1Required(chapter),
      ...this.buildL2FKExpansion(chapter),
      ...this.buildL3PlotAwareness(chapter),
      ...this.buildL4WorldRules(),
      ...this.buildL5UserSelected(additionalItems),
    ];

    // Apply token budget
    const budget = TOTAL_BUDGET - OUTPUT_RESERVE - PROMPT_RESERVE;
    return this.truncateToFitBudget(items, budget);
  }

  /**
   * Format context items into structured markdown for prompt injection.
   */
  formatContext(items: ContextItem[]): string {
    const sections: string[] = [];

    // Group items by semantic category
    const chapterItems = items.filter(
      (i) => i.type === 'chapter_content' || i.type === 'chapter_prev_tail'
    );
    const outlineItems = items.filter((i) => i.type === 'chapter_outline' || i.type === 'arc');
    const charItems = items.filter((i) => i.type === 'character' || i.type === 'relationship');
    const worldItems = items.filter(
      (i) => i.type === 'location' || i.type === 'power_system' || i.type === 'social_rules'
    );
    const plotItems = items.filter((i) => i.type === 'foreshadowing' || i.type === 'hook');
    const customItems = items.filter((i) => i.type === 'custom');

    if (chapterItems.length > 0) {
      sections.push('## 前文\n' + chapterItems.map((c) => c.content).join('\n\n'));
    }

    if (outlineItems.length > 0) {
      sections.push('## 本章大纲\n' + outlineItems.map((o) => o.content).join('\n\n'));
    }

    if (charItems.length > 0) {
      sections.push('## 角色档案\n' + charItems.map((c) => c.content).join('\n\n'));
    }

    if (worldItems.length > 0) {
      sections.push('## 世界规则\n' + worldItems.map((w) => w.content).join('\n\n'));
    }

    if (plotItems.length > 0) {
      sections.push('## 剧情线索\n' + plotItems.map((p) => p.content).join('\n\n'));
    }

    if (customItems.length > 0) {
      sections.push('## 补充信息\n' + customItems.map((c) => c.content).join('\n\n'));
    }

    return '<context>\n' + sections.join('\n\n') + '\n</context>';
  }

  // ===================================
  // Layer Builders
  // ===================================

  /**
   * L1 - Required: chapter content + outline + previous chapter tail
   */
  private buildL1Required(chapter: Chapter): ContextItem[] {
    const items: ContextItem[] = [];

    // Current chapter content
    if (chapter.content) {
      items.push({
        type: 'chapter_content',
        id: String(chapter.id),
        content: chapter.content,
        priority: L1_PRIORITY,
      });
    }

    // Current chapter outline
    if (chapter.outline) {
      const outlineParts: string[] = [];
      if (chapter.outline.goal) outlineParts.push(`目标: ${chapter.outline.goal}`);
      if (chapter.outline.scenes?.length) {
        outlineParts.push(
          `场景:\n${chapter.outline.scenes.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`
        );
      }
      if (chapter.outline.hookEnding) outlineParts.push(`钩子结尾: ${chapter.outline.hookEnding}`);

      if (outlineParts.length > 0) {
        items.push({
          type: 'chapter_outline',
          id: String(chapter.id),
          content: outlineParts.join('\n'),
          priority: L1_PRIORITY,
        });
      }
    }

    // Previous chapter tail (last 500 chars)
    const prevChapter = this.getPreviousChapter(chapter);
    if (prevChapter?.content) {
      const tail = prevChapter.content.slice(-PREV_CHAPTER_TAIL_LENGTH);
      items.push({
        type: 'chapter_prev_tail',
        id: `prev-${prevChapter.id}`,
        content: `[前一章末尾]\n${tail}`,
        priority: L1_PRIORITY,
      });
    }

    return items;
  }

  /**
   * L2 - FK Expansion: characters, locations, arc, scoped relationships
   */
  private buildL2FKExpansion(chapter: Chapter): ContextItem[] {
    const items: ContextItem[] = [];

    // Characters — batch query instead of N individual queries
    if (chapter.characters?.length) {
      const characters = this.deps.characterRepo.findByIds(chapter.characters);
      const charMap = new Map(characters.map((c) => [c.id, c]));

      for (const character of characters) {
        items.push({
          type: 'character',
          id: character.id,
          content: this.formatCharacter(character),
          priority: L2_PRIORITY,
        });
      }

      // Scoped relationships (only between chapter characters)
      const relationships = this.getScopedRelationships(chapter.characters);
      for (const rel of relationships) {
        const source = charMap.get(rel.sourceId);
        const target = charMap.get(rel.targetId);
        if (source && target) {
          const relParts = [`${source.name} → ${target.name}: ${rel.type}`];
          if (rel.joinReason) relParts.push(`  结缘原因: ${rel.joinReason}`);
          if (rel.independentGoal) relParts.push(`  独立目标: ${rel.independentGoal}`);

          items.push({
            type: 'relationship',
            id: `rel-${rel.id}`,
            content: `[关系] ${relParts.join('\n')}`,
            priority: L2_PRIORITY,
          });
        }
      }
    }

    // Locations — batch query instead of N individual queries
    if (chapter.locations?.length) {
      const locations = this.deps.locationRepo.findByIds(chapter.locations);
      for (const location of locations) {
        const locParts = [`### ${location.name}`];
        if (location.type) locParts.push(`类型: ${location.type}`);
        if (location.atmosphere) locParts.push(`氛围: ${location.atmosphere}`);
        if (location.significance) locParts.push(`意义: ${location.significance}`);

        items.push({
          type: 'location',
          id: location.id,
          content: locParts.join('\n'),
          priority: L2_PRIORITY,
        });
      }
    }

    // Arc
    if (chapter.arcId) {
      const arc = this.deps.arcRepo.findById(chapter.arcId);
      if (arc) {
        const arcParts = [`### 故事弧: ${arc.name}`];
        arcParts.push(`类型: ${arc.type}`);
        arcParts.push(`状态: ${arc.status}`);
        if (arc.sections?.length) {
          arcParts.push('节:');
          for (const section of arc.sections) {
            arcParts.push(`  - ${section.name} (${section.status})`);
          }
        }

        items.push({
          type: 'arc',
          id: arc.id,
          content: arcParts.join('\n'),
          priority: L2_PRIORITY,
        });
      }
    }

    return items;
  }

  /**
   * L3 - Plot Awareness: foreshadowing, active foreshadowing in arc, prev hook
   */
  private buildL3PlotAwareness(chapter: Chapter): ContextItem[] {
    const items: ContextItem[] = [];

    // Foreshadowing hinted in this chapter — batch query
    if (chapter.foreshadowingHinted?.length) {
      const hinted = this.deps.foreshadowingRepo.findByIds(chapter.foreshadowingHinted);
      for (const fs of hinted) {
        items.push({
          type: 'foreshadowing',
          id: fs.id,
          content: `[伏笔提示] ${fs.content} (状态: ${fs.status})`,
          priority: L3_PRIORITY,
        });
      }
    }

    // Active foreshadowing in current arc
    if (chapter.arcId) {
      const allActive = this.deps.foreshadowingRepo.findActive();
      // Include active foreshadowing not already in chapter.foreshadowingHinted
      const hintedSet = new Set(chapter.foreshadowingHinted ?? []);
      for (const fs of allActive) {
        if (!hintedSet.has(fs.id)) {
          items.push({
            type: 'foreshadowing',
            id: `active-${fs.id}`,
            content: `[活跃伏笔] ${fs.content} (状态: ${fs.status})`,
            priority: L3_PRIORITY,
          });
        }
      }
    }

    // Previous chapter hook
    const prevChapter = this.getPreviousChapter(chapter);
    if (prevChapter) {
      const hooks = this.deps.hookRepo.findByChapter(prevChapter.id);
      for (const hook of hooks) {
        items.push({
          type: 'hook',
          id: hook.id,
          content: `[上章钩子] ${hook.content} (强度: ${hook.strength ?? '未设定'})`,
          priority: L3_PRIORITY,
        });
      }
    }

    return items;
  }

  /**
   * L4 - World Rules: power system core rules, social rules
   */
  private buildL4WorldRules(): ContextItem[] {
    const items: ContextItem[] = [];

    const world = this.deps.worldRepo.get();
    if (!world) return items;

    // Power system core rules (always include if present)
    if (world.powerSystem?.coreRules?.length) {
      const rulesParts = [`### 力量体系: ${world.powerSystem.name}`];
      if (world.powerSystem.levels?.length) {
        rulesParts.push(`等级: ${world.powerSystem.levels.join(' → ')}`);
      }
      rulesParts.push(
        `核心规则:\n${world.powerSystem.coreRules.map((r) => `  - ${r}`).join('\n')}`
      );
      if (world.powerSystem.constraints?.length) {
        rulesParts.push(
          `限制:\n${world.powerSystem.constraints.map((c) => `  - ${c}`).join('\n')}`
        );
      }

      items.push({
        type: 'power_system',
        id: 'power-system',
        content: rulesParts.join('\n'),
        priority: L4_PRIORITY,
      });
    }

    // Social rules
    if (world.socialRules && Object.keys(world.socialRules).length > 0) {
      const socialParts = ['### 社会规则'];
      for (const [key, value] of Object.entries(world.socialRules)) {
        socialParts.push(`- ${key}: ${value}`);
      }

      items.push({
        type: 'social_rules',
        id: 'social-rules',
        content: socialParts.join('\n'),
        priority: L4_PRIORITY,
      });
    }

    return items;
  }

  /**
   * L5 - User-Selected: additional context items passed by caller
   */
  private buildL5UserSelected(additionalItems?: ContextItem[]): ContextItem[] {
    if (!additionalItems?.length) return [];

    // Ensure all user-selected items have L5 priority
    return additionalItems.map((item) => ({
      ...item,
      priority: item.priority || L5_PRIORITY,
    }));
  }

  // ===================================
  // Helpers
  // ===================================

  /**
   * Find the chapter immediately before the given chapter.
   * Uses volume ordering if available, otherwise falls back to ID ordering.
   */
  private getPreviousChapter(chapter: Chapter): Chapter | null {
    let chapters: Chapter[];

    if (chapter.volumeId) {
      chapters = this.deps.writingRepo.findChaptersByVolume(chapter.volumeId);
    } else {
      chapters = this.deps.writingRepo.findAllChapters();
    }

    const idx = chapters.findIndex((c) => c.id === chapter.id);
    if (idx <= 0) return null;

    // Return previous chapter WITH content (need it for tail)
    const prev = chapters[idx - 1];
    if (!prev) return null;
    return this.deps.writingRepo.findChapterWithContent(prev.id);
  }

  /**
   * Get relationships between chapter characters (scoped — only direct relationships).
   */
  private getScopedRelationships(characterIds: CharacterId[]): Relationship[] {
    const relationships: Relationship[] = [];
    const seen = new Set<number>();

    for (let i = 0; i < characterIds.length; i++) {
      for (let j = i + 1; j < characterIds.length; j++) {
        const idA = characterIds[i]!;
        const idB = characterIds[j]!;

        // Check both directions
        const fwd = this.deps.relationshipRepo.findBetween(idA, idB);
        if (fwd && !seen.has(fwd.id)) {
          relationships.push(fwd);
          seen.add(fwd.id);
        }

        const rev = this.deps.relationshipRepo.findBetween(idB, idA);
        if (rev && !seen.has(rev.id)) {
          relationships.push(rev);
          seen.add(rev.id);
        }
      }
    }

    return relationships;
  }

  /**
   * Format a character entity into a readable context string.
   */
  private formatCharacter(character: Character): string {
    const parts = [`### ${character.name} (${character.role})`];

    if (character.appearance) parts.push(`外貌: ${character.appearance}`);

    if (character.motivation) {
      const motParts = [`动机:`];
      motParts.push(`  表面: ${character.motivation.surface}`);
      if (character.motivation.hidden) motParts.push(`  隐藏: ${character.motivation.hidden}`);
      if (character.motivation.core) motParts.push(`  核心: ${character.motivation.core}`);
      parts.push(motParts.join('\n'));
    }

    if (character.facets) {
      const facetParts = [`性格面:`];
      facetParts.push(`  公开: ${character.facets.public}`);
      if (character.facets.private) facetParts.push(`  私下: ${character.facets.private}`);
      if (character.facets.hidden) facetParts.push(`  隐藏: ${character.facets.hidden}`);
      if (character.facets.underPressure)
        facetParts.push(`  压力下: ${character.facets.underPressure}`);
      parts.push(facetParts.join('\n'));
    }

    if (character.voiceSamples?.length) {
      parts.push(`语音样本:\n${character.voiceSamples.map((s) => `  "${s}"`).join('\n')}`);
    }

    return parts.join('\n');
  }

  /**
   * Truncate context items to fit within token budget.
   * Items are sorted by priority (descending), then accumulated.
   * Lower priority items are dropped when budget is exceeded.
   */
  private truncateToFitBudget(items: ContextItem[], budget: number): BuiltContext {
    // Sort by priority descending
    const sorted = [...items].sort((a, b) => b.priority - a.priority);

    const included: ContextItem[] = [];
    let totalTokens = 0;
    let truncated = false;

    for (const item of sorted) {
      const itemTokens = countTokens(item.content);
      if (totalTokens + itemTokens <= budget) {
        included.push(item);
        totalTokens += itemTokens;
      } else {
        truncated = true;
        // Skip this item (budget exceeded)
      }
    }

    return { items: included, totalTokens, truncated };
  }
}
