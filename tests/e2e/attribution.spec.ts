import { expect, test } from '@playwright/test';

const key = 'dragon-point:first-touch:v1';
const query =
  'utm_source=first&utm_medium=cpc&utm_campaign=staging&utm_content=building&utm_term=property&gclid=click-1&fbclid=click-2';
type Probe = Window & {
  cleanup: Record<string, unknown>[];
  visit: number;
  dataLayer?: unknown[];
  fbq?: unknown;
};

for (const locale of ['en', 'ka', 'ru', 'he']) {
  test(
    locale +
      ': no IDs and denied consent still persist then clean all campaign keys without reload',
    async ({ page }) => {
      const requests: string[] = [],
        errors: string[] = [];
      page.on('request', (r) => {
        if (/googletagmanager|google-analytics|facebook/.test(r.url()))
          requests.push(r.url());
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(() => {
        localStorage.setItem(
          'dragon-point:consent:v1',
          JSON.stringify({
            version: 1,
            updatedAt: Date.now(),
            necessary: true,
            analytics: false,
            marketing: false,
          }),
        );
        const w = window as unknown as Probe;
        w.cleanup = [];
        w.visit = Math.random();
        const replace = history.replaceState;
        history.replaceState = function (state, title, url) {
          const before = new URL(location.href),
            next = new URL(String(url ?? location.href), location.href);
          if (
            before.searchParams.has('utm_source') &&
            !next.searchParams.has('utm_source')
          )
            w.cleanup.push({
              original: location.href,
              visit: w.visit,
              statePreserved: state === history.state,
              first: JSON.parse(
                sessionStorage.getItem('dragon-point:first-touch:v1') ?? '{}',
              ),
            });
          return replace.call(history, state, title, url);
        };
      });
      const original =
        'http://127.0.0.1:3300/' + locale + '?' + query + '&foo=bar#hero';
      await page.goto(original);
      await expect(page.locator('[data-consent-settings]')).toBeEnabled();
      await expect(page).toHaveURL('/' + locale + '?foo=bar#hero');
      const result = await page.evaluate(() => {
        const w = window as unknown as Probe;
        return {
          cleanup: w.cleanup,
          visit: w.visit,
          layer: w.dataLayer ?? [],
          pixel: !!w.fbq,
        };
      });
      expect(result.cleanup).toHaveLength(1);
      expect(result.cleanup[0]).toMatchObject({
        original,
        visit: result.visit,
        statePreserved: true,
        first: {
          landingUrl: original,
          utm_source: 'first',
          utm_medium: 'cpc',
          utm_campaign: 'staging',
          utm_content: 'building',
          utm_term: 'property',
          gclid: 'click-1',
          fbclid: 'click-2',
        },
      });
      expect(result.layer).toEqual([]);
      expect(result.pixel).toBe(false);
      expect(requests).toEqual([]);
      expect(errors).toEqual([]);
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        locale === 'he' ? 'rtl' : 'ltr',
      );
      await expect(page.locator('h1')).toHaveCount(1);
    },
  );
}

for (const [analytics, marketing] of [
  [false, true],
  [true, false],
]) {
  test(
    'cleanup is independent of separate consent: analytics=' +
      analytics +
      ', marketing=' +
      marketing,
    async ({ page }) => {
      await page.addInitScript(
        ({ analytics, marketing }) => {
          localStorage.setItem(
            'dragon-point:consent:v1',
            JSON.stringify({
              version: 1,
              updatedAt: Date.now(),
              necessary: true,
              analytics,
              marketing,
            }),
          );
        },
        { analytics, marketing },
      );
      await page.goto('/he?utm_source=meta&fbclid=test#advisor');
      await expect(page).toHaveURL('/he#advisor');
      expect(
        await page.evaluate(() => (window as unknown as Probe).dataLayer ?? []),
      ).toEqual([]);
      expect(
        await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key),
      ).toMatchObject({ utm_source: 'meta', fbclid: 'test' });
    },
  );
}

test('later campaign URLs clean without overwriting stored first touch', async ({
  page,
}) => {
  await page.goto('/en?utm_source=first&gclid=original');
  await expect(page).toHaveURL('/en');
  await page.goto('/he?utm_source=later&fbclid=new&foo=bar');
  await expect(page).toHaveURL('/he?foo=bar');
  expect(
    await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key),
  ).toMatchObject({
    landingUrl: 'http://127.0.0.1:3300/en?utm_source=first&gclid=original',
    utm_source: 'first',
    gclid: 'original',
  });
});

test('root redirect preserves campaigns before client capture', async ({
  request,
  page,
}) => {
  const response = await request.get(
    '/?utm_source=test&utm_campaign=staging&foo=bar',
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    '/en?utm_source=test&utm_campaign=staging&foo=bar',
  );
  await page.goto('/?utm_source=test&utm_campaign=staging&foo=bar');
  await expect(page).toHaveURL('/en?foo=bar');
  expect(
    await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)!), key),
  ).toMatchObject({
    landingUrl:
      'http://127.0.0.1:3300/en?utm_source=test&utm_campaign=staging&foo=bar',
    utm_source: 'test',
    utm_campaign: 'staging',
  });
});

for (const broken of ['malformed', 'unavailable']) {
  test(
    broken +
      ' session storage keeps rendering and original lead attribution after cleanup',
    async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript((broken) => {
        if (broken === 'malformed')
          sessionStorage.setItem('dragon-point:first-touch:v1', '{broken');
        else
          Object.defineProperty(window, 'sessionStorage', {
            get() {
              throw Error('blocked');
            },
          });
      }, broken);
      const original =
        'http://127.0.0.1:3300/he?utm_source=meta&gclid=original&foo=bar';
      await page.goto(original);
      await expect(page).toHaveURL('/he?foo=bar');
      await page.locator('[data-consent-action="necessary"]').click();
      let submitted: Record<string, unknown> = {};
      await page.route('**/api/leads', async (route) => {
        submitted = route.request().postDataJSON();
        await route.fulfill({ json: { ok: false, code: 'unavailable' } });
      });
      await page.locator('#lead-name').fill('Test Person');
      await page.locator('#lead-phone').fill('+12025550123');
      await page.locator('.dp-lead-submit').click();
      await expect(page.locator('.dp-lead-feedback')).toBeVisible();
      expect(submitted).toMatchObject({
        landingUrl: original,
        utm_source: 'meta',
        gclid: 'original',
      });
      expect(errors).toEqual([]);
    },
  );
}
