# Dragon Point — Phase 1 foundation

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

E2E tests start a local production server on port 3300. Build first.
They cover root redirect, locales, invalid routes, language links, local font,
keyboard navigation, axe WCAG checks, browser errors, no-JS rendering and
layout widths 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920.

## Architecture

- `src/app/[locale]`: localized root layout and page, static params, locale guard.
- `src/app/(entry)`: separate root layout for the server redirect at `/`.
  Multiple root layouts keep the document `lang` correct without client mutation.
- `src/lib/i18n`: supported locales, URL helper, typed dictionary loading.
- `src/messages`: locale content outside presentation components.
- `src/styles`: approved brand tokens and Tailwind v4 theme mapping.
- `src/assets/fonts`: self-hosted FiraGO WOFF2 and SIL OFL license.
- `src/components/layout`: temporary Foundation shell.
- `src/components/ui`: language navigation.
- `src/components/sections`: reserved for Phase 3.
- `src/lib/seo`: documented Phase 2 boundary.
- `src/lib/leads`, `src/lib/validation`, `src/app/api/leads`: reserved for Phase 4.
- `src/lib/analytics`: reserved for Phase 5.

Reserved directories use `.gitkeep`; they do not publish placeholder APIs or
future SEO pages. Canonical, hreflang, sitemap, robots, JSON-LD and OG are
explicit Phase 2 deliverables. All Foundation responses are temporarily
`noindex, nofollow` via X-Robots-Tag; do not deploy this shell as a finished MVP.

## Production inputs

`.env.example` documents optional future environment settings. Never commit
credentials or invent the production domain, contact information, logo,
photography, social links or lead destination. Analytics is not activated.
No KleekTo code, credentials or integration is touched.

## Phase gate

Phase 1 stops after foundation verification and its commit/report.
Phase 2 requires explicit user confirmation.
