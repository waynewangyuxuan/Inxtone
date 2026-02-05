# FileWatcher 模块设计

> 文件监听：支持外部编辑器修改，自动同步到数据库

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **目录监听** | 监听 story-bible/ 目录变化 |
| **文件解析** | 将 Markdown 解析为结构化数据 |
| **双向同步** | 外部修改 → DB，DB 修改 → 文件 |
| **冲突处理** | 检测并处理编辑冲突 |

---

## 二、核心概念

### 2.1 监听范围

```
my-novel/
├── story-bible/           ← 监听
│   ├── 00_meta/           ← 监听
│   ├── 01_world/          ← 监听
│   ├── 02_characters/     ← 监听
│   ├── 03_plot/           ← 监听
│   ├── 04_outline/        ← 监听
│   └── 05_draft/          ← 监听
├── chapters/              ← 监听 (可选)
├── .inxtone/              ← 不监听 (内部数据)
└── inxtone.yaml           ← 监听 (配置)
```

### 2.2 文件类型映射

```
文件路径                      → 实体类型
───────────────────────────────────────────
02_characters/*.md           → Character
01_world/locations/*.md      → Location
01_world/factions/*.md       → Faction
01_world/rules.md            → WorldRules
03_plot/arcs/*.md            → Arc
03_plot/foreshadowing.md     → Foreshadowing[]
04_outline/*.md              → Outline
chapters/ch_*.md             → Chapter
```

---

## 三、核心工作流

### 3.1 启动时初始化

```
应用启动
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 初始化 FileWatcher                    │
│                                         │
│    watcher = chokidar.watch(            │
│      'story-bible/**/*.md',             │
│      {                                  │
│        persistent: true,                │
│        ignoreInitial: true,  ← 首次不触发│
│        awaitWriteFinish: {              │
│          stabilityThreshold: 500,       │
│          pollInterval: 100              │
│        }                                │
│      }                                  │
│    )                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 注册事件处理器                        │
│                                         │
│    watcher.on('add', handleAdd)         │
│    watcher.on('change', handleChange)   │
│    watcher.on('unlink', handleDelete)   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 首次同步检查                          │
│                                         │
│    比较: 文件系统 vs 数据库              │
│    - 文件有但 DB 没有 → 导入            │
│    - DB 有但文件没有 → 导出或标记删除   │
│    - 两边都有但内容不同 → 冲突处理       │
└─────────────────────────────────────────┘
```

### 3.2 文件变化处理

```
用户在 VS Code 中保存文件
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. chokidar 检测到 'change' 事件        │
│                                         │
│    等待 awaitWriteFinish (500ms)        │
│    确保文件写入完成                      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 读取文件内容                          │
│    content = fs.readFile(path)          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 解析 Markdown                         │
│                                         │
│    parseMarkdown(content) → {           │
│      frontmatter: { id, name, ... },    │
│      body: "正文内容..."               │
│    }                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 冲突检测                              │
│                                         │
│    dbRecord = db.findByPath(path)       │
│                                         │
│    if dbRecord.updated_at > file.mtime: │
│      → 可能是 Inxtone 刚写入的          │
│      → 忽略此次变化 (防止循环)          │
│                                         │
│    if dbRecord.content_hash == newHash: │
│      → 内容相同，无需处理               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 5. 更新数据库                            │
│                                         │
│    db.update(entityId, {                │
│      ...parsedData,                     │
│      updated_at: now(),                 │
│      content_hash: newHash,             │
│      sync_source: 'file'  ← 标记来源   │
│    })                                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 6. 更新索引                              │
│    SearchService.updateIndex(entity)    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 7. 发送事件                              │
│    EventBus.emit(FILE_SYNCED, {         │
│      path, entityType, entityId         │
│    })                                   │
└─────────────────────────────────────────┘
```

### 3.3 从 DB 写入文件

```
用户在 Inxtone 中修改角色
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. StoryBibleService 更新数据库         │
│    db.update(character)                 │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 检查是否需要同步到文件               │
│                                         │
│    config.sync_to_file == true?         │
│    character.file_path exists?          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 生成 Markdown                         │
│                                         │
│    content = renderMarkdown(character)  │
│                                         │
│    ---                                  │
│    id: char_abc123                      │
│    name: 林逸                           │
│    role: protagonist                    │
│    ---                                  │
│                                         │
│    # 林逸                               │
│                                         │
│    ## 基本信息                          │
│    ...                                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 暂停监听 (防止循环触发)              │
│    watcher.unwatch(path)                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 5. 写入文件                              │
│    fs.writeFile(path, content)          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 6. 恢复监听                              │
│    watcher.add(path)                    │
└─────────────────────────────────────────┘
```

---

## 四、冲突处理

### 4.1 冲突场景

```
场景: 用户同时在 Inxtone 和 VS Code 编辑

时间线:
  T1: 用户在 Inxtone 修改角色年龄为 20
  T2: 用户在 VS Code 修改角色名为 "林逸2"
  T3: VS Code 保存 (不知道 T1 的修改)
  T4: FileWatcher 检测到变化

问题:
  VS Code 的文件不包含 T1 的年龄修改
  直接覆盖会丢失数据
```

