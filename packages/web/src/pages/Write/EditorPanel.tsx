/**
 * EditorPanel — MDEditor wrapper with Ctrl+S and dirty tracking
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useChapterWithContent, useSaveContent } from '../../hooks';
import { useSelectedChapterId, useIsDirty, useEditorActions } from '../../stores/useEditorStore';
import { EditorToolbar } from './EditorToolbar';
import { EmptyState } from '../../components/ui';
import styles from './EditorPanel.module.css';

export function EditorPanel(): React.ReactElement {
  const selectedId = useSelectedChapterId();
  const isDirty = useIsDirty();
  const { markDirty, markSaved } = useEditorActions();
  const { data: chapter } = useChapterWithContent(selectedId);
  const saveMutation = useSaveContent();

  const [content, setContent] = React.useState('');
  const contentRef = React.useRef(content);
  contentRef.current = content;

  // Sync content from server when chapter changes
  React.useEffect(() => {
    if (chapter) {
      setContent(chapter.content ?? '');
    } else {
      setContent('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on id/content change, not whole chapter object
  }, [chapter?.id, chapter?.content]);

  const handleChange = (val?: string) => {
    const newVal = val ?? '';
    setContent(newVal);
    markDirty();
  };

  const handleSave = React.useCallback(
    (createVersion: boolean) => {
      if (selectedId == null) return;
      saveMutation.mutate(
        { chapterId: selectedId, content: contentRef.current, createVersion },
        { onSuccess: () => markSaved() }
      );
    },
    [selectedId, saveMutation, markSaved]
  );

  // Ctrl+S / Cmd+S handler
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Warn on page unload with unsaved changes
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (selectedId == null) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title="No chapter selected"
          description="Select a chapter from the sidebar or create a new one to start writing."
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <EditorToolbar content={content} onSave={handleSave} saving={saveMutation.isPending} />
      <div className={styles.editorWrapper} data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          visibleDragbar={false}
          preview="edit"
        />
      </div>
    </div>
  );
}
