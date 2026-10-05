export type SeoEnvironment = Record<string, string | undefined>;

export type SeoConfig = {
  origin?: string;
  indexable: boolean;
  ogImage?: string;
};

function httpsUrl(value: string | undefined): URL | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password)
      return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export function getSeoConfig(env: SeoEnvironment = process.env): SeoConfig {
  const url = httpsUrl(env.SITE_URL);
  const hostname = url?.hostname.replace(/\.$/, '');
  const publicOrigin =
    url &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    hostname?.includes('.') &&
    !hostname.endsWith('.localhost') &&
    !hostname.endsWith('.local') &&
    !/^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  const origin = publicOrigin ? url.origin : undefined;
  const environment = env.SITE_ENV ?? env.VERCEL_ENV ?? 'development';
  const vercelAllowsProduction =
    !env.VERCEL_ENV || env.VERCEL_ENV === 'production';
  const image = httpsUrl(env.OG_IMAGE_URL);
  return {
    origin,
    indexable: Boolean(
      origin && environment === 'production' && vercelAllowsProduction,
    ),
    ogImage: image?.href,
  };
}
