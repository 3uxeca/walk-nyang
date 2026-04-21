import { defineConfig } from 'vite'

// GitHub Pages는 https://3uxeca.github.io/walk-nyang/ 서브패스에서 호스팅됨.
// dev 서버는 루트(/)에서 동작해야 하므로 production일 때만 base를 적용.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/walk-nyang/' : '/',
  server: {
    port: 3000,
  },
}))
