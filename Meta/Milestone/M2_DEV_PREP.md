# M2 开发准备文档

> Story Bible Core - Phase-by-Phase 实现指南

**生成日期**: 2026-02-06
**依赖**: M1 (Foundation) ✓

---

## 概览

M2 的核心目标是实现 Story Bible 功能，包括：
- Character 管理（CRUD + 搜索）
- World 设置（规则、力量体系）
- Location 管理
- Faction 管理
- Relationship 管理（含 Wayne Principles）

### 数据流

```
Web UI / CLI
     ↓
   API Layer (Fastify)
     ↓
   StoryBibleService
     ↓
   Repository Layer
     ↓
   Database (SQLite)
     ↓
   EventBus (emit events)
```

### 文件结构预览

```
packages/
├── core/src/
│   ├── db/
│   │   └── repositories/           # [Phase 1] 新建
│   │       ├── index.ts
│   │       ├── CharacterRepository.ts
│   │       ├── RelationshipRepository.ts
│   │       ├── WorldRepository.ts
│   │       ├── LocationRepository.ts
│   │       └── FactionRepository.ts
│   └── services/                   # [Phase 2] 新建
│       ├── index.ts
│       ├── StoryBibleService.ts
│       └── EventBus.ts
├── server/src/
│   └── routes/                     # [Phase 3] 新建
│       ├── index.ts
│       ├── characters.ts
│       ├── relationships.ts
│       ├── world.ts
│       ├── locations.ts
│       └── factions.ts
├── web/src/
│   ├── stores/                     # [Phase 4] 新建
│   │   ├── useCharacterStore.ts
│   │   ├── useWorldStore.ts
│   │   └── useRelationshipStore.ts
│   ├── hooks/                      # [Phase 4] 新建
│   │   ├── useCharacters.ts
│   │   ├── useWorld.ts
│   │   └── useRelationships.ts
│   ├── pages/
│   │   └── StoryBible/             # [Phase 4] 新建
│   │       ├── index.tsx
│   │       ├── CharacterList.tsx
│   │       ├── CharacterDetail.tsx
│   │       ├── CharacterForm.tsx
│   │       ├── WorldSettings.tsx
│   │       ├── LocationList.tsx
│   │       ├── FactionList.tsx
│   │       └── RelationshipList.tsx
│   └── components/
│       └── forms/                  # [Phase 4] 共享组件
│           ├── Input.tsx
│           ├── Select.tsx
│           ├── Textarea.tsx
│           └── Modal.tsx
└── tui/src/
    └── commands/                   # [Phase 5] 新建
        └── bible.ts
```

---

## Phase 1: Repository Layer (Day 1-4)

### 1.1 创建 Repository 基类

**文件**: `packages/core/src/db/repositories/BaseRepository.ts`

```typescript
import type { Database } from '../Database.js';
import type { ISODateTime } from '../../types/entities.js';

export abstract class BaseRepository<T, ID> {
  constructor(
    protected db: Database,
    protected tableName: string
  ) {}

  protected now(): ISODateTime {
    return new Date().toISOString();
  }

  protected generateId(prefix: string): string {
    // 从数据库获取当前最大ID，生成下一个
    const result = this.db.queryOne<{ maxNum: number }>(
      `SELECT MAX(CAST(SUBSTR(id, ${prefix.length + 1}) AS INTEGER)) as maxNum FROM ${this.tableName}`
    );
    const nextNum = (result?.maxNum ?? 0) + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }
}
```

### 1.2 CharacterRepository

**文件**: `packages/core/src/db/repositories/CharacterRepository.ts`

**接口方法对应**:

| Service Method | Repository Method | SQL |
|----------------|-------------------|-----|
| `createCharacter()` | `create()` | `INSERT INTO characters` |
| `getCharacter()` | `findById()` | `SELECT * FROM characters WHERE id = ?` |
| `getAllCharacters()` | `findAll()` | `SELECT * FROM characters` |
| `getCharactersByRole()` | `findByRole()` | `SELECT * FROM characters WHERE role = ?` |
| `updateCharacter()` | `update()` | `UPDATE characters SET ... WHERE id = ?` |
| `deleteCharacter()` | `delete()` | `DELETE FROM characters WHERE id = ?` |
| `searchCharacters()` | `search()` | `SELECT * FROM characters_fts WHERE characters_fts MATCH ?` |

