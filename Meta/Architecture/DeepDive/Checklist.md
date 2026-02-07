# MVP Checklist

> 功能自查清单

## MVP 功能核对

| # | 功能 | 架构文档 | 状态 |
|---|------|----------|------|
| 1 | TUI 交互 | 01_INTERACTION.md | ✅ |
| 2 | Web GUI | 01_INTERACTION.md | ✅ |
| 3 | 角色管理 | BusinessLogic/ + API | ✅ |
| 4 | 世界观管理 | BusinessLogic/ + API | ✅ |
| 5 | 剧情管理 | BusinessLogic/ + API | ✅ |
| 6 | 章节编辑 | 01_INTERACTION + API | ✅ |
| 7 | AI 续写 | 03_COMPUTER_LOGIC + API | ✅ |
| 8 | AI 问答 | 03_COMPUTER_LOGIC + API | ✅ |
| 9 | 一致性检查 | BusinessLogic/ + API | ✅ |
| 10 | Wayne 原则 | BusinessLogic/ | ✅ |
| 11 | 伏笔追踪 | BusinessLogic/ | ✅ |
| 12 | 版本历史 | DataLayer/ | ✅ |
| 13 | 导出功能 | API | ✅ |
| 14 | 配置管理 | API | ✅ |
| 15 | 文件监听 | FileWatcher.md | ✅ |
| 16 | IPC 通信 | IPC.md | ✅ |
| 17 | 实时同步 | IPC.md | ✅ |
| 18 | 错误处理 | ErrorHandling.md | ✅ |
| 19 | CLI 命令 | CLI.md | ✅ |
| 20 | Context 管理 | ContextManagement.md | ✅ |

## 待补充项

| 项目 | 优先级 | 说明 |
|------|--------|------|
| **离线模式** | P2 | AI 不可用时的降级策略 |
| **多项目支持** | P2 | 项目切换、最近项目列表 |
| **数据库迁移** | P2 | 版本升级时的 schema 变更 |
| **备份恢复** | P3 | 自动备份、灾难恢复 |
| **插件系统** | P3 | 自定义规则、导出格式扩展 |
