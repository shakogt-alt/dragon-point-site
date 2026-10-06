export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 5000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const buckets = new Map<string, { count: number; until: number }>();
  return {
    check(key: string, now = Date.now()) {
      let bucket = buckets.get(key);
      if (!bucket || bucket.until <= now) {
        for (const [existing, value] of buckets)
          if (value.until <= now) buckets.delete(existing);
        if (buckets.size >= maxKeys)
          return { allowed: false, retryAfter: Math.ceil(windowMs / 1000) };
        bucket = { count: 0, until: now + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count++;
      return {
        allowed: bucket.count <= limit,
        retryAfter: Math.max(1, Math.ceil((bucket.until - now) / 1000)),
      };
    },
  };
}
export type LeadRateLimiter = ReturnType<typeof createRateLimiter>;
