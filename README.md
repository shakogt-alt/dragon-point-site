# Dragon Point — Foundation and SEO

Repository: `shakogt-alt/dragon-point-site`. Working branch: `codex/landing-mvp`.
Read `AGENTS.md` and `CODEX_TASK.md` before changing the application.

## Development

Use Node.js 22.12+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. `/` redirects on the server to `/en`.
`/en`, `/ka` and `/ru` share one server-rendered shell. Unsupported locales
return 404. There is no runtime machine translation.

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

E2E tests start local production-build servers on ports 3300–3303. Build first.
They cover root redirect, locales, invalid routes, language links, local font,
keyboard navigation, axe WCAG checks, browser errors, no-JS rendering and
layout widths 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920.
SEO tests cover rendered metadata, reciprocal hreflang, JSON-LD, robots and
sitemap, production indexability, preview/staging noindex and missing-domain
behavior. The reserved `https://dragon-point.test` origin and image URLs are
test fixtures only; tests never make network requests to them or deploy them.

## Architecture

- `src/app/[locale]`: localized root layout/page, locale guard and runtime SEO.
- `src/app/(entry)`: separate root layout for the server redirect at `/`.
  Multiple root layouts keep the document `lang` correct without client mutation.
- `src/lib/i18n`: supported locales, URL helper, typed dictionary loading.
- `src/messages`: locale content outside presentation components.
- `src/styles`: approved brand tokens and Tailwind v4 theme mapping.
- `src/assets/fonts`: self-hosted FiraGO WOFF2 and SIL OFL license.
- `src/components/layout`: temporary Foundation shell.
- `src/components/ui`: language navigation.
- `src/components/sections`: reserved for Phase 3.
- `src/lib/seo`: shared environment policy, metadata, crawlers and JSON-LD builders.
- `src/proxy.ts`: environment-aware X-Robots-Tag response guard.
- `src/app/robots.ts`, `sitemap.ts`: runtime crawler documents.
- `src/lib/leads`, `src/lib/validation`, `src/app/api/leads`: reserved for Phase 4.
- `src/lib/analytics`: reserved for Phase 5.

Reserved directories use `.gitkeep`; they do not publish placeholder APIs or
future SEO pages. The visible UI is still the temporary Foundation shell;
approved landing sections belong to Phase 3.

## SEO configuration

Copy `.env.example` to `.env.local` for local configuration. Keep `SITE_URL`
empty until the real production origin is confirmed. It must be an absolute
HTTPS origin with no credentials, path, query or fragment. Localhost and IP
origins are rejected. Canonical, hreflang (including x-default → /en), OG URL
and JSON-LD entity URLs use only this configured origin, never request headers.

Indexing requires both a valid `SITE_URL` and `SITE_ENV=production`, or
`VERCEL_ENV=production` when SITE_ENV is unset. `NODE_ENV=production` does not
enable indexing. Vercel preview/development veto production; explicit staging
also stays blocked. An unknown environment or missing/invalid origin fails
closed with robots metadata and X-Robots-Tag noindex/nofollow, robots.txt
Disallow: / and an empty sitemap.

Without a confirmed domain, localized metadata, H1 and known JSON-LD data still
render; absolute SEO links are intentionally omitted. Production with a valid
origin publishes the three locale URLs in sitemap.xml and allows crawling.
Request-time rendering keeps HTML, proxy headers and crawler documents in sync
even when one build is started in different deployment environments.

`OG_IMAGE_URL` optionally points to approved branded artwork hosted at an
absolute HTTPS URL. The real asset must be 1200×630. Leave it empty until
supplied: no fake image, broken default asset or invented final logo is emitted.
OG/Twitter title/description and Twitter summary_large_image are ready per
locale; image dimensions and localized alt text are added when configured.

## Production inputs

`.env.example` documents SEO and optional future environment settings. Never commit
credentials or invent the production domain, contact information, logo,
photography, social links or lead destination. Analytics is not activated.
No KleekTo code, credentials or integration is touched.

## Phase gate

Phase 2 stops after verification, commit, push and report.
Phase 3 requires explicit user confirmation.
