# M3 Phase 2 Code Review

> AIService + GeminiProvider + ContextBuilder + PromptAssembler — Review against docs and standards
>
> Reviewer: Claude | Date: 2026-02-08

---

## 1. 当前进度概览

**分支**: `ms3` (working tree, 未提交)

**Phase 2 新增/修改文件**:

| 文件 | 状态 | 行数 | 说明 |
|------|------|------|------|
| `core/src/ai/AIService.ts` | 新增 | 457 | 顶层编排: GeminiProvider + ContextBuilder + PromptAssembler |
| `core/src/ai/GeminiProvider.ts` | 新增 | 199 | @google/genai SDK 封装, streaming, retry, error mapping |
| `core/src/ai/ContextBuilder.ts` | 新增 | 503 | 5-layer FK-based context assembly + token budget |
| `core/src/ai/PromptAssembler.ts` | 新增 | 128 | YAML front-matter 模板解析 + {{variable}} 替换 |
| `core/src/ai/templates.ts` | 新增 | 132 | 5 个 prompt 模板 (continue/dialogue/describe/brainstorm/ask_bible) |
| `core/src/ai/tokenCounter.ts` | 新增 | 35 | CJK×1.5 + English×1.3 估算 |
| `core/src/ai/__tests__/AIService.test.ts` | 新增 | 379 | 20 tests — 端到端 (mock Gemini + real SQLite) |
| `core/src/ai/__tests__/ContextBuilder.test.ts` | 新增 | 597 | 29 tests — 5-layer + budget + format |
| `core/src/ai/__tests__/GeminiProvider.test.ts` | 新增 | 291 | 15 tests — stream/retry/error/countTokens |
| `core/src/ai/__tests__/PromptAssembler.test.ts` | 新增 | 186 | 14 tests — parse/register/assemble/list |
| `core/src/ai/__tests__/tokenCounter.test.ts` | 新增 | 64 | 10 tests — CJK/English/mixed/edge cases |
| `server/src/routes/ai.ts` | 新增 | 152 | 8 个 API 端点 (6 SSE + 2 JSON) |
| `server/src/routes/__tests__/ai.test.ts` | 新增 | 393 | 12 tests — SSE 格式/JSON/error/graceful degradation |
| `core/src/errors/index.ts` | 修改 | +20 | 新增 AIProviderError (502) |
| `core/src/services/index.ts` | 修改 | +7 | 导出 AIService, ContextBuilder, PromptAssembler, GeminiProvider |
| `server/src/index.ts` | 修改 | +69 | createServices() 工厂, AIService 初始化, CLI BYOK |
| `server/src/routes/index.ts` | 修改 | +9 | aiRoutes 注册 (optional, if aiService provided) |
| `core/package.json` | 修改 | +1 | 新增 `@google/genai` 依赖 |
| `pnpm-lock.yaml` | 修改 | +274 | lockfile 更新 |

**新增测试**: ~100 tests (AIService 20 + ContextBuilder 29 + GeminiProvider 15 + PromptAssembler 14 + tokenCounter 10 + routes 12)

---

## 2. M3.md Phase 2 Spec 对照

### GeminiProvider

| M3.md Phase 2 任务 | 状态 | 备注 |
|---------------------|------|------|
| `@google/genai` SDK integration (gemini-2.5-pro) | ✅ | model default: `gemini-2.5-pro` |
| Streaming via `generateContentStream()` | ✅ | async generator yielding AIStreamChunk |
| Rate limiting (respect API quotas) | ✅ | 3 retries + exponential backoff (1s base) |
| Error handling (auth, rate limit, content filter, network) | ✅ | 5 error categories mapped |

### ContextBuilder

