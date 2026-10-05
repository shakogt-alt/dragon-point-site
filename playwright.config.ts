import { defineConfig, devices } from '@playwright/test';

// Reserved .test origin is a local test fixture, never a deployment default.
const fixtureOrigin = 'https://dragon-point.test';
const servers = [
  {
    name: 'unconfigured',
    port: 3300,
    env: {
      SITE_ENV: 'production',
      VERCEL_ENV: 'production',
      SITE_URL: '',
      OG_IMAGE_URL: '',
    },
  },
  {
    name: 'production',
    port: 3301,
    env: {
      SITE_ENV: 'production',
      VERCEL_ENV: 'production',
      SITE_URL: fixtureOrigin,
      OG_IMAGE_URL: `${fixtureOrigin}/approved-fixture.jpg`,
    },
  },
  {
    name: 'preview',
    port: 3302,
    env: {
      SITE_ENV: 'production',
      VERCEL_ENV: 'preview',
      SITE_URL: fixtureOrigin,
      OG_IMAGE_URL: '',
    },
  },
  {
    name: 'staging',
    port: 3303,
    env: {
      SITE_ENV: 'staging',
      VERCEL_ENV: 'production',
      SITE_URL: fixtureOrigin,
      OG_IMAGE_URL: '',
    },
  },
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3300', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'foundation',
      testMatch: '**/foundation.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    ...servers.map(({ name, port }) => ({
      name: `seo-${name}`,
      testMatch: '**/seo.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${port}`,
      },
    })),
  ],
  webServer: servers.map(({ port, env }) => ({
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/en`,
    env,
    reuseExistingServer: false,
    timeout: 60000,
  })),
});
