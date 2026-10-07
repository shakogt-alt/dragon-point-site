import { test, expect } from '@playwright/test';
import { necessaryOnly } from './consent-fixture';
import { readFileSync } from 'node:fs';

for (const locale of ['en', 'ka', 'ru', 'he']) {
  for (const viewport of [
    { width: 390, height: 844, deviceScaleFactor: 2 },
    { width: 1440, height: 900, deviceScaleFactor: 3 },
  ]) {
    test(`${locale}: bounded assets at ${viewport.width}px DPR${viewport.deviceScaleFactor}`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
      });
      const page = await context.newPage();
      const external: string[] = [];
      const errors: string[] = [];
      page.on('request', (request) => {
        if (!request.url().startsWith('http://127.0.0.1:3300/'))
          external.push(request.url());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await necessaryOnly(page);
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const image = page.locator('.dp-architecture-image');
      await image.evaluate((el: HTMLImageElement) => el.decode());
      const candidates = (await image.getAttribute('srcset'))!
        .split(',')
        .map((entry) =>
          Number(
            new URL(
              entry.trim().split(' ')[0],
              'http://127.0.0.1:3300',
            ).searchParams.get('w'),
          ),
        );
      expect(Math.max(...candidates)).toBeLessThanOrEqual(1600);
      expect(
        Number(
          new URL(
            await image.evaluate((el: HTMLImageElement) => el.currentSrc),
          ).searchParams.get('w'),
        ),
      ).toBeLessThanOrEqual(1600);
      const bytes = await page.evaluate(() => {
        const resources = performance.getEntriesByType(
          'resource',
        ) as PerformanceResourceTiming[];
        return {
          fonts: resources
            .filter((r) => /\.(woff2|ttf)(\?|$)/.test(r.name))
            .reduce((sum, r) => sum + r.encodedBodySize, 0),
          scripts: resources
            .filter((r) => r.initiatorType === 'script')
            .reduce((sum, r) => sum + r.encodedBodySize, 0),
        };
      });
      expect(bytes.fonts).toBeGreaterThan(0);
      // Combined KA/RU dictionary faces retain punctuation/script positioning.
      expect(bytes.fonts).toBeLessThanOrEqual(
        locale === 'he'
          ? 65000
          : locale === 'ru'
            ? 390000
            : locale === 'ka'
              ? 340000
              : 220000,
      );
      expect(bytes.scripts).toBeLessThanOrEqual(200000);
      await expect(page.locator('#lead-name')).toBeEnabled();
      await page.locator('#lead-name').focus();
      await page.locator('#lead-form button[type="submit"]').click();
      await expect(page.locator('#lead-name')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(page.locator('#lead-name')).toBeFocused();
      expect(external).toEqual([]);
      expect(errors).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await context.close();
    });
  }
}

for (const locale of ['en', 'ka', 'ru', 'he']) {
  test(`${locale}: dictionary typography retains original shaping across punctuation`, async ({
    page,
  }) => {
    await necessaryOnly(page);
    await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
    const originals =
      locale === 'he'
        ? [
            {
              weight: '100 900',
              bytes: readFileSync(
                'src/assets/fonts/hebrew/NotoSansHebrew-Variable.ttf',
              ).toString('base64'),
            },
          ]
        : ['Regular', 'Medium', 'SemiBold', 'Bold'].map((name, i) => ({
            weight: String(400 + i * 100),
            bytes: readFileSync(
              `src/assets/fonts/FiraGO-${name}.woff2`,
            ).toString('base64'),
          }));
    const differences = await page.evaluate(
      async ({ originals, hebrew }) => {
        for (const source of originals) {
          const face = new FontFace(
            'OriginalDictionaryOracle',
            `url(data:font/${hebrew ? 'ttf' : 'woff2'};base64,${source.bytes})`,
            { weight: source.weight },
          );
          document.fonts.add(await face.load());
        }
        await document.fonts.ready;
        const ctx = document.createElement('canvas').getContext('2d')!;
        return [
          ...document.querySelectorAll('h1,h2,h3,p,label,button,.dp-action'),
        ].flatMap((node) => {
          const style = getComputedStyle(node),
            text = node.textContent ?? '';
          ctx.font = `${style.fontWeight} 100px ${style.fontFamily}`;
          const actual = ctx.measureText(text).width;
          ctx.font = `${style.fontWeight} 100px "OriginalDictionaryOracle", "${hebrew ? 'Noto Hebrew Fallback' : 'FiraGO Fallback'}", Arial, sans-serif`;
          const expected = ctx.measureText(text).width;
          return Math.abs(actual - expected) > 0.001
            ? [{ text, actual, expected }]
            : [];
        });
      },
      { originals, hebrew: locale === 'he' },
    );
    expect(differences).toEqual([]);
  });
}

