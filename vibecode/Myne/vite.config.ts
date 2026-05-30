import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Tauri: don't clear the terminal so Tauri's logs stay visible
  clearScreen: false,

  server: {
    // Tauri expects a fixed port; fail if it's taken
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: {
      // Exclude Rust build artefacts from the Vite watcher
      ignored: ['**/src-tauri/**'],
    },
  },

  // Vite uses VITE_ prefix by default; expose Tauri env vars to the frontend too
  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  build: {
    // Tauri targets Chrome 105 on Windows (Webview2)
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
