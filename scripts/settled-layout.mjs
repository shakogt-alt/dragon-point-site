import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
const previous = JSON.parse(
  await readFile('docs/performance/phase-7b/baseline-assets.json', 'utf8'),
).probes;
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
      NEXT_PUBLIC_GA_ID: '',
      NEXT_PUBLIC_GTM_ID: '',
      NEXT_PUBLIC_META_PIXEL_ID: '',
      LEAD_WEBHOOK_URL: '',
      LEAD_WEBHOOK_TOKEN: '',
    },
  },
);
const browser = await chromium.launch();
const rows = [];
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:3306/en')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const old of previous) {
    const context = await browser.newContext({
      viewport: { width: old.width, height: old.height },
      deviceScaleFactor: old.dpr,
      isMobile: old.device === 'mobile',
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:3306/' + old.locale, {
      waitUntil: 'networkidle',
    });
    // Inspection only: reveal all native offscreen sections for settled geometry
    // and full-page review. This runs separately from Lighthouse/transfer probes.
    await page.addStyleTag({
      content: 'main>section{content-visibility:visible!important}',
    });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    const texts = await page
      .locator('h1,h2,h3,p,label,button,.dp-action')
      .evaluateAll((es) =>
        es.map((e) => {
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
    if (texts.length !== old.textGeometry.length)
      throw Error('Text tree changed');
    const differences = texts.flatMap((e, i) => {
      const p = old.textGeometry[i];
      if (e.text !== p.text) throw Error('Copy changed');
      const delta = Math.max(
        ...['x', 'y', 'width', 'height'].map((k) => Math.abs(e[k] - p[k])),
      );
      return delta > 0.01 ? [{ text: e.text, delta, before: p, after: e }] : [];
    });
    await page.screenshot({
      path:
        '.superpowers/phase-7b/settled-' +
        old.locale +
        '-' +
        old.device +
        '.png',
      fullPage: true,
    });
    rows.push({
      locale: old.locale,
      device: old.device,
      textNodes: texts.length,
      differences,
    });
    await context.close();
  }
  await writeFile(
    'docs/performance/phase-7b/settled-layout.json',
    JSON.stringify(
      {
        note: 'Inspection override reveals all sections for full-page geometry only. It is never used by Lighthouse, initial asset probes or application code.',
        rows,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(rows));
} finally {
  await browser.close();
  server.kill();
}
