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

- Checkbox `[✓]` / `[ ]` indicates linked status
- Click checkbox → toggle link/unlink
- Pin icon `☆/★` remains for temporary L5 injection

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

## Consequences

### Positive

- **Immediate entity management**: Users can add/remove entities without leaving Write page
- **Clear semantics**: Checkbox = permanent, Star = temporary
- **Up-to-date context**: AI always uses latest chapter metadata and outline
- **Better UX**: No need to memorize entity IDs or navigate to Bible page

### Negative

- **Slightly more visual clutter**: Showing all entities instead of just linked ones
- **Performance**: More entities to render (mitigated by React virtualization if needed)

### Risks

- **Context rebuild cost**: Frequent rebuilds could be expensive
  - *Mitigation*: Context building is cached (staleTime: 5min), only rebuilds when explicitly invalidated
- **User confusion about checkbox vs star**: Need tooltip/documentation
  - *Mitigation*: Clear tooltips ("Add to chapter" vs "Pin for this generation")

## Related

- **ADR-0002**: AI Context Injection Strategy (defines L5 temporary injection)
- **Module**: `02_writing_service.md` (chapter management)
- **Module**: `05_ai_service.md` (context builder)
- **Product Doc**: Writing workspace UX improvements
