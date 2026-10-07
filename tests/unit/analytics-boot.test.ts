import { afterEach, expect, it, vi } from 'vitest';
import { prepareProviderContext } from '../../src/lib/analytics/context';
import { captureFirstTouch } from '../../src/lib/leads/attribution';

afterEach(() => vi.unstubAllGlobals());

function visit(href: string, referrer = '') {
  let current = href;
  const records = new Map<string, string>();
  const steps: string[] = [];
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      records.set(key, value);
    },
  };
  return {
    steps,
    storage,
    records,
    port: {
      capture: () => {
        steps.push('capture');
        captureFirstTouch(storage, current, referrer);
      },
      href: () => current,
      referrer: () => referrer,
      replaceUrl: (url: string) => {
        steps.push('cleanup');
        current = url;
      },
    },
  };
}

it.each([
  [
    'https://site.test/en?utm_source=google&utm_campaign=test#advisor',
    'https://site.test/en#advisor',
    'google',
  ],
  [
    'https://site.test/he?utm_source=meta&fbclid=test',
    'https://site.test/he',
    'meta',
  ],
])(
  'captures original first-touch before making campaign context safe: %s',
  (original, clean, source) => {
    const v = visit(original);
    expect(prepareProviderContext(v.port)).toBe(true);
    expect(v.steps).toEqual(['capture', 'cleanup']);
    expect(v.port.href()).toBe(clean);
    const first = captureFirstTouch(v.storage, v.port.href(), '');
    expect(first.landingUrl).toBe(original);
    expect(first.utm_source).toBe(source);
    expect(prepareProviderContext(v.port)).toBe(true);
    expect(v.steps.filter((s) => s === 'cleanup')).toHaveLength(1);
  },
);

it('drops arbitrary query and unapproved fragment from vendor context', () => {
  const v = visit(
    'https://site.test/ru?email=private%40example.test#private-name',
  );
  expect(prepareProviderContext(v.port)).toBe(true);
  expect(v.port.href()).toBe('https://site.test/ru');
});

it.each([
  'https://ref.test/search?email=private',
  'https://ref.test/private-name',
  'https://site.test/en?name=private',
])('immutable unsafe referrer remains blocked: %s', (ref) => {
  const v = visit('https://site.test/he?utm_source=meta', ref);
  expect(prepareProviderContext(v.port)).toBe(false);
  expect(captureFirstTouch(v.storage, v.port.href(), '').referrer).toBe(ref);
});

it('failed cleanup cannot grant provider permission', () => {
  const v = visit('https://site.test/en?utm_source=google');
  v.port.replaceUrl = () => {
    throw Error('blocked');
  };
  expect(prepareProviderContext(v.port)).toBe(false);
  expect(v.port.href()).toContain('?utm_source=google');
});

it('failed capture cannot proceed to cleanup', () => {
  const v = visit('https://site.test/en?utm_source=google');
  v.port.capture = () => {
    throw Error('failed');
  };
  expect(prepareProviderContext(v.port)).toBe(false);
  expect(v.steps).toEqual([]);
  expect(v.port.href()).toContain('?utm_source=google');
});

it('does not rewrite unsupported routes', () => {
  const v = visit('https://site.test/private-path?utm_source=google');
  expect(prepareProviderContext(v.port)).toBe(false);
  expect(v.steps).toEqual(['capture']);
});

it('shared capture retains original first-touch after cleanup with blocked storage', async () => {
  vi.resetModules();
  let current = 'https://site.test/he?utm_source=meta&fbclid=test';
  vi.stubGlobal('location', {
    get href() {
      return current;
    },
  });
  vi.stubGlobal('document', { referrer: 'https://ref.test/' });
  vi.stubGlobal('window', {
    get sessionStorage() {
      throw Error('blocked');
    },
  });
  const { getFirstTouchAttribution } =
    await import('../../src/lib/leads/browser-attribution');
  const first = getFirstTouchAttribution();
  current = 'https://site.test/he';
  expect(getFirstTouchAttribution()).toEqual(first);
  expect(first).toMatchObject({
    landingUrl: 'https://site.test/he?utm_source=meta&fbclid=test',
    utm_source: 'meta',
    fbclid: 'test',
    referrer: 'https://ref.test/',
  });
});
