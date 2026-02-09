/**
 * ApiKeyDialog - Modal for entering/verifying Gemini API key
 *
 * Shows on first visit when no key is stored.
 * Verifies key via POST /api/ai/verify-key before storing.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { useShowApiKeyDialog, useApiKeyActions, useApiKey } from '../stores/useApiKeyStore';
import { apiPost } from '../lib/api';
import styles from './ApiKeyDialog.module.css';

interface VerifyKeyResponse {
  valid: boolean;
  error?: string;
}

function maskKey(key: string): string {
  if (key.length <= 4) return key;
  return '\u00B7'.repeat(key.length - 4) + key.slice(-4);
}

export function ApiKeyDialog(): React.ReactElement | null {
  const showDialog = useShowApiKeyDialog();
  const existingKey = useApiKey();
  const { setApiKey, closeDialog } = useApiKeyActions();

  const [inputValue, setInputValue] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!showDialog) return null;

  const keyToVerify = inputValue.trim();

  const handleVerify = async () => {
    if (!keyToVerify) return;

    setVerifying(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await apiPost<VerifyKeyResponse>('/ai/verify-key', { apiKey: keyToVerify });
      if (result.valid) {
        setSuccess(true);
        setApiKey(keyToVerify);
      } else {
        setError(result.error ?? 'Invalid API key');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyToVerify) {
      void handleVerify();
    }
  };

  const handleSkip = () => {
    closeDialog();
  };

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>Gemini API Key</h2>
          <p className={styles.subtitle}>
            {existingKey ? 'Update your API key' : 'Enter your key to enable AI features'}
          </p>
        </div>

        <div className={styles.body}>
          {existingKey && !inputValue ? (
            <div className={styles.inputGroup}>
              <div className={styles.maskedKey}>{maskKey(existingKey)}</div>
              <Button variant="secondary" size="sm" onClick={() => setInputValue('')}>
                Change
              </Button>
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <input
                className={styles.input}
                type="password"
                placeholder="AIza..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={verifying}
                autoFocus
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => void handleVerify()}
                loading={verifying}
                disabled={!keyToVerify}
              >
                Verify
              </Button>
            </div>
          )}

          <div className={styles.message}>
            {error && <span className={styles.error}>{error}</span>}
            {success && <span className={styles.success}>Key verified successfully</span>}
          </div>

          <a
            className={styles.getKeyLink}
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get a free API key at aistudio.google.com
          </a>
        </div>

        <div className={styles.footer}>
          <button className={styles.skipLink} onClick={handleSkip}>
            {existingKey ? 'Close' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
