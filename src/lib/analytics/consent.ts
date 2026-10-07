export type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};
export const DENIED: Consent = {
  necessary: true,
  analytics: false,
  marketing: false,
};
export const CONSENT_KEY = 'dragon-point:consent:v1';
export const CONSENT_LIFETIME = 180 * 86400000;
type Store = Pick<Storage, 'getItem' | 'setItem'>;

export function readConsent(
  storage?: Store,
  now = Date.now(),
): Consent | undefined {
  try {
    const raw = storage?.getItem(CONSENT_KEY);
    if (!raw) return;
    const record = JSON.parse(raw);
    if (
      record?.version !== 1 ||
      record.necessary !== true ||
      typeof record.analytics !== 'boolean' ||
      typeof record.marketing !== 'boolean' ||
      !Number.isFinite(record.updatedAt) ||
      record.updatedAt > now ||
      now - record.updatedAt >= CONSENT_LIFETIME
    )
      return;
    return {
      necessary: true,
      analytics: record.analytics,
      marketing: record.marketing,
    };
  } catch {
    /* Invalid or unavailable storage never grants consent. */
  }
}

export function saveConsent(
  storage: Store | undefined,
  consent: Consent,
  now = Date.now(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: now,
        necessary: true,
        analytics: consent.analytics === true,
        marketing: consent.marketing === true,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
