import { getFirstTouchAttribution } from '../leads/browser-attribution';
import { prepareProviderContext } from './context';
export { safeTrackingContext } from './context';
import type { AnalyticsEvent } from './events';
import type { AnalyticsAdapter } from './runtime';

export type ProviderConfig = { gaId?: string; gtmId?: string; metaId?: string };
export function parseProviderConfig(input: ProviderConfig): ProviderConfig {
  const config: ProviderConfig = {};
  if (/^G-[A-Z0-9]{4,20}$/.test(input.gaId ?? '')) config.gaId = input.gaId;
  if (/^GTM-[A-Z0-9]{4,20}$/.test(input.gtmId ?? ''))
    config.gtmId = input.gtmId;
  if (/^\d{5,20}$/.test(input.metaId ?? '')) config.metaId = input.metaId;
  return config;
}

export type ProviderHost = {
  safeContext: () => boolean;
  loadScript: (
    kind: string,
    url: string,
    allowed: () => boolean,
  ) => Promise<boolean>;
  google: (...args: unknown[]) => void;
  meta: (...args: unknown[]) => void;
  tag: (event: Record<string, unknown>) => void;
  disableGa: (id: string, disabled: boolean) => void;
  clearCookies: (prefixes: string[]) => void;
};
const denied = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
};
const analyticsOnly = { ...denied, analytics_storage: 'granted' };
const all = {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
};
function properties(event: AnalyticsEvent) {
  const { name, ...params } = event;
  void name;
  return params;
}

export function createProviderAdapters(
  config: ProviderConfig,
  host: ProviderHost,
): AnalyticsAdapter[] {
  const result: AnalyticsAdapter[] = [];
  const load = async (kind: string, url: string, allowed: () => boolean) => {
    if (!allowed() || !host.safeContext())
      throw new Error('Tracking unavailable');
    if (!(await host.loadScript(kind, url, allowed)) || !allowed())
      throw new Error('Tracking unavailable');
  };
  if (config.gtmId) {
    const id = config.gtmId;
    result.push({
      purpose: 'both',
      async start(allowed) {
        if (!allowed() || !host.safeContext())
          throw new Error('Tracking unavailable');
        host.google('consent', 'default', denied);
        // An audited GTM consent template must consume this before firing tags.
        // The entire bootstrap queue must remain denied even if download finishes
        // after revocation. Grant only once the script has loaded and is still allowed.
        host.tag({ dpConsent: denied });
        host.tag({ 'gtm.start': Date.now(), event: 'gtm.js' });
        await load(
          'gtm',
          `https://www.googletagmanager.com/gtm.js?id=${id}`,
          allowed,
        );
        host.tag({ event: 'dp_consent_update', dpConsent: all });
      },
      stop() {
        host.tag({ event: 'dp_consent_update', dpConsent: denied });
        host.clearCookies(['_ga', '_gcl', '_fbp', '_fbc']);
      },
      track(event) {
        if (host.safeContext())
          host.tag({ event: event.name, ...properties(event) });
      },
    });
  } else if (config.gaId) {
    const id = config.gaId;
    result.push({
      purpose: 'analytics',
      async start(allowed) {
        if (!allowed() || !host.safeContext())
          throw new Error('Tracking unavailable');
        host.disableGa(id, false);
        host.google('consent', 'default', denied);
        await load(
          'ga',
          `https://www.googletagmanager.com/gtag/js?id=${id}`,
          allowed,
        );
        host.google('consent', 'update', analyticsOnly);
        host.google('js', new Date());
        host.google('config', id, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          ignore_referrer: true,
        });
      },
      stop() {
        host.disableGa(id, true);
        host.google('consent', 'update', denied);
        host.clearCookies(['_ga', '_gcl']);
      },
      track(event) {
        if (host.safeContext())
          host.google('event', event.name, {
            ...properties(event),
            send_to: id,
          });
      },
    });
  }
  if (config.metaId) {
    const id = config.metaId;
    result.push({
      purpose: 'marketing',
      async start(allowed) {
        if (!allowed() || !host.safeContext())
          throw new Error('Tracking unavailable');
        host.meta('consent', 'revoke');
        host.meta('set', 'autoConfig', false, id);
        await load(
          'meta',
          'https://connect.facebook.net/en_US/fbevents.js',
          allowed,
        );
        host.meta('init', id); // No advanced matching or customer information.
        host.meta('consent', 'grant');
      },
      stop() {
        host.meta('consent', 'revoke');
        host.clearCookies(['_fbp', '_fbc']);
      },
      track(event) {
        if (host.safeContext())
          host.meta('trackSingleCustom', id, event.name, properties(event));
      },
    });
  }
  return result;
}

type Pixel = ((...args: unknown[]) => void) & {
  queue?: unknown[][];
  callMethod?: (...args: unknown[]) => void;
  push?: Pixel;
  loaded?: boolean;
  version?: string;
};
type TrackingWindow = Window & {
  dataLayer?: unknown[];
  fbq?: Pixel;
  _fbq?: Pixel;
  [key: `ga-disable-${string}`]: boolean;
};

export function browserProviderHost(): ProviderHost {
  const w = window as unknown as TrackingWindow;
  const google = (...args: unknown[]) => {
    w.dataLayer ??= [];
    // Google consumes array-like command records as well as gtag arguments.
    w.dataLayer.push(args);
  };
  const scripts = new Map<string, Promise<boolean>>();
  return {
    safeContext: () =>
      prepareProviderContext({
        capture: getFirstTouchAttribution,
        href: () => location.href,
        referrer: () => document.referrer,
      }),
    google,
    tag(event) {
      w.dataLayer ??= [];
      w.dataLayer.push(event);
    },
    meta(...args) {
      if (!w.fbq) {
        const pixel: Pixel = (...values) => {
          if (pixel.callMethod) pixel.callMethod(...values);
          else pixel.queue?.push(values);
        };
        pixel.queue = [];
        pixel.push = pixel;
        pixel.loaded = true;
        pixel.version = '2.0';
        w.fbq = pixel;
        w._fbq = pixel;
      }
      w.fbq(...args);
    },
    disableGa(id, disabled) {
      w[`ga-disable-${id}`] = disabled;
    },
    clearCookies(prefixes) {
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (
          !prefixes.some(
            (prefix) => name === prefix || name.startsWith(prefix + '_'),
          )
        )
          continue;
        const expired = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Lax`;
        document.cookie = expired;
        const parts = location.hostname.split('.');
        for (let i = 0; i < parts.length - 1; i++)
          document.cookie = `${expired}; Domain=${parts.slice(i).join('.')}`;
      }
    },
    loadScript(kind, url, allowed) {
      if (!allowed()) return Promise.resolve(false);
      const existing = scripts.get(kind);
      if (existing) return existing;
      const pending = new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.async = true;
        script.src = url;
        script.referrerPolicy = 'no-referrer';
        script.dataset.dpProvider = kind;
        const timeout = window.setTimeout(() => finish(false), 10000);
        const finish = (loaded: boolean) => {
          clearTimeout(timeout);
          if (!loaded || !allowed()) {
            script.remove();
            scripts.delete(kind);
            resolve(false);
          } else resolve(true);
        };
        script.onload = () => finish(true);
        script.onerror = () => finish(false);
        document.head.append(script);
      });
      scripts.set(kind, pending);
      return pending;
    },
  };
}
