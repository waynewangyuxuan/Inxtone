# Progress

> Append-only development log - newest entries at top

---

## 2026-02-13 (M5: Export + Issues #9 & #8 — Complete) ✅

### Completed

**Phase 0: ADR + Documentation**
- ADR-0005: Export Interface Simplification — dropped PDF, templates, pre-export checks from IExportService
- Updated ADR index, milestone index

**Phase 1: ExportService Core**
- Simplified IExportService: `exportChapters(options) → ExportResult`, `exportStoryBible(options?) → ExportResult`
- 4 formatters: MarkdownFormatter (TOC + volume grouping), TxtFormatter (separators), DocxFormatter (docx package), BibleFormatter (8 sections)
- 46 unit tests for ExportService + all formatters

**Phase 2: API + Server Wiring**
- `POST /api/export/chapters` — MD/TXT/DOCX with Content-Disposition attachment
- `POST /api/export/story-bible` — Markdown with section filtering
- Wire ExportService in server bootstrap, testHelper
- 10 integration tests

**Phase 3: Web UI Export Page**
- `/export` page: format selector buttons, range picker (all/volume/chapters), outline/metadata checkboxes
- Dedicated `exportApi.ts` fetch utility (blob download, not JSON)
- Download icon + sidebar nav entry

**Phase 4: CLI Commands**
- `inxtone export md|txt|docx|bible` with `--output`, `--volume`, `--chapters`, `--outline`, `--metadata`

**Phase 5: Issue #9 — StoryBiblePanel Refactor**
- 848-line monolith → 15 modules: BibleSection, BibleEntityItem, 7 detail components, contextBuilders, barrel exports
- Main component reduced to 479 lines (data hooks + handlers + JSX composition only)

**Phase 6: Issue #8 — Context Preview UI**
- Token usage progress bar (green < 50%, yellow 50-80%, red > 80%)
- Color-coded L1-L5 layer badges with hover tooltips
- Dedicated pinned items section with "Clear all" bulk unpin
- Empty/not-built state messages

**Phase 7: Tests + Polish**
- E2E export tests: 9 tests covering all formats, volume scoping, empty project
- Full test suite: 1188 tests passing across 59 files

---

## 2026-02-12 (M4.5: Writing Intelligence — Complete) ✅

### Completed

**Phase 1: Search Infrastructure**
- Migration 003: Unified `search_index` FTS5 table (6 entity types, 18 triggers, backfill from existing data, drop old `chapters_fts`/`characters_fts`)
- `SearchService`: FTS5 MATCH with BM25 ranking, `snippet()` highlighting, entity type filtering, query sanitization
- `CharacterRepository.search()` updated to use `search_index`
- Search API route: `GET /api/search?q=&types=&limit=`
- `useSearch` React Query hook (300ms debounce, enabled when query ≥ 2 chars)
- SearchService tests + search route integration tests

**Phase 2: Cmd+K Search Modal**
- `SearchModal.tsx`: portal-based overlay, debounced search, results grouped by entity type with icons + snippets
- Keyboard navigation: Arrow keys, Enter to navigate/inject, Escape to close
- Entity type filter chips (All / Characters / Chapters / Locations / ...)
- Integration in AppShell with global Cmd+K trigger

**Phase 3: Interactive Bible Panel**
- `StoryBiblePanel.tsx` rewritten: 8 collapsible sections (Characters, Relationships, Locations, Arc, Foreshadowing, Hooks, World, Factions)
- Inline detail cards per entity (reuses Story Bible detail patterns)
- Inject-to-context: `useEditorStore` gains `injectedEntities` state, pin/unpin buttons per entity
- `ContextPreview` shows pinned L5 items with unpin button
- Quick-search filter within Bible panel

**Phase 4: Keyboard Shortcuts**
- `useKeyboardShortcuts.ts`: global shortcut registry with `ShortcutDef` interface
- Shortcuts: `Cmd+K` (search), `Cmd+S` (save), `Cmd+Enter` (AI Continue), `Cmd+/` (reference modal)
- `ShortcutReferenceModal.tsx`: grouped by category, shows key combos + descriptions
- Migrated inline Ctrl+S handler from EditorPanel to shortcut system

**Phase 5: Chapter Setup Assist**
- `ChapterSetupAssist.ts` (core): heuristic engine with 3 sources — previous chapter carry-over, arc roster, outline mention
- Confidence ranking: outline mention > previous chapter > arc roster; deduplication with highest confidence wins
- API route: `GET /api/chapters/:id/setup-suggestions`
- `useChapterSetup.ts` hook + `SetupAssistPanel.tsx` UI: suggestion chips with source labels, one-click attach
- 14 unit tests covering all heuristic sources, deduplication, foreshadowing resolved filtering

**Phase 6: Post-Accept Entity Extraction**
- `GeminiProvider.generateJSON<T>()`: non-streaming structured JSON output via `responseMimeType: 'application/json'`
- `ENTITY_EXTRACTION_TEMPLATE`: extraction prompt with known entity matching
- `AIService.extractEntities()`: builds known entity lists, assembles prompt, calls generateJSON
- API route: `POST /api/ai/extract-entities`
- `useEditorStore`: `pendingExtraction` state + `setPendingExtraction` action
- `useExtractEntities.ts` mutation hook: background extraction after AI accept
- `ExtractionReview.tsx`: review panel with Link/Create & Link/Dismiss per entity, batch Link All/Dismiss All
- Trigger wired in `Write.tsx` `handlePreviewConfirm`

**Phase 7: Deferred Issues + Polish**
- Created GitHub issues: #4 (Relationship Map), #5 (Timeline Visualization), #6 (Pacing Visualization)
- Build: clean (0 TS errors)
- Documentation updated (CHANGELOG.md, Progress.md, M4.5.md)

### New Files (16)
| File | Purpose |
|------|---------|
| `packages/core/src/db/migrations/003_unified_search_index.ts` | FTS5 search_index + 18 triggers |
| `packages/core/src/services/SearchService.ts` | Full-text search service |
| `packages/core/src/services/ChapterSetupAssist.ts` | Heuristic setup assist engine |
| `packages/core/src/services/__tests__/ChapterSetupAssist.test.ts` | 14 setup assist tests |
| `packages/server/src/routes/search.ts` | Search API route |
| `packages/web/src/hooks/useSearch.ts` | React Query search hook |
| `packages/web/src/hooks/useChapterSetup.ts` | Setup suggestions hook |
| `packages/web/src/hooks/useEntityExtraction.ts` | Entity extraction mutation hook |
| `packages/web/src/hooks/useKeyboardShortcuts.ts` | Global shortcut registry |
| `packages/web/src/components/SearchModal.tsx` | Cmd+K search modal |
| `packages/web/src/components/SearchModal.module.css` | Search modal styles |
| `packages/web/src/components/ShortcutReferenceModal.tsx` | Shortcut reference modal |
| `packages/web/src/components/ShortcutReferenceModal.module.css` | Reference modal styles |
| `packages/web/src/pages/Write/SetupAssistPanel.tsx` | Setup assist chip UI |
| `packages/web/src/pages/Write/SetupAssistPanel.module.css` | Setup assist styles |
| `packages/web/src/pages/Write/ExtractionReview.tsx` | Entity extraction review UI |
| `packages/web/src/pages/Write/ExtractionReview.module.css` | Extraction review styles |

