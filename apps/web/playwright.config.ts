import { defineConfig } from '@playwright/test';

// Play tests (`npm run e2e` in apps/web, or `npx playwright test`): the main paths a player takes,
// played in a real browser against the dev server, so a later change can't quietly break them.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  workers: 2,
  use: { baseURL: 'http://localhost:5199/Sweet-Home-reset/test/', viewport: { width: 390, height: 844 } },
  webServer: { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199/Sweet-Home-reset/test/', reuseExistingServer: true, timeout: 60_000 }
});
