# Phase 8 — Staging & Launch Readiness Audit

Date: **2026-10-08**, Asia/Tbilisi. Repository `shakogt-alt/dragon-point-site`,
branch `codex/landing-mvp`; verified starting HEAD
`e6e8f6bfca75fb7b1fd38517a7a35c09274baa41`. All four requested documents were
read completely before changes. Phase 1–7B styling, components, locales,
attribution, lead payload/service, consent contracts, privacy, SEO and visuals
are preserved. KleekTo remains untouched and unconnected.

## Completed / Staging environment status

**Preparation-only fallback, not a completed hosted staging audit.** The owner
confirmed there is no existing Vercel project or preview URL. Repository has no
`.vercel` link, real env file or installed Vercel CLI. No matching repository/name
projects or teams were returned by the available authenticated connector.
No accounts, projects, IDs, DNS, production domains or deployment were created.

Deployment URL: **none**. Exact missing input: owner-authenticated Dragon Point
project linked to this repository, verified Preview environment/branch/source
commit and an accessible HTTPS preview URL. Tokens must be configured privately,
not pasted into chat. [Target inventory](audits/phase-8/target-inventory.json)
records presence/status only.

The authorized fallback includes deployment configuration, a reproducible runbook,
local production-build staging-mode observations, a fresh regression gate and
launch blocker/input/checklist matrices. Local evidence does **not** certify
HTTPS/CDN, a real lead receiver, hosted visuals or physical devices.

## Deployment configuration / Changed files

- `vercel.json`: Next.js framework, `npm ci`, `npm run build`; no credentials,
  environment values, domains, IDs, routing overrides or production activation.
- `.vercelignore`: excludes private source documents/visual folders, scratch,
  tests, env files and diagnostics from uploads; retains application/assets/build
  inputs. Source uploads are distinct from publicly served Next files. Actual
  hosted file inventory remains to be verified.
- `next.config.ts`: nosniff, strict-origin-when-cross-origin, frame DENY and CSP
  `frame-ancestors 'none'`, permissions for unused camera/microphone/geolocation,
  and explicit no-store for all `/api/leads` methods. Existing hashed-font caching
  and disabled X-Powered-By are preserved. No script/connect CSP restriction.
- `src/proxy.ts`: pathname-only invalid-encoding guard, generic empty 400 and
  no-store; retains the existing environment-aware noindex header. Query capture,
  lead/analytics behavior and production indexability policy are unchanged.
- Tests/config: six HTTP-boundary E2E cases integrated into the full suite, plus
  an actual eight-second aborted-receiver unit regression with intercepted fetch.
- Tooling/docs: local audit script, sanitized evidence, this report, the plan,
  staging runbook and corrected Phase 5B wording in `.env.example`.

Headers and malformed-path handling were tested RED→GREEN rather than inferred
from configuration text. Complete file list: [changed-files.json](audits/phase-8/changed-files.json).
The [preview runbook](staging/preview-runbook.md) covers project identity,
environment classification, deployment boundaries and all blocked host checks.

## Functional results

Local production build with `SITE_ENV=staging`, `VERCEL_ENV=preview`, empty
`SITE_URL`, blank provider IDs and no receiver:

- `/` returns 307 to `/en`; all four locale routes return 200 and survive direct
  navigation/refresh. One H1, correct document lang/direction, loaded fonts,
  selected Hero image, no overflow, no client errors or external requests in
  recorded healthy journeys. HE retains `lang=he`, `dir=rtl`.
- Unsupported `/fr` and unknown `/en/unknown` return 404. Private/env/Git/document
  paths are not served. The visual-source trailing slash redirects to its
  normalized path, whose final response was verified as 404.
- Invalid lead methods GET/PUT/DELETE return empty 405 with no-store.
- Diagnostic malformed `/%ZZ` initially returned generic 500, without public
  stack/local paths. A dedicated regression reproduced it. The pathname guard
  rejects malformed percent/UTF-8 encoding before downstream locale/router
  decoding; all three malformed fixtures now return empty 400/no-store/noindex
  responses. The final six-case HTTP boundary gate passed.

Detailed local headers/status/assets/refresh evidence:
[local observations](audits/phase-8/local-staging-observations.json).
No real host redirects, TLS, mixed-content/host logs or edge responses were tested.

One initial full E2E run returned 237 passes and one Firefox/EN failure. Its trace
shows the locator evaluation never completed before the five-second polling
deadline, with no failed geometry result. Three unchanged serial reproductions
passed. Exact transient browser/protocol cause was not conclusively established;
no UI, assertions, timeouts or retries were changed to hide it. The final full
suite was repeated without concurrent heavy checks: all 238 tests passed with
zero retries. The initial failure remains recorded as P2 reliability history.

