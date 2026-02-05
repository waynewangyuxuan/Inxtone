# 02 业务逻辑层设计

> Business Logic = Methodology，用数据描述，与 Computer Logic 分离

**Status**: 🚧 进行中

---

## 核心原则

```
┌─────────────────────────────────────────────────────────┐
│  Business Logic (What) — 用 Data 描述                   │
│  ─────────────────────────────────────────────────────  │
│  · Schemas — 数据结构定义                               │
│  · Rules — 检查规则、约束条件                           │
│  · Templates — AI Prompts、文档模板                     │
│  · Workflows — 状态机、流程定义                         │
├─────────────────────────────────────────────────────────┤
│  Computer Logic (How) — 代码实现                        │
│  ─────────────────────────────────────────────────────  │
│  · 存储、索引、查询                                     │
│  · API 调用、网络通信                                   │
│  · 文件读写、格式转换                                   │
│  · UI 渲染、用户交互                                    │
└─────────────────────────────────────────────────────────┘
```

**Data Driven 的好处**：
1. 修改业务逻辑只需改配置，不改代码
2. 社区可贡献新规则、新模板
3. 用户可自定义
4. 易于测试和理解

---

## 核心设计原则：Inxtone = 框架 + 默认配置

```
┌─────────────────────────────────────────────────────────────┐
│  Inxtone 提供的是【框架】，不是【固定方法论】                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  默认配置（我们提供）        用户配置（可自定义）            │
│  ────────────────────        ────────────────────           │
│  · Wayne 原则 R1-R4          · 启用/禁用任意规则            │
│  · B20 评分标准              · 修改阈值/参数                │
│  · 26 项一致性检查           · 添加自定义规则               │
│  · AI Prompt 模板            · 创建自定义模板               │
│  · Six-Phase 工作流          · 自定义工作流                 │
│                                                             │
│  ↓                           ↓                              │
│  开箱即用                    满足个性化需求                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**用户可配置的层级**：

| 层级 | 描述 | 示例 |
|------|------|------|
| **禁用/启用** | 开关单条规则 | 禁用 R4 神话模型检查 |
| **修改参数** | 调整阈值、严重程度 | 把 repetition 阈值从 3 改为 5 |
| **扩展规则** | 在现有类别下添加新规则 | 在 character 下加 "禁止人设矛盾" |
| **新增类别** | 创建全新的规则类别 | 添加 "商业化检查" 类别 |
| **规则集** | 保存/切换整套配置 | "严格模式" vs "宽松模式" |

**配置文件结构**（预期）：

```
~/.inxtone/
├── config.yaml              # 全局配置
├── rules/
│   ├── default.yaml         # 默认规则（我们提供，只读参考）
│   └── custom.yaml          # 用户自定义规则（覆盖/扩展）
├── templates/
│   ├── default/             # 默认模板
│   └── custom/              # 用户自定义模板
└── presets/
    ├── strict.yaml          # 预设：严格模式
    └── relaxed.yaml         # 预设：宽松模式
```

---

## 一、Business Logic 来源

从 METHODOLOGDY 提取：

| 来源 | 内容 | 转化为 |
|------|------|--------|
| `02_characters_guide.md` | 人物卡结构、B20检查清单、关系类型 | Character Schema, Rules |
| `01_world_guide.md` | 世界观结构、力量体系模板 | World Schema |
| `03_plot_guide.md` | 剧情结构、伏笔管理 | Plot Schema, State Machine |
| `04_outline_guide.md` | 大纲结构、节奏标准 | Outline Schema, Rules |
| `05_draft_guide.md` | 章节结构、写作检查点 | Chapter Schema, Rules |
| `00_meta_guide.md` | Wayne 原则、红线定义 | Consistency Rules |
| `AI_PROMPTS.md` | 40+ AI 提示词模板 | Prompt Templates |

---

## 二、Schemas（数据结构）

### 2.1 Character Schema

```yaml
# 来源: 02_characters_guide.md

Character:
  # 基础信息
  id: string           # C001, C002, ...
  name: string
  role: enum [main, supporting, antagonist, mentioned]

  # 外在
  appearance: text     # 外貌描述
  voice_samples: text[] # 语言风格样本

  # 内核 (来自 B20 2.1-2.2)
  motivation:
    surface: text      # 表层动机 - 开篇揭示
    hidden: text       # 深层动机 - 中期揭示
    core: text         # 核心动机 - 高潮揭示

  conflict_type: enum  # 五大内在矛盾
    - desire_vs_morality    # 欲望 vs 道德
    - ideal_vs_reality      # 理想 vs 现实
    - self_vs_society       # 自我 vs 社会
    - love_vs_duty          # 爱 vs 责任
    - survival_vs_dignity   # 生存 vs 尊严

  template: enum       # 八大人物模板
    - avenger          # 复仇者
    - guardian         # 守护者
    - seeker           # 追寻者
    - rebel            # 反叛者
    - redeemer         # 救赎者
    - observer         # 旁观者
    - martyr           # 牺牲者
    - fallen           # 堕落者

  # 多面性 (来自 B20 2.3)
  facets:
    public: text       # 公开面
    private: text      # 私密面
    hidden: text       # 隐藏面
    under_pressure: text # 压力下

  # 弧光
  arc:
    type: enum [positive, negative, flat]
    start_state: text
    end_state: text
    phases: Phase[]

  # 关系 (来自 B20 第四部分)
  relationships: Relationship[]

  # 元数据
  first_appearance: chapter_id
  chapters: chapter_id[]
