import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const here = dirname(fileURLToPath(import.meta.url));
const sharedSrc = resolve(here, '../shared/src');

export default defineConfig({
  resolve: {
    alias: {
      '@brainliest/shared': sharedSrc,
      '@brainliest/config': resolve(here, '../config'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
});
