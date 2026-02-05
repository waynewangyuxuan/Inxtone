# Labels

> GitHub label conventions for issues and PRs

---

## Type Labels

| Label | Color | Description |
|-------|-------|-------------|
| `bug` | `#d73a4a` | Something isn't working |
| `feat` | `#0e8a16` | New feature or request |
| `docs` | `#0075ca` | Documentation improvements |
| `chore` | `#fef2c0` | Maintenance and tooling |
| `refactor` | `#7057ff` | Code improvement without feature change |
| `test` | `#1d76db` | Testing improvements |
| `perf` | `#f9d0c4` | Performance improvements |

## Priority Labels

| Label | Color | Description |
|-------|-------|-------------|
| `priority: critical` | `#b60205` | Must be fixed immediately |
| `priority: high` | `#d93f0b` | Important, address soon |
| `priority: medium` | `#fbca04` | Normal priority |
| `priority: low` | `#0e8a16` | Nice to have |

## Status Labels

| Label | Color | Description |
|-------|-------|-------------|
| `status: blocked` | `#d93f0b` | Waiting on external dependency |
| `status: in-progress` | `#1d76db` | Currently being worked on |
| `status: review` | `#7057ff` | Ready for review |
| `status: needs-info` | `#fbca04` | Requires more information |

## Milestone Labels

| Label | Color | Description |
|-------|-------|-------------|
| `m1` | `#c5def5` | Milestone 1: Project Scaffolding |
| `m2` | `#c5def5` | Milestone 2: TBD |
| `m3` | `#c5def5` | Milestone 3: TBD |

## Area Labels

| Label | Color | Description |
|-------|-------|-------------|
| `area: cli` | `#d4c5f9` | CLI/TUI related |
| `area: web` | `#d4c5f9` | Web UI related |
| `area: core` | `#d4c5f9` | Core library |
| `area: ai` | `#d4c5f9` | AI integration |
| `area: database` | `#d4c5f9` | Database/persistence |

---

## Usage

### Creating Issues
1. Add exactly one **type** label
2. Add one **priority** label
3. Add one **milestone** label if applicable
4. Add **area** labels as needed

### Pull Requests
1. Add matching **type** label from linked issue
2. Add `status: review` when ready
3. Remove status label after merge
