/**
 * Story Bible UI State Store
 *
 * Manages UI-only state: active tab, selection, form mode
 */

import { create } from 'zustand';

export type StoryBibleTab =
  | 'characters'
  | 'relationships'
  | 'world'
  | 'locations'
  | 'factions'
  | 'timeline'
  | 'arcs'
  | 'foreshadowing'
  | 'hooks';

export type FormMode = 'create' | 'edit' | null;

interface StoryBibleState {
  // Current active tab
  activeTab: StoryBibleTab;

  // Currently selected entity ID (varies by tab)
  selectedId: string | number | null;

  // Form mode for create/edit modals
  formMode: FormMode;

  // Actions
  setTab: (tab: StoryBibleTab) => void;
  select: (id: string | number | null) => void;
  openForm: (mode: 'create' | 'edit') => void;
  closeForm: () => void;
  reset: () => void;
}

const initialState = {
  activeTab: 'characters' as StoryBibleTab,
  selectedId: null,
  formMode: null as FormMode,
};

export const useStoryBibleStore = create<StoryBibleState>((set) => ({
  ...initialState,

  setTab: (tab) =>
    set({
      activeTab: tab,
      selectedId: null, // Clear selection when switching tabs
      formMode: null,
    }),

  select: (id) =>
    set({
      selectedId: id,
      formMode: null,
    }),

  openForm: (mode) =>
    set({
      formMode: mode,
    }),

  closeForm: () =>
    set({
      formMode: null,
      selectedId: null, // Clear selection when closing form
    }),

  reset: () => set(initialState),
}));

// Selector hooks for convenience
export const useActiveTab = () => useStoryBibleStore((s) => s.activeTab);
export const useSelectedId = () => useStoryBibleStore((s) => s.selectedId);
export const useFormMode = () => useStoryBibleStore((s) => s.formMode);
export const useStoryBibleActions = () =>
  useStoryBibleStore((s) => ({
    setTab: s.setTab,
    select: s.select,
    openForm: s.openForm,
    closeForm: s.closeForm,
    reset: s.reset,
  }));
