# Project Structure

> 项目文件结构

```
inxtone/
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── packages/
│   │
│   ├── core/                        # 核心业务逻辑
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   │
│   │   │   ├── services/            # 服务层
│   │   │   │   ├── StoryBibleService.ts
│   │   │   │   ├── WritingService.ts
│   │   │   │   ├── QualityService.ts
│   │   │   │   ├── AIService.ts
│   │   │   │   ├── SearchService.ts
│   │   │   │   ├── ConfigService.ts
│   │   │   │   ├── ExportService.ts
│   │   │   │   └── ProjectService.ts
│   │   │   │
│   │   │   ├── repositories/        # 数据访问层
│   │   │   │   ├── CharacterRepository.ts
│   │   │   │   ├── ChapterRepository.ts
│   │   │   │   ├── WorldRepository.ts
│   │   │   │   ├── PlotRepository.ts
│   │   │   │   ├── CheckResultRepository.ts
│   │   │   │   ├── VersionRepository.ts
│   │   │   │   └── EmbeddingRepository.ts
│   │   │   │
│   │   │   ├── ai/                  # AI 相关
│   │   │   │   ├── providers/
│   │   │   │   │   ├── AIProvider.ts        # 抽象接口
│   │   │   │   │   ├── ClaudeProvider.ts
│   │   │   │   │   └── OpenAIProvider.ts
│   │   │   │   ├── ContextBuilder.ts
│   │   │   │   └── PromptTemplates.ts
│   │   │   │
│   │   │   ├── rules/               # 业务规则（Data Driven）
│   │   │   │   ├── default/
│   │   │   │   │   ├── consistency.yaml
│   │   │   │   │   ├── wayne-principles.yaml
│   │   │   │   │   └── pacing.yaml
│   │   │   │   ├── RuleEngine.ts
│   │   │   │   └── RuleLoader.ts
│   │   │   │
│   │   │   ├── schemas/             # 数据结构定义
│   │   │   │   ├── Character.ts
│   │   │   │   ├── World.ts
│   │   │   │   ├── Plot.ts
│   │   │   │   ├── Chapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── db/                  # 数据库
│   │   │   │   ├── schema.sql
│   │   │   │   ├── migrations/
│   │   │   │   └── Database.ts
│   │   │   │
│   │   │   └── events/              # 事件系统
│   │   │       ├── EventBus.ts
│   │   │       └── events.ts
│   │   │
│   │   └── tests/
│   │
│   ├── ui/                          # 共享 UI 组件
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   ├── story-bible/
│   │   │   │   ├── writing/
│   │   │   │   ├── ai/
│   │   │   │   ├── quality/
│   │   │   │   ├── config/
│   │   │   │   └── common/
│   │   │   │
│   │   │   ├── hooks/               # 共享 Hooks
│   │   │   │   ├── useCharacters.ts
│   │   │   │   ├── useChapters.ts
│   │   │   │   ├── useAI.ts
│   │   │   │   └── useConfig.ts
│   │   │   │
│   │   │   └── styles/              # 共享样式
│   │   │       ├── variables.css
│   │   │       ├── components.css
│   │   │       └── theme.ts
│   │   │
│   │   └── tests/
│   │
│   ├── web/                         # Web GUI
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── pages/               # 页面
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StoryBible/
│   │   │   │   ├── Writing/
│   │   │   │   ├── Quality/
│   │   │   │   ├── Settings/
│   │   │   │   └── Export.tsx
│   │   │   │
│   │   │   ├── api/                 # API Client
│   │   │   │   └── client.ts
│   │   │   │
│   │   │   └── router.tsx
│   │   │
│   │   └── public/
│   │
│   ├── tui/                         # TUI
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.tsx
│   │   │   ├── App.tsx
│   │   │   └── screens/
│   │   └── bin/
│   │       └── inxtone.ts           # CLI 入口
│   │
│   └── server/                      # HTTP Server (for Web GUI)
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── storyBible.ts
│       │   │   ├── writing.ts
│       │   │   ├── quality.ts
│       │   │   ├── ai.ts
│       │   │   ├── config.ts
│       │   │   └── export.ts
│       │   └── middleware/
│       └── tests/
│
├── templates/                       # 项目模板
│   ├── default/
│   │   └── template.yaml
│   └── xiuxian/
│       └── template.yaml
│
└── docs/
    └── design/                      # 设计文档（当前）
```
