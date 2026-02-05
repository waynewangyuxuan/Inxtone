# EventBus 模块设计

> 事件系统：模块间解耦通信、实时更新通知

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **事件发布** | 模块发送事件通知 |
| **事件订阅** | 模块监听感兴趣的事件 |
| **事件路由** | 将事件分发给订阅者 |
| **跨进程通信** | WebSocket 广播到 Web GUI |

---

## 二、事件类型定义

### 2.1 完整事件列表

```typescript
type AppEvent =
  // ==================== 内容事件 ====================
  | { type: 'CHAPTER_CREATED'; chapter: Chapter }
  | { type: 'CHAPTER_SAVED'; chapterId: number; wordDelta: number }
  | { type: 'CHAPTER_DELETED'; chapterId: number }
  | { type: 'CHAPTER_ROLLBACK'; chapterId: number; versionId: number }

  // ==================== 角色事件 ====================
  | { type: 'CHARACTER_CREATED'; character: Character }
  | { type: 'CHARACTER_UPDATED'; character: Character; changes: string[] }
  | { type: 'CHARACTER_DELETED'; characterId: string }

  // ==================== 关系事件 ====================
  | { type: 'RELATIONSHIP_CREATED'; relationship: Relationship }
  | { type: 'RELATIONSHIP_UPDATED'; relationship: Relationship }
  | { type: 'RELATIONSHIP_DELETED'; relationshipId: number }

  // ==================== 世界观事件 ====================
  | { type: 'WORLD_UPDATED'; section: string }  // 'rules' | 'locations' | ...
  | { type: 'LOCATION_CREATED'; location: Location }
  | { type: 'FACTION_CREATED'; faction: Faction }

  // ==================== 剧情事件 ====================
  | { type: 'ARC_CREATED'; arc: Arc }
  | { type: 'ARC_UPDATED'; arc: Arc }
  | { type: 'FORESHADOWING_CREATED'; foreshadowing: Foreshadowing }
  | { type: 'FORESHADOWING_RESOLVED'; foreshadowing: Foreshadowing }
  | { type: 'HOOK_CREATED'; hook: Hook }
  | { type: 'HOOK_CLOSED'; hook: Hook }

  // ==================== 质量检查事件 ====================
  | { type: 'CHECK_STARTED'; chapterId: number; checkType: string }
  | { type: 'CHECK_PROGRESS'; chapterId: number; progress: number }
  | { type: 'CHECK_COMPLETED'; chapterId: number; result: CheckResult }
  | { type: 'ISSUE_FOUND'; issue: Issue }
  | { type: 'ISSUE_RESOLVED'; issueId: number }

  // ==================== AI 事件 ====================
  | { type: 'AI_GENERATION_STARTED'; taskId: string; type: string }
  | { type: 'AI_GENERATION_PROGRESS'; taskId: string; chunk: string }
  | { type: 'AI_GENERATION_COMPLETED'; taskId: string; result: string }
  | { type: 'AI_GENERATION_ERROR'; taskId: string; error: string }
  | { type: 'AI_CONTEXT_BUILT'; taskId: string; tokensUsed: number }

  // ==================== 目标事件 ====================
  | { type: 'GOAL_PROGRESS_UPDATED'; goal: WritingGoal }
  | { type: 'GOAL_COMPLETED'; goal: WritingGoal }
  | { type: 'STREAK_UPDATED'; days: number }

  // ==================== 文件同步事件 ====================
  | { type: 'FILE_SYNCED'; path: string; entityType: string; entityId: string }
  | { type: 'FILE_CONFLICT'; path: string; resolution: string }
  | { type: 'FILE_ERROR'; path: string; error: string }

  // ==================== 索引事件 ====================
  | { type: 'INDEX_UPDATE_STARTED'; entityType: string }
  | { type: 'INDEX_UPDATE_COMPLETED'; entityType: string; count: number }
  | { type: 'INDEX_REBUILD_STARTED' }
  | { type: 'INDEX_REBUILD_PROGRESS'; progress: number }
  | { type: 'INDEX_REBUILD_COMPLETED' }

  // ==================== 配置事件 ====================
  | { type: 'CONFIG_CHANGED'; key: string; value: any }
  | { type: 'PRESET_APPLIED'; presetId: string }
  | { type: 'RULE_TOGGLED'; ruleId: string; enabled: boolean }

  // ==================== 项目事件 ====================
  | { type: 'PROJECT_OPENED'; project: Project }
  | { type: 'PROJECT_CLOSED' }
  | { type: 'EXPORT_STARTED'; format: string }
  | { type: 'EXPORT_COMPLETED'; format: string; path: string }
```

