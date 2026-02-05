# RuleEngine 模块设计

> Data Driven 的核心：规则即数据，配置驱动行为

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **规则加载** | 从 YAML 文件加载规则定义 |
| **规则执行** | 解析条件、执行检查、生成结果 |
| **规则管理** | 启用/禁用、优先级、自定义规则 |
| **预设管理** | 规则组合的预设配置 |

---

## 二、核心概念

### 2.1 规则定义结构

```yaml
# rules/consistency/age.yaml
id: age_consistency
name:
  zh: 年龄一致性
  en: Age Consistency
description:
  zh: 检查角色年龄在不同章节中是否一致
  en: Check if character age is consistent across chapters

category: consistency
severity: error
enabled: true
priority: 100  # 数字越大越先执行

# 检查逻辑
check:
  type: comparison  # comparison | regex | count | custom | ai
  target: "character.age"
  condition: "current == previous OR has_time_skip"

# 上下文需求
context:
  - entity_mentions  # 需要历史提及记录
  - chapter_timeline  # 需要时间线信息

# 快速修复
quick_fix:
  available: true
  type: replace
  template: "将 {{current}} 替换为 {{expected}}"
```

### 2.2 规则类型

```
┌─────────────────────────────────────────┐
│ comparison (比较型)                      │
│   - 比较两个值是否相等/大于/小于        │
│   - 适用: 年龄、等级、数值属性          │
├─────────────────────────────────────────┤
│ regex (正则型)                          │
│   - 文本模式匹配                        │
│   - 适用: 格式检查、称呼一致            │
├─────────────────────────────────────────┤
│ count (计数型)                          │
│   - 统计出现次数                        │
│   - 适用: 伏笔数量、角色出场次数        │
├─────────────────────────────────────────┤
│ custom (自定义型)                       │
│   - JavaScript 函数                     │
│   - 适用: 复杂逻辑                      │
├─────────────────────────────────────────┤
│ ai (AI 辅助型)                          │
│   - 调用 AI 进行分析                    │
│   - 适用: Wayne 原则、主观判断          │
└─────────────────────────────────────────┘
```

---

## 三、核心工作流

### 3.1 规则加载流程

```
应用启动
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 扫描规则目录                          │
│                                         │
│    rules/                               │
│    ├── consistency/                     │
│    │   ├── age.yaml                     │
│    │   ├── name.yaml                    │
│    │   └── timeline.yaml                │
│    ├── wayne/                           │
│    │   ├── conflict.yaml                │
│    │   └── suspense.yaml                │
│    └── custom/  ← 用户自定义            │
│        └── my_rule.yaml                 │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 解析 YAML                            │
│    - 验证 schema                        │
│    - 检查必填字段                       │
│    - 处理 i18n                          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 合并用户配置                          │
│                                         │
│    用户配置 (inxtone.yaml):             │
│    rules:                               │
│      age_consistency:                   │
│        enabled: false  ← 覆盖默认       │
│      my_custom_rule:                    │
│        severity: warning ← 自定义       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 构建规则索引                          │
│                                         │
│    Map<rule_id, Rule>                   │
│    - 按 category 分组                   │
│    - 按 priority 排序                   │
└─────────────────────────────────────────┘
```

### 3.2 规则执行流程

```
输入: 待检查内容 + 上下文
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 筛选适用规则                          │
│                                         │
│    过滤条件:                            │
│    - enabled = true                     │
│    - category 匹配检查类型              │
│    - 上下文满足 context 需求            │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 按优先级执行                          │
│                                         │
│    for rule in sorted_rules:            │
│      result = execute(rule, input, ctx) │
│      results.append(result)             │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 执行单条规则                          │
│                                         │
│    switch rule.check.type:              │
│      comparison → executeComparison()   │
│      regex → executeRegex()             │
│      count → executeCount()             │
│      custom → executeCustom()           │
│      ai → executeAI()                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 生成检查结果                          │
│                                         │
│    CheckResult {                        │
│      rule_id: string                    │
│      passed: boolean                    │
│      issues: Issue[]                    │
│      metadata: {...}                    │
│    }                                    │
└─────────────────────────────────────────┘
```

### 3.3 Comparison 类型执行

```typescript
// 示例: 年龄一致性检查

function executeComparison(rule, input, context) {
  const target = getByPath(input, rule.check.target)
  // target = input.character.age = 16

  const previous = context.entity_mentions
    .filter(m => m.entity_id === input.character.id)
    .filter(m => m.attribute === 'age')
    .sort((a, b) => b.chapter_id - a.chapter_id)
    [0]?.value
  // previous = 18 (来自 Ch.3)

  const condition = rule.check.condition
  // condition = "current == previous OR has_time_skip"

  const result = evaluateCondition(condition, {
    current: target,
    previous: previous,
    has_time_skip: context.chapter_timeline.hasTimeSkip
  })

  if (!result) {
    return {
      passed: false,
      issues: [{
        rule_id: rule.id,
        severity: rule.severity,
        message: interpolate(rule.message, {
          current: target,
          previous: previous
        })
      }]
    }
  }

  return { passed: true, issues: [] }
}
```

