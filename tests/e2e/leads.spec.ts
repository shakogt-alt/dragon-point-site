import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { necessaryOnly } from './consent-fixture';

test.beforeEach(async ({ page }) => {
  await necessaryOnly(page);
});

const locales = ['en', 'ka', 'ru', 'he'] as const;
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];

test('API rejects invalid payload, honeypot and cross-origin requests; no receiver never succeeds', async ({
  request,
}) => {
  const valid = {
    intent: 'buy',
    name: 'Test Person',
    phone: '+972 50 123 4567',
    email: '',
    budget: '',
    message: '',
    preferredLanguage: 'en',
    locale: 'en',
    source: 'dragon-point-landing',
    submissionId: '71da1176-f50a-4c21-9281-47d3bc9bdbe4',
    website: '',
    landingUrl: 'http://127.0.0.1:3300/en',
  };
  expect(
    (
      await request.post('/api/leads', { data: { ...valid, phone: 'invalid' } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/leads', {
        data: { ...valid, website: 'bot.example' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/leads', {
        data: valid,
        headers: { Origin: 'https://attacker.test' },
      })
    ).status(),
  ).toBe(403);
  const missing = await request.post('/api/leads', { data: valid });
  expect(missing.status()).toBe(503);
  expect(await missing.json()).toEqual({ ok: false, code: 'unavailable' });
});

for (const locale of locales) {
  test(`${locale}: short mobile CTA keeps focused input visible`, async ({
    page,
  }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 640 });
      await page.goto(`/${locale}`);
      await page.locator('#goals').scrollIntoViewIfNeeded();
      await expect(page.locator('.dp-mobile-lead-cta')).toBeVisible();
      await page.locator('.dp-mobile-lead-cta a').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#lead-name')).toBeFocused();
      const box = (await page.locator('#lead-name').boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(640);
      const header = (await page.locator('header').boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
    }
  });
  test(`${locale}: lead validation, goal intent, focus, success and error`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/${locale}`);
    const form = page.locator('#lead-form');
    await expect(form).toBeVisible();
    if (['en', 'ru', 'he'].includes(locale)) {
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#advisor').screenshot({
        path: info.outputPath(`${locale}-desktop-lead.png`),
        style:
          '.dp-header, .dp-skip-link, .dp-mobile-lead-cta { visibility: hidden !important; }',
      });
    }
    await page.locator('.dp-header-advisor').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('#lead-name-error')).toBeVisible();
    await expect(page.locator('#lead-phone-error')).toBeVisible();
    await expect(page.locator('#lead-name')).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    for (const intent of ['buy', 'invest', 'sell']) {
      await page.locator(`#${intent} a`).click();
      await expect(
        form.locator(`input[name="intent"][value="${intent}"]`),
      ).toBeChecked();
      await expect(page.locator('#lead-name')).toBeFocused();
    }
    await page.locator('#hero .dp-action').first().click();
    await expect(form.locator('input[value="buy"]')).toBeChecked();
    await expect(page.locator('#lead-name')).toBeFocused();
    await page.locator('#invest').click({ position: { x: 20, y: 20 } });
    await expect(form.locator('input[value="invest"]')).toBeChecked();
    await expect(page.locator('#lead-name')).toBeInViewport();
    await page.locator('#lead-name').fill('Test Person');
    await page.locator('#lead-phone').fill('+972 50 123 4567');
    await page.locator('#lead-email').fill('person@example.test');
    await page.locator('#lead-budget').fill('USD 250,000');
    await page
      .locator('#lead-message')
      .fill(locale === 'he' ? 'דירה בטביליסי' : 'A place in Tbilisi');
    await page.locator('#lead-preferredLanguage').selectOption('ru');
    await expect(page.locator('#lead-phone')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#lead-email')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'rtl' : 'ltr',
    );
    await page.route('**/api/leads', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, code: 'unavailable' }),
      }),
    );
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.dp-lead-feedback[role="alert"]')).toBeVisible();
    await expect(page.locator('#lead-name')).toHaveValue('Test Person');
    expect(await page.locator('.dp-lead-feedback').innerText()).not.toContain(
      'unavailable',
    );
    await page.unroute('**/api/leads');
    let submitted: Record<string, unknown> = {};
    await page.route('**/api/leads', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    });
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.dp-lead-success')).toBeFocused();
    await expect(form).toBeHidden();
    expect(submitted).toMatchObject({
      intent: 'invest',
      name: 'Test Person',
      phone: '+972501234567',
      email: 'person@example.test',
      budget: 'USD 250,000',
      preferredLanguage: 'ru',
      locale,
      source: 'dragon-point-landing',
      website: '',
    });
    expect(errors).toEqual([]);
  });

  test(`${locale}: responsive lead fields, keyboard, RTL and sticky CTA`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('#advisor').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator(
            '#lead-form input:not([name="website"]), #lead-form select, #lead-form textarea',
          )
          .evaluateAll((els) =>
            els.some(
              (el) =>
                el.getBoundingClientRect().right > innerWidth + 1 ||
                el.getBoundingClientRect().left < -1,
            ),
          ),
      ).toBe(false);
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/${locale}`);
    const sticky = page.locator('.dp-mobile-lead-cta');
    await expect(sticky).toBeHidden();
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(sticky).toBeVisible();
    expect(await sticky.evaluate((el) => getComputedStyle(el).position)).toBe(
      'fixed',
    );
    if (locale === 'en')
      await page.screenshot({ path: info.outputPath('en-mobile-sticky.png') });
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-consent-ui', 'open'),
    );
    await expect(sticky).toBeHidden();
    await page.evaluate(() =>
      document.documentElement.removeAttribute('data-consent-ui'),
    );
    await expect(sticky).toBeVisible();
    await page.addStyleTag({
      content: '.consent-fixture-hidden { display: none; }',
    });
    await page.evaluate(() => {
      const overlay = document.createElement('div');
      overlay.id = 'consent-fixture';
      overlay.dataset.consentOverlay = '';
      overlay.className = 'consent-fixture-hidden';
      document.body.appendChild(overlay);
    });
    await expect(page.locator('#consent-fixture')).toBeHidden();
    await page.evaluate(() =>
      document.getElementById('consent-fixture')?.removeAttribute('class'),
    );
    await expect(sticky).toBeHidden();
    await page.evaluate(() =>
      document.getElementById('consent-fixture')?.remove(),
    );
    await expect(sticky).toBeVisible();
    await page.locator('.dp-mobile-menu summary').click();
    await expect(sticky).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(sticky).toBeVisible();
    await sticky.locator('a').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await expect(sticky).toBeHidden();
    await page.keyboard.press('Tab');
    await expect(page.locator('#lead-phone')).toBeFocused();
    await page.locator('#lead-form button[type="submit"]').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (locale === 'he')
      await page.locator('#advisor').screenshot({
        path: info.outputPath('he-mobile-lead.png'),
        style:
          '.dp-header, .dp-skip-link, .dp-mobile-lead-cta { visibility: hidden !important; }',
      });
  });
}

test('first-touch campaign survives locale changes and is submitted unchanged', async ({
  page,
}) => {
  await page.goto(
    '/en?utm_source=search&utm_medium=cpc&utm_campaign=georgia&utm_content=building&utm_term=property&gclid=g1&fbclid=f1',
  );
  await page.locator('.dp-desktop-languages a[href="/he"]').click();
  await page.goto('/ru?utm_source=later');
  await page.locator('#lead-name').fill('Test Person');
  await page.locator('#lead-phone').fill('+44 20 7946 0958');
  let payload: Record<string, unknown> = {};
  await page.route('**/api/leads', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    });
  });
  await page.locator('#lead-form button[type="submit"]').click();
  await expect(page.locator('.dp-lead-success')).toBeVisible();
  expect(payload).toMatchObject({
    locale: 'ru',
    utm_source: 'search',
    utm_medium: 'cpc',
    utm_campaign: 'georgia',
    utm_content: 'building',
    utm_term: 'property',
    gclid: 'g1',
    fbclid: 'f1',
  });
  expect(payload.landingUrl).toContain('/en?utm_source=search');
});

for (const locale of locales) {
  test(`${locale}: submission UUID survives delivery failures and resets only after confirmed success`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto(`/${locale}`);
    await expect(page.locator('#lead-name')).toBeEnabled();
    const fill = async () => {
      await page.locator('#lead-name').fill('Test Person');
      await page.locator('#lead-phone').fill('+995555000000');
    };
    await fill();
    let outcome: 'unavailable' | 'rate' | 'network' | 'timeout' | 'success' =
      'unavailable';
    const payloads: Record<string, unknown>[] = [];
    await page.route('**/api/leads', async (route) => {
      payloads.push(route.request().postDataJSON());
      if (outcome === 'network') return route.abort('connectionfailed');
      if (outcome === 'timeout') return;
      await route.fulfill({
        status: outcome === 'success' ? 200 : outcome === 'rate' ? 429 : 503,
        contentType: 'application/json',
        body: JSON.stringify(
          outcome === 'success'
            ? { ok: true }
            : {
                ok: false,
                code: outcome === 'rate' ? 'rate_limited' : 'unavailable',
              },
        ),
      });
    });
    const submit = page.locator('#lead-form button[type="submit"]');
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    let lifecycleId: unknown;
    for (const failure of [
      'unavailable',
      'rate',
      'network',
      'timeout',
    ] as const) {
      outcome = failure;
      const previous = payloads.length;
      await submit.click();
      await expect.poll(() => payloads.length).toBe(previous + 1);
      expect(payloads.at(-1)?.submissionId).toMatch(uuid);
      lifecycleId ??= payloads.at(-1)?.submissionId;
      expect(payloads.at(-1)?.submissionId).toBe(lifecycleId);
      await expect(page.locator('.dp-lead-feedback')).toBeVisible({
        timeout: 15000,
      });
      await expect(submit).toBeEnabled();
      await expect(page.locator('#lead-name')).toHaveValue('Test Person');
      await expect(page.locator('#lead-phone')).toHaveValue('+995555000000');
    }
    outcome = 'success';
    await submit.click();
    await expect(page.locator('.dp-lead-success')).toBeVisible();
    expect(payloads.at(-1)?.submissionId).toBe(lifecycleId);
    expect(payloads).toHaveLength(5);
    await page.locator('.dp-lead-success button').click();
    await fill();
    await submit.click();
    await expect(page.locator('.dp-lead-success')).toBeVisible();
    expect(payloads).toHaveLength(6);
    expect(payloads.at(-1)?.submissionId).toMatch(uuid);
    expect(payloads.at(-1)?.submissionId).not.toBe(lifecycleId);
    expect(
      await page.evaluate(() =>
        Object.keys(
          JSON.parse(
            sessionStorage.getItem('dragon-point:first-touch:v1') ?? '{}',
          ),
        ),
      ),
    ).not.toContain('submissionId');
  });
}
