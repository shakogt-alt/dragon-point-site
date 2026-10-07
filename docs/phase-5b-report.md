# Phase 5B — Safe Campaign Analytics Activation Fix

Date: 2026-10-07. Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Verified starting HEAD: `7dd0e29e1d403499773ee09307c49f4bd9d1843c`.
Working tree was clean. `AGENTS.md` and `CODEX_TASK.md` were read completely.

## Root cause

The final vendor-context guard rejected every query string, so ordinary campaign
URLs could never activate a configured provider. Original attribution capture
lived in a LeadForm effect, with no explicit guarantee that it preceded cleanup
or consent restoration. The root redirect also discarded campaign queries.

## Implementation

The deterministic sequence is now:

1. `getFirstTouchAttribution()` synchronously captures the original document with
   the existing validated first-touch function and session-storage contract. It
   retains the result in document memory, including when storage is unavailable.
   Analytics initialization invokes it **before restoring any saved consent**.
   LeadForm uses the same original snapshot regardless of effect order.
2. A consent-eligible configured adapter invokes `prepareProviderContext()` before
   vendor commands/download. That function independently captures first, removes
   all query parameters and unapproved fragments through `history.replaceState`,
   preserving locale, approved anchors and existing history state without reload.
3. The actual cleaned browser URL and immutable referrer pass the unchanged strict
   context guard before provider activation. Failure to capture/clean, unsupported
   routes, credentials, and unsafe referrers remain fail-closed.

Root `/` still server-redirects to `/en`, now forwarding the query, including
duplicate values, until localized capture. This makes the root redirect dynamic;
canonical, indexing, crawler documents and locale SEO behavior are unchanged.

Cross-origin referrers are not rewritten. Empty or origin-only HTTP(S) external
referrers retain their previous allowance; arbitrary paths/queries remain blocked.
Original referrer is kept for Lead attribution only. No raw campaign values were
added to the analytics event contract, dataLayer or Meta parameters.

## Completed

- Campaign URL activation for GA4 after Analytics, Meta after Marketing, GTM after
  both purposes, verified against the real app with mocked vendor downloads.
- First-touch capture precedes cleanup and survives it, storage failure, saved
  consent and locale switching. Lead still receives all original attribution.
- No tracking before consent, no duplicate provider downloads or duplicate funnel
  events within the document, no vendor loading or cleanup when IDs are missing.
- EN/KA/RU/HE, Hebrew RTL, consent UI/copy/categories, event names/allowlists,
  payload schema, webhook, SEO, Hero and assets remain intact. No KleekTo changes,
  dependencies or real IDs were introduced. Final build has blank provider IDs.
- Independent read-only review found no actionable defects. Its suggested
  additional browser referrer-preservation assertion was added and passed.

## Changed files

15 files:

