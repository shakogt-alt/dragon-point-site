// Vendor scripts can collect their own URL/referrer beyond our event payload.
// This final guard stays strict. Campaign boot captures attribution and removes
// unsafe query/fragment context before a provider can reach it.
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
  replaceUrl: (url: string) => void;
};

// Called only inside consent-gated provider start/dispatch, never by mount order.
export function prepareProviderContext(port: ContextPort): boolean {
  try {
    port.capture();
    const url = new URL(port.href());
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      !/^\/(en|ka|ru|he)$/.test(url.pathname)
    )
      return false;
    url.search = '';
    // Reuse the final guard's approved anchor contract with an empty referrer.
    if (!safeTrackingContext(url.href, '')) url.hash = '';
    if (url.href !== port.href()) port.replaceUrl(url.href);
    return safeTrackingContext(port.href(), port.referrer());
  } catch {
    return false; // Failed capture/cleanup is never permission to load a vendor.
  }
}
