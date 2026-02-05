# Six-Phase Workflow

> 六阶段写作工作流

**Parent**: [Meta.md](Meta.md)
**Lines**: ~90 | **Updated**: 2026-02-05

---

```yaml
# 来源: PLAYBOOK_INDEX.md

SixPhaseWorkflow:
  phases:
    - id: P1
      name: 构思
      name_en: Meta
      outputs:
        - concept.md
        - guardrails.md
        - references.md (optional)
      checklist:
        - concept 完成
        - guardrails 确认
        - 一句话能吸引人
        - Wayne红线检查通过
      estimated_time: 1-2 days

    - id: P2
      name: 世界观
      name_en: World
      outputs:
        - power_system.md
        - rules.md
        - factions.md
        - locations.md
      checklist:
        - 力量体系自洽
        - 势力有张力
        - 支持社会关系模型
        - 有制衡机制
      estimated_time: 3-5 days

    - id: P3
      name: 人物
      name_en: Characters
      outputs:
        - c001_主角.md
        - c002-c008 配角.md
        - main_arc.md (主角弧光)
      checklist:
        - 主角三层动机完整
        - 核心人物各有特色
        - 关系非依附(R1检查)
        - B20评分 ≥ 90
      estimated_time: 3-5 days

    - id: P4
      name: 剧情
      name_en: Plot
      outputs:
        - main_arc.md
        - subplots.md
        - foreshadowing.md
      checklist:
        - 主线弧光清晰
        - 支线有规划
        - 伏笔有回收计划
      estimated_time: 2-3 days

    - id: P5
      name: 大纲
      name_en: Outline
      outputs:
        - structure.md
        - vol_xx/chapters.md
      checklist:
        - 前三章有钩子
        - 节奏符合标准
        - 第一卷有闭环
      estimated_time: 3-5 days

    - id: P6
      name: 写作
      name_en: Draft
      outputs:
        - vol_xx/ch_xxx.md
        - _chapter_log.md
      checklist:
        - 章节日志更新
        - 索引更新
        - 角色一致性
        - 伏笔状态追踪
      review_interval: 10 chapters
```

---

## See Also

- [StateMachines.md](StateMachines.md) - 状态转换
- [../Rules/ConsistencyRules.md](../Rules/ConsistencyRules.md) - 检查规则