**关键实现**:

```typescript
export class CharacterRepository extends BaseRepository<Character, CharacterId> {
  constructor(db: Database) {
    super(db, 'characters');
  }

  create(input: CreateCharacterInput): Character {
    const id = this.generateId('C');
    const now = this.now();

    this.db.run(`
      INSERT INTO characters (
        id, name, role, appearance, voice_samples,
        motivation, conflict_type, template, first_appearance,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      input.name,
      input.role,
      input.appearance ?? null,
      input.voiceSamples ? JSON.stringify(input.voiceSamples) : null,
      input.motivation ? JSON.stringify(input.motivation) : null,
      input.conflictType ?? null,
      input.template ?? null,
      input.firstAppearance ?? null,
      now,
      now,
    ]);

    return this.findById(id)!;
  }

  search(query: string): Character[] {
    // 使用 FTS5 搜索
    const rows = this.db.query<CharacterRow>(`
      SELECT c.* FROM characters c
      JOIN characters_fts fts ON c.rowid = fts.rowid
      WHERE characters_fts MATCH ?
    `, [query]);
    return rows.map(this.mapRow);
  }

  private mapRow(row: CharacterRow): Character {
    return {
      id: row.id,
      name: row.name,
      role: row.role as CharacterRole,
      appearance: row.appearance ?? undefined,
      voiceSamples: row.voice_samples ? JSON.parse(row.voice_samples) : undefined,
      motivation: row.motivation ? JSON.parse(row.motivation) : undefined,
      conflictType: row.conflict_type as ConflictType ?? undefined,
      template: row.template as CharacterTemplate ?? undefined,
      facets: row.facets ? JSON.parse(row.facets) : undefined,
      arc: row.arc ? JSON.parse(row.arc) : undefined,
      firstAppearance: row.first_appearance ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

### 1.3 RelationshipRepository

**关键点**:
- `source_id` 和 `target_id` 外键约束
- `disagree_scenarios` 和 `leave_scenarios` 是 JSON 数组
- 需要实现 `getForCharacter(characterId)` - 获取角色的所有关系（作为 source 或 target）

### 1.4 WorldRepository

**特殊处理**:
- World 表只有一行 (`id = 'main'`)
- 使用 `UPSERT` 模式

```typescript
updateWorld(input: Partial<World>): World {
  // 检查是否存在
  const existing = this.findById('main');

  if (!existing) {
    // 创建
    this.db.run(`
      INSERT INTO world (id, power_system, social_rules, created_at, updated_at)
      VALUES ('main', ?, ?, ?, ?)
    `, [
      input.powerSystem ? JSON.stringify(input.powerSystem) : null,
      input.socialRules ? JSON.stringify(input.socialRules) : null,
      this.now(),
      this.now(),
    ]);
  } else {
    // 更新
    this.db.run(`
      UPDATE world SET
        power_system = COALESCE(?, power_system),
        social_rules = COALESCE(?, social_rules),
        updated_at = ?
      WHERE id = 'main'
    `, [
      input.powerSystem ? JSON.stringify(input.powerSystem) : null,
      input.socialRules ? JSON.stringify(input.socialRules) : null,
      this.now(),
    ]);
  }

  return this.findById('main')!;
}
```

### 1.5 LocationRepository & FactionRepository

类似 CharacterRepository，使用 `L` 和 `F` 前缀生成 ID。

### 1.6 测试计划

**文件**: `packages/core/src/db/repositories/__tests__/`

每个 Repository 需要测试:
- [ ] CRUD 基本操作
- [ ] 边界情况（不存在的 ID）
- [ ] JSON 字段序列化/反序列化
- [ ] 搜索功能（CharacterRepository）
- [ ] 外键约束（RelationshipRepository）

---

## Phase 2: Service Layer (Day 5-8)

### 2.1 EventBus 实现

**文件**: `packages/core/src/services/EventBus.ts`

```typescript
import type { IEventBus, EventHandler, Unsubscribe } from '../types/services.js';
import type { AppEvent, EventMeta } from '../types/events.js';
import { randomUUID } from 'crypto';

export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private anyHandlers = new Set<EventHandler>();

  on<T>(eventType: string, handler: EventHandler<T>): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  onAny(handler: EventHandler): Unsubscribe {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  off<T>(eventType: string, handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler as EventHandler);
  }

  emit<T extends { type: string }>(event: T): void {
    const eventWithMeta = this.addMeta(event);

    // 类型特定处理器
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(eventWithMeta);
      }
    }

    // 通用处理器
    for (const handler of this.anyHandlers) {
      handler(eventWithMeta);
    }
  }

  async emitAsync<T extends { type: string }>(event: T): Promise<void> {
    const eventWithMeta = this.addMeta(event);

    const promises: Promise<void>[] = [];

    const handlers = this.handlers.get(event.type);
    if (handlers) {
      for (const handler of handlers) {
        const result = handler(eventWithMeta);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    for (const handler of this.anyHandlers) {
      const result = handler(eventWithMeta);
      if (result instanceof Promise) {
        promises.push(result);
      }
    }

    await Promise.all(promises);
  }

  private addMeta<T extends { type: string }>(event: T): T & EventMeta {
    return {
      ...event,
      _id: randomUUID(),
      _timestamp: Date.now(),
    };
  }
}
```

### 2.2 StoryBibleService 实现

**文件**: `packages/core/src/services/StoryBibleService.ts`

**依赖注入模式**:

```typescript
export interface StoryBibleServiceDeps {
  characterRepo: CharacterRepository;
  relationshipRepo: RelationshipRepository;
  worldRepo: WorldRepository;
  locationRepo: LocationRepository;
  factionRepo: FactionRepository;
  eventBus: IEventBus;
}

export class StoryBibleService implements IStoryBibleService {
  constructor(private deps: StoryBibleServiceDeps) {}

  // === Characters ===

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    // 1. 验证输入
    this.validateCharacterInput(input);

    // 2. 创建角色
    const character = this.deps.characterRepo.create(input);

    // 3. 发送事件
    this.deps.eventBus.emit({
      type: 'CHARACTER_CREATED',
      character,
    });

    return character;
  }

  async getCharacterWithRelations(id: CharacterId): Promise<CharacterWithRelations | null> {
    const character = this.deps.characterRepo.findById(id);
    if (!character) return null;

    const relationships = this.deps.relationshipRepo.getForCharacter(id);

    // 获取目标角色名称
    const relationshipsWithNames = relationships.map(rel => {
      const targetId = rel.sourceId === id ? rel.targetId : rel.sourceId;
      const target = this.deps.characterRepo.findById(targetId);
      return {
        ...rel,
        targetName: target?.name ?? 'Unknown',
      };
    });

    return {
      ...character,
      relationships: relationshipsWithNames,
    };
  }

  // === Relationships ===

  async createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
    // 验证角色存在
    const source = this.deps.characterRepo.findById(input.sourceId);
    const target = this.deps.characterRepo.findById(input.targetId);

    if (!source) throw new Error(`Source character ${input.sourceId} not found`);
    if (!target) throw new Error(`Target character ${input.targetId} not found`);

    const relationship = this.deps.relationshipRepo.create(input);

    this.deps.eventBus.emit({
      type: 'RELATIONSHIP_CREATED',
      relationship,
    });

    return relationship;
  }

  // ... 其他方法
}
```

### 2.3 验证逻辑

**Character 验证**:
- `name` 必填，不能为空
- `role` 必须是有效枚举值
- `conflictType` 和 `template` 如果提供必须是有效枚举值

**Relationship 验证**:
- `sourceId` 和 `targetId` 不能相同
- 两个角色之间只能有一个关系（UNIQUE 约束）

### 2.4 测试计划

**文件**: `packages/core/src/services/__tests__/StoryBibleService.test.ts`

- [ ] Character CRUD + 事件发送
- [ ] Relationship 创建验证
- [ ] getCharacterWithRelations 正确加载关系
- [ ] World upsert 逻辑
- [ ] 错误处理（角色不存在等）

---

## Phase 3: API Layer (Day 9-11)

### 3.1 路由结构

**文件**: `packages/server/src/routes/characters.ts`

```typescript
import { FastifyPluginAsync } from 'fastify';
import type { StoryBibleService } from '@inxtone/core/services';
import type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  GetCharactersQuery,
  ApiResponse,
  ApiErrorResponse,
} from '@inxtone/core';

interface CharacterRoutesDeps {
  storyBibleService: StoryBibleService;
}

export const characterRoutes = (deps: CharacterRoutesDeps): FastifyPluginAsync => {
  return async (fastify) => {
    // GET /api/characters
    fastify.get<{
      Querystring: GetCharactersQuery;
    }>('/', async (request) => {
      const { role, search } = request.query;

      let characters;
      if (search) {
        characters = await deps.storyBibleService.searchCharacters(search);
      } else if (role) {
        characters = await deps.storyBibleService.getCharactersByRole(role);
      } else {
        characters = await deps.storyBibleService.getAllCharacters();
      }

      return { success: true, data: characters } as ApiResponse<typeof characters>;
    });

    // GET /api/characters/:id
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const character = await deps.storyBibleService.getCharacter(request.params.id);

      if (!character) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Character not found' },
        } as ApiErrorResponse);
      }

      return { success: true, data: character } as ApiResponse<typeof character>;
    });

    // POST /api/characters
    fastify.post<{
      Body: CreateCharacterRequest;
    }>('/', async (request, reply) => {
      try {
        const character = await deps.storyBibleService.createCharacter(request.body);
        return reply.status(201).send({
          success: true,
          data: character,
        } as ApiResponse<typeof character>);
      } catch (error) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error instanceof Error ? error.message : 'Invalid input',
          },
        } as ApiErrorResponse);
      }
    });

    // PATCH /api/characters/:id
    fastify.patch<{
      Params: { id: string };
      Body: UpdateCharacterRequest;
    }>('/:id', async (request, reply) => {
      try {
        const character = await deps.storyBibleService.updateCharacter(
          request.params.id,
          request.body
        );
        return { success: true, data: character } as ApiResponse<typeof character>;
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: error.message },
          } as ApiErrorResponse);
        }
        throw error;
      }
    });

    // DELETE /api/characters/:id
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      await deps.storyBibleService.deleteCharacter(request.params.id);
      return { success: true, data: { deleted: true } };
    });

    // GET /api/characters/:id/relations
    fastify.get<{
      Params: { id: string };
    }>('/:id/relations', async (request, reply) => {
      const result = await deps.storyBibleService.getCharacterWithRelations(request.params.id);

      if (!result) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Character not found' },
        } as ApiErrorResponse);
      }

      return { success: true, data: result };
    });
  };
};
```

### 3.2 路由注册

**文件**: `packages/server/src/routes/index.ts`

```typescript
import { FastifyPluginAsync } from 'fastify';
import { characterRoutes } from './characters.js';
import { relationshipRoutes } from './relationships.js';
import { worldRoutes } from './world.js';
import { locationRoutes } from './locations.js';
import { factionRoutes } from './factions.js';

export interface RouteDeps {
  storyBibleService: StoryBibleService;
}

export const registerRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  return async (fastify) => {
    // Story Bible routes
    await fastify.register(characterRoutes(deps), { prefix: '/api/characters' });
    await fastify.register(relationshipRoutes(deps), { prefix: '/api/relationships' });
    await fastify.register(worldRoutes(deps), { prefix: '/api/world' });
    await fastify.register(locationRoutes(deps), { prefix: '/api/locations' });
    await fastify.register(factionRoutes(deps), { prefix: '/api/factions' });
  };
};
```

### 3.3 API 端点完整列表

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/characters` | List all, filter by role, search |
| GET | `/api/characters/:id` | Get by ID |
| GET | `/api/characters/:id/relations` | Get with relationships |
| POST | `/api/characters` | Create |
| PATCH | `/api/characters/:id` | Update |
| DELETE | `/api/characters/:id` | Delete |
| GET | `/api/relationships` | List all, filter by characterId |
| POST | `/api/relationships` | Create |
| PATCH | `/api/relationships/:id` | Update |
| DELETE | `/api/relationships/:id` | Delete |
| GET | `/api/world` | Get world settings |
| PATCH | `/api/world` | Update world settings |
| GET | `/api/locations` | List all |
| GET | `/api/locations/:id` | Get by ID |
| POST | `/api/locations` | Create |
| PATCH | `/api/locations/:id` | Update |
| DELETE | `/api/locations/:id` | Delete |
| GET | `/api/factions` | List all |
| GET | `/api/factions/:id` | Get by ID |
| POST | `/api/factions` | Create |
| PATCH | `/api/factions/:id` | Update |
| DELETE | `/api/factions/:id` | Delete |

### 3.4 测试计划

**文件**: `packages/server/src/routes/__tests__/`

使用 `fastify.inject()` 进行 API 测试:

- [ ] 每个端点的成功响应
- [ ] 404 错误响应
- [ ] 400 验证错误响应
- [ ] Response 格式符合 `ApiResponse<T>` / `ApiErrorResponse`

---

## Phase 4: Web UI (Day 12-17)

### 4.1 State Management

**使用 Zustand + React Query**:

- **Zustand**: 客户端状态（当前选中角色、表单状态、UI 状态）
- **React Query**: 服务端状态（数据获取、缓存、更新）

**文件**: `packages/web/src/stores/useCharacterStore.ts`

```typescript
import { create } from 'zustand';
import type { CharacterId } from '@inxtone/core';

interface CharacterStore {
  selectedId: CharacterId | null;
  isFormOpen: boolean;
  editingId: CharacterId | null;

  selectCharacter: (id: CharacterId | null) => void;
  openForm: (editId?: CharacterId) => void;
  closeForm: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  selectedId: null,
  isFormOpen: false,
  editingId: null,

  selectCharacter: (id) => set({ selectedId: id }),
  openForm: (editId) => set({ isFormOpen: true, editingId: editId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingId: null }),
}));
```

**文件**: `packages/web/src/hooks/useCharacters.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Character, CreateCharacterRequest, UpdateCharacterRequest } from '@inxtone/core';

