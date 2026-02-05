# 05 架构对齐 - 模块划分与通信契约

> 从 GUI → Logic → Data 的完整架构梳理

**Status**: 🚧 进行中

---

## 一、整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │           TUI                │  │           Web GUI                │ │
│  │      (Ink/React CLI)         │  │        (React + Vite)            │ │
│  └──────────────────────────────┘  └──────────────────────────────────┘ │
│                                    │                                     │
│                              Shared Components                           │
│                         (React 组件，TUI/Web 复用)                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                              HTTP API / IPC
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                          Service Layer                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │ StoryBible  │ │  Writing    │ │  Quality    │ │      Export         ││
│  │  Service    │ │  Service    │ │  Service    │ │      Service        ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│
│                                    │                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │     AI      │ │   Config    │ │   Search    │ │      Project        ││
│  │   Service   │ │   Service   │ │   Service   │ │      Service        ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────┐
│                           Data Layer                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                         SQLite Database                              ││
│  │  characters | relationships | world | chapters | check_results | ... ││
│  └─────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      Vector Store (sqlite-vss)                       ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、模块划分

### 2.1 Presentation Layer（表现层）

| 模块 | 职责 | 技术 |
|------|------|------|
| **TUI App** | 终端交互界面 | Ink (React for CLI) |
| **Web App** | 浏览器交互界面 | React + Vite |
| **Shared Components** | 共享 UI 组件（逻辑复用） | React Components |

### 2.2 Service Layer（服务层）

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

### 2.3 Data Layer（数据层）

| 模块 | 职责 | 技术 |
|------|------|------|
| **SQLite DB** | 持久化存储 | better-sqlite3 |
| **Vector Store** | 向量存储 | sqlite-vss |
| **Repository** | 数据访问抽象 | TypeScript Classes |

---

## 三、通信契约

### 3.1 GUI ↔ Service 契约

**通信方式**: HTTP API（Web GUI）/ Direct Import（TUI）

