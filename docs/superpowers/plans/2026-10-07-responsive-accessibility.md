# Phase 6 Responsive & Accessibility Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden the approved landing journey across four locales and three browser engines without redesign.

**Architecture:** Preserve the shared component tree and all Phase 1–5B contracts. Reproduce usability defects in browser tests before applying focused component/CSS fixes. Extend Playwright with critical cross-browser journeys and a complete responsive/state audit.

**Tech Stack:** Next.js, React Hook Form, Playwright, axe, Vitest.

**Spec:** User Phase 6 attachment, `AGENTS.md`, `CODEX_TASK.md`.

## Global Constraints

- Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`, starting HEAD `7bd31947ac2fa8b7b7043538849187dc8ba8f425`.
- EN/KA/RU/HE share one tree; Hebrew keeps document RTL and logical/source order.
- Preserve brand, supplied imagery, SEO, leads, attribution, consent and analytics contracts.
- No real analytics IDs, KleekTo connection or new imagery.
- One separate Phase 6 commit and push; stop before Phase 7.

## Review Focus

- Short mobile screens: all consent/menu actions must remain reachable.
- Keyboard viewport changes: focused fields stay clear of header/keyboard and sticky CTA.
- Invalid forms: localized errors are associated and announced, focus reveals the first invalid field.
- Keyboard navigation: focus is visible, disclosure exit and modal Escape restore it logically.
- Localized long strings: controls fit without clipping, RTL photography/utility icons never mirror.

### Task 1: Reproduce and harden interactions

**Files:** Existing Header, LeadForm, MobileLeadCTA, consent/style files only where defects are proven; `tests/e2e/hardening.spec.ts`.

**Interfaces:** Existing native disclosures, lead field IDs, consent actions and locale dictionaries remain stable.

- [x] Audit baseline screenshots/DOM and add regression assertions for verified defects.
- [x] Run assertions against starting build; record the specific failures.
- [x] Implement minimal fixes and rerun affected tests.

### Task 2: Expand coverage and deliver evidence

**Files:** `playwright.config.ts`, `tests/e2e/hardening.spec.ts`, `tests/e2e/responsive.spec.ts`, `docs/screenshots/phase-6/`, `docs/phase-6-report.md`.

**Interfaces:** Mock only lead delivery and vendor downloads; production UI/locale copy stays real.

- [x] Add Chromium/Firefox/WebKit critical journeys for every locale.
- [x] Audit eight widths plus 360×640, 390×640 and 430×740, consent/menu/lead states, axe and reduced motion.
- [x] Save and inspect required screenshots; include before/after for visible fixes.
- [x] Run lint, format, typecheck, unit, build, full E2E, audits and mocked campaign regression.
- [x] Review final diff and document evidence/limitations. Commit/push and remote verification are recorded in the final delivery response.

## Execution notes

User has already authorized implementation and delivery; continue inline without an intermediate approval gate. Browser emulation is not physical-device or screen-reader coverage. Soft-keyboard viewport changes are simulated and reported as such.

Independent review identified consent-banner occlusion and it was fixed with
cross-browser/short-screen assertions. Additional verified focus, border contrast,
validation announcement and localized process spacing defects are documented in
the Phase 6 report. Full E2E: 208 passed; unit: 118 passed; mocked campaign: 5 + 5
passed. Delivery verification and remote SHA are reported in the final response.
