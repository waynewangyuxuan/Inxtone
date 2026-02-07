# Inxtone 技术债清单

> 记录开发过程中识别的技术债务，按优先级排序

---

## Phase 1 Repository Layer 评估报告

### 📊 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 业务完整性 | ⭐⭐⭐⭐ | 覆盖 M2 核心需求，但缺少 Arc/Foreshadowing/Hook |
| 代码清晰度 | ⭐⭐⭐⭐⭐ | 命名规范、注释完整、结构一致 |
| 耦合设计 | ⭐⭐⭐ | Repository 独立，但缺少跨表协调机制 |
| 类型安全 | ⭐⭐⭐ | 有强制类型转换，JSON 解析不安全 |
| 错误处理 | ⭐⭐ | 只有基础错误，缺少错误体系 |
| 性能 | ⭐⭐⭐ | 有优化空间，但 MVP 阶段可接受 |
| 可扩展性 | ⭐⭐⭐ | 缺少分页、软删除、乐观锁 |

---

## 🔴 P0 - 必须在 M2 结束前修复

### TD-001: 缺少 ArcRepository
- **位置**: `packages/core/src/db/repositories/`
- **问题**: `IStoryBibleService` 接口定义了 Arc 相关方法，但 Repository 未实现
- **影响**: Phase 2 Service 层无法实现 Arc 功能
- **方案**: 创建 `ArcRepository.ts`，参考 FactionRepository 模式

### TD-002: 缺少 ForeshadowingRepository
- **位置**: `packages/core/src/db/repositories/`
- **问题**: 伏笔管理是 Story Bible 核心功能，Repository 未实现
- **影响**: 无法实现伏笔的 planted → hinted → resolved 生命周期
- **方案**: 创建 `ForeshadowingRepository.ts`，需要特殊方法如 `getActive()`, `resolve()`

### TD-003: 缺少 HookRepository
- **位置**: `packages/core/src/db/repositories/`
- **问题**: Hook 管理 Repository 未实现
- **影响**: 无法追踪章节钩子
- **方案**: 创建 `HookRepository.ts`

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

---

## 📋 实施计划

### M2 期间处理
- [ ] TD-001: ArcRepository（Phase 1 补充）
- [ ] TD-002: ForeshadowingRepository（Phase 1 补充）
- [ ] TD-003: HookRepository（Phase 1 补充）
- [ ] TD-004: Service 层事务处理（Phase 2）
- [ ] TD-005: 错误类型体系（Phase 2）

### M3 期间处理
- [ ] TD-006: zod JSON 验证
- [ ] TD-007: 移除强制类型转换
- [ ] TD-008: 分页支持
- [ ] TD-009: ID 生成改进

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

*最后更新: 2026-02-07*
*评估范围: M2 Phase 1 Repository Layer*
