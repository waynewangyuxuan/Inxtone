# Inxtone 设计文档索引

> 本目录记录 Inxtone 的设计讨论和决策

---

## 文档结构

| 文档 | 内容 | 状态 |
|------|------|------|
| [01_INTERACTION.md](./01_INTERACTION.md) | 交互层设计：TUI + Web GUI | ✅ 已确认 |
| [02_BUSINESS_LOGIC.md](./02_BUSINESS_LOGIC.md) | 业务逻辑层：AI 集成 + 核心逻辑 | ⏳ 待开始 |
| [03_DATA_LAYER.md](./03_DATA_LAYER.md) | 数据层：文件结构 + 索引设计 | ⏳ 待开始 |
| [04_IMPLEMENTATION.md](./04_IMPLEMENTATION.md) | 具体实现：技术栈 + 架构 | ⏳ 待开始 |

---

## 设计原则

1. **开源友好** — 清晰、简单、易贡献
2. **本地优先** — 数据属于用户，Markdown 是 source of truth
3. **CLI First** — 命令行优先，Web UI 是增强
4. **渐进增强** — 核心功能先行，高级功能后加

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
