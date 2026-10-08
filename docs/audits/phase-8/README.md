# Phase 8 audit evidence

Repository `shakogt-alt/dragon-point-site`, branch `codex/landing-mvp`, base
`e6e8f6bfca75fb7b1fd38517a7a35c09274baa41`; audit date 2026-10-08.

**No staging exists.** This is preparation and local regression evidence, not
hosted HTTPS/CDN, physical-device, real lead-delivery or field CWV verification.
The owner confirmed no existing project/preview URL. Launch recommendation is
NO-GO; see [the report](../../phase-8-launch-readiness-report.md) and
[the future preview runbook](../../staging/preview-runbook.md).

## Evidence inventory

- `target-inventory.json`: presence-only local/connector/project inventory and
  exact missing authenticated hosting prerequisite; no secret values.
- `gate-results.json`: completed commands, exit statuses, test counts and explicitly
  blocked real-host/device gates. Full dependency audit remains nonzero.
- `local-staging-observations.json`: localhost staging-mode statuses, allowlisted
  headers, four mobile locale refresh/font/Hero checks and two requests per asset.
  The requests describe local/origin policy, not CDN cold/warm behavior.
- `public-output-scan.json`: final blank-ID build file counts, bounded scan
  limitations, findings and public asset hashes. No configured real credentials
  exist; absence of marker matches does not prove absence of every unknown secret.
- `audit-production.json` / `audit-all.json`: fresh dependency audit JSON, zero
  production vulnerabilities and five inherited high development findings.
- `changed-files.json`: exact Phase 8 file inventory; prior generated screenshot
  fixtures are restored and are not Phase 8 evidence.

## Local reproduction

Use this revision and the existing lockfile. Node 24 LTS and installed Playwright
Chromium/Firefox/WebKit are prerequisites. Never use real provider IDs or delivery
configuration in regression builds. Tests intercept synthetic vendor requests;
do not run campaign fixtures against a live account or public host.

```powershell
# From the repository root, using an isolated process with no real .env files.
$env:SITE_ENV = 'staging'
$env:VERCEL_ENV = 'preview'
$env:VERCEL = ''
$env:SITE_URL = ''
$env:OG_IMAGE_URL = ''
$env:LEAD_WEBHOOK_URL = ''
$env:LEAD_WEBHOOK_TOKEN = ''
$env:NEXT_PUBLIC_GA_ID = ''
$env:NEXT_PUBLIC_GTM_ID = ''
$env:NEXT_PUBLIC_META_PIXEL_ID = ''
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
node scripts/staging-readiness-audit.mjs
npm audit --omit=dev
npm audit
```

The full suite includes browser journeys, axe, all four locale SEO/RTL and the
360/390/430/768/1024/1280/1440/1920 responsive matrix. The audit script starts and
stops its own localhost server; final blank-ID build must exist first.

For the separate intercepted campaign variants, keep the same server-only blank
configuration and build one variant at a time:

```powershell
$env:DP_TEST_PROVIDER = 'ga-meta'
$env:NEXT_PUBLIC_GA_ID = 'G-DPTEST1234'
$env:NEXT_PUBLIC_GTM_ID = ''
$env:NEXT_PUBLIC_META_PIXEL_ID = '123456789012345'
npm run build
npx playwright test --config=tests/e2e/campaign.config.ts

$env:DP_TEST_PROVIDER = 'gtm'
$env:NEXT_PUBLIC_GA_ID = ''
$env:NEXT_PUBLIC_GTM_ID = 'GTM-DPTEST12'
$env:NEXT_PUBLIC_META_PIXEL_ID = ''
npm run build
npx playwright test --config=tests/e2e/campaign.config.ts

# Restore the final safe artifact; NEXT_PUBLIC values are embedded at build time.
$env:DP_TEST_PROVIDER = ''
$env:NEXT_PUBLIC_GA_ID = ''
$env:NEXT_PUBLIC_GTM_ID = ''
$env:NEXT_PUBLIC_META_PIXEL_ID = ''
npm run build
npm run test:e2e
node scripts/staging-readiness-audit.mjs
```

Do not build or run type generation while browser tests use the same `.next`
directory. Run Lighthouse separately from builds/E2E, only after the legitimate
HTTPS preview prerequisite is fulfilled. No staging Lighthouse or screenshot
results are represented by these local artifacts.
