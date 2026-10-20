import { describe, expect, it, vi } from 'vitest';
import { createLeadInboxReceiver } from '../../src/lib/leads/inbox-receiver';
import { createLeadHandler } from '../../src/lib/leads/handler';
import { createLeadService } from '../../src/lib/leads/service';
import { createRateLimiter } from '../../src/lib/leads/rate-limit';
import { InMemoryLeadInbox } from './helpers/in-memory-lead-inbox';

const submissionId = '71da1176-f50a-4c21-9281-47d3bc9bdbe4';
const token = 'synthetic-receiver-token';
const payload = {
  submissionId,
  intent: 'buy' as const,
  name: 'Test Person',
  phone: '+995555000000',
  email: 'test@example.invalid',
  preferredLanguage: 'en' as const,
  locale: 'he' as const,
  source: 'dragon-point-landing' as const,
  utm_source: 'synthetic',
  landingUrl: 'https://example.invalid/he',
};
const request = (
  value: unknown = payload,
  auth: string | undefined = 'Bearer ' + token,
) =>
  new Request('https://receiver.example.invalid/leads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: auth } : {}),
    },
    body: JSON.stringify(value),
  });
const setup = (repository = new InMemoryLeadInbox()) => ({
  repository,
  receiver: createLeadInboxReceiver({ token, repository }),
});