## Mobile performance

**Actual staging Lighthouse/CPU audit: blocked, no target.** No new CDN numbers,
TTFB, cache hit rate or field Core Web Vitals are claimed. The requested five
mobile samples per EN/HE and desktop sanity remain a hosted audit prerequisite.

Historical Phase 7B localhost lab medians, not Phase 8 staging measurements:

| Case    | Performance / A11y / BP / SEO | LCP ms | FCP ms | TBT ms |       CLS | Speed Index ms | Total bytes |
| ------- | ----------------------------- | -----: | -----: | -----: | --------: | -------------: | ----------: |
| EN 390  | 72 / 100 / 96 / 100           |  3,818 |  1,752 |    543 |         0 |          2,093 |     409,956 |
| HE 390  | 80 / 100 / 96 / 100           |  3,011 |  1,267 |    570 |   .000547 |          1,740 |     278,665 |
| EN 1440 | 99 / 100 / 96 / 100           |    755 |    380 |     16 | .00002535 |            756 |     407,573 |
| HE 1440 | 99 / 100 / 96 / 100           |    765 |    335 |     77 | .00018217 |            627 |     332,018 |

Phase 7B initial encoded JS was 161,601 bytes; EN/HE mobile fonts 135,388/58,632;
mobile Hero 28,638 bytes. Its five-run ranges and underlying traces remain in
[Phase 7B evidence](performance/phase-7b/README.md), unchanged. Local mobile budgets
≥90 / LCP≤2.5s / TBT<200ms remain unmet. Actual hosted results may differ and must
be measured; lack of a CDN is not evidence that hosting will resolve CPU blocking.
Preview noindex may intentionally fail Lighthouse's indexability SEO audit; retain
the indexing guard and explain that finding instead of removing it for a score.

## CDN/cache results

**CDN cold/warm: not tested.** The local script records two requests per observed
asset with allowlisted response/cache headers and body sizes. These establish
local policy/origin behavior only; first request does not prove a cold CDN edge.
Hashed JS/fonts retain immutable long-lived cache policy, HTML/crawlers remain
dynamic, and lead responses including invalid methods have no-store. Do not
publish a CDN performance/HTTPS/HSTS claim from localhost observations.
The runbook specifies cold/warm HTML/chunk/font/Hero checks, Age and edge/origin
cache-status interpretation, with no shared cache purge or dynamic caching change.

## Lead System result

**P0 production blocker: lead receiver not configured.** No real destination,
token, CRM or KleekTo was invented. An unconfigured valid request returns generic
503/unavailable and visible localized retry UX rather than a false success.

Server tests cover normalization/strict validation, international phone,
streamed body limit, JSON MIME, cross-origin rejection, honeypot, bounded rate
limiting/Retry-After, configured 2xx adapter responses and failure. A new intercepted
stalled-receiver test waits for the actual eight-second AbortSignal deadline,
verifies generic failed delivery and confirms no error logging. Existing E2E
covers invalid form input, intent/focus, all locales,
generic error, retained values, retry and mocked success. Success fixtures verify
UI contracts only; they do not prove browser→hosted API→durable staging receiver.
No real staging receiver or customer record was used. In-memory limiting is
per process/instance and can reset on cold starts; distributed protection remains
an infrastructure follow-up, with the existing bounded behavior unchanged.

## Attribution result

First-touch fields and payload contract remain unchanged. Both local mocked vendor
variants cover EN/HE campaign entry, capture before cleanup/provider execution,
non-navigation clean URL, persistence/locale switching, saved consent, blocked
storage, referrer fail-closed and raw-value exclusion. Full lead tests independently
check all campaign fields and original landing URL in the submitted payload.

Actual staging campaign URLs specified by the brief were **not visited on a real
host**. With blank IDs no provider preparation/load occurs; cleanup is not required
merely to capture first-touch. No real UTM/click/referrer values were exposed to
GA4/GTM/Meta. No analytics event names or PII allowlists changed.

## Analytics/consent result

Final application build has blank GA4/GTM/Meta IDs. Local synthetic-ID builds run
only intercepted provider mocks, then are replaced by a blank-ID production build.
No real endpoints/accounts/container activation occurred. Necessary/Analytics/
Marketing categories and EN/KA/RU/HE wording/UI remain intact.

Regression coverage includes no optional requests before consent/with blank IDs,
single-purpose consent, Accept all/Necessary only, revocation, persistence,
reopening, Hebrew RTL, keyboard/sticky coordination, no duplicate funnel/provider
events and no PII in allowed payloads/dataLayer/Meta parameters. Real vendor
account/container configuration and hosted provider behavior remain unverified.