---

## 三、核心工作流

### 3.1 事件发布

```
模块内部操作完成
    │
    ▼
┌─────────────────────────────────────────┐
│ StoryBibleService.createCharacter()     │
│   ...                                   │
│   db.insert(character)                  │
│   ...                                   │
│   eventBus.emit({                       │
│     type: 'CHARACTER_CREATED',          │
│     character: character                │
│   })                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ EventBus.emit(event)                    │
│   │                                     │
│   ├─→ 验证事件格式                      │
│   │                                     │
│   ├─→ 添加元数据                        │
│   │   - timestamp                       │
│   │   - eventId (nanoid)               │
│   │                                     │
│   ├─→ 同步分发给本地订阅者              │
│   │                                     │
│   └─→ 异步广播到 WebSocket 客户端       │
└─────────────────────────────────────────┘
```

### 3.2 事件订阅

```typescript
// 在模块初始化时订阅
class SearchService {
  constructor(private eventBus: EventBus) {
    // 订阅多个事件
    eventBus.on('CHARACTER_CREATED', this.handleCharacterCreated)
    eventBus.on('CHARACTER_UPDATED', this.handleCharacterUpdated)
    eventBus.on('CHAPTER_SAVED', this.handleChapterSaved)
  }

  private handleCharacterCreated = (event: AppEvent) => {
    if (event.type !== 'CHARACTER_CREATED') return
    this.updateIndex('character', event.character)
  }

  // 清理订阅
  destroy() {
    eventBus.off('CHARACTER_CREATED', this.handleCharacterCreated)
    // ...
  }
}
```

### 3.3 WebSocket 广播

