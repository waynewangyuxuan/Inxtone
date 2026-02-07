# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/waynewang/inxtone/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/waynewang/inxtone/releases/tag/v0.1.0
