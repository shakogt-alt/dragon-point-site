import { expect, it } from 'vitest';
import { z } from 'zod';
import {
  attributionSchema,
  attributionShape,
} from '@/lib/validation/attribution';

// Independent Phase 6 oracle: accepted values and transformed output must stay identical.
const controls =
  /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e]*$/;
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .regex(controls)
    .transform((v) => v.normalize('NFC'));
const url = z
  .string()
  .max(2048)
  .refine((v) => {
    try {
      const parsed = new URL(v);
      return (
        ['http:', 'https:'].includes(parsed.protocol) &&
        !parsed.username &&
        !parsed.password &&
        controls.test(v)
      );
    } catch {
      return false;
    }
  });
const shape = {
  utm_source: text(160).optional(),
  utm_medium: text(160).optional(),
  utm_campaign: text(160).optional(),
  utm_content: text(160).optional(),
  utm_term: text(160).optional(),
  gclid: text(256).optional(),
  fbclid: text(256).optional(),
  referrer: url.optional(),
  landingUrl: url.optional(),
};
const oracle = z.object(shape).strict();
const result = (r: { success: boolean; data?: unknown }) =>
  r.success ? { success: true, data: r.data } : { success: false };

it('preserves Phase 6 attribution acceptance and normalization at all boundaries', () => {
  const inputs: unknown[] = [
    undefined,
    null,
    false,
    3,
    [],
    {},
    '',
    ' e\u0301 ',
    '\ntext\t',
    'עברית',
    'ქართული',
    'Русский',
    'https://safe.test/path?email=private%40test.invalid',
    'https://user:pass@safe.test/',
    'javascript:alert(1)',
    'https://safe.test/\u202e',
  ];
  for (let point = 0; point <= 0x7f; point++)
    inputs.push(`x${String.fromCharCode(point)}y`);
  for (let point = 0x202a; point <= 0x202e; point++)
    inputs.push(`x${String.fromCharCode(point)}y`);
  for (const length of [159, 160, 161, 255, 256, 257, 2047, 2048, 2049]) {
    inputs.push(
      'a'.repeat(length),
      `  ${'a'.repeat(length)}  `,
      `https://safe.test/${'a'.repeat(length - 18)}`,
    );
  }
  for (const key of Object.keys(shape) as (keyof typeof shape)[]) {
    for (const value of inputs) {
      expect(
        result(attributionShape[key].safeParse(value)),
        `${key}: ${JSON.stringify(value)}`,
      ).toEqual(result(shape[key].safeParse(value)));
      expect(result(attributionSchema.safeParse({ [key]: value }))).toEqual(
        result(oracle.safeParse({ [key]: value })),
      );
    }
  }
  for (const value of [
    undefined,
    null,
    [],
    {},
    { arbitrary: 'x' },
    { landingUrl: 'https://safe.test', utm_source: ' e\u0301 ' },
    JSON.parse('{"__proto__":"x"}'),
    { constructor: 'x' },
  ]) {
    expect(result(attributionSchema.safeParse(value))).toEqual(
      result(oracle.safeParse(value)),
    );
  }
});
