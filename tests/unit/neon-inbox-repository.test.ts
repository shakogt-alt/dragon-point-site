import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNeonLeadInboxRepository } from '../../src/lib/leads/neon-inbox-repository';

const mock = vi.hoisted(() => ({
  query: vi.fn((text: string, values?: unknown[]) => ({ text, values })),
  transaction: vi.fn(),
  factory: vi.fn(),
}));
vi.mock('@neondatabase/serverless', () => ({
  neon: mock.factory.mockImplementation(() => ({
    query: mock.query,
    transaction: mock.transaction,
  })),
}));
const payload = {
  submissionId: '71da1176-f50a-4c21-9281-47d3bc9bdbe4',
  intent: 'buy' as const,
  name: 'Test Person',
  phone: '+995555000000',
  preferredLanguage: 'en' as const,
  locale: 'he' as const,
  source: 'dragon-point-landing' as const,
  message:
    "Synthetic Dragon Point receiver verification'; DROP TABLE lead_inbox;--",
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe('Neon commit boundary', () => {
  it('binds all values and confirms the row inside one Read Committed transaction', async () => {
    mock.transaction.mockResolvedValue([[], [], [{ id: '1' }], [{ id: '1' }]]);
    expect(
      await createNeonLeadInboxRepository(
        'postgresql://synthetic.invalid/db',
      ).persist(payload),
    ).toBe('inserted');
    expect(mock.transaction).toHaveBeenCalledTimes(1);
    const [queries, options] = mock.transaction.mock.calls[0];
    expect(queries).toHaveLength(4);
    expect(queries[2].text).toContain('ON CONFLICT (submission_id) DO NOTHING');
    expect(queries[2].text).not.toContain(payload.message);
    expect(queries[2].values).toEqual([
      payload.submissionId,
      'buy',
      'Test Person',
      '+995555000000',
      null,
      null,
      payload.message,
      'en',
      'he',
      'dragon-point-landing',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(queries[3].values).toEqual([payload.submissionId]);
    expect(options).toMatchObject({
      isolationLevel: 'ReadCommitted',
      readOnly: false,
      fetchOptions: { cache: 'no-store' },
    });
    expect(options.fetchOptions.signal).toBeInstanceOf(AbortSignal);
  });
  it('confirms a duplicate without overwriting it', async () => {
    mock.transaction.mockResolvedValue([[], [], [], [{ id: '1' }]]);
    expect(
      await createNeonLeadInboxRepository(
        'postgresql://synthetic.invalid/db',
      ).persist(payload),
    ).toBe('duplicate');
    expect(
      mock.query.mock.calls.every(([sql]) => !/UPDATE|DELETE/i.test(sql)),
    ).toBe(true);
  });
  it('does not resolve until the full transaction acknowledgement arrives', async () => {
    let release!: (value: unknown) => void;
    mock.transaction.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    let settled = false;
    const pending = createNeonLeadInboxRepository(
      'postgresql://synthetic.invalid/db',
    )
      .persist(payload)
      .then((value) => {
        settled = true;
        return value;
      });
    await Promise.resolve();
    expect(settled).toBe(false);
    release([[], [], [{ id: '1' }], [{ id: '1' }]]);
    expect(await pending).toBe('inserted');
  });
  it('rejects absent confirmation even when INSERT claims success', async () => {
    mock.transaction.mockResolvedValue([[], [], [{ id: '1' }], []]);
    await expect(
      createNeonLeadInboxRepository(
        'postgresql://synthetic.invalid/db',
      ).persist(payload),
    ).rejects.toThrow();
  });
  it('propagates commit/transport errors and makes no automatic retry', async () => {
    mock.transaction.mockRejectedValue(Error('synthetic lost acknowledgement'));
    await expect(
      createNeonLeadInboxRepository(
        'postgresql://synthetic.invalid/db',
      ).persist(payload),
    ).rejects.toThrow();
    expect(mock.transaction).toHaveBeenCalledTimes(1);
  });
  it('uses a fresh timeout for each persistence call', async () => {
    mock.transaction.mockResolvedValue([[], [], [], [{ id: '1' }]]);
    const repository = createNeonLeadInboxRepository(
      'postgresql://synthetic.invalid/db',
    );
    await repository.persist(payload);
    await repository.persist(payload);
    expect(mock.transaction.mock.calls[0][1].fetchOptions.signal).not.toBe(
      mock.transaction.mock.calls[1][1].fetchOptions.signal,
    );
  });
});
