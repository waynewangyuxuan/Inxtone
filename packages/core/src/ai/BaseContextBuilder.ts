/**
 * BaseContextBuilder - Abstract base class for context assembly
 *
 * Provides shared infrastructure for both chapter-scoped and global context builders:
 * - formatContext(items) — groups items by semantic category → markdown
 * - formatCharacter(character) — character entity → readable string
 * - getScopedRelationships(charIds) — fetch relationships between given characters
 * - truncateToFitBudget(items, budget) — priority-based token truncation
 *
 * @see Meta/Decisions/ADR-0002-ai-context-injection-strategy.md
 */

import type { CharacterRepository } from '../db/repositories/CharacterRepository.js';
import type { LocationRepository } from '../db/repositories/LocationRepository.js';
import type { ArcRepository } from '../db/repositories/ArcRepository.js';
import type { RelationshipRepository } from '../db/repositories/RelationshipRepository.js';
import type { ForeshadowingRepository } from '../db/repositories/ForeshadowingRepository.js';
import type { HookRepository } from '../db/repositories/HookRepository.js';
import type { WorldRepository } from '../db/repositories/WorldRepository.js';
import type { WritingRepository } from '../db/repositories/WritingRepository.js';
import type { CharacterId, Character, Relationship } from '../types/entities.js';
import type { ContextItem, BuiltContext } from '../types/services.js';
import { countTokens } from './tokenCounter.js';

/**
 * Dependencies for context builders.
 * All repositories needed for context assembly.
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
export const L1_PRIORITY = 1000;
export const L2_PRIORITY = 800;
export const L3_PRIORITY = 600;
export const L4_PRIORITY = 400;
export const L5_PRIORITY = 200;

// Token budget constants
export const TOTAL_BUDGET = 1_000_000;
export const OUTPUT_RESERVE = 4_000;
export const PROMPT_RESERVE = 2_000;

export abstract class BaseContextBuilder {
  constructor(protected deps: ContextBuilderDeps) {}

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

  /**
   * Format a character entity into a readable context string.
   */
  formatCharacter(character: Character): string {
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
   * Get relationships between given characters (scoped — only direct relationships).
   */
  getScopedRelationships(characterIds: CharacterId[]): Relationship[] {
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
   * Truncate context items to fit within token budget.
   * Items are sorted by priority (descending), then accumulated.
   * Lower priority items are dropped when budget is exceeded.
   */
  protected truncateToFitBudget(items: ContextItem[], budget: number): BuiltContext {
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
