# Database 模块设计

> 数据层核心：SQLite 访问、事务、迁移

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **连接管理** | SQLite 连接、WAL 模式 |
| **查询执行** | prepared statements、参数绑定 |
| **事务管理** | 自动/手动事务、回滚 |
| **迁移系统** | Schema 版本管理、升级脚本 |

---

## 二、数据库配置

### 2.1 SQLite 配置

```typescript
// packages/core/src/db/Database.ts
import Database from 'better-sqlite3'

class DatabaseManager {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)

    // 启用 WAL 模式（并发性能）
    this.db.pragma('journal_mode = WAL')

    // 启用外键约束
    this.db.pragma('foreign_keys = ON')

    // 设置忙等待超时
    this.db.pragma('busy_timeout = 5000')

    // 同步模式（性能 vs 安全平衡）
    this.db.pragma('synchronous = NORMAL')

    // 缓存大小 (负数表示 KB)
    this.db.pragma('cache_size = -64000')  // 64MB
  }
}
```

### 2.2 文件位置

```
my-novel/
├── .inxtone/
│   ├── index.db          # 主数据库
│   ├── index.db-wal      # WAL 日志
│   └── index.db-shm      # 共享内存
```

---

## 三、核心工作流

### 3.1 查询执行

```
Repository 调用
    │
    ▼
┌─────────────────────────────────────────┐
│ CharacterRepository.findById(id)        │
│   return db.query(                      │
│     'SELECT * FROM characters WHERE id = ?',│
│     [id]                                │
│   )                                     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Database.query(sql, params)             │
│   │                                     │
│   ├─→ 获取或创建 prepared statement     │
│   │   stmt = stmtCache.get(sql)        │
│   │   if (!stmt) {                     │
│   │     stmt = db.prepare(sql)         │
│   │     stmtCache.set(sql, stmt)       │
│   │   }                                │
│   │                                     │
│   ├─→ 绑定参数并执行                    │
│   │   result = stmt.get(...params)     │
│   │                                     │
│   └─→ 返回结果                          │
└─────────────────────────────────────────┘
```

### 3.2 事务管理

```typescript
// 自动事务（简单场景）
class Database {
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)()
  }
}

// 使用示例
db.transaction(() => {
  db.run('INSERT INTO characters ...')
  db.run('INSERT INTO embeddings ...')
  // 任一失败，全部回滚
})

// 手动事务（复杂场景）
const trx = db.beginTransaction()
try {
  trx.run('INSERT INTO characters ...')
  // 中间可能有其他逻辑
  trx.run('INSERT INTO embeddings ...')
  trx.commit()
} catch (error) {
  trx.rollback()
  throw error
}
```

### 3.3 批量操作

```typescript
// 批量插入（性能优化）
function bulkInsert(table: string, rows: any[]) {
  const columns = Object.keys(rows[0])
  const placeholders = columns.map(() => '?').join(', ')
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`

  const stmt = db.prepare(sql)

  db.transaction(() => {
    for (const row of rows) {
      stmt.run(...columns.map(col => row[col]))
    }
  })()
}

// 使用
bulkInsert('chapters', [
  { id: 1, title: '第1章', content: '...' },
  { id: 2, title: '第2章', content: '...' },
  // ... 1000 条
])
// 比单条插入快 50x+
```

---

## 四、迁移系统

### 4.1 迁移文件结构

```
packages/core/src/db/migrations/
├── 001_initial.sql
├── 002_add_embeddings.sql
├── 003_add_check_results.sql
└── ...
```

### 4.2 迁移文件格式

```sql
-- migrations/001_initial.sql
-- Migration: 001_initial
-- Created: 2024-01-01

-- Up
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  archetype TEXT,
  appearance TEXT,
  motivations JSON,
  voice_samples JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  volume_id INTEGER,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  outline TEXT,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (volume_id) REFERENCES volumes(id)
);

-- ... 其他表

-- Down (回滚用，可选)
-- DROP TABLE characters;
-- DROP TABLE chapters;
```

### 4.3 迁移执行流程

```
应用启动
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 检查迁移表                            │
│                                         │
│    CREATE TABLE IF NOT EXISTS           │
│    _migrations (                        │
│      id INTEGER PRIMARY KEY,            │
│      name TEXT NOT NULL,                │
│      applied_at TEXT DEFAULT            │
│        CURRENT_TIMESTAMP                │
│    );                                   │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 获取已执行的迁移                      │
│                                         │
│    applied = db.query(                  │
│      'SELECT name FROM _migrations'     │
│    )                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 扫描迁移文件                          │
│                                         │
│    files = glob('migrations/*.sql')     │
│    pending = files.filter(              │
│      f => !applied.includes(f.name)     │
│    )                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 按顺序执行待执行迁移                  │
│                                         │
│    for migration in pending.sorted():   │
│      db.transaction(() => {             │
│        db.exec(migration.sql)           │
│        db.run(                          │
│          'INSERT INTO _migrations ...'  │
│        )                                │
│      })                                 │
│      console.log(`Applied: ${name}`)    │
└─────────────────────────────────────────┘
```

---

## 五、Repository 模式

### 5.1 基础 Repository

```typescript
abstract class BaseRepository<T, ID> {
  constructor(
    protected db: DatabaseManager,
    protected tableName: string
  ) {}

  findAll(): T[] {
    return this.db.query(`SELECT * FROM ${this.tableName}`)
  }

