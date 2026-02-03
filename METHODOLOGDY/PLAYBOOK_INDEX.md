# 网文创作Playbook v1.0

> **使用说明**: 这是网文创作的完整工具包。复制整个 TEMPLATE_v1 文件夹到新项目目录即可开始使用。

---

## 快速启动

1. 复制本文件夹到新项目
2. 阅读 `_guides/00_meta_guide.md`，完成 `00_meta/` 下的文件
3. 按阶段顺序推进，每个阶段参考对应的 `_guides/` 文档
4. 使用 `_STATUS.md` 追踪进度

---

## 文件夹结构

```
TEMPLATE_v1/
├── PLAYBOOK_INDEX.md      # 你在这里 - 总入口
├── _STATUS.md             # 项目状态看板
├── _INDEX.md              # 主索引（重索引模式）
│
├── _guides/               # 治理文档（只读参考）
│   ├── 00_meta_guide.md       # 阶段1指南：构思
│   ├── 01_world_guide.md      # 阶段2指南：世界观
│   ├── 02_characters_guide.md # 阶段3指南：人物
│   ├── 03_plot_guide.md       # 阶段4指南：剧情与大纲
│   ├── 04_outline_guide.md    # 阶段5指南：分章大纲
│   └── 05_draft_guide.md      # 阶段6指南：写作
│
├── 00_meta/               # 项目元信息（填写区）
│   ├── concept.md             # 核心创意
│   ├── guardrails.md          # Wayne原则红线
│   └── references.md          # 参考作品
│
├── 01_world/              # 世界观设定
│   ├── power_system.md        # 力量体系
│   ├── rules.md               # 世界规则
│   ├── factions.md            # 势力设定
│   ├── locations.md           # 地点设定
│   └── items.md               # 重要物品
│
├── 02_characters/         # 人物档案
│   └── [人物卡文件]
│
├── 03_plot/               # 剧情规划
│   ├── main_arc.md            # 主线弧光
│   ├── subplots.md            # 支线规划
│   └── foreshadowing.md       # 伏笔登记簿
│
├── 04_outline/            # 大纲
│   ├── structure.md           # 整体结构
│   └── vol_xx/                # 分卷大纲
│
├── 05_draft/              # 草稿
│   ├── _chapter_log.md        # 章节摘要日志
│   └── vol_xx/                # 分卷草稿
│
└── _archive/              # 废弃/历史版本
```

---

## 六阶段工作流

| 阶段 | 名称 | 核心产出 | 治理文档 | 预估时间 |
|------|------|----------|----------|----------|
| P1 | 构思 | concept.md, guardrails.md | 00_meta_guide.md | 1-2天 |
| P2 | 世界观 | 01_world/*.md | 01_world_guide.md | 3-5天 |
| P3 | 人物 | 02_characters/*.md | 02_characters_guide.md | 3-5天 |
| P4 | 剧情 | 03_plot/*.md | 03_plot_guide.md | 2-3天 |
| P5 | 大纲 | 04_outline/*.md | 04_outline_guide.md | 3-5天 |
| P6 | 写作 | 05_draft/*.md | 05_draft_guide.md | 持续 |

---

## 研究资产索引

本Playbook整合了以下研究成果：

| 资产 | 用途 | 对应阶段 |
|------|------|----------|
| **FRAMEWORK_V3.0** | 15维度评估框架 | P4/P5检查点 |
| **B20文学技巧手册** | 人物塑造、死亡美学、关系设计 | P3核心参考 |
| **Wayne原则** | 创作红线与价值观 | 全程约束 |

---

## Wayne原则速查

### 绝对红线 🚫

| 代号 | 禁止事项 |
|------|----------|
| R1 | "养狗式"人物关系 |
| R2 | 角色工具化/符号化 |
| R3 | 草菅人命 |
| R4 | 神话模型代替社会模型 |

### 核心原则 ✅

| 代号 | 原则 |
|------|------|
| P1 | 尊重每一个角色 |
| P2 | 每个人都有自己的想法 |
| P3 | 力量差距 ≠ 人格不平等 |
| P4 | 使用社会关系模型 |

---

## AI协作提示词

### 启动新项目
```
我正在使用网文创作Playbook开始一个新项目。请阅读以下文件了解框架：
- PLAYBOOK_INDEX.md（总览）
- _guides/00_meta_guide.md（第一阶段指南）
现在请帮我完成 00_meta/concept.md 的填写。
我的初步想法是：[描述你的创意]
```

### 阶段推进
```
当前项目状态见 _STATUS.md。
我已完成 Phase [X]，准备进入 Phase [X+1]。
请阅读 _guides/[对应guide].md 并帮我开始这个阶段的工作。
```

### 人物设计
```
请阅读以下文件：
- _guides/02_characters_guide.md（人物设计指南）
- 00_meta/guardrails.md（创作红线）
- _INDEX.md（现有人物索引）
现在帮我设计一个新角色：[角色定位/功能]
```

### 章节写作
```
请阅读以下文件：
- 05_draft/_chapter_log.md（最近10章摘要）
- _INDEX.md（人物/伏笔索引）
- 04_outline/vol_xx/chapters.md（本章大纲）
现在帮我写第 [X] 章。
```

---

## 阶段检查点

每个阶段完成前，使用对应的检查清单验证：

### P1 构思检查点
- [ ] concept.md 完成
- [ ] guardrails.md 确认
- [ ] 一句话能否吸引读者？
- [ ] Wayne红线检查通过？

### P2 世界观检查点
- [ ] 力量体系自洽
- [ ] 势力有张力
- [ ] 支持社会关系模型(W1)
- [ ] 有制衡机制(W2)

### P3 人物检查点
- [ ] 主角三层动机完整
- [ ] 核心人物各有特色
- [ ] 关系非依附(R1检查)
- [ ] B20检查清单 ≥ 90分

### P4 剧情检查点
- [ ] 主线弧光清晰
- [ ] 支线有规划
- [ ] 伏笔有回收计划

### P5 大纲检查点
- [ ] 前三章有钩子
- [ ] 节奏符合FRAMEWORK_V3.0
- [ ] 第一卷有闭环

### P6 写作检查点（每10章）
- [ ] 章节日志更新
- [ ] 索引更新
- [ ] 角色一致性
- [ ] 伏笔状态追踪

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-01-28 | 初始版本 |

---

*Playbook设计原则：AI-Native、轻量、重索引、关键节点*