## Security result / Error behavior

Local response headers now protect content sniffing, cross-origin referrer detail
and embedding; unused camera/microphone/geolocation are denied. The app's
X-Powered-By header remains absent. HSTS and hosting Server/CDN disclosure must be
checked on the real HTTPS host; no domain-wide preload/includeSubDomains policy
was guessed. `/api/leads` stays uncached across sensitive/error/unsupported methods.

CSP currently enforces **frame ancestors only**, not a production XSS script
policy. Exact follow-up: implement request-scoped Next/JSON-LD nonces, inventory
actual approved script/connect/img/font/frame origins, run a report-only policy
against all localized hydration/lazy validation/consent/provider/failure states,
resolve violations and review the approved GTM tag inventory before enforcement.
No guessed restrictive CSP or unsafe script exception was added.

Local final static/public output is checked for source maps, private path names,
actual local filesystem path markers, test records/IDs and any configured private
values, with filenames/counts only. Scope/limitations and asset hashes are in
[public-output-scan.json](audits/phase-8/public-output-scan.json). No real credentials
exist here, so a zero match is bounded local evidence, not a certification of
every unknown secret or a deployed host. Hosted served-file/bundle scan remains
mandatory after a legitimate preview. Neither lead payloads nor credentials are
logged or committed.

## SEO result

Existing getSeoConfig, metadata, crawler builders and JSON-LD are unchanged.
Local staging and Vercel-preview veto tests independently verify metadata and
X-Robots-Tag `noindex, nofollow`, robots Disallow and an empty sitemap. Preview
hostnames are not inferred from incoming headers or VERCEL_URL. `SITE_URL` stays
empty until the production origin is confirmed; absolute SEO URLs are then
omitted, preserving the existing safety contract.

Production indexability tests use the reserved `.test` fixture only. They preserve
EN/KA/RU/HE canonical, reciprocal hreflang, x-default /en, sitemap, JSON-LD languages,
localized OG/Twitter and `he_IL`. No actual deployment or public indexing was
enabled by running the local production-build/SEO fixture tests.

## Visual regression / Physical-device status

Approved Hero image/crop, font files/manifests, CSS, dictionaries and component
tree are unchanged in this patch. Existing geometry/shaping/RTL/consent/sticky and
responsive regression tests are rerun; hosted image/font/cache distortion cannot
be assessed without hosting. Approved historic screenshot files regenerated by
tests are restored rather than substituted as Phase 8 evidence.

**Real staging screenshots: not produced, no staging exists.** The nine required
targets and Phase 6/7 comparisons are listed in the runbook; no local screenshots
are mislabeled as `docs/screenshots/phase-8` staging images.
**Physical iPhone/Safari and Android/Chrome: not tested.** Playwright Chromium,
Firefox and WebKit/emulation are local browser regressions, not real-device proof.

## Remaining launch inputs

| Input                       | Current status                                | Required before launch?                       | Owner action                                                                                     |
| --------------------------- | --------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Staging account/project/URL | None; owner confirmed                         | Yes, for hosted gate                          | Supply authenticated Dragon Point project connected to this repo and preview URL                 |
| Production domain           | Unconfirmed; SITE_URL empty                   | Yes                                           | Confirm final HTTPS origin; configure only in separately approved production target              |
| Public phone                | Unprovided; placeholder                       | Decision required; publication optional       | Supply verified number or approve form-only contact model                                        |
| WhatsApp                    | Unprovided                                    | Only if published/used                        | Supply verified destination; approve visibility                                                  |
| Public email                | Unprovided                                    | Decision/legal review required                | Supply verified public contact or approve another reviewed contact model                         |
| Office address              | Unknown, not published                        | Only if published/required by reviewed copy   | Provide verified address or approve omission                                                     |
| Social URLs                 | Unknown, no dead links                        | No, unless published                          | Supply verified brand URLs or keep absent                                                        |
| Lead receiver               | Unconfigured; valid request fails safely      | **Yes, P0**                                   | Provide isolated staging test receiver then durable production destination/auth; verify delivery |
| Final logo                  | Replaceable typographic composition retained  | Asset or explicit approval required           | Supply locked assets or approve current composition for launch                                   |
| Photography                 | Approved illustrative Hero retained           | Replacement optional; asset approval required | Approve continued illustrative use or supply final licensed photography                          |
| OG image                    | Framework ready; no approved configured image | Yes for intended social launch                | Supply approved hosted 1200×630 artwork and verified URL                                         |
| Legal/privacy copy          | Pending-input disclosure                      | **Yes before public collection**              | Have owner/legal reviewer supply and approve actual copy; no fabricated legal text               |
| Consent wording             | Existing four-locale wording unchanged        | Approval required                             | Approve purposes/storage/provider disclosures with final configuration                           |
| GA4                         | Blank readiness only                          | No if tracking remains off                    | If used, approve ID/account settings and consent/privacy QA                                      |
| GTM                         | Blank, optional                               | Only if used                                  | Approve container/tags/consent template and test environment; requires both consents             |
| Meta Pixel                  | Blank, optional                               | Only if used                                  | Approve pixel/account settings; disable unreviewed automatic matching/form collection            |
| Search Console              | Not configured                                | Post-launch task                              | Verify final origin ownership after approved launch; submit production sitemap                   |
| Native HE editorial signoff | Not evidenced                                 | Yes for public localized copy                 | Native reviewer approves all visible/SEO/privacy/consent text                                    |
| Native KA editorial signoff | Not evidenced                                 | Yes for public localized copy                 | Native reviewer approves all visible/SEO/privacy/consent text                                    |
| Physical mobile QA          | Unperformed                                   | Explicit owner QA decision                    | Test actual current iPhone/Android; record devices/browser versions/results                      |

