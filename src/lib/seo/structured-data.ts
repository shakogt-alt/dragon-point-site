import type { Locale } from '@/lib/i18n/locales';
import { locales } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import type { SeoConfig } from './config';

type Entity = Record<string, unknown> & { '@type': string };
export type StructuredData = { '@context': string; '@graph': Entity[] };

export function buildStructuredData(
  locale: Locale,
  messages: Messages,
  config: SeoConfig,
): StructuredData {
  const { origin } = config;
  const organizationId = origin ? `${origin}/#organization` : undefined;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Dragon Point',
        ...(origin ? { '@id': organizationId, url: origin } : {}),
      },
      {
        '@type': 'RealEstateAgent',
        name: 'Dragon Point',
        areaServed: { '@type': 'Country', name: 'Georgia' },
        ...(origin
          ? {
              '@id': `${origin}/#agent`,
              url: origin,
            }
          : {}),
      },
      {
        '@type': 'WebSite',
        name: 'Dragon Point',
        description: messages.seo.description,
        inLanguage: [...locales],
        ...(origin
          ? {
              '@id': `${origin}/#website`,
              url: origin,
              publisher: { '@id': organizationId },
            }
          : {}),
      },
    ],
  };
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
