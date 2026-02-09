# Inxtone

**AI-Native Storytelling Framework** — Where your AI actually knows your story.

Inxtone is a writing tool for serial fiction authors that deeply integrates Gemini 2.5 Pro with a structured Story Bible. Instead of sending blind prompts to an LLM, Inxtone automatically assembles five layers of story context — characters, relationships, world rules, plot threads, and foreshadowing — so every AI generation is grounded in YOUR story.

## Features

**Story Bible** — Define characters with layered motivations, track relationships with independent goals, build world systems with rules and constraints, manage factions, timeline events, and locations.

**Context-Aware AI Writing** — Six AI modes powered by Gemini 2.5 Pro: scene continuation, dialogue generation, scene description, brainstorming, story bible Q&A, and freeform completion. Every mode receives structured context from your Story Bible via a five-layer priority system.

**Chapter Editor** — Three-panel layout with chapter management, markdown editor (with live preview), and an AI sidebar with real-time streaming responses. Accept, reject with feedback, or regenerate.

**Plot Management** — Arc outliner with progress tracking, foreshadowing lifecycle tracker (plant → hint → payoff) with overdue detection, and hook strength scoring.

**Version Control** — Automatic backup before every AI generation. Manual versioning, rollback with safety backup, and version comparison.

## Tech Stack

- **AI**: Gemini 2.5 Pro via `@google/genai` SDK
- **Backend**: TypeScript, Fastify, SQLite (better-sqlite3), FTS5 full-text search
- **Frontend**: React 18, Vite, Zustand, React Query, CSS Modules
- **Architecture**: pnpm monorepo with 4 packages (core, server, web, tui)
- **Testing**: Vitest, 984 tests across 41 test files

## Quick Start

```bash
# Clone and install
git clone https://github.com/VW-ai/Inxtone.git
cd Inxtone
pnpm install

# Set up your Gemini API key
cp .env.local.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
# Get a free key at: https://aistudio.google.com/apikey

# Build and run
pnpm build
pnpm --filter @inxtone/server dev

# Load demo data (optional)
pnpm --filter @inxtone/core seed:demo
```

The app runs at `http://localhost:3456`.

## How It Works

### Five-Layer Context Assembly

When you trigger any AI generation, Inxtone builds a structured context from your Story Bible:

| Layer | Priority | Content |
|-------|----------|---------|
| L1 | 1000 | Chapter content, outline, previous chapter |
| L2 | 800 | Characters, relationships, locations (FK-linked) |
| L3 | 600 | Foreshadowing seeds, narrative hooks |
| L4 | 400 | Power system rules, social constraints |
| L5 | 200 | User-pinned supplementary context |

Context is priority-truncated to fit Gemini's token budget (up to 1M tokens), ensuring the most relevant story information is always included.

### BYO API Key

Inxtone uses a Bring-Your-Own-Key model. Enter your Gemini API key in Settings — it's stored locally in your browser and sent securely with each request. We never store your key on our servers.

## Project Structure

```
packages/
  core/     # Types, database, repositories, services, AI engine
  server/   # Fastify HTTP server, REST API, SSE streaming
  web/      # React SPA — Story Bible, Editor, Plot, Dashboard
  tui/      # Terminal UI and CLI commands
```

## API

45+ REST endpoints covering Story Bible CRUD, chapter management, version control, and 8 AI endpoints (6 SSE streaming + 2 JSON).

## License

MIT

## Built With

Built for the [Gemini API Developer Competition](https://ai.google.dev/competition) using Gemini 2.5 Pro.