```

### 2.2 Relationship Schema

```yaml
# 来源: 02_characters_guide.md 3.1-3.3

Relationship:
  source: character_id
  target: character_id

  type: enum
    - companion        # 同行者
    - rival            # 对手
    - enemy            # 敌人
    - mentor           # 导师
    - confidant        # 知己
    - lover            # 爱人

  # R1 检查: 非依附关系 (来自 Wayne 原则)
  join_reason: text           # 加入原因（非"被折服"）
  independent_goal: text      # 独立于主角的目标
  disagree_scenarios: text[]  # 会反对主角的情况
  leave_scenarios: text[]     # 可能离开的情况
  mc_needs: text              # 主角需要配角的什么

  # 发展轨迹
  evolution: text             # 初期 → 中期 → 后期
```

### 2.3 World Schema

```yaml
# 来源: 01_world_guide.md

World:
  # 力量体系
  power_system:
    name: string
    levels: Level[]           # 等级列表
    core_rules: Rule[]        # 核心规则
    constraints: Constraint[] # AI 必须遵守的约束

  # 社会规则
  social_rules: Rule[]

  # 地点
  locations: Location[]

  # 势力
  factions: Faction[]

  # 时间线
  timeline: Event[]

Level:
  name: string
  sub_levels: string[]        # 初期/中期/后期
  lifespan: number?           # 寿命（年）
  abilities: string[]         # 解锁能力

Location:
  id: string
  name: string
  type: enum [sect, city, secret_realm, village, building, ...]
  significance: text
  atmosphere: text
  chapters: chapter_id[]

Faction:
  id: string
  name: string
  type: enum [sect, clan, organization, ...]
  status: enum [first_rate, second_rate, third_rate, ...]
  leader: character_id
  stance_to_mc: enum [friendly, neutral, hostile]
  goals: text[]
  resources: text[]
  internal_conflict: text
```

### 2.4 Plot Schema

```yaml
# 来源: 03_plot_guide.md

Plot:
  main_arc: Arc
  sub_arcs: Arc[]
  foreshadowing: Foreshadowing[]
  hooks: Hook[]

Arc:
  id: string
  name: string
  chapters: range            # e.g., 1-45
  status: enum [planned, in_progress, complete]
  progress: number           # 0-100

  sections: Section[]

  # 与角色弧光的对应
  character_arcs: {character_id: phase}[]

Section:
  name: string
  chapters: range
  type: enum [setup, rising, conflict, climax, resolution]
  status: enum [planned, in_progress, complete]

Foreshadowing:
  id: string                 # FS001, FS002, ...
  content: text              # 伏笔内容
  planted_chapter: chapter_id
  planted_text: text         # 原文
  hints: {chapter: chapter_id, text: text}[]
  planned_payoff: chapter_id?
  resolved_chapter: chapter_id?
  status: enum [active, resolved]
  term: enum [short, mid, long]  # 5-20章 / 20-100章 / 100章+

Hook:
  id: string
  type: enum [opening, arc, chapter]
  chapter: chapter_id
  content: text
  hook_type: enum [suspense, anticipation, emotion, mystery]
  strength: number           # 0-100
```

### 2.5 Chapter Schema

```yaml
# 来源: 05_draft_guide.md

Chapter:
  id: string                 # ch_001, ch_002, ...
  number: number
  title: string
  arc: arc_id
  section: section_id

  status: enum [outline, draft, revision, done]

  # 内容
  content: text              # Markdown
  word_count: number

  # 大纲 (来自 04_outline)
  outline:
    goal: text               # 本章目标
    scenes: Scene[]
    hook_ending: text        # 章末钩子

  # 出场
  characters: character_id[]
  locations: location_id[]

  # 伏笔操作
  foreshadowing_planted: foreshadowing_id[]
  foreshadowing_hinted: foreshadowing_id[]
  foreshadowing_resolved: foreshadowing_id[]

  # 版本
  versions: Version[]

  # 检查结果
  consistency_check: CheckResult?

Scene:
  description: text
  characters: character_id[]
  location: location_id?
  tension: enum [low, medium, high]
```

---

## 三、Rules（规则）

### 3.1 Wayne Principles（红线）

```yaml
# 来源: 00_meta_guide.md

WaynePrinciples:
  red_lines:                 # 绝对红线
    - id: R1
      name: no_dog_relationship
      description: 禁止"养狗式"人物关系
      check_type: relationship
      check_logic: |
        relationship.join_reason != "被魅力折服"
        AND relationship.independent_goal IS NOT NULL
        AND relationship.disagree_scenarios.length > 0
        AND relationship.leave_scenarios.length > 0

    - id: R2
      name: no_tool_character
      description: 禁止角色工具化/符号化
      check_type: character
      check_logic: |
        character.facets.count >= 2
        AND character.motivation.hidden IS NOT NULL
        AND NOT single_label_describable(character)

    - id: R3
      name: no_cheap_death
      description: 禁止草菅人命
      check_type: death_event
      check_logic: |
        death.has_meaning == true
        AND death.has_aftermath == true
        AND death.has_foreshadowing == true (if important)

    - id: R4
      name: no_myth_model
      description: 禁止神话模型代替社会模型
      check_type: world
      check_logic: |
        world.social_rules.has_checks_and_balances == true
        AND world.weak_has_value == true
        AND world.strong_has_needs == true

  core_principles:           # 核心原则
    - id: P1
      name: respect_every_character
      description: 尊重每一个角色

    - id: P2
      name: everyone_has_thoughts
      description: 每个人都有自己的想法

    - id: P3
      name: power_not_personality
      description: 力量差距 ≠ 人格不平等

    - id: P4
      name: social_model
      description: 使用社会关系模型
