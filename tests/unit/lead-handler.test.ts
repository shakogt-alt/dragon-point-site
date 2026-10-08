import { describe, expect, it, vi } from 'vitest';
import { createLeadHandler } from '../../src/lib/leads/handler';
import { createLeadService } from '../../src/lib/leads/service';
import { createRateLimiter } from '../../src/lib/leads/rate-limit';

const valid = {
  intent: 'buy',
  name: 'Test Person',
  phone: '+972 50 123 4567',
  email: '',
  budget: '',
  message: '',
  preferredLanguage: 'he',
  website: '',
  locale: 'en',
  source: 'dragon-point-landing',
  landingUrl: 'https://example.test/en',
} as const;
const request = (
  value: unknown = valid,
  headers: Record<string, string> = {},
) =>
  new Request('https://example.test/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(value),
  });
function setup(delivered = true) {
  const received: unknown[] = [];
  const handler = createLeadHandler({
    service: {
      submit: async (payload) => {
        received.push(payload);
        return { delivered };
      },
    },
    limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
    env: {},
  });
  return { handler, received };
}

describe('server lead boundary', () => {
  it('validates and normalizes before delivering; omits honeypot and empty optionals', async () => {
    const { handler, received } = setup();
    const result = await handler(request());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true });
    expect(received).toEqual([
      {
        intent: 'buy',
        name: 'Test Person',
        phone: '+972501234567',
        preferredLanguage: 'he',
        locale: 'en',
        source: 'dragon-point-landing',
        landingUrl: 'https://example.test/en',
      },
    ]);
    expect(result.headers.get('cache-control')).toBe('no-store');
  });
  it.each([
    { phone: 'invalid' },
    { name: '' },
    { locale: 'fr' },
    { source: 'fake' },
    { intent: 'rent' },
    { website: 'bot.example' },
    { email: 'bad@' },
  ])(
    'rejects client validation bypass %j before calling the adapter',
    async (bad) => {
      const { handler, received } = setup();
      const result = await handler(request({ ...valid, ...bad }));
      expect(result.status).toBe(400);
      expect(await result.json()).toEqual({ ok: false, code: 'invalid' });
      expect(received).toEqual([]);
    },
  );
  it('rejects cross-origin JSON, bad MIME, malformed JSON and oversized streaming bodies', async () => {
    const { handler, received } = setup();
    expect(
      (await handler(request(valid, { origin: 'https://attacker.test' })))
        .status,
    ).toBe(403);
    expect(
      (await handler(request(valid, { 'content-type': 'text/plain' }))).status,
    ).toBe(415);
    expect(
      (
        await handler(
          new Request('https://example.test/api/leads', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{bad',
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await handler(request({ ...valid, message: 'x'.repeat(17000) }))).status,
    ).toBe(413);
    expect(received).toEqual([]);
  });
  it('does not return success when the adapter is unconfigured or throws', async () => {
    const { handler } = setup(false);
    expect((await handler(request())).status).toBe(503);
    const throwing = createLeadHandler({
      service: {
        submit: async () => {
          throw Error('SECRET backend details');
        },
      },
      limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
      env: {},
    });
    const result = await throwing(request());
    expect(await result.json()).toEqual({ ok: false, code: 'unavailable' });
  });
  it('rejects excess attempts with Retry-After, without delivering them', async () => {
    const handler = createLeadHandler({
      service: { submit: async () => ({ delivered: true }) },
      limiter: createRateLimiter({ limit: 1, windowMs: 60000 }),
      env: {},
    });
    expect((await handler(request())).status).toBe(200);
    const second = await handler(request());
    expect(second.status).toBe(429);
    expect(Number(second.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});

describe('bounded rate limiting', () => {
  it('uses separate trusted Vercel client buckets but ignores spoofed headers elsewhere', async () => {
    const options = {
      service: { submit: async () => ({ delivered: true }) },
      limiter: createRateLimiter({ limit: 1, windowMs: 60000 }),
      env: { VERCEL: '1' },
    };
    const onVercel = createLeadHandler(options);
    expect(
      (
        await onVercel(
          request(valid, { 'x-vercel-forwarded-for': '192.0.2.1' }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await onVercel(
          request(valid, { 'x-vercel-forwarded-for': '192.0.2.2' }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await onVercel(
          request(valid, { 'x-vercel-forwarded-for': '192.0.2.1' }),
        )
      ).status,
    ).toBe(429);
    const generic = createLeadHandler({
      ...options,
      limiter: createRateLimiter({ limit: 1, windowMs: 60000 }),
      env: {},
    });
    expect(
      (await generic(request(valid, { 'x-vercel-forwarded-for': '192.0.2.1' })))
        .status,
    ).toBe(200);
    expect(
      (await generic(request(valid, { 'x-vercel-forwarded-for': '192.0.2.2' })))
        .status,
    ).toBe(429);
  });
  it('resets expired windows while retaining active keys at the capacity boundary', () => {
    const limit = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    expect(limit.check('one', 0).allowed).toBe(true);
    expect(limit.check('two', 0).allowed).toBe(true);
    expect(limit.check('three', 1).allowed).toBe(false);
    expect(limit.check('one', 1).allowed).toBe(false);
    expect(limit.check('one', 1001).allowed).toBe(true);
    expect(limit.check('three', 1001).allowed).toBe(true);
  });
});

describe('webhook delivery', () => {
  it('aborts a stalled receiver at the real deadline and fails without logging', async () => {
    const deadline = vi.spyOn(AbortSignal, 'timeout');
    const log = vi.spyOn(console, 'error');
    let deliverySignal: AbortSignal | undefined;
    try {
      const service = createLeadService(
        { LEAD_WEBHOOK_URL: 'https://receiver.test/lead' },
        (async (_url, init) => {
          deliverySignal = init?.signal ?? undefined;
          return new Promise<Response>((_resolve, reject) => {
            if (!deliverySignal) {
              reject(new Error('Missing deadline'));
              return;
            }
            const signal = deliverySignal;
            if (signal.aborted) reject(signal.reason);
            else
              signal.addEventListener('abort', () => reject(signal.reason), {
                once: true,
              });
          });
        }) as typeof fetch,
      );
      expect(await service.submit(valid)).toEqual({ delivered: false });
      expect(deadline).toHaveBeenCalledWith(8000);
      expect(deliverySignal?.aborted).toBe(true);
      expect(deliverySignal?.reason.name).toBe('TimeoutError');
      expect(log).not.toHaveBeenCalled();
    } finally {
      deadline.mockRestore();
      log.mockRestore();
    }
  }, 15000);
  it('fails closed for missing, insecure or credential-bearing URLs', async () => {
    for (const url of [
      '',
      'http://example.test/lead',
      'https://secret@example.test/lead',
    ])
      expect(
        await createLeadService({ LEAD_WEBHOOK_URL: url }).submit(valid),
      ).toEqual({ delivered: false });
  });
  it('accepts only confirmed 2xx delivery and uses auth/no-redirect/timeout without logging', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(null, { status: 204 });
    };
    const service = createLeadService(
      {
        LEAD_WEBHOOK_URL: 'https://receiver.test/lead',
        LEAD_WEBHOOK_TOKEN: 'fixture-token',
      },
      fetcher as typeof fetch,
    );
    expect(await service.submit(valid)).toEqual({ delivered: true });
    expect(calls[0].url).toBe('https://receiver.test/lead');
    expect(calls[0].init?.redirect).toBe('error');
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe(
      'Bearer fixture-token',
    );
    expect(JSON.parse(String(calls[0].init?.body)).phone).toBe(
      '+972 50 123 4567',
    );
    expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal);
    const log = vi.spyOn(console, 'error');
    const failing = createLeadService(
      { LEAD_WEBHOOK_URL: 'https://receiver.test/lead' },
      (async () => {
        throw Error('private payload');
      }) as typeof fetch,
    );
    expect(await failing.submit(valid)).toEqual({ delivered: false });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
    expect(
      await createLeadService(
        { LEAD_WEBHOOK_URL: 'https://receiver.test/lead' },
        (async () => new Response(null, { status: 500 })) as typeof fetch,
      ).submit(valid),
    ).toEqual({ delivered: false });
  });
});
