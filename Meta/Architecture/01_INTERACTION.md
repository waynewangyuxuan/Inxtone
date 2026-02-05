# 01 交互层设计

> TUI + Web GUI，同一套功能，两种呈现

**Status**: ✅ Confirmed

---

## 核心理念

| 模式 | 启动 | 定位 |
|------|------|------|
| **TUI** | `inxtone` | 开发者、终端用户、快速操作 |
| **Web GUI** | `inxtone serve` | 完整体验、可视化、写作环境 |

两者功能完全相同，只是交互方式不同。

---

## 一、TUI 设计

### 1.1 设计原则

- **美观** — 应用 Design.md 的美学：深色背景、金色点缀
- **简洁** — 信息层级清晰，不堆砌
- **高效** — 键盘导航，快捷操作

### 1.2 导航结构

```
inxtone (主界面)
├── Story Bible
│   ├── Characters
│   │   ├── [list] — 分类列表 (Main/Supporting/Antagonist/Mentioned)
│   │   ├── [detail] — 完整人物卡 (Appearance/Motivation/Voice)
│   │   ├── [relations] — 关系图 (简化版)
│   │   ├── [arc] — 角色弧光追踪
│   │   └── [add/edit]
│   ├── World
│   │   ├── Rules — 力量体系、社会规则、AI约束
│   │   ├── Locations — 地点列表与详情
│   │   ├── Factions — 势力列表与详情
│   │   └── Timeline — 时间线
│   └── Plot
│       ├── Outline — 树状大纲 (Arc → Section → Chapter)
│       ├── Foreshadowing — 伏笔登记簿 (Active/Resolved)
│       ├── Hooks — 钩子追踪 (Opening/Arc/Chapter)
│       └── Pacing — 节奏分析
├── Writing
│   ├── [chapter list] — 章节列表
│   ├── [editor] — 写作编辑器
│   │   ├── ctrl+a → AI assist panel
│   │   ├── ctrl+b → Bible panel
│   │   └── ctrl+h → History
│   └── [new chapter]
├── Export
│   ├── TXT
│   ├── DOCX
│   └── Markdown
└── Settings
    ├── API Key
    └── Preferences
```

### 1.3 界面清单

| # | 界面 | 主要功能 |
|---|------|----------|
| 1 | Home | 项目概览、健康状态、导航入口 |
| 2 | Story Bible 选择 | Characters/World/Plot 入口 |
| 3 | Characters 列表 | 分类展示、搜索、添加 |
| 4 | Character 详情 | 完整人物卡、Voice Samples |
| 5 | Character Relations | 关系图（简化版） |
| 6 | Character Arc | 角色弧光追踪 |
| 7 | World 选择 | Rules/Locations/Factions/Timeline 入口 |
| 8 | World Rules | 力量体系、社会规则、AI约束 |
| 9 | Locations | 地点列表与详情 |
| 10 | Factions | 势力列表与详情 |
| 11 | Timeline | 时间线 |
| 12 | Plot 选择 | Outline/Foreshadowing/Hooks/Pacing 入口 |
| 13 | Outline | 树状大纲结构 |
| 14 | Foreshadowing | 伏笔登记簿 |
| 15 | Hooks | 钩子追踪 |
| 16 | Pacing | 节奏分析 |
| 17 | Writing 列表 | 章节列表 |
| 18 | Editor | 写作编辑器 |
| 19 | AI Panel | AI 助手面板 |
| 20 | AI Response | 多选项生成结果 |
| 21 | Bible Panel | Story Bible 快速访问 |
| 22 | Consistency Check | 一致性检查结果 |
| 23 | Version History | 版本历史 |
| 24 | Export | 导出配置 |
| 25 | Settings | 设置 |

### 1.4 快捷键

| 场景 | 按键 | 功能 |
|------|------|------|
| 全局 | ↑↓ | 导航 |
| 全局 | Enter | 选择/进入 |
| 全局 | q | 返回/退出 |
| 全局 | / | 搜索 |
| 全局 | + | 添加 |
| 全局 | e | 编辑 |
| 全局 | ? | 帮助 |
| 编辑器 | ctrl+s | 保存 |
| 编辑器 | ctrl+a | AI 面板 |
| 编辑器 | ctrl+b | Bible 面板 |
| 编辑器 | ctrl+h | 历史 |
| 编辑器 | esc | 退出编辑 |

---

## 二、Web GUI 设计

### 2.1 路由结构

```
/                           Dashboard
/bible/characters           人物列表
/bible/characters/:id       人物详情
/bible/characters/:id/arc   人物弧光
/bible/characters/map       关系图 ★
/bible/world/rules          世界规则
/bible/world/locations      地点
/bible/world/factions       势力
/bible/world/timeline       时间线 ★
/bible/plot/outline         大纲
/bible/plot/foreshadowing   伏笔
/bible/plot/hooks           钩子
/bible/plot/pacing          节奏 ★
/write                      章节列表
/write/:chapter             写作编辑器
/write/:chapter/history     版本历史
/export                     导出
/settings                   设置
```