```

### 3.2 B20 Character Checklist

```yaml
# 来源: 02_characters_guide.md 第五部分

B20Checklist:
  character_score:
    dimensions:
      - name: core
        question: 是否有清晰的核心矛盾？
        max_score: 10
      - name: motivation
        question: 三层动机是否完整？
        max_score: 10
      - name: facets
        question: 是否有多个面向？
        max_score: 10
      - name: consistency
        question: 行为是否符合人设？
        max_score: 10
      - name: uniqueness
        question: 是否有独特记忆点？
        max_score: 10
      - name: arc
        question: 是否有成长/变化？
        max_score: 10

    thresholds:
      excellent: 50      # 可作为核心人物
      good: 40           # 需微调
      pass: 30           # 需加强
      fail: 0            # 需重新设计

  relationship_score:
    dimensions:
      - name: tension
        question: 核心人物之间是否有张力？
        max_score: 10
      - name: diversity
        question: 关系类型是否多样？
        max_score: 10
      - name: evolution
        question: 关系是否有发展空间？
        max_score: 10
      - name: non_dependent
        question: 是否避免了"养狗"？
        max_score: 10

    thresholds:
      excellent: 35
      good: 28
      pass: 20
      fail: 0
```

### 3.3 Consistency Rules（完整版）

> **重要**：以下所有规则都是**默认配置**，用户可以：
> - 禁用任意规则
> - 修改参数（阈值、严重程度）
> - 添加自定义规则

```yaml
# 一致性检查规则 - 来源: 方法论各阶段指南
# 用途: 1) 写作后检查  2) AI生成时作为约束
# 性质: 默认配置，用户可自定义覆盖

ConsistencyRules:
  # ============================================
  # 一、人物一致性 (来源: 02_characters_guide, 05_draft_guide)
  # ============================================
  character:
    # 即时检查（每次生成/检查）
    voice_match:
      description: 对话是否符合角色语言风格
      check_against: character.voice_samples
      severity: high
      example_violation: "一个粗犷武夫说出文绉绉的话"

    behavior_match:
      description: 行为是否符合角色性格和动机
      check_against: character.facets, character.motivation
      severity: high
      example_violation: "谨慎型角色突然鲁莽行动无解释"

    power_match:
      description: 能力表现是否符合角色等级
      check_against: character.level, world.power_system
      severity: critical
      example_violation: "凝气期一剑斩了元婴期"

    dialogue_distinction:
      description: 不同角色的对话是否有区分度
      check_against: all_characters_in_scene.voice_samples
      severity: medium
      source: 05_draft_guide 3.1

    # 跨章检查（周期性）
    arc_progression:
      description: 角色弧光是否按计划发展
      check_against: character.arc.phases
      check_interval: every_chapter
      severity: medium

    relationship_evolution:
      description: 人物关系是否有发展/变化
      check_against: character.relationships.evolution
      check_interval: 10_chapters
      severity: medium

  # ============================================
  # 二、世界观一致性 (来源: 01_world_guide, 00_meta_guide)
  # ============================================
  world:
    # 即时检查
    rule_violation:
      description: 是否违反世界规则/力量体系约束
      check_against: world.power_system.constraints
      severity: critical
      example_violation: "不用灵石就能传送"

    location_match:
      description: 地点描述是否前后一致
      check_against: location.atmosphere, location.details
      severity: medium
      example_violation: "青峰山从南方变到北方"

    faction_stance:
      description: 势力态度是否符合设定
      check_against: faction.stance_to_mc, faction.goals
      severity: medium

    timeline_order:
      description: 事件时间顺序是否正确
      check_against: world.timeline
      severity: high

  # ============================================
  # 三、剧情一致性 (来源: 03_plot_guide, 04_outline_guide)
  # ============================================
  plot:
    # 伏笔管理
    foreshadowing_status:
      description: 活跃伏笔是否正确处理
      check_against: foreshadowing[status=active]
      checks:
        - no_forgotten: 长期未提及的伏笔警告
        - no_premature: 未到计划章节的伏笔不应回收
        - hint_natural: 伏笔提示是否自然
      severity: high

    # 支线管理
    subplot_alignment:
      description: 支线是否服务于主线
      check_against: subplot.main_arc_relation
      severity: medium
      source: 03_plot_guide 2.2

    # 弧结构
    arc_structure:
      description: 剧情是否符合弧结构（开篇→上升→中点→下降→高潮→尾声）
      check_against: arc.sections, chapter.position
      severity: low
      source: 03_plot_guide 1.1

    # 主角弧光同步
    mc_arc_sync:
      description: 主线进展是否与主角成长同步
      check_against: main_arc.sections, mc.arc.phases
      check_interval: per_section
      severity: medium
      source: 03_plot_guide 1.2

  # ============================================
  # 四、Wayne原则检查 (来源: 00_meta_guide, 05_draft_guide)
  # ============================================
  wayne_principles:
    # R1: 养狗检查
    no_dog_relationship:
      description: 配角是否有独立性
      checks:
        - has_independent_goal: 配角有独立目标
        - has_disagreement: 配角有反对主角的时刻
        - not_always_agree: 配角不是只会"是是是"
        - has_own_action: 配角有自主行动
      check_against: relationships[type!=enemy]
      check_interval: 10_chapters
      severity: high
      source: 00_meta_guide Wayne原则 R1

    # R2: 符号化检查
    no_tool_character:
      description: 角色是否被工具化/符号化
      checks:
        - multi_facets: 展示了多个面向
        - not_single_label: 不能用单一标签概括
        - has_inner_world: 有内心世界展示
      check_against: characters[role!=mentioned]
      check_interval: 10_chapters
      severity: high
      source: 00_meta_guide Wayne原则 R2

    # R3: 草菅人命检查
    no_cheap_death:
      description: 死亡是否有意义
      trigger: death_event
      checks:
        - has_meaning: 死亡有意义（非纯粹展示反派残忍）
        - has_aftermath: 死亡有余波（情感/剧情/主题）
        - has_foreshadowing: 重要角色死亡有铺垫
        - reversibility_test: "如果是主角，你会这样写吗？"
      severity: critical
      source: 03_plot_guide 四、死亡美学

    # R4: 神话模型检查
    no_myth_model:
      description: 世界是否有社会模型而非神话模型
      checks:
        - strong_has_constraints: 强者也受规则约束
        - weak_has_value: 弱者有存在价值
        - power_not_personality: 力量差距≠人格不平等
      check_against: world, recent_chapters
      check_interval: per_arc
      severity: high
      source: 00_meta_guide Wayne原则 R4

    # P1-P4: 核心原则
    core_principles:
      description: 核心原则是否遵守
      checks:
        - P1_respect: 尊重每一个角色
        - P2_agency: 每个人都有自己的想法
        - P3_equality: 力量差距≠人格不平等
        - P4_social: 使用社会关系模型
      check_interval: 10_chapters
      severity: high

  # ============================================
  # 五、节奏与质量 (来源: 04_outline_guide, 05_draft_guide)
  # ============================================
  pacing:
    # 黄金三章
    golden_chapters:
      description: 前三章是否有足够钩子
      checks:
        - ch1_has_hook: 第一章有钩子
        - ch3_conflict_clear: 前三章冲突明确
        - ch3_mc_goal_clear: 前三章主角目标明确
      check_against: chapters[1-3]
      severity: critical
      source: 04_outline_guide 2.2

    # 情绪曲线
    emotion_curve:
      description: 情绪是否有张有弛
      checks:
        - not_all_high: 不能连续N章都是高潮
        - not_all_low: 不能连续N章都是铺垫
        - has_variation: 有情绪起伏
      check_interval: 10_chapters
      threshold: max_continuous_same_tone: 3
      severity: medium
      source: 04_outline_guide 4.1

    # 章节钩子
    chapter_hooks:
      description: 章末是否有钩子
      check_against: chapter.hook_ending
      severity: medium

  # ============================================
  # 六、文本质量 (来源: 05_draft_guide)
  # ============================================
  text_quality:
    repetition:
      description: 是否有过多重复用词
      threshold: 3  # 同一词在 500 字内出现超过 3 次
      severity: low

    writing_traps:
      description: 是否落入常见写作陷阱
      checks:
        - sidekick_only_when_needed: 配角不只在主角需要时出现
        - dialogue_variety: 配角不只会"是""好"
        - not_mechanical_upgrade: 不是机械打怪升级
        - not_face_slap_spam: 不是连续打脸无节奏
        - no_info_dump: 没有大段设定说明
      severity: medium
      source: 05_draft_guide 4.2

