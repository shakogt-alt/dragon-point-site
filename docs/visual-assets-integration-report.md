# Visual Assets Integration Pass

Date: 2026-10-07. Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`. Base: Phase 4,
`fbfd4beb57f3d3f366f05f99ac29bff622c5f3d6`.
Implementation checkout: `C:/Users/SGT/Documents/Codex/dragon-point-site`.

The named checkout had a separate local Foundation commit. It was preserved on
`codex/foundation-local-backup-1f994b4` before aligning the requested branch with
remote Phase 4. Local source/reference folders remain intact and are excluded
from Git using checkout-local `.git/info/exclude`; they are not deployed.

## Source assets reviewed

All six files, with no nested folders, in `dragon-point-visuals/` were inspected:
five PNGs and all six rendered PDF pages. See
[complete inventory](visual-assets-inventory.md) for classification, dimensions,
size, transparency, readiness and intended use. Original SHA-256 hashes and byte
sizes are recorded in [source manifest](visual-assets-source-manifest.json).

## Assets used

`Architecture_Illustrative.png`, 1600 × 900, RGB, 1,747,539 bytes. The supplied PDF
explicitly describes it as illustrative architectural photography. Its use does
not represent a verified property, a listing or an available development.

## Assets intentionally not used

- `Mockup_Exterior_Signage.png`: signage concept, not proof of an actual office.
- `Mockup_Office.png`: office visualization, not a confirmed office photograph.
- `Mockup_Merch.png`: merchandise visualization, unrelated to lead conversion.
- `Mockup_Stationery.png`: print reference, not an independently usable logo.
- `Dragon_Point_Merch_and_Mockups.pdf`: reference presentation; no PDF or extracted
  mockup images are shipped to the browser.

No supplied file is a final standalone logo, data graphic, icon, pattern or
approved 1200 × 630 OG image. The existing swappable wordmark, Footer, Technology
diagram and other section backgrounds were retained after review. This avoids
manufacturing a logo, implying a real office or adding repetitive photography.

## Where each selected asset was applied

The shared Hero uses `ArchitectureVisual` in EN / KA / RU / HE. Photography sits
beside the copy on desktop, with a deliberate portrait crop, and after the copy
and CTAs on mobile, in a landscape frame. The physical crop remains at 70% center
in both LTR and RTL. Photography and branding are never mirrored. The original
Hero messaging, H1 and CTA behavior are preserved.

## Optimized/derived files created

- `public/images/architecture/illustrative-building.webp`: 1600 × 900, RGB,
  229,262 bytes (about 224 KiB), no transparency. Derived using Sharp WebP quality
  88, effort 6, without resizing or cropping the source. Approximately 87% smaller
  than the PNG. No unnecessary duplicate AVIF or mockup exports are shipped.
- Ten PNG review screenshots under `docs/screenshots/visual-assets-pass/`, listed
  below. These are documentation assets, outside the public application directory.

Reproduction from the unchanged local source:

```js
await sharp('dragon-point-visuals/Architecture_Illustrative.png')
  .webp({ quality: 88, effort: 6 })
  .toFile('public/images/architecture/illustrative-building.webp');
