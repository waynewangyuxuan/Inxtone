# Relationship Schema

> 人物关系数据结构

**Parent**: [Meta.md](Meta.md)
**Lines**: ~30 | **Updated**: 2026-02-05

---

## Schema Definition

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

---

## See Also

- [Character.md](Character.md) - 人物结构
- [../Rules/WaynePrinciples.md](../Rules/WaynePrinciples.md) - R1 养狗检查
