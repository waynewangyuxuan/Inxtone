# AI Context Management

> Context Window 策略

## Context 配置

```typescript
// packages/core/src/ai/ContextBuilder.ts
interface ContextConfig {
  maxTokens: number          // 模型限制（如 200k）
  reserveForOutput: number   // 预留给输出（如 4k）
  reserveForPrompt: number   // 预留给 prompt 模板（如 2k）
}
```

## Context Builder

```typescript
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

## Context 注入模式

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
