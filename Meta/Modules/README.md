# 模块详细设计

> 每个文件描述一个核心模块的内部工作流

---

## 文件索引

| 文件 | 模块 | 职责 |
|------|------|------|
| [01_story_bible_service.md](./01_story_bible_service.md) | StoryBibleService | 角色/世界/剧情的CRUD与关系管理 |
| [02_writing_service.md](./02_writing_service.md) | WritingService | 章节编辑、版本控制、写作目标 |
| [03_ai_service.md](./03_ai_service.md) | AIService | AI调用、Context构建、流式输出 |
| [04_quality_service.md](./04_quality_service.md) | QualityService | 一致性检查、Wayne原则、节奏分析 |
| [05_search_service.md](./05_search_service.md) | SearchService | 全文搜索、语义搜索、向量索引 |
| [06_rule_engine.md](./06_rule_engine.md) | RuleEngine | Data Driven 规则执行引擎 |
| [07_file_watcher.md](./07_file_watcher.md) | FileWatcher | 文件监听、外部编辑同步 |
| [08_event_bus.md](./08_event_bus.md) | EventBus | 事件发布订阅、跨模块通信 |
| [09_export_service.md](./09_export_service.md) | ExportService | 多格式导出、模板渲染 |
| [10_database.md](./10_database.md) | Database | SQLite访问、迁移、事务 |

---

## 阅读顺序建议

1. **先看核心流程**：03_ai_service → 02_writing_service → 01_story_bible
2. **再看支撑系统**：06_rule_engine → 04_quality_service
3. **最后看基础设施**：08_event_bus → 07_file_watcher → 10_database

---

*最后更新：2026-02-05*
