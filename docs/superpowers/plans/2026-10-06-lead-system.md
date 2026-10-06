# Lead System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution is authorized by the Phase 4 request.

**Goal:** Add an honest, validated multilingual lead journey without inventing a recipient or starting analytics.

**Architecture:** A shared server LeadSection wraps a client React Hook Form. A bounded Zod request contract is validated again by the API before a server-only webhook adapter receives it. First-touch attribution uses session storage; mobile CTA and form focus progressively enhance existing anchors.

**Tech Stack:** Existing Next.js/React/TypeScript, React Hook Form, Zod, resolvers, Vitest, Playwright and axe.

**Spec:** CODEX_TASK.md and the approved Phase 4 user request.

## Global constraints

- Repository shakogt-alt/dragon-point-site; branch codex/landing-mvp only.
- EN / KA / RU / HE share components; HE retains document RTL and Noto Sans Hebrew.
- Preserve existing SEO, fonts, palette, sections and dictionary separation.
- No KleekTo, analytics, fabricated contact data, CRM destination or payload logging.
- A missing/failed webhook returns unavailable, never a fabricated success.

## Review focus

- Blocked/corrupt session storage must not prevent submission; locale changes retain first touch when storage is available.
- Huge/invalid requests, honeypot, cross-origin requests and rate exhaustion must fail before delivery.
- Webhook timeouts, redirects and non-2xx responses must preserve the form and show a localized generic error.
- Hebrew phone/email values stay LTR while labels, intent order and feedback follow RTL.
- Sticky CTA must disappear for keyboard, lead visibility, open navigation or marked consent UI; respect safe areas and reduced motion.

### Task 1: Lead contract and attribution

**Files:** src/lib/validation/lead.ts; src/lib/leads/attribution.ts, payload.ts; tests/unit/leads.test.ts.

**Interfaces:** leadFormSchema / leadRequestSchema; LeadFormValues / LeadPayload; captureFirstTouch(storage, href, referrer); buildLeadPayload(values, locale, attribution).

- [ ] Write/run failing tests for international phones, optional email, invalid/oversized text, first-touch persistence, corrupt/blocked storage and payload normalization.
- [ ] Implement bounded/normalized schemas and allowlisted attribution fields with snake_case UTM keys, click IDs, referrer and landingUrl.
- [ ] Run the whole unit suite and verify these contracts before UI use.

### Task 2: Server boundary and adapter

**Files:** src/lib/leads/service.ts, rate-limit.ts, handler.ts; src/app/api/leads/route.ts; tests/unit/lead-handler.test.ts.

**Interfaces:** createLeadService(env, fetcher).submit(payload); createRateLimiter(options); createLeadHandler({service, limiter, env}).

- [ ] Write/run failing tests for validation bypass, honeypot, bounded streaming body, same-origin policy, rate limits and unconfigured/delivered/failed adapter results.
- [ ] Implement 16 KiB request ceiling, no-store replies, generic codes, strict validation and bounded per-process limiting. Trust a client IP only on the configured Vercel platform; otherwise use a shared budget.
- [ ] Add optional HTTPS webhook/token configuration with timeout, no redirect following and no payload/error logging. Run the unit suite.

### Task 3: Shared form and CTA journey

**Files:** LeadSection.tsx, LeadForm.tsx, MobileLeadCTA.tsx; Landing.tsx, Hero.tsx, GoalSelector.tsx, Footer.tsx; src/messages/*.json; src/styles/leads.css, globals.css.

- [ ] Write/run browser failures for missing form, intent selection, attribution, validation focus, error preservation and success state.
- [ ] Render Name/Phone, optional Email/Budget/Message, preferred language and native intent radios. Use localized field errors, accessible busy/status states and hidden honeypot.
- [ ] Move advisor target to lead section; preserve footer contact text. Hero/goal/advisor actions focus the form; goal card/CTA preselects intent without reversing source order.
- [ ] Implement mobile sticky link after Hero, hiding for form/keyboard/menu/consent. Use safe-area CSS, logical layout and reduced-motion behavior.

### Task 4: Verification and delivery

**Files:** tests/e2e/leads.spec.ts, landing.spec.ts; playwright.config.ts; README.md; docs/phase-4-report.md; docs/screenshots/phase-4/*.png.

- [ ] Verify all locales and eight required widths, existing SEO profiles, keyboard/mobile/RTL and axe. Save EN desktop, EN sticky mobile, RU desktop, HE desktop and HE mobile screenshots.
- [ ] Run lint, format check, typecheck, all unit tests, production build and all E2E.
- [ ] Independent read-only review; address findings and run relevant final gates.
- [ ] Commit/push Phase 4; verify remote HEAD/artifacts and clean tree. Stop before Phase 5.
