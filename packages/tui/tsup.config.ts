import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['ink', 'react'],
  },
  {
    entry: ['src/cli.tsx'],
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: true,
    external: ['ink', 'react'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
