import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { leadRequestSchema } from '../validation/lead';
import { buildLeadPayload } from './payload';
import type { LeadService, LeadEnvironment } from './service';
import type { LeadRateLimiter } from './rate-limit';

const maxBytes = 16 * 1024;
const reply = (
  status: number,
  code?: string,
  headers?: Record<string, string>,
) =>
  Response.json(code ? { ok: false, code } : { ok: true }, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      ...headers,
    },
  });

export function createLeadHandler({
  service,
  limiter,
  env,
}: {
  service: LeadService;
  limiter: LeadRateLimiter;
  env: LeadEnvironment;
}) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    if (
      (origin && origin !== new URL(request.url).origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return reply(403, 'invalid');
    const trustedIp =
      env.VERCEL === '1'
        ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
        : undefined;
    const key =
      trustedIp && isIP(trustedIp)
        ? createHash('sha256').update(trustedIp).digest('hex')
        : 'shared';
    const rate = limiter.check(key);
    if (!rate.allowed)
      return reply(429, 'rate_limited', {
        'retry-after': String(rate.retryAfter),
      });
    if (
      request.headers.get('content-type')?.split(';')[0].trim() !==
      'application/json'
    )
      return reply(415, 'invalid');
    if (Number(request.headers.get('content-length')) > maxBytes)
      return reply(413, 'invalid');
    let body: unknown;
    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400, 'invalid');
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > maxBytes) {
          await reader.cancel();
          return reply(413, 'invalid');
        }
        chunks.push(part.value);
      }
      const combined = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      body = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(combined),
      );
    } catch {
      return reply(400, 'invalid');
    }
    // Optional client fields may be omitted; the server applies the same defaults.
    const input =
      body && typeof body === 'object' && !Array.isArray(body)
        ? { email: '', budget: '', message: '', website: '', ...body }
        : body;
    const parsed = leadRequestSchema.safeParse(input);
    if (!parsed.success || parsed.data.website) return reply(400, 'invalid');
    try {
      const result = await service.submit(
        buildLeadPayload(parsed.data, parsed.data.locale, parsed.data),
      );
      return result.delivered ? reply(200) : reply(503, 'unavailable');
    } catch {
      return reply(503, 'unavailable');
    }
  };
}