```
事件触发
    │
    ▼
┌─────────────────────────────────────────┐
│ EventBus.emit(event)                    │
│   │                                     │
│   ├─→ 本地分发 (同步)                   │
│   │                                     │
│   └─→ WebSocket 广播 (异步)             │
│       │                                 │
│       ▼                                 │
│   ┌─────────────────────────────────┐   │
│   │ for client in wss.clients:      │   │
│   │   if client.readyState == OPEN: │   │
│   │     client.send(JSON.stringify( │   │
│   │       event                     │   │
│   │     ))                          │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Web GUI 接收                            │
│                                         │
│ ws.onmessage = (msg) => {              │
│   const event = JSON.parse(msg.data)   │
│                                         │
│   // 更新 React Query 缓存              │
│   switch (event.type) {                 │
│     case 'CHARACTER_UPDATED':           │
│       queryClient.invalidateQueries(    │
│         ['characters']                  │
│       )                                 │
│       break                             │
│     // ...                              │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## 四、事件分类

### 4.1 按同步性分类

```
┌─────────────────────────────────────────┐
│ 同步事件 (阻塞等待处理完成)             │
│                                         │
│   - 很少使用                            │
│   - 仅用于必须等待的场景                │
│   示例: CONFIG_CHANGED (需等待生效)     │
├─────────────────────────────────────────┤
│ 异步事件 (fire-and-forget)              │
│                                         │
│   - 大多数事件                          │
│   - 发送后立即返回                      │
│   示例: CHAPTER_SAVED, INDEX_UPDATED    │
└─────────────────────────────────────────┘
```

### 4.2 按传播范围分类

```
┌─────────────────────────────────────────┐
│ 仅本地 (LocalOnly)                      │
│                                         │
│   - 不广播到 WebSocket                  │
│   - 内部状态变化                        │
│   示例: INDEX_UPDATE_STARTED            │
├─────────────────────────────────────────┤
│ 广播 (Broadcast)                        │
│                                         │
│   - 同时发送到所有 WebSocket 客户端     │
│   - UI 需要响应的事件                   │
│   示例: CHARACTER_UPDATED, ISSUE_FOUND  │
└─────────────────────────────────────────┘
```

---

## 五、实现细节

### 5.1 EventBus 类

```typescript
class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private wss?: WebSocketServer

  // 绑定 WebSocket Server
  attachWebSocket(wss: WebSocketServer) {
    this.wss = wss
  }

  // 订阅
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)

    // 返回取消订阅函数
    return () => this.off(eventType, handler)
  }

  // 取消订阅
  off(eventType: string, handler: EventHandler) {
    this.handlers.get(eventType)?.delete(handler)
  }

  // 发布
  emit(event: AppEvent) {
    // 添加元数据
    const enrichedEvent = {
      ...event,
      _id: nanoid(),
      _timestamp: Date.now()
    }

    // 本地分发
    const handlers = this.handlers.get(event.type)
    handlers?.forEach(handler => {
      try {
        handler(enrichedEvent)
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error)
      }
    })

    // 通配符订阅者
    const wildcardHandlers = this.handlers.get('*')
    wildcardHandlers?.forEach(handler => {
      try {
        handler(enrichedEvent)
      } catch (error) {
        console.error(`Wildcard handler error:`, error)
      }
    })

    // WebSocket 广播
    if (this.wss && !event._localOnly) {
      this.broadcast(enrichedEvent)
    }
  }

  private broadcast(event: AppEvent) {
    const message = JSON.stringify(event)
    this.wss?.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }
}
```

---

## 六、与其他模块的交互

| 模块 | 发送的事件 | 监听的事件 |
|------|------------|------------|
| **StoryBibleService** | CHARACTER_*, RELATIONSHIP_*, WORLD_*, ARC_*, FORESHADOWING_* | - |
| **WritingService** | CHAPTER_*, GOAL_*, STREAK_* | - |
| **AIService** | AI_* | - |
| **QualityService** | CHECK_*, ISSUE_* | CHAPTER_SAVED |
| **SearchService** | INDEX_* | CHARACTER_*, CHAPTER_SAVED |
| **FileWatcher** | FILE_* | CHARACTER_UPDATED, CHAPTER_SAVED |
| **ConfigService** | CONFIG_*, PRESET_*, RULE_* | - |
| **Web GUI** | - | * (所有广播事件) |

---

## 七、关键设计决策

### 7.1 为什么不用现成的事件库

```
选项:
  - EventEmitter3
  - mitt
  - 自定义实现

选择: 自定义实现

理由:
  1. 需要类型安全 (TypeScript)
  2. 需要 WebSocket 集成
  3. 需要元数据注入
  4. 代码量很小，自己写更可控
```

### 7.2 错误隔离

```
原则: 一个订阅者的错误不影响其他订阅者

实现:
  handlers.forEach(handler => {
    try {
      handler(event)
    } catch (error) {
      // 记录错误但继续
      console.error(error)
    }
  })
```

### 7.3 内存泄漏防范

```
问题: 忘记取消订阅导致内存泄漏

解决:
  1. on() 返回 unsubscribe 函数
  2. 模块 destroy() 时清理
  3. WeakRef 存储 handler (可选)
```

---

## 八、错误处理

| 错误场景 | 处理 |
|----------|------|
| Handler 抛出异常 | 捕获并记录，继续分发给其他 handler |
| WebSocket 发送失败 | 跳过该客户端，不重试 |
| 事件格式错误 | 拒绝发送，记录警告 |

---

*Review 重点: 事件类型完整性、WebSocket广播机制、错误隔离*
