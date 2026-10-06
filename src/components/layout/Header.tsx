'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/locales';
import type { Messages } from '@/lib/i18n/messages';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Logo } from '@/components/ui/Logo';

export function Header({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Pick<
    Messages,
    'brand' | 'languageNavigation' | 'languageLabels'
  > & {
    landing: Pick<Messages['landing'], 'header'>;
  };
}) {
  const [compact, setCompact] = useState(false);
  const root = useRef<HTMLElement>(null);
  const links = [
    ['#buy', messages.landing.header.buy],
    ['#invest', messages.landing.header.invest],
    ['#sell', messages.landing.header.sell],
    ['#standard', messages.landing.header.standard],
  ];
  useEffect(() => {
    const header = root.current;
    if (!header) return;
    const disclosures = () => Array.from(header.querySelectorAll('details'));
    const close = (restore = false) => {
      disclosures().forEach((details) => {
        if (!details.open) return;
        details.open = false;
        if (restore) details.querySelector('summary')?.focus();
      });
    };
    const scroll = () => setCompact(window.scrollY > 32);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    const outside = (event: PointerEvent) => {
      disclosures().forEach((details) => {
        if (details.open && !details.contains(event.target as Node))
          details.open = false;
      });
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (!link) return;
      close();
      if (link.hash && link.pathname === location.pathname) {
        // The target's heading receives focus after the native anchor scroll.
        requestAnimationFrame(() =>
          document
            .getElementById(link.hash.slice(1))
            ?.focus({ preventScroll: true }),
        );
      }
    };
    const toggle = (event: Event) => {
      const current = event.target as HTMLDetailsElement;
      if (current.open)
        disclosures().forEach((details) => {
          if (details !== current) details.open = false;
        });
    };
    const wide = window.matchMedia('(min-width: 80rem)');
    const resize = () => {
      if (!wide.matches) return;
      const mobileHasFocus = header
        .querySelector('.dp-mobile-controls')
        ?.contains(document.activeElement);
      close();
      if (mobileHasFocus)
        header.querySelector<HTMLAnchorElement>('.dp-home')?.focus();
    };
    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    document.addEventListener('keydown', keyboard);
    document.addEventListener('pointerdown', outside);
    header.addEventListener('click', click);
    disclosures().forEach((details) =>
      details.addEventListener('toggle', toggle),
    );
    wide.addEventListener('change', resize);
    return () => {
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('keydown', keyboard);
      document.removeEventListener('pointerdown', outside);
      header.removeEventListener('click', click);
      disclosures().forEach((details) =>
        details.removeEventListener('toggle', toggle),
      );
      wide.removeEventListener('change', resize);
    };
  }, []);
  return (
    <header ref={root} className="dp-header" data-compact={compact}>
      <div className="dp-container dp-header-row">
        <a
          className="dp-home"
          href="#hero"
          aria-label={messages.landing.header.home}
        >
          <Logo brand={messages.brand} />
        </a>
        <nav
          className="dp-desktop-nav"
          aria-label={messages.landing.header.navigation}
        >
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="dp-desktop-languages">
          <LanguageSwitcher
            locale={locale}
            label={messages.languageNavigation}
            labels={messages.languageLabels}
          />
        </div>
        <a className="dp-header-advisor" href="#advisor">
          {messages.landing.header.advisor}
        </a>
        <div className="dp-mobile-controls">
          <details className="dp-language-picker">
            <summary aria-label={messages.languageNavigation}>
              <bdi dir="ltr">{messages.languageLabels[locale]}</bdi>
              <svg
                className="dp-utility-icon"
                aria-hidden="true"
                viewBox="0 0 16 16"
              >
                <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" />
              </svg>
            </summary>
            <LanguageSwitcher
              locale={locale}
              label={messages.languageNavigation}
              labels={messages.languageLabels}
            />
          </details>
          <details className="dp-mobile-menu">
            <summary aria-label={messages.landing.header.menu}>
              <svg
                className="dp-menu-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7h18M3 17h18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </summary>
            <nav aria-label={messages.landing.header.navigation}>
              {links.map(([href, label]) => (
                <a key={href} href={href}>
                  {label}
                </a>
              ))}
              <a className="dp-mobile-advisor" href="#advisor">
                {messages.landing.header.advisor}
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
