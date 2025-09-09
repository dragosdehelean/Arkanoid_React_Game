/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Exclude slow/natural-run tests by default; enable with RUN_NATURAL=1
  ...(process.env.RUN_NATURAL ? {} : { grepInvert: /@natural/ }),
  // Use fewer workers locally as well to improve stability
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 180_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
