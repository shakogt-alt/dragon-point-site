import { createLeadHandler } from '@/lib/leads/handler';
import { createLeadService } from '@/lib/leads/service';
import { createRateLimiter } from '@/lib/leads/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const env = {
  LEAD_WEBHOOK_URL: process.env.LEAD_WEBHOOK_URL,
  LEAD_WEBHOOK_TOKEN: process.env.LEAD_WEBHOOK_TOKEN,
  VERCEL: process.env.VERCEL,
};
export const POST = createLeadHandler({
  service: createLeadService(env),
  limiter: createRateLimiter(
    env.VERCEL === '1'
      ? { limit: 5, windowMs: 600000 }
      : { limit: 20, windowMs: 60000 },
  ),
  env,
});
