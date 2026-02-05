# Inxtone 设计文档索引

> 本目录记录 Inxtone 的设计讨论和决策

---

## 文档结构

| 文档 | 内容 | 状态 |
|------|------|------|
| [01_INTERACTION.md](./01_INTERACTION.md) | 交互层设计：TUI + Web GUI | ✅ 已确认 |
| [02_BUSINESS_LOGIC.md](./02_BUSINESS_LOGIC.md) | 业务逻辑层：Schemas, Rules, Templates, Workflows | ✅ 已确认 |
| [03_COMPUTER_LOGIC.md](./03_COMPUTER_LOGIC.md) | 计算逻辑层：AI抽象、搜索、并发 | ✅ 已确认 |
| [04_DATA_LAYER.md](./04_DATA_LAYER.md) | 数据层：SQLite Schema + 版本 + 模板 | ✅ 已确认 |
| [05_ARCHITECTURE.md](./05_ARCHITECTURE.md) | 架构对齐：模块划分 + 通信契约 + 组件清单 | 🚧 进行中 |
| [component-preview.html](./component-preview.html) | GUI 组件可视化预览 | 🚧 进行中 |
| 06_IMPLEMENTATION.md | 实现计划：里程碑 + 任务分解 | ⏳ 待开始 |

---

## 设计原则

1. **开源友好** — 清晰、简单、易贡献
2. **本地优先** — 数据属于用户，SQLite 是 source of truth，Markdown 是导出格式
3. **TUI First** — 终端界面优先，Web UI 是增强
4. **框架思维** — Inxtone 是框架 + 默认配置，用户可自定义一切
5. **渐进增强** — 核心功能先行，高级功能后加

---

## MVP 范围确认

**包含**：
- 4.1 Story Bible (P0 + P1)
- 4.2 Writing Workspace (P0 + P1 + Consistency Check)
- 4.3 Quality Control (P0 + P1)
- 4.5 Export (P0 + P1)

**不包含**：
- 4.4 Commercial Tools

**总计**：27 个功能点

---

*最后更新：2026-02-04*
