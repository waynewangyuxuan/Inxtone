# World Schema

> 世界观数据结构

**Parent**: [Meta.md](Meta.md)
**Lines**: ~50 | **Updated**: 2026-02-05

---

## Schema Definition

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

---

## See Also

- [../Rules/ConsistencyRules.md](../Rules/ConsistencyRules.md) - 世界观一致性检查
