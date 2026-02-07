# Data Driven Development

> 设计哲学：规则即数据，行为由数据驱动

## 核心理念

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

## 应用场景

| 领域 | 数据化内容 | 好处 |
|------|-----------|------|
| **一致性检查** | YAML 规则文件 | 用户可自定义规则、启用/禁用 |
| **Wayne 原则** | 可配置的检查项 | 不同类型作品有不同标准 |
| **AI Prompts** | 模板文件 | 用户可调优、分享模板 |
| **导出格式** | 模板 + 配置 | 灵活的输出格式 |
| **UI 文案** | i18n 文件 | 多语言支持 |

## 规则引擎设计

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
