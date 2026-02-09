# ADR-0002: AI Context Injection Strategy

- **Status**: Proposed
- **Date**: 2026-02-08
- **Deciders**: Wayne

## Context

Inxtone's AI generation methods have two fundamentally different context needs:

1. **Chapter-scoped** (FK-driven): "Generate content relevant to *this specific chapter*"
2. **Global** (Story Bible-wide): "Answer questions about *the entire story*"

ContextBuilder was designed for case 1 — it takes a `chapterId` and walks FK references (characters, locations, arc, foreshadowing) to assemble precisely scoped context. But only `continueScene` uses it. The other methods either bypass it entirely or use ad-hoc manual `findAll()` injection scattered across AIService.

After fixing the immediate issues (#20-#26), the architecture question remains: **how should each generation method get its context?**

### Current Flow (Post-Fix)

```
                        AI Sidebar (Phase 4)
                        User clicks "Continue" / "Dialogue" / "Describe" / "Brainstorm"
                                    |
                                    v
                    +-------------------------------+
                    |         API Routes            |
                    |  POST /continue { chapterId } |
                    |  POST /dialogue { charIds }   |
                    |  POST /brainstorm { topic }   |
                    +-------------------------------+
                                    |
                                    v
     +--------------------------------------------------------------+
     |                       AIService                               |
     |                                                               |
     |  continueScene(chapterId)                                     |
     |    |                                                          |
     |    +---> ContextBuilder.build(chapterId)  ----+               |
     |    |       L1: chapter content/outline/tail   |               |
     |    |       L2: characters, locations, arc     | 5-layer       |
     |    |       L3: foreshadowing, hooks           | FK-driven     |
     |    |       L4: world rules                    |               |
     |    |       L5: user-selected                  |               |
     |    |                                     <----+               |
     |    +---> PromptAssembler.assemble('continue', ...)            |
     |                                                               |
     |  generateDialogue(characterIds)        <-- NO chapterId       |
     |    +---> formatCharacter() x N         <-- manual, L2 subset  |
     |    +---> getScopedRelationships()      <-- manual, L2 subset  |
     |    +---> PromptAssembler.assemble('dialogue', ...)            |
     |                                                               |
     |  describeScene(locationId)             <-- NO chapterId       |
     |    +---> worldRepo.get()               <-- manual, L4 subset  |
     |    +---> PromptAssembler.assemble('describe', ...)            |
     |                                                               |
     |  brainstorm(topic)                     <-- NO chapterId       |
     |    +---> characterRepo.findAll()       <-- ad-hoc, GLOBAL     |
     |    +---> arcRepo.findAll()             <-- ad-hoc, GLOBAL     |
     |    +---> foreshadowingRepo.findActive() <- ad-hoc, GLOBAL     |
     |    +---> PromptAssembler.assemble('brainstorm', ...)          |
     |                                                               |
     |  askStoryBible(question)               <-- NO chapterId       |
     |    +---> characterRepo.findAll()       <-- ad-hoc, GLOBAL     |
     |    +---> relationshipRepo.findAll()    <-- ad-hoc, GLOBAL     |
     |    +---> arcRepo.findAll()             <-- ad-hoc, GLOBAL     |
     |    +---> locationRepo.findAll()        <-- ad-hoc, GLOBAL     |
     |    +---> foreshadowingRepo.findAll()   <-- ad-hoc, GLOBAL     |
     |    +---> worldRepo.get()               <-- ad-hoc, GLOBAL     |
     |    +---> PromptAssembler.assemble('ask_bible', ...)           |
     +--------------------------------------------------------------+
```

### The Gap

In Phase 4's AI Sidebar, users trigger ALL generation actions while editing a specific chapter.
The `chapterId` is always available at the UI level but only `continueScene` receives it:

```
  +------------------+     +------------------+     +------------------+
  |  Editor Panel    |     |   AI Sidebar     |     |   AIService      |
  |                  |     |                  |     |                  |
  |  chapter #5      |---->|  [Continue]  ----+---->|  continueScene   |
  |  editing...      |     |  [Dialogue]  ----+---->|  generateDialogue|
  |                  |     |  [Describe]  ----+---->|  describeScene   |
  |                  |     |  [Brainstorm]----+---->|  brainstorm      |
  +------------------+     +------------------+     +------------------+
                                                          |
                                  chapterId available ----+---- but only
                                  in ALL sidebar actions       continueScene
                                                               uses it
```

Additionally, the ad-hoc `findAll()` calls in AIService create a maintenance problem:
context assembly logic is scattered across 4 methods instead of centralized.

## Decision

### Class Hierarchy: BaseContextBuilder + Two Subclasses

Extract shared logic into a `BaseContextBuilder`, with two concrete subclasses:

```
  +-----------------------------------------------+
  |          BaseContextBuilder (abstract)          |
  |                                                |
  |  Shared infrastructure:                        |
  |  - formatContext(items)     format → markdown  |
  |  - formatCharacter(char)   char → readable str |
  |  - getScopedRelationships(charIds)             |
  |  - truncateToFitBudget(items, budget)          |
  |  - token budget constants                      |
  |                                                |
  |  Shared deps: all repositories                 |
  +----------------------+------------------------+
                         |
            +------------+------------+
            |                         |
  +---------v---------+    +----------v----------+
  | ChapterContext    |    | GlobalContext        |
  | Builder           |    | Builder              |
  |                   |    |                      |
  | build(chapterId)  |    | buildFull()          |
  |   L1: content,    |    |   All characters     |
  |       outline,    |    |   All relationships  |
  |       prev tail   |    |   All arcs           |
  |   L2: FK chars,   |    |   All locations      |
  |       locs, arc,  |    |   All foreshadowing  |
  |       rels        |    |   World rules        |
  |   L3: foreshadow, |    |                      |
  |       hooks       |    | buildSummary()       |
  |   L4: world rules |    |   Char names+roles   |
  |   L5: user items  |    |   Arc names+status   |
  |                   |    |   Active foreshadow  |
  +-------------------+    +----------------------+
```

### How AIService Uses Them

```
  +--------------------------------------------------------------+
  |                       AIService                               |
  |                                                               |
  |  deps: chapterCB: ChapterContextBuilder                      |
  |        globalCB:  GlobalContextBuilder                        |
  |                                                               |
  |  continueScene(chapterId)                                     |
  |    +---> chapterCB.build(chapterId)                           |
  |    +---> filter chapter_content                               |
  |    +---> assemble('continue', ...)                            |
  |                                                               |
  |  generateDialogue(charIds, ..., chapterId?)                   |
  |    +---> if chapterId:                                        |
  |    |       chapterCB.build(chapterId)                         |
  |    |       filter chars/rels (already in method params)       |
  |    |     else:                                                |
  |    |       manual formatCharacter + getScopedRelationships    |
  |    +---> assemble('dialogue', ...)                            |
  |                                                               |
  |  describeScene(locationId, ..., chapterId?)                   |
  |    +---> if chapterId:                                        |
  |    |       chapterCB.build(chapterId)                         |
  |    |       filter locations (already in method params)        |
  |    |     else:                                                |
  |    |       manual worldRepo.get()                             |
  |    +---> assemble('describe', ...)                            |
  |                                                               |
  |  brainstorm(topic, ..., chapterId?)                           |
  |    +---> globalCB.buildSummary()           <-- always         |
  |    +---> if chapterId:                                        |
  |    |       chapterCB.build(chapterId)      <-- augment        |
  |    |       merge (global + chapter focus)                     |
  |    +---> assemble('brainstorm', ...)                          |
  |                                                               |
  |  askStoryBible(question)                                      |
  |    +---> globalCB.buildFull()              <-- always         |
  |    +---> assemble('ask_bible', ...)                           |
  +--------------------------------------------------------------+
```

### Key Design Points

**What goes in BaseContextBuilder:**
- `formatContext(items)` — groups items by type, renders markdown sections
- `formatCharacter(character)` — character → readable context string
- `getScopedRelationships(charIds)` — fetch relationships between given characters
- `truncateToFitBudget(items, budget)` — priority-based truncation
- Token budget constants
- All repository deps

**What goes in ChapterContextBuilder:**
- `build(chapterId, additionalItems?)` — existing 5-layer FK-based assembly
- `buildL1Required()` through `buildL5UserSelected()` — layer builders
- `getPreviousChapter()` — chapter ordering logic

**What goes in GlobalContextBuilder:**
- `buildFull()` — comprehensive: all entities with moderate detail (for askStoryBible)
- `buildSummary()` — lightweight: names + status only (for brainstorm)
- Both return `BuiltContext` with same token budget/truncation

**Output type is the same** — both return `BuiltContext { items, totalTokens, truncated }`,
so `formatContext()` works on either output. AIService doesn't need to know which
builder produced the items.

### Summary Matrix

```
  +-------------------+------------+---------+---------------------------+
  | Method            | chapterId? | Builder | Context Source             |
  +-------------------+------------+---------+---------------------------+
  | continueScene     | required   | Chapter | ChapterCB.build()         |
  | generateDialogue  | optional   | Both    | ChapterCB or fallback     |
  | describeScene     | optional   | Both    | ChapterCB or fallback     |
  | brainstorm        | optional   | Both    | GlobalCB.buildSummary()   |
  |                   |            |         | + ChapterCB.build() merge |
  | askStoryBible     | never      | Global  | GlobalCB.buildFull()      |
  | complete          | never      | —       | Caller provides items     |
  +-------------------+------------+---------+---------------------------+
```

### API Route Changes

```
  POST /dialogue   { characterIds, context, chapterId?, instruction?, options? }
  POST /describe   { locationId, mood, chapterId?, instruction?, options? }
  POST /brainstorm { topic, chapterId?, instruction?, options? }
  POST /ask        { question, options? }              <-- unchanged
  POST /continue   { chapterId, instruction?, options? } <-- unchanged
```

## Alternatives Considered

### Alternative 1: Keep ad-hoc findAll() in AIService (status quo)
- **Pros**: No refactoring needed, already working
- **Cons**: Context assembly scattered across 4 AIService methods; duplicates
  formatting logic; changing context strategy requires touching every method
- **Why not**: Violates single responsibility; ad-hoc code is harder to test
  and maintain than a dedicated builder

### Alternative 2: Single ContextBuilder with build() + buildGlobal() methods
- **Pros**: Simpler — one class, two methods
- **Cons**: Class grows large (already 514 lines); chapter-scoped and global
  logic have different concerns (FK walking vs findAll aggregation); harder to
  test in isolation
- **Why not**: Subclass approach gives better separation and testability
  without significant added complexity

### Alternative 3: Always require chapterId on all methods
- **Pros**: Uniform interface, always have full context
- **Cons**: `askStoryBible` doesn't need chapter scope; methods become unusable
  outside chapter editing context (CLI usage, standalone brainstorm)
- **Why not**: Over-constrains the API; some methods are genuinely chapter-independent

## Consequences

### Positive
- All context assembly centralized in two builder classes, out of AIService
- `askStoryBible` ad-hoc code (~80 lines) moves to `GlobalCB.buildFull()` — testable in isolation
- `brainstorm` ad-hoc code moves to `GlobalCB.buildSummary()` — same benefit
- Changing global context strategy (e.g. adding hooks, timeline events) only touches one class
- Both builders share formatting/truncation via inheritance — no duplication
- `generateDialogue`/`describeScene` get chapter context when available (outline, foreshadowing)

### Negative
- 3 files instead of 1 (base + chapter + global), slightly more navigation
- Need to update AIService constructor to inject both builders

### Risks
- **Token budget conflict**: ChapterCB + GlobalCB items merged could exceed budget
  - Mitigation: Merge into single items array, apply `truncateToFitBudget()` once
- **Over-abstraction**: Two subclasses for what could be one class
  - Mitigation: Keep subclasses thin; most logic lives in base. If too complex, can
    collapse back to single class with two methods

## Related

- [#27](https://github.com/VW-ai/Inxtone/issues/27) — Implementation issue
- [#20](https://github.com/VW-ai/Inxtone/issues/20) — continueScene content duplication (fixed)
- [#21](https://github.com/VW-ai/Inxtone/issues/21) — generateDialogue character context (fixed)
- [#23](https://github.com/VW-ai/Inxtone/issues/23) — Methods context enrichment (fixed, ad-hoc)
- [03_ai_service.md](../Modules/03_ai_service.md) — AI Service module design
