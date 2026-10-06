# Phase 2A — Hebrew Locale & SEO Amendment Implementation Plan

**Goal:** Add Hebrew and RTL to the existing Foundation and SEO, preserving EN/KA/RU.

**Architecture:** Extend the shared locale registry and dictionary loader. The same
layout and FoundationShell render every language; document direction controls
layout, logical CSS controls spacing, and a local Hebrew font provides glyphs.
Existing SEO builders already derive alternate URLs, sitemap and JSON-LD languages
from the registry; add the Hebrew OG locale explicitly.

**Tech stack:** Existing Next.js, TypeScript, Tailwind, Vitest and Playwright.
No new npm dependency. Noto Sans Hebrew is self-hosted under SIL OFL 1.1.

**Spec:** Updated AGENTS.md, CODEX_TASK.md and the user's Phase 2A request.
Execution is native in this chat, within the already authorized phase.

## Constraints and review focus

- Only shakogt-alt/dragon-point-site, codex/landing-mvp; stop before Phase 3.
- Preserve / → /en and x-default → /en. No production domain or business data.
- One component tree; he uses lang=he, dir=rtl; other locales use dir=ltr.
- Keep Hebrew text in messages/he.json; no runtime translation.
- Hebrew SEO uses the approved title and natural professional description.
- Verify switching into and out of Hebrew does not leave stale direction/font.
- Verify 360/390/430/768/1024/1280/1440/1920 widths, keyboard order, start alignment,
  skip-link position, minimum link targets, text clipping and horizontal overflow.
- Existing Foundation has no process arrows, icons, mobile menu or forms. Review
  existing UI now; those future controls remain Phase 3/4, with an RTL review gate.

## Task 1 — Locale and SEO contract

Files: src/lib/i18n/{locales,messages}.ts, src/messages/he.json,
src/lib/seo/metadata.ts; tests/unit/{locales,seo}.test.ts.

1. Extend tests before implementation: he resolves its dictionary; all four
   canonicals/hreflangs, x-default, sitemap and JSON-LD language list include he.
2. Run npm test and confirm failures reflect the missing locale/SEO contract.
3. Add he to registry/loader and he_IL to OG map. Author Hebrew Foundation, SEO,
   accessibility labels and image-alt copy; review vocabulary and mixed-script text.
4. Run the full unit suite green.

## Task 2 — Document RTL and typography

Files: src/app/[locale]/layout.tsx, src/lib/fonts.ts, src/assets/fonts/hebrew/*,
src/components/{layout/FoundationShell,ui/LanguageSwitcher}.tsx,
src/styles/{globals,tokens}.css; tests/e2e/foundation.spec.ts.

1. Add Hebrew browser tests for document attributes, font, navigation and RTL bounds.
2. Run one Hebrew test against the old build; expect missing /he to fail.
3. Add document direction and select local font variables by locale. Use logical
   sizes/insets and text-align:start. Isolate Latin brand/language labels with dir=ltr.
4. Preserve source/keyboard order, allowing flex direction to follow the document.
5. Build and verify all four locales at the complete responsive matrix; inspect
   screenshots at mobile/desktop sizes, inspect any failures before fixing.

## Task 3 — SEO browser coverage and delivery

Files: tests/e2e/seo.spec.ts, README.md, src/lib/seo/README.md,
docs/phase-2a-report.md.

1. Add he in every SEO profile: production, Vercel preview, staging, missing origin.
   Check five alternates, four sitemap URLs, twenty sitemap alternates, JSON-LD
   languages and he_IL; preserve all EN/KA/RU assertions.
2. Run lint, format check, typecheck, npm test, production build and full E2E.
3. Review scope/diff, write required report with actual results and pending inputs.
4. Commit Phase 2A separately, push normally, verify remote SHA/report and clean tree.
5. Stop before Phase 3, which requires explicit approval.
