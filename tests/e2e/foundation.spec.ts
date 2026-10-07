import { expect, test } from '@playwright/test';

const languageCases = [
  { locale: 'en', heading: 'Real Estate Intelligence for Georgia' },
  { locale: 'ka', heading: 'უძრავი ქონების ანალიტიკა საქართველოში' },
  { locale: 'ru', heading: 'Аналитика недвижимости в Грузии' },
  { locale: 'he', heading: 'תובנות לקבלת החלטות נדל״ן בגאורגיה' },
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

// Responsive, navigation and axe coverage moved to the complete landing matrix.
for (const { locale, heading } of languageCases) {
  test(`${locale}: preserved locale, H1, local font and preview policy`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(`/${locale}`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'rtl' : 'ltr',
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(
      page.locator('.dp-desktop-languages [aria-current="page"]'),
    ).toHaveText(locale.toUpperCase());
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        (locale) =>
          Array.from(document.fonts).some(
            (font) =>
              font.family.includes(
                locale === 'he' ? 'Noto Sans Hebrew' : 'FiraGO',
              ) && font.status === 'loaded',
          ),
        locale,
      ),
    ).toBe(true);
  });
}

test('locale switcher works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3300/ka');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'უძრავი ქონების ანალიტიკა საქართველოში',
  );
  for (const language of ['RU', 'HE', 'EN']) {
    await page
      .locator('.dp-desktop-languages')
      .getByRole('link', { name: language, exact: true })
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'lang',
      language.toLowerCase(),
    );
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      language === 'HE' ? 'rtl' : 'ltr',
    );
  }
  await context.close();
});
