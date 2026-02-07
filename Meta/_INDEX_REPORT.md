# Index Report

> Auto-generated documentation compliance report

**Generated**: 2026-02-05
**Total Documents**: 65 (44 original + 21 from BusinessLogic split)
**Compliant**: 49 | **Over Limit**: 15

---

## Length Limits

| Category | Max Lines | Count |
|----------|-----------|-------|
| Index (Meta.md) | 50 | 12 ✓ |
| Overview | 150 | 8 ✓ |
| Detail | 50 | varies |

---

## Recently Split Documents

### ✅ ~~Architecture/02_BUSINESS_LOGIC.md~~ → BusinessLogic/ (21 files) — *原文件已删除*

| File | Lines | Status |
|------|-------|--------|
| BusinessLogic/Meta.md | ~50 | ✓ Index |
| BusinessLogic/Overview.md | ~80 | ✓ Overview |
| BusinessLogic/Schemas/Meta.md | ~30 | ✓ Index |
| BusinessLogic/Schemas/Character.md | ~60 | ✓ Detail |
| BusinessLogic/Schemas/Relationship.md | ~30 | ✓ Detail |
| BusinessLogic/Schemas/World.md | ~50 | ✓ Detail |
| BusinessLogic/Schemas/Plot.md | ~50 | ✓ Detail |
| BusinessLogic/Schemas/Chapter.md | ~45 | ✓ Detail |
| BusinessLogic/Rules/Meta.md | ~30 | ✓ Index |
| BusinessLogic/Rules/WaynePrinciples.md | ~70 | ✓ Detail |
| BusinessLogic/Rules/B20Checklist.md | ~60 | ✓ Detail |
| BusinessLogic/Rules/ConsistencyRules.md | ~150 | ✓ Overview (atomic YAML) |
| BusinessLogic/Rules/GenerationConstraints.md | ~140 | ✓ Overview (atomic YAML) |
| BusinessLogic/Templates/Meta.md | ~25 | ✓ Index |
| BusinessLogic/Templates/AIPrompts.md | ~120 | ✓ Overview (atomic YAML) |
| BusinessLogic/Templates/DocumentTemplates.md | ~80 | ✓ Overview |
| BusinessLogic/Workflows/Meta.md | ~25 | ✓ Index |
| BusinessLogic/Workflows/SixPhase.md | ~90 | ✓ Overview |
| BusinessLogic/Workflows/StateMachines.md | ~45 | ✓ Detail |
| BusinessLogic/ContextInjection.md | ~130 | ✓ Overview (atomic YAML) |
| BusinessLogic/UserConfig.md | ~150 | ✓ Overview |
| BusinessLogic/Summary.md | ~50 | ✓ Detail |

---

## Compliant Documents (≤150 lines)

| File | Lines | Status |
|------|-------|--------|
| Meta/Meta.md | 41 | ✓ Index |
| Meta/Progress.md | 33 | ✓ Log |
| Meta/Todo.md | 37 | ✓ Log |
| Meta/Labels.md | 68 | ✓ Overview |
| Meta/Core/Meta.md | 27 | ✓ Index |
| Meta/Core/Regulation.md | 49 | ✓ Detail |
| Meta/Core/Technical.md | 40 | ✓ Detail |
| Meta/Core/Product/Meta.md | 34 | ✓ Index |
| Meta/Core/Product/Overview.md | 79 | ✓ Overview |
| Meta/Core/Product/Features.md | 98 | ✓ Overview |
| Meta/Core/Product/MVP.md | 80 | ✓ Overview |
| Meta/Core/Product/Appendix.md | 79 | ✓ Overview |
| Meta/Design/Meta.md | 43 | ✓ Index |
| Meta/Design/Foundations.md | 120 | ✓ Overview |
| Meta/Design/Patterns.md | 122 | ✓ Overview |
| Meta/Architecture/Meta.md | 67 | ✓ Index |
| Meta/Modules/Meta.md | 84 | ⚠️ Index (over 50) |
| Meta/Decisions/Meta.md | 40 | ✓ Index |
| Meta/Decisions/_TEMPLATE.md | 40 | ✓ Template |
| Meta/Decisions/ADR-0001-tech-stack.md | 70 | ✓ ADR |
| Meta/Milestone/Meta.md | 48 | ✓ Index |
| Meta/Milestone/_TEMPLATE.md | 54 | ⚠️ Template (over 50) |
| Meta/Milestone/M1.md | 97 | ✓ Overview |

---

## Over Limit Documents (>150 lines)

These documents need further splitting using doc-split skill:

| File | Lines | Action Required |
|------|-------|-----------------|
| **Core/Product/Technical.md** | 158 | ⚠️ Slightly over |
| **Core/Product/UserStories.md** | 182 | Split by category |
| **Core/Product/Interfaces.md** | 227 | Has ASCII blocks |
| **Design/Animation.md** | 160 | ⚠️ Slightly over |
| **Design/Components.md** | 245 | Split by component type |
| **Architecture/01_INTERACTION.md** | 248 | Split into TUI/WebGUI |
| ~~**Architecture/02_BUSINESS_LOGIC.md**~~ | ~~1639~~ | ✅ **SPLIT COMPLETE, 原文件已删除** |
| **Architecture/03_COMPUTER_LOGIC.md** | 208 | Split into AI/Search |
| **Architecture/04_DATA_LAYER.md** | 848 | **HIGH PRIORITY** |
| **Architecture/05_ARCHITECTURE.md** | 745 | **HIGH PRIORITY** |
| **Architecture/06_ARCHITECTURE_DEEP_DIVE.md** | 697 | **HIGH PRIORITY** |
| **Modules/01_story_bible_service.md** | 250 | Split into CRUD/Relations |
| **Modules/02_writing_service.md** | 287 | Split sections |
| **Modules/03_ai_service.md** | 363 | Split sections |
| **Modules/04_quality_service.md** | 357 | Split sections |
| **Modules/05_search_service.md** | 349 | Split sections |
| **Modules/06_rule_engine.md** | 435 | Split sections |
| **Modules/07_file_watcher.md** | 437 | Split sections |
| **Modules/08_event_bus.md** | 394 | Split sections |
| **Modules/09_export_service.md** | 405 | Split sections |
| **Modules/10_database.md** | 520 | **HIGH PRIORITY** |

---

## Splitting Priority

### Immediate (>500 lines)
1. ~~`02_BUSINESS_LOGIC.md` (1639)~~ → ✅ BusinessLogic/ folder **DONE, 原文件已删除**
2. `04_DATA_LAYER.md` (848) → DataLayer/ folder
3. `05_ARCHITECTURE.md` (745) → ModuleDesign/ folder
4. `06_ARCHITECTURE_DEEP_DIVE.md` (697) → DeepDive/ folder
5. `10_database.md` (520) → Database/ folder

### High (300-500 lines)
- All module docs (10 files)

### Medium (150-300 lines)
- Product/Interfaces.md (has ASCII diagrams - atomic blocks)
- Product/UserStories.md
- Design/Components.md

---

## Notes

- Documents containing ASCII diagrams may legitimately exceed limits
- Atomic blocks (code, diagrams) count as single units
- CHANGELOG.md and Progress.md exempt from limits (append-only logs)

---

## See Also

- [doc-split skill](/Users/waynewang/.claude/skills/doc-split/SKILL.md) - Splitting rules
- [Todo.md](Todo.md) - Task backlog with splitting items
