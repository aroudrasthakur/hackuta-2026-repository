import { defineConfig, devices } from '@playwright/test'

const useProductionBuild = process.env.PLAYWRIGHT_USE_BUILD === 'true'
const baseURL = useProductionBuild ? 'http://127.0.0.1:4174' : 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: process.env.CI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : [{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } }],
  webServer: {
    command: useProductionBuild
      ? 'node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1'
      : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