| M3.md Phase 2 任务 | 状态 | 备注 |
|---------------------|------|------|
| L1 — Required: chapter content + outline + prev chapter tail | ✅ | 500 char tail, priority 1000 |
| L2 — FK expansion: characters[] → full profiles | ✅ | name, appearance, motivation, facets, voiceSamples |
| L2 — FK expansion: locations[] → descriptions | ✅ | name, type, atmosphere, significance |
| L2 — FK expansion: arcId → Arc structure + progress | ✅ | name, type, status, sections |
| L2 — FK expansion: character relationships (Scoped) | ⚠️ | 直接关系有实现，间接路径 (A→C→B) 未实现 (见 P1) |
| L3 — Plot: foreshadowingHinted[] → content | ✅ | status included |
| L3 — Plot: active foreshadowing in current Arc | ✅ | 自动去重 (排除已 hinted 的) |
| L3 — Plot: prev chapter hook → continuity | ✅ | strength 包含 |
| L4 — World rules: powerSystem.coreRules | ✅ | levels + constraints also included |
| L4 — World rules: socialRules | ✅ | key-value format |
| L5 — User-selected additional context | ✅ | priority preserved or defaults to L5_PRIORITY |
| Batch query optimization (避免 N+1) | ⚠️ | 部分实现 (见 P1) |
| Token budget management | ✅ | 994K budget, priority-based truncation |

### PromptAssembler

| M3.md Phase 2 任务 | 状态 | 备注 |
|---------------------|------|------|
| Continuation prompt template | ✅ | |
| Dialogue generation prompt template | ✅ | |
| Scene description prompt template | ✅ | |
| Brainstorm prompt template | ✅ | |
| Template variable injection | ✅ | `{{variable}}` → replace |

### API Endpoints

| M3.md Phase 2 任务 | 状态 | 备注 |
|---------------------|------|------|
| POST /api/ai/stream - streaming response (SSE) | ⚠️ | 拆分为 6 个独立端点 (见 P2 备注) |
| POST /api/ai/build-context - preview context | ✅ | POST /api/ai/context |
| GET /api/ai/providers - provider info | ✅ | |

### 额外实现 (spec 未明确但有价值)

| 功能 | 说明 |
|------|------|
| `askStoryBible()` | 新增第 5 种生成模式: 基于 World 设定的问答 |
| `complete()` | 通用补全接口, 支持自定义 context |
| `AIProviderError` | 结构化错误类型 (502) with code enum |
| `AIContextBuiltEvent` | EventBus 事件: context 构建完成时发出 |
| `createServices()` 工厂 | Server 端统一创建所有 service, 共享 DB/EventBus |
| Graceful degradation | aiService 为 optional, 无 API key 时 AI routes 不注册 |

---

## 3. 发现的问题

### 🔴 P0 — 无 (编译通过, 类型正确)

TypeScript `tsc --noEmit` 通过，无编译错误。

---

### 🟡 P1 — ContextBuilder L2 字符查询是 N+1 而非批量

**问题**: M3.md spec 明确要求 "Batch query optimization (批量查询角色/地点/伏笔，避免 N+1)"：

```
✅ 正确: 批量查询
   const chars = CharacterRepo.findByIds(chapter.characters)  // 1 次查询
```

但实际 ContextBuilder.ts 实现使用逐个查询:

```typescript
// ContextBuilder.ts L196-205
for (const charId of chapter.characters) {
  const character = this.deps.characterRepo.findById(charId);  // N 次查询
  ...
}
```

同样的问题出现在:
- `buildL2FKExpansion`: locations 逐个 `findById` (L229-245)
- `buildL3PlotAwareness`: foreshadowing 逐个 `findById` (L282-293)
- `getScopedRelationships`: 双循环 `findBetween` — O(n²) queries (L421-439)

**影响**: 当一个章节有 10 个角色 + 5 个地点 + 3 个伏笔时，需要 ~30+ 次 DB 查询，而非 spec 要求的 ~5-7 次。在 SQLite 同步模式下这不会造成性能问题 (每次查询 <1ms)，但偏离了 spec 设计。

