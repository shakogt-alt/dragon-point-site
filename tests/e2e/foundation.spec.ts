import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const languageCases = [
  { locale: 'en', heading: 'Real Estate Intelligence for Georgia' },
  { locale: 'ka', heading: 'უძრავი ქონების ანალიტიკა საქართველოში' },
  { locale: 'ru', heading: 'Аналитика недвижимости в Грузии' },
] as const;

test('root redirects on the server without client JavaScript', async ({
  request,
}) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe('/en');
});

test('unsupported locale and unpublished future route return 404', async ({
  request,
}) => {
  expect((await request.get('/fr')).status()).toBe(404);
  expect((await request.get('/en/properties')).status()).toBe(404);
});

for (const { locale, heading } of languageCases) {
  test(`${locale}: language, links, local font, accessibility and console`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(`/${locale}`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('nav [aria-current="page"]')).toHaveText(
      locale.toUpperCase(),
    );
    await page.keyboard.press('Tab');
    await expect(page.locator('.dp-skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    for (const target of ['EN', 'KA', 'RU']) {
      await page.getByRole('link', { name: target, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${target.toLowerCase()}$`));
      await expect(page.locator('html')).toHaveAttribute(
        'lang',
        target.toLowerCase(),
      );
    }
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() =>
        Array.from(document.fonts).some(
          (font) => font.family.includes('firago') && font.status === 'loaded',
        ),
      ),
    ).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
  for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`${locale}: fits viewport ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      for (const link of await page.locator('nav a').all()) {
        const bounds = await link.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(44);
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
      }
      if (width === 390 || width === 1440) {
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${width}.png`),
          fullPage: true,
        });
      }
    });
  }
}

test('content works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3300/ka');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'უძრავი ქონების ანალიტიკა საქართველოში',
  );
  await page.getByRole('link', { name: 'RU', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await context.close();
});
