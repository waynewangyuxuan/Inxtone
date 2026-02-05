# Versioning & Check Results

> 版本历史与检查结果存储

## 版本历史表

```sql
CREATE TABLE versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,        -- chapter, character, world, ...
    entity_id TEXT NOT NULL,
    content JSON NOT NULL,            -- 完整快照
    change_summary TEXT,              -- 变更说明
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_versions_entity ON versions(entity_type, entity_id, created_at DESC);
```

## 版本记录策略

```yaml
VersionStrategy:
  auto_save:
    - on_chapter_complete     # 章节状态变为 done
    - on_major_edit           # 大幅修改（变更 > 30%）
    - on_manual_save          # 用户手动保存版本

  skip:
    - minor_typo_fix          # 小修改
    - auto_save_draft         # 自动保存的草稿

  retention:
    keep_all: false           # 不保留所有版本
    keep_last_n: 50           # 保留最近 50 个版本
    keep_milestones: true     # 保留里程碑版本
```

## 版本操作

```sql
-- 创建新版本
INSERT INTO versions (entity_type, entity_id, content, change_summary)
VALUES ('chapter', '42', '{"content": "...", "title": "..."}', '完成初稿');

-- 查看某章节的版本历史
SELECT * FROM versions
WHERE entity_type = 'chapter' AND entity_id = '42'
ORDER BY created_at DESC;

-- 回滚流程: 读取版本 → 更新实体 → 创建新版本（标记为"回滚"）
```

---

## 检查结果表

```sql
CREATE TABLE check_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER REFERENCES chapters(id),
    check_type TEXT NOT NULL,         -- consistency, wayne_principles, pacing, ...
    status TEXT CHECK(status IN ('pass', 'warning', 'error')),
    violations JSON,                  -- [{rule, location, description, severity}, ...]
    passed_rules JSON,                -- [rule_ids]
    suggestions JSON,                 -- 改进建议
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_check_results_chapter ON check_results(chapter_id, created_at DESC);
```

## 检查结果结构

```json
{
  "chapter_id": 42,
  "check_type": "consistency",
  "status": "warning",
  "violations": [
    {
      "rule": "character.voice_match",
      "location": {"line": 45, "text": "林青云温柔地说..."},
      "description": "林青云的语言风格与设定不符（设定为冷峻）",
      "severity": "high",
      "suggestion": "改为更冷峻的表达方式"
    }
  ],
  "passed_rules": [
    "character.behavior_match",
    "character.power_match",
    "world.rule_violation"
  ]
}
```

## 检查历史查询

```sql
-- 查看某章节的检查历史
SELECT * FROM check_results
WHERE chapter_id = 42
ORDER BY created_at DESC;

-- 查看所有有 warning/error 的章节
SELECT DISTINCT chapter_id FROM check_results
WHERE status IN ('warning', 'error')
ORDER BY chapter_id;

-- 查看某条规则的违规统计
SELECT chapter_id, COUNT(*) as violation_count
FROM check_results, json_each(violations)
WHERE json_extract(value, '$.rule') = 'character.voice_match'
GROUP BY chapter_id;
```
