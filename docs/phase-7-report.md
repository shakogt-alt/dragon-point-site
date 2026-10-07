# Phase 7 — Performance & Core Web Vitals Hardening

## Completed and baseline

Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`, verified
starting HEAD `b6694ca9d5ec3d3be9a958aa8f3eb0aecd98967a`. `AGENTS.md` and
`CODEX_TASK.md` were read completely before changes. Work stayed in this checkout.

The production baseline was saved before application changes: EN/HE, mobile
390×844 DPR2 and desktop 1440×900 DPR1, three sequential Lighthouse runs per case.
Final audits use the same browser, throttling, first-visit consent and cache setup.
The reserved `.test` SEO fixture is measurement-only; no production domain was
invented. Final build uses blank analytics IDs and unconfigured lead delivery.

Evidence and reproduction: [performance README](performance/phase-7/README.md),
[baseline summary](performance/phase-7/baseline-summary.json),
[final summary](performance/phase-7/final-summary.json),
[comparison](performance/phase-7/comparison.json).

## Bottlenecks identified

- EN initial load transferred three complete multilingual FiraGO weights. This
  dominated its mobile font transfer and delayed text paint/LCP.
- The initial client graph pulled form validation and the Zod resolver before
  any enquiry interaction. The original large Zod chunk was mostly unused at load.
- HE mobile was already limited more by framework hydration and style/layout
  work than font transfer. Desktop scores were already healthy.
- Image candidates extended to 3840px despite the approved source being 1600px.
  The existing mobile/DPR2 and desktop/DPR1 selections were appropriate; high-DPR
  upscaling added transfer without additional source detail.
- Static landing sections already use server components. Header, lead form,
  sticky CTA and consent islands require their existing interactions. Listener
  and observer cleanup is present; no duplicate registration or pre-consent
  vendor load was demonstrated. Dynamic locale links generated no initial RSC
  prefetch requests in the probes, so their behaviour was preserved.

## Optimizations made

1. Kept the form mounted and fields immediately usable. The exact form schema
   and existing Zod resolver load on form focus/submission, with a shared download
   promise. Submission waits for validation; download failure remains fail-closed,
   retains values, shows the existing localized error, clears busy state and
   permits retry. Invalid submission focuses the first erroneous field after the
   disabled fieldset is re-enabled, avoiding RHF's timer race with asynchronous
   validation; ordinary field editing does not steal focus. Server validation and
   payload semantics are unchanged.
2. Separated synchronous attribution validation from the form graph. Named
   `zod/mini` APIs keep the same strict object, type, length, URL, control-character,
   trim and NFC rules. An independent Phase 6 classic-Zod oracle checks accepted
   values and transformed output across boundaries and hostile inputs. The
   explicit Phase 5B boot order is unchanged and passes both mocked provider variants.
3. Replaced monolithic Next local-font delivery with native self-hosted
   `@font-face`/Unicode ranges for dictionary text. All original FiraGO characters,
   weights, glyph outlines/advances, hints and OpenType feature closure remain
   available. KA/RU use combined script + common/Latin/mark faces to retain punctuation kerning; only active above-fold weights are preloaded. Original
   font sources and OFL notices remain intact; Arial fallback metrics are copied
   exactly from the baseline build; `font-display: swap` remains.
4. Preserved complete original FiraGO for unrestricted EN/KA/RU input. Review
   found that splitting arbitrary accented/mixed text could change kerning or
   combining marks despite identical individual glyphs. The complete face now
   loads only for focused/nonempty text fields; a blank placeholder is solely an
   invisible CSS delivery hook. Browser tests compare all four dictionary corpora and unrestricted text shaping with original
   source fonts. HE continues to use the complete Noto font and its existing fallback.
5. Converted the full variable Noto font from TTF to WOFF2 without subsetting or
   changing font axes. All four locales retain one component tree and original RTL.
6. Capped image candidates at 1600px. The approved Hero file, dimensions, `sizes`,
   preload, WebP quality, portrait crop, geometry and overlay are unchanged.
7. Added immutable caching for generated content-hashed font assets only. API
   and locale responses retain `no-store`; dynamic SEO remains uncached. Scratch
   audit tooling is isolated/ignored and application dependencies are unchanged.

Native font faces allow per-file Unicode ranges without changing the approved
fonts. CSS delivery remains small relative to fonts/JS. No demonstrably dead
shared rule was found; breakpoints, logical properties and accessibility styles
were retained. See the [font manifest](../src/assets/fonts/web-manifest.json)
and deterministic generator for coverage, size and hash evidence.

## Before/after metrics and Lighthouse results

Three-run medians; Performance / Accessibility / Best Practices / SEO.

| Case            | Scores before → after          | LCP ms before → after | CLS before → after  | TBT ms before → after | Total transfer bytes before → after |
| --------------- | ------------------------------ | --------------------- | ------------------- | --------------------- | ----------------------------------- |
| EN mobile 390   | 66/100/96/100 → 71/100/96/100  | 6101 → 3969           | 0.000000 → 0.000000 | 0 → 585               | 1,076,846 → 435,618                 |
| EN desktop 1440 | 96/100/96/100 → 99/100/96/100  | 1203 → 827            | 0.000127 → 0.000025 | 0 → 45                | 1,129,737 → 433,231                 |
| HE mobile 390   | 76/100/96/100 → 74/100/96/100  | 2900 → 3199           | 0.000547 → 0.000547 | 811 → 790             | 380,926 → 304,332                   |
| HE desktop 1440 | 99/100/96/100 → 100/100/96/100 | 760 → 739             | 0.000182 → 0.000182 | 92 → 41               | 433,830 → 357,168                   |

**Target attainment:** Accessibility 100, Best Practices 96 and SEO 100 exceed their ≥95 targets in every case. **Mobile Performance ≥90 is not met**: EN 71 and HE 74. Desktop Performance is EN 99 / HE 100. This pass does not claim production launch clearance for the remaining mobile performance risk.

| Case       | Initial JS encoded bytes | Initial font encoded bytes | Hero encoded bytes |
| ---------- | ------------------------ | -------------------------- | ------------------ |
| EN mobile  | 253,016 → 186,845        | 767,976 → 189,064          | 28,638 → 28,638    |
| EN desktop | 253,016 → 186,845        | 767,976 → 135,388          | 76,906 → 76,906    |
| HE mobile  | 253,016 → 186,845        | 71,764 → 58,632            | 28,638 → 28,638    |
| HE desktop | 253,016 → 186,845        | 71,764 → 58,632            | 76,906 → 76,906    |

Initial JS body transfer falls 26.2%; EN mobile fonts fall 75.4%; HE fonts fall 18.3%. EN mobile LCP improves 34.9% (6.10s → 3.97s). HE mobile LCP is worse in this lab set (2.90s → 3.20s), and Performance falls 76 → 74 despite lower transferred bytes. TBT changes from 811ms to 790ms; no HE mobile performance or LCP improvement is claimed.

EN mobile TBT rises from 0 to 585ms and remains a risk. FCP now occurs much earlier (4.86s → 1.74s). Because [TBT counts long-task blocking after FCP](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time), the earlier paint changes its measurement window; this is a possible contributing factor, not a reason to dismiss the final blocking. Detailed main-thread observations remain in the reports.

Local warm-server TTFB medians: EN mobile 51 → 48ms, EN desktop 34 → 37ms, HE mobile 32 → 33ms, HE desktop 35 → 35ms. No production TTFB claim or unsafe response caching was added.

All four settled EN/HE control cases compare 84 visible text nodes, with maximum x/y/width/height delta **0px**. Selected Hero source, bounds, sizes and crop are unchanged at baseline DPR1/2.

Lighthouse timing/CLS numbers are **lab evidence, not field Core Web Vitals**.
Scores and each metric are independent medians, not a selected favourable run.
Initial encoded asset bodies are separate cold-context resource probes; they
exclude HTTP headers and differ from Lighthouse's total transfer weight.

## Asset sizes and JS/font/image findings

The public Hero remains **229,262 bytes, 1600×900**, below the 300KB invariant.
Mobile DPR2 selects 640px and desktop DPR1 selects 1200px in both stages. Tests
also exercise desktop DPR3, where the selected derivative is now capped at the
source width. Default WebP negotiation is retained; no speculative AVIF change
or new photography/recompression was introduced.

The generated font set contains 34 content-addressed WOFF2 files, including the
complete original 250,752-byte FiraGO input face. The generated assets total 2,179,296 bytes on disk. Stored files are not initial
transfers: unused scripts/weights remain on demand. Common FiraGO 400/500/600
faces are 44,412 / 45,472 / 45,504 bytes. The complete Noto variable WOFF2 is
58,632 bytes versus the 112,640-byte source TTF. The full input face is an explicit
post-interaction cost for preserving arbitrary text shaping, not a claimed saving.

Raw build chunk sizes, initial encoded script/font/image bytes, selected images
and font statuses are in the asset/comparison JSON. Deferred validation is still
available when needed; those chunks are not counted as initial-load savings
after form interaction. React/Next framework costs remain in the initial graph.

## CLS and responsiveness inspection

[Interaction observations](performance/phase-7/interaction-layout.json) cover
all four locales at 390px: image/fonts ready, banner/dialog/dismissal, compact
Header, sticky visibility, focus, validation errors and success. Hero/image
dimensions remain stable. The approved compact Header changes its reserved
offset with its height; that behaviour was preserved. Error messages and success
replace/reflow the form following user input, with focus feedback retained.
Raw layout-shift entries mark recent input rather than treating all interaction
reflow as unexpected CLS. Settled before/after text geometry is recorded separately.

The form stays available while its validator downloads. Tests verify no early
API request, a single eventual submission and safe recovery after a failed chunk
download. The delayed-invalid focus regression also passed 16 repeated targeted
checks. Mobile CTA, consent keyboard interactions, reduced motion and Hebrew
RTL remain covered. Lab TBT describes loading-time blocking; it is not field INP.

## Changed files

- Config: `.gitignore`, `next.config.ts`, `playwright.config.ts`.
- Delivery: both existing root layouts, `src/lib/fonts.ts`, font manifest,
  generated `src/styles/fonts.css`, `globals.css`, `tokens.css`, `leads.css`,
  and the 34 manifest-listed files under `public/fonts/`.
- Leads/validation: `LeadForm.tsx`, `leads/constants.ts`, `leads/attribution.ts`,
  `leads/payload.ts`, `validation/attribution.ts`, `validation/lead.ts`.
- Tests: performance E2E, original-font assertions in foundation/landing E2E,
  attribution equivalence and asset invariant unit tests.
- Tooling/docs: font generator, Lighthouse/CDP audit, interaction audit,
  comparison script, Phase 7 plan, this report and compact performance evidence.

The complete path list is [changed-files.json](performance/phase-7/changed-files.json).
Historic Phase 5/6 screenshots regenerated by tests are restored; approved visual
assets, dictionaries, SEO logic, provider contracts and KleekTo were not changed.

## Tests run and results

| Check                                        | Result                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run lint`                               | Passed; zero warnings                                                                           |
| `npm run format:check`                       | Passed                                                                                          |
| `npm run typecheck`                          | Passed                                                                                          |
| `npm test`                                   | 122 tests / 9 files passed                                                                      |
| `npm run build`                              | Passed; final build has blank provider IDs                                                      |
| `npm run test:e2e`                           | 228 passed, including 48 Chromium/Firefox/WebKit hardening journeys and 49 responsive scenarios |
| axe regression coverage                      | 76 scans; zero violations in covered states                                                     |
| New performance E2E                          | All 20 pass, included in the full run                                                           |
| Mocked campaign GA4/Meta                     | 5 passed; synthetic-ID build only; all vendor loading intercepted                               |
| Mocked campaign GTM                          | 5 passed; synthetic-ID build only; all vendor loading intercepted                               |
| Blank-ID build inspection                    | No GA/GTM synthetic IDs in final static chunks; E2E records no provider requests                |
| Interaction layout audit                     | All four locales passed geometry, overflow, console and third-party invariants                  |
| Lighthouse baseline/final                    | 12 + 12 sequential audits completed; medians and full compact audit results saved               |
| `npm audit --omit=dev`                       | Exit 0; zero vulnerabilities                                                                    |
| `npm audit`                                  | Exit 1; five inherited high dev findings, unchanged dependency chain                            |
| Source/font integrity and `git diff --check` | Passed                                                                                          |