describe('private durable inbox receiver contract (no hosted route or database)', () => {
  it('acknowledges a valid committed lead and returns no record/PII details', async () => {
    const { repository, receiver } = setup();
    const response = await receiver(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(repository.rows.get(submissionId)).toEqual(payload);
  });

  it('does not return 2xx before the repository commit promise resolves', async () => {
    let release!: () => void;
    let entered!: () => void;
    const enteredCommit = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const repository = new InMemoryLeadInbox(async () => {
      entered();
      await gate;
    });
    const { receiver } = setup(repository);
    let acknowledged = false;
    const pending = receiver(request()).then((response) => {
      acknowledged = true;
      return response;
    });
    await enteredCommit;
    expect(acknowledged).toBe(false);
    expect(repository.rows.size).toBe(0);
    release();
    expect((await pending).status).toBe(201);
    expect(repository.rows.size).toBe(1);
  });

  it('returns non-2xx on failed commit without logging payload, auth or database internals', async () => {
    const logs = (
      ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const
    ).map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
    try {
      const repository = new InMemoryLeadInbox(async () => {
        throw Error(
          JSON.stringify({
            token,
            payload,
            database: 'private database error',
          }),
        );
      });
      const response = await setup(repository).receiver(request());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ ok: false, code: 'unavailable' });
      expect(repository.rows.size).toBe(0);
      for (const log of logs) expect(log).not.toHaveBeenCalled();
    } finally {
      for (const log of logs) log.mockRestore();
    }
  });

  it('acknowledges sequential and concurrent duplicate UUIDs without creating another row', async () => {
    const { repository, receiver } = setup();
    const responses = await Promise.all([
      receiver(request()),
      receiver(request()),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
    expect((await receiver(request())).status).toBe(200);
    expect(repository.rows.size).toBe(1);
  });

  it('keeps the first committed record for a duplicate UUID with changed fields', async () => {
    const { repository, receiver } = setup();
    expect((await receiver(request())).status).toBe(201);
    expect(
      (
        await receiver(
          request({ ...payload, message: 'Different synthetic draft' }),
        )
      ).status,
    ).toBe(200);
    expect(repository.rows.get(submissionId)).toEqual(payload);
  });

  it('uses UUID identity rather than letter casing or contact data for deduplication', async () => {
    const { repository, receiver } = setup();
    await receiver(request());
    expect(
      (
        await receiver(
          request({ ...payload, submissionId: submissionId.toUpperCase() }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await receiver(
          request({
            ...payload,
            submissionId: 'fc316c0f-88fb-45b7-a5ba-ea947aa4b578',
          }),
        )
      ).status,
    ).toBe(201);
    expect(repository.rows.size).toBe(2);
  });

  it.each([undefined, 'Bearer invalid', 'Basic synthetic', 'Bearer'])(
    'rejects missing/wrong authentication before persistence (%s)',
    async (auth) => {
      const { repository, receiver } = setup();
      const invalid = new Request('https://receiver.example.invalid/leads', {
        method: 'POST',
        headers: { ...(auth ? { authorization: auth } : {}) },
        body: '{invalid',
      });
      expect((await receiver(invalid)).status).toBe(401);
      expect(repository.rows.size).toBe(0);
    },
  );

  it('fails closed when the receiver private token is not configured', async () => {
    const repository = new InMemoryLeadInbox();
    const receiver = createLeadInboxReceiver({ repository });
    expect((await receiver(request())).status).toBe(503);
    expect(repository.rows.size).toBe(0);
  });

  it.each([
    { submissionId: undefined },
    { submissionId: 'invalid' },
    { submissionId: null },
    { admin: true },
    { website: '' },
    { ip: '192.0.2.1' },
    { source: 'invalid' },
    { phone: 'invalid' },
    { message: 'x'.repeat(2001) },
  ])(
    'rejects invalid or overposted payload before persistence (%j)',
    async (change) => {
      const { repository, receiver } = setup();
      expect((await receiver(request({ ...payload, ...change }))).status).toBe(
        400,
      );
      expect(repository.rows.size).toBe(0);
    },
  );

  it('rejects unsupported methods, non-JSON, malformed JSON and oversized input', async () => {
    const { repository, receiver } = setup();
    const method = await receiver(
      new Request('https://receiver.example.invalid/leads'),
    );
    expect(method.status).toBe(405);
    expect(method.headers.get('allow')).toBe('POST');
    const headers = { authorization: 'Bearer ' + token };
    expect(
      (
        await receiver(
          new Request('https://receiver.example.invalid/leads', {
            method: 'POST',
            headers,
            body: 'text',
          }),
        )
      ).status,
    ).toBe(415);
    const json = { ...headers, 'content-type': 'application/json' };
    expect(
      (
        await receiver(
          new Request('https://receiver.example.invalid/leads', {
            method: 'POST',
            headers: json,
            body: '{invalid',
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await receiver(request({ ...payload, message: 'x'.repeat(17000) })))
        .status,
    ).toBe(413);
    expect(
      (await receiver(request(payload, 'Bearer ' + token))).headers.get(
        'cache-control',
      ),
    ).toBe('no-store');
    // The final valid request is the only one allowed to persist.
    expect(repository.rows.size).toBe(1);
  });

  it('rejects declared oversize and invalid UTF-8 without touching storage', async () => {
    const { repository, receiver } = setup();
    const headers = {
      authorization: 'Bearer ' + token,
      'content-type': 'application/json',
    };
    const oversized = new Request('https://receiver.example.invalid/leads', {
      method: 'POST',
      headers: { ...headers, 'content-length': '16385' },
      body: '{}',
    });
    expect((await receiver(oversized)).status).toBe(413);
    const invalidUtf8 = new Request('https://receiver.example.invalid/leads', {
      method: 'POST',
      headers,
      body: new Uint8Array([0xc3, 0x28]),
    });
    expect((await receiver(invalidUtf8)).status).toBe(400);
    expect(repository.rows.size).toBe(0);
  });

  it('bounds the total streamed bytes when Content-Length is absent', async () => {
    const { repository, receiver } = setup();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(10000).fill(0x20));
        controller.enqueue(new Uint8Array(10000).fill(0x20));
      },
      cancel() {
        cancelled = true;
      },
    });
    const streamed = new Request('https://receiver.example.invalid/leads', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
      body,
      duplex: 'half',
    } as RequestInit);
    expect(streamed.headers.has('content-length')).toBe(false);
    expect((await receiver(streamed)).status).toBe(413);
    expect(cancelled).toBe(true);
    expect(repository.rows.size).toBe(0);
  });

  it('survives a persisted lead losing its acknowledgement through the complete API/adapter/receiver path', async () => {
    const { repository, receiver } = setup();
    let attempts = 0;
    const fetcher: typeof fetch = async (url, init) => {
      attempts++;
      const response = await receiver(new Request(String(url), init));
      if (attempts === 1) throw Error('Synthetic lost acknowledgement');
      return response;
    };
    const handler = createLeadHandler({
      service: createLeadService(
        {
          LEAD_WEBHOOK_URL: 'https://receiver.example.invalid/leads',
          LEAD_WEBHOOK_TOKEN: token,
        },
        fetcher,
      ),
      limiter: createRateLimiter({ limit: 5, windowMs: 60000 }),
      env: {},
    });
    const apiRequest = () =>
      new Request('https://example.invalid/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    expect((await handler(apiRequest())).status).toBe(503);
    expect(attempts).toBe(1);
    expect(repository.rows.size).toBe(1);
    expect((await handler(apiRequest())).status).toBe(200);
    expect(attempts).toBe(2);
    expect(repository.rows.size).toBe(1);
  });
});
