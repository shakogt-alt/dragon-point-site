import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { describe, expect, it, vi } from 'vitest';
import { createNeonLeadInboxRepository } from '../../src/lib/leads/neon-inbox-repository';
import { createLeadInboxReceiver } from '../../src/lib/leads/inbox-receiver';
import { createLeadHandler } from '../../src/lib/leads/handler';
import { createLeadService } from '../../src/lib/leads/service';
import { createRateLimiter } from '../../src/lib/leads/rate-limit';

const runtimeUrl = process.env.NEON_PREVIEW_RUNTIME_URL;
const adminUrl = process.env.NEON_PREVIEW_ADMIN_URL;
const host = 'ep-steep-sun-b94tcc0v.c-7.eu-central-1.aws.neon.tech';
function target(value: string | undefined) {
  try {
    const url = new URL(value ?? '');
    return url.hostname === host && url.pathname === '/neondb';
  } catch {
    return false;
  }
}
if (
  process.env.RUN_NEON_PREVIEW_INTEGRATION !== '1' ||
  process.env.NEON_PREVIEW_BRANCH_ID !== 'br-nameless-cloud-b9td5f7g' ||
  !target(runtimeUrl) ||
  !target(adminUrl) ||
  new URL(runtimeUrl!).username !== 'dp_leads_app_preview'
)
  throw Error('Explicit approved Preview integration scope is required');

const repository = createNeonLeadInboxRepository(runtimeUrl!);
const admin = () => neon(adminUrl!);
const runtime = neon(runtimeUrl!);
const token = 'synthetic-integration-token';
const fixture = (submissionId = randomUUID()) => ({
  submissionId,
  intent: 'buy' as const,
  name: 'Test Person',
  phone: '+995555000000',
  email: 'test@example.invalid',
  message: 'Synthetic Dragon Point receiver verification',
  preferredLanguage: 'en' as const,
  locale: 'he' as const,
  source: 'dragon-point-landing' as const,
});
const request = (payload: unknown, auth = 'Bearer ' + token) =>
  new Request('https://example.invalid/api/internal/leads/receiver', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: auth },
    body: JSON.stringify(payload),
  });
const receiver = createLeadInboxReceiver({ token, repository });
const rows = (id: string) =>
  admin().query('SELECT * FROM public.lead_inbox WHERE submission_id = $1', [
    id,
  ]);
