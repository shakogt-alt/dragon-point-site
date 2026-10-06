# Phase 4 — Lead System report

Date: 2026-10-07 (Asia/Tbilisi); work started 2026-10-06.
Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Base: `5d0e1bf7b324a95e0c234bfae00fa427166a3503`.

## Completed

- Verified repository/branch/clean starting tree, fetched origin and confirmed
  the branch was current. Read AGENTS.md and CODEX_TASK.md completely.
- Added the shared LeadSection and React Hook Form with Zod validation for
  EN/KA/RU/HE: Buy/Invest/Sell, Name, Phone/WhatsApp, optional Email/Budget/Message,
  preferred language and Talk to an Advisor. Copy, labels and errors live in
  dictionaries. Preferred language remains distinct from the page locale.
- Goal card bodies and CTAs preselect the matching intent. Hero/advisor links
  scroll to the lead section and focus the name field. Repeated same-hash actions
  also scroll; short mobile screens reveal the focused field below the Header.
- Added a mobile sticky CTA after Hero, with safe-area padding and reserved
  bottom space. It hides while the lead section, editable focus/keyboard,
  navigation disclosure or marked consent UI is active. It uses logical CSS and
  immediate scrolling compatible with reduced motion.
- Hebrew retains the same component tree, document RTL, right-aligned labels
  and feedback, logical intent order and mirrored directional arrows. Phone and
  email values explicitly use LTR; name/message/budget use automatic direction.
- Added mandatory strict server-side validation, normalized/allowlisted payload,
  16 KiB streaming body ceiling, honeypot rejection, same-origin browser guard,
  generic no-store/noindex replies and bounded per-process rate limiting.
- Created a lead abstraction under src/lib/leads with an optional HTTPS webhook
  and optional server-only bearer token, an 8-second timeout and no redirect
  following. Missing/failed delivery returns unavailable; success is shown only
  after the receiver returns 2xx. No payload/backend error logging or local queue.
- Captured first-touch UTM source/medium/campaign/content/term, gclid, fbclid,
  referrer and landingUrl in session storage, preserving them through locale
  changes/submission. Form PII is not stored there. Payload includes intent,
  name, normalized phone, optional fields, preferredLanguage, locale and fixed
  source=dragon-point-landing. Storage failure does not block the form.
- Preserved prior fonts, palette, Core UI, all four locale URLs and existing SEO
  builders/indexing policy. Footer contact placeholder remains unchanged because
  no real contact input was supplied. KleekTo and analytics remain untouched.
- Produced the five requested review images. Section-only screenshots suppress
  fixed global chrome during capture to avoid overlapping the clipped section;
  the sticky-CTA image shows the actual viewport/header/CTA together.

| View                           | Width | Screenshot                                            |
| ------------------------------ | ----- | ----------------------------------------------------- |
| EN desktop lead section        | 1440  | [EN desktop](screenshots/phase-4/en-desktop-lead.png) |
| EN mobile with sticky CTA      | 390   | [EN mobile](screenshots/phase-4/en-mobile-sticky.png) |
| RU desktop lead section        | 1440  | [RU desktop](screenshots/phase-4/ru-desktop-lead.png) |
| HE desktop lead section        | 1440  | [HE desktop](screenshots/phase-4/he-desktop-lead.png) |
| HE mobile localized validation | 390   | [HE mobile](screenshots/phase-4/he-mobile-lead.png)   |

## Changed files

- Configuration/dependencies: .env.example, package.json, package-lock.json and
  playwright.config.ts. Added pinned react-hook-form 7.89.0, Zod 4.6.5 and
  @hookform/resolvers 5.9.1; existing direct dependencies were not upgraded.
- API: src/app/api/leads/route.ts.
- Contract/service: src/lib/validation/lead.ts; src/lib/leads/attribution.ts,
  payload.ts, handler.ts, rate-limit.ts and service.ts.
- Shared UI: src/components/leads/LeadForm.tsx, MobileLeadCTA.tsx and
  src/components/sections/LeadSection.tsx.
- Journey integration: src/components/layout/Landing.tsx, Footer.tsx;
  src/components/sections/GoalSelector.tsx and Hero.tsx.
- Locale copy: src/messages/en.json, ka.json, ru.json and he.json.
- Styles: src/styles/leads.css and globals.css.
- Tests: tests/unit/leads.test.ts, lead-handler.test.ts;
  tests/e2e/leads.spec.ts and landing.spec.ts.
