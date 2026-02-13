# Architecture Decision Records

> Significant technical decisions documented for future reference

**Documents**: 2 templates + ADRs

## What is an ADR?

An ADR captures a single architectural decision, including:
- The context and problem we faced
- The decision we made
- Alternatives we considered
- Consequences (both positive and negative)

## How to Write an ADR

1. Copy `_TEMPLATE.md` to `ADR-{NEXT_NUMBER}-{kebab-case-title}.md`
2. Fill in all sections
3. Set status to "Proposed"
4. Get review from relevant stakeholders
5. Update status to "Accepted" once approved

## ADR Lifecycle

```
Proposed → Accepted → [Deprecated | Superseded]
```

## Index

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [ADR-0001](ADR-0001-tech-stack.md) | TypeScript Tech Stack | Accepted | 2026-02-05 |
| [ADR-0002](ADR-0002-ai-context-injection-strategy.md) | AI Context Injection Strategy | Accepted | 2026-02-08 |
| [ADR-0003](ADR-0003-milestone-reorder-smart-intake.md) | Milestone Reorder — Smart Intake | Accepted | 2026-02-11 |
| [ADR-0004](ADR-0004-write-bible-entity-management.md) | Write Bible Entity Management | Accepted | 2026-02-12 |
| [ADR-0005](ADR-0005-export-interface-simplification.md) | Export Interface Simplification | Accepted | 2026-02-13 |

---

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Project overview
- [Technical.md](../Core/Technical.md) - Tech stack reference
