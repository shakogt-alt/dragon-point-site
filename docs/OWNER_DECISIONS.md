# Dragon Point — Owner Decisions

Date: 2026-10-10, Asia/Tbilisi. Baseline:
`3812ae1b89a8615005b76706b9bb82084745c620`.
Decisions A/B/C remain pending. Decision D was explicitly accepted by the owner
on 2026-10-13, Asia/Tbilisi, after the hosted diagnostics at source revision
`bcaad5cf77e9ade72896b43b16a2789e026e4851`. Existing code remains unchanged.
[Current State](CURRENT_STATE.md) records implementation;
[Launch Readiness](LAUNCH_READINESS.md) records gates and release ordering.

## A — Campaign attribution handoff to GA4 / GTM / Meta

ISSUE: first-touch UTM/gclid/fbclid and original URL/referrer are retained for
lead delivery, but campaign keys leave the browser URL before providers execute.
The event allowlist and provider commands do not explicitly hand those fields
to vendors. Application readiness does not demonstrate useful campaign reporting
in an actual account.

REASON: Phase 8B intentionally separates capture/cleanup from consent/provider
activation. Vendor scripts may collect context independently; sending raw
campaign, URL or referrer values would change the approved privacy contract.

PROPOSED CHANGE: owner chooses either to retain lead-only campaign attribution
(and keep optional tracking off or accept its current reporting limitations),
or to approve an exact, validated, purpose-gated mapping for each activated
vendor. Specify fields, destination, retention, URL/referrer policy and reviewed
account/container settings. Prepare that mapping as a separately reviewed change.

IMPACT: the latter changes analytics payload/privacy behavior and requires
legal approval, consent review, network assertions and real account validation.
No raw identifiers or campaign fields are added during normalization.
Decision status: PENDING; required before any affected vendor activation.

## B — Safe unrelated queries alongside providers

ISSUE: `/en?utm_source=google&foo=bar` becomes `/en?foo=bar`; the surviving query
blocks all configured vendor adapters, even after both consents.
PII-bearing unrelated queries are also blocked. No broad query scrub occurs.

REASON: strict browser-context validation refuses all remaining queries to avoid
uncontrolled vendor URL collection. Unrelated URL values may represent actual
application/navigation state. Cleanup preserves values and duplicates, but may
normalize encoding when supported campaign keys are removed.

PROPOSED CHANGE: retain the current strict guard, or approve a precisely defined
safe-query allowlist together with proof that vendor implicit context cannot leak
other data. Name actual supported parameters and semantics first. Do not remove
every unrelated query to make an adapter load.

IMPACT: allowing coexistence changes privacy/context behavior; destructive query
removal changes URLs/application semantics. Either needs independent tests for
PII, unknown keys, duplicates, fragments, referrers, revocation and actual vendor
network payloads. Current guards are preserved.
Decision status: PENDING; no A/B changes made.

## C — Privacy Policy route and legal content

ISSUE: `CODEX_TASK.md` requires a placeholder Privacy Policy route marked for
legal review. The current Footer only renders an inline pending-input disclosure;
the requirement has not been fulfilled by that inline implementation.

REASON: earlier reports treated Privacy as inline while avoiding empty future
SEO pages. Privacy is explicitly required by the brief, so the route requirement
cannot be silently removed through a current-state document.

PROPOSED CHANGE: preferably approve shared localized `/[locale]/privacy`
infrastructure and owner/legal-reviewed content, Footer links and appropriate
metadata. A clearly marked nonindexable review placeholder can satisfy the
infrastructure step before final content, if approved. Alternatively explicitly
amend the brief to the approved inline-only model, documenting the decision.

IMPACT: route model affects four dictionaries, navigation, metadata/link tests,
content approval and policy accessibility. Final text must identify the real
operator, receiver/storage/retention, contact channel and optional providers.
No legal text, route or requirement amendment is invented in this audit.
Decision status: PENDING; production collection cannot launch with unresolved
privacy/consent approval.

## D — Mobile performance gate — ACCEPTED FOR MVP

Decision date: 2026-10-13, Asia/Tbilisi. Authority: the owner's explicit
"OWNER DECISION — MOBILE PERFORMANCE GATE" message in this task.
Status: **PERFORMANCE EXCEPTION ACCEPTED FOR MVP**.

ISSUE: mobile Lighthouse Performance >=90 remained a hard pre-launch blocker;
the hosted EN/HE median scores are 77/76 with median simulated TBT 1113/1118 ms.

REASON: repeated hosted and trace-based diagnostics identify recurring shared
Next/React runtime and native browser/VM work. No dominant LeadForm, Header,
MobileLeadCTA or Consent bottleneck was found. Vercel Live contributes little.
No narrow application-level optimization with a validated net benefit was found;
the controlled Webpack A/B regressed important metrics and was rejected.

PROPOSED CHANGE: explicitly approved by the owner. Keep mobile Performance >=90
as a monitored quality target, and remove it as a hard pre-launch blocker for the
Dragon Point MVP. The accepted status is an exception, not a measured >=90 pass.

IMPACT: the measured startup/TBT limitation is accepted for MVP. LCP, CLS,
accessibility and functional regressions remain launch-critical. This decision
does not close other release gates or authorize production deployment/indexing.

Accepted launch policy:

- Performance remains a monitored quality metric.
- LCP, CLS, accessibility and functional regressions remain launch-critical.
- No large client-side dependency, animation framework or heavy branding effect
  may be introduced without measurement.
