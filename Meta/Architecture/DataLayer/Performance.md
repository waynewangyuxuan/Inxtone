# Performance

> 索引与查询优化

## 索引策略

```sql
-- 常用查询的索引
CREATE INDEX idx_chapters_volume ON chapters(volume_id);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_characters_role ON characters(role);
CREATE INDEX idx_foreshadowing_status ON foreshadowing(status);
CREATE INDEX idx_check_results_status ON check_results(status);
```

## 查询优化

```yaml
QueryOptimization:
  # 章节列表：只查必要字段
  chapter_list: "SELECT id, title, status, word_count FROM chapters"

  # 角色列表：不查大文本
  character_list: "SELECT id, name, role FROM characters"

  # 全文搜索：使用 FTS5
  full_text_search: "CREATE VIRTUAL TABLE chapters_fts USING fts5(content)"
```

## 性能原则

| 原则 | 说明 |
|------|------|
| 按需加载 | 列表只查 ID+名称，详情再查全部 |
| 延迟加载 | 大文本字段（content）按需获取 |
| 批量操作 | 批量检查、批量导出使用事务 |
| 缓存策略 | 常用数据（角色列表）内存缓存 |

---

## 待讨论

- [ ] 向量搜索具体实现（sqlite-vss vs 其他方案）
- [ ] 大文件处理（超长章节的分块存储）
- [ ] 备份策略（自动备份间隔）
- [ ] 多设备同步（未来功能）
