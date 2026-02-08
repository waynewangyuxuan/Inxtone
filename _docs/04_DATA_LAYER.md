# 04 数据层设计

> SQLite = Source of Truth，Markdown = 导出格式

**Status**: 🚧 进行中

---

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                        SQLite                                │
│                   (Source of Truth)                          │
├─────────────────────────────────────────────────────────────┤
│  · 内容数据：角色、世界观、剧情、章节                         │
│  · 元数据：检查结果、版本历史、配置                           │
│  · 索引数据：向量嵌入、全文搜索                               │
└─────────────────────────────────────────────────────────────┘
                    ↑                    ↓
               导入（可选）            导出
                    ↑                    ↓
┌─────────────────────────────────────────────────────────────┐
│                       Markdown                               │
│                    (导出/分享格式)                            │
├─────────────────────────────────────────────────────────────┤
│  · 人类可读                                                  │
│  · 分享给他人                                                │
│  · 用其他工具打开（VS Code, Obsidian...）                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 一、项目文件结构

```
my-novel/
├── inxtone.db                 # SQLite 数据库（Source of Truth）
├── inxtone.yaml               # 项目配置（覆盖用户/默认配置）
│
├── exports/                   # 导出目录（Markdown）
│   ├── story-bible/
│   │   ├── characters/
│   │   ├── world/
│   │   ├── plot/
│   │   └── ...
│   └── draft/
│       ├── vol_01/
│       │   ├── ch_001.md
│       │   └── ...
│       └── ...
│
└── assets/                    # 附件（图片、参考资料）
    └── ...
```

**用户全局配置**：
```
~/.inxtone/
├── config.yaml               # 全局配置
├── templates/                # 项目模板
│   ├── default/
│   └── custom/
└── inxtone.db                # 全局数据（用户配置、预设等）
```

---

## 二、SQLite Schema

### 2.1 核心表结构

