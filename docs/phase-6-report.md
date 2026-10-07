# Phase 6 — Responsive & Accessibility Hardening

Date: 2026-10-07. Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Verified starting HEAD: `7bd31947ac2fa8b7b7043538849187dc8ba8f425`.
The starting working tree was clean. `AGENTS.md`, `CODEX_TASK.md` and the
user's Phase 6 request were read completely before changes.

## Completed

- Hardened the shared EN/KA/RU/HE landing journey, preserving document RTL,
  localized copy, brand tokens, photography, SEO, lead schema/delivery,
  first-touch attribution and analytics event/provider contracts.
- Added critical Chromium, Firefox and WebKit journeys and complete responsive
  checks with real dictionaries, including short mobile viewports.
- Added accessibility assertions and axe scans for desktop, banner, settings
  dialog, mobile menu, sticky CTA, focused form, validation and success states.
- Saved review screenshots and before/after evidence. No new imagery, real IDs,
  contact details, market data or KleekTo integration was introduced.
- An independent read-only review identified focused fields being covered by
  the first-visit banner. That finding was reproduced and fixed. No other
  actionable review finding remained; the reviewer explicitly excluded physical
  keyboard/screen-reader testing, Phase 7 performance work and final delivery
  evidence from its review scope.

## Defects discovered / Defects fixed

| Verified defect                                                                                                                           | Fix and regression evidence                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmark focus outlines were suppressed, including the skip-link destination.                                                             | Keep the global focus ring, inset inside focusable landmarks to avoid horizontal overflow. Keyboard navigation and screenshots verify the visible ring.                                                               |
| Form boundaries had approximately 1.43:1 contrast against the light field background.                                                     | Introduce one centralized opaque control-border token mixed from approved colors. The rendered border now passes the automated 3:1 non-text contrast assertion.                                                       |
| Native fragment navigation could take focus back from the first lead field in Firefox.                                                    | The LeadForm handler owns advisor fragment history, scrolling and field focus; Header excludes that fragment from its generic destination focus handler. Preserve existing history state and query without reloading. |
| A resized keyboard viewport could leave a focused field below the visible area.                                                           | On field focus or viewport resize, reveal the field inside the available area below the sticky header. Listen to resize/focus only, allowing voluntary scrolling away from a focused field.                           |
| On short first-visit screens, the consent banner could cover focused fields; KA 390×640 reproduced the overlap.                           | Clamp the available bottom edge to the consent banner. Tests tab through real fields at all three short sizes in every locale and browser engine. Sticky CTA remains suppressed.                                      |
| WebKit pointer opening of consent settings did not reliably restore focus, because clicking a button need not make it the active element. | Pass the actual opening button to the existing consent focus helper. Escape and save restore the correct initiator without changing consent categories, wording or layout.                                            |
| Client field errors had associations but no shared localized live announcement.                                                           | Add a persistent, visually hidden atomic alert using existing dictionary errors; keep field labels, required indication, error associations and first-error focus.                                                    |
| At KA 390 px, the vertical Return arrow crossed the last line of the real localized description.                                          | Reserve another spacing-token unit below vertical process text. Preserve desktop spacing, direction and font sizes. A Range/SVG-path intersection assertion covers every responsive case.                             |

The border and process assertions failed against the previous implementation
before passing with the fixes. Short-screen geometry, Firefox focus and WebKit
restoration failures were also reproduced. Harness corrections wait for hydrated
controls/fonts, avoid repeated document reloads in one first-visit test, and use
an application-level error fixture rather than a failing browser resource.
Console errors remain test failures; no tests are skipped or errors filtered.

## Changed files

34 files: 14 source/config/test/documentation files and 20 screenshots.

