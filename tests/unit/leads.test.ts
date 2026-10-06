import { describe, expect, it } from 'vitest';
import {
  leadFormSchema,
  leadRequestSchema,
} from '../../src/lib/validation/lead';
import { captureFirstTouch } from '../../src/lib/leads/attribution';
import { buildLeadPayload } from '../../src/lib/leads/payload';

const values = {
  intent: 'invest',
  name: 'Test Person',
  phone: '+995 (555) 12-34-56',
  email: '',
  budget: '',
  message: '',
  preferredLanguage: 'he',
  website: '',
};

describe('lead validation', () => {
  it.each([
    '+995 (555) 12-34-56',
    '+972 50 123 4567',
    '+44 20 7946 0958',
    '001 202 555 0123',
  ])('accepts international phone %s', (phone) => {
    expect(leadFormSchema.safeParse({ ...values, phone }).success).toBe(true);
  });
  it.each([
    { name: '' },
    { phone: 'hello' },
    { phone: '+1' },
    { email: 'bad@' },
    { intent: 'rent' },
    { preferredLanguage: 'fr' },
    { message: 'x'.repeat(2001) },
    { name: 'bad\u0000name' },
  ])('rejects invalid form values %j', (bad) => {
    expect(leadFormSchema.safeParse({ ...values, ...bad }).success).toBe(false);
  });
  it('normalizes whitespace and accepts multilingual names without requiring email', () => {
    const result = leadFormSchema.parse({
      ...values,
      name: '  שלום שלום  ',
      message: '  Need a property\nwith a study.  ',
    });
    expect(result.name).toBe('שלום שלום');
    expect(result.message).toBe('Need a property\nwith a study.');
    expect(result.email).toBe('');
  });
  it('rejects overposting, invalid attribution URLs and oversized campaign values', () => {
    const valid = buildLeadPayload(leadFormSchema.parse(values), 'ru', {
      landingUrl: 'https://example.test/en',
    });
    expect(leadRequestSchema.safeParse({ ...valid, website: '' }).success).toBe(
      true,
    );
    for (const extra of [
      { admin: true },
      { landingUrl: 'javascript:alert(1)' },
      { utm_campaign: 'x'.repeat(161) },
    ])
      expect(
        leadRequestSchema.safeParse({ ...valid, website: '', ...extra })
          .success,
      ).toBe(false);
  });
});

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe('first-touch attribution', () => {
  it('preserves all attribution fields through locale changes and later campaign links', () => {
    const storage = memoryStorage();
    const first = captureFirstTouch(
      storage,
      'https://example.test/en?utm_source=search&utm_medium=cpc&utm_campaign=georgia&utm_content=building&utm_term=property&gclid=g1&fbclid=f1',
      'https://referrer.test/search',
    );
    const later = captureFirstTouch(
      storage,
      'https://example.test/he?utm_source=other',
      '',
    );
    expect(later).toEqual(first);
    expect(later).toMatchObject({
      utm_source: 'search',
      utm_medium: 'cpc',
      utm_campaign: 'georgia',
      utm_content: 'building',
      utm_term: 'property',
      gclid: 'g1',
      fbclid: 'f1',
      referrer: 'https://referrer.test/search',
    });
    expect(later.landingUrl).toContain('/en?utm_source=search');
  });
  it('uses the first repeated query value and ignores unknown parameters', () => {
    expect(
      captureFirstTouch(
        memoryStorage(),
        'https://example.test/en?utm_source=first&utm_source=second&admin=1',
        '',
      ),
    ).toEqual({
      landingUrl:
        'https://example.test/en?utm_source=first&utm_source=second&admin=1',
      utm_source: 'first',
    });
  });
  it('recovers from corrupt storage and continues when storage is blocked', () => {
    expect(
      captureFirstTouch(
        { getItem: () => '{broken', setItem: () => {} },
        'https://example.test/ka',
        '',
      ).landingUrl,
    ).toBe('https://example.test/ka');
    expect(
      captureFirstTouch(
        {
          getItem: () => {
            throw Error('blocked');
          },
          setItem: () => {
            throw Error('blocked');
          },
        },
        'https://example.test/ru',
        '',
      ).landingUrl,
    ).toBe('https://example.test/ru');
  });
  it('drops invalid referrer, oversized click IDs and control characters', () => {
    expect(
      captureFirstTouch(
        memoryStorage(),
        'https://example.test/he?utm_source=%00bad&gclid=' + 'x'.repeat(257),
        'javascript:alert(1)',
      ),
    ).toEqual({
      landingUrl:
        'https://example.test/he?utm_source=%00bad&gclid=' + 'x'.repeat(257),
    });
  });
});

it('constructs a sanitized payload with separate page/preferred locales and no honeypot', () => {
  expect(
    buildLeadPayload(leadFormSchema.parse(values), 'ru', {
      utm_source: 'search',
      landingUrl: 'https://example.test/en',
    }),
  ).toEqual({
    intent: 'invest',
    name: 'Test Person',
    phone: '+995555123456',
    preferredLanguage: 'he',
    locale: 'ru',
    source: 'dragon-point-landing',
    utm_source: 'search',
    landingUrl: 'https://example.test/en',
  });
});
