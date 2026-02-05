# 🪨 Inkstone 砚台

> AI-native web novel creation playbook

一个为网文创作设计的完整工作流模板，整合研究成果、创作原则、AI协作提示词。

**复制 → 填写 → 创作**

---

## ✨ 特性

- **六阶段工作流** — 从构思到写作的完整pipeline
- **Wayne原则嵌入** — 创作红线贯穿每个阶段
- **B20文学技巧整合** — 人物塑造、死亡美学、关系设计
- **AI-Native设计** — 重索引模式，AI可高效维护和读取
- **40+即用提示词** — 开箱即用的AI协作模板

---

## 🚀 快速开始

### 1. 使用模板创建新项目

点击右上角 **"Use this template"** → **"Create a new repository"**

### 2. Clone到本地

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_NOVEL_NAME.git
cd YOUR_NOVEL_NAME
```

### 3. 开始创作

打开 `PLAYBOOK_INDEX.md`，按照指引开始第一阶段。

详细设置说明见 [SETUP.md](./SETUP.md)

---

## 📁 项目结构

```
inkstone/
├── PLAYBOOK_INDEX.md      # 📖 总入口（从这里开始）
├── _STATUS.md             # 📊 项目状态追踪
├── _INDEX.md              # 🔍 主索引（重索引模式）
│
├── _guides/               # 📚 治理文档（只读参考）
│   ├── 00_meta_guide.md       # Phase 1: 构思
│   ├── 01_world_guide.md      # Phase 2: 世界观
│   ├── 02_characters_guide.md # Phase 3: 人物
│   ├── 03_plot_guide.md       # Phase 4: 剧情
│   ├── 04_outline_guide.md    # Phase 5: 大纲
│   ├── 05_draft_guide.md      # Phase 6: 写作
│   └── AI_PROMPTS.md          # 🤖 AI协作提示词库
│
├── 00_meta/               # 项目元信息
├── 01_world/              # 世界观设定
├── 02_characters/         # 人物档案
├── 03_plot/               # 剧情规划
├── 04_outline/            # 大纲
├── 05_draft/              # 草稿
└── _archive/              # 废弃/历史版本
```

---

## 📅 六阶段工作流

| 阶段 | 名称 | 核心产出 | 预估时间 |
|:----:|------|----------|:--------:|
| P1 | 构思 | concept.md, guardrails.md | 1-2天 |
| P2 | 世界观 | 力量体系、势力、地点 | 3-5天 |
| P3 | 人物 | 主角 + 5-8核心配角 | 3-5天 |
| P4 | 剧情 | 主线、支线、伏笔 | 2-3天 |
| P5 | 大纲 | 分章大纲 | 3-5天 |
| P6 | 写作 | 章节草稿 | 持续 |

---

## 🚫 Wayne原则速查

### 绝对红线

| 代号 | 禁止事项 |
|:----:|----------|
| R1 | "养狗式"人物关系 — 配角无条件崇拜主角 |
| R2 | 角色工具化 — 角色只是功能载体 |
| R3 | 草菅人命 — 死亡无重量无余波 |
| R4 | 神话模型 — 强者不受社会规则约束 |

### 核心原则

| 代号 | 原则 |
|:----:|------|
| P1 | 尊重每一个角色 |
| P2 | 每个人都有自己的想法 |
| P3 | 力量差距 ≠ 人格不平等 |
| P4 | 使用社会关系模型 |

---

## 🤖 AI协作

本模板设计为AI-native，推荐与Claude/GPT等LLM配合使用。

`_guides/AI_PROMPTS.md` 包含40+个即用提示词，覆盖：
- 创意讨论、红线检查
- 人物设计、关系网络
- 剧情规划、伏笔管理
- 章节写作、一致性检查

**示例**：
```
请阅读以下文件，准备写第 15 章：
1. _STATUS.md
2. _INDEX.md
3. _chapter_log.md（最近10章）
4. 04_outline/vol_01/chapters.md

确认你理解了当前剧情进展和本章目标。
```

---

## 📖 整合资产

本Playbook整合了以下研究成果：

| 资产 | 内容 | 用途 |
|------|------|------|
| **FRAMEWORK_V3.0** | 15维度评估框架 | 大纲/写作检查点 |
| **B20文学技巧手册** | 人物塑造、死亡美学、关系设计 | 人物阶段核心参考 |
| **Wayne原则** | 创作红线与价值观 | 全程约束 |

---

## 📝 License

MIT

---

## 🔗 相关链接

- [PLAYBOOK_INDEX.md](./PLAYBOOK_INDEX.md) — 从这里开始
- [SETUP.md](./SETUP.md) — 详细设置说明
- [AI_PROMPTS.md](./_guides/AI_PROMPTS.md) — AI协作提示词库

---

*Made with 🪨 Inkstone*
