# Consistency Rules

> 26项一致性检查规则

**Parent**: [Meta.md](Meta.md)
**Lines**: ~150 | **Updated**: 2026-02-05

---

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
    voice_match:
      description: 对话是否符合角色语言风格
      check_against: character.voice_samples
      severity: high

    behavior_match:
      description: 行为是否符合角色性格和动机
      check_against: character.facets, character.motivation
      severity: high

    power_match:
      description: 能力表现是否符合角色等级
      check_against: character.level, world.power_system
      severity: critical

    dialogue_distinction:
      description: 不同角色的对话是否有区分度
      check_against: all_characters_in_scene.voice_samples
      severity: medium

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
  # 二、世界观一致性 (来源: 01_world_guide)
  # ============================================
  world:
    rule_violation:
      description: 是否违反世界规则/力量体系约束
      check_against: world.power_system.constraints
      severity: critical

    location_match:
      description: 地点描述是否前后一致
      check_against: location.atmosphere, location.details
      severity: medium

    faction_stance:
      description: 势力态度是否符合设定
      check_against: faction.stance_to_mc, faction.goals
      severity: medium

    timeline_order:
      description: 事件时间顺序是否正确
      check_against: world.timeline
      severity: high

  # ============================================
  # 三、剧情一致性 (来源: 03_plot_guide)
  # ============================================
  plot:
    foreshadowing_status:
      description: 活跃伏笔是否正确处理
      check_against: foreshadowing[status=active]
      severity: high

    subplot_alignment:
      description: 支线是否服务于主线
      check_against: subplot.main_arc_relation
      severity: medium

    arc_structure:
      description: 剧情是否符合弧结构
      check_against: arc.sections, chapter.position
      severity: low

    mc_arc_sync:
      description: 主线进展是否与主角成长同步
      check_against: main_arc.sections, mc.arc.phases
      check_interval: per_section
      severity: medium

  # ============================================
  # 四、Wayne原则检查 (来源: 00_meta_guide)
  # ============================================
  wayne_principles:
    no_dog_relationship:
      description: 配角是否有独立性
      check_against: relationships[type!=enemy]
      check_interval: 10_chapters
      severity: high

    no_tool_character:
      description: 角色是否被工具化/符号化
      check_against: characters[role!=mentioned]
      check_interval: 10_chapters
      severity: high

    no_cheap_death:
      description: 死亡是否有意义
      trigger: death_event
      severity: critical

    no_myth_model:
      description: 世界是否有社会模型而非神话模型
      check_against: world, recent_chapters
      check_interval: per_arc
      severity: high

    core_principles:
      description: P1-P4 核心原则是否遵守
      check_interval: 10_chapters
      severity: high

  # ============================================
  # 五、节奏与质量 (来源: 04_outline_guide)
  # ============================================
  pacing:
    golden_chapters:
      description: 前三章是否有足够钩子
      check_against: chapters[1-3]
      severity: critical

    emotion_curve:
      description: 情绪是否有张有弛
      threshold: max_continuous_same_tone: 3
      check_interval: 10_chapters
      severity: medium

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
      severity: medium

# ============================================
# 检查时机配置
# ============================================
CheckSchedule:
  realtime:
    - character.voice_match
    - character.behavior_match
    - character.power_match
    - world.rule_violation
    - text_quality.repetition

  on_chapter_complete:
    - plot.foreshadowing_status
    - pacing.chapter_hooks
    - character.arc_progression

  every_10_chapters:
    - wayne_principles.no_dog_relationship
    - wayne_principles.no_tool_character
    - wayne_principles.core_principles
    - pacing.emotion_curve

  on_event:
    - death_event: wayne_principles.no_cheap_death
    - new_arc: plot.arc_structure

  milestones:
    - chapter_3: pacing.golden_chapters
    - chapter_30: full_consistency_review
    - volume_complete: wayne_principles.no_myth_model
```

---

## See Also

- [WaynePrinciples.md](WaynePrinciples.md) - 原则定义
- [GenerationConstraints.md](GenerationConstraints.md) - 生成时约束
- [../UserConfig.md](../UserConfig.md) - 自定义规则
