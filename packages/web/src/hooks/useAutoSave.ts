/**
 * useAutoSave — debounced auto-save hook
 *
 * Saves chapter content after 3 seconds of inactivity.
 * Uses createVersion: false (no version snapshot).
 * Manual Ctrl+S still creates versioned saves.
 *
 * Calls apiPut directly (not useSaveContent) to avoid
 * invalidating the withContent query cache, which would
 * overwrite in-flight editor content.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPut } from '../lib/api';
import { useEditorStore } from '../stores/useEditorStore';
import type { Chapter } from '@inxtone/core';

const AUTO_SAVE_DELAY = 3000;
const SAVED_DISPLAY_DURATION = 2000;

export function useAutoSave(chapterId: number | null, contentRef: React.MutableRefObject<string>) {
  const queryClient = useQueryClient();
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = React.useRef('');
  const chapterIdRef = React.useRef(chapterId);
  chapterIdRef.current = chapterId;

  // Stable ref for queryClient (doesn't change but satisfies closure)
  const qcRef = React.useRef(queryClient);
  qcRef.current = queryClient;

  // Reset on chapter change
  React.useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastSavedRef.current = '';
    useEditorStore.getState().setAutoSaveStatus('idle');
  }, [chapterId]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /** Call from handleChange to restart the debounce timer */
  const scheduleAutoSave = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const id = chapterIdRef.current;
      if (id == null) return;
      const content = contentRef.current;
      if (content === lastSavedRef.current) return;

      useEditorStore.getState().setAutoSaveStatus('saving');

      apiPut<Chapter, { content: string; createVersion: boolean }>(`/chapters/${id}/content`, {
        content,
        createVersion: false,
      })
        .then(() => {
          lastSavedRef.current = content;
          useEditorStore.getState().markSaved();
          useEditorStore.getState().setAutoSaveStatus('saved');
          // Only invalidate list queries (word count sidebar), NOT withContent
          void qcRef.current.invalidateQueries({
            queryKey: ['chapters', 'list'],
          });
          setTimeout(() => {
            useEditorStore.getState().setAutoSaveStatus('idle');
          }, SAVED_DISPLAY_DURATION);
        })
        .catch(() => {
          useEditorStore.getState().setAutoSaveStatus('error');
        });
    }, AUTO_SAVE_DELAY);
  }, [contentRef]);

  /** Call after manual save to sync lastSaved tracking */
  const notifyManualSave = React.useCallback((content: string) => {
    lastSavedRef.current = content;
  }, []);

  return { scheduleAutoSave, notifyManualSave };
}
