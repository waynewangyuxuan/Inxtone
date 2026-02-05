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
│   │ $ inxtone init │            │  ┌─────────┐ ┌─────────┐ ┌───────┐ │   │
│   │ $ inxtone serve│───────────→│  │Dashboard│ │  Story  │ │Writing│ │   │
│   │                 │            │  │         │ │  Bible  │ │  ...  │ │   │
│   │ $ inxtone      │            │  └─────────┘ └─────────┘ └───────┘ │   │
│   │   export --txt  │            │         React + Vite Frontend       │   │
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
│   │  │         SQLite + FTS5 Index          │  │                          │
│   │  └──────────────────────────────────────┘  │                          │
│   └─────────────────────────────────────────────┘                          │
│          │                                                                  │
│          ▼                                                                  │
│   ┌─────────────────┐                                                      │
│   │  Project Folder │   my-novel/                                          │
│   │  (Markdown)     │   ├── .inxtone/db.sqlite                             │
│   │                 │   ├── chapters/                                       │
│   │                 │   ├── bible/                                          │
│   │                 │   └── inxtone.toml                                    │
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

```
my-novel/
├── inxtone.toml           # Project config (title, author, settings)
├── .inxtone/
│   ├── db.sqlite           # Index, relationships, search
│   └── cache/              # AI response cache
├── chapters/
│   ├── arc-1/
│   │   ├── 001-awakening.md
│   │   └── _arc.toml       # Arc metadata
│   └── arc-2/
├── bible/
│   ├── characters/
│   │   ├── lin-yi.md       # Character profile in markdown
│   │   └── chen-hao.md
│   ├── world/
│   │   └── magic-system.md
│   └── plot/
│       └── outline.md
├── exports/                # Generated TXT/DOCX files
└── .git/                   # Optional: version control
```

---

## 7.3 CLI Commands

```bash
# Installation
brew install inxtone          # macOS
cargo install inxtone         # From source

# Project Management
inxtone init [name]           # Create new project
inxtone serve                 # Start local server at localhost:3456

# Quick Commands (headless)
inxtone add character "林逸"  # Add character from CLI
inxtone add chapter "觉醒"    # Create new chapter
inxtone status                # Show project stats, warnings

# AI Commands
inxtone ask "林逸的性格是什么？"  # Query story bible
inxtone continue ch:127       # Generate continuation for chapter
inxtone check ch:127          # Run consistency check

# Export
inxtone export --txt          # Export all chapters to TXT
inxtone export --docx         # Export to Word

# Config
inxtone config set api-key    # Set Gemini API key
```

---

## 7.4 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Core Runtime | **TypeScript** | Fast dev, single language across stack |
| HTTP Server | Fastify | Fast, lightweight |
| Frontend | **React + Vite** | Familiar stack, fast HMR |
| Editor | TipTap / CodeMirror 6 | Markdown-native, extensible |
| Storage | **Markdown files** | Human-readable, git-friendly |
| Index/Search | **SQLite + FTS5** | Zero-config, fast full-text search |
| AI | **Gemini API (BYOK)** | User provides key, no server costs |

---

## 7.5 AI Context Strategy

For million-word novels, context management is critical:

1. **Story Bible as Structured Markdown**: Frontmatter YAML + body content
2. **Chapter Summaries**: Auto-generated and cached
3. **Full-Text Search**: SQLite FTS5 for instant search
4. **Smart Context Assembly**:
   - Current chapter + recent 2 chapters
   - Relevant characters (mentioned in scene)
   - Active foreshadowing threads
   - World rules (always included, compressed)
5. **Token Budget Management**: User can set max context size

---

## 7.6 Data Privacy & Security

- **All data stays local**: Nothing uploaded except Gemini API calls
- **API key stored locally**: `~/.inxtone/config.toml` (chmod 600)
- **Git-friendly**: Easy to backup, version control

---

## See Also

- [../../Architecture/Meta.md](../../Architecture/Meta.md) - Detailed architecture docs
- [MVP.md](MVP.md) - MVP scope and priorities
