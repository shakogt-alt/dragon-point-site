import { expect, it } from 'vitest';
import { prepareProviderContext } from '../../src/lib/analytics/context';

it.each([
  ['https://site.test/en#advisor', '', true],
  ['https://site.test/he', 'https://ref.test/', true],
  ['https://site.test/ru?email=private%40example.test#private-name', '', false],
  ['https://site.test/en?foo=bar#hero', '', false],
  ['https://site.test/he?utm_source=meta', '', false],
  ['https://site.test/he', 'https://ref.test/search?email=private', false],
  ['https://site.test/he', 'https://ref.test/private-name', false],
  ['https://site.test/he', 'https://site.test/en?name=private', false],
  ['https://site.test/private-path?utm_source=google', '', false],
])(
  'provider guard captures then checks without rewriting URL/referrer: %s',
  (href, referrer, allowed) => {
    const steps: string[] = [];
    const port = {
      capture: () => {
        steps.push('capture');
      },
      href: () => {
        steps.push('guard');
        return href as string;
      },
      referrer: () => referrer as string,
    };
    expect(prepareProviderContext(port)).toBe(allowed);
    expect(steps).toEqual(['capture', 'guard']);
  },
);

it('failed capture cannot grant provider permission', () => {
  let inspected = false;
  expect(
    prepareProviderContext({
      capture: () => {
        throw Error('failed');
      },
      href: () => {
        inspected = true;
        return 'https://site.test/en';
      },
      referrer: () => '',
    }),
  ).toBe(false);
  expect(inspected).toBe(false);
});
