/**
 * React Query Hooks Barrel Export
 */

// Characters
export {
  characterKeys,
  useCharacters,
  useCharacter,
  useCharacterWithRelations,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
} from './useCharacters';

// Relationships
export {
  relationshipKeys,
  useRelationships,
  useRelationship,
  useCreateRelationship,
  useUpdateRelationship,
  useDeleteRelationship,
} from './useRelationships';

// World
export { worldKeys, useWorld, useUpdateWorld, useSetPowerSystem } from './useWorld';

// Locations
export {
  locationKeys,
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from './useLocations';

// Factions
export {
  factionKeys,
  useFactions,
  useFaction,
  useCreateFaction,
  useUpdateFaction,
  useDeleteFaction,
} from './useFactions';

// Timeline
export {
  timelineKeys,
  useTimeline,
  useCreateTimelineEvent,
  useDeleteTimelineEvent,
} from './useTimeline';

// Arcs
export { arcKeys, useArcs, useArc, useCreateArc, useUpdateArc, useDeleteArc } from './useArcs';

// Foreshadowing
export {
  foreshadowingKeys,
  useForeshadowing,
  useForeshadowingItem,
  useCreateForeshadowing,
  useAddForeshadowingHint,
  useResolveForeshadowing,
  useAbandonForeshadowing,
  useDeleteForeshadowing,
} from './useForeshadowing';

// Hooks
export {
  hookKeys,
  useHooks,
  useHook,
  useCreateHook,
  useUpdateHook,
  useDeleteHook,
} from './useHooks';

// Chapters & Volumes
export {
  chapterKeys,
  volumeKeys,
  versionKeys,
  contextKeys,
  useChapters,
  useChapterWithContent,
  useCreateChapter,
  useUpdateChapter,
  useSaveContent,
  useDeleteChapter,
  useVolumes,
  useVersions,
  useBuildContext,
} from './useChapters';