Responsive coverage includes 360, 390, 430, 768, 1024, 1280, 1440 and 1920px in EN/KA/RU/HE, plus short mobile heights, long fields, consent and keyboard viewport journeys. Existing SEO, payload, attribution, honeypot, server rejection, funnel/event allowlists and external-referrer fail-closed coverage remain intact.

New assertions cover the public source budget, candidate bounds, per-locale
initial font/JS body budgets, no external requests/overflow/console errors,
immediate field availability, slow/failing deferred validation, browser shaping
and font/API/HTML caching. They avoid raw timing thresholds in CI. The baseline
failed the image candidate guard (3840 > 1600); final coverage passes.

A fresh independent read-only review found the font-shaping issue above; it was
corrected and verified against the originals. Injected chunk failures intentionally
exercise browser network errors; healthy journeys capture no console/page errors.
No application dependency or lockfile change was made. No force downgrade was
applied to the inherited dev audit chain.

## Core Web Vitals risks remaining / Known issues

- Mobile framework hydration and style/layout remain material. Production
  hosting, HTTP/CDN caching, network conditions and actual hardware may change
  results. Local warm-origin TTFB is not evidence of production latency.
- No production RUM/CrUX or field INP exists for this work. Do not label these
  lab metrics as real-world Core Web Vitals or a guaranteed production score.