# ============================================
# 检查时机配置
# ============================================
CheckSchedule:
  # 实时检查（每次AI生成/用户写作时）
  realtime:
    - character.voice_match
    - character.behavior_match
    - character.power_match
    - character.dialogue_distinction
    - world.rule_violation
    - world.location_match
    - text_quality.repetition

  # 章节完成时检查
  on_chapter_complete:
    - plot.foreshadowing_status
    - pacing.chapter_hooks
    - character.arc_progression

  # 周期性检查（每10章）
  every_10_chapters:
    - wayne_principles.no_dog_relationship
    - wayne_principles.no_tool_character
    - wayne_principles.core_principles
    - character.relationship_evolution
    - pacing.emotion_curve
    - text_quality.writing_traps

  # 事件触发检查
  on_event:
    - death_event: wayne_principles.no_cheap_death
    - new_arc: plot.arc_structure
    - section_complete: plot.mc_arc_sync

  # 里程碑检查
  milestones:
    - chapter_3: pacing.golden_chapters
    - chapter_30: full_consistency_review
    - volume_complete: wayne_principles.no_myth_model
```

---

## 3.5 AI生成与一致性规则的关系

```yaml
# 核心原则：一致性规则不仅用于"检查后"，更用于"生成时约束"
# AI生成时会注入相关规则作为约束条件

