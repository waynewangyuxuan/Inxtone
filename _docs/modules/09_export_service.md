# ExportService 模块设计

> 导出功能：多格式导出、模板渲染

---

## 一、模块职责

| 子功能 | 说明 |
|--------|------|
| **格式导出** | Markdown、TXT、DOCX |
| **范围选择** | 全书、单卷、指定章节 |
| **模板渲染** | 可自定义的导出模板 |
| **Story Bible 导出** | 角色/设定汇总导出 |

---

## 二、支持的导出格式

| 格式 | 扩展名 | 用途 | 依赖 |
|------|--------|------|------|
| **Markdown** | .md | 纯文本、Git 友好 | 无 |
| **Plain Text** | .txt | 最简单、通用 | 无 |
| **Word** | .docx | 投稿、排版 | docx |
| **PDF** | .pdf | 最终版本 | puppeteer (可选) |

---

## 三、核心工作流

### 3.1 导出章节内容

```
用户选择: 导出 → Markdown → 第1-50章
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 收集导出参数                          │
│                                         │
│    ExportOptions {                      │
│      format: 'markdown',                │
│      range: { start: 1, end: 50 },     │
│      template: 'default',               │
│      includeOutline: true,              │
│      includeMetadata: false,            │
│      outputPath: '/path/to/output'      │
│    }                                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. ExportService.export(options)        │
│    │                                     │
│    ├─→ 发送 EXPORT_STARTED 事件         │
│    │                                     │
│    ├─→ 加载章节数据                      │
│    │   chapters = db.findChapters(      │
│    │     where: { id: 1..50 }           │
│    │   )                                │
│    │                                     │
│    ├─→ 加载卷信息                        │
│    │   volumes = db.findVolumes()       │
│    │                                     │
│    └─→ 按卷分组章节                      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 加载并渲染模板                        │
│                                         │
│    template = loadTemplate('default')   │
│                                         │
│    for volume in volumes:               │
│      output += renderVolume(volume)     │
│      for chapter in volume.chapters:    │
│        output += renderChapter(chapter) │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 写入文件                              │
│                                         │
│    Markdown: 单文件或按卷分文件         │
│    DOCX: 生成 Word 文档                 │
│    TXT: 纯文本                          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 5. 完成                                  │
│    - 发送 EXPORT_COMPLETED 事件         │
│    - 返回导出路径                       │
└─────────────────────────────────────────┘
```

### 3.2 导出 Story Bible

```
用户选择: 导出 Story Bible
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 收集数据                              │
│                                         │
│    characters = StoryBible.getCharacters()│
│    world = StoryBible.getWorld()        │
│    arcs = StoryBible.getArcs()          │
│    foreshadowing = StoryBible.getForeshadowing()│
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 渲染为 Markdown                       │
│                                         │
│    # Story Bible: 《我的小说》          │
│                                         │
│    ## 角色                              │
│    ### 主要角色                         │
│    #### 林逸                            │
│    - 角色定位: 主角                     │
│    - 原型: 探寻者                       │
│    ...                                  │
│                                         │
│    ## 世界观                            │
│    ### 力量体系                         │
│    ...                                  │
│                                         │
│    ## 剧情大纲                          │
│    ### 第一卷: 觉醒                     │
│    ...                                  │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 输出                                  │
│    - 单个 story-bible.md 文件           │
│    - 或 story-bible/ 目录结构           │
└─────────────────────────────────────────┘
```

---

## 四、导出模板系统

### 4.1 模板目录结构

```
templates/
├── export/
│   ├── default/
│   │   ├── template.yaml    # 模板配置
│   │   ├── book.md.njk      # 全书模板
│   │   ├── volume.md.njk    # 卷模板
│   │   ├── chapter.md.njk   # 章节模板
│   │   └── story-bible.md.njk
│   │
│   ├── publish/             # 投稿用
│   │   ├── template.yaml
│   │   └── ...
│   │
│   └── print/               # 打印用
│       └── ...
```

### 4.2 模板配置

```yaml
# templates/export/default/template.yaml
id: default
name:
  zh: 默认模板
  en: Default Template
description:
  zh: 适合日常导出的简洁模板
  en: Clean template for everyday export

# 文件结构
structure:
  type: single_file  # single_file | multi_file | directory
  filename: "{{project.name}}.md"

# 章节格式
chapter:
  show_number: true
  number_format: "第{{number}}章"  # 或 "Chapter {{number}}"
  title_separator: " "

# 卷格式
volume:
  show_number: true
  number_format: "第{{number}}卷"
  include_summary: true

# 其他选项
options:
  include_toc: true       # 目录
  include_metadata: false # 元数据
  line_breaks: double     # single | double
```

