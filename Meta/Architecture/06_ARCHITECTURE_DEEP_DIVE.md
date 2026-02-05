# 06 架构深度设计 - 核心机制

> 补充 05_ARCHITECTURE.md 中未详细定义的关键架构决策

**Status**: 🚧 设计中

---

## 一、设计哲学：Data Driven Development

### 1.1 核心理念

**"规则即数据，行为由数据驱动"**

```
传统方式：
  if (characterAge !== previousAge) → error

Data Driven 方式：
  rules.yaml:
    - id: age_consistency
      check: character.age == previousMention.age
      severity: error
      message: "年龄不一致: {{current}} vs {{previous}}"
```

### 1.2 应用场景

| 领域 | 数据化内容 | 好处 |
|------|-----------|------|
| **一致性检查** | YAML 规则文件 | 用户可自定义规则、启用/禁用 |
| **Wayne 原则** | 可配置的检查项 | 不同类型作品有不同标准 |
| **AI Prompts** | 模板文件 | 用户可调优、分享模板 |
| **导出格式** | 模板 + 配置 | 灵活的输出格式 |
| **UI 文案** | i18n 文件 | 多语言支持 |

### 1.3 规则引擎设计

```typescript
// 规则定义（YAML）
interface Rule {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  category: 'consistency' | 'wayne' | 'pacing' | 'custom'
  severity: 'error' | 'warning' | 'info'
  enabled: boolean

  // 检查逻辑（声明式）
  check: {
    type: 'comparison' | 'regex' | 'count' | 'ai'
    target: string      // JSONPath 到目标字段
    condition: string   // 检查条件
    context?: string[]  // 需要的上下文
  }

  // AI 辅助检查
  aiPrompt?: string     // 当 type='ai' 时使用

  // 快速修复
  quickFix?: {
    type: 'replace' | 'suggest'
    template: string
  }
}

// 规则引擎
class RuleEngine {
  private rules: Map<string, Rule>

  async check(entity: any, context: Context): Promise<CheckResult[]> {
    const results: CheckResult[] = []

    for (const rule of this.getEnabledRules()) {
      const result = await this.evaluateRule(rule, entity, context)
      if (result.hasIssue) {
        results.push(result)
      }
    }

    return results
  }
}
```

---

## 二、IPC 通信架构

### 2.1 整体通信模型

```
┌─────────────┐         ┌─────────────┐
│   TUI App   │         │  Web GUI    │
│  (Ink/CLI)  │         │  (React)    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ Direct Import         │ HTTP/WebSocket
       │ (同进程)              │ (跨进程)
       │                       │
       └───────────┬───────────┘
                   │
           ┌───────┴───────┐
           │    Server     │
           │  (Fastify)    │
           │               │
           │  ┌─────────┐  │
           │  │ Services│  │
           │  └─────────┘  │
           │  ┌─────────┐  │
           │  │   DB    │  │
           │  └─────────┘  │
           └───────────────┘
```

### 2.2 TUI 通信方式：Direct Import

TUI 和 Server 运行在**同一进程**，直接调用 Service 层：

```typescript
// packages/tui/src/App.tsx
import { StoryBibleService, WritingService } from '@inxtone/core'

function CharacterScreen() {
  // 直接调用，无网络开销
  const characters = StoryBibleService.getCharacters()

  return <CharacterList items={characters} />
}
```

**优点**：
- 零延迟
- 无序列化开销
- 简单可靠

**启动方式**：
```bash
inxtone              # TUI 模式，直接调用 Services
inxtone serve        # 同时启动 HTTP Server（为 Web GUI）
```

### 2.3 Web GUI 通信方式：HTTP + WebSocket

#### HTTP API（请求-响应）

```typescript
// packages/web/src/api/client.ts
const API_BASE = 'http://localhost:3456/api'

export const api = {
  characters: {
    list: () => fetch(`${API_BASE}/characters`).then(r => r.json()),
    get: (id: string) => fetch(`${API_BASE}/characters/${id}`).then(r => r.json()),
    create: (data: CreateCharacterInput) =>
      fetch(`${API_BASE}/characters`, {
        method: 'POST',
        body: JSON.stringify(data)
      }).then(r => r.json()),
  },
  // ...
}
```

#### WebSocket（实时更新）

