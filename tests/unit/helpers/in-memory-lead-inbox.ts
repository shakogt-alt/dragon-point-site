import type { LeadPayload } from '../../../src/lib/leads/payload';
import type { LeadInboxRepository } from '../../../src/lib/leads/inbox-receiver';

// Test double only: process memory is never production durability.
export class InMemoryLeadInbox implements LeadInboxRepository {
  readonly rows = new Map<string, LeadPayload>();
  constructor(
    private readonly beforeCommit: () => Promise<void> = async () => {},
  ) {}
  async persist(payload: LeadPayload): Promise<'inserted' | 'duplicate'> {
    await this.beforeCommit();
    const key = payload.submissionId.toLowerCase();
    if (this.rows.has(key)) return 'duplicate';
    this.rows.set(key, structuredClone({ ...payload, submissionId: key }));
    return 'inserted';
  }
}
