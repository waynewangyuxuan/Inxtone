# QualityService 模块设计

> 质量控制：一致性检查、Wayne 原则、节奏分析

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **一致性检查** | 检测角色属性、时间线、设定的冲突 |
| **Wayne 原则** | 检查章节是否符合网文写作原则 |
| **节奏分析** | 分析情节节奏，可视化张力曲线 |
| **Issue 管理** | 问题的收集、过滤、修复建议 |

---

## 二、核心工作流

### 2.1 章节保存后自动检查

```
触发: WritingService 发送 CHAPTER_SAVED 事件
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. EventBus 监听                         │
│    QualityService.onChapterSaved(event) │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 检查类型判断                          │
│                                         │
│    快速检查 (同步):                      │
│    - 基于规则的文本匹配                  │
│    - 耗时 < 100ms                       │
│                                         │
│    深度检查 (异步):                      │
│    - AI 辅助的语义分析                   │
│    - 耗时可能 > 5s                      │
└─────────────────────────────────────────┘
    │
    ├─────────────────┐
    │ 快速检查        │ 深度检查 (后台)
    ▼                 ▼
┌─────────────┐   ┌─────────────────────────┐
│ RuleEngine  │   │ AI 辅助检查             │
│ .check()    │   │ - Wayne 原则分析        │
│             │   │ - 复杂一致性判断        │
└──────┬──────┘   └────────────┬────────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ 3. 汇总检查结果                          │
│    - 合并所有 Issues                    │
│    - 去重 (相同问题只报一次)            │
│    - 按严重性排序                       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 存储 & 通知                           │
│    - 写入 check_results 表              │
│    - 写入 issues 表                     │
│    - 发送事件 CHECK_COMPLETED           │
│    - 如有严重问题，显示 Toast 提醒      │
└─────────────────────────────────────────┘
```

### 2.2 一致性检查详细流程

```
检查维度:
┌─────────────────────────────────────────┐
│ 1. 角色属性一致性                        │
│    - 年龄                               │
│    - 外貌特征                           │
│    - 称呼/名字                          │
│    - 境界/等级                          │
│                                         │
│ 2. 时间线一致性                          │
│    - 事件发生顺序                       │
│    - 时间间隔合理性                      │
│    - 季节/日期对应                      │
│                                         │
│ 3. 设定一致性                            │
│    - 力量体系规则                       │
│    - 地理位置                           │
│    - 势力关系                           │
└─────────────────────────────────────────┘

检查流程:
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 提取章节中的实体提及                  │
│                                         │
│    正则 + NER:                          │
│    - 角色名出现位置                     │
│    - 数字 + 单位 (年龄、距离等)        │
│    - 时间表达式                         │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 关联历史记录                          │
│                                         │
│    查询 entity_mentions 表:             │
│    - 该角色之前所有提及                 │
│    - 该属性的历史值                     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 执行规则检查                          │
│                                         │
│    RuleEngine.check(current, history)   │
│                                         │
│    示例规则:                            │
│    age_consistency:                     │
│      if current.age != history.age      │
│         and not explicit_time_skip:    │
│        → Issue(error, "年龄不一致")    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 生成 Issue                           │
│                                         │
│    Issue {                              │
│      rule_id: 'age_consistency'         │
│      severity: 'error'                  │
│      chapter_id: 42                     │
│      line_number: 156                   │
│      message: "林逸年龄不一致:          │
│               当前16岁 vs Ch.3的18岁"  │
│      suggestion: "修改为18岁"           │
│      auto_fixable: true                 │
│    }                                    │
└─────────────────────────────────────────┘
```

### 2.3 Wayne 原则检查

```
Wayne 原则列表:
┌─────────────────────────────────────────┐
│ 1. 冲突驱动 (Conflict Driven)           │
│    - 章节必须有核心冲突                 │
│    - 冲突类型: 人vs人/自然/自己/社会   │
│                                         │
│ 2. 悬念设置 (Suspense)                  │
│    - 章节结尾需要钩子                   │
│    - 新问题的提出                       │
│                                         │
│ 3. 情感共鸣 (Emotional Resonance)       │
│    - 情感波动的存在                     │
│    - 读者代入感                         │
│                                         │
│ 4. 节奏控制 (Pacing)                    │
│    - 张弛有度                           │
│    - 避免连续高潮或连续平淡            │
│                                         │
│ 5. 角色成长 (Character Growth)          │
│    - 主角需要变化                       │
│    - 配角有存在价值                     │
└─────────────────────────────────────────┘

检查方式: AI 辅助分析
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 构建检查 Prompt                       │
│                                         │
│    prompts/check/wayne.md:              │
│    "分析以下章节是否符合网文写作原则..." │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. AI 返回结构化结果                     │
│                                         │
│    {                                    │
│      conflict: { pass: true, note: "" },│
│      suspense: { pass: true, note: "" },│
│      emotion: { pass: false,            │
│        note: "情感变化不够明显" },      │
│      pacing: { pass: true, note: "" },  │
│      growth: { pass: true, note: "" }   │
│    }                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 转换为 Issues                         │
│                                         │
│    未通过的项 → Warning Issue           │
│    附带 AI 生成的改进建议               │
└─────────────────────────────────────────┘
```