- Re-test after major Next.js / React upgrades or material architecture changes.
- Re-open performance optimization only when a specific reproducible bottleneck
  can be attributed and A/B validated.

Recorded hosted baseline, five accepted mobile samples per locale:

| Metric                 | EN mobile median | HE mobile median |
| ---------------------- | ---------------- | ---------------- |
| Lighthouse Performance | 77               | 76               |
| Simulated TBT          | 1113 ms          | 1118 ms          |
| LCP                    | 1469 ms          | 1673 ms          |
| CLS                    | 0                | 0                |

The accepted hosted series used Lighthouse 13.5.0 / Chrome 154.0.8037.98,
simulated 4x CPU / slow 4G, mobile 412x823 DPR 1.75, authenticated cached repeat
navigation and saved Necessary-only consent. HTTP cache and storage were preserved.
LCP is within the target in this measured environment; this is not a field CWV or
cold first-visit certification. Desktop sanity samples were Performance 100 (EN)
and 95 (HE). Raw traces and cold-cache controls were assessed separately.

Supporting local artifacts are intentionally ignored and are not available in a
clean Git checkout:

- `.superpowers/hosted-lighthouse-bcaad5c/automated-summary-20261013.json`
- `.superpowers/hosted-tbt-root-cause-bcaad5c/REPORT.md`
- `.superpowers/hosted-tbt-root-cause-bcaad5c/decision-summary.json`

The diagnostic report predates this owner decision and retains its original
failed-gate/recommendation wording. Historical Phase 7/7B/8 reports and all raw
samples remain unchanged. This record and the amended CODEX_TASK now define the
current MVP performance launch policy. No performance code change is selected.

## Protected hosted audit access

Unauthenticated requests to the exact READY Preview redirect (HTTP 302) to Vercel
SSO. API metadata access does not pass this browser boundary.

The access request below records the 2026-10-10 boundary. The owner subsequently
authorized the authenticated Chrome session ("AUTHENTICATED — CONTINUE"), and the
hosted EN/HE performance collection and root-cause diagnostics completed on
2026-10-13. That access authorization does not itself close the full production
release gate or authorize an alternative access mechanism.

Original access request: run the audit through an owner-authorized authenticated
browser session with access to this project, and authorize local audit tools to
use that session, or perform the runbook personally and supply sanitized results.
A fresh unauthenticated profile cannot audit the application while this boundary
remains. Keep authentication state/cookies private and out of Git/screenshots/logs.
No bypass token, public share URL, protection change or new access was created.
If a different access mechanism is wanted, it needs separate explicit approval.

## Remaining release decisions and inputs

| Item                 | Exact requested input or decision                                                                                       | Current evidence                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Domain / SITE_URL    | Confirm final HTTPS production origin and owner control                                                                 | Unconfirmed; template blank; hosted scope unverified                                 |
| Receiver             | Durable HTTPS destination, persisted-before-2xx contract, private auth if required                                      | Unconfigured locally; no real delivery evidence                                      |
| Public contact model | Verified phone/WhatsApp/email/address as used, or explicitly approved form-only/omission model                          | Pending placeholders; no invented values                                             |
| Legal / consent      | Reviewed four-locale disclosure covering first-touch session storage, receiver and actual optional vendors              | Approval not evidenced                                                               |
| Logo                 | Locked dark/light/compact assets or explicit approval of current replaceable wordmark                                   | Final master absent                                                                  |
| Hero                 | Confirm continued use of supplied illustrative architecture, or licensed replacement                                    | Supplied asset/provenance retained; no new visual needed                             |
| OG                   | Approved available 1200×630 artwork and HTTPS URL                                                                       | Not supplied/configured locally                                                      |
| Native copy          | KA and HE signoff for visible, SEO, form, privacy and consent text                                                      | Not evidenced                                                                        |
| Performance          | Decision D accepted: >=90 is monitored, not a hard MVP pre-launch blocker; retain critical regression gates             | Hosted EN/HE 77/76; TBT 1113/1118 ms; PERFORMANCE EXCEPTION ACCEPTED FOR MVP         |
| Dependency audit     | P2 / TOOLCHAIN MAINTENANCE: schedule a compatible dev-tool update; no forced downgrade and no P0/P1 launch prerequisite | Dev-only packages, production audit zero; runtime trace evidence in LAUNCH_READINESS |
| Device QA            | Current physical iPhone Safari and Android Chrome results, or explicit owner QA decision                                | Not performed by browser emulation                                                   |
| Production GO        | Approve exact fully tested release commit and launch inputs                                                             | Not given                                                                            |

Search Console verification/sitemap submission is a post-launch ownership task.
GA4/GTM/Meta are optional: blank IDs alone do not prevent a no-tracking launch.
No approval is inferred from an elapsed wait, existing Preview or successful tests.

Completed: unresolved decisions separated from technical cleanup; owner decision D recorded as accepted on 2026-10-13.
Changed files: this decision record.
Tests/result: documentation formatting, decision/policy consistency and git diff checks; prior runtime evidence remains separate.
Known issues/pending inputs: PENDING owner inputs above; dependency maintenance is
P2 toolchain work and is not a P0/P1 launch blocker.
Next step: resolve remaining production inputs and release gates, then obtain GO for the exact tested release. No further mobile score optimization is required without an attributable, A/B-validated bottleneck.
