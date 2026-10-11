# Dragon Point — Owner Decisions

Date: 2026-10-10, Asia/Tbilisi. Baseline:
`3812ae1b89a8615005b76706b9bb82084745c620`.
No decision below is assumed approved. Existing code remains unchanged for A/B/C.
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

## Protected hosted audit access

Unauthenticated requests to the exact READY Preview redirect (HTTP 302) to Vercel
SSO. API metadata access does not pass this browser boundary.

Required owner decision: run the audit through an owner-authorized authenticated
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
| Performance          | Hosted repeated measurements; remedy or explicit documented budget amendment if targets remain unmet                    | Historical local mobile 72/80, target >=90                                           |
| Dependency audit     | P2 / TOOLCHAIN MAINTENANCE: schedule a compatible dev-tool update; no forced downgrade and no P0/P1 launch prerequisite | Dev-only packages, production audit zero; runtime trace evidence in LAUNCH_READINESS |
| Device QA            | Current physical iPhone Safari and Android Chrome results, or explicit owner QA decision                                | Not performed by browser emulation                                                   |
| Production GO        | Approve exact fully tested release commit and launch inputs                                                             | Not given                                                                            |

Search Console verification/sitemap submission is a post-launch ownership task.
GA4/GTM/Meta are optional: blank IDs alone do not prevent a no-tracking launch.
No approval is inferred from an elapsed wait, existing Preview or successful tests.

Completed: unresolved decisions separated from technical cleanup.
Changed files: this decision record.
Tests/result: documentary evidence; no prose-only tests.
Known issues/pending inputs: PENDING owner inputs above; dependency maintenance is
P2 toolchain work and is not a P0/P1 launch blocker.
Next step: owner decisions, reviewed technical delivery and protected hosted gate.
