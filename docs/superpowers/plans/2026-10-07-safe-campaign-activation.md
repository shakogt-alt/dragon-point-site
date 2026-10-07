# Phase 5B — Safe Campaign Activation Implementation Plan

> **For agentic workers:** Execute natively in the current session, with one
> independent read-only final reviewer. The user has authorized full Phase 5B.

**Goal:** Campaign visitors can activate consented providers without exposing raw
query/referrer values or losing first-touch lead attribution.

**Architecture:** A document-local attribution cache calls the existing capture
function independently of React. Provider preparation explicitly captures first,
cleans the current locale URL with history.replaceState, then validates context.
Existing consent and runtime gates stay intact. Immutable unsafe referrers still
block vendors. Root redirect forwards its query to /en for capture.

**Tech stack:** Existing Next.js, TypeScript, Vitest, Playwright and axe; no new dependencies.
**Spec:** User's Phase 5B request, AGENTS.md and CODEX_TASK.md.

## Global constraints

- Repository shakogt-alt/dragon-point-site, branch codex/landing-mvp.
- Starting SHA 7dd0e29e1d403499773ee09307c49f4bd9d1843c.
- No UI/copy/event/schema/SEO/visual/RTL/KleekTo changes or Phase 6.
- Actual provider endpoints are mocked in tests; production IDs remain blank.

## Review focus

- Already-saved consent must not activate before capture and cleanup.
- Blocked session storage must retain original attribution in document memory.
- replaceState failure, unknown route and unsafe referrer must fail closed.
- Approved hash and existing history state must survive cleanup without navigation.
- Repeat initialization/consent changes must not duplicate scripts or funnel events.

## Task 1 — Deterministic capture and safe provider boot

Files: src/lib/leads/browser-attribution.ts; src/lib/analytics/context.ts;
src/lib/analytics/client.ts, providers.ts; src/components/leads/LeadForm.tsx;
src/app/(entry)/page.tsx; tests/unit/analytics-boot.test.ts.
Interfaces: getFirstTouchAttribution(): Attribution;
prepareProviderContext({capture, href, referrer, replaceUrl}): boolean;
safeTrackingContext(href, referrer): boolean.

- [x] Write failing tests for capture-before-cleanup, preserved attribution and
      anchor, unsafe referrer, failed cleanup, repeat boot and blocked storage.
- [x] Introduce shared document capture; integrate both analytics and LeadForm.
- [x] Prepare context explicitly before adapter commands/loading; keep guard strict.
- [x] Preserve root query through server redirect; verify with a browser/API test.
- [x] Run units and focused browser tests.

## Task 2 — Provider and privacy verification

Files: tests/e2e/campaign.spec.ts, tests/e2e/campaign.config.ts;
tests/e2e/analytics.spec.ts; src/lib/analytics/README.md; README.md;
docs/phase-5b-report.md.

- [x] Write real-app browser tests; mock only vendor downloads and lead HTTP replies.
- [x] Run with synthetic GA4/Meta build IDs, then synthetic GTM build ID; verify
      required consent, cleaned execution context, queues/parameters, no duplication,
      full original lead attribution, locale switching and Hebrew RTL.
- [x] Rebuild with blank IDs and run the full suite, including missing-ID campaign
      behavior, lint, format, typecheck, unit, build, axe, eight-width matrix and audits.
- [x] Keep historical screenshots untouched; update activation documentation.
- [x] Obtain read-only review, fix blockers, commit/push Phase 5B separately, verify
      remote SHA/report and clean tree, then stop before Phase 6.
