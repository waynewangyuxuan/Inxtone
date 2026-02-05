# State Machines

> 状态机定义

**Parent**: [Meta.md](Meta.md)
**Lines**: ~45 | **Updated**: 2026-02-05

---

```yaml
StateMachines:
  chapter_status:
    states: [outline, draft, revision, done]
    transitions:
      - from: outline
        to: draft
        action: start_writing
      - from: draft
        to: revision
        action: complete_draft
      - from: revision
        to: done
        action: finalize
      - from: revision
        to: draft
        action: major_rewrite

  foreshadowing_status:
    states: [active, resolved]
    transitions:
      - from: active
        to: resolved
        action: resolve
        requires: resolved_chapter

  arc_status:
    states: [planned, in_progress, complete]
    transitions:
      - from: planned
        to: in_progress
        action: start_arc
      - from: in_progress
        to: complete
        action: complete_arc
        requires: all_chapters_done
```

---

## See Also

- [../Schemas/Chapter.md](../Schemas/Chapter.md) - 章节结构
- [../Schemas/Plot.md](../Schemas/Plot.md) - 剧情结构