const API_BASE = '/api';

export function useCharacters(options?: { role?: string; search?: string }) {
  return useQuery({
    queryKey: ['characters', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.role) params.set('role', options.role);
      if (options?.search) params.set('search', options.search);

      const res = await fetch(`${API_BASE}/characters?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data as Character[];
    },
  });
}

export function useCharacter(id: string | null) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/characters/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data as Character;
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCharacterRequest) => {
      const res = await fetch(`${API_BASE}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data as Character;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCharacterRequest }) => {
      const res = await fetch(`${API_BASE}/characters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
      return data.data as Character;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.setQueryData(['characters', data.id], data);
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/characters/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
```

### 4.2 组件结构

**Character List Page**:

```
StoryBible/
├── index.tsx              # 主页面，Tab 导航
├── CharacterList.tsx      # 角色列表（Grid/List 视图切换）
├── CharacterCard.tsx      # 角色卡片
├── CharacterDetail.tsx    # 角色详情面板
├── CharacterForm.tsx      # 创建/编辑表单（Modal）
├── WorldSettings.tsx      # 世界设置页
├── LocationList.tsx       # 地点列表
├── FactionList.tsx        # 势力列表
└── RelationshipList.tsx   # 关系列表
```

**共享组件**:

```
components/
├── forms/
│   ├── Input.tsx          # 文本输入
│   ├── Select.tsx         # 下拉选择
│   ├── Textarea.tsx       # 多行文本
│   ├── FormField.tsx      # 表单字段包装器（label + error）
│   └── Modal.tsx          # 模态框
├── ui/
│   ├── Button.tsx         # 按钮
│   ├── Card.tsx           # 卡片容器
│   ├── Badge.tsx          # 标签
│   ├── Tabs.tsx           # Tab 导航
│   └── ConfirmDialog.tsx  # 确认对话框
└── layout/
    └── ... (M1 已创建)
```

### 4.3 页面设计

**Story Bible 主页 (`/story-bible`)**:

```
┌─────────────────────────────────────────────────────────┐
│ Story Bible                                              │
├───────┬───────┬──────────┬──────────┬──────────────────┤
│ 角色  │ 世界  │ 地点     │ 势力     │ 关系            │
├───────┴───────┴──────────┴──────────┴──────────────────┤
│                                                         │
│  [Tab 内容区域]                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**角色列表**:

```
┌─────────────────────────────────────────────────────────┐
│ 角色 (12)                         [+新建] [Grid] [List] │
├────────────────────────────────┬────────────────────────┤
│                                │                        │
│  ┌──────────┐ ┌──────────┐    │  角色详情              │
│  │  Avatar  │ │  Avatar  │    │                        │
│  │  张三    │ │  李四    │    │  名称: 张三            │
│  │  主角    │ │  配角    │    │  类型: 主角            │
│  └──────────┘ └──────────┘    │  模版: avenger         │
│                                │                        │
│  ┌──────────┐ ┌──────────┐    │  动机                  │
│  │  Avatar  │ │  Avatar  │    │  - 表面: ...           │
│  │  王五    │ │  赵六    │    │  - 深层: ...           │
│  │  反派    │ │  提及    │    │                        │
│  └──────────┘ └──────────┘    │  [编辑] [删除]         │
│                                │                        │
└────────────────────────────────┴────────────────────────┘
```

### 4.4 样式规范

遵循 `Meta/Design/Foundations.md`:

- 深色主题 (`--black`, `--gray-900` 背景)
- Gold 强调色 (`--gold-500` 用于 active、hover)
- 字体: Inter (UI), JetBrains Mono (代码)
- 间距: 4px 基准单位

### 4.5 测试计划

- [ ] 组件渲染测试 (React Testing Library)
- [ ] Hook 测试 (使用 MSW mock API)
- [ ] 表单验证测试
- [ ] 交互测试（选中、打开/关闭模态框）

---

## Phase 5: CLI Commands (Day 18-19)

### 5.1 命令结构

**文件**: `packages/tui/src/commands/bible.ts`

```typescript
import { Command } from 'commander';
import type { StoryBibleService } from '@inxtone/core/services';

export function createBibleCommand(storyBibleService: StoryBibleService): Command {
  const bible = new Command('bible')
    .description('Story Bible management');

  bible
    .command('list <type>')
    .description('List entities (characters, locations, factions)')
    .option('-r, --role <role>', 'Filter characters by role')
    .action(async (type, options) => {
      switch (type) {
        case 'characters':
          const characters = options.role
            ? await storyBibleService.getCharactersByRole(options.role)
            : await storyBibleService.getAllCharacters();
          // 格式化输出
          printCharacters(characters);
          break;
        case 'locations':
          const locations = await storyBibleService.getAllLocations();
          printLocations(locations);
          break;
        case 'factions':
          const factions = await storyBibleService.getAllFactions();
          printFactions(factions);
          break;
        default:
          console.error(`Unknown type: ${type}`);
      }
    });

  bible
    .command('show <type> <id>')
    .description('Show entity details')
    .action(async (type, id) => {
      // ... 实现
    });

  bible
    .command('search <query>')
    .description('Search across Story Bible')
    .action(async (query) => {
      const results = await storyBibleService.searchCharacters(query);
      printCharacters(results);
    });

  return bible;
}
```

### 5.2 输出格式

使用 `chalk` 和 `cli-table3` 美化输出:

```
┌─────┬──────────┬────────┬─────────────────┐
│ ID  │ Name     │ Role   │ Template        │
├─────┼──────────┼────────┼─────────────────┤
│ C001│ 张三     │ main   │ avenger         │
│ C002│ 李四     │ support│ guardian        │
└─────┴──────────┴────────┴─────────────────┘
```

---

## Phase 6: Testing & Polish (Day 20-21)

### 6.1 E2E 测试

**文件**: `packages/e2e/src/story-bible.test.ts`

```typescript
describe('Story Bible E2E', () => {
  test('Create character → verify in DB → verify in UI', async () => {
    // 1. 通过 API 创建角色
    const createRes = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Character',
        role: 'main',
      }),
    });
    const { data: character } = await createRes.json();
    expect(character.id).toBeDefined();

    // 2. 验证数据库
    const getRes = await fetch(`/api/characters/${character.id}`);
    const { data: fetched } = await getRes.json();
    expect(fetched.name).toBe('Test Character');

    // 3. 验证 UI (Playwright/Cypress)
    await page.goto('/story-bible');
    await expect(page.locator(`text=Test Character`)).toBeVisible();
  });

  test('Update world → verify changes persist', async () => {
    // ...
  });
});
```

### 6.2 性能测试

```typescript
test('Search performance with 100+ characters', async () => {
  // 创建 100 个角色
  for (let i = 0; i < 100; i++) {
    await storyBibleService.createCharacter({
      name: `Character ${i}`,
      role: 'supporting',
    });
  }

  // 测试搜索性能
  const start = performance.now();
  const results = await storyBibleService.searchCharacters('Character 5');
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100); // < 100ms
  expect(results.length).toBeGreaterThan(0);
});
```

### 6.3 发布检查清单

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] E2E 测试通过
- [ ] TypeScript 无错误
- [ ] ESLint 无警告
- [ ] API 文档更新
- [ ] 更新 M2.md 状态为 Active

---

## 技术注意事项

### 1. JSON 字段处理

SQLite 存储 JSON 时需要 `JSON.stringify()` / `JSON.parse()`:

```typescript
// 写入
this.db.run('INSERT INTO characters (motivation) VALUES (?)', [
  input.motivation ? JSON.stringify(input.motivation) : null
]);

