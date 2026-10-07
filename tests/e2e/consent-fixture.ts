import type { Page } from '@playwright/test';

// Existing behavior suites model an explicit necessary-only choice. First-visit
// and optional-consent behavior is tested separately in analytics.spec.ts.
export async function necessaryOnly(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'dragon-point:consent:v1',
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        necessary: true,
        analytics: false,
        marketing: false,
      }),
    );
  });
}
