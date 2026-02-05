# Test Plan Skill

> Generate test plan before starting a milestone phase

## Trigger

Use this skill when:
- Starting a new milestone or phase
- Before implementing any new feature
- User says `/test-plan` or "plan tests for..."

## Workflow

### 1. Gather Context

Read the relevant documents:
- Current milestone: `Meta/Milestone/M{N}.md`
- Module design: `Meta/Modules/{module}_service.md`
- Architecture: `Meta/Architecture/05_ARCHITECTURE.md`
- Interfaces: `packages/core/src/types/` (if exists)

### 2. Identify Test Scope

For the target phase/feature, identify:

| Category | Questions |
|----------|-----------|
| **Interfaces** | What TypeScript interfaces need to be defined? |
| **Units** | What functions/methods need unit tests? |
| **Integration** | What service interactions need testing? |
| **Contracts** | What API contracts must be verified? |
| **Edge Cases** | What error conditions must be handled? |

### 3. Generate Test Plan

Output format:

```markdown
## Test Plan: [Phase/Feature Name]

### Interfaces to Define

| Interface | Location | Description |
|-----------|----------|-------------|
| ICharacterService | types/character.ts | Character CRUD operations |
| Character | types/character.ts | Character entity type |

### Unit Tests

| Test File | Test Cases |
|-----------|------------|
| character-service.test.ts | - should create character with valid data |
|                           | - should throw on duplicate name |
|                           | - should update character fields |

### Integration Tests

| Test File | Scenario |
|-----------|----------|
| character-flow.test.ts | Create → Update → Delete lifecycle |

### Contract Tests

| Contract | Verifies |
|----------|----------|
| ICharacterService | All methods return correct types |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty name | Throw ValidationError |
| Name > 100 chars | Truncate or reject |
```

### 4. Create Test Stubs

Offer to create test stub files:

```typescript
// character-service.test.ts
import { describe, it, expect } from 'vitest';
import { CharacterService } from './character-service';

describe('CharacterService', () => {
  describe('create', () => {
    it.todo('should create character with valid data');
    it.todo('should throw on duplicate name');
  });

  describe('update', () => {
    it.todo('should update character fields');
  });
});
```

## Output Location

Test plan should be saved to:
- `Meta/Milestone/M{N}-phase-{X}-tests.md` (for milestone phases)
- Or displayed in chat for quick reference

## Example Invocation

```
User: /test-plan for M2 Phase 1 (Character CRUD)