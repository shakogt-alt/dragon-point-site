import manifest from '@/assets/fonts/web-manifest.json';
import type { Locale } from '@/lib/i18n/locales';

// Only above-fold weights for the active writing system are preloaded. Other
// weights/scripts remain available through unicode-range faces on demand.
export function getFontPreloads(locale: Locale) {
  const names =
    locale === 'he'
      ? ['noto-sans-hebrew-variable']
      : locale === 'ka' || locale === 'ru'
        ? [`firago-dictionary-${locale}-400`, `firago-dictionary-${locale}-500`]
        : ['firago-common-400', 'firago-common-500'];
  return manifest.assets
    .filter((asset) => names.includes(asset.name))
    .map((asset) => asset.url);
}
