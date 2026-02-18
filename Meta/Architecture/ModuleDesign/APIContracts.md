# API Contracts

> GUI ↔ Service 通信契约

**通信方式**: HTTP API（Web GUI）/ Direct Import（TUI）

## Story Bible API

```typescript
interface StoryBibleAPI {
  // Characters
  getCharacters(): Promise<Character[]>
  getCharacter(id: string): Promise<Character>
  createCharacter(data: CreateCharacterInput): Promise<Character>
  updateCharacter(id: string, data: UpdateCharacterInput): Promise<Character>
  deleteCharacter(id: string): Promise<void>

  // Relationships
  getRelationships(characterId?: string): Promise<Relationship[]>
  createRelationship(data: CreateRelationshipInput): Promise<Relationship>
  updateRelationship(id: number, data: UpdateRelationshipInput): Promise<Relationship>
  deleteRelationship(id: number): Promise<void>

  // World
  getWorld(): Promise<World>
  updateWorld(data: UpdateWorldInput): Promise<World>

  // Locations
  getLocations(): Promise<Location[]>
  createLocation(data: CreateLocationInput): Promise<Location>
  updateLocation(id: string, data: UpdateLocationInput): Promise<Location>
  deleteLocation(id: string): Promise<void>

  // Factions
  getFactions(): Promise<Faction[]>
  createFaction(data: CreateFactionInput): Promise<Faction>
  updateFaction(id: string, data: UpdateFactionInput): Promise<Faction>
  deleteFaction(id: string): Promise<void>

  // Timeline
  getTimelineEvents(): Promise<TimelineEvent[]>
  createTimelineEvent(data: CreateTimelineEventInput): Promise<TimelineEvent>
  updateTimelineEvent(id: number, data: UpdateTimelineEventInput): Promise<TimelineEvent>
  deleteTimelineEvent(id: number): Promise<void>

  // Plot
  getArcs(): Promise<Arc[]>
  createArc(data: CreateArcInput): Promise<Arc>
  updateArc(id: string, data: UpdateArcInput): Promise<Arc>
  deleteArc(id: string): Promise<void>

  // Foreshadowing
  getForeshadowing(): Promise<Foreshadowing[]>
  createForeshadowing(data: CreateForeshadowingInput): Promise<Foreshadowing>
  updateForeshadowing(id: string, data: UpdateForeshadowingInput): Promise<Foreshadowing>
  deleteForeshadowing(id: string): Promise<void>
  resolveForeshadowing(id: string, chapterId: number): Promise<Foreshadowing>
}
```

## Writing API

```typescript
interface WritingAPI {
  // Volumes
  getVolumes(): Promise<Volume[]>
  createVolume(data: CreateVolumeInput): Promise<Volume>
  updateVolume(id: number, data: UpdateVolumeInput): Promise<Volume>

  // Chapters
  getChapters(volumeId?: number): Promise<Chapter[]>
  getChapter(id: number): Promise<ChapterDetail>
  createChapter(data: CreateChapterInput): Promise<Chapter>
  updateChapter(id: number, data: UpdateChapterInput): Promise<Chapter>
  deleteChapter(id: number): Promise<void>

  // Content
  saveContent(chapterId: number, content: string): Promise<void>
  getVersions(chapterId: number): Promise<Version[]>
  rollbackToVersion(chapterId: number, versionId: number): Promise<void>

  // Writing Goals
  getGoals(): Promise<WritingGoal[]>
  createGoal(data: CreateGoalInput): Promise<WritingGoal>
  updateGoalProgress(id: number, words: number): Promise<WritingGoal>

  // Writing Sessions
  startSession(chapterId: number): Promise<WritingSession>
  endSession(sessionId: number): Promise<WritingSession>
}
```

## AI API

```typescript
interface AIAPI {
  // Generation
  continueScene(input: ContinueSceneInput): Promise<AIGenerationResult>
  generateDialogue(input: DialogueInput): Promise<AIGenerationResult>
  describeSettings(input: DescribeInput): Promise<AIGenerationResult>
  brainstorm(input: BrainstormInput): Promise<AIGenerationResult>

  // Story Bible Query
  askStoryBible(question: string): Promise<AIQueryResult>

  // Design Assistance
  designCharacter(input: CharacterDesignInput): Promise<AIGenerationResult>
  designPlot(input: PlotDesignInput): Promise<AIGenerationResult>

  // Streaming
  streamGeneration(input: GenerationInput): AsyncIterable<string>
}
```

