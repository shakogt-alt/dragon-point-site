# Phase 2 — SEO Foundation Implementation Plan

> **For agentic workers:** Execute natively in this chat, following the user's approved CODEX_TASK.md phase sequence. Use TDD and verification-before-completion; stop before Phase 3.

**Goal:** Complete multilingual SEO without inventing a domain, contact data or final artwork.

**Architecture:** Shared server-only SEO builders consume locale dictionaries and validated environment configuration. Runtime metadata, crawlers and a response proxy use one indexing policy, so a preview cannot reuse indexable output from a production build.

**Tech Stack:** Existing Next.js App Router, TypeScript, Vitest and Playwright; no new dependencies.

**Spec:** CODEX_TASK.md, AGENTS.md and the user's Phase 2 request.

## Global constraints

- Work only in shakogt-alt/dragon-point-site on codex/landing-mvp.
- Preserve /en /ka /ru and root redirect; no empty future SEO pages or Phase 3 UI.
- Unknown production inputs remain unset; never infer an origin from a request host.
- Production can be indexable; preview/staging must be noindex.
- JSON-LD: Organization, RealEstateAgent and WebSite; only known data.
- OG image support is 1200×630; no final artwork is fabricated.

## Review focus

- Missing/invalid SITE_URL must block indexing and omit fabricated absolute links.
- NODE_ENV=production is a build mode, not permission to index previews.
- VERCEL_ENV=preview must veto SITE_ENV=production.
- Runtime environment changes must not reuse a build's cached SEO policy.
- JSON-LD content containing closing script tags must remain safe JSON data.

## Task 1 — Environment policy and locale metadata

Files: src/lib/seo/config.ts, metadata.ts, src/messages/{en,ka,ru}.json;
tests/unit/seo.test.ts.

- [ ] Write tests for accepted HTTPS origins, rejected malformed/credential/path URLs,
      production/preview/staging/missing-origin policies and NODE_ENV independence.
- [ ] Write tests for three localized titles/descriptions, absolute self-canonical,
      reciprocal en/ka/ru + x-default → /en, OG locales and optional image dimensions.
- [ ] Run tests red, then implement getSeoConfig(env), buildLocaleMetadata(locale,
      messages, config) with no default production origin. Run tests green.

## Task 2 — Structured data, crawlers and runtime integration

Files: src/lib/seo/structured-data.ts, crawlers.ts, src/proxy.ts,
src/app/robots.ts, sitemap.ts, [locale]/{layout,page}.tsx, next.config.ts.

- [ ] Test buildStructuredData(locale, messages, config), serializeJsonLd(data),
      buildRobots(config) and buildSitemap(config) for all policies, graph references,
      forbidden invented fields, script escaping and exactly three locale URLs.
- [ ] Run tests red, implement builders, run tests green.
- [ ] Wire generateMetadata and JSON-LD into the locale page. Keep one H1.
- [ ] Read runtime environment for pages/crawlers; proxy sets X-Robots-Tag only
      when blocked. Remove the old unconditional next.config header.

## Task 3 — Browser verification and delivery

Files: playwright.config.ts, tests/e2e/seo.spec.ts, .env.example, README.md,
src/lib/seo/README.md, docs/phase-2-report.md.

- [ ] Start production-build servers with test-only .test origin for production,
      preview and staging; also test production with no origin. Never deploy fixtures.
- [ ] Verify rendered metadata, H1, JSON-LD, robots/sitemap XML, OG/Twitter and
      missing-domain fallback; keep all Foundation navigation/accessibility tests.
- [ ] Run lint, format check, typecheck, full unit suite, build and full E2E suite.
- [ ] Review final diff, write required report, commit Phase 2 and push normally.
- [ ] Verify remote SHA, remote report and clean working tree; stop before Phase 3.
