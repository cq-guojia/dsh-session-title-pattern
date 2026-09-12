import { defineConfig } from 'tsdown'

// host 端的 outDir 是整个 `lib`，clean 会连带清掉 `lib/client`。
// 因此构建顺序必须是「先 host 后 client」，由 package.json 的
// scripts.build 固化，不要单独调用本配置后再期望 client 产物还在。
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
