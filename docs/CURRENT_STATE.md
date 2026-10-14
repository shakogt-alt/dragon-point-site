# Dragon Point — Current State

Audit date: 2026-10-10, Asia/Tbilisi. This is the single current implementation
reference. `CODEX_TASK.md` remains the approved requirements authority; this
document records implementation and conflicts, and does not override it.
Historical phase reports describe their dated revisions and remain unchanged.

Performance policy updated on 2026-10-13: **PERFORMANCE EXCEPTION ACCEPTED FOR MVP**.
The diagnostic source revision is `bcaad5cf77e9ade72896b43b16a2789e026e4851`.
Mobile Performance >=90 is a monitored target, not a hard pre-launch blocker.
LCP, CLS, accessibility and functional regressions remain launch-critical.
See [accepted owner decision D](OWNER_DECISIONS.md#d--mobile-performance-gate--accepted-for-mvp)
for the evidence, measurement conditions and re-test/reopening policy. This
update changes requirements/documentation only; it does not grant production GO.
The implementation/Vercel audit below records its original 2026-10-10 baseline.

## Verified baseline and release boundary

Repository: `C:/Users/SGT/Documents/Codex/dragon-point-site`.
Remote: `shakogt-alt/dragon-point-site`.
Authoritative HEAD: `3812ae1b89a8615005b76706b9bb82084745c620`.
Branch: `codex/landing-mvp`. Worktree was clean before this audit.

After `git fetch origin`, both `origin/codex/landing-mvp` and
`origin/staging/phase-8a` resolve to that SHA.
`origin/main` remains `dbbea00668e2f58cc925dd598b297bb6ecc7bbc1`.
No commit, push, merge, deployment, DNS, or access-setting change is authorized.

Vercel project `prj_x9FOZhZkLivcqqomlYEMUey59E5k` is `live=false`.
Preview `dpl_6cpq1pzq1n1UBr4SNQDvHjBFrL8S` is READY at the baseline
SHA on `staging/phase-8a`, with `target=null`.
[Current Preview](https://dragon-point-site-9l6f12y5r-shako-s-projects2.vercel.app).
Vercel Authentication is enabled for `all_except_custom_domains`.
The production deployment listing contains only a CANCELED deployment
`dpl_9xJi2tSoHwZX8FaPv5byxnL9uVkq`; there is no active production deployment.
Unauthenticated Preview access returned HTTP 302 to Vercel SSO. An authenticated
API metadata read is not authenticated browser access or hosted application QA.

## Requirement reconciliation matrix

This matrix was established before application changes. Its mobile Performance row is superseded by the accepted 2026-10-13 owner decision; other rows retain their dated audit evidence.

| REQUIREMENT                                    | CURRENT IMPLEMENTATION at 3812ae1                                                                        | STATUS                      | CONFLICT                                                                    | ACTION                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Landing MVP, no portal/CMS/chat/accounts       | Shared single-page landing with eight approved areas                                                     | Implemented                 | None found                                                                  | Preserve scope                                                                |
| Approved five colors, analytical visual system | Central tokens, light sections/dark Hero/Technology/Footer, violet accents                               | Implemented                 | None found                                                                  | Preserve design                                                               |
| FiraGO; compatible Hebrew font                 | Self-hosted FiraGO subsets/full input face and Noto Sans Hebrew; licenses/provenance retained            | Implemented                 | None found                                                                  | Verify hosted fonts                                                           |
| EN / KA / RU / HE, shared tree                 | Dictionaries feed one Landing tree and locale layouts                                                    | Implemented                 | None found                                                                  | Native KA/HE signoff remains pending                                          |
| Root server redirect                           | 307 to /en, including campaign query/duplicates                                                          | Implemented                 | None found                                                                  | Retain                                                                        |
| Hebrew document RTL                            | lang=he/dir=rtl, logical CSS, isolated Latin strings and direction-aware arrows                          | Implemented                 | Physical-device QA pending                                                  | Rerun full width/keyboard matrix                                              |
| Header/mobile navigation/anchor links          | Sticky Header, native disclosures plus enhancement, locale switcher                                      | Implemented                 | None found                                                                  | Browser/keyboard verification                                                 |
| Hero and comparison                            | Illustrative architecture Hero; explicit qualitative demo labels                                         | Implemented                 | Final logo/master assets pending                                            | No fabricated listings/statistics                                             |
| Goals and lead form                            | Intent preselection, RHF, deferred Zod resolver, localized feedback                                      | Implemented                 | Delivery unavailable without receiver                                       | Supply durable destination                                                    |
| Lead service abstraction                       | Server-only optional HTTPS webhook; 8-second timeout; no redirects/PII logging                           | Implemented infrastructure  | No verified real delivery                                                   | Controlled staging end-to-end delivery required                               |
| Server validation/spam controls                | Strict schema, normalized values, honeypot, same-origin, JSON-only, 16 KiB stream limit                  | Implemented                 | Browser guards are not authentication                                       | Preserve controls; inspect malformed/error responses                          |
| Basic rate limiting                            | Bounded hashed-IP per-process buckets on Vercel; shared fallback elsewhere                               | Implemented with limitation | Cold starts/multiple instances do not share budgets                         | Owner infrastructure decision if stronger protection needed                   |
| 405 HTTP semantics                             | Framework rejects unsupported methods; no Allow on 405                                                   | Confirmed P2                | Missing method advertisement                                                | Minimal header fix and HTTP regression                                        |
| Attribution fields                             | Validated UTM five keys, gclid/fbclid, original landing URL/referrer, locale in lead payload             | Implemented                 | Raw original URLs can contain externally supplied personal query values     | Legal review covers actual storage/receiver processing                        |
| First-touch persistence                        | Session record reused; per-document memory fallback on access/read/write failure                         | Implemented with limitation | Blocked storage cannot persist through full document navigation             | Document limits; no new storage mechanism                                     |
| Campaign cleanup                               | Capture/persist first, then remove seven exact campaign keys with replaceState regardless of consent/IDs | Implemented Phase 8B        | Active READMEs describe Phase 5B behavior                                   | Correct current docs; retain history                                          |
| Unrelated queries/fragments                    | Preserved semantically, including duplicates; URL serialization may normalize raw bytes                  | Implemented                 | Any remaining query/unapproved hash blocks vendors                          | Owner decision B; do not remove or relax silently                             |
| Campaign handoff to vendors                    | Lead attribution retains campaign; provider event contract carries no raw campaign fields                | Owner decision A            | Vendor marketing attribution is not explicitly mapped                       | Approve mapping or continued exclusion before activation                      |
| Consent purposes                               | Necessary on, Analytics/Marketing off; 180-day record, reopen, expiry/revocation/cross-tab               | Implemented                 | Legal/owner consent approval not evidenced                                  | Approve exact purpose/storage/provider disclosures                            |
| Analytics readiness                            | Enum-only events; lazy GA/Meta; GTM supersedes GA; purpose gates, no replay                              | Implemented, inactive       | Actual accounts/container/network behavior unverified                       | Optional tracking can remain off                                              |
| Privacy Policy route                           | Footer inline pending legal disclosure; no privacy route                                                 | Requirement conflict        | CODEX_TASK explicitly requires legal-review placeholder route               | Owner decision C; no route/content change in this audit                       |
| Localized SEO, one H1, JSON-LD                 | Dictionary metadata, one Hero H1, escaped known-data entity graph                                        | Implemented                 | Native editorial approval pending                                           | Verify rendered metadata and copy                                             |
| Canonical/hreflang/x-default                   | Configured HTTPS SITE_URL only; x-default /en                                                            | Implemented infrastructure  | Real production origin unconfirmed                                          | Supply confirmed origin; never use Preview host                               |
| Sitemap/robots/Preview noindex                 | Four URLs only in configured production; Preview/staging fail closed with empty sitemap                  | Implemented                 | Hosted guard not independently observed behind SSO                          | Authenticated hosted audit                                                    |
| Open Graph / he_IL / Twitter                   | Localized framework, optional 1200×630 HTTPS image                                                       | Implemented infrastructure  | Approved artwork/URL absent                                                 | Supply and verify real OG asset                                               |
| Favicon                                        | No favicon asset/route; /favicon.ico unresolved                                                          | Confirmed P2                | Asset not approved; browser may request absent resource                     | Temporary empty 204 mitigation only; approved final icon remains pending      |
| Headers/caching/malformed paths                | nosniff/referrer/frame/permissions; API no-store; hashed fonts immutable; bad path encoding 400          | Implemented                 | Hosted HSTS/CDN behavior unverified; CSP frame-only                         | Measure host; stricter script CSP is a separate work item                     |
| Mobile/accessibility quality                   | Prior full RTL/axe/focus/short-screen/cross-browser regressions                                          | Implemented checks          | Physical devices/screen readers not certified                               | Fresh local gate, then real devices                                           |
| Mobile Lighthouse >=90                         | Hosted EN/HE medians 77/76; simulated TBT 1113/1118 ms (2026-10-13)                                      | Accepted MVP exception      | Monitored target unmet; measured LCP within target and CLS effectively zero | Retain critical regression gates; re-test/re-open only under owner decision D |
| Repository quality gate                        | Pinned scripts and Playwright multi-server profiles                                                      | Pending fresh run           | Full audit historically 5 high development findings                         | Record exact current exits/counts, including failures                         |

## Phase 8B sequencing and boundaries

`getFirstTouchAttribution()` captures the original document or valid stored first
touch into a document cache before cleaning campaign keys. Analytics boot calls
it before restoring consent; LeadForm consumes the same snapshot.
Only `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`gclid`, and `fbclid` are deleted, including repeated occurrences.
History state, locale path, unrelated values and hash survive without reload.
URLSearchParams serialization can change encoding (for example %20 to +);
the unrelated query is semantically preserved, not guaranteed byte-identical.

Capture and cleanup are independent of optional tracking consent and IDs.
`prepareProviderContext()` only ensures capture and validates context; it does not
scrub unrelated queries/fragments. Strict provider guards still reject any query,
unknown route/hash, credentials or unsafe immutable referrer. An empty referrer,
origin-only HTTP(S) external referrer, or clean same-origin locale is permitted.
There is no explicit campaign-to-provider handoff. Owner decisions A and B remain
unimplemented. Event payloads exclude personal form values and attribution; the
separate lead attribution record retains validated original URL/referrer.

## Current production input evidence

`.env.example` has blank domain, OG, receiver and provider IDs.
Local `.env.local` exists and contains a nonempty Vercel OIDC authentication
entry; values were neither printed nor copied. It contains none of the application
configuration keys listed in the template. This is local presence evidence, not a
claim about scoped hosted variables. Hosted environment values were not fetched.

Production domain, durable receiver, contact model, legal/privacy/consent approval,
final logo/current wordmark approval, OG artwork and native KA/HE signoff remain
unverified inputs. The supplied illustrative Hero is already integrated and has
approval/provenance history; it is not a verified property. Search Console and
physical mobile QA are not evidenced. Blank optional analytics IDs are not a launch
blocker if measurement stays off.

## Local normalization overlay

Uncommitted documentation and narrowly scoped HTTP fixes are prepared separately
from the baseline implementation. Lead 405/OPTIONS now advertise OPTIONS, POST;
/favicon.ico returns a dynamic empty 204 only as a temporary mitigation while the
approved favicon/master logo asset is pending. It is not a final production favicon
fix; no fabricated icon or artwork is supplied. Private generated
Vercel CLI state is excluded from formatting without changing its stored evidence.
Fresh lint, formatting, typecheck, 140 unit tests, build, 250 browser tests, production
dependency audit and diff checks pass. Full npm audit exits 1 with five high
development-only dependency findings classified P2 / TOOLCHAIN MAINTENANCE.
Fresh production audit remains zero. None of the five affected packages occurs in
the local runtime file traces; no deployed application exposure is evidenced by
this finding. Compatible toolchain maintenance remains open and is not a P0/P1
launch blocker. See [Launch readiness](LAUNCH_READINESS.md) for the final changed-file
inventory, command results, failure history and release sequence.
No privacy route, attribution handoff, provider guard, visual, dependency or
production-input change is made.

## Documentation policy

README and the analytics contract describe the current baseline. Phase reports
1, 2, 2A, 3, 4, 5, 5B, 6, 7, 7B and 8 remain dated evidence. In particular,
Phase 8's no-staging statement and old cleanup observations must not be rewritten
as if current staging existed at that time.
The preview runbook is operational and will point to this current truth; its old
setup assumptions must not be used to provision another project.

Completed: repository/Vercel truth and read-only requirement/code reconciliation; accepted mobile performance policy recorded on 2026-10-13.
Changed files in this documentation step: this file, LAUNCH_READINESS.md,
OWNER_DECISIONS.md, README, analytics README and the current preview runbook.
Tests/result: fresh gate recorded in LAUNCH_READINESS after safe cleanup.
Known issues/pending inputs: matrix above and OWNER_DECISIONS.
Next step: remaining production inputs and release verification, then exact-release owner GO. The mobile >=90 gate exception is accepted; no safe performance application fix is selected.
