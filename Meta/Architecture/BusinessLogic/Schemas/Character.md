# Character Schema

> 人物卡数据结构

**Parent**: [Meta.md](Meta.md)
**Lines**: ~60 | **Updated**: 2026-02-05

---

## Schema Definition

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

---

## See Also

- [Relationship.md](Relationship.md) - 关系结构
- [../Rules/B20Checklist.md](../Rules/B20Checklist.md) - 人物评分
