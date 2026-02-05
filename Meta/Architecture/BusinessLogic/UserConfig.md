# User Configuration

> 用户自定义配置系统

**Parent**: [Meta.md](Meta.md)
**Lines**: ~150 | **Updated**: 2026-02-05

---

## 用户可配置层级

| 层级 | 描述 | 示例 |
|------|------|------|
| **禁用/启用** | 开关单条规则 | 禁用 R4 神话模型检查 |
| **修改参数** | 调整阈值、严重程度 | 把 repetition 阈值从 3 改为 5 |
| **扩展规则** | 在现有类别下添加新规则 | 在 character 下加 "禁止人设矛盾" |
| **新增类别** | 创建全新的规则类别 | 添加 "商业化检查" 类别 |
| **规则集** | 保存/切换整套配置 | "严格模式" vs "宽松模式" |

---

## 配置文件结构

```
~/.inxtone/
├── config.yaml              # 全局配置
├── rules/
│   ├── default.yaml         # 默认规则（我们提供，只读参考）
│   └── custom.yaml          # 用户自定义规则（覆盖/扩展）
├── templates/
│   ├── default/             # 默认模板
│   └── custom/              # 用户自定义模板
└── presets/
    ├── strict.yaml          # 预设：严格模式
    └── relaxed.yaml         # 预设：宽松模式
```

---

## 配置覆盖机制

```yaml
# 优先级: 项目配置 > 用户配置 > 默认配置

ConfigPriority:
  1: project_config     # ./inxtone.yaml
  2: user_config        # ~/.inxtone/rules/custom.yaml
  3: default_config     # 内置默认（只读）
```

---

## 规则自定义示例

```yaml
# 用户的 custom.yaml 示例

# === 禁用规则 ===
disabled_rules:
  - wayne_principles.no_myth_model    # 我的故事就是神话模型
  - pacing.golden_chapters            # 我是慢热型

# === 修改参数 ===
rule_overrides:
  text_quality.repetition:
    threshold: 5                      # 默认3，改为5
    severity: low

  pacing.emotion_curve:
    threshold:
      max_continuous_same_tone: 5     # 默认3，改为5

# === 添加自定义规则 ===
custom_rules:
  character:
    no_personality_contradiction:
      description: 角色性格不能前后矛盾
      severity: high
      enabled: true

    mc_must_have_weakness:
      description: 主角必须有明显弱点
      severity: medium
      enabled: true

  # 用户自定义：新类别 - 商业化检查
  commercial:
    update_frequency:
      description: 检查更新频率是否达标
      threshold:
        min_chapters_per_week: 7
      severity: low

    word_count_target:
      description: 检查字数是否达标
      threshold:
        min_words_per_chapter: 2000
        max_words_per_chapter: 4000
      severity: low
```

---

## 预设系统

```yaml
Presets:
  strict:
    name: 严格模式
    description: 所有规则启用，高标准
    rules:
      all: enabled
      thresholds: strict

  relaxed:
    name: 宽松模式
    description: 只保留核心规则
    disabled_rules:
      - text_quality.*
      - pacing.emotion_curve

  commercial:
    name: 商业写作模式
    description: 适合网文平台
    enabled_rules:
      - pacing.golden_chapters
      - pacing.chapter_hooks
    custom_rules:
      - commercial.update_frequency
      - commercial.word_count_target

# 切换预设
# > inxtone config preset strict
# > inxtone config preset relaxed
```

---

## 模板自定义

```yaml
custom_templates:
  # 覆盖默认模板
  continue_scene:
    prompt: |
      [用户自定义的提示词...]

  # 添加新模板
  my_custom_prompt:
    id: my_custom
    name: 我的自定义提示
    category: writing
    prompt: |
      [用户自定义...]
```

---

## See Also

- [Rules/ConsistencyRules.md](Rules/ConsistencyRules.md) - 默认规则
- [Templates/AIPrompts.md](Templates/AIPrompts.md) - 默认模板
