# ADR-0005: Simplify IExportService Interface for M5

- **Status**: Accepted
- **Date**: 2026-02-13
- **Deciders**: Wayne

## Context

M5 (Export) implements the `IExportService` interface defined during M1 (types/services.ts:793-868). The original interface was designed with several features that are premature for the MVP export milestone:

1. **Template system** (`getTemplates`, `previewTemplate`) — requires Nunjucks templating engine, template directory structure, and template configuration. No user has asked for custom templates yet.
2. **Pre-export checks** (`runPreExportChecks`) — depends on QualityService which doesn't exist until M7.
3. **PDF format** — requires puppeteer or a headless browser, adding ~300MB to the dependency tree.
4. **Progress callbacks** (`exportWithProgress`) — adds complexity; exports for typical web novel projects (< 500 chapters) complete in under 5 seconds.
5. **File path output** (`outputPath` in ExportOptions) — the API should return a buffer/string, not write to disk. The CLI can write to disk, but that's a CLI concern, not a service concern.
6. **Range by start/end** (`chapterStart`/`chapterEnd`) — chapters don't have sequential IDs; `chapterIds[]` is more flexible and correct.

The question: **should we implement the full interface with stubs, or simplify to what M5 actually needs?**

## Decision

Simplify `IExportService` to contain only what M5 delivers:

```typescript
export type ExportFormat = 'md' | 'txt' | 'docx';  // no 'pdf'

export interface ExportRange {
  type: 'all' | 'volume' | 'chapters';
  volumeId?: VolumeId;
  chapterIds?: ChapterId[];  // was chapterStart/chapterEnd
}

export interface ExportOptions {
  format: ExportFormat;
  range: ExportRange;
  includeOutline?: boolean;
  includeMetadata?: boolean;
  // removed: template, outputPath
}

export interface BibleExportOptions {
  sections?: Array<'characters' | 'relationships' | 'world' | 'locations' |
    'factions' | 'arcs' | 'foreshadowing' | 'hooks'>;
}

export interface ExportResult {
  data: Buffer | string;  // NEW: return data, not file path
  filename: string;
  mimeType: string;
}

export interface IExportService {
  exportChapters(options: ExportOptions): Promise<ExportResult>;
  exportStoryBible(options?: BibleExportOptions): Promise<ExportResult>;
  // removed: exportWithProgress, getTemplates, previewTemplate, runPreExportChecks
}
```

### Key changes from original interface

| Aspect | Original | M5 Simplified |
|--------|----------|---------------|
| Formats | `md \| txt \| docx \| pdf` | `md \| txt \| docx` |
| Range | `chapterStart` / `chapterEnd` | `chapterIds[]` |
| Output | `outputPath: string` → returns file path | Returns `ExportResult { data, filename, mimeType }` |
| Templates | `getTemplates()`, `previewTemplate()` | Removed — hardcoded formatters |
| Checks | `runPreExportChecks()` | Removed — depends on QualityService (M7) |
| Progress | `exportWithProgress(onProgress)` | Removed — fast enough without |
| Bible | Implicit in `exportChapters` | Dedicated `exportStoryBible()` with section filter |

### Deferred items tracked as GitHub issues

- **PDF Export** — add when a real user requests it; needs headless browser dependency decision
- **Export Template System** — Nunjucks-based customizable templates; add when users want output customization
- **Pre-Export Checks** — integrate with QualityService in M7

## Alternatives Considered

### Alternative 1: Implement full interface with stubs

- **Pros**: No interface change needed; stubs throw "not implemented" errors
- **Cons**: Dead code in production; `ExportFormat` includes `pdf` that can never be used; `outputPath` forces wrong architecture (service writes files instead of returning data); consumers must handle `ExportProgress` callbacks they don't need
- **Why not**: Stub interfaces create false APIs that consumers might depend on. Better to ship a clean, small interface and extend it when real features arrive.

### Alternative 2: Keep original interface, implement everything

- **Pros**: Feature-complete export system from day 1
- **Cons**: PDF adds ~300MB dependency (puppeteer); template system adds 500+ lines of code for a feature nobody has requested; pre-export checks can't work without QualityService; adds ~1.5 weeks to M5 timeline
- **Why not**: Violates YAGNI. Ship what's needed, extend when demand exists.

## Consequences

### Positive

- M5 scope is clean and achievable in ~1 week
- No dead code or stub methods in production
- `ExportResult` return type is correct for both API (send buffer) and CLI (write to disk) use cases
- `chapterIds[]` range is more flexible than start/end
- Interface can be extended in future milestones without breaking changes

### Negative

- Original IExportService in types/services.ts must be replaced (small breaking change, but no consumers exist yet)
- PDF export users must wait until a future milestone
- No template customization until a future milestone

### Risks

- **Future interface expansion**: Adding `pdf`, templates, or checks later may require interface changes. Mitigation: TypeScript interfaces are additive — new methods can be added without breaking existing consumers.
- **DOCX formatting limitations**: Without templates, DOCX formatting is hardcoded. Mitigation: The hardcoded format covers 90% of use cases (clean headings, page breaks, readable paragraphs).

## Related

- [M5.md](../Milestone/M5.md) — Export milestone plan
- [09_export_service.md](../Modules/09_export_service.md) — Original export module design (template system, PDF)
- [ADR-0003](ADR-0003-milestone-reorder-smart-intake.md) — Milestone reorder that made M5 export-focused