```sql
-- ============================================
-- 项目信息
-- ============================================

CREATE TABLE project (
    id TEXT PRIMARY KEY DEFAULT 'main',
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 项目配置（JSON）
    config JSON
);

-- ============================================
-- 角色 (Characters)
-- ============================================

CREATE TABLE characters (
    id TEXT PRIMARY KEY,              -- C001, C002, ...
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('main', 'supporting', 'antagonist', 'mentioned')),

    -- 外在
    appearance TEXT,
    voice_samples JSON,               -- ["样本1", "样本2", ...]

    -- 内核
    motivation JSON,                  -- {surface, hidden, core}
    conflict_type TEXT,               -- desire_vs_morality, etc.
    template TEXT,                    -- avenger, guardian, etc.
    facets JSON,                      -- {public, private, hidden, under_pressure}

    -- 弧光
    arc JSON,                         -- {type, start_state, end_state, phases}

    -- 元数据
    first_appearance TEXT,            -- chapter_id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 关系 (Relationships)
-- ============================================

CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT REFERENCES characters(id),
    target_id TEXT REFERENCES characters(id),

    type TEXT CHECK(type IN ('companion', 'rival', 'enemy', 'mentor', 'confidant', 'lover')),

    -- R1 检查字段
    join_reason TEXT,
    independent_goal TEXT,
    disagree_scenarios JSON,          -- ["场景1", "场景2", ...]
    leave_scenarios JSON,
    mc_needs TEXT,

    -- 发展
    evolution TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(source_id, target_id)
);

-- ============================================
-- 世界观 (World)
-- ============================================

CREATE TABLE world (
    id TEXT PRIMARY KEY DEFAULT 'main',

    -- 力量体系
    power_system JSON,                -- {name, levels, core_rules, constraints}

    -- 社会规则
    social_rules JSON,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id TEXT PRIMARY KEY,              -- L001, L002, ...
    name TEXT NOT NULL,
    type TEXT,                        -- sect, city, secret_realm, ...
    significance TEXT,
    atmosphere TEXT,
    details JSON,                     -- 额外细节

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE factions (
    id TEXT PRIMARY KEY,              -- F001, F002, ...
    name TEXT NOT NULL,
    type TEXT,                        -- sect, clan, organization, ...
    status TEXT,                      -- first_rate, second_rate, ...
    leader_id TEXT REFERENCES characters(id),
    stance_to_mc TEXT,                -- friendly, neutral, hostile
    goals JSON,
    resources JSON,
    internal_conflict TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_date TEXT,                  -- 故事内时间
    description TEXT,
    related_characters JSON,          -- [character_ids]
    related_locations JSON,           -- [location_ids]

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 剧情 (Plot)
-- ============================================

CREATE TABLE arcs (
    id TEXT PRIMARY KEY,              -- ARC001, ARC002, ...
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('main', 'sub')),

    chapter_start INTEGER,
    chapter_end INTEGER,

    status TEXT CHECK(status IN ('planned', 'in_progress', 'complete')),
    progress INTEGER DEFAULT 0,       -- 0-100

    -- 结构
    sections JSON,                    -- [{name, chapters, type, status}, ...]

    -- 与角色弧光对应
    character_arcs JSON,              -- {character_id: phase, ...}

    -- 支线专属
    main_arc_relation TEXT,           -- 与主线的关系（支线用）

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE foreshadowing (
    id TEXT PRIMARY KEY,              -- FS001, FS002, ...
    content TEXT NOT NULL,

    planted_chapter INTEGER,
    planted_text TEXT,                -- 原文

    hints JSON,                       -- [{chapter, text}, ...]

    planned_payoff INTEGER,           -- 计划回收章节
    resolved_chapter INTEGER,         -- 实际回收章节

    status TEXT CHECK(status IN ('active', 'resolved', 'abandoned')),
    term TEXT CHECK(term IN ('short', 'mid', 'long')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hooks (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('opening', 'arc', 'chapter')),
    chapter_id INTEGER,
    content TEXT,
    hook_type TEXT,                   -- suspense, anticipation, emotion, mystery
    strength INTEGER,                 -- 0-100

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 大纲与章节 (Outline & Chapters)
-- ============================================

CREATE TABLE volumes (
    id INTEGER PRIMARY KEY,           -- 1, 2, 3, ...
    name TEXT,
    theme TEXT,
    core_conflict TEXT,
    mc_growth TEXT,                   -- 主角成长

    chapter_start INTEGER,
    chapter_end INTEGER,

    status TEXT CHECK(status IN ('planned', 'in_progress', 'complete')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapters (
    id INTEGER PRIMARY KEY,           -- 1, 2, 3, ... (章节号)
    volume_id INTEGER REFERENCES volumes(id),
    arc_id TEXT REFERENCES arcs(id),

    title TEXT,

    status TEXT CHECK(status IN ('outline', 'draft', 'revision', 'done')),

    -- 大纲
    outline JSON,                     -- {goal, scenes, hook_ending}

    -- 内容
    content TEXT,                     -- 正文（Markdown）
    word_count INTEGER DEFAULT 0,

    -- 出场
    characters JSON,                  -- [character_ids]
    locations JSON,                   -- [location_ids]

    -- 伏笔操作
    foreshadowing_planted JSON,       -- [foreshadowing_ids]
    foreshadowing_hinted JSON,
    foreshadowing_resolved JSON,

    -- 情绪
    emotion_curve TEXT,               -- low_to_high, high_to_low, stable, ...
    tension TEXT,                     -- low, medium, high

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 写作目标 (Writing Goals)
-- ============================================

CREATE TABLE writing_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    type TEXT CHECK(type IN ('daily', 'chapter', 'volume', 'total')),
    target_words INTEGER NOT NULL,

    -- 时间范围（daily 用）
    date DATE,                        -- 某一天的目标

    -- 实体关联（chapter/volume 用）
    chapter_id INTEGER REFERENCES chapters(id),
    volume_id INTEGER REFERENCES volumes(id),

    -- 进度
    current_words INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('active', 'completed', 'missed')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_goals_date ON writing_goals(date);
CREATE INDEX idx_writing_goals_status ON writing_goals(status);

-- ============================================
-- 写作会话 (Writing Sessions)
-- ============================================

CREATE TABLE writing_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    started_at DATETIME NOT NULL,
    ended_at DATETIME,

    chapter_id INTEGER REFERENCES chapters(id),

    words_written INTEGER DEFAULT 0,
    duration_minutes INTEGER,

    -- 可选：记录写作习惯
    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_sessions_date ON writing_sessions(started_at);

-- ============================================
-- 版本历史
-- ============================================

CREATE TABLE versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    entity_type TEXT NOT NULL,        -- chapter, character, world, ...
    entity_id TEXT NOT NULL,

    content JSON NOT NULL,            -- 完整快照

    change_summary TEXT,              -- 变更说明

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引加速版本查询
CREATE INDEX idx_versions_entity ON versions(entity_type, entity_id, created_at DESC);

-- ============================================
-- 检查结果
-- ============================================

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

-- ============================================
-- 向量嵌入（语义搜索）
-- ============================================

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

-- ============================================
-- 用户配置（项目级）
-- ============================================

CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 关系图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  characters │────<│relationships│>────│  characters │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ appears_in
       ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  chapters   │────<│   volumes   │     │    arcs     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ has               │                   │
       ↓                   ↓                   ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│check_results│     │writing_goals│     │foreshadowing│
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │
       ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│writing_sess.│     │    hooks    │     │   world     │
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  locations  │     │  factions   │     │timeline_evts│
└─────────────┘     └─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  versions   │     │ embeddings  │     │   config    │
└─────────────┘     └─────────────┘     └─────────────┘
  (所有实体)          (语义搜索)         (项目配置)
```

