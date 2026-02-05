# Technical

> Technical architecture overview - pointer document

**Parent**: [Core/Meta.md](Meta.md)
**Lines**: ~30 | **Updated**: 2026-02-05

---

## Overview

Inxtone uses a TypeScript monorepo architecture with pnpm workspaces.

For detailed technical documentation, see:

| Topic | Location |
|-------|----------|
| System Architecture | [Architecture/Overview.md](../Architecture/Overview.md) |
| Module Design | [Architecture/ModuleDesign/](../Architecture/ModuleDesign/Meta.md) |
| Data Layer | [Architecture/DataLayer/](../Architecture/DataLayer/Meta.md) |
| Service Modules | [Modules/](../Modules/Meta.md) |

## Tech Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Monorepo | pnpm workspaces |
| TUI | Ink (React for CLI) |
| Web | React 18 + Vite |
| Server | Fastify |
| Database | SQLite (better-sqlite3) |
| Testing | Vitest |

---

## See Also

- [Architecture/](../Architecture/Meta.md) - Full architecture docs
- [Modules/](../Modules/Meta.md) - Service module designs