- `README.md`
- `src/app/(entry)/page.tsx`
- `src/components/leads/LeadForm.tsx`
- `src/lib/analytics/README.md`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/context.ts`
- `src/lib/analytics/providers.ts`
- `src/lib/leads/browser-attribution.ts`
- `tests/e2e/analytics.spec.ts`
- `tests/e2e/campaign.config.ts`
- `tests/e2e/campaign.spec.ts`
- `tests/unit/analytics-boot.test.ts`
- `tests/unit/analytics-providers.test.ts`
- `docs/superpowers/plans/2026-10-07-safe-campaign-activation.md`
- `docs/phase-5b-report.md`

No consent components, dictionaries, styles, event/runtime/consent contracts,
server lead validation/payload/delivery, SEO builders, public assets or historic
screenshots changed. All six supplied visual-source SHA-256 values match the
existing manifest.

## Tests run

| Check                                                 | Final result                                                          |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `npm run lint`                                        | Passed, no warnings                                                   |
| `npm run format:check`                                | Passed                                                                |
| `npm run typecheck`                                   | Passed                                                                |
| `npm test`                                            | 118 passed in 7 files                                                 |
| `npm run build`                                       | Passed; final production build uses blank IDs                         |
| Dedicated campaign config, GA4 + Meta synthetic build | 5 passed, no retries                                                  |
| Dedicated campaign config, GTM synthetic build        | 5 passed, no retries                                                  |
| `npm run test:e2e` after blank-ID rebuild             | 111 passed, no retries, 3.5 minutes                                   |
| axe WCAG 2 A/AA and 2.1 AA                            | 28 scans, zero violations                                             |
| Responsive matrix                                     | All 4 locales at 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px |
| `npm audit --omit=dev --json`                         | Exit 0; zero vulnerabilities                                          |
| `npm audit --json`                                    | Exit 1; 5 existing high dev-dependency findings                       |
| `git diff --check`                                    | Passed                                                                |
| Asset/source integrity and final build                | Original hashes preserved; no synthetic Google IDs in final chunks    |

The separate campaign fixtures build only synthetic IDs and intercept **every
cross-origin request**, fulfilling vendor scripts locally or aborting unexpected
traffic. No real GA4/GTM/Meta endpoints were called. The production build was
restored with all three IDs empty before the full suite. Repeat instructions are
in [the analytics contract](../src/lib/analytics/README.md).

## Tests result / confirmations

- **Post-consent activation works:** `/en?utm_source=google&utm_campaign=test`
  and `/he?utm_source=meta&fbclid=test`, including other campaign parameters,
  now reach configured adapters after the correct consent. Scripts execute with
  a clean URL. Document tokens and history instrumentation prove no reload and
  capture-before-cleanup; approved hash and framework history state survive.
- **Lead attribution stays intact:** UTM source/medium/campaign/content/term,
  gclid/fbclid, original landing URL and original referrer retain their existing
  validated semantics. Actual LeadForm HTTP payload assertions confirm original
  values after cleanup, including blocked storage and unsafe external referrer.
  Session first touch persists through EN/HE switching and later campaign URLs.
- **No raw query leakage:** assertions inspect actual dataLayer records, Meta
  command/custom-event parameters and the neutral event bus. Campaign values,
  click identifiers, arbitrary email query and personal form values are absent.
- **Consent and deduplication remain intact:** no script/events before consent;
  GA4/Meta require their respective category, GTM needs both; repeated saving does
  not download again. Each lead open/start/submit/success is emitted once in the
  tested document. Blank-ID builds make no vendor requests.
- **Regression gates pass:** existing locale/RTL, lead API, attribution, keyboard,
  sticky CTA, visual dimensions, zero console errors and production/preview/staging
  SEO tests remain green. Previous screenshots are byte-for-byte unchanged.

The original query-blocking regression failed before the implementation and then
passed. Early fixture failures were corrected to distinguish Next's no-URL-change
history initialization from actual cleanup and to wait for consent hydration.
No quality gate failure is omitted from the final result.

## Known issues

- Unsafe immutable referrers intentionally still block vendor activation. This
  is the required conservative behavior, not a query-string activation failure.
- Real account/container behavior is not certified by mocked downloads. The
  existing audited GTM consent-template/manual-tag and GA/Meta automatic-collection
  restrictions remain prerequisites before actual account activation.
- The unchanged dev chain `eslint-config-next → @next/eslint-plugin-next →
fast-glob → micromatch → braces` retains 5 high audit findings. No production
  vulnerabilities or dependency changes. A suggested major downgrade was not
  applied as part of this focused fix.
- With blocked storage, memory preserves first touch within the current document;
  cross-document persistence still depends on session storage, as before.

## Pending inputs

Real IDs and reviewed vendor/account configuration, production domain and prior
branding/contact/lead receiver inputs remain pending. No values were invented.
Consent wording and legal/account activation review remain as in Phase 5.

## Next step

Commit and push Phase 5B separately to `origin/codex/landing-mvp`, verify the remote
SHA/report and clean tree, then stop. Final remote SHA is reported in delivery.
Phase 6 remains unstarted and requires explicit approval.