### 4.2 冲突检测算法

```
function detectConflict(filePath, fileContent) {
  const dbRecord = db.findByPath(filePath)

  // 情况1: 新文件
  if (!dbRecord) {
    return { type: 'new', action: 'import' }
  }

  // 情况2: 内容相同
  const fileHash = hash(fileContent)
  if (dbRecord.content_hash === fileHash) {
    return { type: 'same', action: 'skip' }
  }

  // 情况3: DB 没有未同步的修改
  if (dbRecord.sync_source === 'file') {
    // 上次是从文件同步的，可以安全覆盖
    return { type: 'update', action: 'import' }
  }

  // 情况4: DB 有未同步的修改
  if (dbRecord.updated_at > dbRecord.last_file_sync) {
    // DB 在上次文件同步后有修改
    return {
      type: 'conflict',
      action: 'merge',
      dbVersion: dbRecord,
      fileVersion: parseMarkdown(fileContent)
    }
  }

  return { type: 'update', action: 'import' }
}
```

### 4.3 冲突解决策略

```
策略选项:
┌─────────────────────────────────────────┐
│ 1. 自动: Last Write Wins                │
│    - 简单粗暴                           │
│    - 可能丢失数据                       │
│    - 但会保留版本历史                   │
│                                         │
│ 2. 自动: DB 优先                        │
│    - Inxtone 内的修改优先               │
│    - 外部修改被丢弃                     │
│                                         │
│ 3. 手动: 提示用户                       │
│    - 显示两个版本的差异                 │
│    - 用户选择保留哪个                   │
│    - 或手动合并                         │
└─────────────────────────────────────────┘

默认策略: Last Write Wins + 自动创建版本备份

实现:
  1. 将 DB 版本保存为新版本 (backup)
  2. 用文件内容覆盖 DB
  3. 通知用户: "检测到外部修改，已自动同步，
              旧版本已保存到版本历史"
```

---

## 五、Markdown 解析规范

### 5.1 角色文件格式

```markdown
---
id: char_abc123
name: 林逸
role: protagonist
archetype: seeker
created_at: 2024-01-01
---

# 林逸

## 外貌
身材修长，剑眉星目...

## 动机

### 表层动机
想要变得更强...

### 中层动机
证明自己的价值...

### 深层动机
寻找真正的归属...

## 声音样本
> "强者从不解释自己的选择，但我不想做那种强者。"
```

### 5.2 解析规则

```typescript
function parseCharacterMd(content: string) {
  const { data: frontmatter, content: body } = matter(content)

  const sections = parseSections(body)

  return {
    id: frontmatter.id,
    name: frontmatter.name,
    role: frontmatter.role,
    archetype: frontmatter.archetype,

    appearance: sections['外貌'] || sections['Appearance'],
    motivations: {
      surface: sections['表层动机'] || sections['Surface'],
      middle: sections['中层动机'] || sections['Middle'],
      core: sections['深层动机'] || sections['Core'],
    },
    voice_samples: extractQuotes(sections['声音样本'] || sections['Voice'])
  }
}
```

---

## 六、与其他模块的交互

| 交互模块 | 方向 | 场景 |
|----------|------|------|
| **StoryBibleService** | ↔ | 双向同步数据 |
| **WritingService** | ↔ | 章节文件同步 |
| **SearchService** | → | 文件变化后更新索引 |
| **RuleEngine** | → | 规则文件变化后热重载 |
| **EventBus** | → | 发送 FILE_SYNCED 事件 |

---

## 七、关键设计决策

### 7.1 为什么用 chokidar

```
选项对比:
┌─────────────────────────────────────────┐
│ Node.js fs.watch:                       │
│   ✗ 不稳定，不同 OS 行为不一致         │
│   ✗ 不支持递归监听                     │
│                                         │
│ chokidar:                               │
│   ✓ 跨平台一致                         │
│   ✓ 递归监听                           │
│   ✓ 支持 glob 模式                     │
│   ✓ awaitWriteFinish 防止读取不完整文件│
└─────────────────────────────────────────┘
```

### 7.2 防循环机制

```
问题: DB 写入文件 → 触发 FileWatcher → 写入 DB → ...

解决方案:
  1. 写入前 unwatch
  2. 写入后等待 100ms
  3. 再 watch
  4. 检查 sync_source 标记
```

### 7.3 性能考虑

```
大项目优化:
  - 使用 awaitWriteFinish 合并连续写入
  - 批量处理变化 (防抖 500ms)
  - 只索引变化的文件，非全量
```

---

## 八、错误处理

| 错误场景 | 处理 |
|----------|------|
| 文件解析失败 | 跳过同步，记录日志，通知用户 |
| 权限不足 | 提示用户检查文件权限 |
| 磁盘空间不足 | 阻止写入，提示清理空间 |
| 监听数量超限 | 提示减少监听范围 (Linux ulimit) |

---

*Review 重点: 冲突检测算法、防循环机制、Markdown解析规范*
