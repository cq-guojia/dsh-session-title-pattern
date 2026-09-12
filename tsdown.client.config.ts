import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/client/index.ts'],
  platform: 'browser',
  target: 'chrome99',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'lib/client',
})
