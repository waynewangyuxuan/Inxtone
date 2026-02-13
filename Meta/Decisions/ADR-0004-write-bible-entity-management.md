# ADR-0004: Write Page Bible Panel Entity Management & Context Auto-Rebuild

- **Status**: Accepted
- **Date**: 2026-02-12
- **Deciders**: Wayne

## Context

### Problem 1: No Direct UI for Adding Entities to Chapter

Currently, the Story Bible Panel in the Write page only displays entities already linked to the chapter (via `chapter.characters`, `chapter.locations` FK arrays). Users cannot directly add entities from the Bible panel to the current chapter.

**Current user pain**:
- Want to add a character to the chapter → no UI entry point
- Must either: (A) use Setup Assist suggestions, or (B) manually edit chapter metadata form with entity IDs

### Problem 2: Pin vs Link Semantic Confusion

Two separate concepts exist but are conflated:
- **Pin** (star icon ☆/★): Temporarily inject entity to L5 context (not persisted)
- **Link** (missing): Permanently add entity to chapter FK array (persisted)

Users expect pinning to save the entity to the chapter, but it doesn't.

### Problem 3: Context Not Auto-Rebuilding

**Issue 3.1**: When entities are added to chapter, context doesn't rebuild automatically
- User adds entity → `chapter.characters` updates → React Query invalidates
- But `useBuildContext` doesn't re-run (query key unchanged)
- AI generation may not see the newly added entity

**Issue 3.2**: When outline is saved, context doesn't rebuild
- User edits outline → auto-saves after 1.5s → chapter.outline updates
- But context still uses old outline
- AI generation may use outdated outline goals

## Decision

### 1. Show All Entities with Link/Unlink Actions

**UI Change**:
```
Characters (2 linked / 5 total)

  [✓] ☆ 林墨渊 [Main]        ← Linked to chapter
  [✓] ☆ 苏灵儿 [Support]
  [ ] ☆ 张天师 [Villain]      ← Not linked, can click to add
  [ ] ☆ 李师姐 [Support]
  [ ] ☆ 方长老 [Mentor]
```

**Entity-Specific Behaviors**:
| Entity Type | Link/Unlink | Rationale |
|-------------|-------------|-----------|
| **Characters** | ✅ Checkbox | Many-to-many FK array |
| **Locations** | ✅ Checkbox | Many-to-many FK array |
| **Foreshadowing** | ✅ Checkbox | Many-to-many FK array |
| **Relationships** | ❌ No UI | Derived from character links |
| **Arc** | 🔽 Dropdown | 1:1 relationship, select from list |
| **Hooks** | ❌ No UI | Managed via Outline panel |
| **World** | ❌ No UI | Always available globally |
| **Factions** | ❌ Not yet | Future feature |

**Semantics**:
| Operation | Scope | Persisted | UI |
|-----------|-------|-----------|-----|
| **Link to Chapter** | Chapter FK array | ✅ Yes | `[✓]` checkbox |
| **Pin to Context** | L5 temporary injection | ❌ No | `★` star |

### 2. Auto-Rebuild Context on Chapter FK Updates

**Implementation**: Add `onSuccess` callback to `updateChapter` mutation to invalidate context queries.

```typescript
// StoryBiblePanel.tsx
const handleLinkEntity = (entityId, entityType) => {
  updateChapter.mutate(
    { id: chapterId, data: { [entityType]: [...existing, entityId] } },
    {
      onSuccess: () => {
        // Trigger context rebuild
        queryClient.invalidateQueries(contextKeys.build(chapterId, undefined));
      }
    }
  );
};
```

### 3. Auto-Rebuild Context on Outline Save

**Implementation**: In `OutlinePanel`, add context invalidation after successful save.

```typescript
// OutlinePanel.tsx
scheduleOutlineSave = (outline) => {
  updateChapter.mutate(
    { id: chapterId, data: { outline } },
    {
      onSuccess: () => {
        setSaveState('saved');
        // Trigger context rebuild
        queryClient.invalidateQueries(contextKeys.build(chapterId, undefined));
      }
    }
  );
};
```

### 4. Simplify Context Preview UI

**Problem**: Original design had checkboxes in Context Preview panel for excluding entities, creating confusing dual-control layer.

**Decision**: Remove checkboxes, redesign as **expandable cards**:
```
Context Preview
  ▶ Characters (3)         ← Click to expand
  ▼ Locations (2)          ← Expanded shows names
    - 青云宗
    - 天剑峰
  ▶ Foreshadowing (1)
```

**Benefits**:
- Simpler mental model: Link controls inclusion, Pin emphasizes temporarily
- Clearer visibility of what's in context
- Reduces UI clutter

## Alternatives Considered

### Alternative 1: Use Pin Icon for Both Temporary and Permanent

- **Pros**: Single button, simpler UI
- **Cons**: Loses semantic distinction between temporary emphasis and permanent inclusion
- **Why not**: Conflates two different use cases. Pin is useful for one-off "pay attention to this detail" scenarios.

### Alternative 2: Modal/Dropdown for Adding Entities

- **Pros**: More explicit action
- **Cons**: Extra clicks, breaks flow
- **Why not**: Checkbox is more immediate and doesn't require modal interaction

### Alternative 3: Auto-Rebuild Context via useBuildContext Hook Dependencies

- **Pros**: More reactive, no manual invalidation
- **Cons**: Complex dependency tracking, may cause excessive rebuilds
- **Why not**: Manual invalidation is more explicit and controllable

### Alternative 4: Keep Context Preview Checkboxes

- **Pros**: Granular control over what appears in context
- **Cons**: Confusing dual-control layer (Link checkbox + Context checkbox), cognitive overhead
- **Why not**: Over-engineering. If entity is linked but user doesn't want it in context temporarily, they can unlink it. Simpler mental model wins.

## Consequences

### Positive

- **Immediate entity management**: Users can add/remove entities without leaving Write page
- **Clear semantics**:
  - Checkbox = permanent link to chapter
  - Star = temporary emphasis for next generation
  - Dropdown = Arc assignment (1:1 relationship)
- **Up-to-date context**: AI always uses latest chapter metadata and outline
- **Better UX**: No need to memorize entity IDs or navigate to Bible page
- **Simpler Context UI**: Expandable cards reduce clutter, clearer visibility

### Negative

- **Slightly more visual clutter**: Showing all entities instead of just linked ones
- **Performance**: More entities to render (mitigated by React virtualization if needed)
- **Arc dropdown requires more clicks**: Changing Arc is less immediate than checkbox toggle

### Risks

- **Context rebuild cost**: Frequent rebuilds could be expensive
  - *Mitigation*: Context building is cached (staleTime: 5min), only rebuilds when explicitly invalidated
- **User confusion about UI patterns**: Different entity types have different controls
  - *Mitigation*: Tooltips + consistent patterns (many-to-many = checkbox, 1:1 = dropdown, derived = no control)

## Related

- **ADR-0002**: AI Context Injection Strategy (defines L5 temporary injection)
- **Module**: `02_writing_service.md` (chapter management)
- **Module**: `05_ai_service.md` (context builder)
- **Product Doc**: Writing workspace UX improvements
