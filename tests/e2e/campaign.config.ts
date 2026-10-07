import { defineConfig, devices } from '@playwright/test';

// Run only against a freshly built synthetic-ID variant. Never a live account.
if (!['ga-meta', 'gtm'].includes(process.env.DP_TEST_PROVIDER ?? ''))
  throw new Error(
    'Set DP_TEST_PROVIDER to ga-meta or gtm for mocked campaign tests',
  );

export default defineConfig({
  testDir: '.',
  testMatch: 'campaign.spec.ts',
  workers: 2,
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3304',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3304',
    url: 'http://127.0.0.1:3304/en',
    reuseExistingServer: false,
    env: {
      SITE_ENV: 'staging',
      SITE_URL: '',
      VERCEL_ENV: 'preview',
      LEAD_WEBHOOK_URL: '',
      LEAD_WEBHOOK_TOKEN: '',
      VERCEL: '',
    },
  },
});