```typescript
// packages/server/src/websocket.ts
import { WebSocketServer } from 'ws'

interface WSMessage {
  type: AppEvent['type']
  payload: any
}

// 服务端：广播事件
eventBus.on('*', (event) => {
  wss.clients.forEach(client => {
    client.send(JSON.stringify(event))
  })
})

// 客户端：订阅更新
// packages/web/src/hooks/useRealtimeSync.ts
export function useRealtimeSync() {
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3456/ws')

    ws.onmessage = (event) => {
      const data: AppEvent = JSON.parse(event.data)

      switch (data.type) {
        case 'CHAPTER_SAVED':
          queryClient.invalidateQueries(['chapters', data.chapterId])
          break
        case 'CHARACTER_UPDATED':
          queryClient.invalidateQueries(['characters'])
          break
        // ...
      }
    }

    return () => ws.close()
  }, [])
}
```

### 2.4 AI 流式响应

```typescript
// Server Side: SSE (Server-Sent Events)
// packages/server/src/routes/ai.ts
fastify.get('/api/ai/stream', async (request, reply) => {
  reply.raw.setHeader('Content-Type', 'text/event-stream')
  reply.raw.setHeader('Cache-Control', 'no-cache')

  const stream = await AIService.streamGeneration(request.query)

  for await (const chunk of stream) {
    reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`)
  }

  reply.raw.write('data: [DONE]\n\n')
  reply.raw.end()
})

// Client Side: EventSource
// packages/web/src/hooks/useAIStream.ts
export function useAIStream() {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const generate = (input: GenerationInput) => {
    setLoading(true)
    setOutput('')

    const source = new EventSource(`/api/ai/stream?${params}`)

    source.onmessage = (event) => {
      if (event.data === '[DONE]') {
        source.close()
        setLoading(false)
      } else {
        const { chunk } = JSON.parse(event.data)
        setOutput(prev => prev + chunk)
      }
    }
  }

  return { output, loading, generate }
}
```

---

## 三、文件监听与同步

### 3.1 设计目标

用户可以用**任何编辑器**（VS Code, Obsidian, Vim）编辑 Story Bible 文件，
Inxtone 自动检测变化并同步到数据库。

### 3.2 监听机制

```typescript
// packages/core/src/watcher/FileWatcher.ts
import chokidar from 'chokidar'

class FileWatcher {
  private watcher: chokidar.FSWatcher

  constructor(private projectPath: string) {
    this.watcher = chokidar.watch(
      path.join(projectPath, 'story-bible/**/*.md'),
      {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,  // 等待写入完成
          pollInterval: 100
        }
      }
    )

    this.watcher
      .on('add', (path) => this.handleAdd(path))
      .on('change', (path) => this.handleChange(path))
      .on('unlink', (path) => this.handleDelete(path))
  }

  private async handleChange(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = this.parseMarkdown(content)
    const entityType = this.inferEntityType(filePath)

    // 更新数据库
    await this.syncToDatabase(entityType, parsed)

    // 更新向量索引
    await this.updateEmbedding(entityType, parsed)

    // 触发事件
    eventBus.emit({
      type: 'FILE_SYNCED',
      path: filePath,
      entityType
    })
  }
}
```

### 3.3 冲突处理

```
场景：用户同时在 VS Code 和 Inxtone 中编辑同一文件

策略：Last Write Wins + 版本历史

流程：
1. Inxtone 保存 → 写入文件 + 更新 DB + 创建版本
2. VS Code 保存 → 触发 FileWatcher
3. FileWatcher 检测变化 →
   a. 解析新内容
   b. 对比 DB 中的版本
   c. 如有冲突，创建冲突版本（保留两边）
   d. 更新 DB 为最新文件内容
   e. 通知用户有冲突（可选择版本）
```

---

## 四、状态管理

### 4.1 Web GUI：React Query + Zustand

```typescript
// 服务端状态：React Query
// packages/web/src/hooks/useCharacters.ts
export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => api.characters.list(),
    staleTime: 1000 * 60  // 1分钟
  })
}

// 客户端状态：Zustand
// packages/web/src/stores/uiStore.ts
interface UIState {
  sidebarCollapsed: boolean
  activeTab: string
  editorSettings: EditorSettings

