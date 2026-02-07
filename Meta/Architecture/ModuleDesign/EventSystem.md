# Event System

> GUI ↔ Service 双向事件通信

## Event Types

```typescript
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
```

## Event Bus Interface

```typescript
interface EventBus {
  emit(event: AppEvent): void
  on(eventType: AppEvent['type'], handler: (event: AppEvent) => void): () => void
  off(eventType: AppEvent['type'], handler: (event: AppEvent) => void): void
}
```

## Usage Example

```typescript
// 发布事件
eventBus.emit({ type: 'CHAPTER_SAVED', chapterId: 42 })

// 订阅事件
const unsubscribe = eventBus.on('CHAPTER_SAVED', (event) => {
  console.log(`Chapter ${event.chapterId} saved`)
})

// 取消订阅
unsubscribe()
```
