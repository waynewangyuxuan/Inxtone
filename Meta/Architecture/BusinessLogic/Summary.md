# Design Summary

> 设计总结与待讨论事项

**Parent**: [Meta.md](Meta.md)
**Lines**: ~50 | **Updated**: 2026-02-05

---

## 一致性检查完整覆盖

| 维度 | 检查项数量 | 覆盖来源 |
|------|------------|----------|
| 人物一致性 | 6 | 02_characters_guide, 05_draft_guide |
| 世界观一致性 | 4 | 01_world_guide |
| 剧情一致性 | 4 | 03_plot_guide |
| Wayne原则 | 6 | 00_meta_guide, 05_draft_guide |
| 节奏与质量 | 4 | 04_outline_guide, 05_draft_guide |
| 文本质量 | 2 | 05_draft_guide |
| **总计** | **26** | 方法论全覆盖 |

---

## 生成与检查的关系

```
┌─────────────────────────────────────────────────────────────┐
│                    AI 生成/写作流程                          │
├─────────────────────────────────────────────────────────────┤
│  1. 加载 Context（信息 + 约束）                              │
│     ├── 信息: characters, location, outline, foreshadowing │
│     └── 约束: voice_samples, world.constraints, wayne...   │
│                                                             │
│  2. 生成时受约束                                             │
│     └── AI prompt 包含约束条件，生成结果需符合               │
│                                                             │
│  3. 生成后检查                                               │
│     └── 应用 realtime consistency rules                     │
│                                                             │
│  4. 如有违规                                                 │
│     ├── 警告用户                                            │
│     └── 提供选项: 重新生成 / 接受并标记 / 手动修改          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    周期性检查流程                            │
├─────────────────────────────────────────────────────────────┤
│  触发时机:                                                   │
│  - 每章完成: foreshadowing, hooks, arc_progression         │
│  - 每10章: wayne_principles, emotion_curve, writing_traps  │
│  - 卷完成: full_review, myth_model_check                   │
│  - 事件触发: death → no_cheap_death                        │
│                                                             │
│  输出:                                                       │
│  - 问题列表 (位置, 描述, 严重程度)                          │
│  - 通过的检查项                                              │
│  - 改进建议                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 待讨论

- [x] Schema 格式确认 → **YAML** (AI友好、人类可读)
- [x] 一致性检查全面性 → **已扩展至26项**
- [x] 生成时使用规则 → **约束注入模式**
- [x] 用户自定义规则 → **覆盖机制 + 预设系统**
- [ ] Prompt Templates 的变量语法（Liquid? Handlebars? 自定义?）
- [ ] 规则的执行方式（纯AI检查 vs 混合规则引擎）
- [ ] 检查结果的存储和追踪

---

## See Also

- [Rules/Meta.md](Rules/Meta.md) - 规则系统
- [ContextInjection.md](ContextInjection.md) - 上下文注入
- [UserConfig.md](UserConfig.md) - 用户配置
