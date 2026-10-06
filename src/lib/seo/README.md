# SEO Foundation

- `config.ts`: validates SITE_URL and optional OG_IMAGE_URL, derives indexability.
- `metadata.ts`: localized metadata, canonical, hreflang + x-default, OG/Twitter.
- `crawlers.ts`: robots and sitemap, using the same deployment policy.
- `structured-data.ts`: known Organization / RealEstateAgent / WebSite entities
  and JSON serialization that escapes script-closing markup.

Locale content remains in `src/messages`; supported locales come from
`src/lib/i18n/locales.ts`. Canonical and language alternates are page metadata,
so future substantive pages can reuse these builders with their own page URLs.
The locales are en/ka/ru/he, with x-default → /en and he_IL for Hebrew Open Graph.
Sitemap and WebSite.inLanguage derive all four locales from the same registry.
Do not publish empty future pages or reuse landing canonicals on new routes.

SITE_URL is the confirmed production HTTPS origin, not the current preview
host. Never infer it from a request's Host or a hosting provider's preview URL.
When missing/invalid, absolute URL fields are omitted and indexing is blocked.
Preview and staging remain blocked even when the production origin is known.
Only configured production can publish sitemap URLs and index/follow metadata.

The locale pages and crawler routes evaluate policy at request time; the proxy
adds X-Robots-Tag noindex/nofollow when blocked. This avoids build-time headers
or cached crawler documents accidentally allowing a preview to be indexed.

JSON-LD deliberately omits unprovided addresses, phone/email, reviews, ratings,
awards and counts. No logo or social URL is invented. OG_IMAGE_URL is optional
until approved 1200×630 artwork exists; there is no fabricated image fallback.

Implementation follows the official Next.js [metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[crawler routes](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
and [JSON-LD guidance](https://nextjs.org/docs/app/guides/json-ld).
