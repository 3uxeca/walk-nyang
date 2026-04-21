import { defineConfig } from 'vite'

// GitHub Pages는 https://3uxeca.github.io/walk-nyang/ 서브패스에서 호스팅됨.
// dev 서버는 루트(/)에서 동작해야 하므로 production일 때만 base를 적용.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/walk-nyang/' : '/',
  server: {
    port: 3000,
  },
  build: {
    // three.js를 별도 vendor 청크로 분리 — 게임 코드만 변경 시 three 청크는 캐시 유지
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/examples/jsm/utils/SkeletonUtils.js'],
        },
      },
    },
    // three.js 자체가 약 619KB (불가피) — 그 이상을 한 청크로 떨어뜨리지 않도록 700KB 임계
    chunkSizeWarningLimit: 700,
  },
}))
