import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

// Diagnostic lab observations, not timing assertions or field INP/CLS claims.
const origin = 'http://127.0.0.1:3306';
const server = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    '3306',
  ],
  {
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      SITE_URL: '',
      SITE_ENV: 'production',
      VERCEL_ENV: 'production',
      LEAD_WEBHOOK_URL: '',
      LEAD_WEBHOOK_TOKEN: '',
      NEXT_PUBLIC_GA_ID: '',
      NEXT_PUBLIC_GTM_ID: '',
      NEXT_PUBLIC_META_PIXEL_ID: '',
    },
  },
);
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${origin}/en`)).ok) break;
    } catch {
      /* Startup. */
    }
    if (i === 119) throw new Error('Server did not start');
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch();
  const results = [];
  for (const locale of ['en', 'ka', 'ru', 'he']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const external = [],
      errors = [];
    await page.route('**/*', (route) => {
      if (route.request().url().startsWith(`${origin}/`))
        return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (e) => {
      if (e.type() === 'error') errors.push(e.text());
    });
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__shifts.push({
            value: e.value,
            recentInput: e.hadRecentInput,
            time: e.startTime,
            nodes: e.sources?.map((s) => s.node?.className),
          });
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const states = [];
    const record = async (name) => {
      await page.waitForTimeout(350); // Let the real approved transitions settle.
      states.push({
        name,
        ...(await page.evaluate(() => {
          const box = (selector) => {
            const el = document.querySelector(selector),
              r = el?.getBoundingClientRect();
            return r
              ? {
                  x: r.x,
                  documentY: r.y + scrollY,
                  width: r.width,
                  height: r.height,
                }
              : null;
          };
          return {
            hero: box('#hero'),
            image: box('.dp-architecture-image'),
            header: box('header'),
            lead: box('#advisor'),
            documentHeight: document.documentElement.scrollHeight,
            overflow: document.documentElement.scrollWidth > innerWidth,
            shifts: window.__shifts.splice(0),
          };
        })),
      });
    };
    await page.goto(`${origin}/${locale}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.dp-consent-banner')).toBeVisible();
    await record('initial-banner-fonts');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.dp-architecture-image').evaluate((el) => el.decode());
    await record('fonts-and-image-ready');
    await page.locator('[data-consent-action="customize"]').click();
    await expect(page.locator('.dp-consent-dialog')).toBeVisible();
    await record('consent-dialog');
    await page.keyboard.press('Escape');
    await page.locator('[data-consent-action="necessary"]').click();
    await record('consent-dismissed');
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeVisible();
    await record('compact-header-and-sticky-cta');
    await page.locator('.dp-mobile-lead-cta a').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeHidden();
    await record('focused-lead-sticky-hidden');
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('#lead-name-error')).toBeVisible();
    await record('validation-errors');
    await page.locator('#lead-name').fill('Test Person');
    await page.locator('#lead-phone').fill('+972 50 123 4567');
    await page.route('**/api/leads', (route) =>
      route.fulfill({ json: { ok: true } }),
    );
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('.dp-lead-success')).toBeFocused();
    await record('success');
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
    expect(states.every((s) => !s.overflow)).toBe(true);
    const stable = states.find((s) => s.name === 'fonts-and-image-ready');
    for (const state of states.slice(2)) {
      for (const part of ['hero', 'image']) {
        for (const key of ['x', 'width', 'height'])
          expect(state[part][key]).toBe(stable[part][key]);
        // Approved compact Header changes the reserved top offset by its height.
        expect(state[part].documentY - stable[part].documentY).toBeCloseTo(
          state.header.height - stable.header.height,
          3,
        );
      }
    }
    results.push({ locale, width: 390, dpr: 2, states, external, errors });
    await context.close();
  }
  await writeFile(
    'docs/performance/phase-7/interaction-layout.json',
    JSON.stringify(
      {
        note: 'Lab diagnostic entries; intentional form reflow is user initiated. Not field CLS/INP.',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'All four locales: stable Hero/image dimensions across consent, compact Header, sticky CTA, errors and success; Header offset follows its approved height; no overflow, console errors or third parties.',
  );
} finally {
  await browser?.close();
  server.kill();
}
