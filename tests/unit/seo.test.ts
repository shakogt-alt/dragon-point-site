import { describe, expect, it } from 'vitest';
import { getSeoConfig } from '@/lib/seo/config';
import { buildLocaleMetadata } from '@/lib/seo/metadata';
import { buildRobots, buildSitemap } from '@/lib/seo/crawlers';
import {
  buildStructuredData,
  serializeJsonLd,
} from '@/lib/seo/structured-data';
import { getMessages } from '@/lib/i18n/messages';

const production = {
  SITE_ENV: 'production',
  SITE_URL: 'https://dragon-point.test',
};

describe('indexing policy', () => {
  it('allows only explicitly configured production with a confirmed origin', () => {
    expect(getSeoConfig(production).indexable).toBe(true);
    expect(
      getSeoConfig({ VERCEL_ENV: 'production', SITE_URL: production.SITE_URL })
        .indexable,
    ).toBe(true);
    expect(
      getSeoConfig({ NODE_ENV: 'production', SITE_URL: production.SITE_URL })
        .indexable,
    ).toBe(false);
    expect(getSeoConfig({ SITE_ENV: 'production' }).indexable).toBe(false);
  });
  it.each(['preview', 'staging', 'development', 'test', 'typo'])(
    'blocks %s',
    (environment) => {
      expect(
        getSeoConfig({ ...production, SITE_ENV: environment }).indexable,
      ).toBe(false);
    },
  );
  it('never lets an explicit production setting override a Vercel preview', () => {
    expect(
      getSeoConfig({ ...production, VERCEL_ENV: 'preview' }).indexable,
    ).toBe(false);
    expect(
      getSeoConfig({ ...production, VERCEL_ENV: 'development' }).indexable,
    ).toBe(false);
    expect(
      getSeoConfig({
        ...production,
        SITE_ENV: 'staging',
        VERCEL_ENV: 'production',
      }).indexable,
    ).toBe(false);
  });
  it('normalizes a trailing slash without changing the public origin', () => {
    expect(
      getSeoConfig({ ...production, SITE_URL: 'https://dragon-point.test/' })
        .origin,
    ).toBe('https://dragon-point.test');
  });
  it.each([
    '',
    'invalid',
    'http://dragon-point.test',
    'https://user:secret@dragon-point.test',
    'https://dragon-point.test/en',
    'https://dragon-point.test?tracking=1',
    'https://dragon-point.test#hash',
    'https://localhost',
    'https://localhost.',
    'https://website.local.',
    'https://127.0.0.1',
  ])('fails closed for invalid SITE_URL %s', (SITE_URL) => {
    const config = getSeoConfig({ ...production, SITE_URL });
    expect(config.origin).toBeUndefined();
    expect(config.indexable).toBe(false);
  });
});