## P0 / P1 / P2 / P3 findings

| ID    | Priority | Status / impact                                                                                      | Required action                                                                                                                    |
| ----- | -------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| L8-01 | P0       | No verified hosting/HTTPS staging target; real environment gate cannot execute                       | Owner-authenticated project/repo/preview URL, then complete hosted audit                                                           |
| L8-02 | P0       | No real lead destination: site cannot fulfil advisor enquiries                                       | Confirm durable receiver/auth and controlled staging delivery; no false success                                                    |
| L8-03 | P0       | Production origin and public data/privacy approval unresolved                                        | Confirm HTTPS origin, approved contact model and reviewed privacy/consent copy before collection                                   |
| L8-04 | P1       | Mobile performance budgets unmet locally; CDN/device outcome unverified                              | Hosted repeated measurements, then remedy or explicit reviewed budget decision before public launch                                |
| L8-05 | P1       | Final brand/OG/editorial signoff not evidenced                                                       | Owner asset/current-composition decision, OG artwork and native HE/KA approval                                                     |
| L8-06 | P2       | Full audit retains five high dev findings; production audit zero                                     | Review compatible tooling-chain upgrade independently; do not force unrelated major downgrade                                      |
| L8-07 | P2       | CSP frame-only, no tested nonce/script policy                                                        | Execute the explicit report-only/nonce/provider inventory work item before stricter enforcement                                    |
| L8-08 | P2       | Physical devices and distributed rate limiting not verified/provisioned                              | Owner device QA decision; assess per-instance protection with actual hosting traffic                                               |
| L8-09 | P3       | Search Console, sitemap submission and field measurements not configured                             | After separately approved launch, verify origin and consented measurement setup                                                    |
| L8-10 | P2       | One transient Firefox test/protocol stall in the initial full run; three serial reproductions passed | Retain failure history and monitor isolated/CI browser reliability; do not weaken visibility assertions                            |
| L8-11 | P2       | Audit helper accepts a compatible stale listener on fixed port 3308 without verifying child startup  | Before reusing the helper, fail closed on an occupied port and child startup/exit; no evidence that this affected the recorded run |

Resolved during this audit: missing conservative security headers, no-store
on framework-generated API methods and the malformed-path generic 500. All six
HTTP-boundary regressions passed; no known failure is classified as success.

## Production launch checklist — preparation only

- [ ] Resolve P0/P1 findings and approve exact release commit; complete real staging
      HTTPS/cold-warm CDN/performance/function/security/visual gate.
- [ ] Confirm final HTTPS domain/owner/project and isolation of Preview versus
      Production env/secrets; do not use a preview hostname for SITE_URL.
- [ ] Verify durable lead delivery, privacy/consent/contact/editorial/asset approvals.
- [ ] Configure approved production SITE_URL and production environment **only in
      a separately authorized production launch**, retaining preview noindex veto.
- [ ] Verify self-canonical EN/KA/RU/HE, reciprocal hreflang, x-default /en, one H1,
      localized metadata, production robots/sitemap, OG 1200×630 and
      Organization/RealEstateAgent/WebSite known-data JSON-LD.
- [ ] Verify host security/cache policy, final blank/reviewed provider configuration,
      no public secrets/diagnostics/test IDs and consent-gated behavior.
