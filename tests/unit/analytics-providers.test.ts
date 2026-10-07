import { expect, it } from 'vitest';
import {
  createProviderAdapters,
  parseProviderConfig,
  safeTrackingContext,
  type ProviderHost,
} from '../../src/lib/analytics/providers';

function host() {
  const commands: unknown[][] = [];
  const urls: string[] = [];
  const port: ProviderHost = {
    safeContext: () => true,
    loadScript: async (kind, url, allowed) => {
      if (!allowed()) return false;
      urls.push(kind + ':' + url);
      return true;
    },
    google: (...args) => {
      commands.push(args);
    },
    meta: (...args) => {
      commands.push(args);
    },
    tag: (event) => {
      commands.push([event]);
    },
    disableGa: (id, disabled) => {
      commands.push(['disabled', id, disabled]);
    },
    clearCookies: (prefixes) => {
      commands.push(['clear', ...prefixes]);
    },
  };
  return { port, commands, urls };
}
it('empty or malformed configuration never creates tracking adapters', () => {
  expect(createProviderAdapters(parseProviderConfig({}), host().port)).toEqual(
    [],
  );
  expect(
    parseProviderConfig({
      gaId: 'private@example.test',
      gtmId: '<script>',
      metaId: 'secret',
    }),
  ).toEqual({});
});
it.each([
  ['https://site.test/he', '', true],
  ['https://site.test/en#advisor', 'https://search.test/', true],
  ['https://site.test/en?email=secret', '', false],
  ['https://site.test/en#private-name', '', false],
  ['https://site.test/en', 'https://search.test/?q=private-name', false],
  ['https://site.test/en', 'https://search.test/private-name', false],
])('vendor automatic context fails closed: %s', (url, referrer, expected) => {
  expect(safeTrackingContext(url as string, referrer as string)).toBe(expected);
});
it('GA4 sends only safe manual events and disables collection when stopped', async () => {
  const h = host();
  const [ga] = createProviderAdapters({ gaId: 'G-TESTONLY' }, h.port);
  await ga.start(() => true);
  ga.track({ name: 'lead_form_submit', locale: 'ru', intent: 'sell' });
  expect(h.urls).toEqual([
    'ga:https://www.googletagmanager.com/gtag/js?id=G-TESTONLY',
  ]);
  expect(h.commands).toContainEqual([
    'config',
    'G-TESTONLY',
    {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ignore_referrer: true,
    },
  ]);
  expect(h.commands).toContainEqual([
    'event',
    'lead_form_submit',
    { locale: 'ru', intent: 'sell', send_to: 'G-TESTONLY' },
  ]);
  ga.stop();
  expect(h.commands).toContainEqual(['disabled', 'G-TESTONLY', true]);
});
it('GTM takes precedence over standalone GA4 and requires both purposes', () => {
  const adapters = createProviderAdapters(
    { gaId: 'G-TESTONLY', gtmId: 'GTM-TESTONLY' },
    host().port,
  );
  expect(adapters).toHaveLength(1);
  expect(adapters[0].purpose).toBe('both');
});
it('Meta disables auto configuration, advanced matching and revokes collection', async () => {
  const h = host();
  const [meta] = createProviderAdapters({ metaId: '1234567890' }, h.port);
  await meta.start(() => true);
  expect(h.commands).toContainEqual(['set', 'autoConfig', false, '1234567890']);
  expect(h.commands).toContainEqual(['init', '1234567890']);
  meta.track({ name: 'lead_form_success', locale: 'he' });
  expect(h.commands).toContainEqual([
    'trackSingleCustom',
    '1234567890',
    'lead_form_success',
    { locale: 'he' },
  ]);
  meta.stop();
  expect(h.commands).toContainEqual(['consent', 'revoke']);
});
it('a script resolved after revocation never configures a provider', async () => {
  const h = host();
  let allowed = true;
  let resolve!: (loaded: boolean) => void;
  h.port.loadScript = () =>
    new Promise((r) => {
      resolve = r;
    });
  const [ga] = createProviderAdapters({ gaId: 'G-TESTONLY' }, h.port);
  const start = ga.start(() => allowed);
  allowed = false;
  resolve(true);
  await expect(start).rejects.toThrow();
  expect(h.commands.some((c) => c[0] === 'config')).toBe(false);
});
it('unsafe URL context never downloads a configured provider', async () => {
  const h = host();
  h.port.safeContext = () => false;
  const [ga] = createProviderAdapters({ gaId: 'G-TESTONLY' }, h.port);
  await expect(ga.start(() => true)).rejects.toThrow();
  expect(h.urls).toEqual([]);
});

it('delayed GTM bootstrap sees only denied consent after revocation', async () => {
  const h = host();
  let allowed = true;
  let resolve!: (loaded: boolean) => void;
  h.port.loadScript = () =>
    new Promise((r) => {
      resolve = r;
    });
  const [gtm] = createProviderAdapters({ gtmId: 'GTM-TESTONLY' }, h.port);
  const start = gtm.start(() => allowed);
  allowed = false;
  gtm.stop();
  // A downloaded container consumes every historical queue record, in order.
  const bootstrapQueue = h.commands.filter((c) => typeof c[0] === 'object');
  expect(JSON.stringify(bootstrapQueue)).not.toContain('granted');
  resolve(true);
  await expect(start).rejects.toThrow();
  expect(JSON.stringify(h.commands)).not.toContain('granted');
});

it('GTM grants consent only after loading and a live permission check', async () => {
  const h = host();
  let resolve!: (loaded: boolean) => void;
  h.port.loadScript = () =>
    new Promise((r) => {
      resolve = r;
    });
  const [gtm] = createProviderAdapters({ gtmId: 'GTM-TESTONLY' }, h.port);
  const start = gtm.start(() => true);
  expect(JSON.stringify(h.commands)).not.toContain('granted');
  resolve(true);
  await start;
  expect(h.commands).toContainEqual([
    {
      event: 'dp_consent_update',
      dpConsent: {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      },
    },
  ]);
});
