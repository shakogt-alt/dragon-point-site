import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { necessaryOnly } from './consent-fixture';

const locales = ['en', 'ka', 'ru', 'he'] as const;
async function axe(page: Page) {
  // Audit every major state in Chromium; other engines exercise interactions.
  if (test.info().project.name !== 'journey-chromium') return;
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
}
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  (page as Page & { hardeningErrors: string[] }).hardeningErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect(
    (page as Page & { hardeningErrors: string[] }).hardeningErrors,
  ).toEqual([]);
});

for (const locale of locales) {
  test(`${locale}: first-visit banner never covers keyboard-focused fields`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto(`/${locale}`);
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    for (const viewport of [
      { width: 360, height: 640 },
      { width: 390, height: 640 },
      { width: 430, height: 740 },
    ]) {
      await page.setViewportSize(viewport);
      await page.locator('#hero .dp-action').first().focus();
      await page.keyboard.press('Enter');
      for (const id of ['name', 'phone', 'email', 'budget']) {
        const field = page.locator(`#lead-${id}`);
        await expect(field).toBeFocused();
        await expect
          .poll(() =>
            field.evaluate((el) => {
              const bounds = el.getBoundingClientRect();
              const banner = document
                .querySelector('.dp-consent-banner')!
                .getBoundingClientRect();
              const header = document
                .querySelector('header')!
                .getBoundingClientRect();
              return {
                aboveBanner: bounds.bottom <= banner.top,
                belowHeader: bounds.top >= header.bottom,
                fieldTop: bounds.top,
                fieldBottom: bounds.bottom,
                bannerTop: banner.top,
                headerBottom: header.bottom,
              };
            }),
          )
          .toEqual(
            expect.objectContaining({ aboveBanner: true, belowHeader: true }),
          );
        if (
          test.info().project.name === 'journey-chromium' &&
          locale === 'ka' &&
          viewport.width === 390 &&
          id === 'name'
        )
          await page.screenshot({
            path: 'docs/screenshots/phase-6/ka-consent-field-after.png',
          });
        await page.keyboard.press('Tab');
      }
      await expect(page.locator('.dp-mobile-lead-cta')).toBeHidden();
      await expect(page.locator('.dp-consent-banner')).toBeVisible();
    }
  });

  test(`${locale}: desktop navigation, keyboard focus and language source order`, async ({
    page,
    browserName,
  }) => {
    await necessaryOnly(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}`);
    await expect(page.locator('#lead-name')).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    // Windows WebKit's default Tab preference skips links. Exercise activation
    // from explicit focus there; native link Tab order is checked in Chrome/FF.
    if (browserName === 'webkit') await page.locator('.dp-skip-link').focus();
    else await page.keyboard.press('Tab');
    await expect(page.locator('.dp-skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    expect(
      await page
        .locator('main')
        .evaluate((el) => getComputedStyle(el).outlineStyle),
    ).not.toBe('none');
    await expect(page.locator('h1')).toHaveCount(1);
    await page.locator('.dp-desktop-nav a[href="#standard"]').click();
    await expect(page.locator('#standard')).toBeFocused();
    const languages = page.locator('.dp-desktop-languages a');
    expect(
      await languages.evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-language')),
      ),
    ).toEqual(['en', 'ka', 'ru', 'he']);
    await languages.first().focus();
    if (browserName === 'webkit') await languages.nth(1).focus();
    else await page.keyboard.press('Tab');
    await expect(languages.nth(1)).toBeFocused();
    await page.locator('.dp-header-advisor').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await axe(page);
    await page
      .locator(
        `.dp-desktop-languages a[href="/${locale === 'he' ? 'en' : 'he'}"]`,
      )
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'ltr' : 'rtl',
    );
  });

  test(`${locale}: short mobile consent, menu, goal, validation, retry and success`, async ({
    page,
    browserName,
  }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width: 390, height: 640 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}?utm_source=phase6&utm_campaign=fixture`);
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await axe(page);
    const customize = page.locator('[data-consent-action="customize"]');
    await customize.click();
    const dialog = page.locator('dialog');
    await expect(dialog).toBeVisible();
    await axe(page);
    const buttons = dialog.locator('button');
    await buttons.last().focus();
    await page.keyboard.press('Tab');
    await expect(buttons.first()).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(buttons.last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(customize).toBeFocused();
    await page.locator('[data-consent-action="necessary"]').click();
    await page.locator('[data-consent-settings]').click();
    await dialog.locator('#consent-analytics').check();
    await dialog.locator('[data-consent-action="save"]').click();
    await expect(page.locator('[data-consent-settings]')).toBeFocused();
    await page.locator('[data-consent-settings]').click();
    await dialog.locator('[data-consent-action="all"]').click();
    await page.locator('[data-consent-settings]').click();
    await expect(dialog.locator('#consent-analytics')).toBeChecked();
    await expect(dialog.locator('#consent-marketing')).toBeChecked();
    await dialog.locator('[data-consent-action="necessary"]').click();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('dragon-point:consent:v1')!),
      ),
    ).toMatchObject({ analytics: false, marketing: false });
    await page.evaluate(() => window.scrollTo(0, 0));
    const menu = page.locator('.dp-mobile-menu');
    await menu.locator('summary').focus();
    await page.keyboard.press('Enter');
    if (browserName === 'webkit') await menu.locator('nav a').first().focus();
    else await page.keyboard.press('Tab');
    await expect(menu.locator('nav a').first()).toBeFocused();
    await axe(page);
    await page.keyboard.press('Escape');
    await expect(menu.locator('summary')).toBeFocused();
    await menu.locator('summary').click();
    await menu.locator('a[href="#standard"]').click();
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(page.locator('#standard')).toBeFocused();
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeVisible();
    await page.locator('.dp-mobile-lead-cta a').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeHidden();
    for (const intent of ['buy', 'invest', 'sell']) {
      await page.locator(`#${intent} a`).click();
      await expect(
        page.locator(`input[name="intent"][value="${intent}"]`),
      ).toBeChecked();
      await expect(page.locator('#lead-name')).toBeFocused();
    }
    await page.locator('#hero .dp-action').first().click();
    await expect(
      page.locator('input[name="intent"][value="buy"]'),
    ).toBeChecked();
    const submit = page.locator('#lead-form button[type="submit"]');
    await submit.click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await expect(page.locator('#lead-name')).toHaveAttribute(
      'aria-describedby',
      'lead-name-error',
    );
    await expect(page.locator('#lead-form [role="alert"]')).toContainText(
      await page.locator('#lead-name-error').innerText(),
    );
    await axe(page);
    await page
      .locator('#lead-name')
      .fill(locale === 'he' ? 'בדיקת טופס' : 'Test Person');
    await page.locator('#lead-phone').fill('+972 50 123 4567');
    await page.locator('#lead-email').fill('fixture@example.test');
    await expect(page.locator('#lead-phone')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('#lead-email')).toHaveAttribute('dir', 'ltr');
    let succeeds = false;
    let release: (() => void) | undefined;
    let hold = false;
    let payload: Record<string, unknown> = {};
    await page.route('**/api/leads', async (route) => {
      payload = route.request().postDataJSON();
      if (hold)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: succeeds,
          code: 'unavailable',
        }),
      });
    });
    await submit.click();
    await expect(page.locator('.dp-lead-feedback')).toBeFocused();
    await expect(page.locator('#lead-name')).not.toHaveValue('');
    await axe(page);
    succeeds = true;
    hold = true;
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(page.locator('#lead-form')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await expect.poll(() => !!release).toBe(true);
    release!();
    await expect(page.locator('.dp-lead-success')).toBeFocused();
    await axe(page);
    expect(payload).toMatchObject({
      locale,
      utm_source: 'phase6',
      utm_campaign: 'fixture',
    });
    await page.locator('.dp-lead-success button').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    await page.locator('.dp-language-picker summary').click();
    await page
      .locator(
        `.dp-language-picker a[href="/${locale === 'he' ? 'en' : 'he'}"]`,
      )
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'ltr' : 'rtl',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`${locale}: keyboard viewport resize reveals the focused field`, async ({
    page,
  }) => {
    await necessaryOnly(page);
    await page.setViewportSize({ width: 390, height: 640 });
    await page.goto(`/${locale}`);
    await expect(page.locator('#lead-message')).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#lead-message').focus();
    await page
      .locator('#lead-message')
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.evaluate(() => {
      Object.defineProperty(visualViewport!, 'height', {
        configurable: true,
        get: () => 300,
      });
      visualViewport!.dispatchEvent(new Event('resize'));
    });
    await expect
      .poll(() =>
        page
          .locator('#lead-message')
          .evaluate((el) => el.getBoundingClientRect().bottom),
      )
      .toBeLessThanOrEqual(300);
    const header = (await page.locator('header').boundingBox())!;
    expect(
      (await page.locator('#lead-message').boundingBox())!.y,
    ).toBeGreaterThanOrEqual(header.y + header.height);
    await expect(page.locator('.dp-mobile-lead-cta')).toBeHidden();
    // A focused field must not hijack voluntary scrolling back to goal cards.
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(page.locator('#goals')).toBeInViewport();
  });
}