**建议修复**: Repository 层已有 `findByIds` 模式 (如 M3.md 示例)。如果 CharacterRepository 缺少该方法，需要新增:
```typescript
findByIds(ids: CharacterId[]): Character[]
```
然后在 ContextBuilder 中批量调用。

---

### 🟡 P1 — Scoped Relationships 未实现间接路径

**问题**: M3.md spec 中的 Scoped Relationship Rules 要求:

```
A 和 D 之间无直接关系，但 A → C → D 存在间接路径 → ✅ 包含路径描述
(不拉入 C 的完整档案，只描述关系链)
```

当前实现 `getScopedRelationships()` 只查询直接关系 (both sides in chapter characters), 没有实现一跳间接路径检测。

**影响**: Context 中缺少角色间接关系信息，AI 生成时可能遗漏重要人物联系。

**评估**: 这是一个非平凡的图算法 (需要查询中间人 C 的关系)，MVP 阶段可以接受简化。但应加 TODO 注释标明。

---

### 🟡 P1 — AI_CONTEXT_BUILT 未在 BROADCAST_EVENTS 中

**问题**: `events.ts` 定义了 `AIContextBuiltEvent` 类型，AIService 代码也在 `emit`:

```typescript
self.deps.eventBus.emit({
  type: 'AI_CONTEXT_BUILT',
  ...
});
```

但 `BROADCAST_EVENTS` 数组中只有:
```
'AI_GENERATION_STARTED', 'AI_GENERATION_PROGRESS', 'AI_GENERATION_COMPLETED', 'AI_GENERATION_ERROR'
```

`AI_CONTEXT_BUILT` 缺失。

**影响**: 如果 EventBus 使用 `BROADCAST_EVENTS` 做订阅白名单过滤, 这个事件会被忽略。如果不使用白名单 (当前实现), 则无功能影响，但属于一致性缺失。

---

### 🟡 P1 — M3.md Phase 2 tasks 未打勾

**问题**: M3.md 中 Phase 2 所有 tasks 仍标记为 `- [ ]` (未完成):

```markdown
### Phase 2: AI Service (Day 6-10)
- [ ] Implement `GeminiProvider`
- [ ] Implement `ContextBuilder` (核心大脑)
...
```

Regulation.md §1 要求 "Code change → Update related docs"。

---

### 🟡 P1 — Progress.md 未记录 Phase 2

**问题**: Progress.md 顶部只有 M3 Phase 1 的记录，Phase 2 的工作尚未记录。

---

### 🟡 P1 — `complete()` 方法签名与 IAIService 接口不完全一致

**问题**: IAIService 接口定义:
```typescript
complete(prompt: string, context?: ContextItem[], options?: AIGenerationOptions): AsyncIterable<AIStreamChunk>;
```

路由中:
```typescript
// ai.ts L122
const { prompt, context, options } = request.body;
const stream = aiService.complete(prompt, context, options);
```

但 `AICompleteRequest` 中:
```typescript
export interface AICompleteRequest {
  prompt: string;
  context?: ContextItem[];  // ← ContextItem[], not string
  options?: AIGenerationOptions;
}
```

API 类型 `context` 是 `ContextItem[]`, 但 route handler 把它直接传给 `aiService.complete(prompt, context, options)`。在 AIService 实现中 complete 的第二个参数确实是 `ContextItem[] | undefined`，所以 **类型是正确的**。但 route 定义中使用了 `Body: AICompleteRequest`，而 Fastify 没有做 runtime validation (无 Zod schema)。

**影响**: Runtime 中若前端传入错误格式的 context (如 string), 不会被 Fastify 拦截, 会直接导致运行时错误。

**建议**: 为所有 AI 端点添加 Zod schema validation (与其他 Story Bible routes 一致), 或至少在 Phase 6 (Testing & Polish) 补充。

---

### 🟢 P2 — generateDialogue 中的 N+1 查询

