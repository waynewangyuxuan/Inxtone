# Inxtone 技术债清单

> 记录开发过程中识别的技术债务，按优先级排序

---

## Phase 1 Repository Layer 评估报告

### 📊 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 业务完整性 | ⭐⭐⭐⭐⭐ | 完整覆盖 M2 核心需求，10 个 Repository 全部就绪 |
| 代码清晰度 | ⭐⭐⭐⭐⭐ | 命名规范、注释完整、结构一致 |
| 耦合设计 | ⭐⭐⭐ | Repository 独立，但缺少跨表协调机制 |
| 类型安全 | ⭐⭐⭐ | 有强制类型转换，JSON 解析不安全 |
| 错误处理 | ⭐⭐ | 只有基础错误，缺少错误体系 |
| 性能 | ⭐⭐⭐ | 有优化空间，但 MVP 阶段可接受 |
| 可扩展性 | ⭐⭐⭐ | 缺少分页、软删除、乐观锁 |

---

## ✅ P0 - 已修复

### TD-001: ~~缺少 ArcRepository~~ ✅ 已完成
- **解决**: 创建 `ArcRepository.ts`
- **功能**: 主线/支线 Arc 管理、角色弧线映射、进度追踪
- **完成日期**: 2026-02-07

### TD-002: ~~缺少 ForeshadowingRepository~~ ✅ 已完成
- **解决**: 创建 `ForeshadowingRepository.ts`
- **功能**: 伏笔生命周期管理 (planted → hinted → resolved/abandoned)
- **方法**: `findActive()`, `findOverdue()`, `addHint()`, `resolve()`, `abandon()`, `getStats()`
- **完成日期**: 2026-02-07

### TD-003: ~~缺少 HookRepository~~ ✅ 已完成
- **解决**: 创建 `HookRepository.ts`
- **功能**: 章节钩子管理、强度追踪
- **方法**: `findByChapter()`, `findStrong()`, `findWeak()`, `updateStrength()`, `getStats()`
- **完成日期**: 2026-02-07

---

## 🟠 P1 - 应在 M2 结束前修复

### TD-004: Repository 间缺少事务协调
- **位置**: 所有 Repository
- **问题**: 删除 Character 时需要手动调用 `RelationshipRepository.deleteByCharacter()`，无事务保障
- **影响**: 数据一致性风险，级联删除可能部分失败
- **方案**:
  ```typescript
  // 方案 A: Service 层使用 db.transaction()
  // 方案 B: 引入 UnitOfWork 模式
  // 推荐 A，在 Service 层处理
  ```

### TD-005: 错误处理体系缺失
- **位置**: 所有 Repository
- **问题**: 只有字符串 Error，无法区分错误类型
- **影响**: 上层难以做针对性错误处理
- **方案**:
  ```typescript
  // packages/core/src/errors/
  export class EntityNotFoundError extends Error {
    constructor(public entity: string, public id: string) {
      super(`${entity} ${id} not found`);
    }
  }
  export class DuplicateEntityError extends Error { ... }
  export class ValidationError extends Error { ... }
  ```

### TD-006: JSON 解析类型不安全
- **位置**: `BaseRepository.parseJson()`
- **问题**: `JSON.parse()` 返回 `any`，强制转换为 `R` 不验证结构
- **影响**: 运行时可能出现类型不匹配
- **方案**:
  ```typescript
  // 使用 zod 验证
  protected parseJson<R>(value: string | null, schema: z.ZodType<R>): R | undefined {
    if (!value) return undefined;
    try {
      return schema.parse(JSON.parse(value));
    } catch {
      return undefined;
    }
  }
  ```

### TD-007: 过多强制类型转换
- **位置**: 所有 Repository `mapRow()` 方法
- **问题**: `as CharacterId`, `as CharacterRole` 等强制转换
- **影响**: 数据库数据损坏时无法检测
- **方案**: 结合 TD-006，使用 zod schema 验证