GenerationConstraints:
  # ============================================
  # 生成任务 → 使用的一致性规则
  # ============================================

  continue_scene:
    description: 继续场景写作
    constraints_applied:
      - character.voice_match        # 确保对话风格一致
      - character.behavior_match     # 确保行为符合人设
      - character.power_match        # 确保能力不越级
      - world.rule_violation         # 确保不违反世界规则
      - world.location_match         # 确保地点描述一致
      - plot.foreshadowing_status    # 确保正确处理活跃伏笔
    context_injection:
      - characters_in_scene.profiles
      - characters_in_scene.voice_samples
      - world.constraints (relevant)
      - active_foreshadowing (relevant)

  generate_dialogue:
    description: 生成对话
    constraints_applied:
      - character.voice_match        # 核心：语言风格
      - character.dialogue_distinction  # 核心：区分度
      - character.behavior_match     # 符合性格
      - wayne_principles.no_dog_relationship  # 配角有独立观点
    context_injection:
      - all_characters_in_scene.voice_samples
      - all_characters_in_scene.facets
      - all_characters_in_scene.relationships
    generation_rules:
      - "每个角色的语言风格要有区分度"
      - "配角不能只会'是是是'、'好好好'"
      - "对话应推动剧情或揭示人物"

  describe_setting:
    description: 扩写描述
    constraints_applied:
      - world.location_match         # 地点一致性
      - world.rule_violation         # 世界规则
    context_injection:
      - location.details
      - location.atmosphere
      - world.relevant_rules

  brainstorm:
    description: 头脑风暴
    constraints_applied:
      - wayne_principles (all)       # 所有想法需符合Wayne原则
      - world.rule_violation         # 不能违反世界规则
    context_injection:
      - wayne_principles.summary
      - world.constraints.summary
    generation_rules:
      - "每个想法需标注是否符合Wayne原则"
      - "如有潜在风险，需明确指出"

  character_design:
    description: 设计新角色
    constraints_applied:
      - wayne_principles.no_dog_relationship  # R1
      - wayne_principles.no_tool_character    # R2
      - B20Checklist.character_score          # B20评分
    context_injection:
      - existing_characters.summary
      - wayne_principles.red_lines
      - B20Checklist.dimensions
    generation_rules:
      - "必须有独立目标"
      - "必须明确'会反对主角的情况'"
      - "必须通过B20评分 ≥ 30"

  plot_design:
    description: 设计剧情/支线
    constraints_applied:
      - wayne_principles.no_cheap_death       # R3
      - plot.arc_structure                    # 弧结构
      - plot.subplot_alignment                # 支线服务主线
    context_injection:
      - main_arc.summary
      - character_arcs.summary
    generation_rules:
      - "支线必须明确与主线的关系"
      - "死亡事件必须有意义和余波"

# ============================================
# 约束注入模板
# ============================================

ConstraintInjectionTemplate:
  format: |
    ## 约束条件（AI必须遵守）

    ### 人物约束
    {% for char in characters %}
    - {{char.name}}:
      - 语言风格: {{char.voice_samples | first}}
      - 行为准则: {{char.facets.public}}
      - 当前等级: {{char.level}} (能力范围: {{char.abilities}})
    {% endfor %}

    ### 世界约束
    {% for rule in world.constraints %}
    - {{rule.name}}: {{rule.description}}
    {% endfor %}

    ### Wayne原则红线
    - R1: 配角必须有独立观点，不能只顺从主角
    - R2: 每个角色必须展示多面性
    - R3: 如涉及死亡，必须有意义和余波
    - R4: 强者也受规则约束，弱者也有价值

    ### 活跃伏笔（需注意）
    {% for fs in active_foreshadowing %}
    - {{fs.id}}: {{fs.content}} (计划Ch.{{fs.planned_payoff}}回收)
    {% endfor %}

# ============================================
# 生成后自动检查
# ============================================

PostGenerationCheck:
  enabled: true
  checks:
    - realtime_consistency_rules  # 实时检查规则
  on_violation:
    action: warn_and_suggest     # 警告并建议修改
    options:
      - regenerate               # 重新生成
      - accept_with_warning      # 接受但标记警告
      - manual_edit              # 手动修改
```

---

## 四、Templates（模板）

### 4.1 AI Prompt Templates

```yaml
# 来源: AI_PROMPTS.md

PromptTemplates:
  # === 写作相关 ===

  continue_scene:
    id: continue
    name: 继续场景
    category: writing
    context_required:
      - current_chapter
      - recent_paragraphs
      - scene_outline
      - characters_in_scene
    prompt: |
      当前章节: {{chapter.title}}
      场景大纲: {{scene.description}}
      出场人物: {{characters | map: name | join: ", "}}

      最近内容:
      {{recent_paragraphs}}

      请继续写作，要求：
      1. 保持风格一致
      2. 符合人物性格
      3. 推进场景目标
      4. 提供 2-3 个不同方向的选项
    output_format: options[]

  generate_dialogue:
    id: dialogue
    name: 生成对话
    category: writing
    context_required:
      - characters_in_scene
      - character_profiles
      - scene_context
      - emotional_tone
    prompt: |
      场景: {{scene.description}}
      情绪基调: {{emotional_tone}}

      参与对话的角色:
      {% for char in characters %}
      - {{char.name}}: {{char.voice_samples | first}}
        性格: {{char.facets.public}}
      {% endfor %}

      请生成对话，要求：
      1. 每个角色的语言风格要有区分度
      2. 符合各自的性格和动机
      3. 推进情节或展现人物
    output_format: dialogue[]

  describe_setting:
    id: describe
    name: 扩写描述
    category: writing
    context_required:
      - location
      - atmosphere
      - current_text
    prompt: |
      地点: {{location.name}}
      氛围: {{location.atmosphere}}

      当前描述:
      {{current_text}}

      请扩写这段描写，要求：
      1. 增加感官细节（视觉、听觉、嗅觉）
      2. 符合整体氛围
      3. 不要过度铺陈
    output_format: text

  brainstorm:
    id: brainstorm
    name: 头脑风暴
    category: writing
    context_required:
      - question
      - story_context
    prompt: |
      问题: {{question}}

      故事背景:
      {{story_context}}

      请提供 3-5 个不同方向的想法，每个想法包含：
      1. 核心概念
      2. 优点
      3. 潜在风险
    output_format: ideas[]

  # === 检查相关 ===

  consistency_check:
    id: check
    name: 一致性检查
    category: quality
    context_required:
      - chapter_content
      - characters_in_chapter
      - character_profiles
      - world_rules
      - active_foreshadowing
    prompt: |
      请检查以下章节内容的一致性:

      {{chapter_content}}

      检查维度:
      1. 人物行为是否符合人设
      2. 对话是否符合角色语言风格
      3. 是否违反世界规则: {{world_rules | json}}
      4. 伏笔是否正确处理: {{active_foreshadowing | map: content | join: ", "}}

      返回格式:
      - 问题列表 (位置, 问题描述, 严重程度)
      - 通过的检查项
    output_format: check_result

  wayne_check:
    id: wayne_check
    name: Wayne原则检查
    category: quality
    context_required:
      - content
      - characters
      - relationships
    prompt: |
      请检查以下内容是否违反 Wayne 原则:

      {{content}}

      检查项:
      R1 - 是否有"养狗式"关系？配角是否有独立目标？
      R2 - 角色是否被工具化？是否可用单一标签概括？
      R3 - 如有死亡，是否有意义和余波？
      R4 - 强者是否遵守社会规则？弱者是否有价值？

      返回违规项和具体位置。
    output_format: violations[]

  # === Story Bible 相关 ===

  ask_story:
    id: ask
    name: 询问故事
    category: query
    context_required:
      - question
      - story_bible_summary
    prompt: |
      Story Bible 摘要:
      {{story_bible_summary}}

      问题: {{question}}

      请基于 Story Bible 回答问题。如果信息不足，请说明。
    output_format: answer

  character_design:
    id: char_design
    name: 角色设计
    category: creation
    context_required:
      - role_description
      - existing_characters
      - world_context
      - wayne_principles
    prompt: |
      请设计一个角色:

      角色定位: {{role_description}}
      现有角色: {{existing_characters | map: name | join: ", "}}
      世界背景: {{world_context}}

      要求:
      1. 使用标准人物卡模板
      2. 设计三层动机
      3. 设计多面性
      4. 检查 Wayne 原则 R1, R2
      5. 明确"会反对主角的情况"和"可能离开的情况"

      输出完整人物卡。
    output_format: character_card
