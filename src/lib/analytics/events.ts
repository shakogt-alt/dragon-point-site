import { isLocale, type Locale } from '@/lib/i18n/locales';

export const eventNames = [
  'hero_find_property_click',
  'hero_advisor_click',
  'goal_buy_click',
  'goal_invest_click',
  'goal_sell_click',
  'lead_form_open',
  'lead_form_start',
  'lead_form_submit',
  'lead_form_success',
  'lead_form_error',
  'language_switch',
  'phone_click',
  'whatsapp_click',
  'email_click',
] as const;
export type EventName = (typeof eventNames)[number];
export type AnalyticsEvent = {
  name: EventName;
  locale: Locale;
  targetLocale?: Locale;
  intent?: 'buy' | 'invest' | 'sell';
  surface?: 'hero' | 'goal' | 'header' | 'footer' | 'sticky' | 'lead';
  errorKind?: 'validation' | 'delivery' | 'rate';
};

// Never forward arbitrary strings, URLs, attribution, field values or errors.
export function makeAnalyticsEvent(
  name: string,
  properties: unknown,
): AnalyticsEvent | null {
  if (
    !eventNames.includes(name as EventName) ||
    !properties ||
    typeof properties !== 'object'
  )
    return null;
  const p = properties as Record<string, unknown>;
  if (typeof p.locale !== 'string' || !isLocale(p.locale)) return null;
  const event: AnalyticsEvent = { name: name as EventName, locale: p.locale };
  if (typeof p.targetLocale === 'string' && isLocale(p.targetLocale))
    event.targetLocale = p.targetLocale;
  if (['buy', 'invest', 'sell'].includes(p.intent as string))
    event.intent = p.intent as AnalyticsEvent['intent'];
  if (
    ['hero', 'goal', 'header', 'footer', 'sticky', 'lead'].includes(
      p.surface as string,
    )
  )
    event.surface = p.surface as AnalyticsEvent['surface'];
  if (['validation', 'delivery', 'rate'].includes(p.errorKind as string))
    event.errorKind = p.errorKind as AnalyticsEvent['errorKind'];
  return event;
}
