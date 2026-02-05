# Business Logic Overview

> 核心原则与设计哲学

**Parent**: [Meta.md](Meta.md)
**Lines**: ~80 | **Updated**: 2026-02-05

---

## 核心原则

```
┌─────────────────────────────────────────────────────────┐
│  Business Logic (What) — 用 Data 描述                   │
│  ─────────────────────────────────────────────────────  │
│  · Schemas — 数据结构定义                               │
│  · Rules — 检查规则、约束条件                           │
│  · Templates — AI Prompts、文档模板                     │
│  · Workflows — 状态机、流程定义                         │
├─────────────────────────────────────────────────────────┤
│  Computer Logic (How) — 代码实现                        │
│  ─────────────────────────────────────────────────────  │
│  · 存储、索引、查询                                     │
│  · API 调用、网络通信                                   │
│  · 文件读写、格式转换                                   │
│  · UI 渲染、用户交互                                    │
└─────────────────────────────────────────────────────────┘
```

**Data Driven 的好处**：
1. 修改业务逻辑只需改配置，不改代码
2. 社区可贡献新规则、新模板
3. 用户可自定义
4. 易于测试和理解

---

## Inxtone = 框架 + 默认配置

```
┌─────────────────────────────────────────────────────────────┐
│  Inxtone 提供的是【框架】，不是【固定方法论】                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  默认配置（我们提供）        用户配置（可自定义）            │
│  ────────────────────        ────────────────────           │
│  · Wayne 原则 R1-R4          · 启用/禁用任意规则            │
│  · B20 评分标准              · 修改阈值/参数                │
│  · 26 项一致性检查           · 添加自定义规则               │
│  · AI Prompt 模板            · 创建自定义模板               │
│  · Six-Phase 工作流          · 自定义工作流                 │
│                                                             │
│  ↓                           ↓                              │
│  开箱即用                    满足个性化需求                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Business Logic 来源

从 METHODOLOGY 提取：

| 来源 | 内容 | 转化为 |
|------|------|--------|
| `02_characters_guide.md` | 人物卡结构、B20检查清单、关系类型 | Character Schema, Rules |
| `01_world_guide.md` | 世界观结构、力量体系模板 | World Schema |
| `03_plot_guide.md` | 剧情结构、伏笔管理 | Plot Schema, State Machine |
| `04_outline_guide.md` | 大纲结构、节奏标准 | Outline Schema, Rules |
| `05_draft_guide.md` | 章节结构、写作检查点 | Chapter Schema, Rules |
| `00_meta_guide.md` | Wayne 原则、红线定义 | Consistency Rules |
| `AI_PROMPTS.md` | 40+ AI 提示词模板 | Prompt Templates |

---

## See Also

- [Schemas/Meta.md](Schemas/Meta.md) - 数据结构定义
- [Rules/Meta.md](Rules/Meta.md) - 检查规则
- [UserConfig.md](UserConfig.md) - 用户可配置层级
