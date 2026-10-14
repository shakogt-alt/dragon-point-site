import { expect, test } from '@playwright/test';
import { necessaryOnly } from './consent-fixture';

for (const locale of ['en', 'he']) {
  test(
    locale + ': brand and language controls include their visible names',
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await necessaryOnly(page);
      await page.goto('/' + locale);
      await expect(page.locator('.dp-home')).toHaveAccessibleName(
        /DRAGON POINT REAL ESTATE INTELLIGENCE/,
      );
      await expect(
        page.locator('.dp-language-picker summary'),
      ).toHaveAccessibleName(new RegExp(locale.toUpperCase()));
      const image = page.locator('header .dp-logo img:visible');
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
    },
  );

  test(
    locale + ': dark footer reaches document end with mobile CTA clearance',
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await necessaryOnly(page);
      await page.goto('/' + locale);
      await page.locator('#contact').scrollIntoViewIfNeeded();
      const gap = await page
        .locator('#contact')
        .evaluate(
          (footer) =>
            document.documentElement.scrollHeight -
            (footer.getBoundingClientRect().bottom + scrollY),
        );
      expect(gap).toBeLessThanOrEqual(1);
      await expect(page.locator('#contact .dp-back')).toBeVisible();
      await page.locator('#contact .dp-back').click();
      await expect(page).toHaveURL(/#hero$/);
    },
  );
}

test('secondary actions retain readable contrast while pressed on mobile', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await necessaryOnly(page);
    await page.goto('http://127.0.0.1:3300/en');
    const action = page.locator('#decisions .dp-action-secondary');
    await action.scrollIntoViewIfNeeded();
    const box = (await action.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await action.evaluate((el) => el.matches(':active'))).toBe(true);
    await expect
      .poll(() =>
        action.evaluate((element) => {
          const style = getComputedStyle(element);
          const luminance = (color: string) => {
            const channels = color
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number)
              .map((value) => {
                const c = value / 255;
                return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
              });
            return (
              channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
            );
          };
          const foreground = luminance(style.color),
            background = luminance(style.backgroundColor);
          return (
            (Math.max(foreground, background) + 0.05) /
            (Math.min(foreground, background) + 0.05)
          );
        }),
      )
      .toBeGreaterThanOrEqual(4.5);
    await page.mouse.up();
  } finally {
    await context.close();
  }
});