```typescript
// AIService.ts L116-118
const characters = characterIds
  .map((id) => this.deps.characterRepo.findById(id))
  .filter((c) => c !== null)
```

同上述 ContextBuilder 的批量查询问题。角色数量通常 2-5，影响很小。

---

### 🟢 P2 — ContextBuilder.formatContext 分组不够完整

**问题**: `formatContext()` 只处理了 5 种 type: `character`, `world`, `chapter`, `outline`, `custom`。但 ContextBuilder 中对 locations 使用了 `type: 'world'`, relationships 使用了 `type: 'character'`, foreshadowing/hooks 使用了 `type: 'custom'`。

这些分类是有意为之的 (将地点归入世界规则, 关系归入角色档案)，但导致:
- 在 formatContext 中 locations 和 power system 混在 "## 世界规则" 下
- relationships 和 character profiles 混在 "## 角色档案" 下
- foreshadowing 和 hooks 混在 "## 补充信息" 下

**评估**: MVP 可接受。未来可以增加更细分的 ContextItem type (如 `'location'`, `'relationship'`, `'foreshadowing'`, `'hook'`) 提升 prompt 结构清晰度。

---

### 🟢 P2 — AI_GENERATION_COMPLETED.tokensUsed.input 始终为 0

```typescript
// AIService.ts L421-422
self.deps.eventBus.emit({
  type: 'AI_GENERATION_COMPLETED',
  tokensUsed: { input: 0, output: tokensGenerated },  // input 始终是 0
});
```

Gemini SDK 的 response 中应包含 `usageMetadata` 可以获取 input token count, 但当前实现未提取。

**评估**: 不影响功能, 但会影响后续 token 用量统计/费用追踪。MVP 可接受。

---

### 🟢 P2 — M3.md spec 中 POST /api/ai/stream 拆分为 6 个端点

M3.md 定义:
```
POST /api/ai/stream - streaming response (SSE)
```

实际实现为 6 个独立 SSE 端点:
```
POST /api/ai/continue
POST /api/ai/dialogue
POST /api/ai/describe
POST /api/ai/brainstorm
POST /api/ai/ask
POST /api/ai/complete
```

**评估**: 这是一个合理的设计改进。独立端点比单一 `/stream` + type 参数更 RESTful、更容易文档化和测试。属于正向偏离，但应更新 M3.md spec 反映实际设计。

---

### 🟢 P2 — ContextBuilder.build() 返回类型是同步的

```typescript
// ContextBuilder.ts L78
build(chapterId: ChapterId, additionalItems?: ContextItem[]): BuiltContext {
```

这是同步方法 (因为所有 Repository 操作都是同步的 better-sqlite3)。但 AIService.buildContext 接口定义为:

```typescript
// IAIService
buildContext(chapterId: ChapterId, additionalItems?: ContextItem[]): Promise<BuiltContext>;
```

AIService 实现用 `async` 包装了同步调用:
```typescript
async buildContext(chapterId: ChapterId, additionalItems?: ContextItem[]): Promise<BuiltContext> {
  return this.contextBuilder.build(chapterId, additionalItems);
}
```

**评估**: 完全正确。接口层保持 Promise 为未来异步扩展 (如 embedding 查询, 远程 DB) 留空间。

---

## 4. 技术规范符合度

