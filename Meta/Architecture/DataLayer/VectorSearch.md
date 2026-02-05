# Vector Search

> 向量搜索设计

## Embedding 存储

```sql
CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,        -- character, chapter, world, ...
    entity_id TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,    -- 分块索引（长文本分块）
    content TEXT NOT NULL,            -- 原文
    embedding BLOB NOT NULL,          -- 向量（二进制存储）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(entity_type, entity_id, chunk_index)
);

-- 注：实际向量搜索使用 sqlite-vss 扩展
-- CREATE VIRTUAL TABLE vss_embeddings USING vss0(embedding(1536));
```

## Embedding 配置

```yaml
EmbeddingConfig:
  model: text-embedding-3-small     # 或其他 embedding 模型
  dimensions: 1536

  chunking:
    max_chunk_size: 500             # 字符
    overlap: 50                     # 重叠字符

  index_entities:
    - characters: [name, appearance, motivation, facets]
    - chapters: [content, outline]
    - world: [power_system, social_rules]
    - locations: [name, atmosphere, details]
    - foreshadowing: [content, planted_text]
```

## 搜索流程

```
用户查询: "林青云和谁有仇？"
         ↓
    Query Embedding
         ↓
    向量相似度搜索 (sqlite-vss)
         ↓
    返回相关 chunks:
      - characters/C001: "与王家有杀父之仇..."
      - relationships/R003: "林青云 → 王天霸: enemy"
      - chapters/42: "林青云见到王天霸，眼中闪过杀意..."
         ↓
    组装 Context → AI 生成回答
```
