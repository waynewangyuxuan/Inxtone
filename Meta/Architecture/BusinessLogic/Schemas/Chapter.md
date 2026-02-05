# Chapter Schema

> 章节数据结构

**Parent**: [Meta.md](Meta.md)
**Lines**: ~45 | **Updated**: 2026-02-05

---

## Schema Definition

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

## See Also

- [Plot.md](Plot.md) - 剧情结构
- [../Templates/DocumentTemplates.md](../Templates/DocumentTemplates.md) - 章节大纲模板
