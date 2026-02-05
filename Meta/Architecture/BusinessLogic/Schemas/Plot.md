# Plot Schema

> 剧情结构数据

**Parent**: [Meta.md](Meta.md)
**Lines**: ~50 | **Updated**: 2026-02-05

---

## Schema Definition

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

---

## See Also

- [Chapter.md](Chapter.md) - 章节结构
- [../Workflows/StateMachines.md](../Workflows/StateMachines.md) - 状态机