★ = 可视化增强功能

### 2.2 布局模式

**Dashboard / 列表页**
```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo, Settings, Help)                              │
├────────┬────────────────────────────────────────────────────┤
│  Nav   │  Main Content                                      │
│        │                                                    │
└────────┴────────────────────────────────────────────────────┘
```

**Writing Editor (三栏)**
```
┌─────────────────────────────────────────────────────────────┐
│  Header (Chapter Title, Actions)                            │
├──────────┬─────────────────────────────┬────────────────────┤
│ Chapters │  Editor                     │  AI Assistant      │
│ + Bible  │                             │                    │
├──────────┴─────────────────────────────┴────────────────────┤
│  Status Bar (Word Count, Warnings, Save Status)             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 界面清单

| # | 路由 | 主要功能 |
|---|------|----------|
| 1 | / | Dashboard, 项目概览, Story Health |
| 2 | /bible/characters | 人物卡片列表 |
| 3 | /bible/characters/:id | 人物详情页 |
| 4 | /bible/characters/map | 关系图可视化 ★ |
| 5 | /bible/characters/:id/arc | 角色弧光 |
| 6 | /bible/world/rules | 世界规则 |
| 7 | /bible/world/locations | 地点列表 |
| 8 | /bible/world/factions | 势力列表 |
| 9 | /bible/world/timeline | 时间线可视化 ★ |
| 10 | /bible/plot/outline | 大纲树 |
| 11 | /bible/plot/foreshadowing | 伏笔登记簿 |
| 12 | /bible/plot/hooks | 钩子追踪 |
| 13 | /bible/plot/pacing | 节奏图表 ★ |
| 14 | /write | 章节列表 |
| 15 | /write/:chapter | 写作编辑器 |
| 16 | /write/:chapter (AI) | AI 侧边栏 |
| 17 | /write/:chapter (Check) | 一致性检查弹窗 |
| 18 | /write/:chapter/history | 版本历史 |
| 19 | /export | 导出页 |
| 20 | /settings | 设置页 |

---

## 三、功能映射表

| 功能 | TUI | Web GUI |
|------|-----|---------|
| **Story Bible (12)** |
| Character Cards | Characters → list/detail | `/bible/characters/:id` |
| Relationship Map | Characters → [r] | `/bible/characters/map` ★ |
| Arc Tracker | Character → [a] | `/bible/characters/:id/arc` |
| Voice Samples | Character detail | `/bible/characters/:id` |
| World Rules | World → Rules | `/bible/world/rules` |
| Locations | World → Locations | `/bible/world/locations` |
| Factions | World → Factions | `/bible/world/factions` |
| Timeline | World → Timeline | `/bible/world/timeline` ★ |
| Arc Outliner | Plot → Outline | `/bible/plot/outline` |
| Foreshadowing | Plot → Foreshadowing | `/bible/plot/foreshadowing` |
| Hook Tracker | Plot → Hooks | `/bible/plot/hooks` |
| Pacing Visualizer | Plot → Pacing | `/bible/plot/pacing` ★ |
| **Writing (12)** |
| Editor | Writing → chapter | `/write/:chapter` |
| AI Sidebar | ctrl+a | 右侧边栏 |
| Bible Panel | ctrl+b | 左侧边栏 |
| Word Count | 底部状态栏 | 底部状态栏 |
| Version History | chapter → history | `/write/:chapter/history` |
| Context Injection | (auto) | (auto) |
| Prompts | AI panel menu | AI sidebar buttons |
| Continuation | AI → Continue | AI → Continue |
| Dialogue | AI → Dialogue | AI → Dialogue |
| Description | AI → Describe | AI → Describe |
| Brainstorm | AI → Brainstorm | AI → Brainstorm |
| Consistency Check | AI → Check | AI → Check |
| **Quality (5)** |
| Char Consistency | 检查结果 | 检查弹窗 |
| World Violations | 检查结果 | 检查弹窗 |
| Repetition | 检查结果 | 检查弹窗 |
| Pre-Writing Review | Dashboard 警告 | Dashboard 警告 |
| Arc Completion | Dashboard 警告 | Dashboard 警告 |
| **Export (3)** |
| TXT/DOCX/MD | Export menu | `/export` |

**Total: 27/27 功能覆盖**

---

## 四、设计资产

详细的界面 ASCII 原型见项目讨论记录。

关键设计决策：
1. TUI 和 Web GUI 功能对等，界面风格一致
2. 编辑器采用三栏布局（Chapters+Bible / Editor / AI）
3. 可视化功能（关系图、时间线、节奏图）在 Web 中增强
4. 统一使用 Design.md 的美学语言

---

*最后更新：2026-02-04*
*Status: ✅ Confirmed*
