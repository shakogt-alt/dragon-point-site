import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { chromium } from '@playwright/test';

// Local fallback only. This is deliberately not a deployment/CDN audit.
const root = process.cwd();
const output = resolve(root, 'docs/audits/phase-8');
const origin = 'http://127.0.0.1:3308';
await mkdir(output, { recursive: true });
const files = async (directory) => {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result;
};
const publicFiles = await files(resolve(root, 'public'));
const clientFiles = await files(resolve(root, '.next/static'));
const markers = [
  root,
  root.replaceAll('\\', '/'),
  'C:\\Users\\SGT',
  'C:/Users/SGT',
  'dragon-point-visuals/',
  'G-DPTEST1234',
  'GTM-DPTEST12',
  '123456789012345',
  'person@example.test',
  'Test Person',
  'fixture-token',
];
// Check any private value inherited by the audit, but never serialize it.
const privateValues = ['LEAD_WEBHOOK_TOKEN', 'VERCEL_TOKEN']
  .map((name) => process.env[name])
  .filter((value) => value && value.length >= 8);
const findings = [];
for (const path of [...publicFiles, ...clientFiles]) {
  const name = relative(root, path).replaceAll('\\', '/');
  if (/(^|\/)(\.env[^/]*|\.git|docs|reference|tests)(\/|$)/.test(name))
    findings.push({ file: name, reason: 'private public-path name' });
  if (name.endsWith('.map'))
    findings.push({ file: name, reason: 'browser source map' });
  const body = await readFile(path);
  if (markers.some((marker) => body.includes(Buffer.from(marker))))
    findings.push({ file: name, reason: 'local/private/test marker' });
  if (privateValues.some((value) => body.includes(Buffer.from(value))))
    findings.push({ file: name, reason: 'configured private value' });
}
await writeFile(
  resolve(output, 'public-output-scan.json'),
  JSON.stringify(
    {
      scope: 'Local final blank-ID production build; not a deployed host scan',
      publicFiles: publicFiles.length,
      clientFiles: clientFiles.length,
      configuredPrivateValuesChecked: privateValues.length,
      findings,
      limitations:
        'Bounded marker/file scan, not proof of absence of every possible secret. No real webhook credentials are configured.',
      publicAssetHashes: await Promise.all(
        publicFiles.map(async (path) => ({
          file: relative(root, path).replaceAll('\\', '/'),
          sha256: createHash('sha256')
            .update(await readFile(path))
            .digest('hex'),
        })),
      ),
    },
    null,
    2,
  ) + '\n',
);
assert.deepEqual(findings, [], 'Public/client output has a flagged exposure');

