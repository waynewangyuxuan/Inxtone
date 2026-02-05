# Schema Migration

> 数据库版本控制与迁移

## Schema 版本控制

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 当前版本
INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema');
```

## 迁移脚本示例

```sql
-- migration_002_add_emotion_to_chapters.sql

-- 检查版本
SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;
-- 如果 < 2，执行迁移

-- 添加字段
ALTER TABLE chapters ADD COLUMN emotion_curve TEXT;
ALTER TABLE chapters ADD COLUMN tension TEXT;

-- 更新版本
INSERT INTO schema_version (version, description)
VALUES (2, 'Add emotion fields to chapters');
```

## 迁移流程

1. 启动时检查 `schema_version`
2. 对比当前代码版本与数据库版本
3. 按顺序执行未应用的迁移脚本
4. 更新 `schema_version` 表

## 迁移规范

- 每个迁移脚本必须是幂等的（可重复执行）
- 迁移脚本按数字顺序命名：`001_initial.sql`, `002_add_field.sql`
- 迁移脚本需包含回滚逻辑（注释中）
- 大型数据迁移需要进度提示
