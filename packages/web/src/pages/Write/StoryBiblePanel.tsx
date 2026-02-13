/**
 * StoryBiblePanel — interactive 8-section Bible panel for the Write page
 *
 * Sections: Characters, Relationships, Locations, Arc, Foreshadowing, Hooks, World, Factions
 * Features: collapsible sections, expandable detail cards, quick-search filter,
 * pin/unpin to inject entities into AI context (L5).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Select } from '../../components/ui';
import {
  useChapterWithContent,
  useCharacters,
  useRelationships,
  useLocations,
  useArcs,
  useForeshadowing,
  useHooks,
  useWorld,
  useFactions,
  useUpdateChapter,
} from '../../hooks';
import {
  useSelectedChapterId,
  useInjectedEntities,
  useEditorActions,
} from '../../stores/useEditorStore';
import { contextKeys } from '../../hooks/useChapters';
import type { ContextItem, ContextItemType } from '@inxtone/core';
import type {
  Character,
  Relationship,
  Location,
  Arc,
  Foreshadowing,
  Hook,
  Faction,
} from '@inxtone/core';
import { SetupAssistPanel } from './SetupAssistPanel';
import { ExtractionReview } from './ExtractionReview';
import styles from './StoryBiblePanel.module.css';

// ───────────────────────────────────────────
// Section Component
// ───────────────────────────────────────────

interface SectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, count, defaultOpen = true, children }: SectionProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span className={styles.chevron}>{open ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.count}>{count}</span>
      </button>
      {open && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// Entity Item (with expand + pin)
// ───────────────────────────────────────────

interface EntityItemProps {
  id: string;
  name: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'muted' | 'success' | 'warning' | 'danger';
  isLinked?: boolean; // Optional - if undefined, no link checkbox shown
  onLink?: () => void;
  onUnlink?: () => void;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  children?: React.ReactNode; // detail content when expanded
}

function EntityItem({
  id,
  name,
  badge,
  badgeVariant,
  isLinked,
  onLink,
  onUnlink,
  isPinned,
  onPin,
  onUnpin,
  expandedId,
  onToggleExpand,
  children,
}: EntityItemProps): React.ReactElement {
  const isExpanded = expandedId === id;

  return (
    <div className={styles.entityItem}>
      <div className={styles.entityRow} onClick={() => onToggleExpand(id)}>
        {isLinked !== undefined && onLink && onUnlink && (
          <button
            className={`${styles.linkButton} ${isLinked ? styles.linked : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isLinked) {
                onUnlink();
              } else {
                onLink();
              }
            }}
            title={isLinked ? 'Remove from chapter' : 'Add to chapter'}
          >
            {isLinked ? '\u2611' : '\u2610'}
          </button>
        )}
        <span className={styles.expandChevron}>{isExpanded ? '\u25BE' : '\u25B8'}</span>
        <span className={styles.entityName}>{name}</span>
        {badge && (
          <Badge variant={badgeVariant ?? 'default'} size="sm">
            {badge}
          </Badge>
        )}
        <button
          className={`${styles.pinButton} ${isPinned ? styles.pinned : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isPinned) {
              onUnpin();
            } else {
              onPin();
            }
          }}
          title={isPinned ? 'Unpin from context' : 'Pin to AI context (temporary)'}
        >
          {isPinned ? '\u2605' : '\u2606'}
        </button>
      </div>
      {isExpanded && children && <div className={styles.entityDetail}>{children}</div>}
    </div>
  );
}

// ───────────────────────────────────────────
// Detail Renderers
// ───────────────────────────────────────────

function CharacterDetail({ character }: { character: Character }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {character.appearance && <DetailField label="Appearance" value={character.appearance} />}
      {character.motivation?.surface && (
        <DetailField label="Surface Motivation" value={character.motivation.surface} />
      )}
      {character.motivation?.hidden && (
        <DetailField label="Hidden Motivation" value={character.motivation.hidden} />
      )}
      {character.facets?.public && <DetailField label="Public" value={character.facets.public} />}
      {character.facets?.underPressure && (
        <DetailField label="Under Pressure" value={character.facets.underPressure} />
      )}
      {character.voiceSamples && character.voiceSamples.length > 0 && (
        <DetailField label="Voice" value={character.voiceSamples[0] ?? ''} />
      )}
    </div>
  );
}

function RelationshipDetail({
  rel,
  characters,
}: {
  rel: Relationship;
  characters: Map<string, Character>;
}): React.ReactElement {
  const source = characters.get(rel.sourceId);
  const target = characters.get(rel.targetId);
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Type" value={rel.type} />
      <DetailField label="Between" value={`${source?.name ?? '?'} \u2194 ${target?.name ?? '?'}`} />
      {rel.joinReason && <DetailField label="Bond" value={rel.joinReason} />}
      {rel.independentGoal && <DetailField label="Goal" value={rel.independentGoal} />}
      {rel.evolution && <DetailField label="Evolution" value={rel.evolution} />}
    </div>
  );
}

function LocationDetail({ location }: { location: Location }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {location.type && <DetailField label="Type" value={location.type} />}
      {location.atmosphere && <DetailField label="Atmosphere" value={location.atmosphere} />}
      {location.significance && <DetailField label="Significance" value={location.significance} />}
    </div>
  );
}

function ArcDetail({ arc }: { arc: Arc }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Type" value={arc.type} />
      <DetailField label="Status" value={arc.status} />
      {typeof arc.progress === 'number' && (
        <DetailField label="Progress" value={`${arc.progress}%`} />
      )}
      {arc.sections && arc.sections.length > 0 && (
        <DetailField
          label="Sections"
          value={arc.sections.map((s) => `${s.name} (${s.status})`).join(', ')}
        />
      )}
    </div>
  );
}

function ForeshadowingDetail({ item }: { item: Foreshadowing }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Content" value={item.content} />
      <DetailField label="Status" value={item.status} />
      {item.plantedText && <DetailField label="Planted" value={item.plantedText} />}
    </div>
  );
}

function HookDetail({ hook }: { hook: Hook }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      <DetailField label="Content" value={hook.content} />
      {hook.hookType && <DetailField label="Hook Type" value={hook.hookType} />}
      {typeof hook.strength === 'number' && (
        <DetailField label="Strength" value={`${hook.strength}/100`} />
      )}
    </div>
  );
}

function FactionDetail({ faction }: { faction: Faction }): React.ReactElement {
  return (
    <div className={styles.detailGrid}>
      {faction.type && <DetailField label="Type" value={faction.type} />}
      {faction.stanceToMC && <DetailField label="Stance to MC" value={faction.stanceToMC} />}
      {faction.internalConflict && (
        <DetailField label="Conflict" value={faction.internalConflict} />
      )}
      {faction.goals && faction.goals.length > 0 && (
        <DetailField label="Goals" value={faction.goals.join('; ')} />
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className={styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

// ───────────────────────────────────────────
// Context Item Builders
// ───────────────────────────────────────────

const L5_PRIORITY = 200;

function buildCharacterContext(c: Character): ContextItem {
  const parts = [c.name, c.role];
  if (c.appearance) parts.push(c.appearance);
  if (c.motivation?.surface) parts.push(`Motivation: ${c.motivation.surface}`);
  return {
    type: 'character' as ContextItemType,
    id: c.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

function buildRelationshipContext(rel: Relationship, charMap: Map<string, Character>): ContextItem {
  const source = charMap.get(rel.sourceId)?.name ?? rel.sourceId;
  const target = charMap.get(rel.targetId)?.name ?? rel.targetId;
  const parts = [`${source} \u2192 ${target}: ${rel.type}`];
  if (rel.joinReason) parts.push(`Bond: ${rel.joinReason}`);
  return {
    type: 'relationship' as ContextItemType,
    id: `rel-${rel.id}`,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

function buildLocationContext(l: Location): ContextItem {
  const parts = [l.name];
  if (l.atmosphere) parts.push(`Atmosphere: ${l.atmosphere}`);
  if (l.significance) parts.push(`Significance: ${l.significance}`);
  return {
    type: 'location' as ContextItemType,
    id: l.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

function buildArcContext(arc: Arc): ContextItem {
  const parts = [`Arc: ${arc.name}`, `Type: ${arc.type}`, `Status: ${arc.status}`];
  return {
    type: 'arc' as ContextItemType,
    id: arc.id,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

function buildForeshadowingContext(f: Foreshadowing): ContextItem {
  return {
    type: 'foreshadowing' as ContextItemType,
    id: f.id,
    content: `[Foreshadowing] ${f.content} (${f.status})`,
    priority: L5_PRIORITY,
  };
}

function buildHookContext(h: Hook): ContextItem {
  return {
    type: 'hook' as ContextItemType,
    id: h.id,
    content: `[Hook] ${h.content}`,
    priority: L5_PRIORITY,
  };
}

function buildFactionContext(f: Faction): ContextItem {
  const parts = [f.name];
  if (f.stanceToMC) parts.push(`Stance: ${f.stanceToMC}`);
  if (f.internalConflict) parts.push(`Conflict: ${f.internalConflict}`);
  return {
    type: 'custom' as ContextItemType,
    id: `faction-${f.id}`,
    content: parts.join('\n'),
    priority: L5_PRIORITY,
  };
}

// ───────────────────────────────────────────
// Main Panel
// ───────────────────────────────────────────

export function StoryBiblePanel(): React.ReactElement {
  const queryClient = useQueryClient();
  const selectedId = useSelectedChapterId();
  const { data: chapter } = useChapterWithContent(selectedId);
  const { data: allChars } = useCharacters();
  const { data: allRels } = useRelationships();
  const { data: allLocations } = useLocations();
  const { data: allArcs } = useArcs();
  const { data: allForeshadowing } = useForeshadowing();
  const { data: allHooks } = useHooks(selectedId ?? undefined);
  const { data: world } = useWorld();
  const { data: allFactions } = useFactions();

  const updateChapter = useUpdateChapter();
  const injectedEntities = useInjectedEntities();
  const { injectEntity, removeInjectedEntity } = useEditorActions();

  const [filterText, setFilterText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const injectedIds = useMemo(
    () => new Set(injectedEntities.map((e) => e.id).filter(Boolean)),
    [injectedEntities]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Link/Unlink entity handlers
  const handleLinkCharacter = useCallback(
    (characterId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.characters ?? []), characterId];
      updateChapter.mutate(
        { id: selectedId, data: { characters: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleUnlinkCharacter = useCallback(
    (characterId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.characters ?? []).filter((id) => id !== characterId);
      updateChapter.mutate(
        { id: selectedId, data: { characters: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleLinkLocation = useCallback(
    (locationId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.locations ?? []), locationId];
      updateChapter.mutate(
        { id: selectedId, data: { locations: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleUnlinkLocation = useCallback(
    (locationId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.locations ?? []).filter((id) => id !== locationId);
      updateChapter.mutate(
        { id: selectedId, data: { locations: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleLinkForeshadowing = useCallback(
    (foreshadowingId: string) => {
      if (!selectedId || !chapter) return;
      const updated = [...(chapter.foreshadowingHinted ?? []), foreshadowingId];
      updateChapter.mutate(
        { id: selectedId, data: { foreshadowingHinted: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleUnlinkForeshadowing = useCallback(
    (foreshadowingId: string) => {
      if (!selectedId || !chapter) return;
      const updated = (chapter.foreshadowingHinted ?? []).filter((id) => id !== foreshadowingId);
      updateChapter.mutate(
        { id: selectedId, data: { foreshadowingHinted: updated } },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, chapter, updateChapter, queryClient]
  );

  const handleArcChange = useCallback(
    (arcId: string) => {
      if (!selectedId) return;
      // Build data object conditionally for exactOptionalPropertyTypes
      const data: { arcId?: string } = {};
      if (arcId !== '') {
        data.arcId = arcId;
      }
      updateChapter.mutate(
        { id: selectedId, data },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries({
              queryKey: contextKeys.build(selectedId, undefined),
            });
          },
        }
      );
    },
    [selectedId, updateChapter, queryClient]
  );

  if (!selectedId || !chapter) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>Select a chapter to see its Story Bible references</div>
      </div>
    );
  }

  const filter = filterText.trim().toLowerCase();
  const matchFilter = (name: string) => !filter || name.toLowerCase().includes(filter);

  // Character map for relationship display
  const charMap = new Map((allChars ?? []).map((c) => [c.id, c]));

  // Linked entity ID sets
  const linkedCharIds = new Set(chapter.characters ?? []);
  const linkedLocIds = new Set(chapter.locations ?? []);
  const linkedForeshadowingIds = new Set(chapter.foreshadowingHinted ?? []);

  // 1. Characters — show ALL, sorted by linked first
  const allCharacters = (allChars ?? []).filter((c) => matchFilter(c.name));
  const characters = [
    ...allCharacters.filter((c) => linkedCharIds.has(c.id)),
    ...allCharacters.filter((c) => !linkedCharIds.has(c.id)),
  ];

  // 2. Relationships — scoped to chapter characters (only show if both chars are linked)
  const chapterCharIds = new Set(chapter.characters ?? []);
  const relationships = (allRels ?? []).filter(
    (r) =>
      chapterCharIds.has(r.sourceId) &&
      chapterCharIds.has(r.targetId) &&
      matchFilter(`${charMap.get(r.sourceId)?.name ?? ''} ${charMap.get(r.targetId)?.name ?? ''}`)
  );

  // 3. Locations — show ALL, sorted by linked first
  const allLocs = (allLocations ?? []).filter((l) => matchFilter(l.name));
  const locations = [
    ...allLocs.filter((l) => linkedLocIds.has(l.id)),
    ...allLocs.filter((l) => !linkedLocIds.has(l.id)),
  ];

  // 4. Arc — single arc from chapter.arcId (dropdown selection)
  const arc = chapter.arcId ? (allArcs ?? []).find((a) => a.id === chapter.arcId) : undefined;

  // 5. Foreshadowing — show ALL, sorted by linked first
  const allForeshadowingItems = (allForeshadowing ?? []).filter((f) => matchFilter(f.content));
  const foreshadowing = [
    ...allForeshadowingItems.filter((f) => linkedForeshadowingIds.has(f.id)),
    ...allForeshadowingItems.filter((f) => !linkedForeshadowingIds.has(f.id)),
  ];

  // 6. Hooks — filtered by chapter (already from useHooks, no change)
  const hooks = (allHooks ?? []).filter((h) => matchFilter(h.content));

  // 7. World — always available (no chapter filter, no change)
  const hasWorld =
    (world?.powerSystem?.coreRules?.length ?? 0) > 0 ||
    (world?.socialRules && Object.keys(world.socialRules).length > 0);

  // 8. Factions — all factions (no linking supported yet, no change)
  const factions = (allFactions ?? []).filter((f) => matchFilter(f.name));

  // Count linked entities for section headers
  const linkedCharCount = characters.filter((c) => linkedCharIds.has(c.id)).length;
  const linkedLocCount = locations.filter((l) => linkedLocIds.has(l.id)).length;
  const linkedForeshadowingCount = foreshadowing.filter((f) =>
    linkedForeshadowingIds.has(f.id)
  ).length;

  return (
    <div className={styles.panel}>
      {/* Entity extraction review */}
      <ExtractionReview />

      {/* Setup assist suggestions */}
      <SetupAssistPanel />

      {/* Quick-search filter */}
      <div className={styles.filterRow}>
        <input
          className={styles.filterInput}
          type="text"
          placeholder="Filter..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {filterText && (
          <button className={styles.filterClear} onClick={() => setFilterText('')}>
            &times;
          </button>
        )}
      </div>

      {/* 1. Characters */}
      <Section
        title={`Characters (${linkedCharCount} / ${characters.length})`}
        count={linkedCharCount}
      >
        {characters.length === 0 && <p className={styles.emptySection}>No characters available</p>}
        {characters.map((c) => (
          <EntityItem
            key={c.id}
            id={c.id}
            name={c.name}
            badge={c.role}
            badgeVariant="primary"
            isLinked={linkedCharIds.has(c.id)}
            onLink={() => handleLinkCharacter(c.id)}
            onUnlink={() => handleUnlinkCharacter(c.id)}
            isPinned={injectedIds.has(c.id)}
            onPin={() => injectEntity(buildCharacterContext(c))}
            onUnpin={() => removeInjectedEntity(c.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <CharacterDetail character={c} />
          </EntityItem>
        ))}
      </Section>

      {/* 2. Relationships */}
      <Section title="Relationships" count={relationships.length} defaultOpen={false}>
        {relationships.length === 0 && (
          <p className={styles.emptySection}>No relationships between linked characters</p>
        )}
        {relationships.map((r) => {
          const relId = `rel-${r.id}`;
          const source = charMap.get(r.sourceId);
          const target = charMap.get(r.targetId);
          const name = `${source?.name ?? '?'} \u2194 ${target?.name ?? '?'}`;
          return (
            <EntityItem
              key={relId}
              id={relId}
              name={name}
              badge={r.type}
              isPinned={injectedIds.has(relId)}
              onPin={() => injectEntity(buildRelationshipContext(r, charMap))}
              onUnpin={() => removeInjectedEntity(relId)}
              expandedId={expandedId}
              onToggleExpand={toggleExpand}
            >
              <RelationshipDetail rel={r} characters={charMap} />
            </EntityItem>
          );
        })}
      </Section>

      {/* 3. Locations */}
      <Section title={`Locations (${linkedLocCount} / ${locations.length})`} count={linkedLocCount}>
        {locations.length === 0 && <p className={styles.emptySection}>No locations available</p>}
        {locations.map((l) => (
          <EntityItem
            key={l.id}
            id={l.id}
            name={l.name}
            {...(l.type ? { badge: l.type } : {})}
            isLinked={linkedLocIds.has(l.id)}
            onLink={() => handleLinkLocation(l.id)}
            onUnlink={() => handleUnlinkLocation(l.id)}
            isPinned={injectedIds.has(l.id)}
            onPin={() => injectEntity(buildLocationContext(l))}
            onUnpin={() => removeInjectedEntity(l.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <LocationDetail location={l} />
          </EntityItem>
        ))}
      </Section>

      {/* 4. Arc */}
      <Section title="Arc" count={chapter.arcId ? 1 : 0} defaultOpen={false}>
        {(allArcs ?? []).length === 0 ? (
          <p className={styles.emptySection}>No arcs created</p>
        ) : (
          <div className={styles.arcSelector}>
            <label className={styles.arcLabel}>Assign chapter to arc:</label>
            <div className={styles.arcSelectRow}>
              <Select
                size="sm"
                value={chapter.arcId ?? ''}
                onChange={(e) => handleArcChange(e.target.value)}
                placeholder="-- No arc --"
                options={[
                  { value: '', label: '-- No arc --' },
                  ...(allArcs ?? []).map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.status})`,
                  })),
                ]}
              />
              {arc && (
                <button
                  className={`${styles.pinButton} ${injectedIds.has(arc.id) ? styles.pinned : ''}`}
                  onClick={() => {
                    if (injectedIds.has(arc.id)) {
                      removeInjectedEntity(arc.id);
                    } else {
                      injectEntity(buildArcContext(arc));
                    }
                  }}
                  title={
                    injectedIds.has(arc.id) ? 'Unpin from context' : 'Pin to AI context (temporary)'
                  }
                >
                  {injectedIds.has(arc.id) ? '\u2605' : '\u2606'}
                </button>
              )}
            </div>
            {arc && (
              <div className={styles.arcDetail}>
                <ArcDetail arc={arc} />
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 5. Foreshadowing */}
      <Section
        title={`Foreshadowing (${linkedForeshadowingCount} / ${foreshadowing.length})`}
        count={linkedForeshadowingCount}
        defaultOpen={false}
      >
        {foreshadowing.length === 0 && (
          <p className={styles.emptySection}>No foreshadowing items available</p>
        )}
        {foreshadowing.map((f) => (
          <EntityItem
            key={f.id}
            id={f.id}
            name={f.content.length > 50 ? f.content.slice(0, 50) + '...' : f.content}
            badge={f.status}
            badgeVariant={f.status === 'active' ? 'primary' : 'muted'}
            isLinked={linkedForeshadowingIds.has(f.id)}
            onLink={() => handleLinkForeshadowing(f.id)}
            onUnlink={() => handleUnlinkForeshadowing(f.id)}
            isPinned={injectedIds.has(f.id)}
            onPin={() => injectEntity(buildForeshadowingContext(f))}
            onUnpin={() => removeInjectedEntity(f.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <ForeshadowingDetail item={f} />
          </EntityItem>
        ))}
      </Section>

      {/* 6. Hooks */}
      <Section title="Hooks" count={hooks.length} defaultOpen={false}>
        {hooks.length === 0 && <p className={styles.emptySection}>No hooks for this chapter</p>}
        {hooks.map((h) => (
          <EntityItem
            key={h.id}
            id={h.id}
            name={h.content.length > 50 ? h.content.slice(0, 50) + '...' : h.content}
            {...(h.hookType ? { badge: h.hookType } : {})}
            isPinned={injectedIds.has(h.id)}
            onPin={() => injectEntity(buildHookContext(h))}
            onUnpin={() => removeInjectedEntity(h.id)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <HookDetail hook={h} />
          </EntityItem>
        ))}
      </Section>

      {/* 7. World */}
      <Section title="World" count={hasWorld ? 1 : 0} defaultOpen={false}>
        {!hasWorld && <p className={styles.emptySection}>No world rules configured</p>}
        {world?.powerSystem?.coreRules && world.powerSystem.coreRules.length > 0 && (
          <div className={styles.worldBlock}>
            <span className={styles.worldLabel}>Power System: {world.powerSystem.name}</span>
            {world.powerSystem.levels && world.powerSystem.levels.length > 0 && (
              <span className={styles.worldDetail}>
                Levels: {world.powerSystem.levels.join(' \u2192 ')}
              </span>
            )}
            <span className={styles.worldDetail}>
              Rules: {world.powerSystem.coreRules.join('; ')}
            </span>
          </div>
        )}
        {world?.socialRules && Object.keys(world.socialRules).length > 0 && (
          <div className={styles.worldBlock}>
            <span className={styles.worldLabel}>Social Rules</span>
            {Object.entries(world.socialRules).map(([key, value]) => (
              <span key={key} className={styles.worldDetail}>
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* 8. Factions */}
      <Section title="Factions" count={factions.length} defaultOpen={false}>
        {factions.length === 0 && <p className={styles.emptySection}>No factions created</p>}
        {factions.map((f) => (
          <EntityItem
            key={f.id}
            id={`faction-${f.id}`}
            name={f.name}
            {...(f.stanceToMC
              ? {
                  badge: f.stanceToMC,
                  badgeVariant:
                    f.stanceToMC === 'friendly'
                      ? ('success' as const)
                      : f.stanceToMC === 'hostile'
                        ? ('danger' as const)
                        : ('muted' as const),
                }
              : {})}
            isPinned={injectedIds.has(`faction-${f.id}`)}
            onPin={() => injectEntity(buildFactionContext(f))}
            onUnpin={() => removeInjectedEntity(`faction-${f.id}`)}
            expandedId={expandedId}
            onToggleExpand={toggleExpand}
          >
            <FactionDetail faction={f} />
          </EntityItem>
        ))}
      </Section>
    </div>
  );
}
