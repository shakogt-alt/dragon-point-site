# Phase 7 reproducible lab evidence

Baseline source: `b6694ca9d5ec3d3be9a958aa8f3eb0aecd98967a` on
`shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`. Baseline was built
and measured before application changes. Final evidence measures this Phase 7 patch.

These are local production-build lab results, **not production RUM, field INP,
or guaranteed production Core Web Vitals**. See `docs/phase-7-report.md` for
limitations, target attainment and remaining risks.

## Setup

- Windows; Node 24.17.0; Next 16.3.8; Lighthouse 13.5.0; Playwright 1.63.0
  Chromium 153.0.8010.12 (revision 1243).
- Production server on loopback `127.0.0.1:3305`. `SITE_URL` uses only the
  existing reserved `https://dragon-point.test` SEO test fixture. It is not a
  production domain or application default. All analytics IDs, webhook/token
  and final OG image configuration remain blank.
- EN/HE at 390×844 DPR2 and 1440×900 DPR1. Three sequential audits per case;
  separate fresh Chrome profiles, cold browser cache, first-visit consent UI.
  Probes warm the origin's image derivatives consistently before both sets.
- Default Lighthouse mobile/desktop simulated throttling, with viewport/DPR
  overrides only. Exact `configSettings`, user agent and fetch times are stored
  with every run. Run in isolation from builds, E2E and other heavy local work.
- All Performance/Accessibility/Best Practices/SEO audits are enabled. No real
  functionality is removed for measurement; no performance timing limits in CI.
- Chrome DevTools MCP was unavailable. The audit uses Lighthouse plus Playwright
  CDP for network/resource/layout observations. Chromium is the same pinned
  Playwright executable for both tools.

## Reproduce

Use the respective source revision with its matching production build; the
saved baseline is immutable evidence from the baseline revision.
For a baseline reproduction, copy only this phase's `scripts/performance-audit.mjs`
into a clean baseline checkout as an audit utility; do not apply the application patch.

```powershell
npm ci
npx playwright install chromium firefox webkit
npm install --prefix .superpowers/phase-7/tools --no-audit --no-fund --save-exact lighthouse@13.5.0
$env:NEXT_PUBLIC_GA_ID = ''
$env:NEXT_PUBLIC_GTM_ID = ''
$env:NEXT_PUBLIC_META_PIXEL_ID = ''
npm run build
node scripts/performance-audit.mjs final
node scripts/interaction-audit.mjs
node scripts/summarize-performance.mjs
```

The audit dependencies are isolated and do not change application dependencies
or the lockfile. `baseline|final` selects evidence filenames; it does not switch
Git revisions or build source. Do not overwrite saved baseline with optimized code.

## Files and units

- `baseline|final-summary.json`: per-case medians of three independent runs;
  milliseconds for timing, fractions for CLS, bytes for transfer weight,
  scores in 0–100. Medians are calculated separately per metric, not a selected
  favourable run. Missing numeric metrics fail the audit instead of becoming zero.
- `baseline|final-lighthouse.json`: compact complete audit summaries for all
  12 runs per stage; detailed network, unused-JS/CSS, main-thread, font, image,
  LCP and CLS observations. Excludes huge embedded screenshots and full traces.
- `baseline|final-assets.json`: actual CDP requests, cache headers and transferred
  lengths; resource timing encoded/decoded bodies, font status, selected image,
  settled text bounds, raw build chunk sizes. HTTP header bytes are included in
  CDP transfer lengths, excluded from encoded body sizes; raw JS bytes are not
  compressed network bytes. The JSON exposes local fixture URLs only.
- `interaction-layout.json`: four-locale 390px observations across font/image
  completion, consent, compact Header, sticky CTA, errors and success. Raw
  layout-shift entries distinguish recent input. Approved Header offset changes
  and user-initiated form reflow are recorded rather than relabelled as field CLS.
- `audit-production.json`, `audit-all.json`: current dependency audit responses;
  production audit must be read separately from development findings.
- `comparison.json`: before/after encoded body sizes, medians, selected images
  and settled text geometry; rebuild with `scripts/summarize-performance.mjs`.
- `changed-files.json`: complete Phase 7 path list, including generated font assets.

Font derivation is reproducible with `fonttools==4.66.1`, `brotli==1.2.0` and
`scripts/build-webfonts.py`. All original source/notice files remain intact.
The generated manifest hashes sources and outputs, verifies all original cmap
characters and individual glyph outlines/advances. Complete original FiraGO is
retained for unrestricted input to preserve cross-shard kerning/mark shaping;
E2E compares actual browser shaping against the original font. KA/RU combined faces keep punctuation, Latin, marks and the active script in the same
physical face; E2E checks the entire dictionary corpus against original weights. Native
`unicode-range` delivery for dictionary text retains all source characters and
OpenType feature closure; unused scripts and weights remain available on demand.

Reference APIs: [Next Image](https://nextjs.org/docs/app/api-reference/components/image),
[Next Font](https://nextjs.org/docs/app/api-reference/components/font),
[Lighthouse emulation](https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md),
[Lighthouse throttling](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md),
[FontTools subset](https://fonttools.readthedocs.io/en/latest/subset/index.html),
[Zod Mini](https://zod.dev/packages/mini).
