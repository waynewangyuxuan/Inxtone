# CLI Design

> 命令行接口设计

## 命令结构

```bash
inxtone                    # 启动 TUI（交互模式）
inxtone serve              # 启动 HTTP Server + TUI
inxtone serve --no-tui     # 仅启动 HTTP Server（headless）

# 项目管理
inxtone init [name]        # 初始化新项目
inxtone init --template xiuxian  # 使用模板
inxtone open [path]        # 打开项目

# 快捷操作（非交互）
inxtone check              # 运行一致性检查
inxtone check --fix        # 自动修复可修复的问题
inxtone export md          # 导出为 Markdown
inxtone export docx        # 导出为 Word

# Story Bible
inxtone bible list characters
inxtone bible show character lin-yi
inxtone bible search "林逸 关系"

# 写作
inxtone write              # 进入写作模式
inxtone write 42           # 直接编辑第42章

# AI
inxtone ai ask "林逸和苏瑶是什么关系？"
inxtone ai continue 42     # AI 续写第42章

# 配置
inxtone config set ai.provider claude
inxtone config get ai.model
```

## 命令实现

```typescript
// packages/tui/bin/inxtone.ts
#!/usr/bin/env node
import { Command } from 'commander'
import { render } from 'ink'
import App from '../src/App'

const program = new Command()

program
  .name('inxtone')
  .description('AI-assisted web novel writing tool')
  .version('0.1.0')

// TUI 模式（默认）
program
  .action(() => {
    render(<App />)
  })

// Server 模式
program
  .command('serve')
  .option('--no-tui', 'Run server without TUI')
  .option('-p, --port <port>', 'Server port', '3456')
  .action((options) => {
    startServer(options.port)
    if (options.tui !== false) {
      render(<App />)
    }
  })

// 检查命令
program
  .command('check')
  .option('--fix', 'Auto-fix issues')
  .action(async (options) => {
    const results = await QualityService.checkAll()
    displayResults(results)
    if (options.fix) {
      await QualityService.autoFix(results)
    }
  })

program.parse()
```
