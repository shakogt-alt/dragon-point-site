# Phase 7B — Mobile Performance Diagnostic & Optimization

## Completed

Verified repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`,
starting HEAD `ea83cfc988fc0e2a0ab70ed4b085b12ab889f454`. Read the latest
`AGENTS.md`, `CODEX_TASK.md` and Phase 7 report completely before application changes.
Preserved all four locales, RTL, SEO, lead delivery/validation, attribution,
consent contracts, event names, privacy rules and approved visual assets.

Diagnosis preceded application edits: five EN/HE mobile Lighthouse samples each,
one desktop sanity sample each, six actual CPU-throttled profiles/traces, a
production Turbopack analyzer and compiled chunk AST inspection. Evidence and
reproduction are in [the evidence README](performance/phase-7b/README.md).

## Root causes and trace evidence

Initial full-document layout/text shaping is a major native cost, especially
HE. Baseline exclusive Layout medians at actual 4× CPU were EN 744 ms / HE
1,275 ms. Several large tasks are predominantly Layout before hydration; a
document-wide observer alone cannot explain these. React DOM, RSC and Turbopack
initialization remain substantial separate costs. CPU inclusive ancestry overlaps
and must not be summed; diagnostic blocking over 50 ms is not Lighthouse TBT.

Synchronous first-touch capture imported Zod Mini/core: 25,702 encoded bytes,
96,565 raw bytes, and observed initialization samples. Lead initialization included
this nested attribution cost. The full form validator/resolver and provider
adapters were already deferred. Blank IDs produced zero third-party requests.
Consent initialization was comparatively small; postponing consent would not
address the dominant bottleneck and was rejected.

## Initial JS breakdown

Actual baseline network bodies sum to **186,845 bytes**, including a 2,029-byte
preloaded Next error UI chunk. That chunk is not an analytics provider.

| Initial group                                                 | Encoded network bytes |
| ------------------------------------------------------------- | --------------------: |
| Next/React/Turbopack, error UI and small shared locale module |               134,732 |
| Application islands plus Next Link/Image helpers              |                15,533 |
| React Hook Form                                               |                10,878 |
| Zod Mini/core attribution dependency                          |                25,702 |

Compiled source parts below are measured by the production analyzer. They are
not source file lengths and cannot be summed as network gzip allocations.
Actual deployed AST spans and compressed bodies are in `baseline-bundle.json`;
internal analyzer filenames may differ from deployed hashes.

| Source part                                   |                       Compiled bytes | Load role                                                |
| --------------------------------------------- | -----------------------------------: | -------------------------------------------------------- |
| Header                                        |                                3,247 | Above-fold navigation                                    |
| LanguageSwitcher / Logo                       |                            327 / 215 | Header helpers                                           |
| ConsentManager including settings dialog      |                                4,001 | Immediate banner; dialog executes when opened            |
| ConsentSettings                               |                                  535 | Footer reopen trigger                                    |
| analytics client / consent / events / runtime |              3,598 / 677 / 772 / 734 | Boot and allowlisted event contracts                     |
| LeadForm including validation loader          |                                7,205 | Hydrated immediately, rendering can be skipped offscreen |
| payload builder                               |                                  452 | Submission                                               |
| React Hook Form                               |                               30,725 | Existing controller                                      |
| sticky CTA                                    |                                1,696 | Scroll/focus/consent-aware controller                    |
| Arrow                                         |                                  287 | Shared directional icon                                  |
| attribution capture / browser singleton       |                            694 / 149 | Deterministic first-touch boot                           |
| attribution Mini schema                       | 883, plus Mini/core dependency above | Removed from initial browser graph                       |
| provider adapters / vendor-safe context       |                          3,815 / 802 | Dynamic post-consent code, absent at initial load        |

Full classic Zod/form schema and resolver remain on focus/submission. Keeping
RHF and the real form controller hydrated avoids inert CTAs, lost values and
intent races. Header and first-visit consent stay immediately available.
No real IDs, contact details, production origin or market data were introduced.

## Changes made

1. Added small browser attribution parsers with shared pure limits/control rules
   and field keys. An independent Phase 6 classic-Zod oracle verifies acceptance,
   normalization, URL restrictions and strict-object behavior across all fields,
   boundaries, Unicode/control characters and prototype cases. Capture still
   precedes cleanup/activation; the server still uses its mandatory Zod schema.
   Payload field names/semantics and webhook behavior are unchanged.
2. Native `content-visibility: auto` and cached intrinsic size skip rendering of
   distant sections while retaining DOM, source order and hydration. Hero,
   goal cards and Services retain ordinary rendering. No content is removed.
   [Native browser behavior reference](https://web.dev/articles/content-visibility).
3. Kept goals outside containment after a failing real pointer test showed a
   moved target during return from the form. Kept Services outside containment
   after axe's offscreen geometry attributed its violet index to the unrelated
   dark Technology backdrop. Controlled KA/RU probes reproduced and removed the
   failures by excluding Services; no colors or axe rules were changed.
4. Coalesced sticky CTA mutation/scroll/focus geometry reads to one animation
   frame; avoided lead/overlay reads while Hero is visible or at desktop widths.
   Retained dynamic overlay detection, safe areas, keyboard/menu/consent suppression
   and cleanup, including cancellation of a pending frame.
5. Added regression checks for reduced initial script transfer, offscreen native
   rendering, every goal intent, Hero focus, keyboard order, direct `#advisor`,
   retained values and all four locales.

