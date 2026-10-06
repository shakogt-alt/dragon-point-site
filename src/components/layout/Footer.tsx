import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import { Logo } from '@/components/ui/Logo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Arrow } from '@/components/ui/Arrow';

export function Footer({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const copy = messages.landing.footer;
  return (
    <footer id="contact" tabIndex={-1} className="dp-footer dp-dark">
      <div className="dp-container">
        <div className="dp-footer-intro">
          <h2>{copy.title}</h2>
          <p>{copy.contact}</p>
        </div>
        <div className="dp-footer-grid">
          <div>
            <Logo brand={messages.brand} />
            <p>{copy.geo}</p>
            <p className="dp-powered">
              {messages.brand.powered}{' '}
              <bdi dir="ltr">{messages.brand.technology}</bdi>
            </p>
          </div>
          <div className="dp-footer-links">
            <LanguageSwitcher
              locale={locale}
              label={messages.languageNavigation}
              labels={messages.languageLabels}
            />
            <details className="dp-privacy">
              <summary>{copy.privacy}</summary>
              <p>{copy.privacyNotice}</p>
            </details>
          </div>
          <a className="dp-back" href="#hero">
            <span>{copy.back}</span>
            <Arrow className="dp-up-arrow" />
          </a>
        </div>
        <p className="dp-footer-note">{copy.note}</p>
      </div>
    </footer>
  );
}
