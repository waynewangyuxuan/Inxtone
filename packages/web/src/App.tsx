/**
 * App - Root Component
 *
 * Sets up routing and global providers
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout';
import { Dashboard, StoryBible, Write, Settings } from './pages';

export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="bible" element={<StoryBible />} />
          <Route path="write" element={<Write />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