```typescript
// ============================================
// Story Bible API
// ============================================

interface StoryBibleAPI {
  // Characters
  getCharacters(): Promise<Character[]>
  getCharacter(id: string): Promise<Character>
  createCharacter(data: CreateCharacterInput): Promise<Character>
  updateCharacter(id: string, data: UpdateCharacterInput): Promise<Character>
  deleteCharacter(id: string): Promise<void>

  // Relationships
  getRelationships(characterId?: string): Promise<Relationship[]>
  createRelationship(data: CreateRelationshipInput): Promise<Relationship>
  updateRelationship(id: number, data: UpdateRelationshipInput): Promise<Relationship>
  deleteRelationship(id: number): Promise<void>

  // World
  getWorld(): Promise<World>
  updateWorld(data: UpdateWorldInput): Promise<World>

  // Locations
  getLocations(): Promise<Location[]>
  createLocation(data: CreateLocationInput): Promise<Location>
  updateLocation(id: string, data: UpdateLocationInput): Promise<Location>
  deleteLocation(id: string): Promise<void>

  // Factions
  getFactions(): Promise<Faction[]>
  createFaction(data: CreateFactionInput): Promise<Faction>
  updateFaction(id: string, data: UpdateFactionInput): Promise<Faction>
  deleteFaction(id: string): Promise<void>

  // Plot
  getArcs(): Promise<Arc[]>
  createArc(data: CreateArcInput): Promise<Arc>
  updateArc(id: string, data: UpdateArcInput): Promise<Arc>

  // Foreshadowing
  getForeshadowing(): Promise<Foreshadowing[]>
  createForeshadowing(data: CreateForeshadowingInput): Promise<Foreshadowing>
  updateForeshadowing(id: string, data: UpdateForeshadowingInput): Promise<Foreshadowing>
  resolveForeshadowing(id: string, chapterId: number): Promise<Foreshadowing>
}

// ============================================
// Writing API
// ============================================

interface WritingAPI {
  // Volumes
  getVolumes(): Promise<Volume[]>
  createVolume(data: CreateVolumeInput): Promise<Volume>
  updateVolume(id: number, data: UpdateVolumeInput): Promise<Volume>

  // Chapters
  getChapters(volumeId?: number): Promise<Chapter[]>
  getChapter(id: number): Promise<ChapterDetail>
  createChapter(data: CreateChapterInput): Promise<Chapter>
  updateChapter(id: number, data: UpdateChapterInput): Promise<Chapter>
  deleteChapter(id: number): Promise<void>

  // Content
  saveContent(chapterId: number, content: string): Promise<void>
  getVersions(chapterId: number): Promise<Version[]>
  rollbackToVersion(chapterId: number, versionId: number): Promise<void>

  // Writing Goals
  getGoals(): Promise<WritingGoal[]>
  createGoal(data: CreateGoalInput): Promise<WritingGoal>
  updateGoalProgress(id: number, words: number): Promise<WritingGoal>

  // Writing Sessions
  startSession(chapterId: number): Promise<WritingSession>
  endSession(sessionId: number): Promise<WritingSession>
}

// ============================================
// AI API
// ============================================

interface AIAPI {
  // Generation
  continueScene(input: ContinueSceneInput): Promise<AIGenerationResult>
  generateDialogue(input: DialogueInput): Promise<AIGenerationResult>
  describeSettings(input: DescribeInput): Promise<AIGenerationResult>
  brainstorm(input: BrainstormInput): Promise<AIGenerationResult>

  // Story Bible Query
  askStoryBible(question: string): Promise<AIQueryResult>

  // Design Assistance
  designCharacter(input: CharacterDesignInput): Promise<AIGenerationResult>
  designPlot(input: PlotDesignInput): Promise<AIGenerationResult>

  // Streaming
  streamGeneration(input: GenerationInput): AsyncIterable<string>
}

// ============================================
// Quality API
// ============================================

interface QualityAPI {
  // Single Check
  checkChapter(chapterId: number): Promise<CheckResult>
  checkWaynePrinciples(chapterId: number): Promise<CheckResult>

  // Batch Check
  checkRange(startChapter: number, endChapter: number): Promise<CheckResult[]>
  checkVolume(volumeId: number): Promise<CheckResult[]>

  // Get Results
  getCheckResults(chapterId: number): Promise<CheckResult[]>
  getIssues(filter?: IssueFilter): Promise<Issue[]>
}

// ============================================
// Config API
// ============================================

interface ConfigAPI {
  // Rules
  getRules(): Promise<ConsistencyRules>
  updateRule(ruleId: string, config: RuleConfig): Promise<void>
  enableRule(ruleId: string): Promise<void>
  disableRule(ruleId: string): Promise<void>
  addCustomRule(rule: CustomRule): Promise<void>

  // Presets
  getPresets(): Promise<Preset[]>
  applyPreset(presetId: string): Promise<void>
  saveAsPreset(name: string): Promise<Preset>

  // AI Config
  getAIConfig(): Promise<AIConfig>
  updateAIConfig(config: AIConfig): Promise<void>
}

// ============================================
// Search API
// ============================================

interface SearchAPI {
  // Full Text
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>

  // Semantic
  semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>

  // Entity Search
  searchCharacters(query: string): Promise<Character[]>
  searchLocations(query: string): Promise<Location[]>
}

// ============================================
// Export API
// ============================================

interface ExportAPI {
  exportMarkdown(options: ExportOptions): Promise<string>  // 返回导出路径
  exportTxt(options: ExportOptions): Promise<string>
  exportWord(options: ExportOptions): Promise<string>
  exportStoryBible(options: ExportOptions): Promise<string>
}

// ============================================
// Project API
// ============================================

interface ProjectAPI {
  // Project
  getProject(): Promise<Project>
  updateProject(data: UpdateProjectInput): Promise<Project>

  // Templates
  getTemplates(): Promise<Template[]>
  createFromTemplate(templateId: string, name: string): Promise<Project>

  // Import
  importMarkdown(path: string): Promise<ImportResult>
}
```

### 3.2 Service ↔ Data 契约

```typescript
// ============================================
// Repository Interfaces
// ============================================

interface CharacterRepository {
  findAll(): Character[]
  findById(id: string): Character | null
  findByRole(role: CharacterRole): Character[]
  create(data: CharacterData): Character
  update(id: string, data: Partial<CharacterData>): Character
  delete(id: string): void
}

interface ChapterRepository {
  findAll(volumeId?: number): Chapter[]
  findById(id: number): Chapter | null
  findByStatus(status: ChapterStatus): Chapter[]
  create(data: ChapterData): Chapter
  update(id: number, data: Partial<ChapterData>): Chapter
  updateContent(id: number, content: string): void
  delete(id: number): void
}

interface CheckResultRepository {
  findByChapter(chapterId: number): CheckResult[]
  findByStatus(status: CheckStatus): CheckResult[]
  findIssues(filter?: IssueFilter): Issue[]
  create(data: CheckResultData): CheckResult
}

interface VersionRepository {
  findByEntity(entityType: string, entityId: string): Version[]
  create(entityType: string, entityId: string, content: any, summary?: string): Version
  getLatest(entityType: string, entityId: string): Version | null
}

interface EmbeddingRepository {
  upsert(entityType: string, entityId: string, content: string, embedding: number[]): void
  search(embedding: number[], limit: number): SearchResult[]
  deleteByEntity(entityType: string, entityId: string): void
}
```

