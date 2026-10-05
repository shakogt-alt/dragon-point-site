import { expect, test } from '@playwright/test';

test('crawler receives SEO in the initial document head', async ({
  page,
  request,
}, testInfo) => {
  const response = await request.get('/ka', {
    headers: { 'User-Agent': 'Twitterbot' },
  });
  expect(response.status()).toBe(200);
  const head = await page.evaluate(
    (html) => {
      const document = new DOMParser().parseFromString(html, 'text/html');
      return {
        title: document.head.querySelector('title')?.textContent,
        description: document.head
          .querySelector('meta[name="description"]')
          ?.getAttribute('content'),
        canonical: document.head
          .querySelector('link[rel="canonical"]')
          ?.getAttribute('href'),
        h1Count: document.querySelectorAll('h1').length,
      };
    },
    await response.text(),
  );
  expect(head.title).toBe(
    'უძრავი ქონება საქართველოში — ყიდვა, ინვესტირება და გაყიდვა | Dragon Point',
  );
  expect(head.description).toContain('შეიძინეთ');
  expect(head.canonical).toBe(
    testInfo.project.name === 'seo-unconfigured'
      ? undefined
      : 'https://dragon-point.test/ka',
  );
  expect(head.h1Count).toBe(1);
});

const origin = 'https://dragon-point.test';
const cases = [
  {
    locale: 'en',
    title: 'Real Estate in Georgia | Buy, Invest & Sell | Dragon Point',
    description:
      'Buy, sell and invest in real estate in Georgia with market analysis, property verification and professional deal support. Dragon Point — Real Estate Intelligence.',
    ogLocale: 'en_US',
  },
  {
    locale: 'ka',
    title:
      'უძრავი ქონება საქართველოში — ყიდვა, ინვესტირება და გაყიდვა | Dragon Point',
    description:
      'შეიძინეთ, გაყიდეთ და განახორციელეთ ინვესტიცია უძრავ ქონებაში საქართველოში ბაზრის ანალიზით, ქონების შემოწმებითა და გარიგების პროფესიული მხარდაჭერით. Dragon Point.',
    ogLocale: 'ka_GE',
  },
  {
    locale: 'ru',
    title:
      'Недвижимость в Грузии — покупка, инвестиции и продажа | Dragon Point',
    description:
      'Покупайте, продавайте и инвестируйте в недвижимость Грузии с анализом рынка, проверкой объектов и профессиональным сопровождением сделки. Dragon Point.',
    ogLocale: 'ru_RU',
  },
];

for (const { locale, title, description, ogLocale } of cases) {
  test(`${locale}: rendered SEO matches locale and environment`, async ({
    page,
  }, testInfo) => {
    const configured = testInfo.project.name !== 'seo-unconfigured';
    const indexable = testInfo.project.name === 'seo-production';
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(`/${locale}?utm_source=seo-check`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      description,
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    if (configured) {
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${origin}/${locale}`,
      );
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        4,
      );
      for (const language of ['en', 'ka', 'ru', 'x-default']) {
        await expect(
          page.locator(`link[hreflang="${language}"]`),
        ).toHaveAttribute(
          'href',
          `${origin}/${language === 'x-default' ? 'en' : language}`,
        );
      }
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `${origin}/${locale}`,
      );
    } else {
      await expect(
        page.locator(
          'link[rel="canonical"], link[hreflang], meta[property="og:url"]',
        ),
      ).toHaveCount(0);
      expect(await page.content()).not.toContain(origin);
    }
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      indexable ? 'index, follow' : 'noindex, nofollow',
    );
    if (indexable) expect(response?.headers()['x-robots-tag']).toBeUndefined();
    else expect(response?.headers()['x-robots-tag']).toContain('noindex');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      title,
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      ogLocale,
    );
    expect(
      await page
        .locator('meta[property="og:locale:alternate"]')
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('content')).sort(),
        ),
    ).toEqual(
      cases
        .filter((entry) => entry.locale !== locale)
        .map((entry) => entry.ogLocale)
        .sort(),
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      'content',
      title,
    );
    await expect(
      page.locator('meta[name="twitter:description"]'),
    ).toHaveAttribute('content', description);
    if (indexable) {
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `${origin}/approved-fixture.jpg`,
      );
      await expect(
        page.locator('meta[property="og:image:width"]'),
      ).toHaveAttribute('content', '1200');
      await expect(
        page.locator('meta[property="og:image:height"]'),
      ).toHaveAttribute('content', '630');
    } else
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    const data = JSON.parse((await scripts.textContent())!);
    expect(data['@context']).toBe('https://schema.org');
    expect(
      data['@graph'].map((entity: Record<string, unknown>) => entity['@type']),
    ).toEqual(['Organization', 'RealEstateAgent', 'WebSite']);
    for (const entity of data['@graph']) {
      expect(entity.name).toBe('Dragon Point');
      for (const field of [
        'address',
        'telephone',
        'email',
        'review',
        'aggregateRating',
        'awards',
        'dealCount',
        'clientCount',
        'parentOrganization',
      ])
        expect(entity).not.toHaveProperty(field);
      if (configured) expect(entity.url).toBe(origin);
      else {
        expect(entity).not.toHaveProperty('url');
        expect(entity).not.toHaveProperty('@id');
      }
    }
    expect(errors).toEqual([]);
  });
}

test('robots and sitemap follow the same deployment policy as HTML', async ({
  page,
  request,
}, testInfo) => {
  const indexable = testInfo.project.name === 'seo-production';
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  const robotsText = await robots.text();
  expect(robotsText).toContain('User-Agent: *');
  expect(robotsText).toContain(indexable ? 'Allow: /' : 'Disallow: /');
  if (indexable) expect(robotsText).toContain(`Sitemap: ${origin}/sitemap.xml`);
  else expect(robotsText).not.toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  if (!indexable)
    expect(sitemap.headers()['x-robots-tag']).toContain('noindex');
  const xml = await sitemap.text();
  const parsed = await page.evaluate((value) => {
    const document = new DOMParser().parseFromString(value, 'application/xml');
    return {
      errors: document.querySelectorAll('parsererror').length,
      urls: Array.from(document.getElementsByTagName('loc')).map(
        (node) => node.textContent,
      ),
      alternates: Array.from(
        document.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'),
      ).map((node) => ({
        language: node.getAttribute('hreflang'),
        href: node.getAttribute('href'),
      })),
    };
  }, xml);
  expect(parsed.errors).toBe(0);
  expect(parsed.urls).toEqual(
    indexable ? [`${origin}/en`, `${origin}/ka`, `${origin}/ru`] : [],
  );
  if (indexable) {
    expect(parsed.alternates).toHaveLength(12);
    expect(
      parsed.alternates.filter((entry) => entry.language === 'x-default'),
    ).toEqual(Array(3).fill({ language: 'x-default', href: `${origin}/en` }));
  }
  for (const path of ['/en/tbilisi', '/ka/buy', '/ru/properties'])
    expect((await request.get(path)).status()).toBe(404);
});