// Never render driver errors (which can contain SQL/configuration) in test output.
async function safe(run: () => Promise<void>) {
  try {
    await run();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error)
      throw Error('Preview SQL verification failed');
    throw error;
  }
}
describe('explicit synthetic-only real Preview database', () => {
  it('verifies the schema, constraints, nullable attribution and indexes', () =>
    safe(async () => {
      const columns = await admin().query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='lead_inbox'",
      );
      expect(columns).toHaveLength(23);
      expect(
        columns.find((c) => c.column_name === 'submission_id'),
      ).toMatchObject({ data_type: 'uuid', is_nullable: 'NO' });
      for (const name of [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'gclid',
        'fbclid',
        'referrer',
        'landing_url',
        'forwarded_at',
      ])
        expect(columns.find((c) => c.column_name === name)?.is_nullable).toBe(
          'YES',
        );
      const constraints = await admin().query(
        "SELECT contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.lead_inbox'::regclass",
      );
      expect(
        constraints.some(
          (c) => c.contype === 'u' && c.definition === 'UNIQUE (submission_id)',
        ),
      ).toBe(true);
      expect(constraints.filter((c) => c.contype === 'c')).toHaveLength(7);
      const indexes = await admin().query(
        "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='lead_inbox'",
      );
      expect(indexes.map((i) => i.indexname)).toContain(
        'lead_inbox_created_at_idx',
      );
      expect(indexes.map((i) => i.indexname)).toContain(
        'lead_inbox_forwarding_pending_idx',
      );
    }));
  it('verifies runtime grants exclude PII reads, updates, deletes and DDL', () =>
    safe(async () => {
      const [row] = await runtime.query(
        "SELECT current_user AS role, has_column_privilege(current_user,'public.lead_inbox','submission_id','SELECT') AS confirm, has_column_privilege(current_user,'public.lead_inbox','name','SELECT') AS pii, has_table_privilege(current_user,'public.lead_inbox','UPDATE') AS update, has_table_privilege(current_user,'public.lead_inbox','DELETE') AS delete, has_schema_privilege(current_user,'public','CREATE') AS ddl, has_database_privilege(current_user,current_database(),'TEMP') AS temp",
      );
      expect(row).toEqual({
        role: 'dp_leads_app_preview',
        confirm: true,
        pii: false,
        update: false,
        delete: false,
        ddl: false,
        temp: false,
      });
      const [role] = await admin().query(
        "SELECT rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname='dp_leads_app_preview'",
      );
      expect(Object.values(role).every((v) => v === false)).toBe(true);
    }));
  it('persists through API → HTTPS adapter → receiver before success; independent read confirms row', () =>
    safe(async () => {
      const payload = fixture();
      const service = createLeadService(
        {
          LEAD_WEBHOOK_URL:
            'https://receiver.example.invalid/api/internal/leads/receiver',
          LEAD_WEBHOOK_TOKEN: token,
        },
        async (input, init) => receiver(new Request(String(input), init)),
      );
      const handler = createLeadHandler({
        service,
        limiter: createRateLimiter({ limit: 20, windowMs: 60000 }),
        env: {},
      });
      expect((await handler(request(payload))).status).toBe(200);
      const stored = await rows(payload.submissionId);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        message: payload.message,
        forwarding_status: 'pending',
        forwarded_at: null,
        utm_source: null,
      });
    }));
  it('acknowledges two requests for one UUID and retains the first values', () =>
    safe(async () => {
      const payload = fixture();
      expect((await receiver(request(payload))).status).toBe(201);
      expect(
        (
          await receiver(
            request({ ...payload, message: payload.message + ' retry' }),
          )
        ).status,
      ).toBe(200);
      const stored = await rows(payload.submissionId);
      expect(stored).toHaveLength(1);
      expect(stored[0].message).toBe(payload.message);
    }));
  it('deduplicates concurrent inserts in separate HTTP transactions', () =>
    safe(async () => {
      const payload = fixture();
      const responses = await Promise.all([
        receiver(request(payload)),
        receiver(request(payload)),
        receiver(request(payload)),
        receiver(request(payload)),
      ]);
      expect(responses.map((r) => r.status).sort()).toEqual([
        200, 200, 200, 201,
      ]);
      expect(await rows(payload.submissionId)).toHaveLength(1);
    }));
  it('treats uppercase and lowercase UUID as one key', () =>
    safe(async () => {
      const payload = fixture();
      expect(
        (
          await receiver(
            request({
              ...payload,
              submissionId: payload.submissionId.toUpperCase(),
            }),
          )
        ).status,
      ).toBe(201);
      expect((await receiver(request(payload))).status).toBe(200);
      expect(await rows(payload.submissionId)).toHaveLength(1);
    }));
  it('creates a second row for a different UUID with the same contact', () =>
    safe(async () => {
      const a = fixture(),
        b = fixture();
      expect((await receiver(request(a))).status).toBe(201);
      expect((await receiver(request(b))).status).toBe(201);
      expect(await rows(a.submissionId)).toHaveLength(1);
      expect(await rows(b.submissionId)).toHaveLength(1);
    }));
  it('recovers an acknowledgement lost after commit by retrying the same UUID', () =>
    safe(async () => {
      const payload = fixture();
      let lose = true;
      const losing = createLeadInboxReceiver({
        token,
        repository: {
          persist: async (p) => {
            const result = await repository.persist(p);
            if (lose) {
              lose = false;
              throw Error('synthetic lost acknowledgement');
            }
            return result;
          },
        },
      });
      expect((await losing(request(payload))).status).toBe(503);
      expect(await rows(payload.submissionId)).toHaveLength(1);
      expect((await losing(request(payload))).status).toBe(200);
      expect(await rows(payload.submissionId)).toHaveLength(1);
    }));
  it('rejects missing/wrong bearer without inserting', () =>
    safe(async () => {
      const payload = fixture();
      expect((await receiver(request(payload, ''))).status).toBe(401);
      expect((await receiver(request(payload, 'Bearer wrong'))).status).toBe(
        401,
      );
      expect(await rows(payload.submissionId)).toHaveLength(0);
    }));
  it('returns non-2xx after a real transaction rollback with no stored row or PII logging', () =>
    safe(async () => {
      const payload = fixture();
      const logs = (
        ['log', 'warn', 'error', 'info', 'debug', 'trace'] as const
      ).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
      try {
        const failing = createLeadInboxReceiver({
          token,
          repository: {
            persist: async (p) => {
              await runtime.transaction([
                runtime.query(
                  'INSERT INTO public.lead_inbox (submission_id,intent,name,phone,preferred_language,locale,source) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                  [
                    p.submissionId,
                    p.intent,
                    p.name,
                    p.phone,
                    p.preferredLanguage,
                    p.locale,
                    p.source,
                  ],
                ),
                runtime.query('SELECT 1/0'),
              ]);
              return 'inserted';
            },
          },
        });
        expect((await failing(request(payload))).status).toBe(503);
        expect(await rows(payload.submissionId)).toHaveLength(0);
        for (const log of logs) expect(log).not.toHaveBeenCalled();
      } finally {
        for (const log of logs) log.mockRestore();
      }
    }));
  it('fails closed on invalid credentials', () =>
    safe(async () => {
      const payload = fixture();
      const invalid = new URL(runtimeUrl!);
      invalid.password = 'synthetic-invalid-credential';
      const failing = createLeadInboxReceiver({
        token,
        repository: createNeonLeadInboxRepository(invalid.href),
      });
      expect((await failing(request(payload))).status).toBe(503);
      expect(await rows(payload.submissionId)).toHaveLength(0);
    }));
  it('preserves literal SQL-like input and confirms only synthetic records exist', () =>
    safe(async () => {
      const payload = {
        ...fixture(),
        message:
          "Synthetic Dragon Point receiver verification'; DROP TABLE lead_inbox;--",
      };
      expect((await receiver(request(payload))).status).toBe(201);
      expect((await rows(payload.submissionId))[0].message).toBe(
        payload.message,
      );
      const [result] = await admin().query(
        "SELECT count(*) FILTER (WHERE phone <> '+995555000000' OR email IS DISTINCT FROM 'test@example.invalid' OR message NOT LIKE 'Synthetic Dragon Point receiver verification%')::int AS unexpected FROM public.lead_inbox",
      );
      expect(result.unexpected).toBe(0);
    }));
  it('agrees with PostgreSQL Unicode character lengths after normalization', () =>
    safe(async () => {
      for (const name of [
        '😀😀',
        '😀'.repeat(120),
        'e\u0301'.repeat(120),
        'אב',
        'აბ',
        'Ив',
      ]) {
        const payload = { ...fixture(), name };
        expect((await receiver(request(payload))).status).toBe(201);
        const stored = await rows(payload.submissionId);
        expect(stored[0].name).toBe(name.normalize('NFC'));
      }
      expect(
        (await receiver(request({ ...fixture(), name: '😀' }))).status,
      ).toBe(400);
      expect(
        (await receiver(request({ ...fixture(), name: 'e\u0301' }))).status,
      ).toBe(400);
    }));
});