### 3.3 事件通信

```typescript
// ============================================
// Events (GUI ↔ Service 双向)
// ============================================

type AppEvent =
  // Content Events
  | { type: 'CHAPTER_SAVED'; chapterId: number }
  | { type: 'CHAPTER_CREATED'; chapter: Chapter }
  | { type: 'CHAPTER_DELETED'; chapterId: number }

  // Character Events
  | { type: 'CHARACTER_CREATED'; character: Character }
  | { type: 'CHARACTER_UPDATED'; character: Character }
  | { type: 'CHARACTER_DELETED'; characterId: string }

  // Check Events
  | { type: 'CHECK_STARTED'; chapterId: number }
  | { type: 'CHECK_COMPLETED'; result: CheckResult }
  | { type: 'ISSUE_FOUND'; issue: Issue }

  // AI Events
  | { type: 'AI_GENERATION_STARTED'; taskId: string }
  | { type: 'AI_GENERATION_PROGRESS'; taskId: string; chunk: string }
  | { type: 'AI_GENERATION_COMPLETED'; taskId: string; result: string }
  | { type: 'AI_GENERATION_ERROR'; taskId: string; error: string }

  // Goal Events
  | { type: 'GOAL_PROGRESS_UPDATED'; goal: WritingGoal }
  | { type: 'GOAL_COMPLETED'; goal: WritingGoal }

// Event Bus
interface EventBus {
  emit(event: AppEvent): void
  on(eventType: AppEvent['type'], handler: (event: AppEvent) => void): () => void
  off(eventType: AppEvent['type'], handler: (event: AppEvent) => void): void
}
```

---

## 四、GUI 组件清单

### 4.1 Layout Components（布局组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `AppShell` | 应用外壳，包含侧边栏和主内容区 | `sidebar`, `children` |
| `Sidebar` | 侧边导航栏 | `items`, `activeItem`, `onSelect` |
| `Header` | 顶部导航/标题栏 | `title`, `actions`, `breadcrumbs` |
| `Panel` | 可折叠面板 | `title`, `collapsed`, `children` |
| `SplitView` | 分栏布局 | `left`, `right`, `ratio` |
| `Tabs` | 标签页 | `tabs`, `activeTab`, `onTabChange` |
| `Modal` | 模态框 | `open`, `onClose`, `title`, `children` |
| `Drawer` | 抽屉面板 | `open`, `onClose`, `position`, `children` |

### 4.2 Story Bible Components（故事圣经组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `CharacterCard` | 角色卡片展示 | `character`, `onClick`, `onEdit` |
| `CharacterEditor` | 角色编辑表单 | `character`, `onSave`, `onCancel` |
| `CharacterList` | 角色列表 | `characters`, `onSelect`, `filter` |
| `RelationshipGraph` | 关系图谱（可视化） | `characters`, `relationships`, `onNodeClick` |
| `RelationshipEditor` | 关系编辑 | `relationship`, `characters`, `onSave` |
| `WorldRuleCard` | 世界规则卡片 | `rule`, `onEdit` |
| `PowerSystemView` | 力量体系展示 | `powerSystem` |
| `LocationCard` | 地点卡片 | `location`, `onClick` |
| `FactionCard` | 势力卡片 | `faction`, `onClick` |
| `TimelineView` | 时间线展示 | `events`, `onEventClick` |
| `ArcOutliner` | 剧情弧大纲 | `arcs`, `onArcClick`, `onArcEdit` |
| `ForeshadowingList` | 伏笔列表 | `items`, `filter`, `onItemClick` |
| `ForeshadowingCard` | 伏笔卡片 | `foreshadowing`, `onResolve` |
| `HookTracker` | 钩子追踪 | `hooks`, `onHookClick` |

