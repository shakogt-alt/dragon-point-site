import { describe, expect, it } from 'vitest';
import {
  CONSENT_KEY,
  readConsent,
  saveConsent,
} from '../../src/lib/analytics/consent';
import { makeAnalyticsEvent } from '../../src/lib/analytics/events';
import {
  createAnalyticsRuntime,
  type AnalyticsAdapter,
} from '../../src/lib/analytics/runtime';

const yes = { necessary: true, analytics: true, marketing: true } as const;
const no = { necessary: true, analytics: false, marketing: false } as const;
const now = 1800000000000;
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe('consent persistence fails closed', () => {
  it('preserves choices across reloads and expires them after 180 days', () => {
    const s = storage();
    expect(readConsent(s, now)).toBeUndefined();
    expect(saveConsent(s, yes, now)).toBe(true);
    expect(readConsent(s, now + 1)).toEqual(yes);
    expect(readConsent(s, now + 180 * 86400000)).toBeUndefined();
  });
  it.each([
    'null',
    '{}',
    '{bad',
    JSON.stringify({
      version: 1,
      updatedAt: now,
      necessary: false,
      analytics: true,
      marketing: true,
    }),
    JSON.stringify({
      version: 2,
      updatedAt: now,
      necessary: true,
      analytics: true,
      marketing: true,
    }),
    JSON.stringify({
      version: 1,
      updatedAt: now + 1,
      necessary: true,
      analytics: true,
      marketing: true,
    }),
  ])('rejects corrupt, obsolete or untrusted choice %s', (value) => {
    const s = storage();
    s.setItem(CONSENT_KEY, value);
    expect(readConsent(s, now)).toBeUndefined();
  });
  it('survives blocked storage without granting consent on the next visit', () => {
    const s = {
      getItem: () => {
        throw Error('blocked');
      },
      setItem: () => {
        throw Error('blocked');
      },
    };
    expect(saveConsent(s, yes, now)).toBe(false);
    expect(readConsent(s, now)).toBeUndefined();
  });
});

describe('analytics privacy boundary', () => {
  it('keeps only bounded public enums even when given a full lead payload', () => {
    expect(
      makeAnalyticsEvent('lead_form_submit', {
        locale: 'he',
        intent: 'invest',
        name: 'Private Name',
        phone: '+995555000000',
        email: 'private@example.test',
        budget: 'Secret',
        message: 'Secret',
        utm_source: 'private@example.test',
        gclid: 'secret',
        landingUrl: 'https://example.test/?email=secret',
        referrer: 'secret',
        surface: 'lead',
      }),
    ).toEqual({
      name: 'lead_form_submit',
      locale: 'he',
      intent: 'invest',
      surface: 'lead',
    });
  });
  it('rejects unknown events/locales and drops arbitrary enum values', () => {
    expect(
      makeAnalyticsEvent('private@example.test', { locale: 'en' }),
    ).toBeNull();
    expect(
      makeAnalyticsEvent('lead_form_submit', { locale: 'private' }),
    ).toBeNull();
    expect(
      makeAnalyticsEvent('language_switch', {
        locale: 'ru',
        targetLocale: 'he',
        intent: 'private',
        surface: 'secret',
      }),
    ).toEqual({ name: 'language_switch', locale: 'ru', targetLocale: 'he' });
  });
});

describe('purpose-gated analytics runtime', () => {
  it('does not duplicate an in-flight analytics initialization when marketing changes', async () => {
    let release!: () => void;
    let starts = 0;
    const sent: string[] = [];
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const adapter: AnalyticsAdapter = {
      purpose: 'analytics',
      start: async () => {
        starts++;
        await gate;
      },
      stop: () => {},
      track: (event) => {
        sent.push(event.name);
      },
    };
    const runtime = createAnalyticsRuntime(
      async () => [adapter],
      () => {},
    );
    const first = runtime.setConsent(yes);
    await Promise.resolve();
    await Promise.resolve();
    const second = runtime.setConsent({ ...no, analytics: true });
    release();
    await Promise.all([first, second]);
    runtime.track('lead_form_start', { locale: 'en' });
    expect(starts).toBe(1);
    expect(sent).toEqual(['lead_form_start']);
  });
  it('never loads, emits or queues pre-consent events', async () => {
    const events: unknown[] = [];
    let loads = 0;
    const runtime = createAnalyticsRuntime(
      async () => {
        loads++;
        return [];
      },
      (event) => events.push(event),
    );
    expect(runtime.track('lead_form_submit', { locale: 'en' })).toBe(false);
    await runtime.setConsent(no);
    expect(loads).toBe(0);
    expect(events).toEqual([]);
    await runtime.setConsent(yes);
    expect(loads).toBe(1);
    expect(events).toEqual([]);
  });
  it('routes by purpose and stops events immediately on revocation', async () => {
    const received: string[] = [];
    const adapters: AnalyticsAdapter[] = ['analytics', 'marketing', 'both'].map(
      (purpose) => ({
        purpose: purpose as AnalyticsAdapter['purpose'],
        start: async () => {},
        stop: () => {},
        track: (event) => {
          received.push(purpose + ':' + event.name);
        },
      }),
    );
    const runtime = createAnalyticsRuntime(
      async () => adapters,
      () => {},
    );
    await runtime.setConsent({ ...no, analytics: true });
    runtime.track('lead_form_start', { locale: 'ka' });
    expect(received).toEqual(['analytics:lead_form_start']);
    await runtime.setConsent(yes);
    runtime.track('lead_form_success', { locale: 'ka' });
    expect(received.slice(1)).toEqual([
      'analytics:lead_form_success',
      'marketing:lead_form_success',
      'both:lead_form_success',
    ]);
    await runtime.setConsent(no);
    expect(runtime.track('lead_form_submit', { locale: 'ka' })).toBe(false);
    expect(received).toHaveLength(4);
  });
  it('does not initialize a provider module resolved after consent is revoked', async () => {
    let resolve!: (adapters: AnalyticsAdapter[]) => void;
    let starts = 0;
    const runtime = createAnalyticsRuntime(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
      () => {},
    );
    const granting = runtime.setConsent(yes);
    await runtime.setConsent(no);
    resolve([
      {
        purpose: 'analytics',
        start: async () => {
          starts++;
        },
        stop: () => {},
        track: () => {},
      },
    ]);
    await granting;
    expect(starts).toBe(0);
  });
  it('keeps navigation/form callers safe when providers or observers fail', async () => {
    const runtime = createAnalyticsRuntime(
      async () => {
        throw Error('blocked');
      },
      () => {
        throw Error('observer');
      },
    );
    await expect(runtime.setConsent(yes)).resolves.toBeUndefined();
    expect(() =>
      runtime.track('lead_form_error', { locale: 'en' }),
    ).not.toThrow();
  });
});
