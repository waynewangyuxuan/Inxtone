/**
 * Prompt Templates for AI Generation
 *
 * Stored as TypeScript string constants to avoid build tool asset bundling issues.
 * Each template uses YAML-like front-matter for metadata and {{variable}} for substitution.
 */

export const CONTINUE_TEMPLATE = `---
name: continue
description: 续写当前章节内容
variables:
  - context
  - current_content
  - user_instruction
---

你是一位网文写作助手。请基于以下设定和上下文续写故事内容。

{{context}}

## 当前内容
{{current_content}}

{{user_instruction}}

请续写接下来的内容。要求:
- 保持角色性格一致
- 自然衔接，不要重复已有内容
- 保持文风统一

直接输出续写内容，无需解释。`;

export const DIALOGUE_TEMPLATE = `---
name: dialogue
description: 生成角色对话
variables:
  - context
  - characters
  - scene_description
  - user_instruction
---

你是一位网文写作助手，擅长角色对话创作。

{{context}}

## 参与对话的角色
{{characters}}

## 场景
{{scene_description}}

{{user_instruction}}

请生成一段自然的角色对话。要求:
- 每个角色的语气和用词要符合其性格
- 对话要推动情节发展
- 包含适当的动作和表情描写

直接输出对话内容，无需解释。`;

export const DESCRIBE_TEMPLATE = `---
name: describe
description: 生成场景描写
variables:
  - context
  - location
  - mood
  - user_instruction
---

你是一位网文写作助手，擅长场景氛围描写。

{{context}}

## 场景地点
{{location}}

## 氛围基调
{{mood}}

{{user_instruction}}

请生成一段场景描写。要求:
- 运用多种感官描写（视觉、听觉、触觉等）
- 与角色情绪和剧情氛围契合
- 文字优美但不过度堆砌

直接输出描写内容，无需解释。`;

export const BRAINSTORM_TEMPLATE = `---
name: brainstorm
description: 头脑风暴续写方向
variables:
  - context
  - topic
  - user_instruction
---

你是一位网文写作顾问，请基于当前故事状态进行头脑风暴。

{{context}}

## 主题
{{topic}}

{{user_instruction}}

请提供 3-5 个续写方向或创意点子。每个方向包含:
1. 简短标题
2. 核心概念（2-3句话）
3. 与当前剧情的衔接点

以清晰的格式列出各个方向。`;

export const ASK_BIBLE_TEMPLATE = `---
name: ask_bible
description: Story Bible 问答
variables:
  - context
  - question
---

你是一位故事设定顾问。请基于以下故事设定资料回答问题。

{{context}}

## 问题
{{question}}

请基于提供的设定资料回答。如果资料中没有相关信息，请明确说明。`;
