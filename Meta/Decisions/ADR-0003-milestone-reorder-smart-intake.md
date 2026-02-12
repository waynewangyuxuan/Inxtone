# ADR-0003: Milestone Reorder — Smart Intake Before Search & Quality

- **Status**: Proposed
- **Date**: 2026-02-11
- **Deciders**: Wayne

## Context

After completing M1–M3.5 (Foundation → Story Bible → Writing → Hackathon), the original roadmap was:

```
M4 (Writing UX polish) → M5 (Export & Polish + MVP release) → M6-M10 (post-MVP features)
```

Two problems emerged:

**1. The onboarding gap.** Inxtone's Story Bible requires structured data — characters with 3-layer motivations, world rules, foreshadowing ledgers, etc. Currently the only way to populate this is field-by-field form entry. No serious writer will do this. Without a viable intake path, the product is demo-ready but not adoption-ready. Export, CLI polish, and documentation don't solve this.

**2. The M4→M5 scope gap.** M4 deferred several features to M5 — FTS5 search, semantic search, QualityService, auto-suggest entity links, version history. But M5's actual scope is Export & Polish, none of these deferred items. They're effectively homeless.

The core question: **what should the milestone order be between Export, Smart Intake, and Search/Quality?**

## Decision

Reorder post-M4 milestones to prioritize Smart Intake:

```
M4 (Writing UX)  — in progress, unchanged
M5 (Export)       — trimmed to export-only, fast completion
M6 (Smart Intake) — NEW: the key adoption unlock
M7 (Search + Quality) — absorbs M4's deferred items + original M6-M7 scope
M8+ (post-MVP)    — multi-model, visualization, EPUB, plugins
```

### Why Smart Intake as M6 (not before Export)

Export (M5) is small, well-defined, and ships in ~1 week. It completes the basic write→export loop that makes the product minimally useful. Smart Intake is larger and less deterministic (AI extraction quality varies). Shipping Export first means we have a functional MVP while building Intake.

However, Smart Intake is the **first post-export priority**, above search and quality checks. Rationale:

- Search and quality checks need real data volume to be meaningful. Without intake, users have sparse Story Bibles, making these features run on empty.
- Smart Intake generates the data that makes search and quality valuable.
- The adoption funnel is: Intake (get data in) → Write → Export (get data out) → Quality (verify). Building Quality before Intake is building the roof before the floor.

### What M6 (Smart Intake) Contains

Three features, all variants of one AI pipeline ("unstructured text → structured Story Bible"):

1. **Natural Language → Story Bible**: Paste character descriptions / world-building / plot outlines in natural language → system auto-decomposes into structured Story Bible entities → user reviews and confirms. The form is the review interface, not the input interface.

2. **Chapter Import → Auto-Extraction**: Import existing chapters (bulk text / files) → AI reads all content → extracts characters, relationships, world rules, locations, factions, foreshadowing → presents structured Story Bible draft → user confirms step-by-step (characters first, then relationships, then world, then plot).

3. **Outline Import → Plot Architecture**: Paste chapter-by-chapter outline → system extracts arc structure, chapter goals, character appearances, foreshadowing plants → pre-populates plot system.

### What M7 (Search + Quality) Contains

Absorbs the orphaned M4 deferrals and original post-MVP quality features:

- FTS5 full-text search + Cmd+K modal
- Semantic search / embeddings (sqlite-vec)
- QualityService + quality panel
- Consistency checker (26 rules)
- Wayne Principles automated checking
- Auto-suggest entity links
- Version history + volume switcher

### Schema Stays Opinionated

Important non-decision: this reorder does **not** introduce user-definable schema. The Story Bible structure (characters with motivation layers, arcs, relationships with Wayne Principle fields, etc.) remains hardcoded. The quality engine's 26 rules depend on these specific fields existing. Smart Intake makes it easier to populate the fixed schema, not to change it. Convention over configuration: extend with custom fields later (M8+), but never remove the structural foundation.

## Alternatives Considered

### Alternative 1: Smart Intake before Export (M5 = Intake, M6 = Export)

- **Pros**: Intake is arguably more critical for adoption than Export
- **Cons**: Intake is larger and less predictable (AI extraction quality, UX for multi-step confirmation); Export is small and well-defined. Delaying Export means no complete write→export loop for weeks.
- **Why not**: Export completes the basic product loop quickly. Intake follows immediately after. Net delay to Intake is ~1 week, but we get a shippable MVP sooner.

### Alternative 2: Keep original order (Export → Search/Quality → Intake later)

- **Pros**: Search and quality are technically exciting features
- **Cons**: Without intake, users have empty Story Bibles. Search searches nothing. Quality checks check nothing. The product looks impressive in demos but nobody can actually use it on their own work.
- **Why not**: Building downstream features before solving the upstream data problem is backwards.

### Alternative 3: Merge Intake into M5 alongside Export

- **Pros**: Everything ships together as one big MVP
- **Cons**: M5 balloons from 2 weeks to 5+ weeks. Intake's AI extraction pipeline is complex and needs iteration. Bundling it with Export delays both.
- **Why not**: Violates the "1-4 week milestone" guideline. Ship Export fast, then focus on Intake.

## Consequences

### Positive

- Adoption path becomes viable: writers with existing work can onboard without manual data entry
- Search and Quality (M7) will have real data to operate on
- Export ships fast as a clean, small milestone
- Each milestone has a clear, singular focus

### Negative

- Search and Quality pushed further out (M7 instead of M5-M6 timeframe)
- Smart Intake depends on AI extraction quality — may need iteration beyond one milestone
- Deferred items from M4 wait longer to be addressed

### Risks

- **AI extraction quality**: Gemini may not reliably extract structured Story Bible data from raw chapters. Mitigation: design the UX as "AI suggests, human confirms" — the AI doesn't need to be perfect, it needs to be faster than manual entry.
- **Scope creep in M6**: Three intake modes could each grow large. Mitigation: Phase 1 (natural language → Bible) is the minimum viable intake; chapter import and outline import can be Phase 2/3 within M6 or spill to M6.5.
- **M7 becomes a dumping ground**: It absorbs a lot of deferred items. Mitigation: Scope M7 tightly when M6 nears completion; split if needed.

## Related

- [M4.md](../Milestone/M4.md) — Current milestone, deferred items listed in "Out of Scope"
- [M5.md](../Milestone/M5.md) — Export milestone, to be trimmed
- [M6.md](../Milestone/M6.md) — Smart Intake milestone (new)
- [M7.md](../Milestone/M7.md) — Search & Quality milestone (new)
- [ADR-0002](ADR-0002-ai-context-injection-strategy.md) — Context injection strategy (Intake builds on same AI infrastructure)