```

### 4.2 Document Templates

```yaml
DocumentTemplates:
  character_card:
    name: 人物卡模板
    source: 02_characters_guide.md 4.1-4.2
    structure: |
      # {{id}} {{name}}

      ## 基础信息
      - **定位**: {{role}}
      - **年龄**: {{age}}
      - **外貌特征**: {{appearance}}
      - **语言特点**: {{voice_samples}}

      ## 内核设计

      ### 核心矛盾
      {{conflict_type}}

      ### 动机层次
      | 层次 | 内容 | 揭示时机 |
      |------|------|----------|
      | 表层 | {{motivation.surface}} | 开篇 |
      | 深层 | {{motivation.hidden}} | 中期 |
      | 核心 | {{motivation.core}} | 高潮 |

      ### 人物模板
      {{template}}

      ## 多面性
      - **公开面**: {{facets.public}}
      - **私密面**: {{facets.private}}
      - **隐藏面**: {{facets.hidden}}
      - **压力下**: {{facets.under_pressure}}

      ## 弧光设计
      - **类型**: {{arc.type}}
      - **起点**: {{arc.start_state}}
      - **终点**: {{arc.end_state}}

      ## 关系网络
      {{relationships | table}}

  chapter_outline:
    name: 章节大纲模板
    source: 04_outline_guide.md
    structure: |
      # 第{{number}}章 {{title}}

      ## 本章目标
      {{goal}}

      ## 场景列表
      {% for scene in scenes %}
      ### 场景{{loop.index}}
      - 人物: {{scene.characters | join: ", "}}
      - 地点: {{scene.location}}
      - 内容: {{scene.description}}
      - 张力: {{scene.tension}}
      {% endfor %}

      ## 章末钩子
      {{hook_ending}}

      ## 伏笔操作
      - 埋设: {{foreshadowing_plant | join: ", "}}
      - 提示: {{foreshadowing_hint | join: ", "}}
      - 回收: {{foreshadowing_resolve | join: ", "}}
```

---

## 五、Workflows（流程）

### 5.1 Six-Phase Workflow

```yaml
# 来源: PLAYBOOK_INDEX.md

SixPhaseWorkflow:
  phases:
    - id: P1
      name: 构思
      name_en: Meta
      outputs:
        - concept.md
        - guardrails.md
        - references.md (optional)
      checklist:
        - concept 完成
        - guardrails 确认
        - 一句话能吸引人
        - Wayne红线检查通过
      estimated_time: 1-2 days

    - id: P2
      name: 世界观
      name_en: World
      outputs:
        - power_system.md
        - rules.md
        - factions.md
        - locations.md
      checklist:
        - 力量体系自洽
        - 势力有张力
        - 支持社会关系模型
        - 有制衡机制
      estimated_time: 3-5 days

    - id: P3
      name: 人物
      name_en: Characters
      outputs:
        - c001_主角.md
        - c002-c008 配角.md
        - main_arc.md (主角弧光)
      checklist:
        - 主角三层动机完整
        - 核心人物各有特色
        - 关系非依附(R1检查)
        - B20评分 ≥ 90
      estimated_time: 3-5 days

    - id: P4
      name: 剧情
      name_en: Plot
      outputs:
        - main_arc.md
        - subplots.md
        - foreshadowing.md
      checklist:
        - 主线弧光清晰
        - 支线有规划
        - 伏笔有回收计划
      estimated_time: 2-3 days

    - id: P5
      name: 大纲
      name_en: Outline
      outputs:
        - structure.md
        - vol_xx/chapters.md
      checklist:
        - 前三章有钩子
        - 节奏符合标准
        - 第一卷有闭环
      estimated_time: 3-5 days

    - id: P6
      name: 写作
      name_en: Draft
      outputs:
        - vol_xx/ch_xxx.md
        - _chapter_log.md
      checklist:
        - 章节日志更新
        - 索引更新
        - 角色一致性
        - 伏笔状态追踪
      review_interval: 10 chapters
