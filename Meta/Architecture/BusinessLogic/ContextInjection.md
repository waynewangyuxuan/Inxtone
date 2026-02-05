# Context Injection Strategy

> AI调用时的上下文注入策略

**Parent**: [Meta.md](Meta.md)
**Lines**: ~130 | **Updated**: 2026-02-05

---

## 核心原则

**Context = 信息 + 约束**

```yaml
# AI 调用时的上下文注入策略

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

## See Also

- [Rules/GenerationConstraints.md](Rules/GenerationConstraints.md) - 生成约束
- [Rules/ConsistencyRules.md](Rules/ConsistencyRules.md) - 一致性规则
