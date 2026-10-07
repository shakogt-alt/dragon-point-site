import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const locales = ['en', 'ka', 'ru', 'he'] as const;
const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];

for (const locale of locales) {
  test(`${locale}: approved landing, desktop navigation and accessibility`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect((await page.goto(`/${locale}`))?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'rtl' : 'ltr',
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    for (const id of [
      'hero',
      'goals',
      'decisions',
      'standard',
      'services',
      'technology',
      'advisor',
    ])
      await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator('#services article')).toHaveCount(4);
    await expect(page.locator('.dp-process > li')).toHaveCount(6);
    await expect(page.locator('#lead-form')).toHaveCount(1);
    await expect(page.locator('.dp-desktop-nav')).toBeVisible();
    await expect(page.locator('.dp-mobile-menu')).toBeHidden();
    await page.locator('.dp-desktop-nav a[href="#standard"]').click();
    await expect(page).toHaveURL(new RegExp(`/${locale}#standard$`));
    const targetTop = await page
      .locator('#standard')
      .evaluate((el) => el.getBoundingClientRect().top);
    const headerBottom = await page
      .locator('header')
      .evaluate((el) => el.getBoundingClientRect().bottom);
    expect(targetTop).toBeGreaterThanOrEqual(headerBottom - 2);
    await page.waitForFunction(
      () =>
        document.querySelector('header')?.getAttribute('data-compact') ===
        'true',
    );
    for (const language of ['EN', 'KA', 'RU', 'HE']) {
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
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page
          .locator('body')
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain(language === 'HE' ? 'notoHebrew' : 'firago');
    }
    await page.goto(`/${locale}`);
    await page.keyboard.press('Tab');
    await expect(page.locator('.dp-skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    // Every local CTA points at an actual section, with no empty contact links.
    for (const href of await page
      .locator('a[href^="#"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')!)))
      await expect(page.locator(href)).toHaveCount(1);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(errors).toEqual([]);
  });

  for (const width of widths) {
    test(`${locale}: responsive Core UI ${width}px`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      const image = page.locator('.dp-architecture-image');
      await expect(image).toHaveAttribute('width', '1600');
      await expect(image).toHaveAttribute('height', '900');
      expect(await image.getAttribute('alt')).toBeTruthy();
      await image.evaluate((el: HTMLImageElement) => el.decode());
      expect(
        await image.evaluate((el: HTMLImageElement) => el.naturalWidth),
      ).toBeGreaterThan(0);
      // A portrait crop must not upscale a small landscape derivative.
      expect(
        await image.evaluate(
          (el: HTMLImageElement) => el.naturalHeight >= el.height * 0.9,
        ),
      ).toBe(true);
      expect(await image.evaluate((el) => getComputedStyle(el).transform)).toBe(
        'none',
      );
      expect(
        await image.evaluate((el) => getComputedStyle(el).objectPosition),
      ).toBe('70% 50%');
      await expect(page.locator('.dp-architecture-overlay')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator('h1, h2, h3, .dp-action, .dp-process li')
          .evaluateAll((elements) =>
            elements.some((el) => el.scrollWidth > el.clientWidth + 2),
          ),
      ).toBe(false);
      expect(
        await page
          .locator('.dp-directional-arrow')
          .first()
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe(locale === 'he' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none');
      await expect(page.locator('header .dp-logo')).toHaveAttribute(
        'dir',
        'ltr',
      );
      expect(
        await page
          .locator('header .dp-logo')
          .evaluate((el) => getComputedStyle(el).transform),
      ).toBe('none');
      const steps = await page.locator('.dp-process > li').all();
      const first = (await steps[0].boundingBox())!;
      const last = (await steps[5].boundingBox())!;
      if (width >= 1280) {
        expect(Math.abs(first.y - last.y)).toBeLessThan(2);
        expect(locale === 'he' ? first.x > last.x : first.x < last.x).toBe(
          true,
        );
        const matrix = await page
          .locator('.dp-process-arrow')
          .first()
          .evaluate((el) => getComputedStyle(el).transform);
        expect(matrix).toBe(
          locale === 'he' ? 'matrix(-1, 0, 0, 1, 0, 0)' : 'none',
        );
      } else {
        expect(last.y).toBeGreaterThan(first.y);
        const next = (await steps[1].boundingBox())!;
        expect(next.y).toBeGreaterThan(first.y);
      }
      if (width < 1280) {
        const menu = page.locator('.dp-mobile-menu');
        expect(
          await menu
            .locator('svg')
            .evaluate((el) => getComputedStyle(el).transform),
        ).toBe('none');
        if (locale === 'he') {
          const brand = (await page.locator('.dp-home').boundingBox())!;
          const controls = (await page
            .locator('.dp-mobile-controls')
            .boundingBox())!;
          expect(brand.x).toBeGreaterThan(controls.x);
        }
        await menu.locator('summary').click();
        await expect(menu).toHaveAttribute('open', '');
        await expect(menu.locator('nav')).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await menu.locator('a[href="#standard"]').click();
        await expect(menu).not.toHaveAttribute('open', '');
        await expect(page).toHaveURL(new RegExp(`/${locale}#standard$`));
      }
      const wanted =
        (locale === 'en' && [390, 1440].includes(width)) ||
        (locale === 'ka' && width === 390) ||
        (locale === 'ru' && width === 1440) ||
        (locale === 'he' && [390, 1440].includes(width));
      if (wanted) {
        await page.goto(`/${locale}`);
        await page.evaluate(() => document.fonts.ready);
        await page
          .locator('.dp-architecture-image')
          .evaluate((el: HTMLImageElement) => el.decode());
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${width}.png`),
          fullPage: true,
        });
        await page.screenshot({
          path: `docs/screenshots/visual-assets-pass/${locale}-${width}.png`,
          fullPage: true,
        });
        if (locale === 'en') {
          await page.locator('#hero').screenshot({
            path: `docs/screenshots/visual-assets-pass/en-${width}-hero-after.png`,
            style:
              '.dp-header,.dp-skip-link,.dp-mobile-lead-cta {visibility:hidden !important}',
          });
        }
      }
      expect(errors).toEqual([]);
    });
  }

  test(`${locale}: architecture reserves layout before image response`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/_next/image**', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const frame = page.locator('.dp-architecture');
    const before = (await frame.boundingBox())!;
    expect(before.height).toBeGreaterThan(100);
    release();
    await page
      .locator('.dp-architecture-image')
      .evaluate((el: HTMLImageElement) => el.decode());
    const after = (await frame.boundingBox())!;
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
    expect(after.width).toBeCloseTo(before.width, 1);
    expect(after.height).toBeCloseTo(before.height, 1);
  });

  test(`${locale}: mobile disclosures, escape, outside click, RTL and keyboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/${locale}`);
    const menu = page.locator('.dp-mobile-menu');
    const trigger = menu.locator('summary');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open', '');
    await page.keyboard.press('Tab');
    await expect(menu.locator('nav a').first()).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.mouse.click(380, 850);
    await expect(menu).not.toHaveAttribute('open', '');
    const language = page.locator('.dp-language-picker');
    await language.locator('summary').click();
    for (const target of ['HE', 'RU', 'KA', 'EN'])
      await expect(
        language.getByRole('link', { name: target, exact: true }),
      ).toBeVisible();
    await language
      .getByRole('link', { name: locale === 'he' ? 'EN' : 'HE', exact: true })
      .click();
    await expect(page.locator('html')).toHaveAttribute(
      'dir',
      locale === 'he' ? 'ltr' : 'rtl',
    );
    await page.locator('.dp-mobile-menu summary').click();
    await page.locator('.dp-mobile-menu nav a').first().focus();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.dp-home')).toBeFocused();
    await expect(page.locator('.dp-desktop-nav')).toBeVisible();
  });
}

test('landing and native mobile navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3300/he');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.locator('.dp-mobile-menu summary').click();
  await expect(page.locator('.dp-mobile-menu nav')).toBeVisible();
  await page.locator('.dp-mobile-menu a[href="#standard"]').click();
  await expect(page).toHaveURL(/#standard$/);
  await context.close();
});
