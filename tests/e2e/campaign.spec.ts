import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Probe = Window & {
  __visit: number;
  __cleanup: { before: string; first: Record<string, unknown> }[];
  __loads: { kind: string; href: string; referrer: string }[];
  __meta: unknown[][];
  dataLayer?: unknown[];
};
const mode = process.env.DP_TEST_PROVIDER;
const storageKey = 'dragon-point:first-touch:v1';

async function mockVendors(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Probe;
    w.__visit = Math.random();
    w.__cleanup = [];
    w.__loads = [];
    w.__meta = [];
    const replace = history.replaceState;
    history.replaceState = function (state, title, url) {
      // Next initializes its own history state before effects without changing URL.
      // Record actual query removal, not that independent framework initialization.
      const next = new URL(String(url ?? location.href), location.href);
      if (
        [
          'utm_source',
          'utm_medium',
          'utm_campaign',
          'utm_content',
          'utm_term',
          'gclid',
          'fbclid',
        ].some(
          (key) =>
            new URL(location.href).searchParams.has(key) &&
            !next.searchParams.has(key),
        )
      )
        w.__cleanup.push({
          before: location.href,
          first: (() => {
            try {
              return JSON.parse(
                sessionStorage.getItem('dragon-point:first-touch:v1') ?? '{}',
              );
            } catch {
              return {};
            }
          })(),
        });
      return replace.call(history, state, title, url);
    };
  });
  // All cross-origin requests are intercepted locally, including unexpected traffic.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3304') return route.continue();
    const kind =
      url.hostname === 'connect.facebook.net'
        ? 'meta'
        : url.hostname === 'www.googletagmanager.com' &&
            url.pathname === '/gtm.js'
          ? 'gtm'
          : url.hostname === 'www.googletagmanager.com' &&
              url.pathname === '/gtag/js'
            ? 'ga'
            : null;
    if (!kind) return route.abort();
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
      window.__loads.push({ kind: '${kind}', href: location.href, referrer: document.referrer });
      ${kind === 'meta' ? `window.__meta.push(...window.fbq.queue); window.fbq.callMethod = (...args) => window.__meta.push(args);` : ''}
    `,
    });
  });
}

async function preferences(page: Page, analytics: boolean, marketing: boolean) {
  await expect(page.locator('[data-consent-settings]')).toBeEnabled();
  const customize = page.locator('[data-consent-action="customize"]');
  if (await customize.isVisible()) await customize.click();
  else await page.locator('[data-consent-settings]').click();
  await page.locator('#consent-analytics').setChecked(analytics);
  await page.locator('#consent-marketing').setChecked(marketing);
  await page.locator('[data-consent-action="save"]').click();
}

const snapshot = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as Probe;
    return {
      token: w.__visit,
      cleanup: w.__cleanup,
      loads: w.__loads,
      dataLayer: w.dataLayer ?? [],
      meta: w.__meta,
    };
  });

for (const locale of ['en', 'he'] as const) {
  test(`${mode}: ${locale} campaign activates only consented providers after capture and cleanup`, async ({
    page,
  }) => {
    const events: Record<string, unknown>[] = [];
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await mockVendors(page);
    await page.exposeFunction('recordDP', (event: Record<string, unknown>) => {
      events.push(event);
    });
    await page.addInitScript(() =>
      window.addEventListener('dragon-point:analytics', (event) => {
        void (
          window as unknown as { recordDP: (value: unknown) => Promise<void> }
        ).recordDP((event as CustomEvent).detail);
      }),
    );
    const campaign =
      locale === 'en'
        ? 'utm_source=google&utm_campaign=test'
        : 'utm_source=meta&fbclid=test';
    const query = `${campaign}&utm_medium=paid-fixture&utm_content=building-fixture&utm_term=intent-fixture&gclid=private-click`;
    const original = `http://127.0.0.1:3304/${locale}?${query}#hero`;
    await page.goto(original);
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    const initial = await snapshot(page);
    expect(initial.loads).toEqual([]);
    expect(initial.dataLayer).toEqual([]);
    expect(initial.cleanup).toHaveLength(1);
    expect(events).toEqual([]);
    await expect(page).toHaveURL('/' + locale + '#hero');

    await preferences(page, locale === 'en', locale === 'he');
    if (mode === 'gtm') {
      // Neither optional purpose alone permits this audited-container adapter.
      await page.locator('#invest .dp-action').click();
      expect((await snapshot(page)).loads).toEqual([]);
    } else {
      const expected = locale === 'en' ? 'ga' : 'meta';
      await expect
        .poll(async () => (await snapshot(page)).loads.map((l) => l.kind))
        .toEqual([expected]);
    }
    await preferences(page, true, true);
    const wanted = mode === 'gtm' ? ['gtm'] : ['ga', 'meta'];
    await expect
      .poll(async () => (await snapshot(page)).loads.map((l) => l.kind).sort())
      .toEqual(wanted);
    await expect(page).toHaveURL(new RegExp(`/${locale}#(?:hero|advisor)$`));
    const activated = await snapshot(page);
    expect(activated.token).toBe(initial.token); // replaceState, never a document reload.
    expect(activated.cleanup).toHaveLength(1);
    expect(activated.cleanup[0].first).toMatchObject({
      landingUrl: original,
      utm_source: locale === 'en' ? 'google' : 'meta',
      utm_medium: 'paid-fixture',
      utm_content: 'building-fixture',
      utm_term: 'intent-fixture',
      gclid: 'private-click',
    });
    for (const load of activated.loads) {
      expect(new URL(load.href).search).toBe('');
      expect(load.referrer).toBe('');
    }
    await preferences(page, true, true);
    expect((await snapshot(page)).loads).toHaveLength(wanted.length);

    let submitted: Record<string, unknown> = {};
    await page.route('**/api/leads', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.locator('#invest .dp-action').click();
    await page.locator('#lead-name').fill('Test Person');
    await page.locator('#lead-name').fill('Test Person Again');
    await page.locator('#lead-phone').fill('+972 50 123 4567');
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('.dp-lead-success')).toBeVisible();
    await expect
      .poll(() => events.filter((e) => e.name === 'lead_form_success').length)
      .toBe(1);
    for (const name of [
      'lead_form_open',
      'lead_form_start',
      'lead_form_submit',
      'lead_form_success',
    ])
      expect(events.filter((e) => e.name === name)).toHaveLength(1);
    expect(submitted).toMatchObject({
      landingUrl: original,
      utm_source: locale === 'en' ? 'google' : 'meta',
      utm_medium: 'paid-fixture',
      utm_content: 'building-fixture',
      utm_term: 'intent-fixture',
      gclid: 'private-click',
    });
    if (locale === 'en') expect(submitted.utm_campaign).toBe('test');
    else expect(submitted.fbclid).toBe('test');
    const measured = await snapshot(page);
    for (const values of [measured.dataLayer, measured.meta, events])
      expect(JSON.stringify(values)).not.toMatch(
        /utm_|gclid|fbclid|private@|private-click|paid-fixture|building-fixture|intent-fixture|Test Person/,
      );
    for (const values of [measured.dataLayer, measured.meta, events])
      expect(JSON.stringify(values)).not.toMatch(/"(?:google|meta|test)"/);
    const googleSuccess = measured.dataLayer.filter((e) =>
      Array.isArray(e)
        ? e[0] === 'event' && e[1] === 'lead_form_success'
        : (e as Record<string, unknown>).event === 'lead_form_success',
    );
    expect(googleSuccess).toHaveLength(1);
    if (mode !== 'gtm')
      expect(
        measured.meta.filter(
          (e) => e[0] === 'trackSingleCustom' && e[2] === 'lead_form_success',
        ),
      ).toHaveLength(1);

    const target = locale === 'en' ? 'he' : 'en';
    await page.locator(`.dp-desktop-languages a[href="/${target}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', target);
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      target === 'he' ? 'rtl' : 'ltr',
    );
    await expect
      .poll(async () => (await snapshot(page)).loads.map((l) => l.kind).sort())
      .toEqual(wanted);
    expect(
      await page.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key)!).landingUrl,
        storageKey,
      ),
    ).toBe(original);
    await expect
      .poll(() => events.some((e) => e.name === 'language_switch'))
      .toBe(true);
    expect(errors).toEqual([]);
  });
}

test(`${mode}: unsafe external referrer keeps vendors blocked after consent`, async ({
  page,
}) => {
  await mockVendors(page);
  await page.goto('/en?utm_source=google', {
    referer: 'https://referrer.test/search?email=private@example.test',
  });
  await preferences(page, true, true);
  await page.locator('#invest .dp-action').click();
  await page.locator('#lead-name').fill('Still Usable');
  await expect(page.locator('#lead-name')).toHaveValue('Still Usable');
  expect((await snapshot(page)).loads).toEqual([]);
  expect((await snapshot(page)).dataLayer).toEqual([]);
  let submitted: Record<string, unknown> = {};
  await page.route('**/api/leads', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.locator('#lead-phone').fill('+972 50 123 4567');
  await page.locator('.dp-lead-submit').click();
  await expect(page.locator('.dp-lead-success')).toBeVisible();
  expect(submitted).toMatchObject({
    landingUrl: 'http://127.0.0.1:3304/en?utm_source=google',
    utm_source: 'google',
    referrer: 'https://referrer.test/search?email=private@example.test',
  });
});

test(`${mode}: saved consent still captures before first provider execution`, async ({
  page,
}) => {
  await mockVendors(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'dragon-point:consent:v1',
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        necessary: true,
        analytics: true,
        marketing: true,
      }),
    ),
  );
  const original =
    'http://127.0.0.1:3304/he?utm_source=meta&fbclid=test#advisor';
  await page.goto(original);
  const wanted = mode === 'gtm' ? ['gtm'] : ['ga', 'meta'];
  await expect
    .poll(async () => (await snapshot(page)).loads.map((l) => l.kind).sort())
    .toEqual(wanted);
  const result = await snapshot(page);
  expect(result.cleanup).toHaveLength(1);
  expect(result.cleanup[0].first).toMatchObject({
    landingUrl: original,
    utm_source: 'meta',
    fbclid: 'test',
  });
  for (const load of result.loads) expect(new URL(load.href).search).toBe('');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.dp-consent-banner')).toBeHidden();
});

test(`${mode}: blocked session storage keeps original lead attribution after cleanup`, async ({
  page,
}) => {
  await mockVendors(page);
  await page.addInitScript(() =>
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw Error('blocked');
      },
    }),
  );
  const original =
    'http://127.0.0.1:3304/en?utm_source=google&utm_campaign=test';
  await page.goto(original);
  await preferences(page, true, true);
  await expect
    .poll(async () => (await snapshot(page)).loads.length)
    .toBe(mode === 'gtm' ? 1 : 2);
  await expect(page).toHaveURL('/en');
  let submitted: Record<string, unknown> = {};
  await page.route('**/api/leads', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.locator('#lead-name').fill('Test Person');
  await page.locator('#lead-phone').fill('+972 50 123 4567');
  await page.locator('.dp-lead-submit').click();
  await expect(page.locator('.dp-lead-success')).toBeVisible();
  expect(submitted).toMatchObject({
    landingUrl: original,
    utm_source: 'google',
    utm_campaign: 'test',
  });
});

test(
  mode + ': unrelated query remains and blocks vendors after both consents',
  async ({ page }) => {
    await mockVendors(page);
    const original =
      'http://127.0.0.1:3304/he?utm_source=meta&fbclid=test&email=private%40example.test#hero';
    await page.goto(original);
    await expect(page).toHaveURL('/he?email=private%40example.test#hero');
    await preferences(page, true, true);
    await page.locator('#invest .dp-action').click();
    await page.locator('#lead-name').fill('Still Usable');
    const measured = await snapshot(page);
    expect(measured.loads).toEqual([]);
    expect(measured.dataLayer).toEqual([]);
    expect(measured.meta).toEqual([]);
    expect(measured.cleanup).toHaveLength(1);
    expect(measured.cleanup[0].first).toMatchObject({
      landingUrl: original,
      utm_source: 'meta',
      fbclid: 'test',
    });
    await expect(page).toHaveURL('/he?email=private%40example.test#advisor');
  },
);