### TD-019: errors/ 模块缺少独立单元测试
- **位置**: `packages/core/src/errors/index.ts`
- **问题**: 错误类型体系无独立测试，只通过 StoryBibleService 间接覆盖
- **影响**: `toJSON()`, `wrapError()`, type guards (`isInxtoneError` 等), `getStatusCode()`, `getErrorCode()` 未直接测试
- **方案**: 创建 `packages/core/src/errors/__tests__/index.test.ts`，覆盖所有错误类型构造、序列化、辅助函数

### TD-029: Version 实体缺少 source 字段
- **位置**: `packages/core/src/types/entities.ts` (Line 372-379)
- **问题**: TypeScript Version 实体缺少 `source` 字段，但数据库 schema 和 VersionCreatedEvent 都有
- **影响**:
  - 类型安全缺失，无法检查 source 字段使用
  - Rollback 逻辑需要区分版本来源（避免 rollback 到 rollback_backup）
  - 查询时丢失类型提示
- **方案**:
  ```typescript
  export interface Version {
    id: number;
    entityType: EntityType;
    entityId: string;
    content: unknown;
    changeSummary?: string;
    source: 'auto' | 'manual' | 'ai_backup' | 'rollback_backup'; // 添加此行
    createdAt: ISODateTime;
  }
  ```
- **相关**:
  - 数据库 Schema (正确): `packages/core/src/db/migrations/001_initial_schema.ts:361`
  - Event Type (正确): `packages/core/src/types/events.ts:481`
  - GitHub Issue: #16

---

## 🟡 P2 - 应在 M3 前修复

### TD-008: 缺少分页支持
- **位置**: 所有 `findAll()` 方法
- **问题**: 返回全部数据，大数据量时性能差
- **影响**: 100+ 角色时 UI 响应慢
- **方案**:
  ```typescript
  interface PaginationOptions {
    page?: number;
    pageSize?: number;
  }

  findAll(options?: PaginationOptions): PaginatedResult<Character> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;
    // SELECT ... LIMIT ? OFFSET ?
  }
  ```

### TD-009: ID 生成并发问题
- **位置**: `BaseRepository.generatePrefixedId()`
- **问题**: `MAX(id)` 查询在高并发下可能产生重复 ID
- **影响**: 多客户端同时创建时可能冲突
- **方案**:
  ```typescript
  // 方案 A: 使用 UUID (推荐，简单)
  // 方案 B: 使用 sequence 表 + 事务
  // 方案 C: 乐观锁重试
  ```

### TD-010: create 后额外查询
- **位置**: 所有 Repository `create()` 方法
- **问题**: `create()` 后调用 `findById()` 是额外查询
- **影响**: 每次创建多一次 DB 往返
- **方案**:
  ```typescript
  // SQLite 支持 RETURNING (3.35+)
  const row = this.db.queryOne<CharacterRow>(
    `INSERT INTO characters (...) VALUES (...) RETURNING *`,
    [...]
  );
  return this.mapRow(row!);
  ```

### TD-011: 缺少软删除
- **位置**: 所有 Repository
- **问题**: `delete()` 是硬删除，无法恢复
- **影响**: 误删除无法找回
- **方案**: 添加 `deleted_at` 字段，`findAll` 默认过滤

---

## 🟢 P3 - 可延后处理

### TD-012: SQL 注入风险
- **位置**: `BaseRepository` 构造函数
- **问题**: `tableName` 直接拼接进 SQL
- **影响**: 如果 tableName 来自用户输入可被注入（当前场景安全）
- **方案**: 白名单验证 tableName

### TD-013: FTS 搜索功能不完整
- **位置**: `CharacterRepository.search()`
- **问题**: 只搜索 name 和 appearance，不搜索 motivation 等字段
- **影响**: 搜索结果不全面
- **方案**: 扩展 FTS 索引或使用联合查询

### TD-014: findByChapter 实现不完整
- **位置**: `CharacterRepository.findByChapter()`
- **问题**: 只查询 `first_appearance`，不查询 chapters 表的 characters JSON
- **影响**: 无法获取某章节出场的所有角色
- **方案**: JOIN chapters 表或在 Service 层组合查询

