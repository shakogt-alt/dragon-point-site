import { createHash, timingSafeEqual } from 'node:crypto';
import { leadRequestSchema } from '../validation/lead';
import { buildLeadPayload, type LeadPayload } from './payload';

// A production implementation must atomically deduplicate submissionId and
// resolve only after the insert (or confirmed existing record) has committed.
// The test-only in-memory implementation is not durable storage.
export interface LeadInboxRepository {
  persist(payload: LeadPayload): Promise<'inserted' | 'duplicate'>;
}

const inboxSchema = leadRequestSchema.omit({ website: true });
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

// Shared authenticated receiver contract; the Node route supplies the repository.
export function createLeadInboxReceiver({
  token,
  repository,
}: {
  token?: string;
  repository: LeadInboxRepository;
}) {
  const expected = token?.trim()
    ? createHash('sha256')
        .update('Bearer ' + token)
        .digest()
    : undefined;
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST')
      return reply(405, 'invalid', { allow: 'POST' });
    if (!expected) return reply(503, 'unavailable');
    const supplied = createHash('sha256')
      .update(request.headers.get('authorization') ?? '')
      .digest();
    if (!timingSafeEqual(expected, supplied)) return reply(401, 'unauthorized');
    if (request.headers.has('origin')) return reply(403, 'unauthorized');
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
    const parsed = inboxSchema.safeParse(body);
    if (!parsed.success) return reply(400, 'invalid');
    const payload = buildLeadPayload(
      { ...parsed.data, website: '' },
      parsed.data.locale,
      parsed.data,
      parsed.data.submissionId.toLowerCase(),
    );
    try {
      // Await the repository's commit boundary. Never acknowledge a pending write.
      const result = await repository.persist(payload);
      if (result === 'inserted') return reply(201);
      if (result === 'duplicate') return reply(200);
      return reply(503, 'unavailable');
    } catch {
      return reply(503, 'unavailable');
    }
  };
}