```

### 5.2 State Machines

```yaml
StateMachines:
  chapter_status:
    states: [outline, draft, revision, done]
    transitions:
      - from: outline
        to: draft
        action: start_writing
      - from: draft
        to: revision
        action: complete_draft
      - from: revision
        to: done
        action: finalize
      - from: revision
        to: draft
        action: major_rewrite

  foreshadowing_status:
    states: [active, resolved]
    transitions:
      - from: active
        to: resolved
        action: resolve
        requires: resolved_chapter

  arc_status:
    states: [planned, in_progress, complete]
    transitions:
      - from: planned
        to: in_progress
        action: start_arc
      - from: in_progress
        to: complete
        action: complete_arc
        requires: all_chapters_done
```

---

## 六、Context Injection 策略

```yaml
# AI 调用时的上下文注入策略
# 核心：Context = 信息 + 约束

ContextInjection:
  # ============================================
  # 写作生成时的上下文
  # ============================================
  writing_context:
    # 信息部分
    information:
      always_include:
        - current_chapter.outline
        - recent_chapters_summary (last 2-3)
        - characters_in_scene.profiles
        - location.details
        - active_foreshadowing (relevant)
      optional:
        - recent_paragraphs (last 500-1000 chars)
        - scene_emotional_tone

    # 约束部分（来自 ConsistencyRules）
    constraints:
      always_include:
        - characters_in_scene.voice_samples    # 语言风格约束
        - characters_in_scene.facets           # 行为约束
        - characters_in_scene.power_level      # 能力约束
        - world.constraints (relevant)         # 世界规则约束
        - wayne_principles.summary             # Wayne原则提醒
      conditional:
        - if death_in_outline: death_meaning_rules
        - if new_character: anti_tool_character_rules

    max_tokens: 8000

  # ============================================
  # 一致性检查时的上下文
  # ============================================
  consistency_context:
    information:
      always_include:
        - chapter_content (full)
        - all_characters_in_chapter.full_profiles
        - all_locations_in_chapter.details
        - world.all_constraints
        - active_foreshadowing.all
        - recent_chapters_summary (for context)

    check_rules:
      always_include:
        - ConsistencyRules.character (all)
        - ConsistencyRules.world (all)
        - ConsistencyRules.plot (relevant)
        - ConsistencyRules.wayne_principles (all)
        - ConsistencyRules.text_quality (all)

    max_tokens: 16000

  # ============================================
  # 10章周期检查的上下文
  # ============================================
  periodic_review_context:
    information:
      - chapters[X-10 to X].summaries
      - characters_appeared.profiles
      - relationships.evolution
      - foreshadowing.status_changes

    check_rules:
      - ConsistencyRules.wayne_principles (full)
      - ConsistencyRules.pacing.emotion_curve
      - ConsistencyRules.text_quality.writing_traps

    max_tokens: 12000

  # ============================================
  # Story Bible 查询的上下文
  # ============================================
  query_context:
    strategy: semantic_search
    information:
      - relevant_characters
      - relevant_locations
      - relevant_plot_points
      - relevant_foreshadowing
      - relevant_world_rules

    max_tokens: 4000

  # ============================================
  # 角色/剧情设计的上下文
  # ============================================
  design_context:
    information:
      - existing_characters.summary
      - existing_relationships.map
      - world.summary
      - main_arc.summary

    constraints:
      - wayne_principles.red_lines (full)
      - B20Checklist.dimensions
      - relationship_non_dependent_rules

    max_tokens: 6000

# ============================================
# Context 优先级（当token超限时裁剪）
# ============================================
ContextPriority:
  critical:  # 绝不裁剪
    - wayne_principles.summary
    - characters_in_scene.voice_samples
    - world.constraints (active)
  high:      # 尽量保留
    - current_chapter.outline
    - characters_in_scene.profiles
    - active_foreshadowing
  medium:    # 可适当裁剪
    - recent_chapters_summary
    - location.details
  low:       # 优先裁剪
    - optional_context
    - historical_info
```

---

## 七、设计总结

### 7.1 一致性检查的完整覆盖

| 维度 | 检查项数量 | 覆盖来源 |
|------|------------|----------|
| 人物一致性 | 6 | 02_characters_guide, 05_draft_guide |
| 世界观一致性 | 4 | 01_world_guide |
| 剧情一致性 | 4 | 03_plot_guide |
| Wayne原则 | 6 | 00_meta_guide, 05_draft_guide |
| 节奏与质量 | 4 | 04_outline_guide, 05_draft_guide |
| 文本质量 | 2 | 05_draft_guide |
| **总计** | **26** | 方法论全覆盖 |

### 7.2 生成与检查的关系

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 生成/写作流程                          │
├─────────────────────────────────────────────────────────────┤
│  1. 加载 Context（信息 + 约束）                              │
│     ├── 信息: characters, location, outline, foreshadowing │
│     └── 约束: voice_samples, world.constraints, wayne...   │
│                                                             │
│  2. 生成时受约束                                             │
│     └── AI prompt 包含约束条件，生成结果需符合               │
│                                                             │
│  3. 生成后检查                                               │
│     └── 应用 realtime consistency rules                     │
│                                                             │
│  4. 如有违规                                                 │
│     ├── 警告用户                                            │
│     └── 提供选项: 重新生成 / 接受并标记 / 手动修改          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    周期性检查流程                            │
├─────────────────────────────────────────────────────────────┤
│  触发时机:                                                   │
│  - 每章完成: foreshadowing, hooks, arc_progression         │
│  - 每10章: wayne_principles, emotion_curve, writing_traps  │
│  - 卷完成: full_review, myth_model_check                   │
│  - 事件触发: death → no_cheap_death                        │
│                                                             │
│  输出:                                                       │
│  - 问题列表 (位置, 描述, 严重程度)                          │
│  - 通过的检查项                                              │
│  - 改进建议                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 八、用户自定义配置

### 8.1 配置覆盖机制

```yaml
# 优先级: 项目配置 > 用户配置 > 默认配置
#
# ~/.inxtone/rules/custom.yaml  (用户全局)
# ./inxtone.yaml                (项目级别)

