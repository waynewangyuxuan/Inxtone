/**
 * BibleFormatter - Export Story Bible as structured Markdown
 *
 * Sections: Characters, Relationships, World, Locations,
 *           Factions, Arcs, Foreshadowing, Hooks
 */

import type {
  Character,
  Relationship,
  World,
  Location,
  Faction,
  Arc,
  Foreshadowing,
  Hook,
  BibleExportOptions,
  ExportResult,
} from '../../types/index.js';

/** All Bible data needed for export */
export interface BibleData {
  characters: Character[];
  relationships: Relationship[];
  world: World | null;
  locations: Location[];
  factions: Faction[];
  arcs: Arc[];
  foreshadowing: Foreshadowing[];
  hooks: Hook[];
}

type SectionName = NonNullable<BibleExportOptions['sections']>[number];

const ALL_SECTIONS: SectionName[] = [
  'characters',
  'relationships',
  'world',
  'locations',
  'factions',
  'arcs',
  'foreshadowing',
  'hooks',
];

export class BibleFormatter {
  format(data: BibleData, options?: BibleExportOptions): ExportResult {
    const sections = options?.sections ?? ALL_SECTIONS;
    const lines: string[] = [];

    lines.push('# Story Bible');
    lines.push('');

    for (const section of sections) {
      const sectionLines = this.formatSection(section, data);
      if (sectionLines.length > 0) {
        lines.push(...sectionLines);
        lines.push('');
      }
    }

    // Handle completely empty bible
    if (lines.length <= 2) {
      lines.push('*No Story Bible data yet.*');
      lines.push('');
    }

    return {
      data: lines.join('\n'),
      filename: 'story-bible.md',
      mimeType: 'text/markdown',
    };
  }

  private formatSection(section: SectionName, data: BibleData): string[] {
    switch (section) {
      case 'characters':
        return this.formatCharacters(data.characters);
      case 'relationships':
        return this.formatRelationships(data.relationships);
      case 'world':
        return this.formatWorld(data.world);
      case 'locations':
        return this.formatLocations(data.locations);
      case 'factions':
        return this.formatFactions(data.factions);
      case 'arcs':
        return this.formatArcs(data.arcs);
      case 'foreshadowing':
        return this.formatForeshadowing(data.foreshadowing);
      case 'hooks':
        return this.formatHooks(data.hooks);
    }
  }