| Regulation 条目 | 状态 | 说明 |
|----------------|------|------|
| §1 Milestone → Phase → Commit | ⚠️ | Phase 2 完成但未 commit |
| §1 Documentation Alignment | ❌ | M3.md tasks 未打勾, Progress.md 未更新 |
| §2 Strict mode | ✅ | `tsc --noEmit` 通过, 0 errors |
| §2 禁止 any | ✅ | 未发现 any (仅 `err: unknown` + type narrowing) |
| §2 Naming (PascalCase files) | ⚠️ | 沿用项目惯例 (PascalCase), 与 Regulation kebab-case 矛盾 |
| §4 New feature must have tests | ✅ | ~100 tests covering all new modules |
| §5 Services via EventBus | ✅ | 5 AI event types: STARTED, PROGRESS, COMPLETED, ERROR, CONTEXT_BUILT |
| §5 DB ops only in Repository | ✅ | ContextBuilder 通过 repo 层访问数据 |
| §5 Parameterized SQL | ✅ | 无直接 SQL, 全部通过 Repository |
| §5 AI only via AIService | ✅ | Gemini SDK 封装在 GeminiProvider 内, 仅 AIService 调用 |
| §9 Interface-first | ✅ | IAIService 接口在 services.ts 中定义, AIService implements 完整 |

---

## 5. 代码质量评估

### 架构设计 ✅

- **三层分离清晰**: GeminiProvider (SDK 封装) → ContextBuilder (数据组装) → PromptAssembler (模板渲染) → AIService (编排)
- **DI 注入**: 所有 Repository 通过构造函数注入, 测试友好
- **Graceful degradation**: 无 API key 时 routes 不注册, provider 返回明确错误
- **EventBus 集成**: 完整的 AI 生命周期事件链

### 测试质量 ✅

- **AIService.test.ts**: 端到端测试, 真实 SQLite + mock Gemini, 覆盖成功/失败/无 key 场景
- **ContextBuilder.test.ts**: 逐层验证 L1-L5, token budget 截断, formatContext, 全集成测试
- **GeminiProvider.test.ts**: streaming, retry (429/network), 错误映射 (auth/content filter/token limit), 空 chunk 跳过
- **PromptAssembler.test.ts**: 模板解析, 注册, 覆盖, 多变量替换, 缺失变量处理
- **tokenCounter.test.ts**: CJK/English/mixed/edge cases

### SSE 实现 ✅

- 正确的 SSE headers (`text/event-stream`, `no-cache`, `keep-alive`)
- `X-Accel-Buffering: no` 防止 nginx 代理缓冲
- 错误时优雅降级 (在流中发送 error chunk)
- `reply.raw.end()` 确保连接关闭

### 安全性 ✅

- API key 从环境变量读取, 不硬编码
- AIProviderError 不泄露 API key (只说 "Invalid API key")
- 无直接 SQL 操作, 全部参数化

---

## 6. 建议修复优先级

1. **尽快修复** (P1 — 文档/一致性):
   - 更新 M3.md Phase 2 tasks 打勾
   - 更新 Progress.md 添加 Phase 2 记录
   - 将 `AI_CONTEXT_BUILT` 加入 `BROADCAST_EVENTS`
   - 在 `getScopedRelationships` 和 characters/locations 查询添加 TODO 注释标明批量查询优化

2. **后续优化** (P2 — 可接受的技术债):
   - 间接关系路径 (A→C→B) 实现
   - Repository 层添加 `findByIds` 批量查询方法
   - AI 端点添加 Zod schema validation
   - 提取 Gemini response 中的 input token count
   - formatContext 增加更细分的 ContextItem type

---

## 7. 总体评价

**Phase 2 实现质量很高**。核心架构 (3 层 + 编排) 清晰, ContextBuilder 5-layer 设计忠实遵循 spec, 测试覆盖全面 (~100 tests), TypeScript 编译无错误, SSE 流处理正确。

**无 P0 阻断性问题**。所有 P1 都是文档同步和非功能性优化, P2 都是合理的 MVP 简化。

**与 Phase 1 的集成良好**: AIService 正确注入 WritingRepository + 所有 Story Bible repos, Server 端 `createServices()` 工厂实现了统一的依赖注入, AI routes 优雅地处理了 optional AIService 场景。

**额外价值**: `askStoryBible()` 和 `complete()` 超出原 spec 的 4 种生成模式, 为用户提供了更灵活的 AI 交互能力。`AIProviderError` 结构化错误类型为前端提供了清晰的错误处理路径。
