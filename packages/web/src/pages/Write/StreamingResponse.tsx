/**
 * StreamingResponse — AI response display area
 */

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useAILoading, useAIResponse } from '../../stores/useEditorStore';
import styles from './StreamingResponse.module.css';

export function StreamingResponse(): React.ReactElement | null {
  const isLoading = useAILoading();
  const response = useAIResponse();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [response]);

  if (!isLoading && !response) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>AI Response</span>
        {isLoading && <span className={styles.pulse} />}
      </div>
      <div ref={containerRef} className={styles.content} data-color-mode="dark">
        {response ? (
          <MDEditor.Markdown source={response} className={styles.text ?? ''} />
        ) : isLoading ? (
          <p className={styles.generating}>Generating...</p>
        ) : null}
      </div>
    </div>
  );
}
