# B20 Character Checklist

> 人物评分标准

**Parent**: [Meta.md](Meta.md)
**Lines**: ~60 | **Updated**: 2026-02-05

---

## Character Score

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
```

---

## Relationship Score

```yaml
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

---

## See Also

- [../Schemas/Character.md](../Schemas/Character.md) - 人物结构
- [WaynePrinciples.md](WaynePrinciples.md) - R1, R2 原则