### Modified Files (18)
| File | Change |
|------|--------|
| `packages/core/src/db/migrations/index.ts` | Register migration 003 |
| `packages/core/src/db/repositories/CharacterRepository.ts` | Search via search_index |
| `packages/core/src/ai/GeminiProvider.ts` | +generateJSON<T>() method |
| `packages/core/src/ai/templates.ts` | +ENTITY_EXTRACTION_TEMPLATE |
| `packages/core/src/ai/PromptAssembler.ts` | Register extract_entities template |
| `packages/core/src/ai/AIService.ts` | +extractEntities() method |
| `packages/core/src/types/services.ts` | +ExtractedEntity, ExtractedEntities, extractEntities on IAIService |
| `packages/core/src/ai/__tests__/PromptAssembler.test.ts` | Updated template counts (6/7) |
| `packages/server/src/index.ts` | +SearchService, +ChapterSetupAssist wiring |
| `packages/server/src/routes/index.ts` | +searchRoutes, +setupAssist in RouteDeps |
| `packages/server/src/routes/ai.ts` | +POST /extract-entities route |
| `packages/server/src/routes/writing.ts` | +GET /chapters/:id/setup-suggestions |
| `packages/web/src/stores/useEditorStore.ts` | +injectedEntities, +pendingExtraction state |
| `packages/web/src/hooks/index.ts` | Export new hooks |
| `packages/web/src/pages/Write.tsx` | Extraction trigger in handlePreviewConfirm |
| `packages/web/src/pages/Write/StoryBiblePanel.tsx` | 8 sections + ExtractionReview + SetupAssistPanel |
| `packages/web/src/pages/Write/ContextPreview.tsx` | Pinned L5 items with unpin |
| `packages/web/src/App.tsx` | SearchModal + ShortcutReferenceModal + global Cmd+K/Cmd+/ shortcuts |