```

## Visual changes

| Before                       | After                                                                                    | Why                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Temporary wireframe building | Supplied architectural image with a restrained structural grid and violet analysis frame | Connects property imagery to the analytical positioning without invented data.                       |
| Abstract visual caption      | Localized illustration disclaimer and descriptive image alt                              | Avoids presenting the illustration as a real listing; supports screen readers.                       |
| Geometry-only Hero panel     | Neutral grayscale photograph, unchanged brand tokens and section surfaces                | Adds architectural detail while retaining the approved palette, whitespace and light/dark direction. |

The overlay has decorative semantics, no fabricated measurements, prices, yields
or live-data claims. There are no new animations, parallax, autoplay or client
state. Logical layout and directional CTA/process behavior remain unchanged.

Full-page review:

- [EN desktop 1440](screenshots/visual-assets-pass/en-1440.png)
- [EN mobile 390](screenshots/visual-assets-pass/en-390.png)
- [RU desktop 1440](screenshots/visual-assets-pass/ru-1440.png)
- [KA mobile 390](screenshots/visual-assets-pass/ka-390.png)
- [HE desktop 1440](screenshots/visual-assets-pass/he-1440.png)
- [HE mobile 390](screenshots/visual-assets-pass/he-390.png)

Hero comparison:

- Desktop: [before](screenshots/visual-assets-pass/en-1440-hero-before.png) /
  [after](screenshots/visual-assets-pass/en-1440-hero-after.png)
- Mobile: [before](screenshots/visual-assets-pass/en-390-hero-before.png) /
  [after](screenshots/visual-assets-pass/en-390-hero-after.png)

## Performance considerations

`next/image` supplies responsive optimized WebP derivatives with explicit source
dimensions. The CSS frame reserves space before loading. Only the Hero image is
preloaded; there are no new below-the-fold raster images requiring lazy loading.
No large originals, PDF, external image URLs, extra runtime dependency or remote
image configuration was added.

Desktop `sizes` accounts for the full landscape pixel width needed by the portrait
cover crop. Initial visual review caught an undersized 640px derivative; this was
corrected and a regression assertion now rejects insufficient natural height.
Browser inspection and the refreshed screenshot confirm the corrected detail.
Compression and the neutral CSS treatment leave the source library untouched.
At EN 1440px / DPR 1, the final browser selected a 1200px WebP derivative:
76,906 bytes, natural height 675px for the 663px rendered image. This avoids the
earlier crop upscaling while keeping the desktop response well below 300 KB.

This pass does not claim Lighthouse scores or measured production LCP. Production
hosting, browser density, caching and network conditions still need measurement.

## Tests run

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`, including axe WCAG 2 A/AA and 2.1 AA
- Production dependency audit, source SHA-256/size comparison, `git diff --check`,
  browser image inspection, screenshot review and independent read-only review

## Tests result

Lint, formatting, typecheck, 78 unit tests across four files and production build
passed. The final full E2E run passed all 94 tests in 3.0 minutes, including the
crop-resolution assertion and regenerated screenshots. The earlier full run also
passed, before visual review identified and corrected the resolution issue.
All 16 axe analyses in the full suite reported zero WCAG violations. Production
dependency audit reported zero findings.

The complete matrix is EN / KA / RU / HE at
360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px. Coverage includes image
decoding, dimensions, localized alt, no mirroring, decorative overlay, no overflow,
console/page errors, keyboard/navigation, mobile menu and RTL process direction.
Four delayed-image tests passed with identical reserved frame bounds before and
after the response. No broken images, horizontal overflow, browser console/page
errors or RTL regressions were observed in the tested matrix.
Existing lead-flow, attribution, API rejection, sticky CTA, consent interaction,
SEO and indexing tests remain in the full suite. No real lead receiver is used.

All six original files match their recorded hashes and sizes. Independent review
approved the corrected implementation; no unresolved code findings remain.
The checkout's CRLF formatting failure was reproduced and fixed with LF text
attributes and local normalization. There is no content diff in lead or SEO code.

## Known issues

- The architecture asset remains illustrative; it is not a verified listing.
- Five existing high findings in development dependencies remain. Lockfile and
  dependency versions were not changed by this pass.
- Browser QA uses Chromium, not a physical device or cross-browser matrix.
- Existing delivery/indexing limitations remain: no configured real lead receiver;
  no production domain means deliberate noindex and no invented absolute SEO URL.

## Assets requiring user approval

Final standalone Dragon Point logo exports, including dark/light/compact/symbol
variants, are still required. The references show an angular symbol but do not
designate a final production master. No symbol was extracted or redrawn. A final
approved 1200 × 630 social image is also absent; `OG_IMAGE_URL` behavior is intact.
The supplied Hero composition and crop are ready for this visual review.

## Pending production inputs

- Confirmed production HTTPS origin and final OG artwork/public URL.
- Final logo assets and any final property photography with confirmed usage.
- Real contact information, social URLs, legal/privacy copy and locale editorial
  review; existing lead receiver contract and credentials remain pending.

## Recommended next step

Review the supplied screenshots and explicitly approve the visual integration
before Phase 5. This pass is delivered as a separate commit on
`origin/codex/landing-mvp`, with remote HEAD and clean checkout verified at handoff.
Analytics and KleekTo integration were not started.
