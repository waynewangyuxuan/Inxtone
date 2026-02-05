# Wayne Principles

> 红线规则与核心原则

**Parent**: [Meta.md](Meta.md)
**Lines**: ~70 | **Updated**: 2026-02-05

---

## Red Lines (绝对红线)

```yaml
# 来源: 00_meta_guide.md

WaynePrinciples:
  red_lines:
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
```

---

## Core Principles (核心原则)

```yaml
  core_principles:
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

---

## See Also

- [ConsistencyRules.md](ConsistencyRules.md) - Wayne原则检查实现
- [../Schemas/Relationship.md](../Schemas/Relationship.md) - R1相关字段
