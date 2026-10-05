# Phase 1 — Foundation report

Date: 2026-10-05 (Asia/Tbilisi).
Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
`AGENTS.md` and `CODEX_TASK.md` were read completely before implementation and remain unchanged.

## Completed

- Next.js 16.3.8, the npm `latest` stable release at implementation time; React 19.3.0.
- TypeScript 6.0.3 with strict checking, App Router, Tailwind CSS 4.3.3.
- ESLint flat config and Prettier, npm scripts and reproducible package-lock.
- Approved project boundaries for layout, sections, UI, locale content, styles,
  SEO, lead services/API, validation and analytics. Future features have reserved
  directories, not published placeholder routes or endpoints.
- Centralized five approved brand colors, spacing, radii, containers, shadows,
  transitions and Tailwind theme mapping.
- Self-hosted FiraGO Regular / Medium / SemiBold / Bold WOFF2 from a pinned
  official upstream commit, with original OFL license and provenance.
- Shared server-rendered Foundation shell, typed EN / KA / RU dictionaries,
  locale validation, static locale pages and correct HTML document language.
- Server redirect `/` to `/en`; unsupported locale and unpublished route return 404.
- SEO extension boundary documented. Foundation responses use noindex/nofollow
  until Phase 2 implements environment-aware SEO.
- Skip link, visible keyboard focus, semantic landmarks, one H1 per locale,
  minimum 44px language targets and reduced-motion handling.
- README and environment template, with no invented production domain,
  contacts, credentials, final logo, statistics or integrations.
- No KleekTo changes or integration. Work remained inside this repository.

## Changed files

Full inventory is listed at the end of this report. Existing instruction files
were not modified. Generated builds, dependencies and browser artifacts are ignored.

## Tests run

- `npm run lint` (final run).
- `npm run format:check`.
- `npm run typecheck`.
- `npm test`.
- `npm run build` (final run after PostCSS export correction).
- `npx playwright install chromium` and `npm run test:e2e`.
- `npm audit --omit=dev --json`, full `npm audit --json` and `npm ls --depth=0`.
- Manual screenshot inspection: KA and RU at 390px, EN at 1440px.
- Repository/branch checks and instruction-file diff check.

## Tests result

- Lint: passed, zero warnings in final run.
- Formatting: passed.
- Typecheck: passed.
- Unit: 10 passed.
- Chromium E2E: 30 passed.
- Build: passed; `/`, `/en`, `/ka`, `/ru` are generated successfully.
- All three locales passed axe WCAG 2 A/AA and 2.1 AA checks, keyboard navigation,
  language links, local font loading, exactly one H1 and zero browser console/page errors.
- Layout checks passed for every locale at 360, 390, 430, 768, 1024, 1280, 1440 and 1920px.
- Root server redirect, invalid route 404s, noindex response header and navigation
  with JavaScript disabled passed. Published Foundation links worked.
- Production dependency audit: zero vulnerabilities. Dependency tree check passed.
- Early failures were resolved: one anonymous PostCSS export lint warning;
  Windows reserved TCP 3100 in excluded range 3087–3186, so E2E uses 3300.

## Known issues

- Full npm audit reports 5 high entries in the development dependency chain
  `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
  The underlying braces advisory is GHSA-vfj7-8cjw-p6xm; no patched release exists
  as of this report. This chain belongs to lint tooling, not production dependencies.
  See https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.
- ESLint 9.39.5 is deprecated upstream. It is pinned because the React, import and
  accessibility plugins in official eslint-config-next 16.3.8 declare ESLint 9
  compatibility, not ESLint 10. Track compatible upstream updates.
- The current pages are a temporary Foundation shell. Full landing UI, SEO,
  lead handling, analytics, final accessibility and Lighthouse audits belong to
  their approved subsequent phases; this is not a production-ready MVP.
- FiraGO files retain all upstream scripts; final weight/subset/preload optimization
  is deferred to the approved performance phase.
- The codebase knowledge graph does not index this repository yet; the graph
  architecture call returned “project not found or not indexed.” File inspection
  was used as the authorized fallback.

## Pending inputs

No input blocks Phase 1. Later phases need the confirmed production domain,
phone/WhatsApp, email, office address, lead destination, final logo and photography,
and actual social URLs. Do not invent these values.

## Next step

Stop at the Phase 1 gate. Begin Phase 2 — SEO Foundation only after explicit
user confirmation. No deployment or Phase 2 implementation was performed.

## File inventory

- .env.example
- .gitignore
- .prettierignore
- .prettierrc.json
- README.md
- docs/phase-1-report.md
- eslint.config.mjs
- next.config.ts
- package-lock.json
- package.json
- playwright.config.ts
- postcss.config.mjs
- src/app/(entry)/layout.tsx
- src/app/(entry)/page.tsx
- src/app/[locale]/layout.tsx
- src/app/[locale]/page.tsx
- src/app/api/leads/.gitkeep
- src/assets/fonts/FiraGO-Bold.woff2
- src/assets/fonts/FiraGO-Medium.woff2
- src/assets/fonts/FiraGO-Regular.woff2
- src/assets/fonts/FiraGO-SemiBold.woff2
- src/assets/fonts/OFL.txt
- src/assets/fonts/README.md
- src/components/layout/FoundationShell.tsx
- src/components/sections/.gitkeep
- src/components/ui/LanguageSwitcher.tsx
- src/lib/analytics/.gitkeep
- src/lib/fonts.ts
- src/lib/i18n/locales.ts
- src/lib/i18n/messages.ts
- src/lib/leads/.gitkeep
- src/lib/seo/README.md
- src/lib/validation/.gitkeep
- src/messages/en.json
- src/messages/ka.json
- src/messages/ru.json
- src/styles/globals.css
- src/styles/tokens.css
- tests/e2e/foundation.spec.ts
- tests/unit/locales.test.ts
- tsconfig.json
- vitest.config.mts