  findById(id: ID): T | null {
    return this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    )[0] || null
  }

  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): T {
    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(', ')

    const result = this.db.run(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      Object.values(data)
    )

    return this.findById(result.lastInsertRowid as ID)!
  }

  update(id: ID, data: Partial<T>): T {
    const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')

    this.db.run(
      `UPDATE ${this.tableName} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...Object.values(data), id]
    )

    return this.findById(id)!
  }

  delete(id: ID): void {
    this.db.run(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    )
  }
}
```

### 5.2 具体 Repository

```typescript
class CharacterRepository extends BaseRepository<Character, string> {
  constructor(db: DatabaseManager) {
    super(db, 'characters')
  }

  // 特定查询
  findByRole(role: CharacterRole): Character[] {
    return this.db.query(
      'SELECT * FROM characters WHERE role = ?',
      [role]
    )
  }

  findWithRelationships(id: string): CharacterWithRelations {
    const character = this.findById(id)
    if (!character) return null

    const relationships = this.db.query(`
      SELECT r.*, c.name as target_name
      FROM relationships r
      JOIN characters c ON (
        CASE WHEN r.from_id = ? THEN r.to_id ELSE r.from_id END = c.id
      )
      WHERE r.from_id = ? OR r.to_id = ?
    `, [id, id, id])

    return { ...character, relationships }
  }
}
```

---

## 六、性能优化

### 6.1 索引策略

```sql
-- 常用查询的索引
CREATE INDEX idx_characters_role ON characters(role);
CREATE INDEX idx_chapters_volume ON chapters(volume_id);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_chapter ON issues(chapter_id);

-- 复合索引
CREATE INDEX idx_entity_mentions_lookup
  ON entity_mentions(entity_type, entity_id, attribute);

-- 全文搜索索引 (FTS5)
CREATE VIRTUAL TABLE search_fts USING fts5(
  entity_type, entity_id, title, content
);
```

### 6.2 查询优化

```typescript
// 避免 N+1 查询
// Bad:
const chapters = db.query('SELECT * FROM chapters')
for (const ch of chapters) {
  ch.issues = db.query('SELECT * FROM issues WHERE chapter_id = ?', [ch.id])
}

// Good:
const chapters = db.query('SELECT * FROM chapters')
const chapterIds = chapters.map(c => c.id)
const issues = db.query(
  `SELECT * FROM issues WHERE chapter_id IN (${chapterIds.map(() => '?').join(',')})`,
  chapterIds
)
// 然后在内存中关联
```

### 6.3 连接池（Web Server）

```typescript
// Web Server 场景下的连接管理
class ConnectionPool {
  private pool: Database.Database[] = []
  private maxConnections = 5

  acquire(): Database.Database {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    if (this.activeCount < this.maxConnections) {
      return this.createConnection()
    }
    // 等待可用连接
    return this.waitForConnection()
  }

  release(conn: Database.Database) {
    this.pool.push(conn)
  }
}
```

---

## 七、与其他模块的交互

| 交互模块 | 方向 | 场景 |
|----------|------|------|
| **所有 Repository** | ← | 数据访问 |
| **FileWatcher** | ← | 同步外部修改到 DB |
| **SearchService** | ← | FTS5 和向量查询 |

---

## 八、关键设计决策

### 8.1 为什么用 better-sqlite3

```
选项:
  - sqlite3 (node-sqlite3): 异步，回调风格
  - better-sqlite3: 同步，更快
  - sql.js: 纯 JS，可在浏览器运行

选择: better-sqlite3

理由:
  1. 性能最好（同步 I/O 避免事件循环开销）
  2. 更简单的 API（同步）
  3. 完整的 SQLite 功能支持
  4. 事务处理更直观
```

### 8.2 WAL 模式

```
优点:
  - 读写可并发（多个读者 + 一个写者）
  - 写入性能更好
  - 崩溃恢复更可靠

缺点:
  - 额外文件 (.wal, .shm)
  - 需要定期 checkpoint

选择: 启用 WAL

checkpoint 策略:
  - 自动: WAL 达到 1000 页时
  - 手动: 应用关闭时
```

### 8.3 JSON 字段

```sql
-- SQLite 原生支持 JSON
CREATE TABLE characters (
  ...
  motivations JSON,  -- {"surface": "...", "middle": "...", "core": "..."}
  voice_samples JSON -- ["quote1", "quote2"]
);

-- 查询 JSON 字段
SELECT * FROM characters
WHERE json_extract(motivations, '$.surface') LIKE '%变强%';
```

---

## 九、错误处理

| 错误场景 | 处理 |
|----------|------|
| 数据库锁定 | 等待 busy_timeout，超时后报错 |
| 外键约束失败 | 抛出明确错误，说明关联问题 |
| 迁移失败 | 回滚当前迁移，不执行后续 |
| 磁盘空间不足 | 检测并提前警告 |

---

## 十、备份策略

```typescript
// 在线备份（不阻塞读写）
function backup(destPath: string) {
  // 使用 SQLite 的备份 API
  const backup = db.backup(destPath)

  backup.step(-1)  // 复制所有页

  if (backup.completed) {
    console.log('Backup completed')
  }
}

// 自动备份
// 每天自动备份到 .inxtone/backups/
// 保留最近 7 天
```

---

*Review 重点: WAL配置、迁移系统、Repository模式、批量操作优化*
