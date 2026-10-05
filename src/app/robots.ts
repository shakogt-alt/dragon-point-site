import { getSeoConfig } from '@/lib/seo/config';
import { buildRobots } from '@/lib/seo/crawlers';

// Deployment policy is evaluated at request time, never frozen into a build.
export const dynamic = 'force-dynamic';

export default function robots() {
  return buildRobots(getSeoConfig());
}
