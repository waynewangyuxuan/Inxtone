# 🛠️ 设置指南

本文档帮助你完成新项目的初始化设置。

---

## 第一步：创建项目

### 方式A：GitHub Template（推荐）

1. 访问 [inkstone 模板仓库](https://github.com/YOUR_USERNAME/inkstone)
2. 点击右上角绿色按钮 **"Use this template"**
3. 选择 **"Create a new repository"**
4. 填写仓库名称（建议用小说名或代号，如 `novel-project-alpha`）
5. 选择 Public 或 Private
6. 点击 **"Create repository"**

### 方式B：手动复制

```bash
# Clone模板
git clone https://github.com/YOUR_USERNAME/inkstone.git my-novel

# 进入目录
cd my-novel

# 删除原有git历史，重新初始化
rm -rf .git
git init

# 首次提交
git add .
git commit -m "Initial commit from inkstone template"

# 连接到你的新仓库
git remote add origin https://github.com/YOUR_USERNAME/my-novel.git
git push -u origin main
```

---

## 第二步：项目初始化

### 2.1 更新项目信息

打开 `_STATUS.md`，更新：
- 项目名称
- 开始日期
- 当前阶段

### 2.2 确认创作原则

打开 `00_meta/guardrails.md`，阅读Wayne原则：
- 如果完全认同，保持原样
- 如果有调整，在"本项目特别注意事项"部分记录

### 2.3 准备AI协作环境

推荐使用以下AI工具之一：
- **Claude** (推荐) — 支持长上下文，适合读取多个文件
- **GPT-4** — 同样支持长上下文
- **其他支持长文本的LLM**

---

## 第三步：开始Phase 1

### 3.1 阅读指南

打开 `_guides/00_meta_guide.md`，了解构思阶段的要求。

### 3.2 使用AI协作

打开 `_guides/AI_PROMPTS.md`，找到"项目启动"部分的提示词：

```
我正在使用网文创作Playbook开始一个新项目。

请阅读以下文件了解框架：
- PLAYBOOK_INDEX.md（总览）
- _guides/00_meta_guide.md（第一阶段指南）

现在请帮我完成 00_meta/concept.md 的填写。

我的初步想法是：
[在此描述你的创意]
```

### 3.3 完成构思文件

按顺序完成：
1. `00_meta/concept.md` — 核心创意
2. `00_meta/guardrails.md` — 确认创作红线
3. `00_meta/references.md` — 参考作品分析（可选但建议）

### 3.4 通过检查点

完成后，对照 `_guides/00_meta_guide.md` 中的"检查点"部分自检。

---

## 工作流速查

### 日常写作流程

```
1. 打开 _STATUS.md 确认当前进度
2. 阅读对应的 _guides/XX_guide.md
3. 使用 AI_PROMPTS.md 中的提示词与AI协作
4. 完成工作后更新：
   - _STATUS.md（进度）
   - _INDEX.md（如有新实体）
   - _chapter_log.md（如完成章节）
```

### 阶段推进流程

```
1. 完成当前阶段所有产出
2. 对照指南中的"检查点"自检
3. 更新 _STATUS.md 标记阶段完成
4. 阅读下一阶段的指南
5. 开始下一阶段
```

### 提交习惯建议

```bash
# 完成一个阶段时
git add .
git commit -m "Complete Phase X: [阶段名称]"

# 完成重要文件时
git add 02_characters/c001_主角.md
git commit -m "Add protagonist character card"

# 完成若干章节时
git add 05_draft/
git commit -m "Draft chapters 11-15"
```

---

## 文件夹用途速查

| 文件夹 | 用途 | 何时使用 |
|--------|------|----------|
| `_guides/` | 治理文档，只读参考 | 每个阶段开始时阅读 |
| `00_meta/` | 项目元信息 | Phase 1 |
| `01_world/` | 世界观设定 | Phase 2 |
| `02_characters/` | 人物档案 | Phase 3 |
| `03_plot/` | 剧情规划 | Phase 4 |
| `04_outline/` | 大纲 | Phase 5 |
| `05_draft/` | 草稿 | Phase 6 |
| `_archive/` | 废弃内容 | 随时 |

---

## 常见问题

### Q: 可以跳过某个阶段吗？

**A**: 不建议。每个阶段都有其目的：
- 跳过P1可能导致方向不清
- 跳过P2可能导致世界观崩坏
- 跳过P3可能导致人物单薄

如果你已经有现成的设定，可以快速填写而不是跳过。

### Q: 可以同时进行多个阶段吗？

**A**: P1-P3可以有一定重叠（构思时自然会想到人物），但建议：
- P1完成后再正式开始P2
- P3完成后再开始P4
- P5完成后再开始P6

### Q: 模板文件可以修改吗？

**A**:
- `_guides/` 下的文件建议保持原样，作为参考
- 其他文件夹下的模板文件随意修改

### Q: 写到一半发现前面有问题怎么办？

**A**:
- 小问题：直接修改，记录在 `_archive/`
- 大问题：暂停当前阶段，回到对应阶段修复

### Q: 如何与他人协作？

**A**:
- 使用GitHub的PR/Issue功能
- 建议：一人负责一个阶段或一组章节
- 定期同步 `_INDEX.md` 和 `_STATUS.md`

---

## 下一步

1. ✅ 完成项目创建
2. ✅ 阅读本设置指南
3. 👉 打开 [PLAYBOOK_INDEX.md](./PLAYBOOK_INDEX.md) 开始创作

---

*祝创作顺利！🪨*
