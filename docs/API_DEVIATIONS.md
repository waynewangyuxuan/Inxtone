# API Implementation Deviations

This document records deviations between the Phase 3 API Layer implementation and the original plan.

## Overview

The API implementation follows RESTful conventions but uses query parameters for filtering instead of separate path-based endpoints in some cases. This approach provides a more flexible API surface while maintaining semantic clarity.

---

## Relationships API

### Planned
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/characters/:id/relationships` | Get relationships for a character |

### Implemented
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/relationships?characterId=:id` | Get relationships, optionally filtered by character |

### Rationale
Using query parameters on the main `/relationships` endpoint:
- Provides a single endpoint for both listing all and filtering
- Follows the pattern used by `GET /api/characters?role=:role`
- More extensible for future filter combinations

---

## Hooks API

### Planned
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/chapters/:id/hooks` | Get hooks for a chapter |

### Implemented
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hooks?chapterId=:id` | Get hooks, optionally filtered by chapter |

### Rationale
Same reasoning as Relationships - query parameter approach provides consistency and extensibility.

---

## Summary of Pattern

The implementation uses a consistent pattern across filterable resources:

| Resource | List All | Filter |
|----------|----------|--------|
| Characters | `GET /api/characters` | `GET /api/characters?role=:role` |
| Relationships | `GET /api/relationships` | `GET /api/relationships?characterId=:id` |
| Hooks | `GET /api/hooks` | `GET /api/hooks?chapterId=:id` |
| Foreshadowing | `GET /api/foreshadowing` | `GET /api/foreshadowing/active` (status filter via path) |

---

## Endpoint Count

| Category | Planned | Implemented |
|----------|---------|-------------|
| Characters | 7 | 7 |
| Relationships | 5 | 5 |
| World | 3 | 3 |
| Locations | 5 | 5 |
| Factions | 5 | 5 |
| Timeline | 3 | 3 |
| Arcs | 5 | 5 |
| Foreshadowing | 7 | 7 |
| Hooks | 5 | 5 |
| **Total** | **45** | **45** |

All planned endpoints were implemented with the query parameter adjustments noted above.

---

## Service Interface Additions

During implementation, two methods were added to `IStoryBibleService` to support the "list all" functionality:

1. `getAllRelationships(): Promise<Relationship[]>`
2. `getAllHooks(): Promise<Hook[]>`

These methods were not in the original service interface but were necessary to support the REST API pattern of listing all resources at the collection endpoint.
