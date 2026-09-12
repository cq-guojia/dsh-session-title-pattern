import { defineConfig } from 'tsdown'

// clean 必须为 false：outDir 是 `lib/client`，而 host 配置的 outDir 是 `lib`。
// 若这里也开 clean，host 构建（先跑）清空 lib 后本步的产物虽然还在，但反过来
// 再跑 host 就会把 client 产物清掉；固定「先 host 后 client」且此处不 clean，
// 可让两种执行顺序都得到完整产物。
export default defineConfig({
  entry: ['src/client/index.ts'],
  platform: 'browser',
  target: 'chrome99',
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: false,
  outDir: 'lib/client',
})
