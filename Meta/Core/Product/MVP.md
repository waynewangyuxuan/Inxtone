# MVP Scope & Metrics

> Phase 1 scope and success metrics

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~80 | **Updated**: 2026-02-05

---

## 8. MVP Scope (Phase 1)

### Must Have (P0)

- [ ] `inxtone` — TUI mode (interactive terminal)
- [ ] `inxtone init [name]` — Project scaffolding
- [ ] `inxtone serve` — HTTP Server + TUI
- [ ] `inxtone serve --no-tui` — Headless mode
- [ ] Project dashboard (list chapters, word count)
- [ ] Chapter editor (markdown, manual save)
- [ ] Character cards (structured data in SQLite)
- [ ] World rules (basic structure)
- [ ] Plot outliner (2 levels: Arc → Chapter)
- [ ] Gemini/Claude integration (continuation, dialogue)
- [ ] Basic context injection (current chapter + selected entities)
- [ ] `inxtone export md` — Markdown export
- [ ] `inxtone export docx` — Word export
- [ ] `inxtone config set/get` — API key management

### Should Have (P1)

- [ ] Relationship map (visual, D3.js or similar)
- [ ] Foreshadowing tracker
- [ ] Full-text search across project
- [ ] Multiple AI prompt templates
- [ ] `inxtone ai ask "question"` — CLI query interface
- [ ] `inxtone bible list/show/search` — Story Bible CLI

### Nice to Have (P2)

- [ ] Consistency checker
- [ ] File watcher (auto-reload on external edit)
- [ ] Chapter summaries (auto-generated)
- [ ] Daily word count goals

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

- [../../Milestone/M1.md](../../Milestone/M1.md) - First milestone tasks
- [Appendix.md](Appendix.md) - Roadmap and risks
