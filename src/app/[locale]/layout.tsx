import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/lib/i18n/locales';
import { getFontPreloads } from '@/lib/fonts';
import '@/styles/globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <head>
        {getFontPreloads(locale).map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
