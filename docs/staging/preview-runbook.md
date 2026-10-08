# Dragon Point preview audit runbook

## Current boundary

No staging target exists as of 2026-10-08; the owner confirmed this. No account,
project, DNS, domain, receiver or vendor ID was created. This runbook is preparation,
not evidence of a deployed site. Use the repository root and `codex/landing-mvp`.

## Owner/project verification before a preview

Provide an owner-authenticated Dragon Point project connected to
`shakogt-alt/dragon-point-site`. Verify team/owner, Git link, root directory `.`,
the exact reviewed commit and **Preview** environment. Keep production domain and
branch settings protected. Do not infer the project from a matching display name.
No `--prod`, promote, production indexing or DNS operation belongs to this phase.

`vercel.json` specifies Next.js, `npm ci` and `npm run build`; no IDs or credentials.
Use Node 24 LTS, consistent with the audited local runtime. Dependencies are pinned
by the existing lockfile. Keep framework-managed routing/image output; do not set
an output directory or static-export the dynamic lead/SEO routes.
Configuration reference: [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json).

For CLI work, install an owner-reviewed pinned CLI outside application dependencies,
then inspect existing context with `vercel project inspect --non-interactive`.
Stop on target mismatch or `link_required`; explicit owner setup supplies the link.
Authenticate through Vercel's supported flow; do not paste tokens into chat or
command arguments. Deploy only a verified preview of the reviewed source.
Existing approved deployment protection should stay enabled; use an approved
automation bypass privately if the owner provisions it, never in URLs/artifacts.

