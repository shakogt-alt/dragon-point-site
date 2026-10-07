import Link from 'next/link';
import { localePath, locales, type Locale } from '@/lib/i18n/locales';

type Props = { locale: Locale; label: string; labels: Record<Locale, string> };

export function LanguageSwitcher({ locale, label, labels }: Props) {
  return (
    <nav aria-label={label} className="dp-languages">
      {locales.map((language) => (
        <Link
          key={language}
          href={localePath(language)}
          lang={language}
          dir="ltr"
          hrefLang={language}
          data-language={language}
          aria-current={language === locale ? 'page' : undefined}
          className="dp-language"
        >
          {labels[language]}
        </Link>
      ))}
    </nav>
  );
}
