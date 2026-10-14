import { expect, test } from '@playwright/test';

test('malformed percent-encoding is rejected without a server error or details', async ({
  request,
}) => {
  for (const path of ['/%ZZ', '/en/%', '/%E0%A4%A']) {
    const response = await request.get(path);
    expect(response.status()).toBe(400);
    expect(await response.text()).toBe('');
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  }
});

for (const locale of ['en', 'ka', 'ru', 'he']) {
  test(`${locale}: deployment response protects content and frame boundaries`, async ({
    request,
  }) => {
    const response = await request.get(`/${locale}`);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toBe("frame-ancestors 'none'");
    expect(headers['permissions-policy']).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(headers['cache-control']).toContain('no-store');
  });
}

test('unsupported lead methods are not cached or exposed as HTML errors', async ({
  request,
}) => {
  for (const method of ['GET', 'HEAD', 'PUT', 'PATCH', 'DELETE']) {
    const response = await request.fetch('/api/leads', { method });
    expect(response.status()).toBe(405);
    expect(response.headers().allow).toBe('OPTIONS, POST');
    expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(await response.text()).toBe('');
  }
});

test('lead OPTIONS advertises the supported methods', async ({ request }) => {
  const response = await request.fetch('/api/leads', { method: 'OPTIONS' });
  expect(response.status()).toBe(204);
  expect(response.headers().allow).toBe('OPTIONS, POST');
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.text()).toBe('');
});

test('favicon returns the approved symbol as a cacheable ICO', async ({
  request,
}) => {
  const response = await request.get('/favicon.ico');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(
    /image\/(x-icon|vnd.microsoft.icon)/,
  );
  expect(response.headers()['cache-control']).toContain('max-age=');
  const body = await response.body();
  expect(Array.from(body.subarray(0, 4))).toEqual([0, 0, 1, 0]);
  expect(body.readUInt16LE(4)).toBeGreaterThan(0);
});
