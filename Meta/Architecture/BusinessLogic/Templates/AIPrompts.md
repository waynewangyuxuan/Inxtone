# AI Prompt Templates

> 写作、检查、设计相关的AI提示词

**Parent**: [Meta.md](Meta.md)
**Lines**: ~120 | **Updated**: 2026-02-05

---

```yaml
# 来源: AI_PROMPTS.md

PromptTemplates:
  # === 写作相关 ===

  continue_scene:
    id: continue
    name: 继续场景
    category: writing
    context_required:
      - current_chapter
      - recent_paragraphs
      - scene_outline
      - characters_in_scene
    prompt: |
      当前章节: {{chapter.title}}
      场景大纲: {{scene.description}}
      出场人物: {{characters | map: name | join: ", "}}

      最近内容:
      {{recent_paragraphs}}

      请继续写作，要求：
      1. 保持风格一致
      2. 符合人物性格
      3. 推进场景目标
      4. 提供 2-3 个不同方向的选项
    output_format: options[]

  generate_dialogue:
    id: dialogue
    name: 生成对话
    category: writing
    context_required:
      - characters_in_scene
      - character_profiles
      - scene_context
      - emotional_tone
    prompt: |
      场景: {{scene.description}}
      情绪基调: {{emotional_tone}}

      参与对话的角色:
      {% for char in characters %}
      - {{char.name}}: {{char.voice_samples | first}}
        性格: {{char.facets.public}}
      {% endfor %}

      请生成对话，要求：
      1. 每个角色的语言风格要有区分度
      2. 符合各自的性格和动机
      3. 推进情节或展现人物
    output_format: dialogue[]

  describe_setting:
    id: describe
    name: 扩写描述
    category: writing
    prompt: |
      地点: {{location.name}}
      氛围: {{location.atmosphere}}
      当前描述: {{current_text}}

      请扩写这段描写，要求：
      1. 增加感官细节（视觉、听觉、嗅觉）
      2. 符合整体氛围
      3. 不要过度铺陈
    output_format: text

  brainstorm:
    id: brainstorm
    name: 头脑风暴
    category: writing
    prompt: |
      问题: {{question}}
      故事背景: {{story_context}}

      请提供 3-5 个不同方向的想法，每个想法包含：
      1. 核心概念
      2. 优点
      3. 潜在风险
    output_format: ideas[]

  # === 检查相关 ===

  consistency_check:
    id: check
    name: 一致性检查
    category: quality
    context_required:
      - chapter_content
      - characters_in_chapter
      - character_profiles
      - world_rules
      - active_foreshadowing
    prompt: |
      请检查以下章节内容的一致性:
      {{chapter_content}}

      检查维度:
      1. 人物行为是否符合人设
      2. 对话是否符合角色语言风格
      3. 是否违反世界规则
      4. 伏笔是否正确处理

      返回格式:
      - 问题列表 (位置, 问题描述, 严重程度)
      - 通过的检查项
    output_format: check_result

  wayne_check:
    id: wayne_check
    name: Wayne原则检查
    category: quality
    prompt: |
      请检查以下内容是否违反 Wayne 原则:
      {{content}}

      检查项:
      R1 - 是否有"养狗式"关系？配角是否有独立目标？
      R2 - 角色是否被工具化？是否可用单一标签概括？
      R3 - 如有死亡，是否有意义和余波？
      R4 - 强者是否遵守社会规则？弱者是否有价值？

      返回违规项和具体位置。
    output_format: violations[]

  # === Story Bible 相关 ===

  ask_story:
    id: ask
    name: 询问故事
    category: query
    prompt: |
      Story Bible 摘要: {{story_bible_summary}}
      问题: {{question}}
      请基于 Story Bible 回答问题。如果信息不足，请说明。
    output_format: answer

  character_design:
    id: char_design
    name: 角色设计
    category: creation
    prompt: |
      请设计一个角色:
      角色定位: {{role_description}}
      现有角色: {{existing_characters | map: name | join: ", "}}
      世界背景: {{world_context}}

      要求:
      1. 使用标准人物卡模板
      2. 设计三层动机
      3. 设计多面性
      4. 检查 Wayne 原则 R1, R2
      5. 明确"会反对主角的情况"和"可能离开的情况"

      输出完整人物卡。
    output_format: character_card
```

---

## See Also

- [DocumentTemplates.md](DocumentTemplates.md) - 文档模板
- [../Rules/GenerationConstraints.md](../Rules/GenerationConstraints.md) - 约束注入
