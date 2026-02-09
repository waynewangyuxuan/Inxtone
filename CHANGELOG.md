# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **M3.5: Hackathon Submission** — Gemini 3 Hackathon deployment readiness
  - English AI prompts: all 5 templates + context builder labels translated
  - BYOK API key architecture: per-request `X-Gemini-Key` header, `POST /api/ai/verify-key` endpoint
  - API Key Dialog: first-visit modal with masked display, verify flow, skip option
  - Seed Loader: raw SQL seeds (EN + ZH) with full chapters, `GET /api/seed/status`, `POST /load`, `POST /clear`
  - Welcome Screen: 3-card first-run UX (English Demo / Chinese Demo / Start Empty)
  - Settings page: functional API key management + seed data controls
  - Dockerfile: multi-stage build (node:20-slim + pnpm + better-sqlite3)
  - 1001 tests passing across 42 files
- **M2: Story Bible Core** — Full Story Bible system with 9 domains
  - Repository layer: 7 repositories (Character, World, Relationship, Location, Faction, TimelineEvent, Arc, Foreshadowing, Hook) with FTS5 search
  - Service layer: StoryBibleService (41 methods) + EventBus (pub/sub with metadata injection)
  - API layer: 45 REST endpoints across 9 route files with error handler middleware
  - Web UI: Forms, modals, error handling for all domains, design system compliance
  - CLI: `inxtone bible list/show/search` commands for terminal browsing
  - Performance: sub-millisecond operations, 120+ characters, FTS5 indexing
  - Demo seed data: 《墨渊记》Ink Abyss Chronicles (6 characters, 7 relationships, world, arcs, foreshadowing, hooks)
  - 695 tests across 32 test files
- **M3 Phase 1: Writing Service** — Chapter/Volume CRUD with version control
  - WritingRepository: Volume/Chapter CRUD, content operations, version management, FK cleanup
  - WritingService: 25 methods, status state machine (outline→draft→revision→done), rollback with backup
  - EventBus integration: 10 event types for writing operations
  - 127 tests (50 repo + 77 service)
- **M3 Phase 2: AI Service** — AI generation with Gemini 2.5 Pro
  - GeminiProvider: `@google/genai` SDK streaming, retry with exponential backoff, error mapping
  - ContextBuilder: 5-layer FK-based context assembly with token budget management
  - PromptAssembler: YAML front-matter parsing, `{{variable}}` substitution, 5 built-in templates
  - AIService: 6 generation methods (continue, dialogue, describe, brainstorm, ask, complete)
  - SSE API routes: 6 streaming + 2 JSON endpoints with Zod validation
  - Token counter: heuristic estimation (CJK x1.5, English x1.3)
  - AIProviderError class with 4 error codes
  - 109 new tests, 936 total tests across 40 test files
- **M3 Phase 3: Writing API Routes** — RESTful endpoints for writing workspace
  - 18 endpoints: volumes (5), chapters (10), versions (2), stats (1)
  - Zod schema validation on all request bodies
  - Server bootstrap: WritingService creation with shared repos + EventBus
  - 39 integration tests, 976 total tests across 41 test files
- **M3 Phase 4: Chapter Editor UI** — Three-panel writing workspace
  - Three-panel layout: chapter sidebar (280px), markdown editor (flex), AI sidebar (360px, collapsible)
  - `@uiw/react-md-editor` with dark gold theme, Ctrl+S save, dirty tracking, word count
  - Chapter list with arc filter, Story Bible quick-ref panel, create/edit chapter modal
  - AI sidebar: Continue + Brainstorm with SSE streaming, accept/reject/regenerate flow
  - Context preview with layer grouping (L1-L5), streaming response with auto-scroll
  - Zustand store + React Query hooks for state management
  - 19 new files, 984 tests passing, build clean
- **M3 Phase 5: Plot UI** — Standalone Plot page with arc outliner, foreshadowing tracker, hook tracker
  - Arc Outliner: collapsible tree (Arc → Sections → Chapters), progress bars, status badges, chapter click → Write page
  - Foreshadowing Tracker: lifecycle timeline (planted → hints → resolved/pending), overdue warnings, Add Hint modal, inline Resolve, Abandon with confirm
  - Hook Tracker: hooks grouped by chapter with color-coded strength bars (low/mid/high)
  - Sidebar navigation with plot icon, 3-tab layout (Arcs | Foreshadowing | Hooks)
  - 10 new files, build clean

## [0.1.0] - 2026-02-05

### Added
- **Monorepo setup** — pnpm workspaces with 4 packages (core, tui, server, web)
- **TypeScript strict mode** — across all packages with ESLint v9 + Prettier
- **Interface contract system** — 7 service interfaces, 60+ typed events, full API types
- **Test infrastructure** — Vitest with 247 tests, contract tests, mock services
- **Database layer** — SQLite via better-sqlite3, migration system, 18 core tables, FTS5 search
- **CLI** — `inxtone init`, `inxtone serve`, `--version`, `--help` via Commander.js + Ink
- **HTTP server** — Fastify with CORS, health check, static file serving, SPA fallback
- **Web UI shell** — React 18 + Vite, AppShell layout, 4 page stubs (Dashboard, Story Bible, Write, Settings)
- **Design system** — CSS custom properties (dark theme, gold accents, responsive)
- **Pre-commit hooks** — husky + lint-staged (eslint, prettier, typecheck)
- **Documentation** — Meta/ folder hierarchy, ADR system, milestone tracking, CLAUDE.md

---

[Unreleased]: https://github.com/VW-ai/Inxtone/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/VW-ai/Inxtone/releases/tag/v0.1.0
