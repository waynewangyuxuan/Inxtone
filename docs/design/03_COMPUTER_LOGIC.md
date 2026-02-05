# 03 计算逻辑层设计

> Computer Logic = How，代码实现层的架构决策

**Status**: ✅ MVP 决策已确认

---

## 架构决策

| 领域 | MVP 方案 | 未来改进 |
|------|----------|----------|
| AI 提供商 | 抽象接口，支持多个 | - |
| 本地 vs 云 | 纯云端 AI | 支持本地模型（Ollama） |
| 缓存策略 | 不缓存 | 查询类操作可缓存 |
| 搜索/索引 | 向量嵌入 + 语义搜索 | - |
| 并发 | 串行 | 并行（需处理 rate limit） |

---

## 一、AI 提供商抽象

```typescript
// 抽象接口
interface AIProvider {
  id: string
  name: string

  // 核心方法
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  stream(prompt: string, options?: CompletionOptions): AsyncIterable<string>

  // 能力查询
  capabilities: {
    maxTokens: number
    supportsStreaming: boolean
    supportsVision: boolean
  }
}

// 实现
class ClaudeProvider implements AIProvider { ... }
class OpenAIProvider implements AIProvider { ... }
class OllamaProvider implements AIProvider { ... }  // 未来

// 配置
ai_provider:
  default: claude
  providers:
    claude:
      api_key: ${ANTHROPIC_API_KEY}
      model: claude-sonnet-4-20250514
    openai:
      api_key: ${OPENAI_API_KEY}
      model: gpt-4o
```

**用户可配置**：
- 选择默认 provider
- 为不同任务指定不同 provider（如：检查用便宜模型，生成用强模型）

---

## 二、搜索与索引

### 2.1 MVP 方案：向量嵌入 + 语义搜索

```
Story Bible 内容
      ↓
   Embedding
      ↓
  向量数据库 (本地)
      ↓
  语义搜索
```

**技术选型**：
- Embedding: 使用 AI Provider 的 embedding API
- 向量存储: SQLite + sqlite-vss 或 本地文件

**索引内容**：
- 角色档案（按段落切分）
- 世界观设定
- 剧情大纲
- 章节摘要

### 2.2 查询流程

```
用户问题: "林青云和谁有仇？"
      ↓
   Embedding
      ↓
  向量相似度搜索
      ↓
  返回相关段落:
    - c001_林青云.md: "与王家有杀父之仇..."
    - c005_王天霸.md: "王家少主，与林青云..."
      ↓
  组装 Context → AI 生成回答
```

---

## 三、并发处理

### 3.1 MVP：串行

```
任务1 → 完成 → 任务2 → 完成 → 任务3
```

简单可靠，无 rate limit 问题。

### 3.2 未来改进：并行

```
任务1 ─┐
任务2 ─┼→ 并行执行 → 合并结果
任务3 ─┘
```

**需要处理**：
- Rate limit（API 调用频率限制）
- Token limit（并发请求的 token 总量）
- 错误处理（部分失败时的回滚）

**适用场景**：
- 批量一致性检查（多章节同时检查）
- 多角色对话生成（每个角色独立生成后合并）
- 头脑风暴（并行生成多个方向）

---

## 四、文件 I/O

### 4.1 项目文件结构

```
my-novel/
├── inxtone.yaml           # 项目配置
├── story-bible/
│   ├── 00_meta/           # 构思阶段
│   ├── 01_world/          # 世界观
│   ├── 02_characters/     # 人物
│   ├── 03_plot/           # 剧情
│   ├── 04_outline/        # 大纲
│   └── 05_draft/          # 草稿
├── .inxtone/
│   ├── index.db           # 本地索引（SQLite）
│   ├── vectors/           # 向量存储
│   └── cache/             # 临时缓存
└── _INDEX.md              # 人工可读索引
```

### 4.2 文件监听

- 监听 `story-bible/` 目录变化
- 文件修改时自动更新索引
- 支持外部编辑器修改（如 VS Code、Obsidian）

---

## 五、待改进清单（Future Improvements）

> 记录 MVP 中简化处理，未来可优化的点

### 5.1 高优先级

| 改进项 | 当前状态 | 改进后 | 收益 |
|--------|----------|--------|------|
| **并行 AI 调用** | 串行 | 并行 + rate limit 管理 | 批量操作速度提升 3-5x |
| **增量索引** | 全量重建 | 只索引变化的文件 | 大项目索引速度提升 |
| **流式输出** | 等待完整响应 | 逐字输出 | 用户体验提升 |

### 5.2 中优先级

| 改进项 | 当前状态 | 改进后 | 收益 |
|--------|----------|--------|------|
| **本地模型支持** | 仅云端 | 支持 Ollama/LM Studio | 离线可用、隐私保护 |
| **多语言 Embedding** | 单一模型 | 中文优化模型 | 中文搜索质量提升 |
| **查询缓存** | 无缓存 | LRU 缓存常见查询 | 重复查询响应加速 |

### 5.3 低优先级

| 改进项 | 当前状态 | 改进后 | 收益 |
|--------|----------|--------|------|
| **分布式向量存储** | 本地 SQLite | 支持远程向量数据库 | 超大型项目支持 |
| **AI 响应缓存** | 无 | 相同 prompt 缓存 | 节省 API 成本（场景有限） |

---

## 六、技术栈确认

| 层 | 技术 | 备注 |
|----|------|------|
| 语言 | TypeScript | 前后端统一 |
| TUI | Ink (React for CLI) | 或 Blessed/Blessed-contrib |
| Web | React + Vite | 轻量 |
| 数据库 | SQLite | 本地优先 |
| 向量搜索 | sqlite-vss 或 hnswlib | 本地嵌入 |
| AI SDK | Vercel AI SDK | 多 provider 抽象 |

---

*最后更新：2026-02-05*
*Status: ✅ MVP 决策已确认*
