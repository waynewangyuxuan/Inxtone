# Service Modules

> Detailed design for each backend service module

**Documents**: 11 | **Total Lines**: ~3600

## Context Injection Guide

| Task Scenario | Read These Files | Lines |
|---------------|------------------|-------|
| Story Bible features | 01_story_bible_service.md | ~256 |
| Writing/Editor | 02_writing_service.md | ~275 |
| AI integration | 03_ai_service.md | ~363 |
| Quality checking | 04_quality_service.md | ~357 |
| Search features | 05_search_service.md | ~349 |
| Rule engine | 06_rule_engine.md | ~435 |
| File watching | 07_file_watcher.md | ~437 |
| Event system | 08_event_bus.md | ~394 |
| Export features | 09_export_service.md | ~405 |
| Database layer | 10_database.md | ~520 |

## Documents

| File | Lines | Summary | When to Read |
|------|-------|---------|--------------|
| [01_story_bible_service.md](01_story_bible_service.md) | ~256 | Characters, world, plot CRUD | Story Bible features |
| [02_writing_service.md](02_writing_service.md) | ~275 | Chapter editing, version control | Editor development |
| [03_ai_service.md](03_ai_service.md) | ~363 | AI calls, context, streaming | AI integration |
| [04_quality_service.md](04_quality_service.md) | ~357 | Consistency, Wayne principles | Quality features |
| [05_search_service.md](05_search_service.md) | ~349 | Full-text, semantic search | Search implementation |
| [06_rule_engine.md](06_rule_engine.md) | ~435 | Data-driven rule execution | Rules/validation |
| [07_file_watcher.md](07_file_watcher.md) | ~437 | File monitoring, external sync | File system |
| [08_event_bus.md](08_event_bus.md) | ~394 | Pub/sub, cross-module comm | Event handling |
| [09_export_service.md](09_export_service.md) | ~405 | Multi-format export, templates | Export features |
| [10_database.md](10_database.md) | ~520 | SQLite access, migrations | Database layer |

## Reading Order

Based on [README.md](README.md) recommendations:

1. **Core Flow First:**
   - 03_ai_service → 02_writing_service → 01_story_bible

2. **Supporting Systems:**
   - 06_rule_engine → 04_quality_service

3. **Infrastructure:**
   - 08_event_bus → 07_file_watcher → 10_database

## Module Dependencies

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ StoryBible  │────→│   Writing   │────→│     AI      │
│   Service   │     │   Service   │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Quality   │←────│ RuleEngine  │────→│   Search    │
│   Service   │     │             │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
       ┌─────────────┬─────────────┬─────────────┐
       │  EventBus   │ FileWatcher │  Database   │
       └─────────────┴─────────────┴─────────────┘
```

## Document Notes

All modules exceed 150-line limit and are flagged for further splitting.
Priority for splitting:
1. 10_database.md (520 lines) - Core infrastructure
2. 03_ai_service.md (363 lines) - High-impact feature

---

## See Also

- [../Architecture/05_ARCHITECTURE.md](../Architecture/05_ARCHITECTURE.md) - System overview
- [../Architecture/06_ARCHITECTURE_DEEP_DIVE.md](../Architecture/06_ARCHITECTURE_DEEP_DIVE.md) - Deep dive
