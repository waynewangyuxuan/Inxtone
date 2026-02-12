# Todo

> Deferred tasks and ideas - prioritized backlog

---

## High Priority (M4 Phase 7 — Code Review Fixes)

**Must Fix**
- [ ] **useAutoSave race condition** — capture chapterId at debounce start, not setTimeout fire

**Should Fix**
- [ ] **Auto-save collision** — `notifyManualSave()` clear pending timer + AbortController for in-flight requests
- [ ] **useAutoSave unit tests** — no client-side test coverage
- [ ] **i18n: prompt presets** — 36 hardcoded English strings → `t('key')`
- [ ] **Outline CSS** — hardcoded `#ef4444` → `var(--color-danger)`
- [ ] **Brainstorm loading state** — no feedback during regeneration
- [ ] **tokens.css** — define `--color-success-bg`, chip bg token
- [ ] **Schema.md** — add `sort_order` column
- [ ] **Accessibility** — `aria-pressed` on preset toggles, `aria-expanded` on outline header
- [ ] **reorderChapters E2E** — verify actual sort order persisted
- [ ] **Preset tests** — data integrity (unique IDs, valid categories)
- [ ] **Brainstorm parser tests** — en-dash separator, mixed formats
- [ ] **Outline save indicator** — no user feedback on outline auto-save
- [ ] **Redundant chapterId guard** — AISidebar handleBrainstorm

**Nits**
- [ ] parseBrainstorm regex inline comments
- [ ] Dev-mode logging for parseJson Zod failures

## Medium Priority

- [ ] **Split Product.md** - 1037 lines exceeds 150 line limit
- [ ] **Split Design.md** - 722 lines exceeds 150 line limit
- [ ] **Split Module documents** - All 10 modules exceed limits
- [ ] **Add release workflow** - GitHub Actions for releases
- [ ] **Create CONTRIBUTING.md** - Detailed contribution guide
- [ ] **Set up Codecov** - Code coverage reporting

## Low Priority

- [ ] **Add dependabot** - Automated dependency updates
- [ ] **Create project logo** - Inkstone/砚台 inspired design
- [ ] **Set up GitHub Pages** - Documentation site

---

## Completed

- [x] Initialize project structure (2026-02-05)
- [x] Create CLAUDE.md (2026-02-05)
- [x] Set up ADR system (2026-02-05)
- [x] Set up Milestone system (2026-02-05)
- [x] M1 Phase 1: Project Setup — monorepo, TS, ESLint, Vitest (2026-02-05)
- [x] M1 Phase 2: Interface Contract — all types and interfaces (2026-02-05)
- [x] Split Architecture documents 04, 05, 06 (2026-02-05)
- [x] Set up pre-commit hooks — husky + lint-staged (2026-02-05)
- [x] Fix ESLint v9 compatibility — typescript-eslint v8 (2026-02-05)
- [x] Create Regulation.md content (2026-02-05)
- [x] M1 Phase 4: Database Schema — Database class, MigrationRunner, 18 tables, FTS5 (2026-02-05)
- [x] M1 Phase 5: CLI Shell — init, serve, version, help commands + 9 tests (2026-02-05)
- [x] M1 Phase 6: Server + Web Shell — static serving, SPA fallback, AppShell, 4 pages (2026-02-05)
- [x] Update test mocks — MockEventBus AppEvent[], CreateCharacterInput literal unions (2026-02-05)
- [x] Codebase cleanup — ESM fixes, lint fixes, stale file removal (2026-02-05)
- [x] M1 merge to main — PR #1 merged (2026-02-06)
- [x] Draft M2–M5 milestone plans (2026-02-06)