// 读取
const character = {
  ...row,
  motivation: row.motivation ? JSON.parse(row.motivation) : undefined,
};
```

### 2. 事件命名规范

遵循 `events.ts` 定义:

```typescript
// ✅ 正确
this.eventBus.emit({ type: 'CHARACTER_CREATED', character });

// ❌ 错误 - 不在 AppEvent union 中
this.eventBus.emit({ type: 'CharacterCreated', character });
```

### 3. API Response 格式

所有 API 响应必须符合 `api.ts` 定义:

```typescript
// ✅ 成功响应
{ success: true, data: character }

// ✅ 错误响应
{ success: false, error: { code: 'NOT_FOUND', message: 'Character not found' } }

// ❌ 错误 - 不符合格式
{ character: {...} }
{ error: 'Not found' }
```

### 4. React Query Key 规范

```typescript
// Entity list
queryKey: ['characters']
queryKey: ['characters', { role: 'main' }]

// Single entity
queryKey: ['characters', id]

// Relations
queryKey: ['characters', id, 'relations']
```

---

## 依赖安装

M2 开始前需要安装的新依赖:

```bash
# Web package
pnpm --filter @inxtone/web add @tanstack/react-query zustand

# TUI package (如果需要)
pnpm --filter @inxtone/tui add cli-table3 chalk
```

---

## 参考文档

- [M2.md](./M2.md) - Milestone 详细计划
- [entities.ts](../../packages/core/src/types/entities.ts) - Entity 类型定义
- [services.ts](../../packages/core/src/types/services.ts) - Service 接口定义
- [api.ts](../../packages/core/src/types/api.ts) - API 类型定义
- [events.ts](../../packages/core/src/types/events.ts) - Event 类型定义
- [Foundations.md](../Design/Foundations.md) - 设计规范
