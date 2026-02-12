# Milestones

> Project milestones - time-boxed development phases with clear deliverables

**Documents**: 1 template + milestones

## Milestone Lifecycle

```
Draft → Active → Complete → Archived
```

- **Draft**: Planning phase, scope not finalized
- **Active**: Currently being worked on
- **Complete**: All deliverables verified
- **Archived**: Historical record

## Conventions

### Task Status
- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Complete

### Duration Guidelines
- Each milestone should be 1-4 weeks
- Longer efforts should be split into multiple milestones

## Index

| Milestone | Title | Status | Target | Duration |
|-----------|-------|--------|--------|----------|
| [M1](M1.md) | Foundation + Interface Contract | Complete | 2026-02-05 | 1 day |
| [M2](M2.md) | Story Bible Core | Complete | 2026-02-07 | 2 days |
| [M3](M3.md) | Writing Workspace + AI | Complete | 2026-02-08 | 1 day |
| [M3.5](M3.5.md) | Hackathon Submission | Complete | 2026-02-09 | 1 day |
| [M4](M4.md) | Writing UX Polish | Active | 2026-02-20 | 10 days |
| [M5](M5.md) | Export | Draft | TBD | 1.5 weeks |
| [M6](M6.md) | Smart Intake | Draft | TBD | 3 weeks |
| [M7](M7.md) | Search, Quality & v0.1.0 Release | Draft | TBD | 3 weeks |

### Post-MVP Roadmap

| Milestone | Title | Status |
|-----------|-------|--------|
| M8 | Multi-Model AI + Relationship Graph + Ambient Detection | Draft |
| M9 | EPUB/PDF Export + Plugin System | Draft |
| M10 | Cloud Sync + Community Features | Draft |

See [ADR-0003](../Decisions/ADR-0003-milestone-reorder-smart-intake.md) for rationale behind M5→M6→M7 ordering.

## Creating a New Milestone

1. Copy `_TEMPLATE.md` to `M{N}.md`
2. Fill in Goal and Scope first
3. Break down into specific Tasks
4. Define acceptance criteria in Test Plan
5. Update this index

---

## See Also

- [Progress.md](../Progress.md) - Daily development log
- [Todo.md](../Todo.md) - Task backlog