---

## 三、Issue 生命周期

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ detected│ ──→ │  open   │ ──→ │ resolved│
└─────────┘     └────┬────┘     └─────────┘
                     │
                     │ 用户标记忽略
                     ▼
                ┌─────────┐
                │ ignored │
                └─────────┘

状态转换:
- detected → open: 自动（检查完成后）
- open → resolved: 用户修复内容后，重新检查通过
- open → ignored: 用户手动标记（附带原因）
- ignored → open: 用户取消忽略
```

---

## 四、数据存储

```sql
-- 检查结果表
CREATE TABLE check_results (
  id INTEGER PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  check_type TEXT NOT NULL,  -- 'consistency' | 'wayne' | 'pacing'
  passed BOOLEAN NOT NULL,
  score INTEGER,  -- 0-100，可选
  details JSON,   -- 详细结果
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- Issue 表
CREATE TABLE issues (
  id INTEGER PRIMARY KEY,
  rule_id TEXT NOT NULL,
  severity TEXT NOT NULL,  -- 'error' | 'warning' | 'info'
  status TEXT DEFAULT 'open',  -- 'open' | 'resolved' | 'ignored'

  chapter_id INTEGER,
  line_number INTEGER,

  message TEXT NOT NULL,
  suggestion TEXT,
  auto_fixable BOOLEAN DEFAULT FALSE,

  ignored_reason TEXT,  -- 如果 ignored，记录原因
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- 实体提及追踪（用于一致性检查）
CREATE TABLE entity_mentions (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,  -- 'character' | 'location' | ...
  entity_id TEXT NOT NULL,
  attribute TEXT NOT NULL,    -- 'age' | 'appearance' | ...
  value TEXT NOT NULL,

  chapter_id INTEGER NOT NULL,
  line_number INTEGER,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
```

---

## 五、与其他模块的交互

| 交互模块 | 方向 | 场景 |
|----------|------|------|
| **WritingService** | ← | 监听 CHAPTER_SAVED 触发检查 |
| **StoryBibleService** | ← | 获取角色/设定的正确值 |
| **AIService** | → | Wayne 原则等 AI 辅助检查 |
| **RuleEngine** | → | 执行规则检查 |
| **EventBus** | → | 发送 CHECK_COMPLETED, ISSUE_FOUND |

---

## 六、关键设计决策

### 6.1 检查时机策略

```
即时检查 (保存后立即):
  - 快速规则检查 (< 100ms)
  - 结果立即可见

延迟检查 (后台异步):
  - AI 辅助检查
  - 批量一致性检查
  - 完成后通知

手动触发:
  - 用户点击 "全量检查"
  - 导出前强制检查
```

### 6.2 Issue 去重策略

```
相同 Issue 判定:
  rule_id 相同
  AND chapter_id 相同
  AND line_number 差距 < 5 行

处理:
  - 保留最新的一条
  - 更新 message 如有变化
```

### 6.3 自动修复边界

```
可自动修复:
  ✓ 数值不一致 (年龄、等级)
  ✓ 名称拼写 (有明确正确值)
  ✓ 格式问题 (标点、空格)

不可自动修复:
  ✗ 逻辑矛盾 (需要创作判断)
  ✗ 情节冲突 (需要重写)
  ✗ Wayne 原则问题 (需要改进写作)

原则: 只修复有明确正确答案的问题
```

---

## 七、错误处理

| 错误场景 | 处理 |
|----------|------|
| AI 检查超时 | 跳过 AI 检查，只返回规则检查结果 |
| 规则执行异常 | 记录日志，跳过该规则，继续其他检查 |
| 数据库写入失败 | 重试 + 内存缓存结果，稍后写入 |

---

*Review 重点: 检查时机策略、Issue去重、自动修复边界*