### TD-015: 缺少查询结果缓存
- **位置**: 所有 Repository
- **问题**: 相同查询每次都访问数据库
- **影响**: 频繁读取时性能浪费
- **方案**: 引入简单的 LRU 缓存（M4+ 考虑）

### TD-016: 排序方向硬编码
- **位置**: 所有 `findAll()`, `findBy*()` 方法
- **问题**: `ORDER BY created_at DESC` 写死
- **影响**: 无法按其他字段或升序排列
- **方案**: 添加 `SortOptions` 参数

### TD-020: ~~errors 未从主包 index.ts 导出~~ ✅ 已修复
- **解决**: 在 `packages/core/src/index.ts` 添加 `export * from './errors/index.js'`
- **完成日期**: 2026-02-07

### TD-021: wrapError 命名与行为不一致
- **位置**: `packages/core/src/errors/index.ts` `wrapError()`
- **问题**: 当传入 `InxtoneError` 时直接原样返回，不附加新的 context 信息
- **影响**: 函数名暗示会包装错误并附加上下文，但实际未做
- **方案**: 重命名为 `ensureInxtoneError()` 更准确，或修改实现使其真正附加 context

---

## ✅ P0 - Phase 2 Code Review 已修复

### TD-017: ~~Timeline 事件类型缺失~~ ✅ 已修复
- **解决**: 添加 `TimelineEventCreatedEvent`, `TimelineEventDeletedEvent` 到 events.ts
- **完成日期**: 2026-02-07

### TD-018: ~~Foreshadowing 事件类型错误~~ ✅ 已修复
- **解决**:
  - `addForeshadowingHint()` 改为 emit `FORESHADOWING_HINT_ADDED`
  - `abandonForeshadowing()` 改为 emit `FORESHADOWING_ABANDONED`
- **完成日期**: 2026-02-07

---

## 📋 实施计划

### M2 期间处理
- [x] TD-001: ArcRepository（Phase 1 补充）✅
- [x] TD-002: ForeshadowingRepository（Phase 1 补充）✅
- [x] TD-003: HookRepository（Phase 1 补充）✅
- [x] TD-004: Service 层事务处理（Phase 2）✅
- [x] TD-005: 错误类型体系（Phase 2）✅
- [x] TD-017: Timeline 事件类型（Phase 2 Review）✅
- [x] TD-018: Foreshadowing 事件类型修正（Phase 2 Review）✅