  private formatCharacters(characters: Character[]): string[] {
    if (characters.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Characters');
    lines.push('');

    for (const c of characters) {
      lines.push(`### ${c.name} (${c.role})`);
      lines.push('');
      if (c.appearance) lines.push(`- **Appearance**: ${c.appearance}`);
      if (c.motivation) {
        lines.push(`- **Motivation (surface)**: ${c.motivation.surface}`);
        if (c.motivation.hidden) lines.push(`- **Motivation (hidden)**: ${c.motivation.hidden}`);
        if (c.motivation.core) lines.push(`- **Motivation (core)**: ${c.motivation.core}`);
      }
      if (c.conflictType) lines.push(`- **Conflict**: ${c.conflictType}`);
      if (c.template) lines.push(`- **Template**: ${c.template}`);
      if (c.voiceSamples && c.voiceSamples.length > 0) {
        lines.push(`- **Voice**: "${c.voiceSamples[0]}"`);
      }
      if (c.arc) {
        lines.push(`- **Arc**: ${c.arc.type} (${c.arc.startState} → ${c.arc.endState})`);
      }
      lines.push('');
    }

    return lines;
  }

  private formatRelationships(relationships: Relationship[]): string[] {
    if (relationships.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Relationships');
    lines.push('');
    lines.push('| Source | Target | Type | Join Reason | Independent Goal |');
    lines.push('|--------|--------|------|-------------|------------------|');

    for (const r of relationships) {
      const joinReason = r.joinReason ?? '-';
      const independentGoal = r.independentGoal ?? '-';
      lines.push(
        `| ${r.sourceId} | ${r.targetId} | ${r.type} | ${joinReason} | ${independentGoal} |`
      );
    }

    lines.push('');
    return lines;
  }

  private formatWorld(world: World | null): string[] {
    if (!world) return [];
    const lines: string[] = [];
    lines.push('## World');
    lines.push('');

    if (world.powerSystem) {
      lines.push(`### Power System: ${world.powerSystem.name}`);
      lines.push('');
      if (world.powerSystem.levels && world.powerSystem.levels.length > 0) {
        lines.push('**Levels:**');
        for (const level of world.powerSystem.levels) {
          lines.push(`- ${level}`);
        }
        lines.push('');
      }
      if (world.powerSystem.coreRules && world.powerSystem.coreRules.length > 0) {
        lines.push('**Core Rules:**');
        for (const rule of world.powerSystem.coreRules) {
          lines.push(`- ${rule}`);
        }
        lines.push('');
      }
      if (world.powerSystem.constraints && world.powerSystem.constraints.length > 0) {
        lines.push('**Constraints:**');
        for (const c of world.powerSystem.constraints) {
          lines.push(`- ${c}`);
        }
        lines.push('');
      }
    }

    if (world.socialRules && Object.keys(world.socialRules).length > 0) {
      lines.push('### Social Rules');
      lines.push('');
      for (const [key, value] of Object.entries(world.socialRules)) {
        lines.push(`- **${key}**: ${value}`);
      }
      lines.push('');
    }

    return lines;
  }

  private formatLocations(locations: Location[]): string[] {
    if (locations.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Locations');
    lines.push('');

    for (const loc of locations) {
      lines.push(`### ${loc.name}`);
      lines.push('');
      if (loc.type) lines.push(`- **Type**: ${loc.type}`);
      if (loc.atmosphere) lines.push(`- **Atmosphere**: ${loc.atmosphere}`);
      if (loc.significance) lines.push(`- **Significance**: ${loc.significance}`);
      lines.push('');
    }

    return lines;
  }

  private formatFactions(factions: Faction[]): string[] {
    if (factions.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Factions');
    lines.push('');

    for (const f of factions) {
      lines.push(`### ${f.name}`);
      lines.push('');
      if (f.type) lines.push(`- **Type**: ${f.type}`);
      if (f.status) lines.push(`- **Status**: ${f.status}`);
      if (f.stanceToMC) lines.push(`- **Stance**: ${f.stanceToMC}`);
      if (f.goals && f.goals.length > 0) lines.push(`- **Goals**: ${f.goals.join(', ')}`);
      if (f.internalConflict) lines.push(`- **Internal Conflict**: ${f.internalConflict}`);
      lines.push('');
    }

    return lines;
  }

  private formatArcs(arcs: Arc[]): string[] {
    if (arcs.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Story Arcs');
    lines.push('');

    for (const a of arcs) {
      lines.push(`### ${a.name} (${a.type}, ${a.status})`);
      lines.push('');
      lines.push(`- **Progress**: ${a.progress}%`);
      if (a.chapterStart != null)
        lines.push(`- **Chapters**: ${a.chapterStart} - ${a.chapterEnd ?? '?'}`);
      if (a.sections && a.sections.length > 0) {
        lines.push('- **Sections**:');
        for (const s of a.sections) {
          lines.push(`  - ${s.name} (${s.status}): chapters ${s.chapters.join(', ')}`);
        }
      }
      if (a.mainArcRelation) lines.push(`- **Main Arc Relation**: ${a.mainArcRelation}`);
      lines.push('');
    }

    return lines;
  }

  private formatForeshadowing(foreshadowing: Foreshadowing[]): string[] {
    if (foreshadowing.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Foreshadowing');
    lines.push('');
    lines.push('| ID | Content | Status | Term | Planted | Payoff |');
    lines.push('|----|---------|--------|------|---------|--------|');

    for (const f of foreshadowing) {
      const content = f.content.length > 50 ? f.content.slice(0, 50) + '...' : f.content;
      const planted = f.plantedChapter != null ? `Ch ${f.plantedChapter}` : '-';
      const payoff =
        f.resolvedChapter != null
          ? `Ch ${f.resolvedChapter}`
          : f.plannedPayoff != null
            ? `Ch ${f.plannedPayoff} (planned)`
            : '-';
      lines.push(
        `| ${f.id} | ${content} | ${f.status} | ${f.term ?? '-'} | ${planted} | ${payoff} |`
      );
    }

    lines.push('');
    return lines;
  }

  private formatHooks(hooks: Hook[]): string[] {
    if (hooks.length === 0) return [];
    const lines: string[] = [];
    lines.push('## Hooks');
    lines.push('');
    lines.push('| Type | Chapter | Content | Style | Strength |');
    lines.push('|------|---------|---------|-------|----------|');

    for (const h of hooks) {
      const content = h.content.length > 50 ? h.content.slice(0, 50) + '...' : h.content;
      const chapter = h.chapterId != null ? `Ch ${h.chapterId}` : '-';
      lines.push(
        `| ${h.type} | ${chapter} | ${content} | ${h.hookType ?? '-'} | ${h.strength ?? '-'} |`
      );
    }

    lines.push('');
    return lines;
  }
}
