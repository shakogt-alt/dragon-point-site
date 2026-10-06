# Phase 2A — Hebrew Locale & SEO Amendment report

Date: 2026-10-06 (Asia/Tbilisi).
Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Pulled base: `85e8ac69d302e99224ad786344fdd2dda7fea87d`.

## Completed

- Pulled origin/codex/landing-mvp with fast-forward only, before implementation.
  Read updated AGENTS.md and CODEX_TASK.md completely; both contain Hebrew and
  the Phase 2A amendment. They remain unchanged by this implementation.
- Added /he and src/messages/he.json, Hebrew locale type/guard, typed dictionary
  loading and HE in the shared language switcher.
- All EN/KA/RU/HE pages retain the same FoundationShell, layout and SEO builders.
- Hebrew renders lang=he and dir=rtl on the document; EN/KA/RU explicitly use ltr.
  Language changes update document direction and the applied font, including
  without JavaScript. Root redirect and x-default remain /en.
- Logical CSS for inline sizes, insets and spacing; text-align:start. RTL flex
  flow follows document direction without reversing source/keyboard order.
  Latin wordmark and language abbreviations are isolated with dir=ltr.
- Self-hosted Noto Sans Hebrew variable font with pinned source, SHA-256 and
  full SIL OFL 1.1 license. FiraGO remains for EN/KA/RU. No new npm dependency.
- Authored Hebrew Foundation/accessibility copy and localized image-alt text;
  title and description use the approved natural Hebrew baseline. No runtime
  machine translation or invented market statistics/contact information.
- Hebrew self-canonical, reciprocal hreflang=he, four-language alternates plus
  x-default, /he in production sitemap, WebSite.inLanguage including he,
  he_IL Open Graph locale/alternates and localized OG/Twitter metadata.
- Preserved existing origin configuration and indexing policy. Preview/staging
  remain noindex; missing SITE_URL still omits absolute links and blocks indexing.
- Extended unit and E2E coverage. Inspected generated Hebrew mobile/desktop
  screenshots; no horizontal overflow, clipped text or observed RTL regression.
- Phase 3, lead UI and KleekTo implementation remain untouched.

## Changed files

- Locale/copy: src/lib/i18n/locales.ts, messages.ts and src/messages/he.json.
- Document/font: src/app/[locale]/layout.tsx, src/lib/fonts.ts,
  src/assets/fonts/hebrew/NotoSansHebrew-Variable.ttf, OFL.txt and README.md.
- Shared presentation: src/components/layout/FoundationShell.tsx,
  src/components/ui/LanguageSwitcher.tsx, src/styles/globals.css and tokens.css.
- SEO: src/lib/seo/metadata.ts; registry-based crawlers/structured-data automatically
  include Hebrew without duplicate locale lists or separate implementations.
- Tests: tests/unit/locales.test.ts, seo.test.ts; tests/e2e/foundation.spec.ts,
  seo.spec.ts.
- Documentation: README.md, src/lib/seo/README.md,
  docs/superpowers/plans/2026-10-06-hebrew-amendment.md and this report.
- AGENTS.md, CODEX_TASK.md, package manifests/lock, existing EN/KA/RU copy,
  origin policy and approved brand colors remain unchanged.

## Tests run

- npm run lint; final changed-test lint after the review improvement.
- npm run format:check.
- npm run typecheck.
- npm test.
- npm run build.
- npm run test:e2e.
- npm audit --omit=dev --json and npm audit --json.
- git diff --check and instruction/dependency diff checks.
- Independent read-only review, font glyph/provenance verification and visual
  inspection of Hebrew screenshots at 390 and 1440 px.

## Tests result

- Unit TDD: initial 8 expected failures for missing Hebrew/SEO, then 44 passed.
- Browser TDD: /he returned 404 on the old build; the completed route returns 200.
- Lint: passed with zero warnings; format check and typecheck passed.
- Production build: passed; locale/crawler routes remain request-rendered.
- Initial full Chromium E2E: 67 passed (2.4 minutes).
- Final full Chromium E2E after font-switch coverage improvement: 67 passed
  (1.4 minutes).
- Responsive coverage: all four locales at 360, 390, 430, 768, 1024, 1280, 1440
  and 1920 px. Hebrew checks document direction, inline-start alignment, navigation
  bounds/order, 44px targets, skip-link position, keyboard order and text clipping.
- Accessibility: axe WCAG 2 A/AA and 2.1 AA checks passed on the Foundation in all
  four languages. Browser error checks and no-JS navigation passed.
- SEO: actual rendered metadata, five language links, one H1, canonical, OG/Twitter,
  JSON-LD and crawler documents checked across configured production, Vercel
  preview, staging and missing-origin profiles. Production sitemap has four URLs
  and twenty alternate links; Twitterbot receives Hebrew SEO in the initial head.
- Reserved dragon-point.test origin/image URLs are test fixtures only, not
  production defaults or invented business inputs; tests do not fetch them.
- Audit: production dependencies have zero vulnerabilities. Full audit retains
  five high findings in the existing development tooling chain; no dependencies
  were changed.
- Review: no critical/important finding. The minor font-switch coverage gap was
  addressed by checking the computed body font after each language transition.
  The font cmap covers Hebrew dictionary characters and the Latin wordmark.

## Known issues

- Production origin and final OG artwork remain unknown. Without SITE_URL,
  absolute canonical/hreflang/OG/entity URLs are intentionally absent and indexing
  stays blocked. No production deployment was performed.
- Existing five high dev-tooling audit findings remain as reported in Phase 2;
  production dependencies have zero findings.
- Process arrows, icons, mobile menus and forms do not exist in the Foundation.
  Their actual RTL behavior cannot be verified before implementation in Phase 3/4.
  README preserves the RTL review gate and directional-icon/arrow guidance for
  those phases; no future UI was introduced here.
- Hebrew copy received a technical/editorial review, not native human sign-off.
  The limited Foundation copy is coherent; final landing copy should receive
  Hebrew editorial approval before public launch.

## Pending inputs

- Confirmed production HTTPS origin for SITE_URL.
- Approved branded 1200×630 artwork and public HTTPS OG_IMAGE_URL.
- Native Hebrew editorial sign-off for public launch and later landing copy.
- Later phases still need real public contacts, address, lead destination, final
  logo/photography and actual social URLs; none were invented.

## Next step

Deliver Phase 2A as a separate commit on codex/landing-mvp, push normally and verify
remote SHA/report plus clean working tree. Stop before Phase 3 — Core UI; it
requires explicit user approval. Repeat RTL QA when real Phase 3/4 controls exist.
