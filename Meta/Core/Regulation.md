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

## See Also

- [CLAUDE.md](../../CLAUDE.md) - Project overview and workflow
- [Labels.md](../Labels.md) - Issue/PR labeling conventions
- [../Decisions/](../Decisions/Meta.md) - Architecture decisions
