'use client';

import {
  CONSENT_KEY,
  DENIED,
  readConsent,
  saveConsent,
  type Consent,
} from './consent';
import { createAnalyticsRuntime } from './runtime';
import type { EventName } from './events';
import { isLocale } from '@/lib/i18n/locales';

type State = {
  initialized: boolean;
  choice?: Consent;
  ui: 'closed' | 'banner' | 'dialog';
  sessionOnly: boolean;
};
const serverState: State = {
  initialized: false,
  ui: 'closed',
  sessionOnly: false,
};
let state: State = serverState;
const listeners = new Set<() => void>();
let runtime: ReturnType<typeof createAnalyticsRuntime> | undefined;
let returnFocus: HTMLElement | null = null;
let returnToBanner = false;
const update = (next: State) => {
  state = next;
  listeners.forEach((notify) => notify());
};
export const consentSnapshot = () => state;
export const consentServerSnapshot = () => serverState;
export const subscribeConsent = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};
const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export function openConsentSettings() {
  returnFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  returnToBanner = returnFocus?.dataset.consentAction === 'customize';
  update({ ...state, ui: 'dialog' });
}
export function restoreConsentFocus() {
  // The first-visit trigger is recreated when the banner returns after Escape.
  const target = returnFocus?.isConnected
    ? returnFocus
    : returnToBanner
      ? document.querySelector<HTMLElement>('[data-consent-action="customize"]')
      : document.getElementById('main');
  (target ?? document.getElementById('main'))?.focus({ preventScroll: true });
}
export function closeConsentSettings() {
  update({ ...state, ui: state.choice ? 'closed' : 'banner' });
}
export function chooseConsent(choice: Consent) {
  const safe = {
    necessary: true as const,
    analytics: choice.analytics === true,
    marketing: choice.marketing === true,
  };
  // Revocation reaches the runtime synchronously before the UI closes.
  void runtime?.setConsent(safe);
  update({
    initialized: true,
    choice: safe,
    ui: 'closed',
    sessionOnly: !saveConsent(storage(), safe),
  });
}
export function trackAnalytics(name: EventName, properties: unknown): boolean {
  return runtime?.track(name, properties) ?? false;
}

export function initializeAnalytics() {
  runtime ??= createAnalyticsRuntime(
    async () => {
      const {
        createProviderAdapters,
        parseProviderConfig,
        browserProviderHost,
      } = await import('./providers');
      return createProviderAdapters(
        parseProviderConfig({
          gaId: process.env.NEXT_PUBLIC_GA_ID,
          gtmId: process.env.NEXT_PUBLIC_GTM_ID,
          metaId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
        }),
        browserProviderHost(),
      );
    },
    (event) =>
      window.dispatchEvent(
        new CustomEvent('dragon-point:analytics', { detail: event }),
      ),
  );
  const restore = () => {
    const choice = readConsent(storage());
    void runtime?.setConsent(choice ?? DENIED);
    update({
      initialized: true,
      choice,
      ui: state.ui === 'dialog' ? 'dialog' : choice ? 'closed' : 'banner',
      sessionOnly: false,
    });
  };
  restore();
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) restore();
  };
  window.addEventListener('storage', onStorage);
  // Expired persisted choices fail closed during long-lived visits as well.
  const expiry = window.setInterval(() => {
    if (state.choice && !state.sessionOnly && !readConsent(storage()))
      restore();
  }, 60000);
  const once = new Set<string>();
  const localeProperties = () => ({ locale: document.documentElement.lang });
  const intentProperties = () => ({
    ...localeProperties(),
    intent: document.querySelector<HTMLInputElement>(
      '#lead-form input[name="intent"]:checked',
    )?.value,
  });
  const emitOnce = (name: EventName, props: unknown) => {
    if (!once.has(name) && trackAnalytics(name, props)) once.add(name);
  };
  const click = (event: MouseEvent) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest<HTMLAnchorElement>('a[href]');
    const language = link?.getAttribute('data-language');
    if (
      language &&
      isLocale(language) &&
      language !== document.documentElement.lang
    ) {
      trackAnalytics('language_switch', {
        ...localeProperties(),
        targetLocale: language,
      });
      return;
    }
    const goal = target?.closest<HTMLElement>('.dp-goal-card[data-intent]');
    if (goal) {
      const intent = goal.dataset.intent;
      if (intent === 'buy' || intent === 'invest' || intent === 'sell') {
        trackAnalytics(`goal_${intent}_click`, {
          ...localeProperties(),
          intent,
          surface: 'goal',
        });
        emitOnce('lead_form_open', {
          ...localeProperties(),
          intent,
          surface: 'goal',
        });
      }
    } else if (link?.getAttribute('href') === '#advisor') {
      const surface = link.closest('#hero')
        ? 'hero'
        : link.closest('header')
          ? 'header'
          : link.closest('.dp-mobile-lead-cta')
            ? 'sticky'
            : 'footer';
      const selected = intentProperties();
      const actionIntent = link.dataset.intent;
      const props = {
        ...selected,
        surface,
        intent:
          actionIntent === 'buy' ||
          actionIntent === 'invest' ||
          actionIntent === 'sell'
            ? actionIntent
            : selected.intent,
      };
      if (surface === 'hero')
        trackAnalytics(
          link.dataset.intent === 'buy'
            ? 'hero_find_property_click'
            : 'hero_advisor_click',
          props,
        );
      emitOnce('lead_form_open', props);
    }
    const href = link?.getAttribute('href') ?? '';
    if (href.startsWith('tel:'))
      trackAnalytics('phone_click', localeProperties());
    if (href.startsWith('mailto:'))
      trackAnalytics('email_click', localeProperties());
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href))
      trackAnalytics('whatsapp_click', localeProperties());
  };
  const input = (event: Event) => {
    if (
      event.target instanceof Element &&
      event.target.closest('#lead-form') &&
      event.target.id !== 'lead-website'
    )
      emitOnce('lead_form_start', { ...intentProperties(), surface: 'lead' });
  };
  document.addEventListener('click', click, true);
  document.addEventListener('input', input);
  document.addEventListener('change', input);
  const lead = document.getElementById('advisor');
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting))
        emitOnce('lead_form_open', { ...intentProperties(), surface: 'lead' });
    },
    { threshold: 0.2 },
  );
  if (lead) observer.observe(lead);
  return () => {
    clearInterval(expiry);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('click', click, true);
    document.removeEventListener('input', input);
    document.removeEventListener('change', input);
    observer.disconnect();
  };
}
