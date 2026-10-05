import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/locales';
import { getMessages } from '@/lib/i18n/messages';
import { FoundationShell } from '@/components/layout/FoundationShell';

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <FoundationShell locale={locale} messages={await getMessages(locale)} />
  );
}
