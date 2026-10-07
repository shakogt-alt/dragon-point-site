import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { necessaryOnly } from './consent-fixture';

const locales = ['en', 'ka', 'ru', 'he'] as const;
const sizes = [360, 390, 430, 768, 1024, 1280, 1440, 1920].map((width) => ({
  width,
  height: 1000,
}));
sizes.push(
  { width: 360, height: 640 },
  { width: 390, height: 640 },
  { width: 430, height: 740 },
);

async function inspect(page: Page) {
  expect(
    await page.locator('.dp-process li:has(svg)').evaluateAll((items) =>
      items
        .filter((item) => {
          const range = document.createRange();
          range.selectNodeContents(item.querySelector('p')!);
          const arrow = item.querySelector('svg path')!.getBoundingClientRect();
          return Array.from(range.getClientRects()).some(
            (text) =>
              Math.min(text.right, arrow.right) >
                Math.max(text.left, arrow.left) &&
              Math.min(text.bottom, arrow.bottom) >
                Math.max(text.top, arrow.top),
          );
        })
        .map((item) => item.querySelector('p')!.textContent),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator('h1,h2,h3,p,button,.dp-action,.dp-comparison dd')
      .evaluateAll((els) =>
        els
          .filter((el) => el.getClientRects().length > 0)
          .filter((el) => el.scrollWidth > el.clientWidth + 2)
          .map((el) => el.textContent),
      ),
  ).toEqual([]);
  expect(
    await page
      .locator('a,button,summary,input,select,textarea')
      .evaluateAll((els) =>
        els
          .filter(
            (el) =>
              el.getClientRects().length > 0 && !el.closest('.dp-honeypot'),
          )
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < -1 || r.right > innerWidth + 1;
          })
          .map((el) => el.outerHTML),
      ),
  ).toEqual([]);
}
async function axe(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
}
for (const locale of locales) {
  for (const { width, height } of sizes) {
    test(`${locale}: complete journey ${width}x${height}`, async ({ page }) => {
      await necessaryOnly(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      const image = page.locator('.dp-architecture-image');
      await image.evaluate((el: HTMLImageElement) => el.decode());
      for (const section of [
        '#hero',
        '#goals',
        '#decisions',
        '#standard',
        '#services',
        '#technology',
        '#advisor',
        'footer',
      ]) {
        // Section IDs are the app's approved anchor contract.
        await page.locator(section).scrollIntoViewIfNeeded();
        await inspect(page);
      }
      await expect(page.locator('html')).toHaveAttribute(
        'dir',
        locale === 'he' ? 'rtl' : 'ltr',
      );
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await image.evaluate((el) => getComputedStyle(el).transform)).toBe(
        'none',
      );
      expect(
        await image.evaluate((el) => getComputedStyle(el).objectPosition),
      ).toBe('70% 50%');
      expect(await image.getAttribute('alt')).toBeTruthy();
      if (width < 1280) {
        await page.locator('.dp-mobile-menu summary').click();
        await inspect(page);
        const last = page.locator('.dp-mobile-menu nav a').last();
        await last.focus();
        await expect(last).toBeInViewport();
        await page.keyboard.press('Escape');
        await page.locator('.dp-language-picker summary').click();
        await inspect(page);
        await page.keyboard.press('Escape');
      }
      await page.locator('[data-consent-settings]').click();
      await expect(page.locator('dialog')).toBeVisible();
      await inspect(page);
      await page.locator('dialog [data-consent-action="save"]').focus();
      await expect(
        page.locator('dialog [data-consent-action="save"]'),
      ).toBeInViewport();
      await page.keyboard.press('Escape');
      expect(errors).toEqual([]);
    });
  }
  test(`${locale}: state accessibility and review screenshots`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/${locale}`);
    await expect(page.locator('[data-consent-settings]')).toBeEnabled();
    await axe(page);
    await page.locator('[data-consent-action="customize"]').click();
    await axe(page);
    if (['en', 'he'].includes(locale))
      await page.screenshot({
        path: `docs/screenshots/phase-6/${locale}-390-consent-dialog.png`,
      });
    await page.locator('dialog [data-consent-action="necessary"]').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator('.dp-architecture-image')
      .evaluate((el: HTMLImageElement) => el.decode());
    for (const width of locale === 'ka'
      ? [390]
      : locale === 'ru'
        ? [1440]
        : [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `docs/screenshots/phase-6/${locale}-${width}-full.png`,
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 640 });
    if (locale === 'en') {
      await page.locator('.dp-skip-link').focus();
      await page.keyboard.press('Enter');
      await page.screenshot({
        path: 'docs/screenshots/phase-6/en-skip-focus-after.png',
      });
    }
    await page.locator('.dp-mobile-menu summary').click();
    await axe(page);
    if (locale === 'en')
      await page.screenshot({
        path: 'docs/screenshots/phase-6/en-390-mobile-menu.png',
      });
    await page.keyboard.press('Escape');
    await page.locator('#goals').scrollIntoViewIfNeeded();
    await expect(page.locator('.dp-mobile-lead-cta')).toBeVisible();
    await axe(page);
    if (locale === 'ka') {
      const step = page.locator('.dp-process li').nth(4);
      await step.evaluate((el) =>
        el.scrollIntoView({ block: 'center', behavior: 'instant' }),
      );
      await step.screenshot({
        path: 'docs/screenshots/phase-6/ka-process-after.png',
      });
    }
    await page.locator('.dp-mobile-lead-cta a').click();
    await expect(page.locator('#lead-name')).toBeFocused();
    if (locale === 'en')
      await page.screenshot({
        path: 'docs/screenshots/phase-6/en-390-lead-focused.png',
      });
    await axe(page);
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
    if (locale === 'en')
      await page.screenshot({
        path: 'docs/screenshots/phase-6/en-keyboard-after.png',
        clip: { x: 0, y: 0, width: 390, height: 300 },
      });
  });
}

test('form boundaries meet non-text contrast baseline', async ({ page }) => {
  await necessaryOnly(page);
  await page.goto('/en');
  const contrast = await page.locator('#lead-name').evaluate((el) => {
    const style = getComputedStyle(el);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const luminance = (data: Uint8ClampedArray) => {
      const [r, g, b] = Array.from(data)
        .slice(0, 3)
        .map((value) => {
          const s = value / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    context.fillStyle = style.backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const bg = luminance(context.getImageData(0, 0, 1, 1).data);
    context.fillStyle = style.borderTopColor;
    context.fillRect(0, 0, 1, 1);
    const border = luminance(context.getImageData(0, 0, 1, 1).data);
    return (Math.max(bg, border) + 0.05) / (Math.min(bg, border) + 0.05);
  });
  await page.locator('#lead-name').screenshot({
    path: `docs/screenshots/phase-6/en-field-border-${contrast < 3 ? 'before' : 'after'}.png`,
  });
  expect(contrast).toBeGreaterThanOrEqual(3);
});
