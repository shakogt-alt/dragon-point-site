import type { Locale } from './locales';
import type english from '@/messages/en.json';

export type Messages = typeof english;

const dictionaries: Record<Locale, () => Promise<Messages>> = {
  en: () => import('@/messages/en.json').then((module) => module.default),
  ka: () => import('@/messages/ka.json').then((module) => module.default),
  ru: () => import('@/messages/ru.json').then((module) => module.default),
  he: () => import('@/messages/he.json').then((module) => module.default),
};

export function getMessages(locale: Locale): Promise<Messages> {
  return dictionaries[locale]();
}
