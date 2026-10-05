# SEO boundary — Phase 2

Locale validation, static params and document language are implemented in Phase 1.
Use `src/lib/i18n/locales.ts` as the single source of supported locales.
Each locale uses the same component tree and its own typed dictionary.

Phase 2 will add localized metadata, self-canonicals, hreflang, sitemap,
robots, Organization / RealEstateAgent / WebSite JSON-LD and Open Graph.
`SITE_URL` must use the confirmed production origin, never an invented domain.
No future keyword routes or empty SEO pages are published by the foundation.

All Foundation responses have `X-Robots-Tag: noindex, nofollow` in
`next.config.ts`. Phase 2 must make indexing environment-aware, with preview
and staging still blocked. Phase 1 does not publish an indexable landing.