- Documentation: README.md, this report and
  docs/superpowers/plans/2026-10-06-lead-system.md.
- Screenshots: the five files linked above under docs/screenshots/phase-4.
- AGENTS.md, CODEX_TASK.md, SEO builders/proxy/crawlers, locale registry, font
  assets, approved tokens and prior review screenshots were not changed.

## Tests run

- npm run lint.
- npm run format:check.
- npm run typecheck.
- npm test.
- npm run build.
- npm run test:e2e, including axe WCAG 2 A/AA and 2.1 AA.
- Focused lead/screenshot rerun after correcting section capture overlays.
- npm audit --omit=dev --json and npm audit --json.
- git diff --check, independent read-only review and visual screenshot inspection.

## Tests result

- Lint, format check, typecheck and production build passed.
- Unit suite: 78 passed across four files. Covers international phone formats,
  invalid/oversized values, optional email, normalization, strict overposting,
  attribution parsing/persistence/recovery, payload construction, server rejection,
  honeypot, origin/MIME/JSON/body ceiling, limiter expiration/capacity/trusted IP
  behavior and confirmed/unconfigured/failed webhook delivery.
- Full Chromium E2E: 90 passed in 2.6 minutes, including all 76 prior Core UI/SEO
  scenarios and 14 lead scenarios. SEO regression profiles cover missing domain,
  production, Vercel preview and staging; one H1 and all locale behavior remain.
- Focused screenshot/lead rerun: eight passed in 46.8 seconds after limiting
  global fixed chrome to the viewport screenshot rather than section captures.
- All four locales passed 360/390/430/768/1024/1280/1440/1920 widths. Additional
  360/390 × 640 short-screen checks passed in every locale. No horizontal overflow
  or observed RTL regression in the tested layouts.
- Goal/card/hero intent and focus, keyboard flow, sticky visibility, root consent
  state and pre-mounted consent class changes passed. First-touch campaigns
  survive EN→HE→RU navigation and are sent unchanged.
- Success/error UI fixtures passed with preserved input on errors and focused
  success state. Browser console/page-error assertions passed. API rejection and
  unconfigured 503 responses were verified separately via actual HTTP requests.
- Axe found no WCAG violations in the checked pages, open menus and localized
  validation states (16 checks during the full run).
- Browser delivery fixtures intercept HTTP responses; server and adapter tests
  exercise their own real boundaries with isolated receiver responses. No real
  production receiver was contacted. All E2E servers explicitly clear inherited
  webhook URL/token and VERCEL settings.
- Review regressions were reproduced before fixing: same-hash card navigation,
  consent class updates and offscreen focus on short mobiles. Their new tests
  pass in the full final run. Independent review confirmed the main fixes.
- Production dependency audit: zero findings. Full audit retains five existing
  high findings in development tooling, unchanged from prior phases.

## Known issues

- Actual lead delivery is not enabled: the destination/spec/credentials have not
  been supplied. The safe placeholder returns a localized error, never a false
  thank-you. Enabling delivery requires a real HTTPS receiver that persists leads
  before returning 2xx; there is no durable local storage/queue.
- Rate limiting is per process and resets on cold starts. Multiple instances do
  not share counters; non-Vercel hosting uses a shared local request budget.
- First-touch persistence is session-scoped. If storage is blocked, current-page
  attribution is still submitted, but persistence across full locale reloads
  cannot be guaranteed. The form itself requires JavaScript.
- Production domain, final OG/logo/photography, contacts and legal privacy copy
  remain pending. Missing SITE_URL intentionally keeps indexing blocked.
- Native Hebrew/Georgian editorial approval remains a launch input. Browser QA
  used Chromium; physical keyboard/safe-area and cross-browser QA can be expanded
  in the dedicated responsive/accessibility phase.
- Five existing high development audit findings remain; production audit is clean.

## Pending inputs

- Confirmed lead receiver/webhook contract and any real server credentials.
- Approved privacy/consent text, contact information and locale editorial review.
- Production HTTPS origin, approved 1200×630 OG artwork, final logo and photography.
- Deployment infrastructure for any shared/distributed anti-spam protection.

## Next step

Commit Phase 4 separately, push to codex/landing-mvp, verify remote HEAD, report,
screenshots and clean working tree. Stop before Phase 5 — Analytics Readiness;
explicit user approval is required. No analytics or KleekTo integration was started.
