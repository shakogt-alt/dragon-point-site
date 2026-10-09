// Vendor scripts can collect their own URL/referrer beyond our event payload.
// This final guard stays strict. Campaign boot captures attribution and removes
// supported campaign keys independently; other unsafe context blocks providers.
export function safeTrackingContext(href: string, referrer: string): boolean {
  try {
    const url = new URL(href);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      !/^\/(en|ka|ru|he)$/.test(url.pathname) ||
      ![
        '',
        '#main',
        '#hero',
        '#goals',
        '#buy',
        '#invest',
        '#sell',
        '#decisions',
        '#standard',
        '#services',
        '#technology',
        '#advisor',
        '#contact',
      ].includes(url.hash)
    )
      return false;
    if (!referrer) return true;
    const ref = new URL(referrer);
    return (
      /^https?:$/.test(ref.protocol) &&
      !ref.username &&
      !ref.password &&
      !ref.search &&
      !ref.hash &&
      (ref.pathname === '/' ||
        (ref.origin === url.origin && /^\/(en|ka|ru|he)$/.test(ref.pathname)))
    );
  } catch {
    return false;
  }
}

type ContextPort = {
  capture: () => unknown;
  href: () => string;
  referrer: () => string;
};

// Attribution owns cleanup. Providers only verify the resulting URL/referrer.
export function prepareProviderContext(port: ContextPort): boolean {
  try {
    port.capture();
    return safeTrackingContext(port.href(), port.referrer());
  } catch {
    return false;
  }
}
