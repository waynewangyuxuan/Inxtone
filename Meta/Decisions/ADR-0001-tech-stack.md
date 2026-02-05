# ADR-0001: TypeScript Tech Stack

- **Status**: Accepted
- **Date**: 2026-02-05
- **Deciders**: Wayne

## Context

Inxtone needs a technology stack that supports:
- CLI tool development (TUI)
- Web UI (React-based)
- Local SQLite database access
- Cross-platform compatibility
- Active open-source community

The Product.md mentioned Rust or Python as options for the CLI, but a decision was needed on the final stack.

## Decision

Use **TypeScript** for the entire stack with **pnpm workspaces** for monorepo management:

| Component | Technology |
|-----------|------------|
| TUI | Ink (React for CLI) |
| Web | React 18 + Vite |
| Server | Fastify |
| Database | better-sqlite3 + sqlite-vss |
| Testing | Vitest |

## Alternatives Considered

### Alternative 1: Rust CLI + TypeScript Web
- **Pros**: Fast CLI, small binary, memory safe
- **Cons**: Two languages, harder contributor onboarding, can't share code
- **Why not**: Development velocity more important than raw performance

### Alternative 2: Python CLI + TypeScript Web
- **Pros**: Easy to write, rich ecosystem, AI/ML libraries
- **Cons**: Two languages, slower startup, packaging complexity
- **Why not**: Startup time matters for CLI tools

### Alternative 3: Full Rust (Tauri)
- **Pros**: Single language, fast, small bundle
- **Cons**: Smaller web UI ecosystem, steeper learning curve
- **Why not**: Team expertise in TypeScript, React ecosystem preferred

## Consequences

### Positive
- Single language across entire stack
- Shared types and utilities between CLI and web
- Large talent pool for contributors
- Mature testing and tooling ecosystem
- React components can be shared between TUI (Ink) and Web

### Negative
- Larger CLI binary than native Rust
- Slower startup than native code
- Node.js dependency required

### Risks
- **Performance**: SQLite operations may need optimization
  - Mitigation: Use better-sqlite3 (synchronous, fast)
- **Bundle size**: Web app may grow large
  - Mitigation: Code splitting, tree shaking with Vite

## Related

- [Product.md](../Core/Product/Meta.md) - Product requirements
- [Architecture/ModuleDesign/](../Architecture/ModuleDesign/Meta.md) - Module architecture