### Stats
- Tests: **1093 passed** (50 files), 0 failures, 26 new tests
- Build: clean (0 TS errors)
- GitHub issues created: 3 (#4 Relationship Map, #5 Timeline Viz, #6 Pacing Viz)

### M4.5 Summary
- **7 phases completed** across search, Bible panel, shortcuts, setup assist, entity extraction
- Tests grew from 1067 → 1093 (+26 new)
- **3 features deferred** to GitHub issues (Relationship Map, Timeline Viz, Pacing Viz)

---

## 2026-02-11 (M4: AI Quality + Writing UX — Phases 2-6 Complete)

### Completed

**Phase 2: Auto-Save** (#31)
- `useAutoSave.ts` hook: 3s debounce, calls `apiPut` directly (avoids cache overwrite)
- EditorToolbar: auto-save indicator with pulsing dot + status label (Saving.../Saved/Error)
- `useEditorStore`: `autoSaveStatus` state + `setAutoSaveStatus` action

**Phase 3: Prompt Presets** (#32)
- `presets.ts`: 16 presets across 4 categories (pacing/style/content/character)
- `PromptPresets.tsx`: category filter tabs + scrollable chip bar
- AISidebar: chip click appends instruction to prompt textarea

**Phase 4: Chapter Outline Editing** (#33)
- `OutlinePanel.tsx`: collapsible panel with goal/scenes/hookEnding fields
- 1.5s debounced auto-save via `useUpdateChapter`
- Mounted above MDEditor in EditorPanel

**Phase 5: Brainstorm Redesign** (#37)
- `parseBrainstorm.ts`: parse numbered AI responses into title/body suggestion cards
- `BrainstormPanel.tsx`: card grid with Use/Regenerate/Dismiss actions
- AISidebar: Brainstorm button restored, routes brainstorm results to card view
- 7 unit tests for parser

**Phase 6: Tech Debt + E2E Tests** (#2, #3, #6, #42)
- `BaseRepository.parseJson`: optional Zod schema param for runtime validation (#2)
- Type assertions audited — all justified, no unsafe casts in production (#3)
- Error module: 29 unit tests covering all 9 error classes + type guards + helpers (#6)
- `mergeContent` utility extracted from AcceptPreviewModal (#42)
- CSS tokens: hardcoded rgba → `var(--color-success-bg)`, z-index → `var(--z-base)` (#42)
- M4 E2E tests: chapter ordering, auto-save without version, outline persistence (7 tests)

### New Files (11)
| File | Purpose |
|------|---------|
| `packages/web/src/hooks/useAutoSave.ts` | Auto-save hook with 3s debounce |
| `packages/core/src/ai/presets.ts` | 16 prompt presets across 4 categories |
| `packages/web/src/pages/Write/PromptPresets.tsx` | Preset chip bar component |
| `packages/web/src/pages/Write/PromptPresets.module.css` | Chip bar styles |
| `packages/web/src/pages/Write/OutlinePanel.tsx` | Chapter outline editing panel |
| `packages/web/src/pages/Write/OutlinePanel.module.css` | Outline panel styles |
| `packages/web/src/lib/parseBrainstorm.ts` | AI brainstorm response parser |
| `packages/web/src/pages/Write/BrainstormPanel.tsx` | Suggestion cards component |
| `packages/web/src/pages/Write/BrainstormPanel.module.css` | Card styles |
| `packages/web/src/lib/mergeContent.ts` | Content merge utility |
| `packages/core/src/errors/__tests__/errors.test.ts` | 29 error module tests |

### Modified Files (11)
| File | Change |
|------|--------|
| `packages/web/src/stores/useEditorStore.ts` | +autoSaveStatus state |
| `packages/web/src/pages/Write/EditorPanel.tsx` | Auto-save integration + OutlinePanel mount |
| `packages/web/src/pages/Write/EditorToolbar.tsx` | Auto-save indicator |
| `packages/web/src/pages/Write/EditorToolbar.module.css` | +autoSave styles |
| `packages/web/src/pages/Write/AISidebar.tsx` | Brainstorm button + preset chips + BrainstormPanel |
| `packages/core/src/index.ts` | Export presets |
| `packages/core/src/db/repositories/BaseRepository.ts` | Zod schema param in parseJson |
| `packages/web/src/pages/Write/AcceptPreviewModal.tsx` | Use mergeContent utility |
| `packages/web/src/pages/Write/AcceptPreviewModal.module.css` | CSS token for bg color |
| `packages/web/src/pages/Write.module.css` | z-index → var(--z-base) |
| `packages/web/src/pages/StoryBible/TimelineList.module.css` | z-index → var(--z-base) |

### Stats
- Tests: **1067 passed** (48 files), 0 failures, 44 new tests
- Build: clean (0 TS errors)
- GitHub issues closed: 13 total (#25, #31, #32, #33, #37, #2, #3, #6, #42)

### M4 Total Summary
- **17 GitHub issues closed** (8 pre-phase + 9 phases 1-6)
- **6 phases completed** across writing UX and tech debt
- Tests grew from 1016 → 1067 (+51 new)

---

## 2026-02-10 (M4: AI Quality + Writing UX — Pre-Phase + Phase 1 + Code Review)

### Completed

**Pre-Phase: Close Already-Fixed Issues** — 8 GitHub issues closed
- #20 (content dedup), #21 (dialogue character context), #22 (ai_backup), #23 (context enrichment), #24 (userInstruction wiring), #26 (prevChapter cache), #27 (ContextBuilder hierarchy), #29 (hackathon checklist)
- All were already fixed in M3 codebase with `#issue-number` comments

**Phase 1: Chapter Ordering** (#25)
- Migration 002: `sort_order INTEGER` column + backfill from id + composite index
- `WritingRepository`: all 5 chapter query methods use `ORDER BY sort_order ASC, id ASC`
- `createChapter()`: auto-assigns next `sort_order` via `MAX(sort_order) + 1` within volume
- `reorderChapters()`: real implementation (was stub) — updates sort_order by array position
- `Chapter` entity: added `sortOrder: number` field

**Code Review Fixes** — 8 critical/high issues addressed
- ChapterListPanel: sort by `sortOrder` (not `id`)
- ChapterListPanel: defer `selectChapter(null)` to delete `onSuccess` callback
- ContextPreview: consistent ID fallback (`idx-${i}`) in count + render (was `''` vs `idx-${i}`)
- AcceptPreviewModal: ensure exactly `\n\n` paragraph breaks (handle single-newline edge cases)
- StreamingResponse: only auto-scroll when user is near bottom (< 80px threshold)
- AISidebar: abort stream on chapter switch (prevents wrong-chapter AI content)
- AIService: wrap ai_backup version creation in try-catch (non-fatal failure)
- BaseContextBuilder: stable sort with secondary index key in `truncateToFitBudget`

**Documentation**
- M4.md rewritten: "Search & Quality" → "AI Quality + Writing UX" (FTS/embeddings/QualityService deferred to M5)
- Issue mapping table: 17 issues across 7 phases

### New Files (1)
| File | Purpose |
|------|---------|
| `packages/core/src/db/migrations/002_chapter_sort_order.ts` | Add sort_order column to chapters |

### Modified Files (10)
| File | Change |
|------|--------|
| `packages/core/src/db/migrations/index.ts` | Register migration 002 |
| `packages/core/src/db/repositories/WritingRepository.ts` | sort_order in all chapter queries + real reorderChapters |
| `packages/core/src/types/entities.ts` | `sortOrder: number` on Chapter |
| `packages/core/src/ai/AIService.ts` | ai_backup try-catch |
| `packages/core/src/ai/BaseContextBuilder.ts` | Stable sort in truncateToFitBudget |
| `packages/web/src/pages/Write/ChapterListPanel.tsx` | Sort by sortOrder + delete onSuccess fix |
| `packages/web/src/pages/Write/ContextPreview.tsx` | Consistent ID fallback |
| `packages/web/src/pages/Write/AcceptPreviewModal.tsx` | Paragraph break separator logic |
| `packages/web/src/pages/Write/StreamingResponse.tsx` | Near-bottom auto-scroll |
| `packages/web/src/pages/Write/AISidebar.tsx` | Abort stream on chapter switch |

### Stats
- Tests: **1016 passed** (44 files), 0 failures
- Build: clean (0 TS errors)
- GitHub issues closed: 9 total (#20-27, #29)

### Next
- Phase 2: Auto-save (#31)
- Phase 3: Prompt presets (#32)

---

## 2026-02-10 (M3 Phase 6: Testing & Polish + Deferred Features) ✅

### Completed
- **Accept at Cursor Position** (Part B) — AI-generated text now inserts at the editor's cursor position instead of always appending at the end
  - `useEditorStore`: added `cursorPosition` state + `setCursorPosition` action
  - `EditorPanel`: DOM-level cursor tracking via `keyup`/`mouseup` on internal textarea + `requestAnimationFrame` in onChange
  - `EditorPanel`: exposes local content to parent via `contentRef` prop (fixes stale content issue from PR #40 review / Issue #42)
  - `AcceptPreviewModal`: 3-part preview (before | AI Insertion | after) when cursor is mid-content, 2-part preview (existing | AI Continuation) when appending
  - Smart separator logic: checks `endsWith('\n')` / `startsWith('\n')` to avoid double line breaks
- **Context Item Toggle** (Part C) — Users can now toggle L2-L5 context items on/off before AI generation
  - `useEditorStore`: added `excludedContextIds: Set<string>` state + `toggleContextItem`/`clearExcludedContext` actions
  - `ContextPreview`: checkboxes per item — L1 items (content, outline, prev_tail) locked on, L2-L5 toggleable
  - Excluded items rendered dimmed (opacity 0.4) with strikethrough on preview text
  - Header shows active/total item count
  - `AISidebar`: passes `excludedContextIds` array in Continue request body
  - Server `ai.ts`: added `excludedContextIds` to `continueSchema` Zod validation
  - `IAIService.continueScene`: added `excludedContextIds?: string[]` param
  - `AIService.continueScene`: filters excluded items before formatting context
- **E2E Tests** (`packages/server/src/routes/__tests__/e2e-writing-ai.test.ts`) — 7 tests
  - Writing flow: create chapter → save content → create version
  - Merged content after AI accept
  - Version rollback: save → version → modify → rollback → verify
  - Foreshadowing lifecycle: plant → hint → resolve
  - Foreshadowing abandon
  - Chapter status state machine: outline → draft → revision → done
  - Word count stats tracking
- **Performance Tests** (`packages/core/src/__tests__/writing-performance.test.ts`) — 7 benchmarks
  - 10K+ word content save: 1ms (< 50ms)
  - Large chapter load with content: 1ms (< 20ms)
  - Chapter metadata load: 0ms (< 10ms)
  - Save + version create: 2ms (< 50ms)
  - Rollback: 1ms (< 100ms)
  - Minimal context build: 1ms (< 100ms)
  - Full context build (16 items, 5 chars, 3 locs, arc, relationships, foreshadowing): 2ms (< 500ms)
- **AI Route Tests** — Updated existing tests for `excludedContextIds` passthrough + 1 new test

### New Files (2)
| File | Purpose |
|------|---------|
| `packages/server/src/routes/__tests__/e2e-writing-ai.test.ts` | 7 E2E tests for writing + plot integration |
| `packages/core/src/__tests__/writing-performance.test.ts` | 7 performance benchmarks |

### Modified Files (13)
| File | Change |
|------|--------|
| `packages/web/src/stores/useEditorStore.ts` | +cursorPosition, +excludedContextIds state/actions |
| `packages/web/src/pages/Write/EditorPanel.tsx` | DOM cursor tracking + contentRef prop |
| `packages/web/src/pages/Write.tsx` | Pass cursor + local content to modal |
| `packages/web/src/pages/Write/AcceptPreviewModal.tsx` | Insert-at-cursor merge + 3-part preview |
| `packages/web/src/pages/Write/AcceptPreviewModal.module.css` | +dividerAfter style |
| `packages/web/src/pages/Write/ContextPreview.tsx` | +checkboxes per item, excluded styling |
| `packages/web/src/pages/Write/ContextPreview.module.css` | +checkbox, +itemExcluded styles |
| `packages/web/src/pages/Write/AISidebar.tsx` | Pass excludedContextIds in request |
| `packages/server/src/routes/ai.ts` | +excludedContextIds in continueSchema |
| `packages/core/src/types/services.ts` | Updated continueScene signature |
| `packages/core/src/ai/AIService.ts` | Filter excluded context items |
| `packages/server/src/routes/__tests__/ai.test.ts` | Updated assertions + new exclusion test |
| `README.md` | Gemini 2.5 Pro → Gemini 3 Pro model name update |

### Stats
- Tests: **1015 passed** (44 files), 1 pre-existing flaky failure (WritingRepository cleanup timing)
- Build: clean (0 TS errors)
- All performance targets met with significant margin

### Deferred Items Resolved
- ~~Accept at cursor position~~ → implemented
- ~~Context item toggle on/off~~ → implemented

---

## 2026-02-09 (M3.5: Hackathon Submission) ✅

### Completed
- **Phase 1: English AI Prompts** — Translated all 5 prompt templates and context builder labels (templates.ts, BaseContextBuilder, ChapterContextBuilder, GlobalContextBuilder, AIService relationship labels). Updated test assertions.
- **Phase 2: Per-Request API Key (BYOK)** — Client sends `X-Gemini-Key` header from localStorage. GeminiProvider creates per-call GoogleGenAI instance. Added `POST /api/ai/verify-key` endpoint. AIService always registered (503 if no key).
- **Phase 3: API Key Dialog** — Zustand store (`useApiKeyStore`), modal with masked key display, verify flow, skip option. Shows on first visit when no key in localStorage.
- **Phase 4: Seed Loader** — Raw SQL execution approach (not service-based). SQL seed files exported as TS string constants (`sql-en.ts`, `sql-zh.ts`), bundled by tsup. Seeds include full Story Bible + 3 chapters with prose content per language. Endpoints: `GET /api/seed/status`, `POST /api/seed/load`, `POST /api/seed/clear`.
- **Phase 5: Welcome Screen & Settings** — WelcomeScreen with 3 cards (English Demo / Chinese Demo / Start Empty) shown when DB is empty. Settings page with API key management and seed data controls.
- **Phase 6: Deployment** — Multi-stage Dockerfile (node:20-slim + pnpm + better-sqlite3 native build). `.dockerignore` configured.
- **Phase 7: Submission Materials** — Updated DEVPOST_WRITEUP.md and HACKATHON_VIDEO_SCRIPT.md.

### Bug Fixes
- Fixed `clearAllData()` referencing non-existent `chapter_versions` table → corrected to `versions`
- Replaced service-based seeding (missing chapters/volumes) with raw SQL approach (complete data)

### New Files (10)
| File | Purpose |
|------|---------|
| `packages/core/src/db/seeds/sql-en.ts` | English seed SQL as TS string export |
| `packages/core/src/db/seeds/sql-zh.ts` | Chinese seed SQL as TS string export |
| `packages/core/src/db/seeds/seedRunner.ts` | Seed runner: runSeed, clearAllData, isDatabaseEmpty |
| `packages/server/src/routes/seed.ts` | Seed API routes (status/load/clear) |
| `packages/web/src/stores/useApiKeyStore.ts` | Zustand store for API key state |
| `packages/web/src/components/ApiKeyDialog.tsx` | API key entry/verification modal |
| `packages/web/src/components/ApiKeyDialog.module.css` | Dialog styles |
| `packages/web/src/components/WelcomeScreen.tsx` | First-run welcome with demo cards |
| `packages/web/src/components/WelcomeScreen.module.css` | Welcome screen styles |
| `Dockerfile` | Multi-stage Docker build |

### Modified Files (12)
| File | Change |
|------|--------|
| `packages/core/src/ai/templates.ts` | English prompt templates |
| `packages/core/src/ai/BaseContextBuilder.ts` | English section headers |
| `packages/core/src/ai/ChapterContextBuilder.ts` | English context labels |
| `packages/core/src/ai/GlobalContextBuilder.ts` | English context labels |
| `packages/core/src/ai/AIService.ts` | English labels + `setGeminiApiKey()` |
| `packages/core/src/ai/GeminiProvider.ts` | Per-call `apiKey` support |
| `packages/core/src/types/services.ts` | `setGeminiApiKey` on IAIService |
| `packages/server/src/index.ts` | BYOK startup, db in deps |
| `packages/server/src/routes/ai.ts` | `X-Gemini-Key` extraction, verify endpoint |
| `packages/web/src/App.tsx` | ApiKeyDialog + key loading |
| `packages/web/src/pages/Dashboard.tsx` | WelcomeScreen when empty |
| `packages/web/src/pages/Settings.tsx` | Functional key + seed management |

### Stats
- Tests: **1001 passed** (42 files)
- Build: clean (0 TS errors)
- Seed data: EN (6 chars, 3 chapters, 1 volume) + ZH (6 chars, 3 chapters, 1 volume)

---

## 2026-02-08 (M3 Phase 5: Plot UI) ✅

### Completed
- **Standalone Plot page** at `/plot` with 3-tab layout (Arcs | Foreshadowing | Hooks)
- **Sidebar navigation** with git-branch style plot icon
- **Arc Outliner**: Collapsible tree (Arc → Sections → Chapters)
  - Progress bars with gold fill, status badges (planned/in_progress/complete)
  - Type badges (main/sub), chapter click → Write page via `useEditorStore.getState().selectChapter()`
  - Empty state when no arcs defined
- **Foreshadowing Tracker**: Enhanced lifecycle visualization
  - Timeline component: planted → hints → resolved/pending (dot + line)
  - Status/term badges, overdue detection (orange border + warning badge)
  - Collapsible hints list
  - Add Hint modal (chapter number + text, uses Modal built-in footer)
  - Inline Resolve with chapter input, Abandon with ConfirmDialog
  - Sorted: active first, then by planted chapter
- **Hook Tracker**: Hooks grouped by chapter
  - 3-tier strength bars: low (muted, 0-33), mid (warning, 34-66), high (gold, 67-100)
  - Type badges (opening/arc/chapter) + style badges (suspense/anticipation/emotion/mystery)
  - Unattached hooks group for hooks without chapterId
- **Code review fixes**: Removed dead CSS class, fixed unconditional `...` truncation
- Build: 0 TS errors, full build clean

### New Files (10)
| File | Purpose |
|------|---------|
| `packages/web/src/pages/Plot.tsx` | Page orchestrator with 3 tabs |
| `packages/web/src/pages/Plot.module.css` | Page styles |
| `packages/web/src/pages/Plot/ArcOutliner.tsx` | Arc tree view with progress |
| `packages/web/src/pages/Plot/ArcOutliner.module.css` | Arc outliner styles |
| `packages/web/src/pages/Plot/ForeshadowingTracker.tsx` | Lifecycle tracker with timeline |
| `packages/web/src/pages/Plot/ForeshadowingTracker.module.css` | Tracker styles |
| `packages/web/src/pages/Plot/HookTracker.tsx` | Hooks by chapter with strength bars |
| `packages/web/src/pages/Plot/HookTracker.module.css` | Hook tracker styles |
| `packages/web/src/pages/Plot/AddHintModal.tsx` | Add hint to foreshadowing modal |
| `packages/web/src/pages/Plot/AddHintModal.module.css` | Modal styles |

### Modified Files (4)
| File | Change |
|------|--------|
| `packages/web/src/App.tsx` | Added `/plot` route |
| `packages/web/src/components/Icon.tsx` | Added `plot` icon (git-branch SVG) |
| `packages/web/src/components/layout/Sidebar.tsx` | Added Plot nav item |
| `packages/web/src/pages/index.ts` | Added Plot export |

### Next
- M3 Phase 6: Testing & Polish

---

## 2026-02-08 (M3 Phase 4: Chapter Editor UI) ✅

### Completed
- **Three-panel layout** replacing Write page stub
  - Left panel (280px): Chapters tab + Story Bible tab with arc filter
  - Center panel (flex): MDEditor with toolbar
  - Right panel (360px, collapsible): AI sidebar with SSE streaming
- **Foundation layer** (4 files)
  - `useChapters.ts`: React Query hooks — chapters (CRUD + filters), volumes, versions, context
  - `useEditorStore.ts`: Zustand store — selection, dirty tracking, AI state, UI preferences
  - `aiStream.ts`: SSE streaming utility via `fetch()` + `ReadableStream` (POST endpoints)
  - Updated `hooks/index.ts` barrel exports
- **ChapterListPanel**: Arc-filtered chapter list with status badges, word count, delete with confirm
- **StoryBiblePanel**: Collapsible sections showing chapter FK refs (characters, locations, foreshadowing)
- **ChapterForm**: Create/edit modal following CharacterForm pattern
- **EditorPanel**: `@uiw/react-md-editor` with dark gold theme overrides
  - Ctrl+S / Cmd+S save with version creation
  - Dirty tracking + `beforeunload` guard
  - Save indicator with time-ago display
- **EditorToolbar**: Chapter title (clickable to edit), status badge, word count, save button, AI toggle
- **AISidebar**: Continue + Brainstorm quick actions, prompt input, streaming response, accept/reject/regenerate
- **ContextPreview**: Built context items grouped by layer (L1-L5) with token count
- **StreamingResponse**: Auto-scrolling response area with pulsing loading indicator
- **RejectReasonModal**: Required reason input on reject, feeds into regenerate
- **Word count**: CJK chars counted individually, English by whitespace split
- Build: 0 TS errors, 984 tests pass, full build clean

### New Files (19)
| File | Purpose |
|------|---------|
| `packages/web/src/hooks/useChapters.ts` | React Query hooks for chapters, volumes, versions, context |
| `packages/web/src/stores/useEditorStore.ts` | Zustand store for editor UI state |
| `packages/web/src/lib/aiStream.ts` | SSE streaming fetch utility |
| `packages/web/src/pages/Write.module.css` | Three-panel layout styles |
| `packages/web/src/pages/Write/ChapterListPanel.tsx` | Chapter list with arc filter |
| `packages/web/src/pages/Write/ChapterListPanel.module.css` | |
| `packages/web/src/pages/Write/StoryBiblePanel.tsx` | Chapter FK quick-ref |
| `packages/web/src/pages/Write/StoryBiblePanel.module.css` | |
| `packages/web/src/pages/Write/ChapterForm.tsx` | Create/edit chapter modal |
| `packages/web/src/pages/Write/EditorPanel.tsx` | MDEditor wrapper |
| `packages/web/src/pages/Write/EditorPanel.module.css` | Dark gold theme overrides |
| `packages/web/src/pages/Write/EditorToolbar.tsx` | Toolbar with save, word count, AI toggle |
| `packages/web/src/pages/Write/EditorToolbar.module.css` | |
| `packages/web/src/pages/Write/AISidebar.tsx` | AI panel orchestrator |
| `packages/web/src/pages/Write/AISidebar.module.css` | |
| `packages/web/src/pages/Write/ContextPreview.tsx` | Context items display |
| `packages/web/src/pages/Write/ContextPreview.module.css` | |
| `packages/web/src/pages/Write/StreamingResponse.tsx` | Streaming response area |
| `packages/web/src/pages/Write/StreamingResponse.module.css` | |
| `packages/web/src/pages/Write/RejectReasonModal.tsx` | Reject reason modal |
| `packages/web/src/pages/Write/RejectReasonModal.module.css` | |

### Modified Files (3)
| File | Change |
|------|--------|
| `packages/web/package.json` | Added `@uiw/react-md-editor` dependency |
| `packages/web/src/pages/Write.tsx` | Replaced stub with three-panel orchestrator |
| `packages/web/src/hooks/index.ts` | Added chapter/volume/version/context hook exports |

### Deferred to Post-Phase 4
- Dialogue/Describe AI modes (need character selector, location+mood picker UI)
- Context item toggle on/off (L2-L5 controllable)
- "Add to AI context" from Story Bible panel
- Brainstorm → Accept → auto-Continue flow
- Accept at cursor position (currently appends at end)
- Chapter drag-and-drop reordering
- Volume management UI

### Next
- M3 Phase 5: Plot UI (Arc Outliner, Foreshadowing Tracker)

---

## 2026-02-08 (M3 Phase 3: Writing API Routes) ✅

### Completed
- **Writing API Routes** (`packages/server/src/routes/writing.ts`, 377 lines)
  - 4 route factories: `volumeRoutes`, `chapterRoutes`, `versionRoutes`, `statsRoutes`
  - 18 endpoints total across 4 URL prefixes:
    - `/api/volumes` (5): GET list, GET by id, POST create, PATCH update, DELETE cascade
    - `/api/chapters` (10): GET list (filter by volumeId/arcId/status), GET by id (?includeContent), POST create, PATCH update, PUT content, POST reorder, DELETE, GET versions, POST version, POST rollback
    - `/api/versions` (2): GET by id, GET compare (?versionId1&versionId2)
    - `/api/stats` (1): GET word-count
  - 9 Zod schemas for request validation (consistent with Phase 2 AI routes)
  - `validateBody<T>()` and `validateQuery<T>()` helper functions
- **Server Bootstrap** (`packages/server/src/index.ts`)
  - `createServices()` now creates WritingService with shared repos + EventBus
  - `ServerOptions.writingService?: IWritingService` for DI
  - Route deps wiring: conditional registration when writingService provided
  - `/api` info endpoint updated with volumes, chapters, versions, stats entries
  - CLI entry point updated to pass writingService to startServer
- **Route Registration** (`packages/server/src/routes/index.ts`)
  - `RouteDeps.writingService?: IWritingService` added
  - 4 writing route groups conditionally registered
- **Test Infrastructure** (`packages/server/src/routes/__tests__/testHelper.ts`)
  - `TestContext` extended with `writingService: WritingService`
  - `createTestServer()` creates WritingRepository + WritingService with shared repos
- **Integration Tests** (`packages/server/src/routes/__tests__/writing.test.ts`, 39 tests)
  - Volume API: 7 tests (CRUD + cascade delete + validation)
  - Chapter API: 16 tests (CRUD + filtering + content + reorder + status transitions)
  - Version API: 8 tests (create + list + get + compare + rollback + cross-chapter rejection)
  - Stats API: 2 tests (initial zero + total word count)
  - **976 total tests passing** across 41 test files, build clean (0 errors)

### New Files (2)
| File | Purpose |
|------|---------|
| `packages/server/src/routes/writing.ts` | 4 route factories, 18 endpoints, Zod schemas |
| `packages/server/src/routes/__tests__/writing.test.ts` | 39 integration tests |

### Modified Files (4)
| File | Change |
|------|--------|
| `packages/server/src/routes/index.ts` | RouteDeps + writing route registration |
| `packages/server/src/index.ts` | WritingService creation + ServerOptions + /api info |
| `packages/server/src/routes/__tests__/testHelper.ts` | WritingService in TestContext |
| `Meta/Milestone/M3.md` | Phase 3 checkboxes marked complete |

### Next
- M3 Phase 4: Chapter Editor UI
- M3 Phase 5: Plot UI

---

## 2026-02-08 (M3 Phase 2: AI Service) ✅

### Completed
- **GeminiProvider** (`packages/core/src/ai/GeminiProvider.ts`, 198 lines)
  - Wraps `@google/genai` SDK for Gemini 2.5 Pro streaming generation
  - Retry with exponential backoff (3 attempts, 1s → 2s → 4s)
  - Error mapping: auth (401/403), rate limit (429), content filter, context too large
  - Extracts `usageMetadata` (promptTokenCount, candidatesTokenCount) from streaming response
  - Lazy client initialization, `isConfigured()` guard
- **ContextBuilder** (`packages/core/src/ai/ContextBuilder.ts`, 513 lines)
  - 5-layer FK-based context assembly with priority-based token budget management
  - L1 (1000): chapter content + outline + previous chapter tail (500 chars)
  - L2 (800): characters, relationships (scoped), locations, arc — batch `findByIds()` queries
  - L3 (600): foreshadowing (hinted + active, deduped), previous chapter hooks
  - L4 (400): power system core rules, social rules
  - L5 (200): user-selected additional items
  - `formatContext()` outputs structured markdown grouped by semantic category (前文, 本章大纲, 角色档案, 世界规则, 剧情线索, 补充信息)
  - Token budget: 1M total − 4K output reserve − 2K prompt reserve = 994K available
- **PromptAssembler** (`packages/core/src/ai/PromptAssembler.ts`)
  - YAML-like front-matter parsing + `{{variable}}` substitution
  - 5 built-in templates: continue, dialogue, describe, brainstorm, ask_bible
- **tokenCounter** (`packages/core/src/ai/tokenCounter.ts`)
  - Heuristic estimation: CJK × 1.5, English words × 1.3, mixed = sum of both
- **AIService** (`packages/core/src/ai/AIService.ts`, 456 lines)
  - Implements `IAIService` with 6 generation methods + context building + provider management
  - `generateWithContext()`: context-aware generation (continueScene, describeScene)
  - `streamWithEvents()`: prompt-only generation (dialogue, brainstorm, ask, complete)
  - EventBus integration: STARTED → CONTEXT_BUILT → PROGRESS → COMPLETED/ERROR
  - Monitoring metrics: input tokens, output tokens, latency (ms) in COMPLETED events
  - Prefers provider-reported token counts over heuristic estimates
- **SSE API Routes** (`packages/server/src/routes/ai.ts`, 151 lines)
  - 6 SSE streaming endpoints: POST /continue, /dialogue, /describe, /brainstorm, /ask, /complete
  - 2 JSON endpoints: POST /context, GET /providers
  - Zod schema validation on all request bodies (7 schemas + shared `aiGenerationOptionsSchema` and `contextItemSchema`)
  - `validateBody()` returns 400 + `VALIDATION_ERROR` for invalid requests
  - `streamSSE()` helper with proper headers and error handling
- **Server Integration** (`packages/server/src/index.ts`)
  - Refactored bootstrap: shared DB + repos + EventBus for both StoryBibleService and AIService
  - Reads `GEMINI_API_KEY` from `process.env`, logs AI service availability
  - AI routes registered at `/api/ai` prefix
- **Error Classes** — `AIProviderError` with 4 error codes (AI_PROVIDER_ERROR, AI_RATE_LIMITED, AI_CONTEXT_TOO_LARGE, AI_CONTENT_FILTERED)
- **Type System Updates**
  - 12 granular `ContextItemType` values (chapter_content, chapter_outline, chapter_prev_tail, character, relationship, location, arc, foreshadowing, hook, power_system, social_rules, custom)
  - `AIStreamChunk.usage` field for provider-reported token counts
  - `AIGenerationCompletedEvent.latencyMs` for monitoring
  - `AI_CONTEXT_BUILT` added to `BROADCAST_EVENTS`
- **Batch Query Optimization**
  - `findByIds()` added to CharacterRepository, LocationRepository, ForeshadowingRepository
  - ContextBuilder L2/L3 use batch queries (eliminates N+1)
- **Tests** (109 new tests across 7 test files)
  - tokenCounter: 10 tests (CJK, English, mixed, empty, special chars)
  - PromptAssembler: 12 tests (parsing, substitution, caching, edge cases)
  - ContextBuilder: 16 tests (all 5 layers, budget truncation, formatContext, integration)
  - GeminiProvider: 10 tests (streaming, retry, auth error, content filter, isConfigured)
  - AIService: 22 tests (6 generation methods, events, errors, provider management)
  - AI routes: 18 tests (SSE headers/format, JSON responses, error handling, Zod validation, no-service)
  - WritingRepository: 50 tests, WritingService: 77 tests (from Phase 1, now also on ms3)
  - **936 total tests passing** across 40 test files, build clean (0 errors)

### Code Review Fixes Applied (P1/P2)
- P1: Added monitoring metrics (inputTokens, latencyMs) to AI_GENERATION_COMPLETED event
- P2: Added JSDoc to all public AIService provider management methods
- P2: Eliminated N+1 queries with batch `findByIds()` in ContextBuilder
- Fixed ~15 `exactOptionalPropertyTypes` TypeScript errors across GeminiProvider, ContextBuilder, PromptAssembler, server bootstrap
- Fixed unused imports/fields causing DTS build failures

### New Files (15)
| File | Purpose |
|------|---------|
| `packages/core/src/ai/tokenCounter.ts` | Token estimation |
| `packages/core/src/ai/templates.ts` | 5 prompt template strings |
| `packages/core/src/ai/PromptAssembler.ts` | Template variable substitution |
| `packages/core/src/ai/ContextBuilder.ts` | 5-layer FK context assembly |
| `packages/core/src/ai/GeminiProvider.ts` | @google/genai SDK wrapper |
| `packages/core/src/ai/AIService.ts` | IAIService implementation |
| `packages/core/src/ai/__tests__/tokenCounter.test.ts` | Tests |
| `packages/core/src/ai/__tests__/PromptAssembler.test.ts` | Tests |
| `packages/core/src/ai/__tests__/ContextBuilder.test.ts` | Tests |
| `packages/core/src/ai/__tests__/GeminiProvider.test.ts` | Tests |
| `packages/core/src/ai/__tests__/AIService.test.ts` | Tests |
| `packages/server/src/routes/ai.ts` | SSE API routes |
| `packages/server/src/routes/__tests__/ai.test.ts` | Route tests |
| `.env.local.example` | API key template |
| `CODE_REVIEW_M3_PHASE2.md` | Code review notes |

### Next
- M3 Phase 3: Plot System API + Writing API endpoints
- M3 Phase 4: Writing UI

---

## 2026-02-07 (M3 Phase 1: Writing Service) ✅

### Completed
- **WritingRepository** (`packages/core/src/db/repositories/WritingRepository.ts`, 738 lines)
  - Volume CRUD (5 methods): create, findById, findAll, update, delete
  - Chapter CRUD (9 methods): create, findById, findWithContent, findAll, findByVolume, findByArc, findByStatus, update, delete, reorder (stub)
  - Content operations (3 methods): saveContent (with word count), getWordCount, getTotalWordCount
  - Version management (5 methods): createVersion, findVersionsByChapter, findVersionById, deleteVersion, cleanupOldVersions (stratified retention)
  - FK cleanup (3 methods): cleanupCharacterReferences, cleanupLocationReferences, cleanupForeshadowingReferences
  - Word count supports CJK + English mixed content
  - Performance: content field excluded from list queries (findChapterById vs findChapterWithContent)
- **WritingService** (`packages/core/src/services/WritingService.ts`, 650 lines)
  - 25 active methods implementing IWritingService interface
  - FK validation: volumeId, arcId, characters[], locations[], foreshadowingHinted[]
  - Chapter status state machine: outline → draft → revision → done (sequential enforcement)
  - Version control: manual version, rollback with backup (source: 'rollback_backup')
  - EventBus integration: 10 event types (CHAPTER_CREATED/UPDATED/SAVED/DELETED/ROLLED_BACK/STATUS_CHANGED, CHAPTERS_REORDERED, VOLUME_CREATED/UPDATED/DELETED, VERSION_CREATED, VERSIONS_CLEANED_UP)
  - Cascade delete: deleteVolume removes all chapters in volume
  - Deferred stubs: Goals, Sessions, Stats (11 methods throw with clear message)
- **Event types updated** (`packages/core/src/types/events.ts`)
  - Added 9 new event interfaces for Writing module
  - Updated AppEvent union type and BROADCAST_EVENTS list
- **Type system updated** (`packages/core/src/types/services.ts`)
  - Added CreateVolumeInput, UpdateVolumeInput, UpdateChapterInput types
  - Extended CreateChapterInput with status, characters, locations, foreshadowingHinted
  - Aligned IWritingService interface: createVersion uses object param, return types match implementation
- **Tests** (50 repo tests + 77 service tests = 127 new tests)
  - WritingRepository: 50 tests (Volume CRUD 8, Chapter CRUD 12, Content 8, Versions 12, FK Cleanup 10)
  - WritingService: 77 tests (Volumes 15, Chapters 25, Content 12, Versions 25)
  - All 818 tests passing, typecheck clean (0 errors)

### Decisions Made
- Chapter status transitions are sequential forward only (outline→draft→revision→done), backward transitions always allowed
- saveContent returns chapter without content field (performance optimization, use getChapterWithContent for full data)
- Version cleanup only targets 'auto' source by default, preserves manual/ai_backup/rollback_backup
- Deferred methods (Goals, Sessions, Stats) throw clear errors rather than returning empty data
- Reorder chapters is a validation-only stub (no position column in DB yet)

### Code Review Fixes Applied
- Fixed 30 TypeScript errors (missing types, interface mismatches, exactOptionalPropertyTypes)
- Fixed 3 test failures (saveContent return expectations, cleanup sourceFilter)
- Fixed rollback backup source ('ai_backup' → 'rollback_backup' per doc spec)
- Fixed VolumeStatus enum value ('completed' → 'complete')
- Added state machine transition enforcement
- Aligned deferred stubs with IWritingService signatures

### Next
- M3 Phase 2: AI Service (GeminiProvider, ContextBuilder, PromptAssembler)
- M3 Phase 3: Plot System API + Writing API endpoints

---

## 2026-02-07 (M2 Phase 6: Testing & Polish) ✅

### Completed
- **M2 Phase 6: Testing & Polish** — M2 Story Bible Core is now complete!
  - **CLI Bible Command Tests** (`packages/tui/src/__tests__/bible.test.ts`):
    - 17 integration tests for `bible list/show/search` commands
    - Tests cover all entity types (characters, relationships, locations, factions, timeline, arcs, foreshadowing, hooks)
    - Validates output formatting, error handling, and search functionality
    - All tests pass with real database integration
  - **Performance Test Infrastructure**:
    - Performance seed script (`packages/core/src/db/seeds/perf-test.ts`): generates 120 characters, 240 relationships, 30 locations, 20 factions
    - Script: `pnpm --filter @inxtone/core seed:perf`
    - Data generation completes in < 0.1s
  - **Performance Tests** (`packages/core/src/__tests__/performance.test.ts`):
    - 12 performance benchmarks covering:
      - Character loading: 120 chars in 0ms ✨
      - FTS5 search: < 50ms (6-21 results in 0ms) ✨
      - Relationship queries: 240 rels in 1ms
      - Batch operations: 0.1-0.2ms per character (create/update/delete)
      - Concurrent queries: 4 parallel queries in 2ms
      - Database size: 0.37MB for 120 characters + 240 relationships
      - FTS5 index verification: 130 entries
    - All performance targets met with significant margin
  - **Test Suite Summary**:
    - **695 total tests** across 32 test files (up from 666)
    - Added: 17 CLI tests + 12 performance tests
    - 100% passing, duration 1.28s
    - Coverage: Repository (9 files), Service (2 files), API (9 files), Contract (4 files), DB (3 files), TUI (2 files), Performance (1 file)

### Decisions Made
- Browser UI E2E tests deferred to post-M2 (requires Playwright/Cypress setup, diminishing returns vs comprehensive integration tests)
- Performance benchmarks validate production readiness: sub-millisecond operations, efficient FTS5 indexing
- CLI bible commands fully testable via integration tests with real database

### M2 Completion Metrics
- **6 Phases completed**: Repository → Service → API → Web UI → CLI → Testing & Polish
- **695 tests passing** across all layers
- **45 REST API endpoints** for 9 Story Bible domains
- **Full Web UI** with forms, error handling, design system compliance
- **3 CLI commands** for browsing Story Bible via terminal
- **Comprehensive documentation**: Demo seed data + performance benchmarks
- **Production-ready performance**: 120+ characters, < 100ms queries, 0.37MB database

### Next
- Begin M3 planning (Writing Workspace + AI Integration)
- Update milestone roadmap with M2 completion

---

## 2026-02-07 (Demo Seed Data)

### Completed
- **Demo Story Seed Script** — Comprehensive dataset for showcasing all Story Bible features
  - **Story**: 《墨渊记》Ink Abyss Chronicles — Xianxia cultivation story with 6 characters
  - **Dataset includes**:
    - 6 characters with full profiles (林墨/MC, 苏澜/love interest, 云阙/antagonist, 白霜/mentor, 墨殿主/villain, 小竹/support)
    - 7 relationships with Wayne Principles fields (mentor, lover, rival, enemy, companion, confidant relationships)
    - World settings: 5-level power system (墨道修炼体系) + 6 social rules
    - 4 locations with atmosphere (青墨峰, 墨渊城, 墨海, 墨殿)
    - 3 factions (青云宗, 墨殿, 散修联盟) with goals and internal conflicts
    - 5 timeline events spanning 100 years
    - 2 story arcs (main 30-chapter arc + sub arc with sections)
    - 3 foreshadowing items (long/mid/short term payoffs)
    - 4 hooks (opening, arc-level, chapter hooks)
  - **Implementation**: `packages/core/src/db/seeds/demo-story.ts` (652 lines)
    - Exports typed data constants for all 9 Story Bible domains
    - `seedDemoStory()` function with proper ID mapping and insertion order
    - Rich console output with emojis and progress indicators
    - Handles ID substitution for relationships, factions, timeline events
    - Error handling and database cleanup
  - **Usage**: `pnpm --filter @inxtone/core seed:demo`
  - **Purpose**: Complete dataset for UI fine-tuning and feature showcasing

### Decisions Made
- Writes to `~/.inxtone/data.db` (same database as dev server) for persistent demo data
- Supports custom path via `DB_PATH` environment variable
- Character IDs mapped from placeholder (C001, C002) to actual generated IDs
- Location IDs mapped similarly (L001, L002, etc.)
- All 9 repositories initialized with proper dependency injection
- Simplified data structure (removed fields not in Create input types like `arc`, `facets`, `evolution`, `progress`, `hints`)

### Next
- UI fine-tuning with demo data loaded
- Visual polish and design refinements

---

## 2026-02-07 (Phase 5: CLI Commands)

### Completed
- **M2 Phase 5: CLI Bible Commands** — Full CLI interface for browsing Story Bible via terminal
  - **3 subcommands implemented**:
    - `inxtone bible list [type]` — List all entities or filter by type (characters, relationships, locations, factions, timeline, arcs, foreshadowing, hooks)
    - `inxtone bible show <type> <id>` — Show detailed information about a specific entity with formatted output
    - `inxtone bible search <query>` — Full-text search across characters, locations, and factions
  - **Rich CLI formatting**:
    - Colored output with chalk (cyan headers, yellow highlights, gray metadata)
    - Emoji icons for each entity type (👤 📍 🛡️ ⏱️ 📖 🔮 🪝)
    - Structured display with proper indentation and spacing
    - Error handling with helpful error messages
  - **Implementation details**:
    - `packages/tui/src/commands/bible.ts`: 524 lines, single-file implementation
    - Initializes StoryBibleService with all 9 repositories from local `inxtone.db`
    - Validates entity types and IDs before queries
    - All async service calls properly awaited
  - **Integration**:
    - Updated `cli.tsx` to register bible command group
    - Added exports to `commands/index.ts`
    - Builds successfully, all TypeScript checks pass
  - **Testing**: Manual testing confirmed all commands work correctly with empty databases and error states

### Decisions Made
- Bible commands operate on local `inxtone.db` in current directory (no remote/server mode)
- Error messages guide users to valid entity types when invalid type provided
- Search is case-insensitive and filters across name/significance fields
- Output formatting uses emojis for visual categorization

### Next
- M2 Phase 6: Testing & Polish (write automated tests, performance testing, documentation)

---

## 2026-02-07 (Web UI Fixes & Dashboard)

### Completed
- **Dashboard stats integration** — Dashboard now displays actual character count from database
- **Character creation cache fix** — Fixed "Character null not found" 404 error after creating characters
  - Root cause: `closeForm()` only cleared `formMode` but not `selectedId`, causing stale detail queries
  - Fix: Updated `useStoryBibleStore.closeForm()` to clear both `formMode` and `selectedId`
  - Dashboard: Added `useCharacters()` hook to display real-time character count instead of hardcoded 0

### Next
- Continue with M2 Phase 5: CLI Commands (already started)

---

## 2026-02-07 (continued)

### Completed
- **M2 Phase 4: Web UI Fixes** — Comprehensive code review and bug fixes for Story Bible UI
  - **Critical fixes (6 items)**:
    - `CharacterForm.tsx`: Full modal with create/edit modes, all fields (name*, role*, appearance, 3-layer motivation, conflictType, template, voiceSamples)
    - `RelationshipForm.tsx`: Modal with character selects + Wayne Principles fields (joinReason, independentGoal, disagreeScenarios, leaveScenarios, mcNeeds)
    - `WorldSettings.tsx`: Inline editing with toggle mode, array editors for levels/rules/constraints, key-value editor for social rules
    - `useDeleteForeshadowing` hook: Fixed broken delete functionality in ForeshadowingList
    - Error handling: Added `onError` callbacks with `showError()` helper to all 26 mutations across 9 hook files
    - 6 lightweight forms created (Location, Faction, Timeline, Arc, Foreshadowing, Hook) and integrated into List components — **completely removed all `window.prompt()` usage**
  - **High priority fixes (5 items)**:
    - API client status checks: Added `res.ok` validation before JSON parsing in all 5 API methods (apiGet, apiPost, apiPatch, apiPut, apiDelete)
    - Query key cache consistency: Added `normalizeFilters()` helper to 4 hooks (useCharacters, useRelationships, useHooks, useForeshadowing) to prevent duplicate cache entries from undefined filter values
    - Delete mutation invalidation: Fixed 5 delete mutations to use `queryClient.removeQueries()` on detail cache instead of just invalidating list
    - RelationshipList performance: Memoized character name map with `useMemo` + `useCallback` for O(1) lookups instead of O(n) linear search
    - Type guards: Added `error instanceof Error` checks for safe error message display
  - **Medium priority fixes (1 item)**:
    - CrudTable: Removed redundant row onClick handler, added try/catch error handling to delete operation
  - **Files modified**: 40+ files (15 created, 25+ modified)
    - Created 8 form components + 1 utility file
    - Modified 9 hook files (error handling + cache fixes)
    - Modified 8 List components (form integration)
    - Modified 1 API client + 1 CrudTable component
  - All critical issues resolved, UI fully functional with proper error handling and design system compliance

### Decisions Made
- All forms use Modal component from design system (no more window.prompt)
- Error messages use centralized `showError()` helper for consistency
- Delete mutations remove detail cache to prevent stale data after entity deletion
- Query keys normalized to prevent cache fragmentation from filter variations

### Next
- Begin M2 Phase 4 remaining work: StoryBible main page integration, tab navigation, remaining domain UI

---

## 2026-02-07

### Completed
- **M2 Phase 3: API Layer** — Fastify REST routes for all 9 Story Bible domains
  - 45 endpoints across 9 route files: characters (7), relationships (5), world (3), locations (5), factions (5), timeline (3), arcs (5), foreshadowing (7), hooks (5)
  - Error handler middleware: maps `InxtoneError.statusCode` to HTTP responses
  - Response utilities: `success<T>(data)` and `error(code, message)` helpers
  - Route factory pattern with DI: `(deps: RouteDeps) => FastifyPluginAsync`
  - Server bootstrap: DI via `ServerOptions.storyBibleService`, conditional route registration
  - Interface additions: `getAllRelationships()`, `getAllHooks()` on `IStoryBibleService`
  - `tsup.config.ts`: added `src/services/index.ts` entry for `@inxtone/core/services` export
  - `core/src/index.ts`: added `export * from './errors/index.js'` (resolves TD-020)
  - 76 route integration tests (9 test files), all passing via `fastify.inject()`
  - API deviations documented in `docs/API_DEVIATIONS.md`
  - 666 total tests passing across 30 test files (up from 590)
- **M2 Phase 2: Service Layer** — EventBus + StoryBibleService fully implemented and tested
  - `EventBus`: pub/sub with metadata injection (UUID + timestamp), sync/async emit, error isolation, onAny/off/removeAllListeners (192 lines)
  - `StoryBibleService`: 41-method service layer with DI (10 repos + EventBus), input validation, 27 event emission points covering all CRUD operations (720 lines)
  - Code review: 6 issues found and fixed
    - Unified `CreateArcInput`/`CreateHookInput` to `services.ts` (single source of truth)
    - Fixed event shapes in `events.ts` to match runtime emission (added `changes?` fields, Timeline events, Foreshadowing-specific events)
    - Fixed Hook ID prefix inconsistency (`HK` consistently)
    - Removed `Parameters<>` workaround in StoryBibleService
    - Fixed `ForeshadowingRepository.getStats()` SQL returning null instead of 0 (COALESCE fix)
  - 3 bonus repositories: `ArcRepository` (52 tests), `ForeshadowingRepository` (52 tests), `HookRepository` (47 tests)
  - Integration tests: EventBus (37 tests), StoryBibleService (61 tests)
  - 590 total tests passing across 21 test files (up from 341)
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
- Begin M2 Phase 4: Web UI (Character, World, Relationship pages)

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