test('deferred validation waits for its download without blocking fields or submitting early', async ({
  page,
}) => {
  await necessaryOnly(page);
  await page.goto('/en', { waitUntil: 'networkidle' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let downloads = 0;
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    downloads++;
    await gate;
    await route.continue();
  });
  let leads = 0;
  await page.route('**/api/leads', (route) => {
    leads++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    });
  });
  await page.locator('#lead-name').fill('Test Person');
  await page.locator('#lead-phone').fill('+972 50 123 4567');
  await page.locator('#lead-form button[type="submit"]').click();
  await expect(page.locator('#lead-form')).toHaveAttribute('aria-busy', 'true');
  expect(downloads).toBeGreaterThan(0);
  expect(leads).toBe(0);
  release();
  await expect(page.locator('.dp-lead-success')).toBeVisible();
  expect(leads).toBe(1);
});

test('failed validator download stays fail-closed, retains inputs and permits retry', async ({
  page,
}) => {
  await necessaryOnly(page);
  await page.goto('/he', { waitUntil: 'networkidle' });
  await page.route('**/_next/static/chunks/*.js', (route) =>
    route.abort('failed'),
  );
  let leads = 0;
  await page.route('**/api/leads', (route) => {
    leads++;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    });
  });
  await page.locator('#lead-name').fill('Test Person');
  await page.locator('#lead-phone').fill('+972 50 123 4567');
  await page.locator('#lead-form button[type="submit"]').click();
  await expect(page.locator('.dp-lead-feedback')).toBeVisible();
  await expect(page.locator('#lead-form')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expect(page.locator('#lead-name')).toHaveValue('Test Person');
  await expect(page.locator('#lead-phone')).toHaveValue('+972 50 123 4567');
  expect(leads).toBe(0);
  await page.unroute('**/_next/static/chunks/*.js');
  await page.locator('#lead-form button[type="submit"]').click();
  await expect(page.locator('.dp-lead-success')).toBeVisible();
  expect(leads).toBe(1);
});

test('delayed invalid submission focuses the first error after re-enabling fields', async ({
  page,
}) => {
  await necessaryOnly(page);
  await page.goto('/ru', { waitUntil: 'networkidle' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await gate;
    await route.continue();
  });
  await page.locator('#lead-name').focus();
  await page.locator('.dp-lead-submit').click();
  await expect(page.locator('#lead-form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#lead-name')).toBeDisabled();
  release();
  await expect(page.locator('#lead-form')).toHaveAttribute(
    'aria-busy',
    'false',
  );
  await expect(page.locator('#lead-name')).toBeEnabled();
  await expect(page.locator('#lead-name')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.locator('#lead-name')).toBeFocused();
  // Editing another field must not repeatedly take focus back to the first error.
  await page.locator('#lead-phone').fill('+972 50 123 4567');
  await expect(page.locator('#lead-phone')).toBeFocused();
});

test('hashed fonts are immutable; lead and locale responses are not publicly cached', async ({
  page,
  request,
}) => {
  await necessaryOnly(page);
  await page.goto('/en');
  const font = await page
    .locator('link[rel="preload"][as="font"]')
    .first()
    .getAttribute('href');
  expect((await request.get(font!)).headers()['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  );
  const lead = await request.post('/api/leads', { data: {} });
  expect(lead.headers()['cache-control']).toContain('no-store');
  const html = await request.get('/he');
  expect(html.headers()['cache-control']).toContain('no-store');
  expect(html.headers()['cache-control']).not.toContain('immutable');
});

for (const locale of ['en', 'ka', 'ru', 'he']) {
  test(`${locale}: unrestricted enquiry text retains original browser shaping`, async ({
    page,
  }) => {
    await necessaryOnly(page);
    await page.goto(`/${locale}`, { waitUntil: 'networkidle' });
    await page.locator('#lead-name').fill('Tā Ťa Ж\u0301');
    const original = readFileSync(
      locale === 'he'
        ? 'src/assets/fonts/hebrew/NotoSansHebrew-Variable.ttf'
        : 'src/assets/fonts/FiraGO-Regular.woff2',
    ).toString('base64');
    const measurements = await page.evaluate(
      async ({ original, hebrew }) => {
        const face = new FontFace(
          'OriginalInputOracle',
          `url(data:font/${hebrew ? 'ttf' : 'woff2'};base64,${original})`,
          { weight: hebrew ? '100 900' : '400' },
        );
        document.fonts.add(await face.load());
        const family = getComputedStyle(
          document.getElementById('lead-name')!,
        ).fontFamily;
        const samples = [
          'Tā',
          'Ťa',
          'Ж\u0301',
          'e\u0301',
          'עברית English',
          'ქართული Dragon Point',
          'Русский KleekTo',
        ];
        await document.fonts.load(`400 100px ${family}`, samples.join(' '));
        const ctx = document.createElement('canvas').getContext('2d')!;
        return samples.map((text) => {
          ctx.font = `400 100px ${family}`;
          const actual = ctx.measureText(text).width;
          // Keep the approved metric-adjusted fallback for unsupported glyphs.
          ctx.font = `400 100px "OriginalInputOracle", ${family.split(',').slice(1).join(',')}`;
          return { text, actual, expected: ctx.measureText(text).width };
        });
      },
      { original, hebrew: locale === 'he' },
    );
    for (const sample of measurements)
      expect(sample.actual, sample.text).toBeCloseTo(sample.expected, 3);
  });
}
