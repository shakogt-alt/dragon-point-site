import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

type Props = { locale: Locale; messages: Messages };

// Temporary Phase 1 shell; approved landing sections are implemented in Phase 3.
export function FoundationShell({ locale, messages }: Props) {
  return (
    <>
      <a className="dp-skip-link" href="#main">
        {messages.skipLink}
      </a>
      <header className="border-b border-titanium py-6">
        <div className="dp-container flex flex-wrap items-center justify-between gap-4">
          <p dir="ltr" className="font-semibold tracking-wide">
            DRAGON POINT
          </p>
          <LanguageSwitcher
            locale={locale}
            label={messages.languageNavigation}
          />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="dp-container py-16">
        <p className="mb-4 text-sm font-medium text-graphite">
          {messages.foundation.status}
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
          {messages.foundation.heading}
        </h1>
        <p className="mt-6 max-w-2xl text-graphite">
          {messages.foundation.description}
        </p>
      </main>
    </>
  );
}
