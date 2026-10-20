import { neon } from '@neondatabase/serverless';
import type { LeadInboxRepository } from './inbox-receiver';

const insertSql = `
  INSERT INTO public.lead_inbox (
    submission_id, intent, name, phone, email, budget, message,
    preferred_language, locale, source, utm_source, utm_medium, utm_campaign,
    utm_content, utm_term, gclid, fbclid, referrer, landing_url
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19)
  ON CONFLICT (submission_id) DO NOTHING
  RETURNING id
`;

// Imported only by the Node receiver. No connection or query at module import.
export function createNeonLeadInboxRepository(
  databaseUrl: string,
): LeadInboxRepository {
  const sql = neon(databaseUrl);
  return {
    async persist(payload) {
      // Read Committed gives the SELECT a new snapshot after a concurrent INSERT
      // has won the unique-key conflict. Neither a duplicate nor a retry updates it.
      const [, , inserted, existing] = await sql.transaction(
        [
          sql.query("SET LOCAL statement_timeout = '4000ms'"),
          sql.query("SET LOCAL lock_timeout = '1000ms'"),
          sql.query(insertSql, [
            payload.submissionId,
            payload.intent,
            payload.name,
            payload.phone,
            payload.email ?? null,
            payload.budget ?? null,
            payload.message ?? null,
            payload.preferredLanguage,
            payload.locale,
            payload.source,
            payload.utm_source ?? null,
            payload.utm_medium ?? null,
            payload.utm_campaign ?? null,
            payload.utm_content ?? null,
            payload.utm_term ?? null,
            payload.gclid ?? null,
            payload.fbclid ?? null,
            payload.referrer ?? null,
            payload.landingUrl ?? null,
          ]),
          sql.query(
            'SELECT id FROM public.lead_inbox WHERE submission_id = $1',
            [payload.submissionId],
          ),
        ],
        {
          isolationLevel: 'ReadCommitted',
          readOnly: false,
          fetchOptions: {
            cache: 'no-store',
            signal: AbortSignal.timeout(6000),
          },
        },
      );
      // The HTTP transaction promise acknowledges COMMIT, not merely INSERT.
      // A lost acknowledgement throws; the caller must retry the same UUID.
      if (
        existing.length !== 1 ||
        !existing[0].id ||
        inserted.length > 1 ||
        (inserted.length === 1 && inserted[0].id !== existing[0].id)
      )
        throw Error('Inbox persistence not confirmed');
      return inserted.length === 1 ? 'inserted' : 'duplicate';
    },
  };
}
