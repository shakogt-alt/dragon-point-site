# Dragon Point — Landing, Leads, SEO and Analytics Readiness

Repository: `shakogt-alt/dragon-point-site`. Working branch: `codex/landing-mvp`.
Read `AGENTS.md` and `CODEX_TASK.md` before changing the application.

## Development

Use Node.js 22.12+ (Node 24 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. `/` redirects on the server to `/en`.
`/en`, `/ka`, `/ru` and `/he` share one server-rendered shell. Unsupported locales
return 404. There is no runtime machine translation.
Hebrew renders with document-level `lang="he"` and `dir="rtl"`; the other locales
use `dir="ltr"`. Dictionary copy is authored locally, not translated at runtime.

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
layout widths 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920, including Hebrew
RTL navigation, start alignment, skip-link position, text clipping and overflow.
SEO tests cover rendered metadata, reciprocal hreflang, JSON-LD, robots and
sitemap, production indexability, preview/staging noindex and missing-domain
behavior. The reserved `https://dragon-point.test` origin and image URLs are
test fixtures only; tests never make network requests to them or deploy them.
Consent tests cover first visits, purpose gating, persistence/reopening, keyboard
flow, cross-tab revocation, blocked storage, sticky CTA coordination and privacy
of funnel/language events. E2E builds and servers leave provider IDs empty.

## Architecture

- `src/app/[locale]`: localized root layout/page, locale guard and runtime SEO.
- `src/app/(entry)`: separate root layout for the server redirect at `/`.
  Multiple root layouts keep document `lang`, direction and locale font correct
  without client mutation, including when switching into/out of Hebrew.
- `src/lib/i18n`: supported locales, URL helper, typed dictionary loading.
- `src/messages`: locale content outside presentation components.
- `src/styles`: approved brand tokens and Tailwind v4 theme mapping.
- `src/assets/fonts`: self-hosted FiraGO WOFF2 for EN/KA/RU and Noto Sans Hebrew
  variable font for HE, with their SIL OFL licenses and pinned provenance.
- `src/components/layout`: shared Landing, progressively enhanced Header and Footer.
- `src/components/ui`: dictionary-driven language navigation, action links,
  typographic logo and replaceable decorative architecture SVG.
- `src/components/sections`: Hero, goals, comparison, standard, services, technology
  and the shared lead section.
- `src/components/leads`: React Hook Form, intent/focus enhancement and mobile CTA.
- `src/lib/seo`: shared environment policy, metadata, crawlers and JSON-LD builders.
- `src/proxy.ts`: environment-aware X-Robots-Tag response guard.
- `src/app/robots.ts`, `sitemap.ts`: runtime crawler documents.
- `src/lib/leads`, `src/lib/validation`, `src/app/api/leads`: attribution, bounded
  schema/server validation, rate limiter and optional webhook service.
- `src/lib/analytics`: strict event contract, consent persistence, purpose-gated
  runtime and lazy GA4/GTM/Meta adapters.
- `src/components/analytics`: shared localized consent banner/dialog and Footer settings.

Reserved directories use `.gitkeep`; they do not publish placeholder APIs or
future SEO pages. Core UI sections render on the server; Header, form and mobile
CTA add client enhancements. Native mobile
disclosures and all anchor/language links also work without JavaScript.
Goal card/CTA actions preselect intent and focus the form at `#advisor`; Hero and
advisor links target it too. Real contact information remains pending at
`#contact` in the footer. Privacy copy is an inline pending-input disclosure, not
a future page. The form requires JavaScript; it renders disabled before hydration
and has a localized noscript explanation, avoiding accidental URL-based PII submission.
Comparison cards contain explicitly labeled qualitative examples, not market data.

## Lead delivery and attribution

Name and Phone are required; Email, Budget and Message are optional. Preferred
language is distinct from the page locale. International phones accept 7–15
digits, formatting separators and +/00 country-code prefixes. This is format
validation, not verification of ownership or national numbering plans.

The server accepts JSON only, checks same-origin browser requests, limits the
streaming body to 16 KiB, validates the strict Zod contract and rejects honeypot
submissions before delivery. Replies contain only generic status codes, with
no-store/noindex headers. Neither lead payloads nor backend error details are logged.

`LEAD_WEBHOOK_URL` and optional `LEAD_WEBHOOK_TOKEN` are server-only settings.
Leave them blank until the real recipient is supplied. The receiver must accept
JSON and persist the enquiry before returning 2xx. Only HTTPS destinations are
accepted; redirects are rejected; delivery times out after 8 seconds. A missing
or failed destination returns 503 and a localized retry message. No enquiry is
silently discarded or reported successful. There is no local durable queue, CRM
or KleekTo connection. Confirm privacy copy before enabling public collection.

Rate limiting is bounded and per process: on Vercel, five attempts per client in
ten minutes using its platform [x-vercel-forwarded-for header](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for);
elsewhere, untrusted forwarded headers are ignored and a shared budget allows
twenty attempts per minute. Cold starts/other instances have separate budgets;
distributed protection can be added when deployment infrastructure is known.

First-touch `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`gclid`, `fbclid`, referrer and landingUrl persist in session storage across
locale navigation. No form fields or personal contact details are stored there.
Blocked/corrupt storage falls back to current-page attribution without preventing
submission. The server fixes source to `dragon-point-landing` and validates all
attribution fields; attribution is contextual, not trusted for authorization.

The mobile CTA appears after Hero below 768 px, respects safe-area padding and
hides for visible form, editable focus/keyboard or open navigation. The shared
consent UI sets `html[data-consent-ui="open"]` and uses `data-consent-overlay`;
either hides the CTA. Scrolling is immediate and honors reduced motion.

Tests clear webhook settings for every E2E server. Success/error UI uses isolated
HTTP response fixtures; server/adapter unit tests verify actual validation and
delivery outcomes. The unconfigured API is tested directly and never sends
synthetic leads to a real recipient. Phase 4 review images live in
`docs/screenshots/phase-4`.

## Analytics readiness

Necessary features are always available. Analytics and Marketing start disabled;
no optional providers load before their required consent. Choices persist for
180 days, reopen from Footer settings and synchronize across tabs. Invalid or
expired records fail closed; blocked storage retains a current-visit choice only.
No personal lead values, attribution, URLs or raw error details enter events.

GA4, GTM and Meta adapters are prepared with empty environment IDs. GTM replaces
direct GA4 and requires both optional categories plus an audited consent-aware
container. Automatic vendor collection and account settings require an activation
review. Vendors deliberately stay blocked on unsafe URL/referrer context,
including UTM query pages, without changing lead attribution. See the full
[event and activation contract](src/lib/analytics/README.md).

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
origin publishes the four locale URLs in sitemap.xml and allows crawling.
Request-time rendering keeps HTML, proxy headers and crawler documents in sync
even when one build is started in different deployment environments.

`OG_IMAGE_URL` optionally points to approved branded artwork hosted at an
absolute HTTPS URL. The real asset must be 1200×630. Leave it empty until
supplied: no fake image, broken default asset or invented final logo is emitted.
OG/Twitter title/description and Twitter summary_large_image are ready per
locale; image dimensions and localized alt text are added when configured.
Hebrew uses URL/hreflang `he` and Open Graph `he_IL`. Every page includes all
four hreflang links plus x-default → /en. JSON-LD WebSite.inLanguage includes
en, ka, ru and he.

## RTL implementation

The shared shell follows the document direction. CSS uses logical inline sizes,
insets, margins and padding, with `text-align: start`; layout order follows flex
direction without changing the source/keyboard order. The Latin wordmark and
language abbreviations are isolated with `dir="ltr"`.

Directional CTA arrows and the six-step desktop process follow the locale's
direction. Below 1280 px, the process runs vertically with downward arrows in
all locales. Logo, architecture drawing, menu, chevron and check icons do not
mirror. The Hebrew matrix covers actual navigation, disclosures, CTA alignment,
process positions, overflow and mixed Latin/Hebrew text. Native source and
keyboard order remain shared across locales.

## Visual review

Full-page Phase 3 screenshots are saved in `docs/screenshots/phase-3`: EN desktop
1440, EN mobile 390, KA mobile 390, RU desktop 1440, HE desktop 1440 and HE mobile 390. Typographic brand compositions and original CSS/SVG geometry are
replaceable when approved logo and photography are supplied.
The approved Visual Assets Integration Pass supplies the illustrative Architecture
image used by the current Hero; its sources and prior screenshots are preserved.
Phase 5 consent and refreshed landing screenshots live in `docs/screenshots/phase-5`.

## Production inputs

`.env.example` documents SEO and optional future environment settings. Never commit
credentials or invent the production domain, contact information, logo,
photography, social links or lead destination. Analytics is not activated.
No KleekTo code, credentials or integration is touched.

## Phase gate

Phase 5 stops after verification, a separate commit, push and report.
Phase 6 requires explicit user confirmation.