- Cold image optimization and CDN cache misses need a real staging/hosting audit.
  Above-fold font swaps retain metric-adjusted fallbacks; physical devices still
  require verification. Complete arbitrary-input font delivery costs extra bytes
  after enquiry interaction to preserve shaping.
- The inherited dev chain `eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces` retains five high audit findings. Production
  audit has zero. Windows WebKit's native link-Tab limitation and physical keyboard/
  screen-reader limits from Phase 6 remain; existing cross-browser tests are retained.
- Without confirmed production inputs, SEO remains safely noindex and lead
  delivery remains unconfigured. Real vendor activation/container behaviour is
  outside mocked readiness tests. Unsafe external referrers remain fail-closed.

## Pending production inputs

Confirmed production domain/hosting, real lead destination, public contacts/
address/social URLs, final logo/photography and approved OG artwork, legal/privacy
review and reviewed analytics account/container configuration. No values were invented.

## Recommended launch-readiness next step

Owner review of these results and remaining mobile risks, then an approved staging
audit on the actual hosting/domain with cold/warm CDN measurements and physical
mobile devices. Field Core Web Vitals require separately approved production/RUM
data collection with the existing consent and PII protections.

Delivery: separate Phase 7 commit pushed to `origin/codex/landing-mvp`; exact remote
SHA, report/evidence presence and clean-tree verification are reported in the final
response. **Stop here. No deployment, main merge or Phase 8 without approval.**