- [ ] Verify current real mobile devices or obtain an explicit owner QA decision;
      retain safe failure/retry and RTL behavior.
- [ ] After approved launch, verify Search Console ownership and submit production
      sitemap; collect field/RUM only through separately approved privacy-safe setup.

## Tests run / Tests result

| Check                                 | Result                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run lint`                        | Passed, exit 0                                                                                               |
| `npm run format:check`                | Passed, exit 0                                                                                               |
| `npm run typecheck`                   | Passed, route type generation and TypeScript, exit 0                                                         |
| `npm test`                            | 123 passed across 9 files, including actual eight-second delivery abort                                      |
| `npm run build`                       | Passed; final staging-mode production build has blank vendor/delivery config                                 |
| `npm run test:e2e`                    | Final isolated full run: 238 passed, zero failed/retried, 8.8 min; initial transient failure disclosed above |
| GA4/Meta intercepted campaign variant | 5 passed, final source, 16.9 s                                                                               |
| GTM intercepted campaign variant      | 5 passed, final source, 15.8 s                                                                               |
| New HTTP boundaries                   | 6 passed, after observed header/malformed-path RED cases                                                     |
| Local audit                           | 19 route probes, 4 mobile locales/direct + refresh, 46 asset requests; zero bounded scan findings            |
| `npm audit --omit=dev`                | Exit 0; zero production vulnerabilities                                                                      |
| `npm audit`                           | Exit 1; five inherited high development findings, no dependency/lockfile changes                             |

Full E2E includes Chromium/Firefox/WebKit critical journeys, axe WCAG
2A/2AA/2.1AA state audits, all four locales/SEO/RTL, consent/lead/campaign
regressions and the eight-width responsive matrix. Provider variants intercept
every vendor request and are followed by a final blank-ID build/scan. Results
are summarized in [gate-results.json](audits/phase-8/gate-results.json).
Raw traces with local filesystem paths remain private scratch, not public assets
or committed staging artifacts.

One fresh read-only whole-patch review found no Critical/Important application or
scope defects and approved this preparation commit. It checked the 20-file staged
inventory, recorded route/header/count consistency and all 35 public asset hashes;
it did not rerun gates or certify a hosting environment. One Minor tooling finding
was deferred as L8-11: the local helper can accept a stale compatible port listener.
This is not evidence that the recorded run used one, and gives no launch clearance.

## Known issues / Pending inputs / Next step / Final recommendation

Execution decisions recorded in the plan ledger:

- Used the verified existing named feature checkout and the already requested
  separate commit/push, without another delivery menu. Cost if that choice is
  wrong: a reviewable Phase 8 branch commit; no deployment or merge.
- Used the explicit preparation-only fallback after the owner confirmed no
  hosting target. Cost: real hosted verification remains required; no launch
  clearance or CDN/device claims follow from local passes.
- Hosted identity/packaging, HTTPS/redirects/logs/HSTS, CDN/cache/performance,
  exposure and screenshots set aside by the reviewer remain blocked. Cost:
  deployment-specific defects may remain until real hosted verification.
- Durable receiver and vendor account behavior remain unverified rather than
  inferred from mocks. Cost: delivery/integration failures may remain; receiver
  absence stays P0.
- Physical devices, actual assistive-technology use and field CWV remain
  unverified. Cost: real-user accessibility/performance issues may remain.
- Native editorial/legal/contact/domain/asset decisions remain owner inputs.
  Cost: unresolved copy/privacy/identity/brand risks keep the listed P0/P1 gates open.
- Firefox's exact stall cause remains unknown despite green repeats. Cost:
  intermittent browser/CI stalls may recur; retain P2 and monitor them.
- Read-only review does not independently rerun commands, authenticate the
  connector or prove absence of every unknown secret. Execution evidence comes
  from the actual executor runs and bounded scans. Cost: host/credential changes
  and unknown exposures require fresh verification after legitimate deployment.

Deferred Minor: local audit port/child ownership check (L8-11); fix before reusing
the helper, without treating the current evidence as hosted verification.

**NO-GO for production launch.** Missing actual staging verification, durable
lead destination, production identity/privacy approvals and P1 inputs prevent
launch clearance. Local regression success cannot substitute for those gates.
Optional blank analytics IDs are safe and are not themselves a launch blocker.

Deliver this separately reviewable preparation/audit commit to the requested
branch, verify remote report/evidence/SHA and clean tree, then stop. Owner next
action is to provision/identify the approved hosting target and remaining inputs;
repeat the blocked hosted audit after explicit continuation. No production deploy,
main merge, indexing activation or launch is authorized by this report.
