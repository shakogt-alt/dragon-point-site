# Dragon Point Brand Identity Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. User instruction overrides commit steps and repeated approval gates. No commits, push, deployment or unrelated work changes.

**Goal:** Integrate the supplied Dragon Point identity into the existing multilingual landing with unchanged behavior and no material performance regression.

**Architecture:** Exact raster crops/resizes, reusable existing Logo markup, centralized tokens and existing CSS. Preserve component tree/client scope, fonts, locale copy, lead/analytics/consent contracts and SEO environment policy.

**Tech Stack:** Next.js 16.3.8, React 19.3.0, TypeScript, CSS, Playwright; existing local Sharp for technical asset processing only.

**Spec:** reference/brand/brand-identity-integration.txt (owner-supplied, local, intentionally ignored).

## Global constraints

- Source HEAD bcaad5cf77e9ade72896b43b16a2789e026e4851, branch codex/landing-mvp.
- Preserve six modified documentation files, existing untracked hosted audit and four reference originals by SHA-256; historical screenshots backed up separately.
- Approved colors #0B0D10 / #242830 / #B9C0C8 / #6847F5 / #F5F6F7; FiraGO and Hebrew font/RTL preserved.
- No invented, redrawn or AI-substituted mark. Use technically necessary crop/resize/compression/favicon composition from supplied pixels.
- No new client boundary, dependency, animation library, video, WebGL, heavy effect or LeadForm lazy-loading.
- Do not modify lead receiver, analytics architecture, attribution, consent semantics, privacy, SITE_URL/force-dynamic policy, Vercel/DNS/protection or main.
- Mobile >=90 exception is accepted. A short matched local before/after series covers LCP/CLS/TBT/client JS/new asset transfer.
- In-place path whitelist/checksum isolation. No reset/clean/staging/commit/push/deploy.

## Review focus

- Narrow/short mobile: readable identity, separate 44px controls, no overflow; existing matrix covers all four locales and eight widths.
- HE RTL: mark never mirrored; shared source/keyboard order and logically correct arrows.
- Accessible names contain visible brand/descriptor/current locale; browser assertions cover real controls.
- Footer reaches document end while equivalent CTA bottom clearance remains; existing CTA/menu/form/consent journeys verify behavior.
- Cold navigation: reserved image boxes, lightweight first-paint assets, lazy Footer art, unchanged hydration scope; measure rather than assume.

## Implementation map

| Area          | Branding use                                                                         | Files                                                                                   |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Identity      | Full Header/Footer lockup; mobile symbol and readable HTML brand                     | src/components/ui/Logo.tsx, public/brand/*                                              |
| Header        | Dark surface, precise spacing, corrected logo/language names                         | src/components/layout/Header.tsx, src/styles/landing.css                                |
| Hero          | Small source symbol, existing architecture and conversion flow                       | src/components/sections/Hero.tsx, src/styles/landing.css                                |
| Sections/data | Shared markers, restrained surfaces, dark DP comparison, static Standard progression | src/styles/tokens.css, src/styles/landing.css                                           |
| Form          | Surface/fields/focus/selected/disabled styling; no behavior changes                  | src/styles/leads.css                                                                    |
| Footer        | Lockup/localized HTML formula; move body mobile reserve into dark Footer             | src/components/layout/Footer.tsx, src/styles/leads.css                                  |
| Browser       | Source-symbol ICO, actual root response, locale icon link                            | public/brand/favicon.ico, src/app/favicon.ico/route.ts, src/app/[locale]/layout.tsx     |
| Review        | Asset provenance, fresh screenshots, exact validation/comparison inventories         | docs/branding-integration-report.md, .superpowers/branding-bcaad5c/review-png-archive/* |

## Task 1 — Identity and accessible branding

- [x] Complete spec, HEAD/refs/status/source image and current-site inspection; preservation inventory; baseline production build and six before samples.
- [x] Add real browser name/loaded-logo/favicon assertions; record expected baseline RED.
- [x] Generate deterministic optimized symbol/lockup/ICO derivatives with crop coordinates/hashes/sizes.
- [x] Reusable Logo variants, Header names, Hero/Footer identity and favicon link/response.
- [x] Targeted GREEN and unit suite. No commit.

## Task 2 — CSS system and Footer clearance

- [x] Document-bottom regression assertion fails on the existing body reserve.
- [x] Refine tokens and existing landing/leads CSS, preserve logical direction, copy and image payload.
- [x] Transfer equivalent mobile reserve into dark Footer padding; preserve CTA semantics.
- [x] Build; foundation/responsive/SEO verification; restore only historical screenshots generated by tests from the recorded backup.

## Task 3 — Owner review and guardrails

- [x] Lint, typecheck, production build, unit tests and relevant E2E with actual counts/exits.
- [x] EN/HE 390/1440 Hero/mid-page/Standard/lead/Footer and full overview; visually inspect, RTL/overflow/console checks.
- [x] Same three-per-locale local Lighthouse series; compare medians/ranges/benchmark/JS/assets/CLS; resolve attributable material regression.
- [x] React checklist and independent whole-change review; necessary fixes and verification.
- [x] Report all 18 specified items and separate pre-existing/branding/new-asset inventories.
- [x] Original source/docs hashes, HEAD/branch/staging/forbidden paths unchanged; exact requested ready/block status.

## Rulings and evidence

- User supplied authoritative spec/identity and explicitly requested implementation. No repeated design approval or commits.
- Declared checkout retained with checksum/path isolation; native worktree tool targets a different chat repository.
- Local cold-HTTP-cache fixture samples compare this patch only, not the earlier authenticated hosted series.
- Initial capture helper required its new private Chrome profile directory to be created before launcher PID writing. No valid samples lost; no owner authenticated Chrome/profile touched.
- Auto-review rejected a broad favicon-test tail replacement before execution. Use one exact existing test-block replacement, preserving all other tests.

Final evidence: build/lint/typecheck pass; unit140/10files; initial full E2E250/255, final affected E2E195/195 with all initial failures green; earlier unchanged Chromium/WebKit/SEO60/60. Source and asset hashes/client chunks verified. Owner review33 final screenshots, normal runtime Footer/RTL/overflow and six-sample comparison preserved. Final preservation gate recorded in .superpowers/branding-bcaad5c/final-verification.json.

Owner follow-up: one full E2E run255/255,exit0,10.7m on unchanged16 runtime/test/asset files and the same production build. All33 review PNGs removed from proposed Git changes and preserved in ignored evidence. Technical acceptancePASS, visual owner acceptancePENDING SCREENSHOT REVIEW, commit/push/deployHOLD. Tool-result images were not accessible attachments to owner; direct chat attachment API absent and browser UI initialization failed twice. Message image embeds are an unconfirmed delivery attempt.
