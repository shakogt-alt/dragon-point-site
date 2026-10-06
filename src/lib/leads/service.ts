import type { LeadPayload } from './payload';

export type LeadEnvironment = {
  LEAD_WEBHOOK_URL?: string;
  LEAD_WEBHOOK_TOKEN?: string;
  VERCEL?: string;
};
export type LeadService = {
  submit(payload: LeadPayload): Promise<{ delivered: boolean }>;
};

// Server-only configuration: never imported by a client component.
export function createLeadService(
  env: LeadEnvironment,
  fetcher: typeof fetch = fetch,
): LeadService {
  let endpoint: URL | undefined;
  try {
    const candidate = new URL(env.LEAD_WEBHOOK_URL ?? '');
    if (
      candidate.protocol === 'https:' &&
      !candidate.username &&
      !candidate.password &&
      !candidate.hash
    )
      endpoint = candidate;
  } catch {
    /* Missing configuration fails closed. */
  }
  return {
    async submit(payload) {
      if (!endpoint) return { delivered: false };
      try {
        const response = await fetcher(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(env.LEAD_WEBHOOK_TOKEN
              ? { authorization: `Bearer ${env.LEAD_WEBHOOK_TOKEN}` }
              : {}),
          },
          body: JSON.stringify(payload),
          redirect: 'error',
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });
        return { delivered: response.ok };
      } catch {
        return { delivered: false };
      }
    },
  };
}
