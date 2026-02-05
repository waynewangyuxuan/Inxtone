# Regulation

> Development standards and coding conventions

**Parent**: [Core/Meta.md](Meta.md)
**Lines**: ~120 | **Updated**: 2026-02-05

---

## 1. Development Rhythm

### Milestone → Phase → Commit

- Every **Milestone** split into **Phases**
- **Commit every phase** (atomic, focused commits)
- Phase 完成后立即 commit，不要积累

### Documentation Alignment

- **Code change → Update related docs**
- 不允许 deviate from 重要文档 (Product, Architecture)
- 如有设计变更，必须先更新文档再改代码
- 相关文档必须同步更新（不能只改一个）

---

## 2. Code Style

### TypeScript

- **Strict mode** enabled (`"strict": true`)
- 禁止 `any`，必须显式类型
- Prefer `interface` over `type` for object shapes
- Use `readonly` where applicable

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/Functions | camelCase | `getUserById`, `isValid` |
| Classes/Types/Interfaces | PascalCase | `UserService`, `Character` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files | kebab-case | `user-service.ts`, `story-bible.ts` |
| Folders | kebab-case | `services/`, `utils/` |

### Formatting

- **ESLint** + **Prettier** enforced
- Import ordering: external → internal → relative
- Max line length: 100 characters
- 2 spaces indentation

---

## 3. Git Workflow

### Branching

| Prefix | Usage |
|--------|-------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring |
| `test/` | Test additions |
| `chore/` | Maintenance tasks |

Example: `feat/add-character-editor`, `fix/export-unicode-issue`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

### Pull Requests

- 必须有清晰描述
- 关联 Issue 或 Milestone task
- 不允许直接 push to `main`
- Squash merge preferred

---

## 4. Testing Requirements

### Coverage Targets

| Layer | Target |
|-------|--------|
| Services | ≥80% |
| Utils | ≥90% |
| Components | ≥70% |

### Testing Rules

- **New feature** → must have unit tests
- **Bug fix** → write failing test first, then fix
- **Refactor** → ensure existing tests pass
- Use `describe` / `it` naming: `describe('UserService')`, `it('should return user by id')`

---

## 5. Architecture Constraints

### Service Communication

- Services 之间通过 **EventBus** 通信
- 不允许 Service 直接调用另一个 Service
- Exception: Utility services (Config, Logger)

### Data Access

- 数据库操作只能在 **Repository** 层
- Services 调用 Repository，不直接操作 SQLite
- All queries must use parameterized statements (防 SQL injection)

### AI Integration

- AI 调用只能通过 **AIService**
- 其他模块不允许直接调用 Gemini API
- Context assembly 在 AIService 内部处理

### API Design

- 所有 API 必须先定义 **TypeScript interface**
- Interface 定义在 `packages/core/src/types/`
- Breaking changes require ADR

---

## 6. Internationalization

### Code & Comments

- Code and comments in **English**
- Variable names in English

### User-Facing Text

- Use i18n keys, not hardcoded strings
- Format: `t('story_bible.character.name')`

### Documentation

- 中英混合 OK
- Technical terms 保持英文

---

## 7. Dependency Management

### Adding Dependencies

- 新依赖必须说明理由 (in PR description)
- 优先选择 well-maintained 库 (check GitHub stars, last commit)
- Avoid adding dependencies for trivial tasks

### Updates

- Enable Dependabot for security updates
- Monthly dependency review
- Breaking updates require testing

---

## 8. Security

### API Keys

- Never commit API keys
- Store in `~/.inxtone/config.toml` (gitignored)
- Use environment variables in CI

### Data Privacy

- All user data stays local
- No analytics without explicit consent
- Sanitize all user inputs

---

## 9. Test-Oriented Development

### Why Test-First for Parallel Development

When multiple branches develop in parallel (via git worktree), **tests are the contract**:

- Interfaces define **what** the API looks like
- Tests define **how** it should behave
- Implementation can vary, but tests must pass

### Workflow: Phase Start Ritual

**Before writing any implementation code:**

1. **Run `/test-plan` skill** to generate test plan
2. **Define interfaces** in `packages/core/src/types/`
3. **Write test stubs** (failing tests OK at this stage)
4. **Commit**: `test(scope): add test stubs for [feature]`
5. **Then implement** until tests pass

```
┌─────────────────────────────────────────────────────────┐
│  Phase Start                                            │
├─────────────────────────────────────────────────────────┤
│  1. /test-plan → generates test cases                   │
│  2. Write interfaces (types/*.ts)                       │
│  3. Write test stubs (*.test.ts)                        │
│  4. Commit test stubs                                   │
│  5. Implement until green                               │
│  6. Commit implementation                               │
└─────────────────────────────────────────────────────────┘
```

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Unit** | `*.test.ts` next to source | Single function/class |
| **Integration** | `__tests__/integration/` | Service interactions |
| **E2E** | `__tests__/e2e/` | Full user flows |
| **Contract** | `__tests__/contracts/` | API interface compliance |

### Contract Tests (关键)

Contract tests ensure parallel branches stay compatible:

```typescript
// __tests__/contracts/character-service.contract.ts
describe('CharacterService Contract', () => {
  it('should implement ICharacterService interface', () => {
    // Type-level check - compile fails if interface changes
    const service: ICharacterService = new CharacterService(db);
    expect(service).toBeDefined();
  });

  it('should return Character type from getById', async () => {
    const result = await service.getById('test-id');
    // Runtime type validation
    expect(result).toMatchSchema(CharacterSchema);
  });
});
```

### Git Worktree Workflow

```bash
# Setup parallel development
git worktree add ../inxtone-bible  feat/m2-story-bible
git worktree add ../inxtone-write  feat/m3-writing
git worktree add ../inxtone-ai     feat/m4-ai

# Each worktree runs tests independently
cd ../inxtone-bible && pnpm test

# Before merge: run ALL tests
git checkout main
pnpm test:all
```

### Merge Criteria

Branch can only merge to main when:

- [ ] All unit tests pass
- [ ] All contract tests pass
- [ ] No type errors (`pnpm typecheck`)
- [ ] Coverage maintained (≥80% for services)

---

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Project overview and workflow
- [Labels.md](../Labels.md) - Issue/PR labeling conventions
- [../Decisions/](../Decisions/Meta.md) - Architecture decisions
