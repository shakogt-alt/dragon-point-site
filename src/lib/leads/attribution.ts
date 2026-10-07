import {
  attributionSchema,
  attributionShape,
  type Attribution,
} from '../validation/attribution';

const storageKey = 'dragon-point:first-touch:v1';
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function captureFirstTouch(
  storage: StorageAccess | undefined,
  href: string,
  referrer: string,
): Attribution {
  try {
    const saved = storage?.getItem(storageKey);
    if (saved) {
      const parsed = attributionSchema.safeParse(JSON.parse(saved));
      if (parsed.success && parsed.data.landingUrl) return parsed.data;
    }
  } catch {
    /* Storage can be blocked or contain an obsolete/corrupt record. */
  }
  const result: Attribution = {};
  try {
    const url = new URL(href);
    const landing = attributionShape.landingUrl.safeParse(url.href);
    if (landing.success) result.landingUrl = landing.data;
    for (const key of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'gclid',
      'fbclid',
    ] as const) {
      const value = url.searchParams.get(key);
      const parsed = attributionShape[key].safeParse(value);
      if (parsed.success && parsed.data) result[key] = parsed.data;
    }
    const referral = attributionShape.referrer.safeParse(referrer || undefined);
    if (referral.success && referral.data) result.referrer = referral.data;
  } catch {
    /* Malformed external input does not prevent enquiries. */
  }
  try {
    storage?.setItem(storageKey, JSON.stringify(result));
  } catch {
    /* Best effort: no form PII is stored. */
  }
  return result;
}