describe('localized metadata', () => {
  it.each([
    [
      'en',
      'Real Estate in Georgia | Buy, Invest & Sell | Dragon Point',
      'en_US',
    ],
    [
      'ka',
      'უძრავი ქონება საქართველოში — ყიდვა, ინვესტირება და გაყიდვა | Dragon Point',
      'ka_GE',
    ],
    [
      'ru',
      'Недвижимость в Грузии — покупка, инвестиции и продажа | Dragon Point',
      'ru_RU',
    ],
    ['he', 'נדל״ן בגאורגיה | קנייה, השקעה ומכירה | Dragon Point', 'he_IL'],
  ] as const)(
    'builds %s metadata from that dictionary',
    async (locale, title, ogLocale) => {
      const messages = await getMessages(locale);
      const metadata = buildLocaleMetadata(
        locale,
        messages,
        getSeoConfig(production),
      );
      expect(metadata.title).toBe(title);
      expect(metadata.description).toBe(messages.seo.description);
      expect(metadata.description).not.toBe('');
      expect(metadata.alternates).toEqual({
        canonical: `https://dragon-point.test/${locale}`,
        languages: {
          en: 'https://dragon-point.test/en',
          ka: 'https://dragon-point.test/ka',
          ru: 'https://dragon-point.test/ru',
          he: 'https://dragon-point.test/he',
          'x-default': 'https://dragon-point.test/en',
        },
      });
      expect(metadata.openGraph).toMatchObject({
        title,
        description: messages.seo.description,
        locale: ogLocale,
        url: `https://dragon-point.test/${locale}`,
        type: 'website',
      });
      expect(metadata.twitter).toMatchObject({
        card: 'summary_large_image',
        title,
      });
      expect(metadata.robots).toEqual({ index: true, follow: true });
    },
  );
  it('omits all origin-dependent fields rather than using localhost or a made-up domain', async () => {
    const metadata = buildLocaleMetadata(
      'en',
      await getMessages('en'),
      getSeoConfig({}),
    );
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.metadataBase).toBeUndefined();
    expect(metadata.openGraph).not.toHaveProperty('url');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
  it('only advertises an image if an approved asset is configured', async () => {
    const messages = await getMessages('ka');
    const withoutImage = buildLocaleMetadata(
      'ka',
      messages,
      getSeoConfig(production),
    );
    expect(withoutImage.openGraph).not.toHaveProperty('images');
    const withImage = buildLocaleMetadata(
      'ka',
      messages,
      getSeoConfig({
        ...production,
        OG_IMAGE_URL: 'https://dragon-point.test/approved.jpg',
      }),
    );
    expect(withImage.openGraph).toMatchObject({
      images: [
        {
          url: 'https://dragon-point.test/approved.jpg',
          width: 1200,
          height: 630,
          alt: messages.seo.imageAlt,
        },
      ],
    });
    expect(withImage.twitter).toMatchObject({
      images: [
        {
          url: 'https://dragon-point.test/approved.jpg',
          alt: messages.seo.imageAlt,
        },
      ],
    });
    expect(
      getSeoConfig({ ...production, OG_IMAGE_URL: 'javascript:alert(1)' })
        .ogImage,
    ).toBeUndefined();
  });
});

describe('robots and sitemap', () => {
  it('advertises only the four approved locale pages in production', () => {
    const config = getSeoConfig(production);
    expect(buildRobots(config)).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://dragon-point.test/sitemap.xml',
    });
    expect(buildSitemap(config).map((entry) => entry.url)).toEqual([
      'https://dragon-point.test/en',
      'https://dragon-point.test/ka',
      'https://dragon-point.test/ru',
      'https://dragon-point.test/he',
    ]);
    expect(buildSitemap(config)[0].alternates?.languages).toEqual({
      en: 'https://dragon-point.test/en',
      ka: 'https://dragon-point.test/ka',
      ru: 'https://dragon-point.test/ru',
      he: 'https://dragon-point.test/he',
      'x-default': 'https://dragon-point.test/en',
    });
  });
  it.each(['preview', 'staging', 'development'])(
    'does not publish an indexable sitemap on %s',
    (SITE_ENV) => {
      const config = getSeoConfig({ ...production, SITE_ENV });
      expect(buildRobots(config)).toEqual({
        rules: { userAgent: '*', disallow: '/' },
      });
      expect(buildSitemap(config)).toEqual([]);
    },
  );
  it('never fabricates crawl URLs without a production origin', () => {
    const config = getSeoConfig({ SITE_ENV: 'production' });
    expect(buildRobots(config)).toEqual({
      rules: { userAgent: '*', disallow: '/' },
    });
    expect(buildSitemap(config)).toEqual([]);
  });
});

describe('JSON-LD framework', () => {
  it('links known entities without invented business details', async () => {
    const graph = buildStructuredData(
      'ru',
      await getMessages('ru'),
      getSeoConfig(production),
    );
    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph'].map((entity) => entity['@type'])).toEqual([
      'Organization',
      'RealEstateAgent',
      'WebSite',
    ]);
    expect(graph['@graph'][1]).toMatchObject({
      '@id': 'https://dragon-point.test/#agent',
    });
    expect(graph['@graph'][2]).toMatchObject({
      publisher: { '@id': 'https://dragon-point.test/#organization' },
      inLanguage: ['en', 'ka', 'ru', 'he'],
    });
    for (const entity of graph['@graph']) {
      for (const field of [
        'address',
        'telephone',
        'email',
        'review',
        'aggregateRating',
        'award',
        'awards',
        'numberOfEmployees',
        'dealCount',
        'clientCount',
        'parentOrganization',
      ])
        expect(entity).not.toHaveProperty(field);
    }
  });
  it('keeps only known information without an origin', async () => {
    const graph = buildStructuredData(
      'en',
      await getMessages('en'),
      getSeoConfig({}),
    );
    for (const entity of graph['@graph']) {
      expect(entity).not.toHaveProperty('url');
      expect(entity).not.toHaveProperty('@id');
    }
  });
  it('escapes closing script tags without changing parsed JSON data', () => {
    const data = { text: '</script><script>alert("x")</script>' };
    const serialized = serializeJsonLd(data);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
