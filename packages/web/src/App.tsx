import React from 'react';
import { VERSION } from '@inxtone/core';

export function App(): React.ReactElement {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Inxtone</h1>
        <p>AI-Native Storytelling Framework</p>
        <span className="version">v{VERSION}</span>
      </header>
      <main className="app-main">
        <p>Welcome to Inxtone. Start writing your story.</p>
      </main>
    </div>
  );
}
