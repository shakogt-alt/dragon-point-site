# Phase 7B performance evidence

Base: `ea83cfc988fc0e2a0ab70ed4b085b12ab889f454`, repository
`shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`.

Production-build measurements use the Phase 7 setup: Windows, Node 24.17.0,
Next 16.3.8, Lighthouse 13.5.0, Playwright 1.63.0 Chromium 153.0.8010.12.
Mobile: 390×844 DPR2; desktop: 1440×900 DPR1. Each baseline/final set has five
sequential mobile samples per EN/HE and one desktop sample per locale. All four
Lighthouse categories run, with default simulated throttling, fresh browser
profiles and warm origin image derivatives. First-visit consent is present.
Only reserved `https://dragon-point.test` SEO fixtures and blank provider/delivery
configuration are used. No field CWV/INP or production hosting claim is made.

## Reproduce

Run from the requested source revision. `baseline|final` selects output names,
not Git revisions. Baseline evidence must not be overwritten with optimized code.
For baseline reproduction, copy only the diagnostic scripts into a clean checkout
of the base revision. Tool dependencies are isolated from application dependencies.

```powershell
npm ci
npx playwright install chromium firefox webkit
npm install --prefix .superpowers/phase-7/tools --no-audit --no-fund --save-exact lighthouse@13.5.0
$env:NEXT_PUBLIC_GA_ID = ''
$env:NEXT_PUBLIC_GTM_ID = ''
$env:NEXT_PUBLIC_META_PIXEL_ID = ''
npm run build
node scripts/mobile-trace.mjs final
node scripts/performance-audit.mjs final --phase7b
node scripts/analyze-mobile-traces.mjs final
```

Run timing audits in isolation from builds, E2E and other heavy local work.
The CPU diagnostic is separate from Lighthouse simulation: three fresh contexts
per locale, actual 4× CPU slowdown, unthrottled network, cold cache. It waits for
form hydration and consent initialization before stopping. Raw CPU profiles,
Chrome traces and browser state are retained under ignored `.superpowers/phase-7b/`;
compact attributed evidence is committed here. Browser-native font shaping cannot
be uniquely isolated with JS sampling; it is included in native Layout/program
work. Unobserved samples are not proof of zero execution cost.

## Evidence and units

- `baseline|final-summary.json`: independent metric medians/ranges. Times are ms,
  CLS is a fraction, transfer is bytes, scores are 0–100. Missing metrics fail.
- `baseline|final-lighthouse.json`: all twelve samples, exact config, audit details.
- `baseline|final-assets.json`: actual network/encoded bodies, selected Hero,
  loaded fonts and settled text bounds. Body bytes exclude headers.
- `baseline|final-bundle.json`: minified production chunk AST spans and manifest
  entry IDs. Acorn is supplied by the locked ESLint dependency tree. Individual
  module gzip sizes are **not additive**; network bodies supply exact totals.
  Unresolved shared/Next module IDs remain explicitly unresolved.
- `baseline|final-trace-analysis.json`: exclusive trace categories, long tasks,
  generated-frame module attribution and inclusive/self CPU samples. Inclusive
  ancestry overlaps; do not sum it. Diagnostic blocking over 50ms is over the
  captured interval and is **not Lighthouse TBT**.
- `offscreen-trace-analysis.json`: controlled pre-edit CSS response experiment.
  It skips all non-Hero sections for diagnosis only; its broad policy was rejected
  by the goal-click regression test and is not the final application policy.
- `ttf-trace-analysis.json`: a controlled response experiment using the complete
  original Hebrew TTF in place of the complete WOFF2. Everything else uses the
  same optimized build. This isolates container/timing contribution, not all
  historical Phase 6→7 changes; neither experiment is used for final scoring.
- `audit-production.json`, `audit-all.json`: separate production/development risks.
- `comparison.json`: Phase 7 final, new five-run control and final measurements.

The production Turbopack analyzer was also run with `next build --experimental-analyze`.
All fourteen client JS content hashes matched its preceding ordinary build.
Its internal output names are not assumed to match deployed chunk hashes; AST
spans and the deployed manifest identify the actual files and client entry points.

## Intermediate sets and settled inspection

`candidate-static-*` keeps goals and form normally rendered. It passed access
checks but retained substantial layout cost. `candidate-form-*` retains native
form rendering deferral and coalesced CTA reads, but its full gate exposed the
Services offscreen axe-geometry issue. The final policy excludes Services too.
`candidate-services-contended-*` has the final application policy, but a lint
run overlapped a measurement; the entire set is retained and is excluded from
comparable final metrics. No samples were removed based on their scores.

The TTF experiment uses the static candidate, with three samples per locale;
it is not a final-source Lighthouse comparison. `baseline-source-breakdown.json`
retains actual analyzer source part sizes and the ordinary/analyzer client hash
comparison inputs. `settled-layout.json` compares all 84 text nodes per EN/HE
mobile/desktop case. Its script reveals sections for full-page inspection only,
separately from timing/initial-resource measurements; browser auto rendering
otherwise intentionally skips offscreen paint in full-page screenshots.

After the final isolated audits:

```powershell
node scripts/settled-layout.mjs
node scripts/summarize-mobile-performance.mjs
```
