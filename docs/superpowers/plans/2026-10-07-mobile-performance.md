# Phase 7B Mobile Performance Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native execution and a fresh final review. Steps are checked only after their evidence exists.

**Goal:** Diagnose and reduce mobile blocking without changing approved functionality, typography, visuals, SEO or privacy.

**Architecture:** Retain shared locale components and immediate consent. Use production chunk metadata and browser traces to choose measured changes; keep server validation and deterministic first-touch capture intact.

**Tech Stack:** Existing Next/React/RHF/Zod, Turbopack analyzer, pinned Lighthouse 13.5.0 and Playwright Chromium/CDP.

**Spec:** User Phase 7B attachment; `AGENTS.md`, `CODEX_TASK.md`, `docs/phase-7-report.md`.

## Global Constraints

- Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`, base `ea83cfc988fc0e2a0ab70ed4b085b12ab889f454`.
- No deployment, main merge, product features, real IDs, production inputs or KleekTo connection.
- Same Phase 7 mobile 390×844 DPR2 and simulated throttling/cache setup; five mobile samples per locale and desktop sanity.
- Do not increase initial JS, worsen EN/HE LCP or CLS, or reduce accessibility/SEO/best practices.
- Immediate CTA/goal/keyboard readiness and preserved intent are required if form delivery changes.
- Separate final Phase 7B commit/push; the user's single-phase delivery overrides per-task commits and intermediate approval prompts.

## Review Focus

- A CTA activated before a deferred chunk resolves still reaches a usable form with the selected intent.
- Keyboard focus and native form values survive initialization, validation and resize.
- Storage denial, saved consent and campaign URLs retain capture → cleanup → activation ordering.
- Consent/menu changes suppress sticky CTA without document-wide forced layout or missed updates.
- Loss of a deferred module fails closed, retains input and allows recovery.

### Task 1: Trace and bundle diagnosis

**Files:** `scripts/performance-audit.mjs`, new diagnostic scripts, `docs/performance/phase-7b/`.
**Interfaces:** Production audit saves Lighthouse artifacts plus raw scratch traces; analyzer metadata identifies actual compiled module sizes; compact trace analysis produces attributed tasks and timing/resource evidence.

- [x] Preserve Phase 7 evidence; save five EN and HE mobile baseline samples plus desktop sanity.
- [x] Parse production Turbopack chunk parts and verify analyzer does not change client chunks.
- [x] Analyze main-thread tasks, CPU samples, LCP nodes/resources, font/style/layout/paint and each client subsystem.
- [x] Compare HE Phase 6/7 evidence with repeated current samples and a controlled causal experiment if needed; do not assert variance without evidence.

### Task 2: Measured optimization

**Files:** Only client modules implicated by Task 1; E2E regression tests.
**Interfaces:** Existing CTA, consent, attribution, analytics event and lead payload contracts remain authoritative.

- [x] Record the trace-supported hypothesis and exact edit/test in the ledger before implementation.
- [x] Add a failing behavioral/resource assertion, observe RED, implement the smallest architectural fix and observe GREEN.
- [x] Verify immediate first-visit consent, every form activation path, loading failure, RTL and sticky behavior.
- [x] Run unit suite after each accepted change; discard experiments that fail correctness or measured acceptance.

### Task 3: Acceptance and delivery

**Files:** `docs/phase-7b-report.md`, compact baseline/final/bundle/trace evidence.
**Interfaces:** Same audit emits five mobile samples and ranges; full existing regression matrix verifies preserved behavior.

- [x] Run lint, format, typecheck, unit, production build, full E2E/axe/responsive/cross-browser, both mocked provider variants and both dependency audits.
- [x] Repeat isolated final audits, compare Phase 7 and Phase 7B baseline/final, and document exact residual costs and launch Go/No-Go.
- [x] Obtain one fresh read-only whole-patch review; fix material findings with regression tests.
- [ ] Commit/push separately, verify remote SHA/report/evidence and clean tree, then stop.