ConfigPriority:
  1: project_config     # ./inxtone.yaml
  2: user_config        # ~/.inxtone/rules/custom.yaml
  3: default_config     # 内置默认（只读）
```

### 8.2 规则自定义示例

```yaml
# 用户的 custom.yaml 示例

# === 禁用规则 ===
disabled_rules:
  - wayne_principles.no_myth_model    # 我的故事就是神话模型，禁用此检查
  - pacing.golden_chapters            # 我是慢热型，不需要黄金三章检查

# === 修改参数 ===
rule_overrides:
  text_quality.repetition:
    threshold: 5                      # 默认3，改为5（更宽松）
    severity: low                     # 降低严重程度

  pacing.emotion_curve:
    threshold:
      max_continuous_same_tone: 5     # 默认3，改为5

  character.power_match:
    severity: high                    # 从 critical 降为 high

# === 添加自定义规则 ===
custom_rules:
  character:
    # 用户自定义：禁止人设前后矛盾
    no_personality_contradiction:
      description: 角色性格不能前后矛盾（除非有剧情解释）
      check_against: character.facets, chapter_history
      severity: high
      enabled: true

    # 用户自定义：主角必须有弱点
    mc_must_have_weakness:
      description: 主角必须有明显弱点
      check_against: mc.weaknesses
      severity: medium
      enabled: true

  # 用户自定义：新类别 - 商业化检查
  commercial:
    update_frequency:
      description: 检查更新频率是否达标
      threshold:
        min_chapters_per_week: 7
      severity: low
      enabled: true

    word_count_target:
      description: 检查字数是否达标
      threshold:
        min_words_per_chapter: 2000
        max_words_per_chapter: 4000
      severity: low
      enabled: true
```

### 8.3 模板自定义

```yaml
# 用户可以覆盖或添加 AI Prompt 模板

custom_templates:
  # 覆盖默认的 continue_scene
  continue_scene:
    prompt: |
      [用户自定义的提示词...]

  # 添加新模板
  my_custom_prompt:
    id: my_custom
    name: 我的自定义提示
    category: writing
    context_required:
      - current_chapter
    prompt: |
      [用户自定义...]
```

### 8.4 预设切换

```yaml
# 预设定义
Presets:
  strict:
    name: 严格模式
    description: 所有规则启用，高标准
    rules:
      all: enabled
      thresholds: strict

  relaxed:
    name: 宽松模式
    description: 只保留核心规则
    disabled_rules:
      - text_quality.*
      - pacing.emotion_curve
      - plot.arc_structure

  commercial:
    name: 商业写作模式
    description: 适合网文平台
    enabled_rules:
      - pacing.golden_chapters      # 必须有钩子
      - pacing.chapter_hooks        # 章末必须有钩子
    custom_rules:
      - commercial.update_frequency
      - commercial.word_count_target

# TUI/GUI 中切换预设
# > inxtone config preset strict
# > inxtone config preset relaxed
```

### 8.5 配置 UI（TUI/Web）

```
TUI 配置界面:
┌─────────────────────────────────────────────────────────┐
│  ⚙️ 规则配置                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📁 人物一致性                                           │
│    [✓] voice_match          语言风格检查    severity: high   │
│    [✓] behavior_match       行为一致性      severity: high   │
│    [✓] power_match          能力等级检查    severity: critical│
│    [ ] dialogue_distinction 对话区分度      severity: medium │
│    [+] 添加自定义规则...                                 │
│                                                         │
│  📁 Wayne 原则                                           │
│    [✓] R1 no_dog_relationship                           │
│    [✓] R2 no_tool_character                             │
│    [✓] R3 no_cheap_death                                │
│    [ ] R4 no_myth_model     ← 用户禁用了                 │
│                                                         │
│  📁 节奏与质量                                           │
│    ...                                                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  预设: [严格模式 ▼]    [保存配置]  [重置为默认]          │
└─────────────────────────────────────────────────────────┘
```

---

## 九、待讨论

- [x] Schema 格式确认 → **YAML** (AI友好、人类可读)
- [x] 一致性检查全面性 → **已扩展至26项，覆盖方法论所有阶段**
- [x] 生成时使用规则 → **约束注入模式**
- [x] 用户自定义规则 → **覆盖机制 + 预设系统**
- [ ] Prompt Templates 的变量语法（Liquid? Handlebars? 自定义?）
- [ ] 规则的执行方式（纯AI检查 vs 混合规则引擎）
- [ ] 检查结果的存储和追踪

---

*最后更新：2026-02-04*
*Status: 🚧 进行中 (一致性检查部分已完成)*
