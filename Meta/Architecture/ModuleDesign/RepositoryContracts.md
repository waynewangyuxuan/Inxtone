# Repository Contracts

> Service ↔ Data 通信契约

## Character Repository

```typescript
interface CharacterRepository {
  findAll(): Character[]
  findById(id: string): Character | null
  findByRole(role: CharacterRole): Character[]
  create(data: CharacterData): Character
  update(id: string, data: Partial<CharacterData>): Character
  delete(id: string): void
}
```

## Chapter Repository

```typescript
interface ChapterRepository {
  findAll(volumeId?: number): Chapter[]
  findById(id: number): Chapter | null
  findByStatus(status: ChapterStatus): Chapter[]
  create(data: ChapterData): Chapter
  update(id: number, data: Partial<ChapterData>): Chapter
  updateContent(id: number, content: string): void
  delete(id: number): void
}
```

## Check Result Repository

```typescript
interface CheckResultRepository {
  findByChapter(chapterId: number): CheckResult[]
  findByStatus(status: CheckStatus): CheckResult[]
  findIssues(filter?: IssueFilter): Issue[]
  create(data: CheckResultData): CheckResult
}
```

## Version Repository

```typescript
interface VersionRepository {
  findByEntity(entityType: string, entityId: string): Version[]
  create(entityType: string, entityId: string, content: any, summary?: string): Version
  getLatest(entityType: string, entityId: string): Version | null
}
```

## Embedding Repository

```typescript
interface EmbeddingRepository {
  upsert(entityType: string, entityId: string, content: string, embedding: number[]): void
  search(embedding: number[], limit: number): SearchResult[]
  deleteByEntity(entityType: string, entityId: string): void
}
```