### 4.3 Writing Components（写作组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `ChapterEditor` | 章节编辑器（核心） | `chapter`, `onSave`, `onAIAssist` |
| `ChapterOutline` | 章节大纲面板 | `outline`, `onEdit` |
| `ChapterList` | 章节列表 | `chapters`, `activeId`, `onSelect` |
| `VolumeAccordion` | 卷折叠列表 | `volumes`, `chapters`, `onChapterSelect` |
| `WordCounter` | 字数统计 | `current`, `target`, `daily` |
| `WritingGoalCard` | 写作目标卡片 | `goal`, `onUpdate` |
| `VersionHistory` | 版本历史 | `versions`, `onRollback` |
| `DiffViewer` | 版本对比 | `oldContent`, `newContent` |

### 4.4 AI Components（AI 组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `AISidebar` | AI 助手侧边栏 | `context`, `onGenerate` |
| `AIPromptSelector` | 提示词选择器 | `prompts`, `onSelect` |
| `AIGenerationPanel` | 生成结果面板 | `options`, `onAccept`, `onRegenerate` |
| `AIStreamingOutput` | 流式输出显示 | `stream`, `loading` |
| `ContextPreview` | Context 预览 | `context`, `tokens` |
| `StoryBibleQuery` | 故事圣经问答 | `onAsk`, `answer` |

### 4.5 Quality Components（质量组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `CheckResultCard` | 检查结果卡片 | `result`, `onIssueClick` |
| `IssueList` | 问题列表 | `issues`, `onIssueClick`, `filter` |
| `IssueDetail` | 问题详情 | `issue`, `onFix`, `onIgnore` |
| `ConsistencyBadge` | 一致性徽章 | `status`, `count` |
| `WaynePrincipleCheck` | Wayne 原则检查卡 | `result`, `expanded` |
| `PacingVisualizer` | 节奏可视化 | `chapters`, `onChapterClick` |

### 4.6 Config Components（配置组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `RuleToggle` | 规则开关 | `rule`, `enabled`, `onChange` |
| `RuleEditor` | 规则编辑 | `rule`, `onSave` |
| `PresetSelector` | 预设选择器 | `presets`, `active`, `onSelect` |
| `AIProviderConfig` | AI 提供商配置 | `config`, `onSave` |
| `CustomRuleBuilder` | 自定义规则构建器 | `onSave` |

### 4.7 Common Components（通用组件）

| 组件 | 用途 | Props |
|------|------|-------|
| `Button` | 按钮 | `variant`, `size`, `onClick`, `loading` |
| `Input` | 输入框 | `value`, `onChange`, `placeholder` |
| `TextArea` | 多行输入 | `value`, `onChange`, `rows` |
| `Select` | 下拉选择 | `options`, `value`, `onChange` |
| `Checkbox` | 复选框 | `checked`, `onChange`, `label` |
| `Badge` | 徽章 | `variant`, `children` |
| `Tag` | 标签 | `color`, `children`, `onRemove` |
| `Avatar` | 头像 | `src`, `name`, `size` |
| `Tooltip` | 提示 | `content`, `children` |
| `Toast` | 提示消息 | `message`, `type`, `duration` |
| `Skeleton` | 加载占位 | `variant`, `width`, `height` |
| `EmptyState` | 空状态 | `icon`, `title`, `description`, `action` |
| `SearchInput` | 搜索输入 | `value`, `onChange`, `onSearch` |
| `DataTable` | 数据表格 | `columns`, `data`, `onRowClick` |
| `Pagination` | 分页 | `total`, `page`, `onPageChange` |
| `ProgressBar` | 进度条 | `value`, `max`, `label` |
| `MarkdownEditor` | Markdown 编辑器 | `value`, `onChange`, `preview` |
| `MarkdownPreview` | Markdown 预览 | `content` |

### 4.8 组件总数

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

---

## 五、项目文件结构

