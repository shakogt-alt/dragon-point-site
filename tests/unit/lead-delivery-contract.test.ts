import { describe, expect, it, vi } from 'vitest';
import { createLeadHandler } from '../../src/lib/leads/handler';
import { createLeadService } from '../../src/lib/leads/service';
import { createRateLimiter } from '../../src/lib/leads/rate-limit';

const endpoint = 'https://receiver.example.invalid/leads';
const token = 'synthetic-test-token';
const input = {
  intent: 'invest',
  name: '  Test Person  ',
  phone: '00995 (555) 00-00-00',
  email: '  test@example.invalid  ',
  budget: '  Not specified  ',
  message: '  Synthetic enquiry.\nNo real personal data.  ',
  preferredLanguage: 'ka',
  locale: 'he',
  source: 'dragon-point-landing',
  submissionId: '71da1176-f50a-4c21-9281-47d3bc9bdbe4',
  website: '',
  utm_source: '  synthetic  ',
  utm_medium: 'test',
  utm_campaign: 'receiver-contract',
  utm_content: 'fixture',
  utm_term: 'test',
  gclid: 'synthetic-click',
  fbclid: 'synthetic-click',
  referrer: 'https://referrer.example.invalid/',
  landingUrl: 'https://example.invalid/en?utm_source=synthetic',
};
const normalized = {
  ...input,
  name: 'Test Person',
  phone: '+995555000000',
  email: 'test@example.invalid',
  budget: 'Not specified',
  message: 'Synthetic enquiry.\nNo real personal data.',
  utm_source: 'synthetic',
};
const request = (body: unknown = input, headers = {}) =>
  new Request('https://example.invalid/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const boundary = (
  fetcher: typeof fetch,
  webhookToken: string | undefined = token,
) =>
  createLeadHandler({
    service: createLeadService(
      { LEAD_WEBHOOK_URL: endpoint, LEAD_WEBHOOK_TOKEN: webhookToken },
      fetcher,
    ),
    limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
    env: {},
  });

describe('composed API to receiver contract (isolated fetch; no network)', () => {
  it('delivers all normalized fields with private auth and a generic acknowledgement', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('receiver-private-record-details', { status: 201 }),
      );
    const result = await boundary(fetcher)(request());
    const [url, init] = fetcher.mock.calls[0];
    const expected = { ...normalized };
    delete (expected as Partial<typeof input>).website;
    expect(String(url)).toBe(endpoint);
    expect(JSON.parse(String(init?.body))).toEqual(expected);
    const headers = new Headers(init?.headers);
    expect(headers.get('authorization')).toBe('Bearer ' + token);
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.has('cookie')).toBe(false);
    expect(headers.has('user-agent')).toBe(false);
    expect(init?.method).toBe('POST');
    expect(init?.redirect).toBe('error');
    expect(init?.cache).toBe('no-store');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true });
    expect(result.headers.get('cache-control')).toBe('no-store');
  });

  it.each([undefined, ''])(
    'omits Authorization for an unset/empty token (%s)',
    async (value) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 204 }));
      // Pass configuration directly: a default parameter would replace undefined.
      const handler = createLeadHandler({
        service: createLeadService(
          { LEAD_WEBHOOK_URL: endpoint, LEAD_WEBHOOK_TOKEN: value },
          fetcher,
        ),
        limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
        env: {},
      });
      expect((await handler(request())).status).toBe(200);
      expect(
        new Headers(fetcher.mock.calls[0][1]?.headers).has('authorization'),
      ).toBe(false);
    },
  );

  it.each([200, 201, 202, 204, 299])(
    'treats receiver %i as an HTTP acknowledgement, without claiming persistence',
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status }));
      const result = await boundary(fetcher)(request());
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({ ok: true });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it.each([300, 301, 302, 303, 307, 308, 400, 401, 403, 409, 429, 500, 503])(
    'returns generic 503 for receiver %i, without an automatic retry',
    async (status) => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
        new Response('private receiver response', {
          status,
          headers: { location: 'https://redirect.example.invalid/' },
        }),
      );
      const result = await boundary(fetcher)(request());
      expect(result.status).toBe(503);
      expect(await result.json()).toEqual({ ok: false, code: 'unavailable' });
      expect(result.headers.get('cache-control')).toBe('no-store');
      expect(fetcher.mock.calls[0][1]?.redirect).toBe('error');
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it('does not log synthetic payload, token, receiver URL or thrown internals', async () => {
    const logs = (
      ['debug', 'info', 'log', 'warn', 'error', 'trace'] as const
    ).map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
    try {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockRejectedValue(
          Error(
            JSON.stringify({ input, endpoint, token, stack: 'private stack' }),
          ),
        );
      const result = await boundary(fetcher)(request());
      expect(result.status).toBe(503);
      expect(await result.text()).toBe('{"ok":false,"code":"unavailable"}');
      expect(fetcher).toHaveBeenCalledTimes(1);
      for (const log of logs) expect(log).not.toHaveBeenCalled();
    } finally {
      for (const log of logs) log.mockRestore();
    }
  });

  it('exposes the current duplicate risk after a persisted lead loses its acknowledgement', async () => {
    const records: unknown[] = [];
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        records.push(JSON.parse(String(init?.body)));
        if (records.length === 1)
          throw Error('Synthetic lost acknowledgement after persistence');
        return new Response(null, { status: 204 });
      });
    const handler = boundary(fetcher);
    expect((await handler(request())).status).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
    // A separate user-driven retry can insert the identical lead again.
    expect((await handler(request())).status).toBe(200);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual(records[1]);
    for (const [, init] of fetcher.mock.calls)
      expect(new Headers(init?.headers).has('idempotency-key')).toBe(false);
    expect(records[0]).toHaveProperty(
      'submissionId',
      '71da1176-f50a-4c21-9281-47d3bc9bdbe4',
    );
    expect(records[0]).not.toHaveProperty('submission_id');
  });

  it.each([
    { ip: '192.0.2.1' },
    { userAgent: 'synthetic-browser' },
    { cookies: 'synthetic-cookie' },
    { consentId: 'synthetic-consent' },
    { submissionId: 'synthetic-unapproved-id' },
  ])(
    'rejects unapproved metadata or invalid submission identity before delivery (%j)',
    async (extra) => {
      const fetcher = vi.fn<typeof fetch>();
      const result = await boundary(fetcher)(request({ ...input, ...extra }));
      expect(result.status).toBe(400);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it('rejects Fetch Metadata cross-site even without an Origin header', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await boundary(fetcher)(
      request(input, { 'sec-fetch-site': 'cross-site' }),
    );
    expect(result.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects declared oversize and malformed UTF-8 before delivery', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const handler = boundary(fetcher);
    expect(
      (await handler(request(input, { 'content-length': '16385' }))).status,
    ).toBe(413);
    const invalidUtf8 = new Request('https://example.invalid/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new Uint8Array([0xff]),
    });
    expect((await handler(invalidUtf8)).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('shows independent process buckets and reset-on-new-instance behavior', () => {
    const first = createRateLimiter({ limit: 1, windowMs: 600000 });
    const second = createRateLimiter({ limit: 1, windowMs: 600000 });
    expect(first.check('synthetic-client', 100).allowed).toBe(true);
    expect(first.check('synthetic-client', 101).allowed).toBe(false);
    expect(second.check('synthetic-client', 101).allowed).toBe(true);
    const restarted = createRateLimiter({ limit: 1, windowMs: 600000 });
    expect(restarted.check('synthetic-client', 102).allowed).toBe(true);
  });
});
