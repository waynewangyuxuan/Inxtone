# Module Design

> 模块划分与职责

## Presentation Layer（表现层）

| 模块 | 职责 | 技术 |
|------|------|------|
| **TUI App** | 终端交互界面 | Ink (React for CLI) |
| **Web App** | 浏览器交互界面 | React + Vite |
| **Shared Components** | 共享 UI 组件（逻辑复用） | React Components |

## Service Layer（服务层）

| 模块 | 职责 | 主要功能 |
|------|------|----------|
| **StoryBibleService** | 管理故事圣经 | CRUD 角色、世界观、剧情 |
| **WritingService** | 写作相关 | 章节编辑、AI 续写、版本管理 |
| **QualityService** | 质量检查 | 一致性检查、Wayne 原则检查 |
| **AIService** | AI 交互 | 调用 LLM、Context 注入 |
| **SearchService** | 搜索 | 全文搜索、语义搜索 |
| **ConfigService** | 配置管理 | 规则配置、预设管理 |
| **ExportService** | 导出 | Markdown/TXT/Word 导出 |
| **ProjectService** | 项目管理 | 创建、模板、导入 |

## Data Layer（数据层）

| 模块 | 职责 | 技术 |
|------|------|------|
| **SQLite DB** | 持久化存储 | better-sqlite3 |
| **Vector Store** | 向量存储 | sqlite-vss |
| **Repository** | 数据访问抽象 | TypeScript Classes |
