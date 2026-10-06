# Phase 3 — Core UI report

Date: 2026-10-06 (Asia/Tbilisi).
Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Base: `344ca0bff9aaba3e3cb6b39d6553e6ede7840ac7`.

## Completed

- Verified repository, branch and clean starting tree; fetched origin and
  confirmed the branch was current. Read AGENTS.md and CODEX_TASK.md completely.
- Replaced the temporary Foundation shell with Header, Hero, Start With Your
  Goal, Better Decisions, Dragon Point Standard, Services, Technology and Footer.
- EN/KA/RU/HE share the same server-rendered component tree. All visible copy,
  accessible labels, brand text and language abbreviations live in dictionaries.
  Header receives only its required dictionary subset for client enhancement.
- Preserved centralized approved palette, local FiraGO for EN/KA/RU and Noto
  Sans Hebrew for HE. Light sections dominate the page; dark Hero, Technology
  and Footer provide approximately the approved 60/40 balance. Violet accents
  identify actions, steps and geometry without dominating backgrounds.
- Original replaceable CSS/SVG architecture geometry and typographic brand
  compositions; no fabricated photography, final logo, market numbers or claims.
  The comparison explicitly labels qualitative examples as illustrative.
- Sticky/compact Header, desktop anchors and progressively enhanced native
  mobile menu/language disclosures. Escape restores trigger focus; outside
  clicks close menus; resizing into desktop preserves focus on the brand link.
  Native navigation and language switching remain usable without JavaScript.
- Hebrew document RTL, logical spacing/alignment and shared keyboard/source
  order. Horizontal process/CTA arrows follow RTL; narrow layouts use a vertical
  six-step process with downward arrows. Brand, architecture and utility icons
  stay unmirrored. Latin names/codes use direction isolation where needed.
- Preserved locale URLs, one H1, canonical, reciprocal hreflang including he,
  x-default to /en, sitemap, robots, JSON-LD, OG/Twitter and environment indexing.
  SEO builders, origin policy and font/locale architecture remain unchanged.
- Goal CTAs expose data-intent for Phase 4 and currently reach the honest advisor
  placeholder in the Footer. No lead form, API, analytics or KleekTo integration.
  Privacy is an inline pending-input disclosure, not an empty future SEO page.
- Saved and visually inspected all six requested full-page screenshots:

| Locale     | Width | Screenshot                                    |
| ---------- | ----- | --------------------------------------------- |
| EN desktop | 1440  | [EN desktop](screenshots/phase-3/en-1440.png) |
| EN mobile  | 390   | [EN mobile](screenshots/phase-3/en-390.png)   |
| KA mobile  | 390   | [KA mobile](screenshots/phase-3/ka-390.png)   |
| RU desktop | 1440  | [RU desktop](screenshots/phase-3/ru-1440.png) |
| HE desktop | 1440  | [HE desktop](screenshots/phase-3/he-1440.png) |
| HE mobile  | 390   | [HE mobile](screenshots/phase-3/he-390.png)   |

## Changed files

- Documentation: README.md, this report and
  docs/superpowers/plans/2026-10-06-core-ui.md.
- Screenshots: docs/screenshots/phase-3/en-1440.png, en-390.png, ka-390.png,
  ru-1440.png, he-1440.png and he-390.png.
- Route: src/app/[locale]/page.tsx.
- Layout: src/components/layout/Header.tsx, Footer.tsx and Landing.tsx;
  removed src/components/layout/FoundationShell.tsx.
- Sections: src/components/sections/Hero.tsx, GoalSelector.tsx,
  BetterDecisions.tsx, DragonPointStandard.tsx, Services.tsx and Technology.tsx.
- Shared UI: src/components/ui/ActionLink.tsx, ArchitectureVisual.tsx, Arrow.tsx,
  Logo.tsx and LanguageSwitcher.tsx.
- Dictionaries: src/messages/en.json, ka.json, ru.json and he.json.
- Styles: src/styles/globals.css, tokens.css and landing.css.
- Tests/configuration: tests/e2e/foundation.spec.ts, landing.spec.ts and
  playwright.config.ts. Existing SEO and unit test contracts remain intact.
- AGENTS.md, CODEX_TASK.md, package manifests/lock, fonts, SEO builders, locale
  routing and indexing policy were not modified. No other repository was touched.

## Tests run

- npm run lint.
- npm run format:check.
- npm run typecheck.
- npm test.
- npm run build.
- npm run test:e2e, including axe WCAG 2 A/AA and 2.1 AA.
- npm audit --omit=dev --json and npm audit --json.
- git diff --check, independent read-only code review and visual inspection.

## Tests result

- Lint: passed with zero warnings. Format check and typecheck passed.
- Unit tests: 44 passed across two files.
- Production build: passed; localized pages and crawler documents remain dynamic.
- Final Chromium E2E: 76 passed in 2.1 minutes. Seven preserved Foundation
  contracts, 41 landing scenarios and 28 SEO scenarios across missing-origin,
  configured production, Vercel preview and staging profiles.
- Responsive matrix: all four locales at 360, 390, 430, 768, 1024, 1280, 1440
  and 1920 px; no horizontal overflow or clipped headings/actions/process cards.
  RTL process position, CTA arrow direction, unmirrored logo/menu icons and
  mobile menu direction passed. Desktop six-step flow and narrow vertical order
  remain semantically identical.
- Desktop and mobile anchor/navigation, language/font/direction switching,
  keyboard skip link, native no-JS navigation, Escape/outside click and resize
  focus continuity passed. All local anchor links resolve to actual targets.
- Axe found no WCAG violations in four desktop pages and four open mobile menus.
  All four desktop locale scenarios reported zero console/page errors and one H1.
- Initial TDD check failed against the old Foundation build as expected. The
  first full run found two test mistakes (an obscured outside-click target and
  a nonexistent menu selector); both were corrected before the final full run.
- Independent review found no runtime blocker. Its menu selector and Header
  payload/focus findings were addressed and verified in the final run.
- Production dependency audit: zero findings. Full audit: five existing high
  findings in development tooling, unchanged from prior phases; no dependency
  was added or upgraded.

## Known issues

- Production domain/OG artwork remain unknown. Missing SITE_URL intentionally
  blocks indexing and omits absolute SEO URLs. No production deployment occurred.
- Advisor links currently reach a visible contact placeholder. Lead capture,
  intent preselection, form feedback and mobile lead CTA belong to Phase 4.
- Final logo, photography, contact details and legal privacy copy are pending.
  The current geometric/typographic visuals are replaceable compositions.
- Localized landing copy needs human editorial approval before public launch,
  especially Hebrew/Georgian; technical review is not native editorial sign-off.
- Five existing high development dependency audit findings remain. Browser QA
  used Chromium; this report makes no cross-browser or future Lighthouse claim.

## Pending inputs

- Confirmed production HTTPS origin and approved 1200×630 OG artwork.
- Final logo masters and approved architecture photography.
- Confirmed public contact information, real social URLs and lead destination.
- Approved privacy/consent copy and native locale editorial review.

## Next step

Deliver this phase as a separate commit, push to codex/landing-mvp and verify
remote HEAD, report/screenshots and clean working tree. Stop before Phase 4 —
Lead System. Phase 4 requires explicit user approval; KleekTo remains untouched.