- `eslint.config.mjs` — ignore local generated diagnostic scratch files.
- `playwright.config.ts` — add three journey projects and the responsive project.
- `src/components/analytics/ConsentManager.tsx`
- `src/components/analytics/ConsentSettings.tsx`
- `src/lib/analytics/client.ts` — optional explicit focus initiator only.
- `src/components/layout/Header.tsx`
- `src/components/leads/LeadForm.tsx`
- `src/styles/landing.css`
- `src/styles/leads.css`
- `src/styles/tokens.css`
- `tests/e2e/hardening.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `docs/superpowers/plans/2026-10-07-responsive-accessibility.md`
- `docs/phase-6-report.md`
- `docs/screenshots/phase-6/` — the review images listed below.

No dependency/lockfile, dictionary, SEO builder, crawler document, lead endpoint,
payload, webhook, attribution service, provider adapter or supplied asset changed.
Historic screenshot archives are retained unchanged. All six original visual
source SHA-256 values match the existing manifest.

## Browser matrix

Playwright 1.63.0 on Windows, automated desktop browser engines:

| Engine   | Version                      | Scope                                                                                                  |
| -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Chromium | 153.0.8010.12, revision 1243 | All four locales: 16 critical journey tests, responsive/state audit and existing foundation/SEO suite. |
| Firefox  | 155.0, revision 1543         | All four locales: 16 critical journey tests.                                                           |
| WebKit   | 26.6, revision 2359          | All four locales: 16 critical journey tests.                                                           |

Journeys cover navigation, languages, Hero/goal CTA intent and field focus,
consent choices/reopening/revocation, modal containment/Escape/restoration,
validation, retry, busy submission and success fixture, sticky CTA, attribution,
Hebrew RTL, viewport resize and zero console/page errors.

Windows WebKit's native Tab configuration skips links in this test environment.
Its tests check logical link source order and keyboard activation after explicit
focus, plus native form/dialog Tab behavior. Chromium and Firefox additionally
exercise native link Tab traversal. No production tabindex workaround was added.
These engines are not physical iOS/Android/Safari-device coverage.

## Responsive matrix

Automated full-page traversal in Chromium, with real localized fonts/copy:

| Locales           | Viewports                                                     | Result |
| ----------------- | ------------------------------------------------------------- | ------ |
| EN / KA / RU / HE | 360, 390, 430, 768, 1024, 1280, 1440, 1920 px; height 1000 px | Passed |
| EN / KA / RU / HE | 360×640, 390×640, 430×740                                     | Passed |

The 44 cases traverse Header, Hero, goals, comparison, Standard, services,
Technology, advisor and Footer; inspect real text/controls for horizontal
clipping, verify RTL and process-arrow/text separation, and open mobile navigation,
language disclosure and consent settings where applicable. Actions at the bottom
of menus/dialogs remain reachable. Image decoding, localized alt, unchanged crop
and no RTL transform are asserted. Existing image dimension/aspect-ratio and
directional/utility-icon tests remain in the foundation suite.

Separate cross-browser tests cover first-visit consent at all three short sizes.
Soft-keyboard behavior is **simulated** by reducing `visualViewport.height` and
dispatching resize; focused-field visibility, sticky suppression and voluntary
scrolling are checked. A physical OS keyboard was not tested.

## Accessibility results

The full suite passed 76 axe scans with zero violations; screenshot recapture
added five more passing scans. Axe uses WCAG 2 A/AA and 2.1 AA tags. Checks
include semantic landmarks/headings, one H1, labels/required indication,
associated errors/live announcements, success status/focus, visible focus,
skip navigation, modal containment, Escape/restoration, touch-target assertions,
form boundary contrast, reduced motion and document/source order in RTL.

Manual visual inspection is separate from automated geometry/axe: EN/KA/HE
mobile full-page screenshots, EN/RU/HE desktop sections, mobile menu, focused
lead, EN/HE dialogs, and visible before/after fixes were inspected. The supplied
Hero photograph retains its physical orientation; mixed Dragon Point/KleekTo
and Hebrew remain visually stable. No font-size reduction or copy shortening
was used to hide localization defects.

No screen reader was run. This is a tested WCAG AA baseline, not a claim of
complete accessibility certification.

## Tests run / Tests result

| Check                                           | Final result                                     |
| ----------------------------------------------- | ------------------------------------------------ |
| `npm run lint`                                  | Passed                                           |
| `npm run format:check`                          | Passed                                           |
| `npm run typecheck`                             | Passed                                           |
| `npm test`                                      | Passed                                           |
| `npm run build`                                 | Passed; final production build uses blank IDs    |
| `npm run test:e2e`                              | 208 passed, no retries, 9.2 minutes              |
| Dedicated mocked campaign GA4/Meta build/config | 5 passed, no retries                             |
| Dedicated mocked campaign GTM build/config      | 5 passed, no retries                             |
| axe                                             | Passed                                           |
| `npm audit --omit=dev --json`                   | Exit 0; zero production vulnerabilities          |
| `npm audit --json`                              | Exit 1; 5 unchanged high dev-dependency findings |
| `git diff --check` / source asset integrity     | Passed; all six original hashes preserved        |

Unit tests: 118 passed in seven files. The full E2E run is 208 passed; a further
targeted KA state/screenshot recapture passed after narrowing the evidence frame
(same application code and assertions). All 44 responsive cases, 48 cross-browser
journeys and the existing 111-test foundation/SEO suite pass without retries.
The final build contains no synthetic Google IDs.

Campaign fixtures use only synthetic test IDs and intercept every cross-origin
request, fulfilling vendor scripts locally or aborting unexpected traffic. No
real provider endpoints are called. Tests verify first-touch capture before
cleanup, clean URL without reload, correct consent activation, safe referrer
guard, no raw query/PII leakage, no duplicate loads/funnel events, attribution in
actual lead payloads and locale switching. The final production build has blank
provider IDs. Full SEO coverage retains canonical/hreflang/x-default, robots,
sitemap, JSON-LD, four locales and environment-aware indexing.

## Screenshots

All evidence is in [screenshots/phase-6](screenshots/phase-6/):

- Full pages: `en-1440-full.png`, `en-390-full.png`, `ka-390-full.png`,
  `ru-1440-full.png`, `he-1440-full.png`, `he-390-full.png`.
- States: `en-390-mobile-menu.png`, `en-390-lead-focused.png`,
  `en-390-consent-dialog.png`, `he-390-consent-dialog.png`.
- Before/after pairs: `en-field-border-*`, `en-skip-focus-*`,
  `en-keyboard-*`, `ka-consent-field-*`, `ka-process-*`.

Keyboard images show the simulated 300 px available viewport, without fabricating
OS keyboard artwork. Process images isolate the real Return text/arrow: the
before image is a pixel crop of the baseline capture, and the after image is a
fresh centered capture of that step, avoiding fixed-header/CTA obstruction.

## Known issues

- The unchanged dev chain `eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces` retains five high audit findings. Production
  audit is clean. No forced major dependency downgrade was applied in this phase.
- Actual mobile keyboard, physical-device and screen-reader coverage remains
  outside the performed checks; the WebKit link-Tab limitation is described above.
- Real vendor/container behavior still requires the existing account activation
  review. Unsafe immutable referrers intentionally remain fail-closed.
- Without a confirmed production origin the existing SEO configuration remains
  noindex; lead delivery remains safely unconfigured until a real receiver exists.

## Pending inputs

Confirmed production domain, public contacts/address/social URLs, lead destination,
final logo/photography and approved OG artwork, legal/privacy consent review and
reviewed analytics account configuration/IDs remain owner inputs. No values were
invented. The approved illustrative Hero asset remains in use.

## Next step

Delivery is a separate Phase 6 commit to `origin/codex/landing-mvp`, with remote
HEAD, report/screenshots and clean-tree verification in the final response.
**Phase 7 — Performance awaits explicit approval.**
