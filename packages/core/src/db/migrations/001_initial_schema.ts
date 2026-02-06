/**
 * Migration 001: Initial Schema
 *
 * Creates all core tables for Inxtone:
 * - project: Project information
 * - characters: Character definitions
 * - relationships: Character relationships
 * - world: World rules and settings
 * - locations: Story locations
 * - factions: Factions/organizations
 * - timeline_events: World timeline
 * - arcs: Story arcs (main and sub)
 * - foreshadowing: Planted and resolved foreshadowing
 * - hooks: Chapter/arc hooks
 * - volumes: Book volumes
 * - chapters: Chapter content and metadata
 * - writing_goals: Writing targets
 * - writing_sessions: Writing session tracking
 * - versions: Entity version history
 * - check_results: Quality check results
 * - embeddings: Vector embeddings for search
 * - config: Project configuration
 */

import type { Migration } from '../MigrationRunner.js';

export const migration001: Migration = {
  version: 1,
  description: 'Initial schema with all core tables',
  up: `
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

CREATE INDEX idx_characters_role ON characters(role);
CREATE INDEX idx_characters_name ON characters(name);

-- ============================================
-- 关系 (Relationships)
-- ============================================

CREATE TABLE relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
    target_id TEXT REFERENCES characters(id) ON DELETE CASCADE,

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

CREATE INDEX idx_relationships_source ON relationships(source_id);
CREATE INDEX idx_relationships_target ON relationships(target_id);

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

CREATE INDEX idx_locations_type ON locations(type);

CREATE TABLE factions (
    id TEXT PRIMARY KEY,              -- F001, F002, ...
    name TEXT NOT NULL,
    type TEXT,                        -- sect, clan, organization, ...
    status TEXT,                      -- first_rate, second_rate, ...
    leader_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    stance_to_mc TEXT,                -- friendly, neutral, hostile
    goals JSON,
    resources JSON,
    internal_conflict TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_factions_type ON factions(type);
CREATE INDEX idx_factions_status ON factions(status);

CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_date TEXT,                  -- 故事内时间
    description TEXT,
    related_characters JSON,          -- [character_ids]
    related_locations JSON,           -- [location_ids]

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeline_events_date ON timeline_events(event_date);

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

CREATE INDEX idx_arcs_type ON arcs(type);
CREATE INDEX idx_arcs_status ON arcs(status);

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

CREATE INDEX idx_foreshadowing_status ON foreshadowing(status);
CREATE INDEX idx_foreshadowing_planted ON foreshadowing(planted_chapter);

CREATE TABLE hooks (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('opening', 'arc', 'chapter')),
    chapter_id INTEGER,
    content TEXT,
    hook_type TEXT,                   -- suspense, anticipation, emotion, mystery
    strength INTEGER,                 -- 0-100

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hooks_type ON hooks(type);
CREATE INDEX idx_hooks_chapter ON hooks(chapter_id);

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

CREATE INDEX idx_volumes_status ON volumes(status);

CREATE TABLE chapters (
    id INTEGER PRIMARY KEY,           -- 1, 2, 3, ... (章节号)
    volume_id INTEGER REFERENCES volumes(id) ON DELETE SET NULL,
    arc_id TEXT REFERENCES arcs(id) ON DELETE SET NULL,

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

CREATE INDEX idx_chapters_volume ON chapters(volume_id);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_chapters_arc ON chapters(arc_id);

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
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    volume_id INTEGER REFERENCES volumes(id) ON DELETE CASCADE,

    -- 进度
    current_words INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('active', 'completed', 'missed')),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_goals_date ON writing_goals(date);
CREATE INDEX idx_writing_goals_status ON writing_goals(status);
CREATE INDEX idx_writing_goals_type ON writing_goals(type);

-- ============================================
-- 写作会话 (Writing Sessions)
-- ============================================

CREATE TABLE writing_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    started_at DATETIME NOT NULL,
    ended_at DATETIME,

    chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,

    words_written INTEGER DEFAULT 0,
    duration_minutes INTEGER,

    -- 可选：记录写作习惯
    notes TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_writing_sessions_date ON writing_sessions(started_at);
CREATE INDEX idx_writing_sessions_chapter ON writing_sessions(chapter_id);

-- ============================================
-- 版本历史
-- ============================================

CREATE TABLE versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    entity_type TEXT NOT NULL,        -- chapter, character, world, ...
    entity_id TEXT NOT NULL,

    content JSON NOT NULL,            -- 完整快照

    change_summary TEXT,              -- 变更说明

    source TEXT DEFAULT 'manual',     -- auto, manual, ai_backup, rollback_backup

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_versions_entity ON versions(entity_type, entity_id, created_at DESC);

-- ============================================
-- 检查结果
-- ============================================

CREATE TABLE check_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL,         -- consistency, wayne_principles, pacing, ...

    status TEXT CHECK(status IN ('pass', 'warning', 'error')),

    violations JSON,                  -- [{rule, location, description, severity}, ...]
    passed_rules JSON,                -- [rule_ids]

    suggestions JSON,                 -- 改进建议

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_check_results_chapter ON check_results(chapter_id, created_at DESC);
CREATE INDEX idx_check_results_status ON check_results(status);

-- ============================================
-- 向量嵌入（语义搜索）
-- ============================================
--
-- Embedding chunking strategy:
-- - Long content is split into chunks for better semantic search
-- - chunk_index starts at 0 (first/only chunk)
-- - Sequential chunks: 0, 1, 2, ... for the same entity
-- - UNIQUE constraint ensures no duplicate chunks per entity
-- - To update embeddings: delete all chunks for entity, then re-insert
--

CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    entity_type TEXT NOT NULL,        -- character, chapter, world, ...
    entity_id TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,    -- 分块索引，从0开始（0=第一块或唯一块）

    content TEXT NOT NULL,            -- 原文（该分块的文本内容）
    embedding BLOB NOT NULL,          -- 向量（二进制存储，通常为 float32 数组）

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(entity_type, entity_id, chunk_index)
);

CREATE INDEX idx_embeddings_entity ON embeddings(entity_type, entity_id);

-- ============================================
-- 用户配置（项目级）
-- ============================================

CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 全文搜索（FTS5）
-- ============================================

-- 章节内容全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(
    content,
    title,
    content='chapters',
    content_rowid='id'
);

-- 角色信息全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS characters_fts USING fts5(
    name,
    appearance,
    content='characters',
    content_rowid='rowid'
);

-- FTS 触发器 - 章节
CREATE TRIGGER chapters_ai AFTER INSERT ON chapters BEGIN
    INSERT INTO chapters_fts(rowid, content, title)
    VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER chapters_ad AFTER DELETE ON chapters BEGIN
    INSERT INTO chapters_fts(chapters_fts, rowid, content, title)
    VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER chapters_au AFTER UPDATE ON chapters BEGIN
    INSERT INTO chapters_fts(chapters_fts, rowid, content, title)
    VALUES ('delete', old.id, old.content, old.title);
    INSERT INTO chapters_fts(rowid, content, title)
    VALUES (new.id, new.content, new.title);
END;

-- FTS 触发器 - 角色
CREATE TRIGGER characters_ai AFTER INSERT ON characters BEGIN
    INSERT INTO characters_fts(rowid, name, appearance)
    VALUES (new.rowid, new.name, new.appearance);
END;

CREATE TRIGGER characters_ad AFTER DELETE ON characters BEGIN
    INSERT INTO characters_fts(characters_fts, rowid, name, appearance)
    VALUES ('delete', old.rowid, old.name, old.appearance);
END;

CREATE TRIGGER characters_au AFTER UPDATE ON characters BEGIN
    INSERT INTO characters_fts(characters_fts, rowid, name, appearance)
    VALUES ('delete', old.rowid, old.name, old.appearance);
    INSERT INTO characters_fts(rowid, name, appearance)
    VALUES (new.rowid, new.name, new.appearance);
END;
  `.trim(),

  down: `
-- Drop FTS tables and triggers
DROP TRIGGER IF EXISTS characters_au;
DROP TRIGGER IF EXISTS characters_ad;
DROP TRIGGER IF EXISTS characters_ai;
DROP TRIGGER IF EXISTS chapters_au;
DROP TRIGGER IF EXISTS chapters_ad;
DROP TRIGGER IF EXISTS chapters_ai;
DROP TABLE IF EXISTS characters_fts;
DROP TABLE IF EXISTS chapters_fts;

-- Drop tables in reverse order (respecting foreign keys)
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS embeddings;
DROP TABLE IF EXISTS check_results;
DROP TABLE IF EXISTS versions;
DROP TABLE IF EXISTS writing_sessions;
DROP TABLE IF EXISTS writing_goals;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS volumes;
DROP TABLE IF EXISTS hooks;
DROP TABLE IF EXISTS foreshadowing;
DROP TABLE IF EXISTS arcs;
DROP TABLE IF EXISTS timeline_events;
DROP TABLE IF EXISTS factions;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS world;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS project;
  `.trim(),
};