---

## 三、版本历史

### 3.1 版本记录策略

```yaml
VersionStrategy:
  # 自动保存版本的时机
  auto_save:
    - on_chapter_complete     # 章节状态变为 done
    - on_major_edit           # 大幅修改（变更 > 30%）
    - on_manual_save          # 用户手动保存版本

  # 不自动保存的情况
  skip:
    - minor_typo_fix          # 小修改
    - auto_save_draft         # 自动保存的草稿

> **注意**: M3 已改为 manual save，auto_save 版本类型不再使用。详见 M3.md。

  # 版本保留策略
  retention:
    keep_all: false           # 不保留所有版本
    keep_last_n: 50           # 保留最近 50 个版本
    keep_milestones: true     # 保留里程碑版本（章节完成、卷完成）
```

### 3.2 版本操作

```sql
-- 创建新版本
INSERT INTO versions (entity_type, entity_id, content, change_summary)
VALUES ('chapter', '42', '{"content": "...", "title": "..."}', '完成初稿');

-- 查看某章节的版本历史
SELECT * FROM versions
WHERE entity_type = 'chapter' AND entity_id = '42'
ORDER BY created_at DESC;

-- 回滚到特定版本
-- 1. 读取版本内容
-- 2. 更新当前实体
-- 3. 创建新版本记录（标记为"回滚"）
```

---

## 四、检查结果存储

### 4.1 检查结果结构

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
  ],
  "suggestions": [
    "第45行的对话需要调整语气"
  ]
}
```

### 4.2 检查历史查询

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

---

## 五、向量搜索

### 5.1 Embedding 存储

```yaml
EmbeddingConfig:
  model: text-embedding-3-small     # 或其他 embedding 模型
  dimensions: 1536

  # 分块策略
  chunking:
    max_chunk_size: 500             # 字符
    overlap: 50                     # 重叠字符

  # 索引内容
  index_entities:
    - characters: [name, appearance, motivation, facets]
    - chapters: [content, outline]
    - world: [power_system, social_rules]
    - locations: [name, atmosphere, details]
    - foreshadowing: [content, planted_text]
```

### 5.2 搜索流程

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

---

## 六、项目模板

### 6.1 模板结构

```yaml
# ~/.inxtone/templates/xiuxian/template.yaml

Template:
  id: xiuxian
  name: 修仙小说模板
  description: 预设修仙世界观、力量体系、常见角色关系

  # 预设数据
  presets:
    # 力量体系
    world:
      power_system:
        name: 修仙体系
        levels:
          - {name: 练气, sub_levels: [初期, 中期, 后期], lifespan: 150}
          - {name: 筑基, sub_levels: [初期, 中期, 后期], lifespan: 300}
          - {name: 金丹, sub_levels: [初期, 中期, 后期], lifespan: 500}
          - {name: 元婴, sub_levels: [初期, 中期, 后期], lifespan: 1000}
          - {name: 化神, sub_levels: [初期, 中期, 后期], lifespan: 2000}
        constraints:
          - "越级战斗最多一个小境界"
          - "突破需要机缘/资源"

    # 预设势力类型
    faction_types:
      - {type: sect, statuses: [一流宗门, 二流宗门, 三流宗门]}
      - {type: clan, statuses: [大家族, 中等家族, 小家族]}
      - {type: organization, statuses: [顶级势力, 普通势力]}

    # 预设关系类型
    relationship_presets:
      - {name: 师徒, type: mentor, template: "师父传授功法，徒弟..."}
      - {name: 同门, type: companion, template: "同一宗门修炼..."}
      - {name: 道侣, type: lover, template: "双修伴侣..."}
      - {name: 仇敌, type: enemy, template: "有血海深仇..."}

    # 预设角色模板
    character_presets:
      - name: 主角模板
        role: main
        conflict_type: ideal_vs_reality
        template: seeker
        arc: {type: positive}

      - name: 师父模板
        role: supporting
        template: guardian
        arc: {type: flat}

  # 预设配置
  config:
    rules:
      # 修仙小说特有规则
      custom_rules:
        world:
          cultivation_logic:
            description: 修炼逻辑是否自洽
            severity: high