const server = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    '3308',
  ],
  {
    cwd: root,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      SITE_ENV: 'staging',
      VERCEL_ENV: 'preview',
      SITE_URL: '',
      OG_IMAGE_URL: '',
      LEAD_WEBHOOK_URL: '',
      LEAD_WEBHOOK_TOKEN: '',
      NEXT_PUBLIC_GA_ID: '',
      NEXT_PUBLIC_GTM_ID: '',
      NEXT_PUBLIC_META_PIXEL_ID: '',
      VERCEL: '',
    },
  },
);
const headerKeys = [
  'content-type',
  'cache-control',
  'x-robots-tag',
  'x-content-type-options',
  'referrer-policy',
  'x-frame-options',
  'content-security-policy',
  'permissions-policy',
  'strict-transport-security',
  'server',
  'x-powered-by',
  'x-vercel-cache',
  'x-nextjs-cache',
  'age',
  'location',
];
const headers = (response) =>
  Object.fromEntries(headerKeys.map((key) => [key, response.headers.get(key)]));
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      ready = (await fetch(`${origin}/en`)).ok;
    } catch {
      /* Startup only. */
    }
    if (ready) break;
    await new Promise((done) => setTimeout(done, 250));
  }
  assert(ready, 'Local staging-mode server did not start');
  const paths = [
    '/',
    '/en',
    '/ka',
    '/ru',
    '/he',
    '/robots.txt',
    '/sitemap.xml',
    '/fr',
    '/en/unknown',
    '/%ZZ',
    '/.env',
    '/.git/config',
    '/AGENTS.md',
    '/CODEX_TASK.md',
    '/docs/phase-7b-report.md',
    '/reference/Dragon_Point_Project_State_and_Changelog.md',
    '/dragon-point-visuals/',
    '/dragon-point-visuals',
    '/api/leads',
  ];
  const routes = [];
  for (const path of paths) {
    const response = await fetch(`${origin}${path}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'Twitterbot' },
    });
    const body = await response.text();
    assert(
      !markers.slice(0, 5).some((marker) => body.includes(marker)),
      'Private path exposed in response',
    );
    if (['/en', '/ka', '/ru', '/he'].includes(path)) {
      assert.equal(response.status, 200);
      assert.match(body, /name="robots" content="noindex, nofollow"/);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    }
    if (path === '/') {
      assert.equal(response.status, 307);
      assert.equal(response.headers.get('location'), '/en');
    }
    if (path === '/robots.txt') assert.match(body, /Disallow: \//);
    if (path === '/sitemap.xml')
      assert(!body.includes('<loc>'), 'Preview sitemap publishes URLs');
    if (path === '/%ZZ') {
      assert.equal(response.status, 400);
      assert.equal(body, '');
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    if (
      [
        '/fr',
        '/en/unknown',
        '/.env',
        '/.git/config',
        '/AGENTS.md',
        '/CODEX_TASK.md',
        '/docs/phase-7b-report.md',
        '/reference/Dragon_Point_Project_State_and_Changelog.md',
        '/dragon-point-visuals',
      ].includes(path)
    )
      assert.equal(response.status, 404, 'Private or unknown route is served');
    routes.push({
      path,
      status: response.status,
      headers: headers(response),
      bodyBytes: Buffer.byteLength(body),
    });
  }
  browser = await chromium.launch();
  const locales = [];
  const assets = new Set();
  for (const locale of ['en', 'ka', 'ru', 'he']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (!request.url().startsWith(origin) && /^https?:/.test(request.url()))
        external.push(new URL(request.url()).origin);
    });
    await page.goto(`${origin}/${locale}`);
    await page.locator('#lead-name').waitFor({ state: 'visible' });
    await page.waitForFunction(
      () =>
        !document.getElementById('lead-name')?.closest('fieldset')?.disabled,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.reload();
    await page.waitForFunction(
      () =>
        !document.getElementById('lead-name')?.closest('fieldset')?.disabled,
    );
    await page.evaluate(() => document.fonts.ready);
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      h1: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      hero: document.querySelector('.dp-architecture-image')?.currentSrc,
      fonts: [...document.fonts]
        .filter((font) => font.status === 'loaded')
        .map((font) => ({ family: font.family, weight: font.weight })),
      resources: performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => /\.(woff2|js)(\?|$)/.test(url)),
    }));
    assert.equal(state.lang, locale);
    assert.equal(state.dir, locale === 'he' ? 'rtl' : 'ltr');
    assert.equal(state.h1, 1);
    assert.equal(state.overflow, false);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    state.resources.forEach((url) => assets.add(url));
    if (state.hero) assets.add(state.hero);
    locales.push({
      locale,
      directAndRefresh: 'passed',
      ...state,
      errors,
      external,
    });
    await context.close();
  }
  const assetRequests = [];
  for (const url of assets) {
    for (let repetition = 1; repetition <= 2; repetition++) {
      const response = await fetch(url, {
        headers: { accept: 'image/webp,*/*' },
      });
      assert.equal(response.status, 200);
      assetRequests.push({
        path: new URL(url).pathname + new URL(url).search,
        repetition,
        headers: headers(response),
        bodyBytes: (await response.arrayBuffer()).byteLength,
      });
    }
  }
  await writeFile(
    resolve(output, 'local-staging-observations.json'),
    JSON.stringify(
      {
        scope:
          'Local production build in staging/preview mode; HTTP localhost; no real hosting/CDN/device claims',
        configuration: {
          SITE_ENV: 'staging',
          VERCEL_ENV: 'preview',
          SITE_URL: 'empty',
          providers: 'blank',
          receiver: 'unconfigured',
        },
        routes,
        locales,
        assetRequests,
        limitations:
          'Repeated requests show local response/origin-cache policy only. No HTTPS, CDN cold/warm, HSTS host or physical-device validation.',
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      output: 'docs/audits/phase-8',
      routes: routes.length,
      locales: locales.length,
      assetRequests: assetRequests.length,
      publicScanFindings: findings.length,
    }),
  );
} finally {
  if (browser) await browser.close();
  server.kill();
}
