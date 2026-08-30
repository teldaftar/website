import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// Where the real backend lives. The dev server proxies /api and /uploads to it
// so the browser talks same-origin (the backend has no CORS headers).
const apiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:3000'

// A unique id for this build. Baked into the bundle (as __APP_VERSION__) and
// also written to dist/version.json so the running app can poll for a newer
// deploy and prompt the user to reload. Prefer the git SHA; fall back to a
// timestamp when git isn't available (e.g. an exported source tree).
function resolveBuildId(): string {
  if (process.env.VITE_BUILD_ID) return process.env.VITE_BUILD_ID
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return String(Date.now())
  }
}

const buildId = resolveBuildId()

// Emits dist/version.json at build time. rsync deploys it alongside the hashed
// assets, so a client polling /version.json sees the new id after a deploy.
function versionManifest(): Plugin {
  return {
    name: 'version-manifest',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: buildId }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss(), versionManifest()],
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
})
