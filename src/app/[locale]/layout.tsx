import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isLocale, locales } from '@/lib/i18n/locales';
import { firago } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = { title: 'Dragon Point — Foundation' };

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
    <html lang={locale} className={firago.variable}>
      <body>{children}</body>
    </html>
  );
}