Full-page settled geometry inspection explicitly reveals skipped sections only
in the separate inspection script, never in Lighthouse or initial transfer probes.
It compares the real text tree and full rendering against the baseline. This
inspection override is not shipped application behavior.

## HE regression investigation

The Phase 6 HE mobile LCP range was 2,866–3,001 ms (three samples). Phase 7's
final median was 3,199 ms. The new pre-edit control is 3,108–3,158 ms (five
samples), median 3,139 ms. Its range does not overlap the saved Phase 6 set;
the observed regression was not dismissed as noise.

The LCP remains the same Hero image, at the same 324×182 geometry and 640px/q75
mobile derivative. EN mobile LCP is `.dp-hero-description` text. No image swap,
quality/crop change or replacement of FiraGO/Noto was made.

Saved Phase 6/7 LCP breakdowns show substantial image **element render delay**
(437/443 ms median in the observed traces, distinct from simulated lab LCP),
while download remains short. Current CPU traces likewise show the HE image
loaded well before its LCP paint, amid native layout and framework work.
A controlled original full Hebrew TTF response experiment on the static candidate
had LCP 1,520–1,768 ms, versus complete WOFF2 1,464–1,680 ms at actual 4× CPU;
it did not restore a faster historical result. Both containers retained the
same complete font/shaping. This experiment does not support blaming WOFF2 alone.
Historical source changes and host conditions cannot be uniquely separated from
saved summary audits, so no unsupported single-cause claim is made. Measured
native layout and script contention, rather than image transfer or missing
font glyphs, are the bottlenecks addressed here. Font/consent/hydration/resource
timings and native decode/paint observations are retained in trace JSON.

## Before/after metrics, EN and HE results

Five sequential samples per mobile locale, with the same Phase 7 setup. Values
are independent metric medians; parentheses show the full five-run min–max range.
Times are milliseconds. Phase 7 uses its saved three-run final medians.

| Metric                 | EN Phase 7 | EN pre-edit control |                EN final | HE Phase 7 | HE pre-edit control |                      HE final |
| ---------------------- | ---------: | ------------------: | ----------------------: | ---------: | ------------------: | ----------------------------: |
| Performance            |         71 |          70 (65–73) |          **72 (70–79)** |         74 |          76 (74–79) |                **80 (78–81)** |
| LCP                    |      3,969 | 4,036 (3,676–4,120) | **3,818 (3,666–4,024)** |      3,199 | 3,139 (3,108–3,158) |       **3,011 (2,961–3,025)** |
| FCP                    |      1,739 | 1,712 (1,557–1,721) |     1,752 (1,701–1,817) |      1,279 | 1,280 (1,040–1,424) |           1,267 (1,240–1,335) |
| TBT                    |        585 |       682 (569–909) |       **543 (387–715)** |        790 |       714 (590–792) |             **570 (523–636)** |
| Speed Index            |      1,965 | 2,208 (2,113–2,607) |     2,093 (1,950–2,449) |      1,754 | 1,766 (1,722–1,917) |           1,740 (1,716–1,803) |
| CLS                    |          0 |             0 (0–0) |             **0 (0–0)** |    .000547 | .000547 (0–.000547) | **.000547 (.000547–.000547)** |
| Total Lighthouse bytes |    435,618 |             435,618 |                 409,956 |    304,332 |             304,333 |                       278,665 |

