import { describe, expect, it } from 'vitest';
import {
  leadFormSchema,
  leadRequestSchema,
} from '../../src/lib/validation/lead';
import { buildLeadPayload } from '../../src/lib/leads/payload';
import { createLeadHandler } from '../../src/lib/leads/handler';
import { createRateLimiter } from '../../src/lib/leads/rate-limit';

const submissionId = '71da1176-f50a-4c21-9281-47d3bc9bdbe4';
const values = {
  intent: 'buy',
  name: 'Test Person',
  phone: '+995 (555) 00-00-00',
  email: '',
  budget: '',
  message: '',
  preferredLanguage: 'he',
  website: '',
};
const valid = {
  ...values,
  locale: 'en',
  source: 'dragon-point-landing',
  submissionId,
};
const request = (value: unknown) =>
  new Request('https://example.invalid/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(value),
  });

describe('stable submission identity at the application boundary', () => {
  it('accepts a UUID without adding it to the form-value schema', () => {
    expect(leadRequestSchema.parse(valid).submissionId).toBe(submissionId);
    expect(leadFormSchema.parse(values)).not.toHaveProperty('submissionId');
  });

  it.each([
    undefined,
    null,
    '',
    'invalid',
    42,
    {},
    '71da1176-f50a-4c21-9281-47d3bc9bdbe',
  ])('rejects missing or malformed submission identity (%j)', (id) => {
    expect(
      leadRequestSchema.safeParse({ ...valid, submissionId: id }).success,
    ).toBe(false);
  });

  it('preserves the lifecycle UUID in the normalized payload', () => {
    expect(
      buildLeadPayload(leadFormSchema.parse(values), 'en', {}, submissionId),
    ).toEqual({
      intent: 'buy',
      name: 'Test Person',
      phone: '+995555000000',
      preferredLanguage: 'he',
      locale: 'en',
      source: 'dragon-point-landing',
      submissionId,
    });
  });

  it('does not let untrusted attribution replace the submission identity', () => {
    const payload = buildLeadPayload(
      leadFormSchema.parse(values),
      'en',
      { utm_source: 'synthetic', submissionId: 'untrusted' } as {
        utm_source: string;
      },
      submissionId,
    );
    expect(payload.submissionId).toBe(submissionId);
    expect(payload.utm_source).toBe('synthetic');
  });

  it('forwards the validated UUID unchanged and rejects absent IDs before delivery', async () => {
    const delivered: unknown[] = [];
    const handler = createLeadHandler({
      service: {
        submit: async (payload) => {
          delivered.push(payload);
          return { delivered: true };
        },
      },
      limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
      env: {},
    });
    const result = await handler(request(valid));
    expect(result.status).toBe(200);
    expect(delivered).toHaveLength(1);
    expect(delivered[0]).toMatchObject({
      submissionId,
      phone: '+995555000000',
    });
    const { submissionId: omitted, ...missing } = valid;
    expect(omitted).toBe(submissionId);
    expect((await handler(request(missing))).status).toBe(400);
    expect(delivered).toHaveLength(1);
  });
});
