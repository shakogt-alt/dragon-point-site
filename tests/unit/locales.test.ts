import { describe, expect, it } from 'vitest';
import { isLocale, localePath } from '@/lib/i18n/locales';
import { getMessages } from '@/lib/i18n/messages';

describe('locale routing boundary', () => {
  it.each(['en', 'ka', 'ru', 'he'])(
    'accepts the supported locale %s',
    (locale) => {
      expect(isLocale(locale)).toBe(true);
    },
  );
  it.each(['EN', 'fr', '', '../en', 'en-US'])(
    'rejects unsupported input %s',
    (locale) => {
      expect(isLocale(locale)).toBe(false);
    },
  );
  it('builds localized URLs for current and future pages', () => {
    expect(localePath('en')).toBe('/en');
    expect(localePath('ka', '/privacy')).toBe('/ka/privacy');
    expect(localePath('ru', 'buy')).toBe('/ru/buy');
    expect(localePath('he')).toBe('/he');
  });
  it('loads each requested dictionary without falling back to English', async () => {
    expect((await getMessages('ka')).languageName).toBe('ქართული');
    expect((await getMessages('ru')).languageName).toBe('Русский');
    expect((await getMessages('en')).languageName).toBe('English');
    expect((await getMessages('he')).languageName).toBe('עברית');
  });
});
