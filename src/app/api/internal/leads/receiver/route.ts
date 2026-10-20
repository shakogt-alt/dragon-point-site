import { createLeadInboxReceiver } from '@/lib/leads/inbox-receiver';
import { createNeonLeadInboxRepository } from '@/lib/leads/neon-inbox-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function receive(request: Request): Promise<Response> {
  const databaseUrl = process.env.LEAD_INBOX_DATABASE_URL;
  return createLeadInboxReceiver({
    token: databaseUrl ? process.env.LEAD_WEBHOOK_TOKEN : undefined,
    repository: {
      // Construction and all DB access occur after auth, body and schema checks.
      persist: (payload) => {
        if (!databaseUrl) throw Error('Inbox unavailable');
        return createNeonLeadInboxRepository(databaseUrl).persist(payload);
      },
    },
  })(request);
}
export const POST = receive;
export const GET = receive;
export const HEAD = receive;
export const OPTIONS = receive;
export const PUT = receive;
export const PATCH = receive;
export const DELETE = receive;
