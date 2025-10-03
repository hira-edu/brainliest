import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    tsconfig: 'tsconfig.build.json',
  },
  sourcemap: true,
  clean: true,
});
