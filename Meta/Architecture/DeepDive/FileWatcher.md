# File Watcher

> 文件监听与同步机制

## 设计目标

用户可以用**任何编辑器**（VS Code, Obsidian, Vim）编辑 Story Bible 文件，
Inxtone 自动检测变化并同步到数据库。

## 监听机制

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

## 冲突处理

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
