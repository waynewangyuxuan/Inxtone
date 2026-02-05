# Document Templates

> 人物卡、章节大纲等文档模板

**Parent**: [Meta.md](Meta.md)
**Lines**: ~80 | **Updated**: 2026-02-05

---

## Character Card Template

```yaml
# 来源: 02_characters_guide.md 4.1-4.2

DocumentTemplates:
  character_card:
    name: 人物卡模板
    structure: |
      # {{id}} {{name}}

      ## 基础信息
      - **定位**: {{role}}
      - **年龄**: {{age}}
      - **外貌特征**: {{appearance}}
      - **语言特点**: {{voice_samples}}

      ## 内核设计

      ### 核心矛盾
      {{conflict_type}}

      ### 动机层次
      | 层次 | 内容 | 揭示时机 |
      |------|------|----------|
      | 表层 | {{motivation.surface}} | 开篇 |
      | 深层 | {{motivation.hidden}} | 中期 |
      | 核心 | {{motivation.core}} | 高潮 |

      ### 人物模板
      {{template}}

      ## 多面性
      - **公开面**: {{facets.public}}
      - **私密面**: {{facets.private}}
      - **隐藏面**: {{facets.hidden}}
      - **压力下**: {{facets.under_pressure}}

      ## 弧光设计
      - **类型**: {{arc.type}}
      - **起点**: {{arc.start_state}}
      - **终点**: {{arc.end_state}}

      ## 关系网络
      {{relationships | table}}
```

---

## Chapter Outline Template

```yaml
  chapter_outline:
    name: 章节大纲模板
    source: 04_outline_guide.md
    structure: |
      # 第{{number}}章 {{title}}

      ## 本章目标
      {{goal}}

      ## 场景列表
      {% for scene in scenes %}
      ### 场景{{loop.index}}
      - 人物: {{scene.characters | join: ", "}}
      - 地点: {{scene.location}}
      - 内容: {{scene.description}}
      - 张力: {{scene.tension}}
      {% endfor %}

      ## 章末钩子
      {{hook_ending}}

      ## 伏笔操作
      - 埋设: {{foreshadowing_plant | join: ", "}}
      - 提示: {{foreshadowing_hint | join: ", "}}
      - 回收: {{foreshadowing_resolve | join: ", "}}
```

---

## See Also

- [AIPrompts.md](AIPrompts.md) - AI提示词
- [../Schemas/Character.md](../Schemas/Character.md) - 人物结构
- [../Schemas/Chapter.md](../Schemas/Chapter.md) - 章节结构
