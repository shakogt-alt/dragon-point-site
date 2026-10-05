import type { MetadataRoute } from 'next';
import { locales, localePath } from '@/lib/i18n/locales';
import type { SeoConfig } from './config';
import { localeAlternates } from './metadata';

export function buildRobots(config: SeoConfig): MetadataRoute.Robots {
  if (!config.indexable || !config.origin) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${config.origin}/sitemap.xml`,
  };
}

export function buildSitemap(config: SeoConfig): MetadataRoute.Sitemap {
  if (!config.indexable || !config.origin) return [];
  return locales.map((locale) => ({
    url: `${config.origin}${localePath(locale)}`,
    alternates: { languages: localeAlternates(config.origin!) },
  }));
}
