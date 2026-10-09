import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const locales = ['en', 'ka', 'ru', 'he'] as const;
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const key = 'dragon-point:consent:v1';

for (const [locale, campaign] of [
  ['en', 'utm_source=google&utm_campaign=test'],
  ['he', 'utm_source=meta&fbclid=test'],
] as const) {
  test(`${locale}: missing IDs preserve campaign attribution without loading vendors`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (/googletagmanager|google-analytics|facebook/.test(request.url()))
        requests.push(request.url());
    });
    const response = await page.goto(`/${locale}?${campaign}`);
    const original = response!.url();
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    await page.locator('[data-consent-action="all"]').click();
    await expect(page).toHaveURL('/' + locale);
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'rtl' : 'ltr',
    );
    await page.locator('#lead-name').fill('Test Person');
    await page.locator('#lead-phone').fill('+972 50 123 4567');
    let submitted: Record<string, unknown> = {};
    await page.route('**/api/leads', async (route) => {
      submitted = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('.dp-lead-success')).toBeVisible();
    expect(submitted.landingUrl).toBe(original);
    expect(submitted.utm_source).toBe(locale === 'en' ? 'google' : 'meta');
    expect(requests).toEqual([]);
  });
}

test('root campaign redirect preserves query for localized first-touch capture', async ({
  page,
}) => {
  const response = await page.goto(
    '/?utm_source=google&utm_campaign=test&fbclid=one&fbclid=two',
  );
  expect(response!.url()).toContain(
    '/en?utm_source=google&utm_campaign=test&fbclid=one&fbclid=two',
  );
  await expect(page).toHaveURL('/en');
  await expect(page.locator('[data-consent-settings]')).toBeEnabled();
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('dragon-point:first-touch:v1')!),
    ),
  ).toMatchObject({
    utm_source: 'google',
    utm_campaign: 'test',
    fbclid: 'one',
  });
});

