import { redirect } from 'next/navigation';
import { defaultLocale, localePath } from '@/lib/i18n/locales';

export default function HomePage() {
  redirect(localePath(defaultLocale));
}
