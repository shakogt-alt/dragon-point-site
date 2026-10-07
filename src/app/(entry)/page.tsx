import { redirect } from 'next/navigation';
import { defaultLocale, localePath } from '@/lib/i18n/locales';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    for (const item of Array.isArray(value)
      ? value
      : value === undefined
        ? []
        : [value])
      query.append(key, item);
  }
  const suffix = query.size ? `?${query.toString()}` : '';
  redirect(localePath(defaultLocale) + suffix);
}
