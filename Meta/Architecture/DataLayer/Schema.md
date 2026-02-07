# SQLite Schema

> 核心表结构定义

## 项目信息

```sql
CREATE TABLE project (
    id TEXT PRIMARY KEY DEFAULT 'main',
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    config JSON
);
```

## 角色 (Characters)

```sql
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
```

## 关系 (Relationships)

```sql
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
```

## 世界观 (World)

```sql
CREATE TABLE world (
    id TEXT PRIMARY KEY DEFAULT 'main',
    power_system JSON,                -- {name, levels, core_rules, constraints}
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
    details JSON,
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
```

## 剧情 (Plot)

```sql
CREATE TABLE arcs (
    id TEXT PRIMARY KEY,              -- ARC001, ARC002, ...
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('main', 'sub')),
    chapter_start INTEGER,
    chapter_end INTEGER,
    status TEXT CHECK(status IN ('planned', 'in_progress', 'complete')),
    progress INTEGER DEFAULT 0,       -- 0-100
    sections JSON,                    -- [{name, chapters, type, status}, ...]
    character_arcs JSON,              -- {character_id: phase, ...}
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
```

## 大纲与章节 (Outline & Chapters)

```sql
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
```

## 写作相关

```sql
CREATE TABLE writing_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('daily', 'chapter', 'volume', 'total')),
    target_words INTEGER NOT NULL,
    date DATE,                        -- 某一天的目标
    chapter_id INTEGER REFERENCES chapters(id),
    volume_id INTEGER REFERENCES volumes(id),
    current_words INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('active', 'completed', 'missed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_goals_date ON writing_goals(date);
CREATE INDEX idx_writing_goals_status ON writing_goals(status);

CREATE TABLE writing_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    chapter_id INTEGER REFERENCES chapters(id),
    words_written INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_sessions_date ON writing_sessions(started_at);
```
