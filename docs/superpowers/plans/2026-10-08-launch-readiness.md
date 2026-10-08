# Phase 8 Staging & Launch Readiness Audit Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native execution and one fresh final review. Steps use checkboxes; report blocked hosting work explicitly.

**Goal:** Prepare a safe preview deployment and audit all verifiable launch gates without inventing a hosting target.

**Architecture:** Preserve Phase 1–7B components, environment SEO guard, server lead boundary and deterministic consent boot. Add deployment packaging/configuration and conservative response headers; audit existing functionality rather than building features.

**Tech Stack:** Existing Next.js, Playwright/axe, Vitest, Vercel connector, production build, pinned Lighthouse setup from Phase 7B when a legitimate HTTPS target exists.

**Spec:** User Phase 8 attachment dated 2026-10-08; AGENTS.md, CODEX_TASK.md, Phase 7/7B reports.

## Global Constraints

- Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`, base `e6e8f6bfca75fb7b1fd38517a7a35c09274baa41`.
- No production deployment, main merge, public indexing, account creation, DNS changes, real IDs or KleekTo integration.
- Owner confirmed no staging project exists; connector returns no matching projects/teams. Hosting/CDN/device results must remain blocked/unverified, not relabeled localhost evidence.
- Keep real destination/configuration empty; synthetic lead and vendor tests must be intercepted/local only. Never print secrets.
- One separate Phase 8 commit/push is already authorized; no intermediate delivery approvals are needed.

## Review Focus

- Preview env must veto production indexing, even when production-like build mode is used.
- Packaging must retain all application/font/image/build inputs and exclude private/diagnostic files.
- Headers must preserve Next inline hydration, lazy chunks, consent, attribution and future reviewed provider activation.
- Unconfigured lead delivery must remain a visible generic failure; a mocked success is not real receiver verification.
- Missing hosting/device/editorial inputs must be classified as unresolved, not silently treated as passed.

### Task 1: Establish target and environment status

**Files:** Evidence inventory and final report.
**Interfaces:** Read-only Git/Vercel/environment presence inventory; no values or mutations.

- [x] Read all required briefs, verify base/branch/origin/clean tree.
- [x] Inspect local link, CLI, env key presence and authenticated connector projects/teams; ask for an existing target.
- [x] Record owner confirmation that no target exists; choose the authorized preparation-only fallback.

### Task 2: Prepare conservative deployment configuration

**Files:** `next.config.ts`, `src/proxy.ts`, `vercel.json`, `.vercelignore`, `.env.example`, `playwright.config.ts`, `tests/e2e/staging.spec.ts`.
**Interfaces:** Next response headers preserve application/SEO behavior; Vercel config has no project IDs, domains or credentials.

- [x] Write HTTP-boundary E2E assertions for nosniff/referrer/frame/permissions protection and uncached API methods.
- [x] Run against existing production build; expect failure for absent headers (RED).
- [x] Add conservative headers, framework/build/install config and private upload exclusions.
- [x] Build and run the assertions; expect GREEN. Add a reproduced malformed-path regression and pathname guard; all six boundary tests pass.

### Task 3: Record local fallback audit and hosting runbook

**Files:** `scripts/staging-readiness-audit.mjs`, `docs/audits/phase-8/`, `docs/staging/preview-runbook.md`.
**Interfaces:** Production-build local staging observations are explicitly labeled localhost; future real HTTPS audit requires verified project/environment/source.

- [x] Inspect routes/refresh, response headers, crawler documents, assets, invalid URLs/methods and sensitive paths; record status/header evidence without payloads or secrets.
- [x] Scan final public/static client output for private files, actual local paths, source maps, test IDs/data and any configured private values; never print match contents.
- [x] Prepare exact env classification, HTTPS/CDN cold/warm protocol, five-run mobile measurement procedure, lead receiver test and nine required staging screenshot targets.
- [x] Link Phase 7B medians as historical localhost evidence, with real staging performance/cache/device/visual results blocked.

### Task 4: Full gate and launch decision

**Files:** `docs/phase-8-launch-readiness-report.md`, `tests/unit/lead-handler.test.ts`, evidence and plan.
**Interfaces:** Gate results + input matrix determine P0/P1/P2/P3 and GO/CONDITIONAL GO/NO-GO.

- [x] Run lint, format, typecheck, unit, both synthetic-provider builds/mocks, final blank-ID production build and full E2E/axe/responsive/Chromium/Firefox/WebKit. Record initial Firefox timeout and successful unchanged serial/full repeats.
- [x] Run both dependency audits; record nonzero full-audit findings accurately.
- [x] Finish all required report sections, input matrix, production checklist and exact blocked prerequisites.
- [x] Obtain one fresh read-only review; no Critical/Important issues. Defer one Minor local audit port/child ownership issue as L8-11, explicitly recorded in the report.
- [ ] Commit/push separately; verify remote SHA, report/evidence and clean tree; stop.