```

### 6.2 从模板创建项目

```
TUI 流程:
┌─────────────────────────────────────────────────────────────┐
│  📁 新建项目                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  选择模板:                                                   │
│    ○ 空白项目                                               │
│    ● 修仙小说模板                                           │
│    ○ 都市小说模板                                           │
│    ○ 从现有项目复制                                         │
│                                                             │
│  项目名称: [我的修仙小说_____________]                       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  模板预览:                                                   │
│    ✓ 预设力量体系（练气→筑基→金丹→元婴→化神）              │
│    ✓ 预设势力类型（宗门、家族、组织）                       │
│    ✓ 预设关系类型（师徒、同门、道侣、仇敌）                 │
│    ✓ 修仙特有检查规则                                       │
│                                                             │
│                              [创建项目]  [取消]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 七、导入/导出

### 7.1 导出为 Markdown

```yaml
ExportConfig:
  format: markdown

  structure:
    story-bible:
      characters:
        template: |
          # {{id}} {{name}}

          ## 基础信息
          - **定位**: {{role}}
          - **外貌**: {{appearance}}

          ## 内核
          ### 动机
          - 表层: {{motivation.surface}}
          - 深层: {{motivation.hidden}}
          - 核心: {{motivation.core}}

          ...

      world:
        - power_system.md
        - locations/
        - factions/

      plot:
        - main_arc.md
        - subplots.md
        - foreshadowing.md

    draft:
      - vol_{{volume.id}}/
        - ch_{{chapter.id | pad: 3}}.md

  options:
    include_metadata: false      # 不导出元数据
    include_check_results: false # 不导出检查结果
```

### 7.2 导入 Markdown（可选功能）

```yaml
ImportConfig:
  # 解析 Markdown 结构
  parse_rules:
    character:
      pattern: "# (C\\d+) (.+)"
      fields:
        id: $1
        name: $2

    chapter:
      pattern: "vol_(\\d+)/ch_(\\d+)\\.md"
      fields:
        volume_id: $1
        id: $2

  # 冲突处理
  on_conflict:
    strategy: ask_user         # ask_user | overwrite | skip | merge
```

---

## 八、数据迁移

### 8.1 Schema 版本控制

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- 当前版本
INSERT INTO schema_version (version, description) VALUES (1, 'Initial schema');
```

### 8.2 迁移脚本示例

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

---

## 九、性能考虑

### 9.1 索引策略

```sql
-- 常用查询的索引
CREATE INDEX idx_chapters_volume ON chapters(volume_id);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_characters_role ON characters(role);
CREATE INDEX idx_foreshadowing_status ON foreshadowing(status);
CREATE INDEX idx_check_results_status ON check_results(status);
```

### 9.2 查询优化

```yaml
QueryOptimization:
  # 章节列表：只查必要字段
  chapter_list: "SELECT id, title, status, word_count FROM chapters"

  # 角色列表：不查大文本
  character_list: "SELECT id, name, role FROM characters"

  # 全文搜索：使用 FTS5
  full_text_search: "CREATE VIRTUAL TABLE chapters_fts USING fts5(content)"
```

---

## 十、待讨论

- [ ] 向量搜索具体实现（sqlite-vss vs 其他方案）
- [ ] 大文件处理（超长章节的分块存储）
- [ ] 备份策略（自动备份间隔）
- [ ] 多设备同步（未来功能）

---

*最后更新：2026-02-05*
*Status: 🚧 进行中*