  toggleSidebar: () => void
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeTab: 'characters',
  editorSettings: defaultEditorSettings,

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveTab: (tab) => set({ activeTab: tab })
}))
```

### 4.2 TUI：简化状态

```typescript
// TUI 使用 React 内置状态 + Context
// packages/tui/src/context/AppContext.tsx
interface AppState {
  currentProject: Project | null
  currentScreen: Screen
  characters: Character[]
  chapters: Chapter[]
}

const AppContext = createContext<AppState>(null)

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 直接调用 Services
  useEffect(() => {
    const characters = StoryBibleService.getCharacters()
    dispatch({ type: 'SET_CHARACTERS', payload: characters })
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}
```

---

## 五、AI Context 管理

### 5.1 Context Window 策略

```typescript
// packages/core/src/ai/ContextBuilder.ts
interface ContextConfig {
  maxTokens: number          // 模型限制（如 200k）
  reserveForOutput: number   // 预留给输出（如 4k）
  reserveForPrompt: number   // 预留给 prompt 模板（如 2k）
}

class ContextBuilder {
  private config: ContextConfig
  private tokenCounter: TokenCounter

  build(input: ContextInput): BuiltContext {
    const available = this.config.maxTokens
      - this.config.reserveForOutput
      - this.config.reserveForPrompt

    let used = 0
    const context: ContextItem[] = []

    // 优先级排序
    const prioritized = this.prioritize([
      ...input.characters,    // 相关角色
      ...input.worldRules,    // 相关设定
      ...input.recentChapters // 最近章节
    ])

    // 按优先级填充，直到达到限制
    for (const item of prioritized) {
      const tokens = this.tokenCounter.count(item.content)
      if (used + tokens > available) break

      context.push(item)
      used += tokens
    }

    return {
      items: context,
      tokensUsed: used,
      tokensAvailable: available
    }
  }

  private prioritize(items: ContextItem[]): ContextItem[] {
    return items.sort((a, b) => {
      // 1. 显式选择的优先
      if (a.selected && !b.selected) return -1
      // 2. 语义相关性
      if (a.relevanceScore > b.relevanceScore) return -1
      // 3. 最近使用
      if (a.lastUsed > b.lastUsed) return -1
      return 0
    })
  }
}
```

### 5.2 Context 注入模式

```
用户请求: "续写第42章"

Context 构建流程:
1. 获取 Chapter 42 当前内容
2. 语义搜索相关角色 → 林逸, 苏瑶
3. 语义搜索相关设定 → 悬崖场景, 力量体系
4. 获取前文（Chapter 41 末尾）
5. 获取大纲（本章目标）
6. 组装 Context:

   <context>
   ## 角色档案
   ### 林逸
   {角色信息}

   ### 苏瑶
   {角色信息}

   ## 相关设定
   {悬崖场景描述}

   ## 前文
   {Chapter 41 最后500字}

   ## 本章大纲
   {大纲要点}
   </context>

   ## 当前内容
   {Chapter 42 已有内容}

   请续写...
```

---

## 六、错误处理策略

### 6.1 错误分类

| 类别 | 示例 | 处理 |
|------|------|------|
| **用户错误** | 必填字段为空 | 表单校验，友好提示 |
| **业务错误** | 角色名重复 | 业务层抛出，UI 显示 |
| **系统错误** | DB 连接失败 | 重试 + 日志 + 通知 |
| **AI 错误** | API 超时 | 重试 + 降级（换模型） |
| **网络错误** | 请求失败 | 重试 + 离线队列 |

### 6.2 错误处理流程

```typescript
// packages/core/src/errors/index.ts
class InxtoneError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}

// 业务错误
class DuplicateEntityError extends InxtoneError {
  constructor(entityType: string, name: string) {
    super(
      'DUPLICATE_ENTITY',
      `${entityType} "${name}" already exists`,
      true,
      { entityType, name }
    )
  }
}

// AI 错误处理
class AIService {
  async generate(input: GenerationInput): Promise<string> {
    const providers = this.config.fallbackOrder // ['claude', 'openai']

    for (const providerId of providers) {
      try {
        return await this.callProvider(providerId, input)
      } catch (error) {
        if (error instanceof RateLimitError) {
          await this.wait(error.retryAfter)
          continue
        }
        if (error instanceof AuthError) {
          throw error // 不可恢复
        }
        // 尝试下一个 provider
        continue
      }
    }

    throw new AIError('ALL_PROVIDERS_FAILED', 'All AI providers failed')
  }
}
```

---

## 七、CLI 命令设计

### 7.1 命令结构

```bash
inxtone                    # 启动 TUI（交互模式）
inxtone serve              # 启动 HTTP Server + TUI
inxtone serve --no-tui     # 仅启动 HTTP Server（headless）

