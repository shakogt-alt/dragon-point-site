import { getSeoConfig } from '@/lib/seo/config';
import { buildSitemap } from '@/lib/seo/crawlers';

export const dynamic = 'force-dynamic';

export default function sitemap() {
  return buildSitemap(getSeoConfig());
}
