/**
 * API Key Store
 *
 * Manages Gemini API key state: localStorage persistence,
 * verification status, and dialog visibility.
 */

import { create } from 'zustand';

const STORAGE_KEY = 'gemini-api-key';

interface ApiKeyState {
  apiKey: string | null;
  isVerified: boolean;
  showDialog: boolean;

  // Actions
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setVerified: (verified: boolean) => void;
  openDialog: () => void;
  closeDialog: () => void;
  loadFromStorage: () => void;
}

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKey: null,
  isVerified: false,
  showDialog: false,

  setApiKey: (key) => {
    localStorage.setItem(STORAGE_KEY, key);
    set({ apiKey: key, isVerified: true, showDialog: false });
  },

  clearApiKey: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ apiKey: null, isVerified: false });
  },

  setVerified: (verified) => set({ isVerified: verified }),

  openDialog: () => set({ showDialog: true }),

  closeDialog: () => set({ showDialog: false }),

  loadFromStorage: () => {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key) {
      set({ apiKey: key, isVerified: true });
    }
  },
}));

// Selector hooks
export const useApiKey = () => useApiKeyStore((s) => s.apiKey);
export const useIsApiKeyVerified = () => useApiKeyStore((s) => s.isVerified);
export const useShowApiKeyDialog = () => useApiKeyStore((s) => s.showDialog);
export const useApiKeyActions = () =>
  useApiKeyStore((s) => ({
    setApiKey: s.setApiKey,
    clearApiKey: s.clearApiKey,
    setVerified: s.setVerified,
    openDialog: s.openDialog,
    closeDialog: s.closeDialog,
    loadFromStorage: s.loadFromStorage,
  }));