```
inxtone/
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── packages/
│   │
│   ├── core/                        # 核心业务逻辑
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   │
│   │   │   ├── services/            # 服务层
│   │   │   │   ├── StoryBibleService.ts
│   │   │   │   ├── WritingService.ts
│   │   │   │   ├── QualityService.ts
│   │   │   │   ├── AIService.ts
│   │   │   │   ├── SearchService.ts
│   │   │   │   ├── ConfigService.ts
│   │   │   │   ├── ExportService.ts
│   │   │   │   └── ProjectService.ts
│   │   │   │
│   │   │   ├── repositories/        # 数据访问层
│   │   │   │   ├── CharacterRepository.ts
│   │   │   │   ├── ChapterRepository.ts
│   │   │   │   ├── WorldRepository.ts
│   │   │   │   ├── PlotRepository.ts
│   │   │   │   ├── CheckResultRepository.ts
│   │   │   │   ├── VersionRepository.ts
│   │   │   │   └── EmbeddingRepository.ts
│   │   │   │
│   │   │   ├── ai/                  # AI 相关
│   │   │   │   ├── providers/
│   │   │   │   │   ├── AIProvider.ts        # 抽象接口
│   │   │   │   │   ├── ClaudeProvider.ts
│   │   │   │   │   └── OpenAIProvider.ts
│   │   │   │   ├── ContextBuilder.ts
│   │   │   │   └── PromptTemplates.ts
│   │   │   │
│   │   │   ├── rules/               # 业务规则（Data Driven）
│   │   │   │   ├── default/
│   │   │   │   │   ├── consistency.yaml
│   │   │   │   │   ├── wayne-principles.yaml
│   │   │   │   │   └── pacing.yaml
│   │   │   │   ├── RuleEngine.ts
│   │   │   │   └── RuleLoader.ts
│   │   │   │
│   │   │   ├── schemas/             # 数据结构定义
│   │   │   │   ├── Character.ts
│   │   │   │   ├── World.ts
│   │   │   │   ├── Plot.ts
│   │   │   │   ├── Chapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── db/                  # 数据库
│   │   │   │   ├── schema.sql
│   │   │   │   ├── migrations/
│   │   │   │   └── Database.ts
│   │   │   │
│   │   │   └── events/              # 事件系统
│   │   │       ├── EventBus.ts
│   │   │       └── events.ts
│   │   │
│   │   └── tests/
│   │
│   ├── ui/                          # 共享 UI 组件
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppShell.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Panel.tsx
│   │   │   │   │   ├── SplitView.tsx
│   │   │   │   │   ├── Tabs.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── Drawer.tsx
│   │   │   │   │
│   │   │   │   ├── story-bible/
│   │   │   │   │   ├── CharacterCard.tsx
│   │   │   │   │   ├── CharacterEditor.tsx
│   │   │   │   │   ├── CharacterList.tsx
│   │   │   │   │   ├── RelationshipGraph.tsx
│   │   │   │   │   ├── RelationshipEditor.tsx
│   │   │   │   │   ├── WorldRuleCard.tsx
│   │   │   │   │   ├── PowerSystemView.tsx
│   │   │   │   │   ├── LocationCard.tsx
│   │   │   │   │   ├── FactionCard.tsx
│   │   │   │   │   ├── TimelineView.tsx
│   │   │   │   │   ├── ArcOutliner.tsx
│   │   │   │   │   ├── ForeshadowingList.tsx
│   │   │   │   │   ├── ForeshadowingCard.tsx
│   │   │   │   │   └── HookTracker.tsx
│   │   │   │   │
│   │   │   │   ├── writing/
│   │   │   │   │   ├── ChapterEditor.tsx
│   │   │   │   │   ├── ChapterOutline.tsx
│   │   │   │   │   ├── ChapterList.tsx
│   │   │   │   │   ├── VolumeAccordion.tsx
│   │   │   │   │   ├── WordCounter.tsx
│   │   │   │   │   ├── WritingGoalCard.tsx
│   │   │   │   │   ├── VersionHistory.tsx
│   │   │   │   │   └── DiffViewer.tsx
│   │   │   │   │
│   │   │   │   ├── ai/
│   │   │   │   │   ├── AISidebar.tsx
│   │   │   │   │   ├── AIPromptSelector.tsx
│   │   │   │   │   ├── AIGenerationPanel.tsx
│   │   │   │   │   ├── AIStreamingOutput.tsx
│   │   │   │   │   ├── ContextPreview.tsx
│   │   │   │   │   └── StoryBibleQuery.tsx
│   │   │   │   │
│   │   │   │   ├── quality/
│   │   │   │   │   ├── CheckResultCard.tsx
│   │   │   │   │   ├── IssueList.tsx
│   │   │   │   │   ├── IssueDetail.tsx
│   │   │   │   │   ├── ConsistencyBadge.tsx
│   │   │   │   │   ├── WaynePrincipleCheck.tsx
│   │   │   │   │   └── PacingVisualizer.tsx
│   │   │   │   │
│   │   │   │   ├── config/
│   │   │   │   │   ├── RuleToggle.tsx
│   │   │   │   │   ├── RuleEditor.tsx
│   │   │   │   │   ├── PresetSelector.tsx
│   │   │   │   │   ├── AIProviderConfig.tsx
│   │   │   │   │   └── CustomRuleBuilder.tsx
│   │   │   │   │
│   │   │   │   └── common/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── TextArea.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       ├── Checkbox.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── Tag.tsx
│   │   │   │       ├── Avatar.tsx
│   │   │   │       ├── Tooltip.tsx
│   │   │   │       ├── Toast.tsx
│   │   │   │       ├── Skeleton.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       ├── SearchInput.tsx
│   │   │   │       ├── DataTable.tsx
│   │   │   │       ├── Pagination.tsx
│   │   │   │       ├── ProgressBar.tsx
│   │   │   │       ├── MarkdownEditor.tsx
│   │   │   │       └── MarkdownPreview.tsx
│   │   │   │
│   │   │   ├── hooks/               # 共享 Hooks
│   │   │   │   ├── useCharacters.ts
│   │   │   │   ├── useChapters.ts
│   │   │   │   ├── useAI.ts
│   │   │   │   └── useConfig.ts
│   │   │   │
│   │   │   └── styles/              # 共享样式
│   │   │       ├── variables.css
│   │   │       ├── components.css
│   │   │       └── theme.ts
│   │   │
│   │   └── tests/
│   │
│   ├── web/                         # Web GUI
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   │
│   │   │   ├── pages/               # 页面
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StoryBible/
│   │   │   │   │   ├── Characters.tsx
│   │   │   │   │   ├── CharacterDetail.tsx
│   │   │   │   │   ├── World.tsx
│   │   │   │   │   ├── Plot.tsx
│   │   │   │   │   └── Foreshadowing.tsx
│   │   │   │   ├── Writing/
│   │   │   │   │   ├── Workspace.tsx
│   │   │   │   │   ├── ChapterEditor.tsx
│   │   │   │   │   └── Outline.tsx
│   │   │   │   ├── Quality/
│   │   │   │   │   ├── Overview.tsx
│   │   │   │   │   └── Issues.tsx
│   │   │   │   ├── Settings/
│   │   │   │   │   ├── Rules.tsx
│   │   │   │   │   ├── AI.tsx
│   │   │   │   │   └── Project.tsx
│   │   │   │   └── Export.tsx
│   │   │   │
│   │   │   ├── api/                 # API Client
│   │   │   │   └── client.ts
│   │   │   │
│   │   │   └── router.tsx
│   │   │
│   │   └── public/
│   │
│   ├── tui/                         # TUI
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.tsx
│   │   │   ├── App.tsx
│   │   │   └── screens/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Characters.tsx
│   │   │       ├── Writing.tsx
│   │   │       └── ...
│   │   └── bin/
│   │       └── inxtone.ts           # CLI 入口
│   │
│   └── server/                      # HTTP Server (for Web GUI)
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── storyBible.ts
│       │   │   ├── writing.ts
│       │   │   ├── quality.ts
│       │   │   ├── ai.ts
│       │   │   ├── config.ts
│       │   │   └── export.ts
│       │   └── middleware/
│       └── tests/
│
├── templates/                       # 项目模板
│   ├── default/
│   │   └── template.yaml
│   └── xiuxian/
│       └── template.yaml
│
└── docs/
    └── design/                      # 设计文档（当前）
```

---

## 六、技术栈确认

| 层 | 技术 | 备注 |
|----|------|------|
| **Monorepo** | pnpm workspaces | 包管理 |
| **Language** | TypeScript | 全栈 |
| **Web Framework** | React 18 | |
| **Web Bundler** | Vite | 快速开发 |
| **TUI Framework** | Ink | React for CLI |
| **HTTP Server** | Fastify | 轻量高性能 |
| **Database** | better-sqlite3 | SQLite binding |
| **Vector Search** | sqlite-vss | 向量扩展 |
| **AI SDK** | Vercel AI SDK | 多 provider |
| **Styling** | Tailwind CSS | Web GUI |
| **Component Library** | Radix UI | 无样式基础组件 |
| **Testing** | Vitest | 测试框架 |
| **Linting** | ESLint + Prettier | 代码规范 |

---

*最后更新：2026-02-05*
*Status: 🚧 进行中*