# 项目管理
inxtone init [name]        # 初始化新项目
inxtone init --template xiuxian  # 使用模板
inxtone open [path]        # 打开项目

# 快捷操作（非交互）
inxtone check              # 运行一致性检查
inxtone check --fix        # 自动修复可修复的问题
inxtone export md          # 导出为 Markdown
inxtone export docx        # 导出为 Word

# Story Bible
inxtone bible list characters
inxtone bible show character lin-yi
inxtone bible search "林逸 关系"

# 写作
inxtone write              # 进入写作模式
inxtone write 42           # 直接编辑第42章

# AI
inxtone ai ask "林逸和苏瑶是什么关系？"
inxtone ai continue 42     # AI 续写第42章

# 配置
inxtone config set ai.provider claude
inxtone config get ai.model
```

### 7.2 命令实现

```typescript
// packages/tui/bin/inxtone.ts
#!/usr/bin/env node
import { Command } from 'commander'
import { render } from 'ink'
import App from '../src/App'

const program = new Command()

program
  .name('inxtone')
  .description('AI-assisted web novel writing tool')
  .version('0.1.0')

// TUI 模式（默认）
program
  .action(() => {
    render(<App />)
  })

// Server 模式
program
  .command('serve')
  .option('--no-tui', 'Run server without TUI')
  .option('-p, --port <port>', 'Server port', '3456')
  .action((options) => {
    startServer(options.port)
    if (options.tui !== false) {
      render(<App />)
    }
  })

// 检查命令
program
  .command('check')
  .option('--fix', 'Auto-fix issues')
  .action(async (options) => {
    const results = await QualityService.checkAll()
    displayResults(results)
    if (options.fix) {
      await QualityService.autoFix(results)
    }
  })

program.parse()
```

---

## 八、未覆盖的功能自查

### 8.1 MVP 功能清单核对

| # | 功能 | 架构文档 | 状态 |
|---|------|----------|------|
| 1 | TUI 交互 | 01_INTERACTION.md | ✅ |
| 2 | Web GUI | 01_INTERACTION.md | ✅ |
| 3 | 角色管理 | BusinessLogic/ + API | ✅ |
| 4 | 世界观管理 | BusinessLogic/ + API | ✅ |
| 5 | 剧情管理 | BusinessLogic/ + API | ✅ |
| 6 | 章节编辑 | 01_INTERACTION + API | ✅ |
| 7 | AI 续写 | 03_COMPUTER_LOGIC + API | ✅ |
| 8 | AI 问答 | 03_COMPUTER_LOGIC + API | ✅ |
| 9 | 一致性检查 | BusinessLogic/ + API | ✅ |
| 10 | Wayne 原则 | BusinessLogic/ | ✅ |
| 11 | 伏笔追踪 | BusinessLogic/ | ✅ |
| 12 | 版本历史 | 04_DATA_LAYER | ✅ |
| 13 | 导出功能 | API | ✅ |
| 14 | 配置管理 | API | ✅ |
| 15 | 文件监听 | 本文档 | ✅ (新增) |
| 16 | IPC 通信 | 本文档 | ✅ (新增) |
| 17 | 实时同步 | 本文档 | ✅ (新增) |
| 18 | 错误处理 | 本文档 | ✅ (新增) |
| 19 | CLI 命令 | 本文档 | ✅ (新增) |
| 20 | Context 管理 | 本文档 | ✅ (新增) |

### 8.2 待补充项

| 项目 | 优先级 | 说明 |
|------|--------|------|
| **离线模式** | P2 | AI 不可用时的降级策略 |
| **多项目支持** | P2 | 项目切换、最近项目列表 |
| **数据库迁移** | P2 | 版本升级时的 schema 变更 |
| **备份恢复** | P3 | 自动备份、灾难恢复 |
| **插件系统** | P3 | 自定义规则、导出格式扩展 |

---

*最后更新：2026-02-05*
*Status: 🚧 设计中*