EN median LCP improves 3.8% versus Phase 7 and 5.4% versus the fresh control;
HE improves 5.9% and 4.1%, respectively. TBT improves 7.3% / 27.8% versus Phase 7
and about 20% in both locales versus the fresh control. EN FCP/Speed Index did
not improve versus Phase 7; this is not a claim of improvement in every metric.
Mobile Performance ≥90, LCP ≤2.5s and TBT <200ms remain **unmet**.

| Encoded initial-resource bodies  | Pre-edit control |                Final |
| -------------------------------- | ---------------: | -------------------: |
| JS, every measured locale/device |          186,845 | **161,601 (−13.5%)** |
| EN mobile fonts                  |          189,064 |              135,388 |
| EN desktop fonts                 |          135,388 |              135,388 |
| HE mobile/desktop fonts          |           58,632 |               58,632 |

Resource probes exclude headers and are separate from Lighthouse total network
weight. Offscreen rendering changes when font subsets are requested; no font
files, glyphs or typography were removed. Hero derivatives remain 28,638 bytes
on mobile and 76,906 bytes on desktop. All runs retain Accessibility 100,
Best Practices 96 and SEO 100, with unchanged CLS.

Desktop sanity (one sample per locale) is EN Performance 99, LCP 755ms, FCP
380ms, TBT 16ms, Speed Index 756ms, CLS .00002535, total 407,573 bytes;
HE Performance 99, LCP 765ms, FCP 335ms, TBT 77ms, Speed Index 627ms,
CLS .00018217, total 332,018 bytes. Both control desktop scores were 99.
Compared with Phase 7's three-run desktop medians, HE TBT is higher (41→77ms)
and score 100→99; a single sanity sample cannot establish a causal regression.
EN/HE desktop LCP remains below one second and desktop functional gates pass.

See `baseline-summary.json`, `final-summary.json` and `comparison.json` for
unrounded results. All twelve final-source samples are retained. Experimental
and contended intermediate sets are documented and are not substituted for
the final isolated set. Settled inspection finds **zero geometry differences**
in all 84 text nodes per EN/HE mobile/desktop case.

## Long-task/TBT analysis and remaining cost

Three actual 4× CPU-throttled traces per locale, distinct from simulated
Lighthouse. Exclusive work and task duration are milliseconds; ranges include
all three traces. Blocking here covers the captured hydration interval and is
**not Lighthouse TBT**.

| Native/task metric                 |      EN baseline → final |        HE baseline → final |
| ---------------------------------- | -----------------------: | -------------------------: |
| Blocking above 50ms, median        | 1,473 → **782 (−46.9%)** | 1,605 → **1,003 (−37.5%)** |
| Blocking range                     |    1,457–1,571 → 438–898 |    1,133–2,105 → 897–1,051 |
| Largest task, median               |                920 → 430 |                1,093 → 505 |
| Exclusive Layout, median           |                744 → 357 |                1,275 → 335 |
| Exclusive UpdateLayoutTree, median |                 142 → 19 |                   133 → 21 |
| Exclusive Paint, median            |                  32 → 37 |                    64 → 57 |

The final blocking ranges lie below their baseline ranges for both locales.
The material native layout/long-task reduction meets the minimum Phase 7B
criterion; CSS rendering containment retains the real hydrated form.

Final sampled module cost below is median self / inclusive milliseconds. These
are profile attribution, not an additive waterfall or proof of zero cost when
a short function is unsampled. Framework inclusive ancestry includes child work.

| Retained module                | EN self / inclusive | HE self / inclusive |
| ------------------------------ | ------------------: | ------------------: |
| React DOM client               |           141 / 594 |           354 / 966 |
| React Server Components client |            21 / 135 |            54 / 186 |
| Turbopack runtime              |           315 / 385 |           360 / 455 |
| LeadForm                       |              9 / 39 |             25 / 78 |
| MobileLeadCTA                  |             12 / 16 |             32 / 32 |
| Header                         |              2 / 12 |              6 / 23 |
| ConsentManager                 |               0 / 3 |               0 / 4 |

