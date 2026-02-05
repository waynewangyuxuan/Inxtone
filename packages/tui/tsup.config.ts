import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.tsx'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['ink', 'react'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
