import type { Metadata } from 'next';
import { locales, localePath, type Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import type { SeoConfig } from './config';

export function localeAlternates(origin: string): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, `${origin}${localePath(locale)}`]),
    ),
    'x-default': `${origin}/en`,
  };
}

const ogLocales: Record<Locale, string> = {
  en: 'en_US',
  ka: 'ka_GE',
  ru: 'ru_RU',
};

export function buildLocaleMetadata(
  locale: Locale,
  messages: Messages,
  config: SeoConfig,
): Metadata {
  const { title, description, imageAlt } = messages.seo;
  const pageUrl = config.origin
    ? `${config.origin}${localePath(locale)}`
    : undefined;
  return {
    title,
    description,
    ...(config.origin
      ? {
          metadataBase: new URL(config.origin),
          alternates: {
            canonical: pageUrl,
            languages: localeAlternates(config.origin),
          },
        }
      : {}),
    robots: { index: config.indexable, follow: config.indexable },
    openGraph: {
      type: 'website',
      siteName: 'Dragon Point',
      title,
      description,
      locale: ogLocales[locale],
      alternateLocale: locales
        .filter((other) => other !== locale)
        .map((other) => ogLocales[other]),
      ...(pageUrl ? { url: pageUrl } : {}),
      ...(config.ogImage
        ? {
            images: [
              { url: config.ogImage, width: 1200, height: 630, alt: imageAlt },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(config.ogImage
        ? { images: [{ url: config.ogImage, alt: imageAlt }] }
        : {}),
    },
  };
}
