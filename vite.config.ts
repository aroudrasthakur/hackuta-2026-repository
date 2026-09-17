import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { beasties } from 'vite-plugin-beasties'
import istanbul from 'vite-plugin-istanbul'
import { contentSecurityPolicy } from './security/csp.ts'
import { inlineCriticalShell } from './scripts/inline-critical-shell.ts'
import { asyncCssForCsp } from './scripts/async-css-for-csp.ts'

const instrumentForCoverage = process.env.VITE_COVERAGE === 'true'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    instrumentForCoverage &&
      istanbul({
        include: ['src/**/*', 'shared/**/*', 'convex/**/*', 'security/**/*'],
        exclude: ['**/*.test.*', '**/*.spec.*', 'node_modules/**', 'tests/**', 'convex/_generated/**'],
        extension: ['.js', '.ts', '.tsx'],
        requireEnv: false,
        forceBuildInstrument: true,
      }),
    beasties({
      options: {
        preload: 'swap',
        // pruneSource reads CSS from disk during the HTML transform, which
        // races the Vite bundle on some platforms and logs ENOENT noise.
        pruneSource: false,
      },
    }),
    inlineCriticalShell(),
    asyncCssForCsp(),
  ].filter(Boolean),
  server: { port: 5173, strictPort: true },
  preview: {
    port: 4174,
    strictPort: true,
    headers: { 'Content-Security-Policy': contentSecurityPolicy },
  },
  build: { target: 'es2022' },
})
