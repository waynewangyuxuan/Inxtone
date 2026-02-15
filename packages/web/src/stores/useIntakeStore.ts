/**
 * Intake Store
 *
 * Zustand store for Smart Intake page UI state.
 * Tracks topic selection, extracted entities, and per-entity decisions.
 */

import { create } from 'zustand';
import type { IntakeHint, DecomposeResult, DuplicateCandidate } from '@inxtone/core';

/** Action the user takes on each extracted entity */
export type EntityDecision = 'accept' | 'reject';

/** Key format: "entityType:index" — e.g. "character:0", "relationship:2" */
export type EntityKey = string;

export function makeEntityKey(entityType: string, index: number): EntityKey {
  return `${entityType}:${index}`;
}

export function parseEntityKey(key: EntityKey): { entityType: string; index: number } {
  const [entityType, indexStr] = key.split(':');
  return { entityType: entityType!, index: Number(indexStr) };
}

interface IntakeState {
  // Input
  hint: IntakeHint | undefined;
  inputText: string;

  // Results
  result: DecomposeResult | null;
  duplicates: DuplicateCandidate[];

  // Per-entity decisions & edits
  decisions: Record<EntityKey, EntityDecision>;
  editedData: Record<EntityKey, Record<string, unknown>>;

  // Edit modal
  editingKey: EntityKey | null;

  // Actions
  setHint: (hint: IntakeHint | undefined) => void;
  setInputText: (text: string) => void;
  setResult: (result: DecomposeResult) => void;
  setDuplicates: (duplicates: DuplicateCandidate[]) => void;
  setDecision: (key: EntityKey, decision: EntityDecision) => void;
  setEditedData: (key: EntityKey, data: Record<string, unknown>) => void;
  acceptAll: () => void;
  acceptAllOfType: (entityType: string) => void;
  rejectAll: () => void;
  openEditor: (key: EntityKey) => void;
  closeEditor: () => void;
  reset: () => void;
}

/** All entity array keys in a DecomposeResult */
const ENTITY_ARRAY_KEYS = [
  'characters',
  'relationships',
  'locations',
  'factions',
  'foreshadowing',
  'arcs',
  'hooks',
  'timeline',
] as const;

/** Singular form for entity key mapping */
const SINGULAR: Record<string, string> = {
  characters: 'character',
  relationships: 'relationship',
  locations: 'location',
  factions: 'faction',
  foreshadowing: 'foreshadowing',
  arcs: 'arc',
  hooks: 'hook',
  timeline: 'timeline',
};

function buildAllKeys(result: DecomposeResult): EntityKey[] {
  const keys: EntityKey[] = [];
  for (const arrayKey of ENTITY_ARRAY_KEYS) {
    const arr = result[arrayKey] as unknown[];
    const type = SINGULAR[arrayKey]!;
    for (let i = 0; i < arr.length; i++) {
      keys.push(makeEntityKey(type, i));
    }
  }
  return keys;
}

const initialState = {
  hint: undefined as IntakeHint | undefined,
  inputText: '',
  result: null as DecomposeResult | null,
  duplicates: [] as DuplicateCandidate[],
  decisions: {} as Record<EntityKey, EntityDecision>,
  editedData: {} as Record<EntityKey, Record<string, unknown>>,
  editingKey: null as EntityKey | null,
};

export const useIntakeStore = create<IntakeState>((set, get) => ({
  ...initialState,

  setHint: (hint) => set({ hint }),
  setInputText: (inputText) => set({ inputText }),

  setResult: (result) => {
    // Auto-accept all entities by default
    const decisions: Record<EntityKey, EntityDecision> = {};
    for (const key of buildAllKeys(result)) {
      decisions[key] = 'accept';
    }
    set({ result, decisions, editedData: {}, duplicates: [], editingKey: null });
  },

  setDuplicates: (duplicates) => set({ duplicates }),

  setDecision: (key, decision) =>
    set((state) => ({ decisions: { ...state.decisions, [key]: decision } })),

  setEditedData: (key, data) =>
    set((state) => ({ editedData: { ...state.editedData, [key]: data } })),

  acceptAll: () => {
    const { result } = get();
    if (!result) return;
    const decisions: Record<EntityKey, EntityDecision> = {};
    for (const key of buildAllKeys(result)) {
      decisions[key] = 'accept';
    }
    set({ decisions });
  },

  acceptAllOfType: (entityType) =>
    set((state) => {
      if (!state.result) return state;
      const newDecisions = { ...state.decisions };
      for (const key of Object.keys(newDecisions)) {
        if (key.startsWith(`${entityType}:`)) {
          newDecisions[key] = 'accept';
        }
      }
      return { decisions: newDecisions };
    }),

  rejectAll: () => {
    const { result } = get();
    if (!result) return;
    const decisions: Record<EntityKey, EntityDecision> = {};
    for (const key of buildAllKeys(result)) {
      decisions[key] = 'reject';
    }
    set({ decisions });
  },

  openEditor: (key) => set({ editingKey: key }),
  closeEditor: () => set({ editingKey: null }),

  reset: () => set(initialState),
}));

// Selector hooks
export const useIntakeHint = () => useIntakeStore((s) => s.hint);
export const useIntakeResult = () => useIntakeStore((s) => s.result);
export const useIntakeDecisions = () => useIntakeStore((s) => s.decisions);
export const useIntakeEditingKey = () => useIntakeStore((s) => s.editingKey);
export const useIntakeActions = () =>
  useIntakeStore((s) => ({
    setHint: s.setHint,
    setInputText: s.setInputText,
    setResult: s.setResult,
    setDuplicates: s.setDuplicates,
    setDecision: s.setDecision,
    setEditedData: s.setEditedData,
    acceptAll: s.acceptAll,
    acceptAllOfType: s.acceptAllOfType,
    rejectAll: s.rejectAll,
    openEditor: s.openEditor,
    closeEditor: s.closeEditor,
    reset: s.reset,
  }));
