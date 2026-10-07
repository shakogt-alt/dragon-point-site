# Phase 5 — Analytics Readiness

Date: 2026-10-07. Repository: `shakogt-alt/dragon-point-site`.
Branch: `codex/landing-mvp`.
Verified starting HEAD: `478625605318ebfc168564ff38b458b51d822503`.
`AGENTS.md` and `CODEX_TASK.md` were read completely before implementation.

## Completed

- Provider-neutral, typed event allowlist; separate purpose-gated runtime and
  lazy GA4 / GTM / Meta readiness adapters. All real provider IDs remain empty.
- Shared EN / KA / RU / HE consent banner and native settings dialog: Necessary
  always on, Analytics/Marketing off by default, equal accept/reject choices,
  granular saving, Footer reopening, keyboard cycle and focus restoration.
- Hebrew retains document RTL, logical spacing and the same component tree.
  Sticky lead CTA hides for consent UI and returns after dismissal when eligible.
- Versioned consent persistence for 180 days; invalid/expired/blocked storage
  fails closed, blocked writes use the current visit only, cross-tab changes and
  long-lived visit expiry revoke/update without reloading the lead form.
- No optional provider loading or measurement before required consent, no replay
  of earlier actions, synchronous event revocation, isolated provider failures.
  GTM bootstrap stays denied during download; post-load consent is checked again.
- Lead opening/start/valid submit/confirmed success/coarse error events, Hero and
  goal CTA events, language switching and hooks for future real contact links.
  Event payloads contain only public enums; no personal fields, URL/referrer,
  attribution parameters, click identifiers or backend details.
- Existing first-touch attribution, lead payload/server validation/delivery,
  SEO, fonts, Hero imagery and the Visual Assets Integration Pass are preserved.
  All six supplied visual-source hashes match the existing manifest. No KleekTo
  integration, new dependencies, production contacts or market data were added.
- Read-only implementation review resolved delayed GTM consent and Hero intent
  findings. Browser failures drove fixes for KA/RU narrow-dialog overflow,
  first-banner focus restoration and modal keyboard boundaries. Final checks pass.

## Changed files

Application/configuration/documentation:

- `.env.example`
- `README.md`
- `playwright.config.ts`
- `src/components/analytics/ConsentManager.tsx`
- `src/components/analytics/ConsentSettings.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/Landing.tsx`
- `src/components/leads/LeadForm.tsx`
- `src/components/ui/LanguageSwitcher.tsx`
- `src/lib/analytics/README.md`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/consent.ts`
- `src/lib/analytics/events.ts`
- `src/lib/analytics/providers.ts`
- `src/lib/analytics/runtime.ts`
- `src/messages/en.json`
- `src/messages/ka.json`
- `src/messages/ru.json`
- `src/messages/he.json`
- `src/styles/consent.css`
- `src/styles/globals.css`
- `docs/superpowers/plans/2026-10-07-analytics-readiness.md`
- `docs/phase-5-report.md`

Tests:

- `tests/unit/analytics.test.ts`
- `tests/unit/analytics-providers.test.ts`
- `tests/e2e/analytics.spec.ts`
- `tests/e2e/consent-fixture.ts`
- `tests/e2e/landing.spec.ts`
- `tests/e2e/leads.spec.ts`

13 new screenshots in `docs/screenshots/phase-5/`:

| Locale / width | Consent                                                                                                         | Preserved landing                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| EN 1440        | [Settings](screenshots/phase-5/en-1440-consent.png)                                                             | [Landing](screenshots/phase-5/en-1440-landing.png) |
| EN 390         | [Settings](screenshots/phase-5/en-390-consent.png), [first-visit banner](screenshots/phase-5/en-390-banner.png) | [Landing](screenshots/phase-5/en-390-landing.png)  |
| KA 390         | [Settings](screenshots/phase-5/ka-390-consent.png)                                                              | [Landing](screenshots/phase-5/ka-390-landing.png)  |
| RU 1440        | [Settings](screenshots/phase-5/ru-1440-consent.png)                                                             | [Landing](screenshots/phase-5/ru-1440-landing.png) |
| HE 1440        | [Settings](screenshots/phase-5/he-1440-consent.png)                                                             | [Landing](screenshots/phase-5/he-1440-landing.png) |
| HE 390         | [Settings](screenshots/phase-5/he-390-consent.png)                                                              | [Landing](screenshots/phase-5/he-390-landing.png)  |

Prior phase and visual-pass screenshots were not overwritten. Long localized
dialog content scrolls vertically within the mobile viewport; keyboard navigation
keeps the actions accessible. No horizontal overflow was found.

## Tests run

| Command / check                                   | Final result                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run lint`                                    | Passed, zero warnings                                                    |
| `npm run format:check`                            | Passed                                                                   |
| `npm run typecheck`                               | Passed                                                                   |
| `npm test`                                        | 107 passed across 6 files                                                |
| `npm run build`                                   | Passed production build; provider IDs explicitly blank                   |
| `npm run test:e2e -- tests/e2e/analytics.spec.ts` | 14 passed after fixes                                                    |
| `npm run test:e2e`                                | 108 passed, no retries, 3.7 minutes                                      |
| axe inside E2E                                    | 28 WCAG 2 A/AA and 2.1 AA scans, zero violations                         |
| Responsive matrix                                 | All four locales at 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920 px |
| `npm audit --omit=dev --json`                     | Exit 0, zero vulnerabilities                                             |
| `npm audit --json`                                | Exit 1, five existing high dev-dependency findings                       |
| `git diff --check`                                | Passed                                                                   |
| Visual-source SHA-256 verification                | All 6 match the existing manifest                                        |

