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
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await request.fetch('/api/leads', { method });
    expect(response.status()).toBe(405);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(await response.text()).toBe('');
  }
});
