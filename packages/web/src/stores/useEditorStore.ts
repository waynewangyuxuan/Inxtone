/**
 * Editor UI State Store
 *
 * Manages UI-only state for the Write page:
 * selected chapter, dirty tracking, AI panel state.
 *
 * Follows the same pattern as useStoryBibleStore.ts.
 */

import { create } from 'zustand';
import type { BuiltContext } from '@inxtone/core';

export type LeftPanelTab = 'chapters' | 'bible';
export type ChapterFormMode = 'create' | 'edit' | null;
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AIHistoryEntry {
  action: string;
  response: string;
  rejectReason?: string;
  timestamp: number;
}

interface EditorState {
  // Chapter selection
  selectedChapterId: number | null;

  // Dirty tracking
  isDirty: boolean;
  lastSavedAt: number | null;

  // AI panel
  aiPanelOpen: boolean;
  aiLoading: boolean;
  aiResponse: string | null;
  aiAction: string | null;
  aiHistory: AIHistoryEntry[];

  // Cursor
  cursorPosition: number | null;

  // Context
  builtContext: BuiltContext | null;
  excludedContextIds: Set<string>;

  // Auto-save
  autoSaveStatus: AutoSaveStatus;

  // UI state
  arcFilter: string | null;
  leftPanelTab: LeftPanelTab;
  chapterFormMode: ChapterFormMode;
  editingChapterId: number | null;

  // Actions
  selectChapter: (id: number | null) => void;
  markDirty: () => void;
  markSaved: () => void;
  toggleAIPanel: () => void;
  setAILoading: (loading: boolean) => void;
  setAIResponse: (response: string | null, action?: string | null) => void;
  appendAIContent: (content: string) => void;
  addRejectHistory: (reason: string) => void;
  setCursorPosition: (pos: number | null) => void;
  clearAIState: () => void;
  setBuiltContext: (context: BuiltContext | null) => void;
  toggleContextItem: (id: string) => void;
  clearExcludedContext: () => void;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  setArcFilter: (arcId: string | null) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  openChapterForm: (mode: 'create' | 'edit', chapterId?: number) => void;
  closeChapterForm: () => void;
  reset: () => void;
}

const initialState = {
  selectedChapterId: null as number | null,
  isDirty: false,
  lastSavedAt: null as number | null,
  aiPanelOpen: true,
  aiLoading: false,
  aiResponse: null as string | null,
  aiAction: null as string | null,
  aiHistory: [] as AIHistoryEntry[],
  cursorPosition: null as number | null,
  builtContext: null as BuiltContext | null,
  excludedContextIds: new Set<string>(),
  autoSaveStatus: 'idle' as AutoSaveStatus,
  arcFilter: null as string | null,
  leftPanelTab: 'chapters' as LeftPanelTab,
  chapterFormMode: null as ChapterFormMode,
  editingChapterId: null as number | null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  selectChapter: (id) =>
    set({
      selectedChapterId: id,
      isDirty: false,
      lastSavedAt: null,
      cursorPosition: null,
      aiResponse: null,
      aiAction: null,
      builtContext: null,
      excludedContextIds: new Set<string>(),
    }),

  markDirty: () => set({ isDirty: true }),

  markSaved: () =>
    set({
      isDirty: false,
      lastSavedAt: Date.now(),
    }),

  toggleAIPanel: () => set({ aiPanelOpen: !get().aiPanelOpen }),

  setAILoading: (loading) => set({ aiLoading: loading }),

  setAIResponse: (response, action) =>
    set({
      aiResponse: response,
      aiAction: action !== undefined ? action : get().aiAction,
    }),

  appendAIContent: (content) =>
    set({
      aiResponse: (get().aiResponse ?? '') + content,
    }),

  addRejectHistory: (reason) => {
    const { aiResponse, aiAction, aiHistory } = get();
    set({
      aiHistory: [
        ...aiHistory,
        {
          action: aiAction ?? 'unknown',
          response: aiResponse ?? '',
          rejectReason: reason,
          timestamp: Date.now(),
        },
      ],
      aiResponse: null,
      aiAction: null,
    });
  },

  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  clearAIState: () =>
    set({
      aiLoading: false,
      aiResponse: null,
      aiAction: null,
    }),

  setBuiltContext: (context) => set({ builtContext: context }),

  toggleContextItem: (id) => {
    const current = new Set(get().excludedContextIds);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    set({ excludedContextIds: current });
  },

  clearExcludedContext: () => set({ excludedContextIds: new Set<string>() }),

  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),

  setArcFilter: (arcId) => set({ arcFilter: arcId }),

  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),

  openChapterForm: (mode, chapterId) =>
    set({
      chapterFormMode: mode,
      editingChapterId: chapterId ?? null,
    }),

  closeChapterForm: () =>
    set({
      chapterFormMode: null,
      editingChapterId: null,
    }),

  reset: () => set(initialState),
}));

// ===================================
// Selector Hooks
// ===================================

export const useSelectedChapterId = () => useEditorStore((s) => s.selectedChapterId);
export const useIsDirty = () => useEditorStore((s) => s.isDirty);
export const useLastSavedAt = () => useEditorStore((s) => s.lastSavedAt);
export const useAIPanelOpen = () => useEditorStore((s) => s.aiPanelOpen);
export const useAILoading = () => useEditorStore((s) => s.aiLoading);
export const useAIResponse = () => useEditorStore((s) => s.aiResponse);
export const useCursorPosition = () => useEditorStore((s) => s.cursorPosition);
export const useBuiltContextState = () => useEditorStore((s) => s.builtContext);
export const useExcludedContextIds = () => useEditorStore((s) => s.excludedContextIds);
export const useAutoSaveStatus = () => useEditorStore((s) => s.autoSaveStatus);
export const useArcFilter = () => useEditorStore((s) => s.arcFilter);
export const useLeftPanelTab = () => useEditorStore((s) => s.leftPanelTab);
export const useChapterFormMode = () => useEditorStore((s) => s.chapterFormMode);
export const useEditingChapterId = () => useEditorStore((s) => s.editingChapterId);

export const useEditorActions = () =>
  useEditorStore((s) => ({
    selectChapter: s.selectChapter,
    markDirty: s.markDirty,
    markSaved: s.markSaved,
    toggleAIPanel: s.toggleAIPanel,
    setAILoading: s.setAILoading,
    setAIResponse: s.setAIResponse,
    appendAIContent: s.appendAIContent,
    addRejectHistory: s.addRejectHistory,
    setCursorPosition: s.setCursorPosition,
    clearAIState: s.clearAIState,
    setBuiltContext: s.setBuiltContext,
    toggleContextItem: s.toggleContextItem,
    clearExcludedContext: s.clearExcludedContext,
    setArcFilter: s.setArcFilter,
    setLeftPanelTab: s.setLeftPanelTab,
    openChapterForm: s.openChapterForm,
    closeChapterForm: s.closeChapterForm,
    reset: s.reset,
  }));
