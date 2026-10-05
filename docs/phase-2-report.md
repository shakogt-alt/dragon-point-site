# Phase 2 — SEO Foundation report

Date: 2026-10-05 (Asia/Tbilisi).
Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Base commit: `55b9fb15f0f071d799d3bfa873d794eaf9a73a6e`.

## Completed

- Read AGENTS.md and CODEX_TASK.md completely before implementation; both unchanged.
- Localized EN / KA / RU title, unique description and image-alt copy in dictionaries.
- Self-canonical and reciprocal en/ka/ru hreflang, with x-default pointing to /en,
  all using only the configured production SITE_URL.
- Exactly one existing semantic H1 retained per locale; root redirects to /en.
- Environment-aware indexing shared by metadata, X-Robots-Tag, robots and sitemap.
- Production becomes indexable only with a valid confirmed HTTPS origin and
  explicit production deployment environment. Preview and staging remain noindex.
  NODE_ENV=production alone never enables indexing; Vercel preview vetoes an
  explicit SITE_ENV=production. Unknown environments fail closed.
- Request-time SEO policy prevents one build started under another environment
  from publishing stale indexability. Locale pages use server rendering; crawler
  routes are dynamic and the response proxy applies the same runtime policy.
- robots.txt and sitemap.xml. Configured production advertises exactly /en /ka /ru
  and their language alternates. Blocked environments disallow crawling and emit
  no sitemap URLs.
- Organization / RealEstateAgent / WebSite JSON-LD using known brand and Georgia
  geography only. No address, phone, email, reviews, ratings, awards or counts;
  no unverified parent-company relationship. Script markup is safely escaped.
- Per-locale OG title/description/locale/alternate locales and URL framework;
  Twitter summary_large_image, localized title/description and optional image.
- OG_IMAGE_URL supports approved 1200×630 artwork with localized alt text; no
  final artwork, logo or placeholder image was fabricated.
- Automated unit and browser SEO coverage, documented configuration and phase gate.
- No empty future SEO pages, Phase 3 UI or KleekTo changes. No new dependencies.

## Changed files

- Environment/docs: .env.example, README.md, src/lib/seo/README.md,
  docs/superpowers/plans/2026-10-05-seo-foundation.md and this report.
- Runtime policy: next.config.ts, src/proxy.ts, src/lib/seo/config.ts.
- SEO builders: src/lib/seo/metadata.ts, crawlers.ts, structured-data.ts.
- Routes/layouts: src/app/[locale]/page.tsx, [locale]/layout.tsx,
  src/app/(entry)/layout.tsx, robots.ts and sitemap.ts.
- Dictionaries: src/messages/en.json, ka.json and ru.json.
- Tests: playwright.config.ts, tests/unit/seo.test.ts, tests/e2e/seo.spec.ts.
- AGENTS.md, CODEX_TASK.md, package.json, package-lock.json, brand tokens, fonts
  and the Foundation UI remain unchanged.

## Tests run

- npm run lint
- npm run format:check
- npm run typecheck
- npm test
- npm run build
- npm run test:e2e
- npm audit --omit=dev --json and full npm audit --json
- git diff --check and instruction/dependency diff checks
- Independent read-only code review against Phase 1

## Tests result

- Final lint: passed, zero warnings. Formatting and typecheck: passed.
- Final unit suite: 42 passed.
- Final production build: passed; locale pages, robots.txt and sitemap.xml
  render on demand, with the response proxy active.
- Final Chromium E2E suite: 50 passed (2.4 minutes).
- SEO browser profiles use four local production-build servers: configured
  production, Vercel preview (even with SITE_ENV=production), staging and
  production with no SITE_URL. The reserved dragon-point.test origin and image
  URLs are test fixtures only, never deployment defaults or fabricated business
  inputs. Tests do not fetch or deploy those URLs.
- Tests check actual HTML title/description/canonical/hreflang/x-default, one H1,
  OG/Twitter, parsed JSON-LD, robots response, parsed sitemap XML and policy
  consistency. Crawler requests receive SEO in the initial document head.
- Foundation regressions cover eight widths (360–1920), three locales, keyboard,
  axe WCAG checks, links, local fonts, no-JS navigation and zero browser errors.
- Production dependency audit: zero vulnerabilities. Full audit: inherited
  five high development-tooling entries (see Known issues).
- Review found no remaining critical/important issue. Focused regression tests
  reproduced trailing-dot local-host validation and an unsupported organizational
  relationship before the fixes; both now pass.

## Known issues

- The real production domain is unknown. Without SITE_URL, absolute canonical,
  hreflang, OG URL and JSON-LD entity URLs are intentionally omitted, sitemap has
  no URLs and indexing remains blocked. This prevents invented or localhost SEO
  URLs. The complete configured behavior is tested with reserved test fixtures.
- Final OG artwork is pending. OG/Twitter image tags are omitted until an approved
  HTTPS asset is configured. Actual image availability/dimensions need verification
  when supplied; no artwork was generated in this phase.
- The existing lint-tool chain still reports five high entries from the braces
  advisory GHSA-vfj7-8cjw-p6xm. Production dependencies have zero findings.
  ESLint 9 remains pinned for the official Next.js plugin compatibility described
  in the Phase 1 report. No dependency changes were made in Phase 2.
- The knowledge graph still does not index this repository; graph discovery
  returned project-not-indexed, so file inspection was used as the allowed fallback.
- Native Georgian editorial approval and actual production/deployment crawler
  testing await supplied inputs. Full landing UI and final Lighthouse audit belong
  to their approved later phases.

## Pending inputs

- Confirmed production HTTPS origin for SITE_URL.
- Approved branded 1200×630 image and public HTTPS URL for OG_IMAGE_URL.
- For later phases: real public contacts, address, final lead destination, logo,
  photography and actual social URLs. These were not invented.

## Next step

Phase 2 delivery ends with a commit and push to codex/landing-mvp and verification
of the remote SHA/report and clean working tree. Stop here: Phase 3 — Core UI
requires explicit user approval. No production deployment is part of this phase.