for (const locale of locales) {
  test(`${locale}: first visit, necessary-only, reopening, keyboard and sticky CTA`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/${locale}`);
    await expect(page.locator('.dp-consent-banner')).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    if (locale === 'en')
      await page.screenshot({
        path: 'docs/screenshots/phase-5/en-390-banner.png',
      });
    await page.locator('[data-consent-action="customize"]').click();
    const dialog = page.locator('.dp-consent-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#consent-analytics')).not.toBeChecked();
    await expect(page.locator('#consent-marketing')).not.toBeChecked();
    await expect(page.locator('#consent-necessary')).toBeChecked();
    await expect(page.locator('#consent-necessary')).toBeDisabled();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[data-consent-action="save"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.dp-consent-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(
      page.locator('[data-consent-action="customize"]'),
    ).toBeFocused();
    await page.locator('[data-consent-action="necessary"]').click();
    await expect(page.locator('.dp-consent-banner')).toBeHidden();
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeVisible();
    await page.locator('[data-consent-settings]').click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeHidden();
    await page.locator('#consent-analytics').check();
    await page.locator('[data-consent-action="save"]').click();
    await page.reload();
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    await expect(page.locator('.dp-consent-banner')).toBeHidden();
    const record = await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!),
      key,
    );
    expect(record.analytics).toBe(true);
    expect(record.marketing).toBe(false);
    await page.locator('[data-consent-settings]').click();
    await expect(page.locator('#consent-analytics')).toBeChecked();
    await page.locator('[data-consent-action="necessary"]').click();
    expect(
      (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key))
        .analytics,
    ).toBe(false);
    expect(errors).toEqual([]);
  });

  test(`${locale}: private form values never enter consented funnel or language events`, async ({
    page,
  }) => {
    const events: Record<string, unknown>[] = [];
    const requests: string[] = [];
    await page.exposeFunction('recordDP', (event: Record<string, unknown>) =>
      events.push(event),
    );
    await page.addInitScript(() => {
      window.addEventListener('dragon-point:analytics', (event) => {
        void (
          window as unknown as Window & {
            recordDP: (event: unknown) => Promise<void>;
          }
        ).recordDP((event as CustomEvent).detail);
      });
    });
    page.on('request', (request) => {
      if (/google-analytics|googletagmanager|facebook/.test(request.url()))
        requests.push(request.url());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(
      `/${locale}?utm_source=private@example.test&gclid=private-click#hero`,
    );
    await page.locator('#hero .dp-action').first().click();
    await page.locator('#lead-name').fill('Private Name');
    expect(events).toEqual([]);
    expect(requests).toEqual([]);
    await page.locator('[data-consent-action="all"]').click();
    expect(events).toEqual([]); // No replay of actions made before consent.
    await page.locator('#sell .dp-action').click();
    await page.locator('#hero .dp-action').first().click();
    await expect
      .poll(() =>
        events.some(
          (e) => e.name === 'hero_find_property_click' && e.intent === 'buy',
        ),
      )
      .toBe(true);
    await page.locator('.dp-lead-submit').click();
    await expect
      .poll(() =>
        events.some(
          (e) => e.name === 'lead_form_error' && e.errorKind === 'validation',
        ),
      )
      .toBe(true);
    await page.locator('#invest .dp-action').click();
    await page.locator('#lead-name').fill('Private Person');
    await page.locator('#lead-phone').fill('+995 555 123 456');
    await page.locator('#lead-email').fill('private@example.test');
    await page.locator('#lead-message').fill('Private message');
    await page.route('**/api/leads', (route) =>
      route.fulfill({ json: { ok: false, code: 'private-backend-detail' } }),
    );
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('.dp-lead-feedback[role="alert"]')).toBeVisible();
    await expect
      .poll(() =>
        events.some(
          (e) => e.name === 'lead_form_error' && e.errorKind === 'delivery',
        ),
      )
      .toBe(true);
    await page.unroute('**/api/leads');
    await page.route('**/api/leads', (route) =>
      route.fulfill({ json: { ok: true } }),
    );
    await page.locator('.dp-lead-submit').click();
    await expect(page.locator('.dp-lead-success')).toBeVisible();
    await expect
      .poll(() => events.some((e) => e.name === 'lead_form_success'))
      .toBe(true);
    for (const name of [
      'goal_invest_click',
      'lead_form_open',
      'lead_form_start',
      'lead_form_submit',
      'lead_form_success',
    ])
      expect(events.some((e) => e.name === name)).toBe(true);
    const language = locale === 'he' ? 'en' : 'he';
    await page.locator(`.dp-desktop-languages a[href="/${language}"]`).click();
    await expect
      .poll(() =>
        events.some(
          (e) => e.name === 'language_switch' && e.targetLocale === language,
        ),
      )
      .toBe(true);
    expect(JSON.stringify(events)).not.toMatch(
      /Private|private@|995|123456|message|gclid|utm_|landingUrl|referrer/,
    );
    expect(requests).toEqual([]); // App carries no provider IDs, even after consent.
    await page.locator('[data-consent-settings]').click();
    await page.locator('[data-consent-action="necessary"]').click();
    const count = events.length;
    await page.locator('#sell .dp-action').click();
    await page.locator('#lead-name').fill('After Revocation');
    expect(events).toHaveLength(count);
  });

  test(`${locale}: responsive consent dialog, RTL, axe and screenshots`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`/${locale}`);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('.dp-consent-banner')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator('.dp-consent-banner')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
    }
    await page.locator('[data-consent-action="necessary"]').click();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('[data-consent-settings]').click();
      await expect(page.locator('.dp-consent-dialog')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator('.dp-consent-dialog')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true);
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        locale === 'he' ? 'rtl' : 'ltr',
      );
      const wanted =
        (locale === 'en' && [390, 1440].includes(width)) ||
        (locale === 'he' && [390, 1440].includes(width)) ||
        (locale === 'ka' && width === 390) ||
        (locale === 'ru' && width === 1440);
      if (wanted)
        await page.screenshot({
          path: `docs/screenshots/phase-5/${locale}-${width}-consent.png`,
        });
      if ([390, 1440].includes(width))
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
              .analyze()
          ).violations,
        ).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-consent-settings]')).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test('consent changes propagate across tabs without reloading the lead form', async ({
  context,
}) => {
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto('/en');
  await first.locator('[data-consent-action="all"]').click();
  await second.goto('/he');
  await expect(second.locator('[data-consent-settings]')).toBeEnabled();
  await second.locator('#lead-name').fill('Preserved Name');
  await first.locator('[data-consent-settings]').click();
  await first.locator('[data-consent-action="necessary"]').click();
  await second.locator('[data-consent-settings]').click();
  await expect(second.locator('#consent-analytics')).not.toBeChecked();
  await second.keyboard.press('Escape');
  await expect(second.locator('#lead-name')).toHaveValue('Preserved Name');
});

test('blocked persistence fails closed and leaves the lead usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error('blocked');
    };
    Storage.prototype.setItem = () => {
      throw Error('blocked');
    };
  });
  await page.goto('/en');
  await page.locator('[data-consent-action="necessary"]').click();
  await page.locator('#lead-name').fill('Still Usable');
  await expect(page.locator('#lead-name')).toHaveValue('Still Usable');
  await page.reload();
  await expect(page.locator('.dp-consent-banner')).toBeVisible();
});