### M3 期间处理
- [ ] TD-006: zod JSON 验证
- [ ] TD-007: 移除强制类型转换
- [ ] TD-008: 分页支持
- [ ] TD-009: ID 生成改进
- [ ] TD-019: errors/ 独立单元测试
- [x] TD-020: errors 从主包 index.ts 导出（Phase 3）✅
- [ ] TD-021: wrapError 命名/行为修正
- [ ] TD-022: 更新 03_ai_service.md Provider 配置 → Gemini 2.5 Pro only (文档已更新)
- [ ] TD-023: services.ts IAIService 接口 — MVP 实现只做 GeminiProvider，Provider 抽象保留
- [ ] TD-024: WritingGoal/WritingSession 相关接口保留但不在 M3 实现
- [ ] TD-025: Repository 层新增 `findByIds()` 批量查询方法 (Character, Location, Foreshadowing)
- [ ] TD-026: FK cleanup — 删除实体时清理章节引用 (Service 层 db.transaction)
- [ ] TD-027: RelationshipRepo 新增 `findByCharacters(ids[])` 批量查询 + Scoped Relationship 过滤
- [ ] TD-028: 02_writing_service.md — auto-save 移除，改为 manual save (文档已更新)
- [ ] TD-029: Version 实体添加 source 字段 (Issue #16)

### M4+ 处理
- [ ] TD-010 ~ TD-016

---

## 📝 代码质量备注

### ✅ 做得好的地方
1. **命名一致性**: `findById`, `findAll`, `findBy*`, `create`, `update`, `delete`
2. **关注点分离**: Row 类型 vs Entity 类型明确分离
3. **文档注释**: 每个公开方法都有 JSDoc
4. **Wayne Principles**: RelationshipRepository 完整支持 R1 检查字段
5. **单例模式**: WorldRepository 正确处理单行表

### ⚠️ 需要注意的模式
1. **Repository 只做数据访问**: 验证逻辑应在 Service 层
2. **避免 Repository 互相依赖**: 跨表操作在 Service 层协调
3. **返回 Entity 而非 Row**: mapRow 是正确的模式

---

---

## ✅ TD-004 & TD-005 已完成

### TD-004: Service 层事务处理 ✅
- **解决**: `StoryBibleService.deleteCharacter()` 使用 `db.transaction()` 包装
- **实现**: Database 依赖注入到 StoryBibleServiceDeps
- **示例**:
  ```typescript
  const result = this.deps.db.transaction(() => {
    this.deps.relationshipRepo.deleteByCharacter(id);
    this.deps.characterRepo.delete(id);
  });
  if (!result.success) {
    throw new TransactionError('Failed to delete character', result.error);
  }
  ```
- **完成日期**: 2026-02-07

### TD-005: 错误类型体系 ✅
- **解决**: 创建 `packages/core/src/errors/index.ts`
- **错误类型**:
  - `InxtoneError` - 抽象基类，含 statusCode 和 code
  - `EntityNotFoundError` (404) - 实体未找到
  - `ValidationError` (400) - 验证失败
  - `DuplicateEntityError` (409) - 重复实体
  - `InvalidOperationError` (400) - 无效操作
  - `ReferenceNotFoundError` (400) - 引用实体未找到
  - `SelfReferenceError` (400) - 自引用错误
  - `DatabaseError` (500) - 数据库错误
  - `TransactionError` (500) - 事务错误
- **特性**:
  - HTTP 状态码映射，便于 API 层处理
  - `toJSON()` 方法用于 API 响应序列化
  - 类型守卫函数便于错误检测
- **完成日期**: 2026-02-07

---

## 🔮 Phase 3 准备 - Server Package 评估

### 📊 当前状态
- **路径**: `packages/server/`
- **框架**: Fastify 4.x
- **现有功能**:
  - `/api/health` - 健康检查
  - `/api` - API 信息
  - 静态文件服务 (SPA 支持)
- **依赖**: `@fastify/cors`, `@fastify/static`, `@fastify/websocket`

### 📋 Phase 3 所需结构

```
packages/server/src/
├── index.ts              # 主入口 (已有)
├── routes/
│   ├── index.ts          # 路由注册
│   ├── storyBible.ts     # Story Bible API
│   ├── writing.ts        # Writing API (M3)
│   └── health.ts         # 健康检查 (从 index.ts 抽取)
├── handlers/
│   └── storyBible/       # Story Bible 处理器
│       ├── characters.ts
│       ├── relationships.ts
│       ├── locations.ts
│       └── ...
├── middleware/
│   ├── errorHandler.ts   # 错误处理 (使用 TD-005 错误类型)
│   └── validation.ts     # 请求验证
├── schemas/              # Fastify JSON Schema
│   ├── storyBible.ts
│   └── common.ts
└── plugins/
    └── database.ts       # 数据库插件 (DI)
```

### ✅ 就绪项
1. **错误类型系统**: `InxtoneError` 带 statusCode，可直接映射 HTTP 状态
2. **服务层**: `StoryBibleService` 41 个方法完整实现
3. **事务支持**: 复杂操作有原子性保障
4. **Fastify**: 已配置 CORS、静态文件、WebSocket

### 🎯 Phase 3 首要任务
1. 创建 routes 目录结构
2. 实现 errorHandler middleware
3. 实现 Story Bible API endpoints
4. 添加请求验证 schemas

---

*最后更新: 2026-02-07*
*评估范围: M2 Phase 1–3 (Repository + Service + API)*
*Phase 1 P0 技术债: 3/3 已完成 ✅*
*Phase 2 P0 技术债: 2/2 已完成 ✅*
*Phase 2 Code Review P0: 2/2 已修复 ✅*
*Phase 3 修复: TD-020 ✅*
*剩余 M3 处理: TD-006, TD-007, TD-008, TD-009, TD-019, TD-021*
*详细报告: CODE_REVIEW_M2_PHASE2.md*