---

## 四、预设系统

### 4.1 预设定义

```yaml
# presets/strict.yaml
id: strict
name:
  zh: 严格模式
  en: Strict Mode
description:
  zh: 启用所有检查，适合校对阶段
  en: Enable all checks, suitable for proofreading

rules:
  # 启用所有一致性检查
  age_consistency: { enabled: true, severity: error }
  name_consistency: { enabled: true, severity: error }
  timeline_consistency: { enabled: true, severity: error }

  # 启用所有 Wayne 原则
  wayne_conflict: { enabled: true, severity: warning }
  wayne_suspense: { enabled: true, severity: warning }

---
# presets/relaxed.yaml
id: relaxed
name:
  zh: 宽松模式
  en: Relaxed Mode
description:
  zh: 只检查严重问题，适合初稿阶段
  en: Check critical issues only, suitable for first draft

rules:
  age_consistency: { enabled: true, severity: warning }
  name_consistency: { enabled: true, severity: warning }
  timeline_consistency: { enabled: false }
  wayne_conflict: { enabled: false }
  wayne_suspense: { enabled: false }
```

### 4.2 预设应用流程

```
用户选择预设: "严格模式"
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 加载预设配置                          │
│    preset = loadPreset('strict')        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 合并到用户配置                        │
│                                         │
│    for (rule_id, config) in preset:     │
│      userConfig.rules[rule_id] = merge( │
│        defaultConfig,                   │
│        presetConfig,                    │
│        existingUserConfig               │
│      )                                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 重新加载规则引擎                      │
│    ruleEngine.reload()                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 持久化用户选择                        │
│    config.current_preset = 'strict'     │
└─────────────────────────────────────────┘
```

---

## 五、自定义规则

### 5.1 用户自定义规则

```yaml
# my-novel/.inxtone/rules/my_rule.yaml
id: forbidden_words
name:
  zh: 禁用词检查
  en: Forbidden Words Check
description:
  zh: 检查是否使用了不应出现的现代词汇

category: custom
severity: warning
enabled: true

check:
  type: regex
  target: "chapter.content"
  pattern: "(手机|电脑|互联网|微信)"

message:
  zh: "发现现代词汇: {{match}}，在古代背景中不应使用"
  en: "Found modern word: {{match}}, should not use in ancient setting"

quick_fix:
  available: false
```

### 5.2 Custom 函数规则

```yaml
# 复杂逻辑使用 JavaScript
id: pacing_check
name:
  zh: 节奏检查
  en: Pacing Check

check:
  type: custom
  function: |
    // 检查连续 N 章是否都是战斗场景
    const recentChapters = context.chapters.slice(-5)
    const battleCount = recentChapters.filter(ch =>
      ch.tags?.includes('battle')
    ).length

    if (battleCount >= 4) {
      return {
        passed: false,
        message: '连续4章都是战斗场景，建议调整节奏'
      }
    }
    return { passed: true }
```

---

## 六、与其他模块的交互

| 交互模块 | 方向 | 场景 |
|----------|------|------|
| **QualityService** | ← | 调用执行检查 |
| **AIService** | → | AI 类型规则调用 AI |
| **ConfigService** | ↔ | 加载/保存规则配置 |
| **FileWatcher** | ← | 监听规则文件变化，热重载 |

---

## 七、关键设计决策

### 7.1 为什么用 YAML 而非 JSON

```
YAML 优点:
  ✓ 支持注释
  ✓ 多行字符串更友好
  ✓ 更易读写
  ✓ 适合 i18n 结构

JSON 优点:
  ✓ 解析更快
  ✓ 无歧义

选择: YAML
理由: 规则是给人看的，可读性优先
```

### 7.2 规则隔离性

```
问题: 用户自定义规则可能有 bug

解决:
  1. 规则执行在 try-catch 中
  2. 单条规则失败不影响其他规则
  3. 超时限制 (5秒/规则)
  4. 日志记录失败规则
```

### 7.3 热重载

```
场景: 用户修改规则文件后立即生效

实现:
  FileWatcher 监听 rules/ 目录
  文件变化 → 重新加载该规则
  无需重启应用
```

---

## 八、错误处理

| 错误场景 | 处理 |
|----------|------|
| YAML 解析失败 | 跳过该规则，显示警告 |
| 规则执行超时 | 中断执行，记录日志 |
| Custom 函数报错 | 捕获异常，跳过该规则 |
| 预设文件缺失 | 使用默认配置 |

---

*Review 重点: YAML结构设计、预设合并逻辑、Custom函数安全性*
