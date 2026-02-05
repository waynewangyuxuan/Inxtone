# Generation Constraints

> AI生成时的约束注入

**Parent**: [Meta.md](Meta.md)
**Lines**: ~140 | **Updated**: 2026-02-05

---

## 核心原则

一致性规则不仅用于"检查后"，更用于"生成时约束"。
AI生成时会注入相关规则作为约束条件。

```yaml
GenerationConstraints:
  # ============================================
  # 生成任务 → 使用的一致性规则
  # ============================================

  continue_scene:
    description: 继续场景写作
    constraints_applied:
      - character.voice_match
      - character.behavior_match
      - character.power_match
      - world.rule_violation
      - world.location_match
      - plot.foreshadowing_status
    context_injection:
      - characters_in_scene.profiles
      - characters_in_scene.voice_samples
      - world.constraints (relevant)
      - active_foreshadowing (relevant)

  generate_dialogue:
    description: 生成对话
    constraints_applied:
      - character.voice_match
      - character.dialogue_distinction
      - character.behavior_match
      - wayne_principles.no_dog_relationship
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
      - world.location_match
      - world.rule_violation
    context_injection:
      - location.details
      - location.atmosphere
      - world.relevant_rules

  brainstorm:
    description: 头脑风暴
    constraints_applied:
      - wayne_principles (all)
      - world.rule_violation
    context_injection:
      - wayne_principles.summary
      - world.constraints.summary
    generation_rules:
      - "每个想法需标注是否符合Wayne原则"
      - "如有潜在风险，需明确指出"

  character_design:
    description: 设计新角色
    constraints_applied:
      - wayne_principles.no_dog_relationship
      - wayne_principles.no_tool_character
      - B20Checklist.character_score
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
      - wayne_principles.no_cheap_death
      - plot.arc_structure
      - plot.subplot_alignment
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
    - realtime_consistency_rules
  on_violation:
    action: warn_and_suggest
    options:
      - regenerate
      - accept_with_warning
      - manual_edit
```

---

## See Also

- [ConsistencyRules.md](ConsistencyRules.md) - 完整规则列表
- [../ContextInjection.md](../ContextInjection.md) - 上下文注入策略
- [../Templates/AIPrompts.md](../Templates/AIPrompts.md) - Prompt模板