### 4.3 Nunjucks 模板示例

```njk
{# chapter.md.njk #}
{% if config.chapter.show_number %}
## {{ config.chapter.number_format | replace("{{number}}", chapter.number) }}{{ config.chapter.title_separator }}{{ chapter.title }}
{% else %}
## {{ chapter.title }}
{% endif %}

{% if config.options.include_metadata %}
> 字数: {{ chapter.word_count }} | 状态: {{ chapter.status }}
{% endif %}

{{ chapter.content }}

{% if config.options.line_breaks == 'double' %}

{% endif %}
```

---

## 五、格式特定处理

### 5.1 Markdown 导出

```
特点:
  - 最简单，直接拼接
  - 保留标题层级
  - 可选包含目录

输出示例:
┌─────────────────────────────────────────┐
│ # 我的小说                              │
│                                         │
│ ## 目录                                 │
│ - [第一卷 觉醒](#第一卷-觉醒)          │
│   - [第1章 命运的开始](#第1章-命运的开始)│
│   - [第2章 初入江湖](#第2章-初入江湖)   │
│ ...                                     │
│                                         │
│ ## 第一卷 觉醒                          │
│                                         │
│ ### 第1章 命运的开始                    │
│ 正文内容...                             │
└─────────────────────────────────────────┘
```

### 5.2 DOCX 导出

```typescript
import { Document, Paragraph, HeadingLevel, Packer } from 'docx'

function exportToDocx(chapters: Chapter[], options: ExportOptions) {
  const doc = new Document({
    sections: [{
      children: [
        // 标题
        new Paragraph({
          text: options.title,
          heading: HeadingLevel.TITLE
        }),

        // 章节
        ...chapters.flatMap(chapter => [
          new Paragraph({
            text: `第${chapter.number}章 ${chapter.title}`,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true  // 每章新页
          }),
          ...chapter.content.split('\n\n').map(para =>
            new Paragraph({
              text: para,
              spacing: { after: 200 }
            })
          )
        ])
      ]
    }]
  })

  return Packer.toBuffer(doc)
}
```

### 5.3 TXT 导出

```
特点:
  - 纯文本，无格式
  - 用空行分隔段落
  - 章节标题用特殊格式

输出示例:
┌─────────────────────────────────────────┐
│ 【第一卷 觉醒】                          │
│                                         │
│ ======== 第1章 命运的开始 ========       │
│                                         │
│ 正文第一段...                           │
│                                         │
│ 正文第二段...                           │
│                                         │
│ ======== 第2章 初入江湖 ========         │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## 六、导出前检查

```
导出前自动执行:
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 一致性检查                            │
│    - 如有 Error 级别问题 → 警告用户     │
│    - 用户可选择继续或取消               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. 未完成章节检查                        │
│    - 列出 status != 'final' 的章节      │
│    - 提示用户确认                       │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. 伏笔检查                              │
│    - 列出未收割的伏笔                   │
│    - 提示用户注意                       │
└─────────────────────────────────────────┘
```

---

## 七、与其他模块的交互

| 交互模块 | 方向 | 场景 |
|----------|------|------|
| **WritingService** | ← | 获取章节内容 |
| **StoryBibleService** | ← | 获取 Story Bible 数据 |
| **QualityService** | ← | 导出前检查 |
| **EventBus** | → | 发送导出事件 |
| **ConfigService** | ← | 获取导出配置 |

---

## 八、关键设计决策

### 8.1 为什么用 Nunjucks 模板

```
选项:
  - Handlebars: 简单但功能有限
  - EJS: 太灵活，安全风险
  - Nunjucks: 功能强大，安全

选择: Nunjucks

理由:
  1. 支持模板继承
  2. 支持 filter
  3. 安全 (默认转义)
  4. Jinja2 语法，熟悉度高
```

### 8.2 大文件导出优化

```
问题: 百万字小说导出可能 OOM

解决:
  1. 流式处理 (Stream)
  2. 分批加载章节 (每次 50 章)
  3. DOCX 使用临时文件

示例:
  const outputStream = fs.createWriteStream(path)
  for (const batch of chunkArray(chapters, 50)) {
    const content = renderBatch(batch)
    outputStream.write(content)
  }
  outputStream.end()
```

---

## 九、错误处理

| 错误场景 | 处理 |
|----------|------|
| 磁盘空间不足 | 提前检查，提示用户 |
| 模板渲染失败 | 回退到默认模板 |
| DOCX 生成失败 | 提示依赖问题，建议 Markdown |
| 部分章节缺失 | 警告并继续，标记缺失位置 |

---

*Review 重点: 模板系统设计、大文件优化、导出前检查*
