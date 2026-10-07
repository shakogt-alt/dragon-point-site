import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Isolated audit tooling: does not change application dependencies or IDs.
const stage = process.argv[2];
if (!['baseline', 'final'].includes(stage))
  throw new Error('Usage: node scripts/performance-audit.mjs baseline|final');
const root = process.cwd();
const out = resolve(root, 'docs/performance/phase-7');
const scratch = resolve(root, '.superpowers/phase-7');
await mkdir(out, { recursive: true });
await mkdir(scratch, { recursive: true });
const toolRequire = createRequire(resolve(scratch, 'tools/package.json'));
const { default: lighthouse } = await import(
  pathToFileURL(toolRequire.resolve('lighthouse')).href
);
const { launch } = await import(
  pathToFileURL(toolRequire.resolve('chrome-launcher')).href
);
const lighthouseRoot = resolve(scratch, 'tools/node_modules/lighthouse');
const { default: desktop } = await import(
  pathToFileURL(resolve(lighthouseRoot, 'core/config/desktop-config.js')).href
);
const origin = 'http://127.0.0.1:3305';
const server = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    '3305',
  ],
  {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      SITE_ENV: 'production',
      VERCEL_ENV: 'production',
      SITE_URL: 'https://dragon-point.test', // Existing reserved SEO fixture only.
      OG_IMAGE_URL: '',
      LEAD_WEBHOOK_URL: '',
      LEAD_WEBHOOK_TOKEN: '',
      NEXT_PUBLIC_GA_ID: '',
      NEXT_PUBLIC_GTM_ID: '',
      NEXT_PUBLIC_META_PIXEL_ID: '',
    },
  },
);
const cases = [
  { locale: 'en', device: 'mobile', width: 390, height: 844, dpr: 2 },
  { locale: 'en', device: 'desktop', width: 1440, height: 900, dpr: 1 },
  { locale: 'he', device: 'mobile', width: 390, height: 844, dpr: 2 },
  { locale: 'he', device: 'desktop', width: 1440, height: 900, dpr: 1 },
];
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const probes = [];
const runs = [];
let browser;
try {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(`${origin}/en`)).ok) break;
    } catch {
      /* Wait for the local production server. */
    }
    if (attempt === 119) throw new Error('Audit server did not start');
    await sleep(250);
  }
  browser = await chromium.launch();
  for (const c of cases) {
    const context = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      deviceScaleFactor: c.dpr,
      isMobile: c.device === 'mobile',
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    const requests = new Map();
    cdp.on('Network.responseReceived', ({ requestId, response, type }) => {
      requests.set(requestId, {
        url: response.url.replace(origin, ''),
        type,
        status: response.status,
        mime: response.mimeType,
        cacheControl:
          response.headers['Cache-Control'] ??
          response.headers['cache-control'],
      });
    });
    cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
      if (requests.has(requestId))
        requests.get(requestId).transferredBytes = encodedDataLength;
    });
    await page.addInitScript(() => {
      window.__lab = { shifts: [], lcp: [], longTasks: [] };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__lab.shifts.push({
            value: e.value,
            recentInput: e.hadRecentInput,
            time: e.startTime,
            nodes: e.sources?.map((s) => s.node?.className),
          });
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__lab.lcp.push({
            time: e.startTime,
            element: e.element?.className,
          });
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          window.__lab.longTasks.push({
            time: e.startTime,
            duration: e.duration,
          });
      }).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(`${origin}/${c.locale}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.dp-architecture-image').evaluate((el) => el.decode());
    const state = await page.evaluate(() => {
      const image = document.querySelector('.dp-architecture-image');
      const bounds = image.getBoundingClientRect();
      return {
        ...window.__lab,
        image: {
          currentSrc: image.currentSrc.replace(location.origin, ''),
          sizes: image.sizes,
          width: bounds.width,
          height: bounds.height,
          naturalWidth: image.naturalWidth,
          objectPosition: getComputedStyle(image).objectPosition,
        },
        fonts: [...document.fonts].map((f) => ({
          family: f.family,
          weight: f.weight,
          status: f.status,
          display: f.display,
        })),
        navigation: performance.getEntriesByType('navigation')[0].toJSON(),
        resources: performance.getEntriesByType('resource').map((e) => ({
          url: e.name.replace(location.origin, ''),
          type: e.initiatorType,
          transferredBytes: e.transferSize,
          encodedBytes: e.encodedBodySize,
          decodedBytes: e.decodedBodySize,
        })),
      };
    });
    await page.screenshot({
      path: resolve(scratch, `${stage}-${c.locale}-${c.device}.png`),
      fullPage: true,
    });
    const textGeometry = await page
      .locator('h1,h2,h3,p,label,button,.dp-action')
      .evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return {
            text: e.textContent,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          };
        }),
      );
    probes.push({
      ...c,
      ...state,
      requests: [...requests.values()],
      textGeometry,
    });
    await context.close();
  }
  await browser.close();
  browser = undefined;
  // Sequential, isolated Chrome profiles. Browser caches cold; origin image
  // derivatives were warmed by the probes, consistently for baseline and final.
  for (const c of cases) {
    for (let repetition = 1; repetition <= 3; repetition++) {
      const chrome = await launch({
        chromePath: chromium.executablePath(),
        chromeFlags: ['--headless=new', '--disable-background-networking'],
      });
      try {
        const config =
          c.device === 'desktop'
            ? structuredClone(desktop)
            : { extends: 'lighthouse:default', settings: {} };
        config.settings.screenEmulation = {
          width: c.width,
          height: c.height,
          deviceScaleFactor: c.dpr,
          mobile: c.device === 'mobile',
          disabled: false,
        };
        config.settings.onlyCategories = [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ];
        const result = await lighthouse(
          `${origin}/${c.locale}`,
          { port: chrome.port, logLevel: 'error', output: 'json' },
          config,
        );
        const lhr = result.lhr;
        if (lhr.runtimeError) throw new Error(JSON.stringify(lhr.runtimeError));
        const detailIds = [
          'network-requests',
          'resource-summary',
          'unused-javascript',
          'unused-css-rules',
          'font-display-insight',
          'image-delivery-insight',
          'lcp-breakdown-insight',
          'cls-culprits-insight',
          'render-blocking-insight',
          'mainthread-work-breakdown',
          'bootup-time',
          'diagnostics',
        ];
        const audits = Object.fromEntries(
          Object.entries(lhr.audits).map(([id, a]) => [
            id,
            {
              title: a.title,
              score: a.score,
              numericValue: a.numericValue,
              numericUnit: a.numericUnit,
              displayValue: a.displayValue,
              explanation: a.explanation,
              ...(detailIds.includes(id) ? { details: a.details } : {}),
            },
          ]),
        );
        const run = {
          ...c,
          repetition,
          lighthouseVersion: lhr.lighthouseVersion,
          fetchTime: lhr.fetchTime,
          userAgent: lhr.userAgent,
          configSettings: lhr.configSettings,
          categories: Object.fromEntries(
            Object.entries(lhr.categories).map(([id, a]) => [
              id,
              a.score * 100,
            ]),
          ),
          audits,
          runWarnings: lhr.runWarnings,
        };
        runs.push(run);
        console.log(
          JSON.stringify({
            stage,
            locale: c.locale,
            device: c.device,
            repetition,
            scores: run.categories,
            lcp: audits['largest-contentful-paint'].numericValue,
            cls: audits['cumulative-layout-shift'].numericValue,
            tbt: audits['total-blocking-time'].numericValue,
          }),
        );
        await writeFile(
          resolve(out, `${stage}-lighthouse.json`),
          JSON.stringify(runs, null, 2) + '\n',
        );
      } finally {
        await chrome.kill();
      }
    }
  }
  const median = (values) => {
    if (!values.every(Number.isFinite))
      throw new Error('Audit metric missing; never replace it with zero');
    return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  };
  const summaries = cases.map((c) => {
    const relevant = runs.filter(
      (r) => r.locale === c.locale && r.device === c.device,
    );
    return {
      ...c,
      samples: relevant.length,
      scores: Object.fromEntries(
        Object.keys(relevant[0].categories).map((k) => [
          k,
          median(relevant.map((r) => r.categories[k])),
        ]),
      ),
      metrics: Object.fromEntries(
        [
          'largest-contentful-paint',
          'cumulative-layout-shift',
          'total-blocking-time',
          'first-contentful-paint',
          'speed-index',
          'server-response-time',
          'total-byte-weight',
        ].map((k) => [
          k,
          median(relevant.map((r) => r.audits[k]?.numericValue)),
        ]),
      ),
    };
  });
  const bundles = [];
  for (const file of await readdir(resolve(root, '.next/static/chunks'))) {
    if (/\.(js|css)$/.test(file))
      bundles.push({
        file,
        bytes: (await stat(resolve(root, '.next/static/chunks', file))).size,
      });
  }
  await writeFile(
    resolve(out, `${stage}-assets.json`),
    JSON.stringify({ probes, bundles }, null, 2) + '\n',
  );
  await writeFile(
    resolve(out, `${stage}-summary.json`),
    JSON.stringify(
      {
        stage,
        node: process.version,
        lighthouse: JSON.parse(
          await readFile(resolve(lighthouseRoot, 'package.json')),
        ).version,
        setup:
          'Local production server; reserved .test SEO fixture; blank IDs; first-visit consent; cold browser profiles; warm origin derivatives; default simulated mobile/desktop throttling; sequential runs',
        summaries,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  await browser?.close();
  server.kill();
}
