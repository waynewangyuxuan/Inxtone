# MVP Scope & Metrics

> Phase 1 scope and success metrics

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~80 | **Updated**: 2026-02-05

---

## 8. MVP Scope

**Milestone Path:** M4 (Writing UX) → M5 (Export) → M6 (Smart Intake) → M7 (Search, Quality & v0.1.0)

### M4: Writing UX (Active)

- [x] Project scaffolding, web UI server, dashboard
- [x] Chapter editor with auto-save
- [x] Story Bible: characters, world, locations, factions, timeline, relationships
- [x] Plot system: arcs, foreshadowing, hooks
- [x] Gemini 3.0 Pro integration (continuation, dialogue, brainstorm, describe, ask)
- [x] 5-layer context injection engine
- [x] Prompt presets (16 presets, 4 categories)
- [x] Chapter outline editing
- [x] Brainstorm mode with suggestion cards
- [ ] Code review fixes (Phase 7)

### M5: Export (Draft)

- [ ] `inxtone export md/docx/txt` — Multi-format export
- [ ] Story Bible export (structured document)
- [ ] Web UI export controls + CLI commands

### M6: Smart Intake (Draft) — Key Adoption Unlock

**Deliberately excluded from MVP core, but critical for real-world adoption:**
- [ ] Natural language → Story Bible (paste text → structured entities)
- [ ] Chapter import + auto-extraction (bulk chapters → full Story Bible)
- [ ] Outline import → plot architecture
- [ ] "AI suggests → human confirms" review flow

See [M6.md](../../Milestone/M6.md), [ADR-0003](../../Decisions/ADR-0003-milestone-reorder-smart-intake.md).

### M7: Search, Quality & v0.1.0 (Draft)

- [ ] FTS5 full-text search + Cmd+K modal
- [ ] Semantic search (sqlite-vec embeddings)
- [ ] QualityService (26 consistency rules + Wayne Principles)
- [ ] Version history + diff viewer
- [ ] CLI completeness, performance, documentation
- [ ] v0.1.0 release

---

## 9. Success Metrics

### 9.1 Open Source Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| GitHub Stars | 2,000 |
| Forks | 200 |
| Contributors | 20 |
| Downloads | 5,000 |
| Homebrew installs | 1,000 |

### 9.2 Community Metrics

| Metric | Target |
|--------|--------|
| Discord members | 500 |
| Issues opened | 100 |
| PRs merged (external) | 30 |
| Documentation pages | 50 |

### 9.3 Quality Metrics

| Metric | Target |
|--------|--------|
| Binary size | < 30MB |
| Startup time | < 500ms |
| Memory usage (idle) | < 100MB |
| Test coverage | > 70% |
| Open bugs (P0/P1) | < 10 |

---

## See Also

- [../../Milestone/Meta.md](../../Milestone/Meta.md) - Milestone index
- [../../Milestone/M6.md](../../Milestone/M6.md) - Smart Intake milestone
- [../../Decisions/ADR-0003-milestone-reorder-smart-intake.md](../../Decisions/ADR-0003-milestone-reorder-smart-intake.md) - Reorder rationale
- [Appendix.md](Appendix.md) - Roadmap and risks