LeadForm baseline inclusive medians were EN 186ms / HE 75ms; HE form/CTA and
framework samples individually did not improve. The dominant reliable reduction
is in native rendering, plus removal of the initial Mini/core dependency.
Analytics runtime is compiled into small shared modules and cannot be uniquely
separated in sampled frames; grouped module IDs remain explicitly labeled in
the evidence. Provider loading is absent, with zero external requests. Initial
Zod Mini/core is absent from final network bodies and sampled stacks; mandatory
server validation and deferred full form validation remain.

The retained stack still needs React DOM/RSC,
Turbopack/Next navigation, real RHF form hydration and immediately available
consent/navigation. These are residual costs in the approved architecture,
not a claim that all future optimization is mathematically impossible. Provider
adapters and complete form validation are already outside initial execution.
Further architectural replacement/deferment must prove identical immediate
CTA, keyboard, intent and failure behavior. No interaction system was removed
or disabled to make an audit score look better.

## Changed files

Application: sticky CTA; browser capture/payload; shared attribution rules and
browser parser; existing server attribution schema imports; landing CSS.
Tests: independent schema equivalence and performance E2E assertions.
Tooling: audit extension, CPU traces/compiled-chunk analysis, settled-layout and
comparison scripts. Documentation: implementation plan, this report, full
baseline/final/intermediate evidence. The complete path list is
[`changed-files.json`](performance/phase-7b/changed-files.json).

## Tests run / Tests result

- Unit: 122 passed in nine files; independent attribution oracle expanded.
- Typecheck and lint passed. Production builds passed.
- Mocked GA4/Meta campaign: 5 passed; mocked GTM campaign: 5 passed. Synthetic
  test-only IDs; every external request intercepted; no live provider endpoints.
- A first full E2E candidate found eight axe failures at the same offscreen
  Services contrast node. The correction passed both failing KA/RU journeys;
  a fresh full **232-test E2E/axe/responsive/cross-browser gate passed** (9.8m).
  It covers Chromium, Firefox and WebKit; EN/KA/RU/HE; 360, 390, 430, 768,
  1024, 1280, 1440 and 1920 widths; accessibility, console errors, overflow,
  consent/sticky behavior, SEO, lead validation/attribution and failure recovery.
- Production dependency audit: 0. Full audit: 5 inherited high findings in the
  development ESLint/fast-glob/micromatch/braces chain; no dependency changes or
  forced major upgrade were made. Machine audit responses are saved separately.
- Final isolated measurements: 12 Lighthouse audits and six CPU traces complete;
  four full-layout inspection comparisons have zero text geometry differences.
- Fresh read-only whole-patch review found no material implementation findings;
  measurements and gates were verified separately by the implementing agent.
- Final lint, format check, typecheck and unit rerun passed after measurements
  and documentation formatting; no application changes followed the full gate.

## Known issues / Pending inputs

Mobile preferred budgets remain unmet: EN/HE Performance 72/80, LCP 3.82/3.01s,
TBT 543/570ms. The smaller bundle and native rendering reduction do not eliminate
the retained Next/React initialization/hydration costs. Lab measurements are not
field Core Web Vitals or production hosting measurements. Historic HE regression
cannot be uniquely decomposed into all Phase 6→7 source/host contributions from
saved audits; current traces and the controlled font probe identify actionable
rendering contention without claiming a false single cause.
Production origin/contact details, real lead receiver, final OG configuration,
approved real analytics IDs and production QA remain separate inputs/gates.
Existing lead delivery remains safely unconfigured; unknown origins stay noindex.
KleekTo is unchanged and unconnected.

## Go / No-Go recommendation / Next step

**Phase 7B minimum acceptance is met:** material trace-backed long-task reduction,
lower EN/HE mobile LCP, smaller initial JS, unchanged CLS and
Accessibility/SEO/Best Practices, and preserved functionality in the full gate.
**No-Go for launch clearance under the preferred mobile budgets.** Review the
residual costs and remaining production inputs before authorizing Launch Readiness;
do not trade immediate form/consent readiness for a score. Stop after this
separate Phase 7B commit/push. Do not deploy,
merge to main or start Launch Readiness without user approval.
