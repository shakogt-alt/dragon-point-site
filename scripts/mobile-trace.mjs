import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

// Separate diagnostic CPU traces: 4x real CPU throttle, unthrottled network.
// Lighthouse comparisons retain Phase 7's simulated setup instead.
const stage = process.argv[2];
if (!['baseline', 'final'].includes(stage))
  throw new Error('Choose baseline|final');
const experiment = process.argv[3];
if (experiment && !['offscreen', 'unbalanced', 'ttf'].includes(experiment))
  throw new Error('Unknown experiment');
const scratch = '.superpowers/phase-7b';
await mkdir(scratch, { recursive: true });
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
      SITE_ENV: 'production',
      VERCEL_ENV: 'production',
      SITE_URL: 'https://dragon-point.test',
      OG_IMAGE_URL: '',
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
      /* startup */
    }
    if (i === 119) throw new Error('Server startup failed');
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch();
  for (const locale of ['en', 'he']) {
    for (let repetition = 1; repetition <= 3; repetition++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
      });
      const page = await context.newPage();
      if (experiment === 'ttf') {
        // Isolate the original full Hebrew TTF container against the complete
        // WOFF2, without changing glyphs, CSS metrics or application behavior.
        await page.route(
          '**/fonts/noto-sans-hebrew-variable*.woff2',
          async (route) => {
            await route.fulfill({
              contentType: 'font/ttf',
              body: await readFile(
                'src/assets/fonts/hebrew/NotoSansHebrew-Variable.ttf',
              ),
            });
          },
        );
      } else if (experiment) {
        await page.route('**/*.css', async (route) => {
          const response = await route.fetch();
          const css =
            experiment === 'offscreen'
              ? 'main>section:not(#hero){content-visibility:auto;contain-intrinsic-block-size:auto 60rem}'
              : 'main>section:not(#hero) h2{text-wrap:wrap!important}';
          await route.fulfill({
            response,
            body: (await response.text()) + css,
          });
        });
      }
      const cdp = await context.newCDPSession(page);
      const errors = [],
        external = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('request', (r) => {
        if (!r.url().startsWith(origin)) external.push(r.url());
      });
      await page.addInitScript(() => {
        window.__traceLab = { lcp: [], shifts: [] };
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            window.__traceLab.lcp.push({
              time: e.startTime,
              size: e.size,
              tag: e.element?.tagName,
              className: e.element?.className,
              url: e.url,
              loadTime: e.loadTime,
              renderTime: e.renderTime,
            });
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            window.__traceLab.shifts.push({
              time: e.startTime,
              value: e.value,
              recentInput: e.hadRecentInput,
            });
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
      await cdp.send('Profiler.start');
      await cdp.send('Tracing.start', {
        categories:
          'devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,loading,v8.execute',
        transferMode: 'ReturnAsStream',
      });
      await page.goto(`${origin}/${locale}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      // Include all client effects, rather than stopping at font/network readiness.
      await page.waitForFunction(
        () =>
          document.querySelector('#lead-name')?.disabled === false &&
          document.documentElement.dataset.consentUi,
      );
      const state = await page.evaluate(() => ({
        ...window.__traceLab,
        navigation: performance.getEntriesByType('navigation')[0].toJSON(),
        resources: performance
          .getEntriesByType('resource')
          .map((r) => r.toJSON()),
        fonts: [...document.fonts]
          .filter((f) => f.status === 'loaded')
          .map((f) => ({ family: f.family, weight: f.weight })),
      }));
      const { profile } = await cdp.send('Profiler.stop');
      const complete = new Promise((r) =>
        cdp.once('Tracing.tracingComplete', r),
      );
      await cdp.send('Tracing.end');
      const { stream } = await complete;
      let trace = '';
      while (true) {
        const result = await cdp.send('IO.read', { handle: stream });
        trace += result.base64Encoded
          ? Buffer.from(result.data, 'base64').toString()
          : result.data;
        if (result.eof) break;
      }
      await cdp.send('IO.close', { handle: stream });
      const prefix = `${scratch}/${experiment ?? stage}-${locale}-cpu-${repetition}`;
      await writeFile(`${prefix}-trace.json`, trace);
      await writeFile(`${prefix}-profile.json`, JSON.stringify(profile));
      await writeFile(
        `${prefix}-state.json`,
        JSON.stringify({
          locale,
          repetition,
          cpuRate: 4,
          network: 'unthrottled',
          state,
          errors,
          external,
        }),
      );
      console.log(
        JSON.stringify({
          locale,
          repetition,
          lcp: state.lcp.at(-1),
          errors,
          external,
        }),
      );
      await context.close();
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
