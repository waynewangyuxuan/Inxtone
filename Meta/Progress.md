# Progress

> Append-only development log - newest entries at top

---

## 2026-02-05 (Session 3)

### Completed
- **M1 Phase 4: Database Schema** — SQLite layer fully implemented
  - `Database` class: connection management, WAL mode, foreign keys, transactions
  - `MigrationRunner`: sequential versioned migrations, rollback support, status reporting
  - Migration 001: 18 core tables (project, characters, relationships, world, locations, factions, timeline_events, arcs, foreshadowing, hooks, volumes, chapters, writing_goals, writing_sessions, versions, check_results, embeddings, config)
  - FTS5 full-text search on chapters and characters with auto-sync triggers
  - Migration CLI: `pnpm db:migrate` with --status, --rollback, --path options
  - Tests: Database.test.ts, MigrationRunner.test.ts, schema.test.ts
  - Added `@inxtone/core/db` export path
- **Test contract additions** — ConfigService contract test, MockEventBus/MockWritingService updates

### Decisions Made
- SQLite schema uses JSON columns for flexible nested data (motivation, facets, arc, etc.)
- FTS5 virtual tables with triggers for auto-sync on chapter/character changes
- Migration system uses in-code migrations (not SQL files) for type safety

- **Build/test fixes for Phase 4:**
  - Added `src/db/index.ts` to tsup entry points for `@inxtone/core/db` export
  - Separated db from main index.ts to prevent better-sqlite3 bundling into web
  - Rebuilt better-sqlite3 native bindings
  - Fixed FTS5 test queries (rowid vs id, CJK tokenization expectations)
  - All 238 tests pass, build + typecheck clean

### Blockers/Issues
- Test mocks still need updating to match Phase 2 interface changes
- FTS5 default tokenizer has limited CJK word segmentation (future: ICU tokenizer)

### Next
- M1 Phase 5: CLI shell (functional inxtone commands)
- M1 Phase 6: Server + Web shell

---

## 2026-02-05 (Session 2)

### Completed
- **M1 Phase 1: Project Setup** — fully operational
  - pnpm monorepo, TypeScript strict, Vitest, ESLint + Prettier
  - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass
- **M1 Phase 2: Interface Contract** — all interfaces defined
  - Entity types: Character, Chapter, World, Plot, Project, etc.
  - Service interfaces: IStoryBibleService, IWritingService, IAIService, IQualityService, ISearchService, IExportService, IConfigService
  - Infrastructure interfaces: IEventBus, IRepository, IDatabaseManager, IRuleEngine
  - API contracts: REST endpoint types, error types
  - Event system: 60+ typed events
- **ESLint v9 compatibility** — upgraded typescript-eslint v7→v8, react-hooks v4→v5
- **Build fixes** — removed TS project references, fixed tsup dts, fixed web build
- **Architecture docs split** — 04, 05, 06 split into focused folders
- **Test infrastructure (WIP)** — mock services and contract test stubs added
- **Pre-commit hooks** — husky + lint-staged (lint + typecheck)
- **gitignore cleanup** — added .pnpm-store/, .claude/

### Decisions Made
- Removed TypeScript project references; use workspace deps + tsup for builds
- Web build uses `vite build` only (no tsc step)
- ESLint relaxed for scaffold phase (recommendedTypeChecked, not strict)
- Test mocks excluded from lint/typecheck until interface alignment

---

## 2026-02-05 (Session 1)

### Completed
- Initialized project structure using project-init skill
- Created Meta/ folder hierarchy
- Set up ADR system
- Set up Milestone tracking
- Created CLAUDE.md project entry point

### Decisions Made
- ADR-0001: TypeScript/Node.js tech stack confirmed
- Preserve Chinese content in documentation
- Keep docs/design/ as backup after migration

---

## Archive

*Older entries will be moved here when the log grows too long*
