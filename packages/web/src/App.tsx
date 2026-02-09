/**
 * App - Root Component
 *
 * Sets up routing, QueryClient, and global providers.
 * Shows ApiKeyDialog on first visit if no key stored.
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout';
import { Dashboard, StoryBible, Plot, Write, Settings } from './pages';
import { ApiKeyDialog } from './components/ApiKeyDialog';
import { useApiKeyStore } from './stores/useApiKeyStore';

// Create QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App(): React.ReactElement {
  useEffect(() => {
    const store = useApiKeyStore.getState();
    store.loadFromStorage();
    // Show dialog on first visit if no key stored
    if (!localStorage.getItem('gemini-api-key')) {
      store.openDialog();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="bible" element={<StoryBible />} />
            <Route path="plot" element={<Plot />} />
            <Route path="write" element={<Write />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <ApiKeyDialog />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
