# Technical Architecture

> High-level system design, CLI commands, and data storage

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~160 | **Updated**: 2026-02-05

*Note: This file contains ASCII diagrams (atomic blocks) that exceed normal line limits.*

---

## 7.1 System Overview

**Architecture: CLI + Local Web UI**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S MACHINE                                 │
│                                                                             │
│   Terminal                        Browser (localhost:3456)                  │
│   ┌─────────────────┐            ┌─────────────────────────────────────┐   │
│   │ $ inxtone      │←───TUI────→│  ┌─────────┐ ┌─────────┐ ┌───────┐ │   │
│   │ $ inxtone serve│───────────→│  │Dashboard│ │  Story  │ │Writing│ │   │
│   │                 │            │  │         │ │  Bible  │ │  ...  │ │   │
│   │ $ inxtone      │            │  └─────────┘ └─────────┘ └───────┘ │   │
│   │   export md     │            │         React + Vite Frontend       │   │
│   └─────────────────┘            └─────────────────────────────────────┘   │
│          │                                         │                        │
│          ▼                                         ▼                        │
│   ┌─────────────────────────────────────────────┐                          │
│   │            Inxtone Core (TypeScript)         │                          │
│   │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │                          │
│   │  │ HTTP API │ │  File    │ │  AI Bridge  │ │                          │
│   │  │ Server   │ │  Watcher │ │  (Gemini)   │ │                          │
│   │  └──────────┘ └──────────┘ └─────────────┘ │                          │
│   │  ┌──────────────────────────────────────┐  │                          │
│   │  │    SQLite (Source of Truth) + FTS5   │  │                          │
│   │  └──────────────────────────────────────┘  │                          │
│   └─────────────────────────────────────────────┘                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────────┐                                                      │
│   │  Project Folder │   my-novel/                                          │
│   │                 │   ├── inxtone.db (Source of Truth)                   │
│   │                 │   ├── inxtone.yaml (config)                          │
│   │                 │   └── exports/ (Markdown)                            │
│   └─────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   Gemini API (BYOK) │
                          └─────────────────────┘
```

---

## 7.2 Project Structure (Local Files)

**Core Principle: SQLite = Source of Truth, Markdown = Export Format**

```
my-novel/
├── inxtone.db             # SQLite database (Source of Truth)
├── inxtone.yaml           # Project config (title, author, settings)
├── exports/               # Markdown exports (for external editing/backup)
│   ├── story-bible/
│   │   ├── characters/    # Character profiles
│   │   ├── world/         # World building
│   │   └── plot/          # Plot outlines
│   └── draft/
│       ├── arc-1/
│       │   ├── 001-awakening.md
│       │   └── 002-first-trial.md
│       └── arc-2/
├── assets/                # Images, references
└── .git/                  # Optional: version control
```

**Workflow:**
- All data stored in `inxtone.db` (single source of truth)
- Markdown in `exports/` for human editing, git versioning
- FileWatcher syncs external edits back to SQLite

---

## 7.3 CLI Commands

```bash
# Startup Modes
inxtone                       # TUI mode (interactive)
inxtone serve                 # HTTP Server + TUI
inxtone serve --no-tui        # HTTP Server only (headless)

# Project Management
inxtone init [name]           # Create new project
inxtone init --template xiuxian  # Use template
inxtone open [path]           # Open project

# Quick Commands (non-interactive)
inxtone check                 # Run consistency check
inxtone check --fix           # Auto-fix issues
inxtone export md             # Export to Markdown
inxtone export docx           # Export to Word

# Story Bible
inxtone bible list characters
inxtone bible show character lin-yi
inxtone bible search "林逸 关系"

# Writing
inxtone write                 # Enter writing mode
inxtone write 42              # Edit chapter 42

# AI
inxtone ai ask "林逸和苏瑶是什么关系？"
inxtone ai continue 42        # AI continue chapter 42

# Config
inxtone config set ai.provider claude
inxtone config get ai.model
```

---

## 7.4 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Core Runtime | **TypeScript** | Fast dev, single language across stack |
| HTTP Server | Fastify | Fast, lightweight |
| Frontend | **React + Vite** | Familiar stack, fast HMR |
| Editor | TipTap / CodeMirror 6 | Markdown-native, extensible |
| Storage | **SQLite** | Source of Truth, structured relationships |
| Export | **Markdown** | Human-readable, git-friendly, external editing |
| Search | **SQLite FTS5** | Zero-config, fast full-text search |
| AI | **Gemini/Claude (BYOK)** | User provides key, no server costs |

---

## 7.5 IPC Communication

**TUI and Web GUI use different communication patterns:**

| Mode | Communication | Description |
|------|--------------|-------------|
| TUI | Direct Import | Same process, calls Services directly |
| Web GUI | HTTP + WebSocket | Cross-process, REST API + real-time sync |

```
┌─────────────┐         ┌─────────────┐
│   TUI App   │         │  Web GUI    │
│  (Ink/CLI)  │         │  (React)    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ Direct Import         │ HTTP/WebSocket
       │ (同进程)              │ (跨进程)
       │                       │
       └───────────┬───────────┘
                   │
           ┌───────┴───────┐
           │    Server     │
           │  (Fastify)    │
           │  + Services   │
           │  + SQLite     │
           └───────────────┘
```

---

## 7.6 AI Context Strategy

For million-word novels, context management is critical:

**ContextBuilder** assembles context with priority ordering:

1. **Critical** (always included):
   - Wayne principles summary
   - Character voice samples (in scene)
   - Active world constraints
2. **High priority**:
   - Current chapter outline
   - Character profiles (in scene)
   - Active foreshadowing
3. **Medium priority** (trimmed if over budget):
   - Recent chapters summary
   - Location details
4. **Token Budget**: User configurable, default 8K tokens

---

## 7.7 Data Privacy & Security

- **All data stays local**: Nothing uploaded except AI API calls
- **API key stored locally**: `~/.inxtone/config.toml` (chmod 600)
- **Git-friendly**: Easy to backup, version control

---

## See Also

- [../../Architecture/Meta.md](../../Architecture/Meta.md) - Detailed architecture docs
- [MVP.md](MVP.md) - MVP scope and priorities
