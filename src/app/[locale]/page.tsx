import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/locales';
import { getMessages } from '@/lib/i18n/messages';
import { Landing } from '@/components/layout/Landing';
import { getSeoConfig } from '@/lib/seo/config';
import { buildLocaleMetadata } from '@/lib/seo/metadata';
import {
  buildStructuredData,
  serializeJsonLd,
} from '@/lib/seo/structured-data';

// Keep runtime deployment policy consistent with robots, sitemap and response headers.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return buildLocaleMetadata(locale, await getMessages(locale), getSeoConfig());
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = await getMessages(locale);
  const structuredData = buildStructuredData(locale, messages, getSeoConfig());
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <Landing locale={locale} messages={messages} />
    </>
  );
}
import type { Metadata } from 'next';
