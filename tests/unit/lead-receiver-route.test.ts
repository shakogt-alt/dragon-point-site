import { afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ factory: vi.fn(), persist: vi.fn() }));
vi.mock('../../src/lib/leads/neon-inbox-repository', () => ({
  createNeonLeadInboxRepository: mock.factory.mockImplementation(() => ({
    persist: mock.persist,
  })),
}));
import * as route from '../../src/app/api/internal/leads/receiver/route';
const payload = {
  submissionId: '71da1176-f50a-4c21-9281-47d3bc9bdbe4',
  intent: 'buy',
  name: 'Test Person',
  phone: '+995555000000',
  preferredLanguage: 'en',
  locale: 'en',
  source: 'dragon-point-landing',
};
const req = (headers: Record<string, string> = {}, method = 'POST') =>
  new Request('https://example.invalid/api/internal/leads/receiver', {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer synthetic-token',
      ...headers,
    },
    ...(method === 'POST' ? { body: JSON.stringify(payload) } : {}),
  });
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('internal receiver route', () => {
  it('checks auth before creating a database client', async () => {
    vi.stubEnv('LEAD_WEBHOOK_TOKEN', 'synthetic-token');
    vi.stubEnv('LEAD_INBOX_DATABASE_URL', 'postgresql://synthetic.invalid/db');
    expect(
      (await route.POST(req({ authorization: 'Bearer wrong' }))).status,
    ).toBe(401);
    expect(mock.factory).not.toHaveBeenCalled();
  });
  it('fails closed with missing config and never constructs the client', async () => {
    vi.stubEnv('LEAD_WEBHOOK_TOKEN', 'synthetic-token');
    vi.stubEnv('LEAD_INBOX_DATABASE_URL', '');
    expect((await route.POST(req())).status).toBe(503);
    expect(mock.factory).not.toHaveBeenCalled();
  });
  it('rejects browser-origin requests without persistence or CORS', async () => {
    vi.stubEnv('LEAD_WEBHOOK_TOKEN', 'synthetic-token');
    vi.stubEnv('LEAD_INBOX_DATABASE_URL', 'postgresql://synthetic.invalid/db');
    const response = await route.POST(
      req({ origin: 'https://example.invalid' }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.has('access-control-allow-origin')).toBe(false);
    expect(mock.factory).not.toHaveBeenCalled();
  });
  it.each(['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'] as const)(
    'rejects %s with private no-store response',
    async (method) => {
      const response = await route[method](req({}, method));
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(mock.factory).not.toHaveBeenCalled();
    },
  );
  it('returns success only after persistence and a generic error on database failure', async () => {
    vi.stubEnv('LEAD_WEBHOOK_TOKEN', 'synthetic-token');
    vi.stubEnv('LEAD_INBOX_DATABASE_URL', 'postgresql://synthetic.invalid/db');
    mock.persist
      .mockResolvedValueOnce('inserted')
      .mockRejectedValueOnce(Error('private'));
    expect((await route.POST(req())).status).toBe(201);
    const failed = await route.POST(req());
    expect(failed.status).toBe(503);
    expect(await failed.json()).toEqual({ ok: false, code: 'unavailable' });
  });
});
