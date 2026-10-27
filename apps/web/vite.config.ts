import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaManifest, workboxOptions } from './src/shared/pwa-config';

// `vite build --mode native` makes the bundle Capacitor copies into the iOS and Android apps,
// which serve it from the root. The default build is for GitHub Pages.
export default defineConfig(({ mode }) => ({
  base: mode === 'native' ? '/' : '/Sweet-Home-reset/',
  server: { port: 5173 },
  build: {
    sourcemap: true,
    target: 'esnext',
    // The room game stays on the main link; the GDD v3 town game is the /test/ build (GDD v3 A1).
    rollupOptions: { input: { main: 'index.html', test: 'test/index.html' } }
  },
  plugins: [
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      disable: mode === 'native',
      manifest: pwaManifest,
      workbox: workboxOptions
    })
  ]
}));