`.vercelignore` excludes private documents, visual sources, diagnostics, tests,
scratch and env files from source uploads. The Next public root remains `public/`;
source uploads and served files are different boundaries. Verify the real deployment
file inventory and served routes after hosting; do not assume an exclusion proves
every Git-integration/function-tracing behavior. Build inputs, public fonts/images,
font licenses and source are retained.
[Vercel exclusions reference](https://vercel.com/docs/deployments/vercel-ignore).

## Environment matrix (presence only, never values)

| Variable                              | Staging classification                                     | Current status             | Production requirement / action                                                  |
| ------------------------------------- | ---------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `SITE_ENV`                            | Required explicit `staging`                                | Real configuration missing | `production` only after separate approval                                        |
| `VERCEL_ENV`                          | Platform-managed `preview`; vetoes production              | No host                    | Verify platform target, do not manually spoof it on Vercel                       |
| `SITE_URL`                            | Leave empty unless confirmed production origin is supplied | Missing                    | Required final HTTPS origin for production SEO; never preview hostname           |
| `OG_IMAGE_URL`                        | Optional approved artwork; leave empty                     | Missing                    | Approved absolute HTTPS 1200×630 artwork before social launch                    |
| `LEAD_WEBHOOK_URL`                    | Optional confirmed isolated staging receiver               | Missing                    | P0: real durable receiver required before public lead collection                 |
| `LEAD_WEBHOOK_TOKEN`                  | Optional server-only credential, receiver-dependent        | Missing                    | Required if receiver requires auth; configure privately in scoped secrets        |
| `NEXT_PUBLIC_GA_ID`                   | Optional approved staging/test account; otherwise blank    | Blank                      | Optional production measurement requires reviewed IDs/account settings           |
| `NEXT_PUBLIC_GTM_ID`                  | Optional reviewed test container; otherwise blank          | Blank                      | Optional; replaces direct GA and requires both optional consents                 |
| `NEXT_PUBLIC_META_PIXEL_ID`           | Optional approved test pixel; otherwise blank              | Blank                      | Optional; requires Marketing and reviewed matching/automatic collection settings |
| `VERCEL_TOKEN`                        | CLI/CI authentication only, not application runtime        | Missing                    | Owner auth/access prerequisite; never Git/public env                             |
| `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID` | Confirmed CLI/project context, not invented                | Missing                    | Verified owner/project identity                                                  |

Use Preview-scoped configuration; do not pull/print production secrets. Leave
webhook and all vendor IDs blank in the initial preview. No lead submission can
claim successful delivery while the receiver is absent. `NODE_ENV=production`
describes build mode and does not authorize indexing. The existing SEO origin
contract is preserved: canonical/hreflang/JSON-LD URLs use only confirmed `SITE_URL`.
Never substitute request/forwarded host, `VERCEL_URL` or a guessed production domain.

## Real HTTPS audit protocol once prerequisites exist

Verify certificate/HTTPS, `/`→`/en`, direct navigation and refresh of EN/KA/RU/HE,
RTL, assets, selected image derivative, loaded fonts, menu/anchors, form/keyboard,
consent/sticky coordination, no mixed content or console/server errors. Independently
verify metadata **and** X-Robots-Tag `noindex, nofollow`, robots `Disallow: /`, empty
sitemap and environment guard; never publish preview URLs in sitemap.

Run isolated Lighthouse 13.5.0 with Phase 7B's Chromium version, all four categories,
default simulated throttling, fresh profiles and first-visit consent. Five sequential
samples each at EN/HE 390×844 DPR2; one sanity sample each at EN/HE 1440×900 DPR1.
Save all samples, independent metric medians and min–max ranges. Preserve raw traces
privately only when credential-free; do not archive authenticated browser state.
Measure Performance/A11y/BP/SEO, LCP/FCP/TBT/CLS/Speed Index/TTFB, total transfer,
encoded JS/fonts/Hero and long tasks. Compare with Phase 7B `final-summary.json`.
No real RUM/CrUX/field CWV claim follows from these laboratory measurements.
Preview noindex can intentionally fail Lighthouse's indexability SEO audit;
record that limitation without removing the guard to improve the score.

Before the warm-origin Lighthouse set, request HTML, one hashed JS chunk, a hashed
font and the mobile Hero derivative twice. Record Cache-Control, Age, Server,
X-Vercel-Cache, X-Nextjs-Cache and timing without cookies or credential headers.
Label a CDN cold miss only when headers prove it; a first local/client request does
not prove an edge miss. Do not purge shared caches or alter production assets.
Hashed JS/fonts should be immutable; HTML/SEO and `/api/leads` must retain their
appropriate dynamic/no-store policy. Inspect sensitive POST/error/405 responses too.

## Lead, campaign and privacy checks

Without a receiver, valid submission must fail safely with generic 503 plus localized
retry UX. Validate malformed input, honeypot, cross-origin requests, bounded rate
limit, timeout/failure and retry. Unit/mocked outcomes do not certify a hosted receiver.
If an isolated receiver is later confirmed, use clearly synthetic data (not a customer)
and confirm browser→API→durable receiver→2xx. Do not log names/phones/payloads.

Use `/en?utm_source=google&utm_medium=cpc&utm_campaign=staging-test` and
`/he?utm_source=meta&fbclid=staging-test`. Verify first-touch storage/payload across
locale changes, and no raw values in event/dataLayer/Meta parameters. With blank IDs,
no providers load and URL cleanup is not required; attribution still captures first.
Only approved test providers may require capture→non-navigation cleanup→consented
activation. External referrers remain fail-closed. Local synthetic provider builds
must intercept every vendor request and be replaced by a blank-ID build afterwards.

Check Necessary only, Analytics only, Marketing only, Accept all, revocation,
persistence/reopening, Hebrew RTL, duplicate events and no PII. Do not supply real
IDs merely to make an audit pass.

## Security / visual / device evidence

Check actual HTTPS HSTS, nosniff, referrer/frame/permissions headers, server disclosure,
API cache policy, unknown/unsupported/malformed paths and invalid methods. Local
headers are not proof of CDN behavior. Current CSP protects frame ancestors only;
it is **not** an XSS script policy. Before stricter CSP, add request-scoped nonces
for Next scripts and JSON-LD, inventory lazy chunks/images/fonts and post-consent
provider endpoints, then report-only test all locales/consent/lead/failure states.
Review actual approved GTM tags before building script/connect/img/frame allowlists.
Do not add a guessed broad provider allowlist, `unsafe-eval`, or a nonce shared across
cached HTML; enforce only after the report-only violations are resolved.
[Next response-header reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers).

Scan final served public files/client bundles for private values, local paths,
source maps, documents, `.env`/Git/source folders/test data/diagnostics and synthetic
IDs. Report filenames/counts only, not credential contents. Repeat against hosted
responses; local source/marker scans have bounded coverage.

Save nine real staging screenshots under `docs/screenshots/phase-8/`: EN desktop
1440, EN mobile 390, KA mobile 390, RU desktop 1440, HE desktop 1440, HE mobile 390,
EN mobile consent, HE mobile consent, EN mobile lead. Compare Hero/crop/fonts/RTL
and consent geometry with approved Phase 6/7 evidence. Do not call local/emulated
images staging or physical-device verification. Separately test current iPhone Safari
and Android Chrome on actual hardware with keyboard/menu/lead/consent/RTL checks.

## Release boundary

Complete the input matrix and production checklist in the Phase 8 report. Staging
success would authorize neither production indexing nor a launch. Obtain explicit
owner approval of the remaining P0/P1 findings and the exact tested release commit
before a separate production deployment/SEO activation.
