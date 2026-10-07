# Phase 5 — Analytics Readiness Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans natively; one final
> independent reviewer. User has explicitly authorized full Phase 5 execution.

**Goal:** Consent-controlled, provider-neutral measurement readiness without
production IDs or personal lead data.

**Architecture:** A strict event allowlist and purpose-gated runtime are separate
from browser/provider code. Shared localized consent UI persists versioned choices
for 180 days, handles storage failures and cross-tab changes, and reopens from the
Footer. Optional provider adapters load after consent and refuse unsafe URL context.

**Tech stack:** Existing React / Next.js / TypeScript, Vitest, Playwright, axe.
No new dependencies.

**Spec:** AGENTS.md, CODEX_TASK.md, user's approved Phase 5 request.

## Global constraints

- Base HEAD: 478625605318ebfc168564ff38b458b51d822503.
- Repository shakogt-alt/dragon-point-site; branch codex/landing-mvp.
- EN / KA / RU / HE share UI; document RTL and logical CSS remain intact.
- Preserve Hero, lead validation/API, attribution and SEO behavior.
- No real analytics IDs, PII, KleekTo integration or Phase 6 work.

## Review focus

- Consent revoked during provider loading: stale initialization/events must stop.
- Corrupt, expired, unavailable storage: deny by default; form remains usable.
- Provider failure: never break navigation or lead submission.
- URL/query/referrer can contain PII: never forward them; vendor readiness fails
  closed in unsafe URL contexts; production containers require a privacy review.
- Consent overlay, keyboard and sticky CTA must cooperate without losing lead data.

### Task 1 — Consent and event contract

Files: src/lib/analytics/consent.ts, events.ts, runtime.ts;
tests/unit/analytics.test.ts.

Interfaces: Consent {necessary:true, analytics:boolean, marketing:boolean};
readConsent(storage, now), saveConsent(storage, consent, now);
makeAnalyticsEvent(name, properties); createAnalyticsRuntime(providers, emit).

- [x] Write failing tests for expiry/schema/default denial, blocked storage,
      payload allowlisting, consent gating, no replay, async revocation and failures.
- [x] Implement bounded/versioned persistence and a purpose-gated event runtime.
- [x] Run the complete unit suite.

### Task 2 — Providers, consent UI and funnel integration

Files: src/lib/analytics/providers.ts, client.ts;
src/components/analytics/ConsentManager.tsx, ConsentSettings.tsx;
src/styles/consent.css; locale dictionaries; Landing.tsx, Footer.tsx,
LeadForm.tsx, LanguageSwitcher.tsx, .env.example.

Interfaces: trackAnalytics(name, properties), openConsentSettings(); optional
GA4 / GTM / Meta adapters with start(allowed), track(event), stop().

- [x] Write failing adapter boundary and browser consent/funnel tests.
- [x] Add lazy adapters, duplicate Google routing protection, safe parameters,
      explicit revocation and no automatic page views or advanced matching.
- [x] Implement a compact nonmodal first-visit banner and native settings dialog;
      optional categories default off, equal accept/reject actions, Escape restores
      previous state/focus. Use the existing data-consent-ui sticky coordination.
- [x] Add exact valid-submit/result hooks; delegate static click/input events.
- [x] Preserve existing behavior tests by recording necessary-only choice in their
      isolated contexts; test first visits separately, not by hiding the consent UI.

### Task 3 — Quality gates and delivery

Files: tests/e2e/analytics.spec.ts, existing E2E fixtures/config;
docs/phase-5-report.md, docs/screenshots/phase-5/.

- [x] Run lint, format, typecheck, units, build, full E2E/axe and both audits.
- [x] Cover every locale at 360/390/430/768/1024/1280/1440/1920; verify privacy,
      persistence/reopening, revocation/cross-tab changes, keyboard, sticky CTA,
      console errors and preserved lead/SEO/visual behavior.
- [x] Capture EN desktop/mobile, KA mobile, RU desktop, HE desktop/mobile consent.
- [x] Obtain read-only review, resolve findings and report material limitations.
- [x] Commit/push separately, verify remote HEAD/report/screenshots and clean tree.
- [x] Stop before Phase 6.