## Quality API

```typescript
interface QualityAPI {
  // Single Check
  checkChapter(chapterId: number): Promise<CheckResult>
  checkWaynePrinciples(chapterId: number): Promise<CheckResult>

  // Batch Check
  checkRange(startChapter: number, endChapter: number): Promise<CheckResult[]>
  checkVolume(volumeId: number): Promise<CheckResult[]>

  // Get Results
  getCheckResults(chapterId: number): Promise<CheckResult[]>
  getIssues(filter?: IssueFilter): Promise<Issue[]>
}
```

## Config API

```typescript
interface ConfigAPI {
  // Rules
  getRules(): Promise<ConsistencyRules>
  updateRule(ruleId: string, config: RuleConfig): Promise<void>
  enableRule(ruleId: string): Promise<void>
  disableRule(ruleId: string): Promise<void>
  addCustomRule(rule: CustomRule): Promise<void>

  // Presets
  getPresets(): Promise<Preset[]>
  applyPreset(presetId: string): Promise<void>
  saveAsPreset(name: string): Promise<Preset>

  // AI Config
  getAIConfig(): Promise<AIConfig>
  updateAIConfig(config: AIConfig): Promise<void>
}
```

## Intake API

```typescript
interface IntakeAPI {
  // Document Intake — NL text → structured entities
  decompose(input: { text: string; hint?: IntakeHint }): Promise<DecomposeResult>

  // Chapter Import — multi-pass extraction with SSE progress
  importChapters(input: { chapters: ChapterText[] }): AsyncIterable<IntakeProgressEvent>

  // Commit — write confirmed entities to Story Bible
  commit(input: { entities: IntakeCommitEntity[] }): Promise<IntakeCommitResult>
}
```

### REST Endpoints

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/intake/decompose` | POST | `{ text: string, hint?: IntakeHint }` | `DecomposeResult` (JSON) |
| `/api/intake/import-chapters` | POST | `{ chapters: { title, content, sortOrder }[] }` | SSE stream of `IntakeProgressEvent` |
| `/api/intake/commit` | POST | `{ entities: IntakeCommitEntity[] }` | `IntakeCommitResult` (JSON) |

### Types

```typescript
type IntakeHint = 'character' | 'relationship' | 'world' | 'location' | 'faction'
               | 'foreshadowing' | 'arc' | 'hook' | 'timeline' | 'auto';

interface DecomposeResult {
  characters: ExtractedCharacter[];
  relationships: ExtractedRelationship[];
  locations: ExtractedLocation[];
  factions: ExtractedFaction[];
  foreshadowing: ExtractedForeshadowing[];
  arcs: ExtractedArc[];
  hooks: ExtractedHook[];
  timeline: ExtractedTimeline[];
  warnings: string[];
}

interface IntakeCommitEntity {
  entityType: string;
  action: 'create' | 'merge' | 'skip';
  data: Record<string, unknown>;
  existingId?: string;
}

interface IntakeCommitResult {
  created: { type: string; id: string; name: string }[];
  merged: { type: string; id: string; name: string }[];
  skipped: number;
  unresolved: number;
}

interface IntakeProgressEvent {
  type: 'progress' | 'pass_complete' | 'done' | 'error';
  step?: string;
  pass?: number;
  progress?: number;
  entities?: Partial<DecomposeResult>;
  error?: string;
}
```

## Search & Export API

```typescript
interface SearchAPI {
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  semanticSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>
  searchCharacters(query: string): Promise<Character[]>
  searchLocations(query: string): Promise<Location[]>
}

interface ExportAPI {
  exportMarkdown(options: ExportOptions): Promise<string>
  exportTxt(options: ExportOptions): Promise<string>
  exportWord(options: ExportOptions): Promise<string>
  exportStoryBible(options: ExportOptions): Promise<string>
}

interface ProjectAPI {
  getProject(): Promise<Project>
  updateProject(data: UpdateProjectInput): Promise<Project>
  getTemplates(): Promise<Template[]>
  createFromTemplate(templateId: string, name: string): Promise<Project>
  importMarkdown(path: string): Promise<ImportResult>
}
```