## Tests result

All application quality gates passed. The 29 new unit tests cover consent schema,
expiry and storage failures; strict event parameters; required purposes; no
pre-consent replay; async revocation, duplicate loading, provider failures and
safe vendor context. GTM-specific tests verify denied delayed bootstrap and
successful consent grant only after loading and a live check.

Browser coverage verifies first visits, saved/reopened/revoked choices, modal
Tab/Escape/focus, analytics-only choice, cross-tab synchronization with preserved
form values, blocked storage, sticky CTA, language events and successful/invalid/
failed lead submissions. PII-bearing test URLs and form values never enter the
neutral event payload; blank IDs cause no vendor requests even after consent.
The existing full suite also verifies SEO in unconfigured/production/preview/
staging contexts, attribution, server lead rejection, visual layout, no-JS
navigation, console errors, mobile controls and RTL process direction.

The dependency audit is the only nonzero gate: the unchanged development chain
`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`
has five high findings. Production dependencies have zero. The suggested audit
fix downgrades the Next ESLint configuration across a major version; no unrelated
dependency changes were applied in this phase.

## Known issues

- This is readiness, not vendor activation: no real IDs or live vendor traffic
  were used. Actual account/container settings require the activation review in
  [the analytics contract](../src/lib/analytics/README.md).
- GTM requires an audited consent template and manual-event tags. Vendor code
  cannot be undone by removing a script. Application event gating, explicit
  revocation and known-cookie cleanup do not certify arbitrary container code.
- To avoid implicit URL/referrer PII, vendor loading/dispatch is blocked in unsafe
  context, including normal UTM query pages. Lead first-touch attribution remains
  intact; the safe neutral bus is still available after optional consent.
- Existing development audit findings remain as recorded above.
- Existing missing-domain, approved OG/logo/contact and lead-destination inputs
  retain the prior safe behavior; no values were invented.

## Pending inputs

- Real analytics IDs and approved GA4/GTM/Meta account/container configuration,
  including disabled automatic form/DOM collection and advanced matching.
- Owner/legal approval of consent and privacy copy before public activation.
- Previously pending production origin, approved branding/OG/contact assets and
  lead receiver when the owner is ready to configure them.

## Next step

Stop after the separate Phase 5 commit and push. Phase 6 remains unstarted and
requires explicit user approval. Real provider activation is a separate reviewed
configuration step; it does not happen automatically with this delivery.
