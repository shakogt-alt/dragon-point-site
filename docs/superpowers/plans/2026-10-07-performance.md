# Phase 7 Performance Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce measured production load costs while preserving all Phase 1–6 behavior and visuals.

**Architecture:** Keep static sections server-rendered, consent/attribution deterministic,
and interactive islands immediately available. Optimize only measured asset/runtime costs.

**Tech Stack:** Next.js 16.3.8, Lighthouse 13.5.0, Playwright/CDP, existing fonts/images.

**Spec:** User Phase 7 attachment, `AGENTS.md`, `CODEX_TASK.md`.

## Constraints

- Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`.
- Starting HEAD `b6694ca9d5ec3d3be9a958aa8f3eb0aecd98967a`, clean tree.
- No redesign, real analytics IDs, production inputs, KleekTo integration, deployment or main merge.
- Baseline evidence must precede application changes; raw timing thresholds stay out of CI.
- Chrome DevTools MCP is unavailable; use pinned Lighthouse and Playwright/CDP locally.

### Task 1: Establish baseline

- [x] Build with blank vendor IDs; record EN/HE at mobile 390 and desktop 1440.
- [x] Run three sequential Lighthouse audits per case; retain compact results and medians.
- [x] Record bytes, fonts, image candidates, bundles, caching, layout/interaction observations.
- [x] Identify measured bottlenecks before selecting implementation changes.

### Task 2: Optimize and verify

- [x] Add stable assertions for verified asset/runtime regressions; demonstrate baseline failures.
- [x] Apply small measured changes without altering typography, crop, semantics or contracts.
- [x] Repeat the same lab setup and inspect visuals/layout shifts and all four locales.
- [x] Run full lint/format/types/unit/build/E2E/axe/audits and mocked campaign variants.
- [x] Review the final patch and document evidence, remaining risks and launch inputs.

Delivery: separate Phase 7 commit/push, verify remote SHA/report/performance evidence
and clean tree, then stop. Delivery verification is recorded in the final response.
