import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/host/index.ts'],
  platform: 'node',
  target: 'node20',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'lib',
})
