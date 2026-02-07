# Progress

> Append-only development log - newest entries at top

---

## 2026-02-07

### Completed
- **M2 Phase 1: Repository Layer** — All 7 repositories implemented with full test coverage
  - `BaseRepository`: shared utilities (ID generation, JSON parsing, count/exists/delete)
  - `CharacterRepository`: CRUD + FTS5 search + role filtering + name search (237 lines)
  - `WorldRepository`: singleton upsert pattern, setPowerSystem/setSocialRules (140 lines)
  - `RelationshipRepository`: bidirectional tracking, Wayne Principles fields, cascade delete (265 lines)
  - `LocationRepository`: CRUD + type filtering + name search (188 lines)
  - `FactionRepository`: CRUD + stance/leader/type/status queries + clearLeader (270 lines)
  - `TimelineEventRepository`: CRUD + date range + character/location lookups + addCharacter/removeCharacter (246 lines)
  - 341 tests passing (6 test files, all repos covered)
- **Input types unified** — Moved `CreateLocationInput`, `CreateFactionInput`, `CreateTimelineEventInput` to `services.ts` as single source of truth; updated `IStoryBibleService` to use named types instead of `Omit<...>`
- **Bug fixes** — Fixed `firstAppearance` type mismatch (DB TEXT column → number conversion in mapRow), fixed flaky timestamp test

### Decisions Made
- Input types for all entities live in `services.ts` (single source), shared by repo and service layers
- TimelineEventRepository added as bonus (not in original Phase 1 spec, needed for Phase 2)
- Repository layer is synchronous (no async/await); service layer will be async

### Next
- Begin M2 Phase 2: Service Layer (EventBus + StoryBibleService)

---

## 2026-02-06

### Completed
- **M1 sign-off** — Merged PR #1 (ms1 → main), M1 status → Complete
- **Milestone roadmap planning (M2–M5)** — Drafted full MVP roadmap
  - M2: Story Bible Core (3 weeks, target 2026-03-21)
  - M3: Writing Workspace + AI Integration (3 weeks, target 2026-04-11)
  - M4: Search & Quality (2 weeks, target 2026-04-25)
  - M5: Export & Polish / MVP Release (2 weeks, target 2026-05-09)
- **Updated Milestone index** — Meta.md now tracks all 5 milestones with status/target/duration

### Decisions Made
- MVP timeline: ~12 weeks (M1 complete → M5 release by early May 2026)
- M2 starts with Repository Layer → Service Layer → API → Web UI → CLI
- AI integration (Gemini) deferred to M3
- Semantic search (sqlite-vec) deferred to M4
- EPUB/PDF export deferred to post-MVP

### Next
- Begin M2 Phase 1: Repository Layer (Character, World, Relationship)
- Update M1.md task checkboxes to reflect completion

---

## 2026-02-05 (Session 4–5)

### Completed
- **M1 Phase 5: CLI Shell** — all CLI commands functional
  - `inxtone --version`, `inxtone --help` via Commander.js
  - `inxtone init [name]` — creates project directory, inxtone.yaml, inxtone.db, .gitignore
  - `inxtone serve` — starts Fastify + optional TUI, `--no-tui` for headless
  - Fixed double shebang issue (split tsup config: only cli entry gets banner)
  - Fixed process.chdir() in test workers → `vi.spyOn(process, 'cwd')`
  - 9 init tests passing
- **M1 Phase 6: Server + Web Shell** — complete
  - Server: static file serving (@fastify/static), SPA fallback for non-API routes
  - Server: `createServer(options: ServerOptions)` API, auto-find web build dir
  - Web: CSS design system tokens (dark theme, gold accents, typography, spacing)
  - Web: AppShell layout (Header + Sidebar + Content with Outlet)
  - Web: React Router with 4 page stubs (Dashboard, Story Bible, Write, Settings)
  - Web: shared Icon component (extracted from inline SVGs)
  - Web: responsive sidebar (fixed on desktop, collapsed on mobile)
- **Type safety fixes across codebase**
  - `CreateCharacterInput`: `string` → `ConflictType`/`CharacterTemplate` literal unions
  - `MockEventBus`: `eventHistory` typed as `AppEvent[]`, type predicates in filters
  - `serve.ts`: `createServer(port)` → `createServer({ port })` signature fix
  - `server/index.ts`: `__dirname` → `import.meta.dirname` (ESM compat)
- **Cleanup**
  - Deleted stale `context_bus_chat.md` from repo root
  - Deleted old `packages/web/src/index.css` (replaced by styles/global.css)
  - Merged duplicate `:root` blocks in tokens.css
  - Fixed GitHub URL in Header.tsx
  - Fixed Node engine constraint: `>=20.0.0` → `>=20.11.0`
  - Fixed vitest coverage exclude for `.test.tsx` files
  - Fixed 6 lint errors caught by pre-commit hooks (nullish coalescing, async/sync)

### Decisions Made
- CLI uses Commander.js for arg parsing, Ink for TUI rendering
- tsup split config: index.ts (library, with dts) vs cli.tsx (binary, with shebang banner)
- Server `createServer` takes options object, not positional port number
- SVG icons centralized in `Icon.tsx` with `IconName` type for compile-time safety
- Test mocks excluded from tsconfig/eslint but manually verified against interfaces

### Next
- Manual testing of full M1 flow (build → init → serve → web UI)
- M1 sign-off and merge to main

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
