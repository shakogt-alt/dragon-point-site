import type { Attribution } from './attribution';
import {
  attributionKeys,
  attributionTextLimit,
  attributionClickIdLimit,
  attributionUrlLimit,
  noControls,
} from './attribution-rules';

type Result<T> = { success: true; data: T } | { success: false };
export const browserAttributionSchema = {
  safeParse(value: unknown): Result<Attribution> {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return { success: false };
    // Match the strict server schema, including inherited enumerable keys.
    for (const key in value)
      if (!attributionKeys.some((allowed) => allowed === key))
        return { success: false };
    const input = value as Record<string, unknown>;
    const data: Attribution = {};
    for (const key of attributionKeys) {
      const parsed = parseBrowserAttributionField(key, input[key]);
      if (!parsed.success) return { success: false };
      if (parsed.data !== undefined || key in input) data[key] = parsed.data;
    }
    return { success: true, data };
  },
};
export function parseBrowserAttributionField(
  key: keyof Attribution,
  value: unknown,
): Result<string | undefined> {
  if (value === undefined) return { success: true, data: undefined };
  if (typeof value !== 'string') return { success: false };
  if (key === 'landingUrl' || key === 'referrer') {
    if (value.length > attributionUrlLimit || !noControls.test(value))
      return { success: false };
    try {
      const url = new URL(value);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      )
        return { success: false };
      return { success: true, data: value };
    } catch {
      return { success: false };
    }
  }
  const text = value.trim();
  const max =
    key === 'gclid' || key === 'fbclid'
      ? attributionClickIdLimit
      : attributionTextLimit;
  return text.length <= max && noControls.test(text)
    ? { success: true, data: text.normalize('NFC') }
    : { success: false };
}
