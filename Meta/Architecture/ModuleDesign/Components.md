# GUI Components

> 组件清单

## Layout Components（布局组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `AppShell` | 应用外壳 | `sidebar`, `children` |
| `Sidebar` | 侧边导航栏 | `items`, `activeItem`, `onSelect` |
| `Header` | 顶部导航/标题栏 | `title`, `actions`, `breadcrumbs` |
| `Panel` | 可折叠面板 | `title`, `collapsed`, `children` |
| `SplitView` | 分栏布局 | `left`, `right`, `ratio` |
| `Tabs` | 标签页 | `tabs`, `activeTab`, `onTabChange` |
| `Modal` | 模态框 | `open`, `onClose`, `title`, `children` |
| `Drawer` | 抽屉面板 | `open`, `onClose`, `position`, `children` |

## Story Bible Components（故事圣经组件）

| 组件 | 用途 |
|------|------|
| `CharacterCard` | 角色卡片展示 |
| `CharacterEditor` | 角色编辑表单 |
| `CharacterList` | 角色列表 |
| `RelationshipGraph` | 关系图谱（可视化） |
| `RelationshipEditor` | 关系编辑 |
| `WorldRuleCard` | 世界规则卡片 |
| `PowerSystemView` | 力量体系展示 |
| `LocationCard` | 地点卡片 |
| `FactionCard` | 势力卡片 |
| `TimelineView` | 时间线展示 |
| `ArcOutliner` | 剧情弧大纲 |
| `ForeshadowingList` | 伏笔列表 |
| `ForeshadowingCard` | 伏笔卡片 |
| `HookTracker` | 钩子追踪 |

## Writing Components（写作组件）

| 组件 | 用途 |
|------|------|
| `ChapterEditor` | 章节编辑器（核心） |
| `ChapterOutline` | 章节大纲面板 |
| `ChapterList` | 章节列表 |
| `VolumeAccordion` | 卷折叠列表 |
| `WordCounter` | 字数统计 |
| `WritingGoalCard` | 写作目标卡片 |
| `VersionHistory` | 版本历史 |
| `DiffViewer` | 版本对比 |

## AI Components（AI 组件）

| 组件 | 用途 |
|------|------|
| `AISidebar` | AI 助手侧边栏 |
| `AIPromptSelector` | 提示词选择器 |
| `AIGenerationPanel` | 生成结果面板 |
| `AIStreamingOutput` | 流式输出显示 |
| `ContextPreview` | Context 预览 |
| `StoryBibleQuery` | 故事圣经问答 |

## Quality Components（质量组件）

| 组件 | 用途 |
|------|------|
| `CheckResultCard` | 检查结果卡片 |
| `IssueList` | 问题列表 |
| `IssueDetail` | 问题详情 |
| `ConsistencyBadge` | 一致性徽章 |
| `WaynePrincipleCheck` | Wayne 原则检查卡 |
| `PacingVisualizer` | 节奏可视化 |

## Config Components（配置组件）

| 组件 | 用途 |
|------|------|
| `RuleToggle` | 规则开关 |
| `RuleEditor` | 规则编辑 |
| `PresetSelector` | 预设选择器 |
| `AIProviderConfig` | AI 提供商配置 |
| `CustomRuleBuilder` | 自定义规则构建器 |

## 组件统计

| 类别 | 数量 |
|------|------|
| Layout | 8 |
| Story Bible | 14 |
| Writing | 8 |
| AI | 6 |
| Quality | 6 |
| Config | 5 |
| Common | 17 |
| **总计** | **64** |
