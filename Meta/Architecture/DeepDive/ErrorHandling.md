# Error Handling

> 错误处理策略

## 错误分类

| 类别 | 示例 | 处理 |
|------|------|------|
| **用户错误** | 必填字段为空 | 表单校验，友好提示 |
| **业务错误** | 角色名重复 | 业务层抛出，UI 显示 |
| **系统错误** | DB 连接失败 | 重试 + 日志 + 通知 |
| **AI 错误** | API 超时 | 重试 + 降级（换模型） |
| **网络错误** | 请求失败 | 重试 + 离线队列 |

## 错误处理实现

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
```

## AI 错误处理

```typescript
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

## 错误处理原则

1. **用户友好**: 显示人类可读的错误消息
2. **可恢复性**: 尽可能提供重试或降级选项
3. **日志完整**: 记录完整错误上下文用于调试
4. **优雅降级**: AI 不可用时提供基本功能
