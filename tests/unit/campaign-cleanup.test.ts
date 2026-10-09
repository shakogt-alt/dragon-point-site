import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { safeTrackingContext } from '../../src/lib/analytics/context';
import { makeAnalyticsEvent } from '../../src/lib/analytics/events';

const key = 'dragon-point:first-touch:v1';
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

async function visit(original: string, saved?: string) {
  let href = original;
  const records = new Map<string, string>(saved ? [[key, saved]] : []);
  const steps: string[] = [];
  const state = { framework: 'preserved' };
  const storage = {
    getItem: (name: string) => records.get(name) ?? null,
    setItem: (name: string, value: string) => {
      records.set(name, value);
      steps.push('persist');
    },
  };
  vi.stubGlobal('window', { sessionStorage: storage });
  vi.stubGlobal('location', {
    get href() {
      return href;
    },
  });
  vi.stubGlobal('document', { referrer: 'https://referrer.test/' });
  vi.stubGlobal('history', {
    state,
    replaceState: (nextState: unknown, _title: string, url: string) => {
      expect(nextState).toBe(state);
      steps.push('cleanup');
      href = url;
    },
  });
  const { getFirstTouchAttribution } =
    await import('../../src/lib/leads/browser-attribution');
  return {
    capture: getFirstTouchAttribution,
    storage,
    records,
    steps,
    href: () => href,
    navigate: (url: string) => {
      href = url;
    },
  };
}

it('captures and persists before cleaning without any analytics provider or consent', async () => {
  const original =
    'https://site.test/en?utm_source=test&gclid=abc&foo=bar#advisor';
  const v = await visit(original);
  expect(v.capture()).toMatchObject({
    utm_source: 'test',
    gclid: 'abc',
    landingUrl: original,
  });
  expect(v.href()).toBe('https://site.test/en?foo=bar#advisor');
  expect(v.steps).toEqual(['persist', 'cleanup']);
  expect(JSON.parse(v.records.get(key)!)).toMatchObject({
    utm_source: 'test',
    gclid: 'abc',
    landingUrl: original,
  });
});

it.each([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
])(
  'removes every occurrence of supported %s while keeping unrelated duplicates',
  async (name) => {
    const v = await visit(
      'https://site.test/he?' +
        name +
        '=first&foo=one&' +
        name +
        '=second&foo=two#hero',
    );
    v.capture();
    expect(v.href()).toBe('https://site.test/he?foo=one&foo=two#hero');
    expect(v.capture()[name as keyof ReturnType<typeof v.capture>]).toBe(
      'first',
    );
    expect(v.steps.filter((s) => s === 'cleanup')).toHaveLength(1);
  },
);

it('removes invalid or empty supported values without rewriting unrelated-only URLs', async () => {
  const v = await visit(
    'https://site.test/ka?utm_source=%00bad&fbclid=&foo=a%20b',
  );
  const first = v.capture();
  expect(first.utm_source).toBeUndefined();
  expect(v.href()).toBe('https://site.test/ka?foo=a+b');
  v.navigate('https://site.test/ka?foo=a%20b');
  v.capture();
  expect(v.href()).toBe('https://site.test/ka?foo=a%20b');
  expect(v.steps.filter((s) => s === 'cleanup')).toHaveLength(1);
});

it('does not overwrite persisted first touch on a later campaign landing', async () => {
  const first = {
    landingUrl: 'https://site.test/en?utm_source=first',
    utm_source: 'first',
  };
  const v = await visit(
    'https://site.test/ru?utm_source=later&gclid=new&foo=bar',
    JSON.stringify(first),
  );
  expect(v.capture()).toEqual(first);
  expect(v.href()).toBe('https://site.test/ru?foo=bar');
  expect(JSON.parse(v.records.get(key)!)).toEqual(first);
  expect(v.steps).toEqual(['cleanup']);
});

it('cleans later URLs even when first touch is already retained in memory', async () => {
  const v = await visit('https://site.test/en?utm_source=first');
  const first = v.capture();
  v.navigate('https://site.test/he?utm_source=later&fbclid=new#advisor');
  expect(v.capture()).toBe(first);
  expect(v.href()).toBe('https://site.test/he#advisor');
  expect(first.utm_source).toBe('first');
});

it('recovers malformed storage before cleaning and keeps the lead snapshot', async () => {
  const v = await visit(
    'https://site.test/he?utm_source=meta&foo=bar',
    '{broken',
  );
  expect(v.capture().utm_source).toBe('meta');
  expect(v.href()).toBe('https://site.test/he?foo=bar');
  expect(JSON.parse(v.records.get(key)!)).toMatchObject({ utm_source: 'meta' });
  expect(v.steps).toEqual(['persist', 'cleanup']);
});

it.each(['access', 'write'])(
  'blocked storage %s cannot crash cleanup or leak arbitrary query to vendors',
  async (failure) => {
    const original =
      'https://site.test/en?utm_source=private%40example.test&foo=bar';
    const v = await visit(original);
    if (failure === 'access') {
      vi.stubGlobal('window', {
        get sessionStorage() {
          throw Error('blocked');
        },
      });
    } else {
      v.storage.setItem = () => {
        throw Error('blocked');
      };
    }
    const first = v.capture();
    expect(v.href()).toBe('https://site.test/en?foo=bar');
    expect(v.capture()).toBe(first);
    expect(first).toMatchObject({
      landingUrl: original,
      utm_source: 'private@example.test',
    });
    expect(safeTrackingContext(v.href(), '')).toBe(false);
    expect(
      makeAnalyticsEvent('lead_form_submit', {
        ...first,
        locale: 'en',
        phone: '+12025550123',
      }),
    ).toEqual({ name: 'lead_form_submit', locale: 'en' });
  },
);

it('a failed history replacement stays fail closed without losing attribution', async () => {
  const v = await visit('https://site.test/en?utm_source=test');
  vi.stubGlobal('history', {
    state: {},
    replaceState: () => {
      throw Error('blocked');
    },
  });
  expect(v.capture().utm_source).toBe('test');
  expect(v.href()).toBe('https://site.test/en?utm_source=test');
  expect(safeTrackingContext(v.href(), '')).toBe(false);
});

it('malformed locations cannot cause a hydration crash', async () => {
  const v = await visit('not a URL');
  expect(() => v.capture()).not.toThrow();
  expect(v.href()).toBe('not a URL');
});

it('provider context preserves unrelated PII query and blocks automatic collection', async () => {
  const v = await visit(
    'https://site.test/en?utm_source=test&email=private%40example.test#hero',
  );
  const { prepareProviderContext } =
    await import('../../src/lib/analytics/context');
  expect(
    prepareProviderContext({
      capture: v.capture,
      href: v.href,
      referrer: () => '',
    }),
  ).toBe(false);
  expect(v.href()).toBe(
    'https://site.test/en?email=private%40example.test#hero',
  );
});
