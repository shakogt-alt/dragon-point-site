import { expect, test } from '@playwright/test';
const path = '/api/internal/leads/receiver';
test('unconfigured private receiver fails closed without browser CORS', async ({
  request,
}) => {
  const response = await request.post(path, {
    data: { submissionId: '71da1176-f50a-4c21-9281-47d3bc9bdbe4' },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ ok: false, code: 'unavailable' });
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['access-control-allow-origin']).toBeUndefined();
  expect(response.headers()['set-cookie']).toBeUndefined();
});
for (const method of ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'DELETE']) {
  test('private receiver rejects ' + method, async ({ request }) => {
    const response = await request.fetch(path, { method });
    expect(response.status()).toBe(405);
    expect(response.headers()['allow']).toBe('POST');
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['access-control-allow-origin']).toBeUndefined();
  });
}
