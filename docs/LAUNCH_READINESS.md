# DRAGON POINT — LAUNCH COMPLETION MASTER REPORT

2026-10-10, Asia/Tbilisi. Baseline:
`3812ae1b89a8615005b76706b9bb82084745c620`.
This report records the uncommitted normalization patch and release gates.
[CURRENT_STATE](CURRENT_STATE.md) is the current implementation reference;
`CODEX_TASK.md` remains the requirements authority.
[OWNER_DECISIONS](OWNER_DECISIONS.md) records unresolved approvals.

## 1. Executive status

NOT READY for launch. The existing Preview is READY, but protected hosted
application QA, durable lead delivery, production origin, legal/consent approval
and P1 editorial/asset/performance inputs remain open. A deployed Preview is not
production clearance. No commit, push, deployment, DNS or access changes occurred.

## 2. Git truth

Initial worktree clean; branch `codex/landing-mvp`.
`git fetch origin` completed without changing remote branches.
HEAD, origin/codex/landing-mvp and origin/staging/phase-8a all equal
`3812ae1b89a8615005b76706b9bb82084745c620`.
origin/main equals `dbbea00668e2f58cc925dd598b297bb6ecc7bbc1`.
The final worktree is intentionally dirty with this reviewable local patch;
HEAD remains unchanged. A second read-only fetch after the full gate reconfirmed
all four SHAs and the current branch; no remote drift occurred.

## 3. Vercel truth

Project `prj_x9FOZhZkLivcqqomlYEMUey59E5k`, `dragon-point-site`, reports
`live=false`. Preview `dpl_6cpq1pzq1n1UBr4SNQDvHjBFrL8S` is READY,
`target=null`, from staging/phase-8a at the authoritative SHA.
[Exact Preview](https://dragon-point-site-9l6f12y5r-shako-s-projects2.vercel.app).
Authentication enabled: `all_except_custom_domains`; no change made.
The production listing contains one CANCELED deployment,
`dpl_9xJi2tSoHwZX8FaPv5byxnL9uVkq`, and no active production deployment.
Unauthenticated /en returned HTTP 302 to Vercel SSO, not application content.
Hosted environment values and browser access are not established by API metadata.

## 4. Completed architecture

Next.js 16.3.8, React 19.3.0, TypeScript 6.0.3, Tailwind 4.3.3, Node 24.17.0 and
npm 11.13.0 in the local audit. Four dictionaries feed one Landing component tree,
with server sections and focused client navigation/form/consent islands.
Hebrew has document lang/RTL, logical CSS, isolated Latin values and compatible
self-hosted font. Brand tokens, locale content and lead service are separated.

Lead validation, normalized payload, 16 KiB body bound, honeypot, same-origin
guard, bounded per-process rate limiter and optional HTTPS delivery are present.
Missing delivery fails safely with 503/retry, never false success.
SEO/crawler/JSON-LD policy is configuration-based and fails closed; production
requires a confirmed HTTPS SITE_URL plus production environment.
Attribution capture/cleanup, consent and optional measurement are separate.
No portal, CMS, accounts, AI chat or public KleekTo integration was added.

## 5. Requirement conflicts

Privacy route: CODEX_TASK requires a legal-review placeholder route; current
implementation is inline disclosure only. Decision C remains pending, with ISSUE /
REASON / PROPOSED CHANGE / IMPACT documented. No route or legal content change made.

Campaign handoff and safe unrelated queries are owner decisions A/B; current code
remains unchanged. Mobile Performance >=90 remains an unmet historical local
requirement, not a silently relaxed target. Any amendment needs explicit change
control and owner approval.

## 6. Documentation debt

Corrected current README Phase 5/6 gate and obsolete Phase 5B cleanup description.
Corrected analytics capture/cleanup/provider-context contract and operational
preview runbook boundary. Added the reconciliation matrix, owner decisions and
this report. Historical phase reports and their evidence remain unchanged,
including Phase 8's dated no-staging and old blank-ID cleanup statements.

Changed files:

- .prettierignore
- README.md
- docs/CURRENT_STATE.md
- docs/LAUNCH_READINESS.md
- docs/OWNER_DECISIONS.md
- docs/staging/preview-runbook.md
- src/lib/analytics/README.md
- next.config.ts
- src/app/favicon.ico/route.ts
- tests/e2e/staging.spec.ts

Generated logs/builds/traces remain ignored. Historical screenshot output from
test runs is restored to baseline bytes rather than substituted as new evidence.

## 7. Code findings

| Area                          | Evidence / finding                                                                                                   | Classification / disposition                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Attribution capture           | Original/stored first touch is cached before cleanup; lead payload retains original URL and fields                   | Implemented; no confirmed current blocker                                     |
| Cleanup                       | Only seven exact campaign keys removed regardless of consent/IDs; unrelated values/hash stay; encoding may normalize | Current contract; docs corrected                                              |
| Session fallback              | Corrupt/blocked/read/write failures keep document memory; full navigation persistence requires storage               | Known limitation, P2 documentation                                            |
| Consent/analytics             | Purpose gates, 180-day expiry, cross-tab revocation, no replay, enum-only events; IDs inactive locally               | Infrastructure ready; real account behavior not certified                     |
| Vendor campaign handoff       | No explicit campaign/click mapping; safe unrelated queries still block providers                                     | Owner A/B, before affected activation                                         |
| Lead delivery                 | HTTPS/timeout/no redirects; safe missing-receiver error                                                              | P0 production input, not false-success defect                                 |
| Rate limit                    | Per process/instance, cold-start reset; bounded bucket storage and trusted platform header                           | P2 infrastructure limitation                                                  |
| Lead methods                  | Framework 405 had no Allow                                                                                           | P2 local fix: OPTIONS, POST header; exact HTTP regression                     |
| Favicon                       | Baseline 404, approved icon absent                                                                                   | P2 temporary mitigation only: dynamic empty 204; approved final asset pending |
| SEO/RTL                       | Shared dynamic environment policy, reciprocal configured SEO, he_IL, one H1, document RTL                            | Local gate; hosted/native signoff remains                                     |
| Headers/cache/malformed input | API no-store, nosniff/frame/referrer/permissions; bad encoded path 400; hashed assets immutable                      | Local gate; actual host/HSTS/cache must be measured                           |
| CSP                           | Frame ancestors only; no tested script/nonces policy                                                                 | P2 separate hardening work, no guessed policy                                 |
| Audit helper                  | Existing fixed-port local helper can accept a stale compatible listener; writes historical Phase 8 evidence          | P2; do not reuse before ownership fix                                         |
| Dependency audit              | Production audit clean; full audit retains development chain findings                                                | P2 / TOOLCHAIN MAINTENANCE; not a P0/P1 launch blocker                        |

P3 future enhancements: optional post-launch field performance measurement and
shared rate-limit infrastructure if operating evidence warrants it. These are not
new MVP requirements, and no implementation was added.

Initial independent source review found no defect; runtime testing then exposed
the favicon static metadata/cache edge. That edge was investigated and corrected
rather than relying on the review verdict. Final review and gate results follow.

## 8. P0 blockers

- No verified durable receiver or real end-to-end delivery.
- Final production origin and approved public contact model unresolved.
- Privacy/legal and consent approval unresolved; route/content decision C pending.
- Protected hosted application gate incomplete. Staging exists now; access and
  audit completion replace the historical no-target blocker.

## 9. P1 blockers

- Hosted repeated mobile performance audit and budget resolution.
- Native KA and HE visible/SEO/form/privacy/consent signoff.
- Final logo or approved current wordmark; approved OG asset/configuration.
- Physical mobile QA or explicit owner QA decision before launch.
- Vendor activation decisions/account/container/network review if tracking is used.

## 10. P2 cleanup

Local changes correct stale current docs and lead Allow. The empty favicon 204 is
only a temporary mitigation of browser 404s while the approved favicon/master logo
asset is pending, not a final production fix. No icon, fantasy artwork or final
asset is invented, and runtime/visual/dependency code is unchanged by this review. The formatting ignore now excludes private generated .vercel CLI files; no
tracked source or deployment record is excluded or rewritten. Remaining:
development audit findings, frame-only CSP,
per-instance rate limiting, historical Firefox reliability observation and local
audit-helper port ownership. The current run does not reinterpret historical
flakiness as a new failure or proof it can never recur.

## 11. Owner decisions

A: vendor campaign handoff. B: safe unrelated-query coexistence.
C: Privacy Policy route/content model. None implemented without approval.
Also required: protected audit access, production inputs, applicable performance/
device decisions and GO for the exact fully tested release.
Blank optional tracking may remain off; it does not itself block launch.
See OWNER_DECISIONS for exact input/impact records.

## 12. Test status

Prior complete runtime-gate results follow. All functional checks passed; the full npm
audit remains nonzero, classified P2 / TOOLCHAIN MAINTENANCE rather than a P0/P1
launch blocker. This post-master review changes documentation only; the prior
140-unit/250-browser/focused HTTP results remain the runtime evidence. Targeted
validation for this review repeats lint, formatting, typecheck and whitespace
checks only. The full E2E suite is not repeated because runtime code is unchanged.

| Command                       | Final result                                           |
| ----------------------------- | ------------------------------------------------------ |
| npm run lint                  | Exit 0; 31.32 s                                        |
| npm run format:check          | Exit 0 after generated CLI state exclusion             |
| npm run typecheck             | Exit 0; 12.56 s                                        |
| npm test                      | Exit 0; 140 tests / 10 files; 14.48 s                  |
| npm run build                 | Exit 0; 29.03 s                                        |
| npm run test:e2e              | Exit 0; 250 passed, retries 0; 832.29 s (13.8 m)       |
| npm audit --omit=dev          | Exit 0; 0 vulnerabilities; 4.17 s                      |
| npm audit                     | Exit 1; 5 high development dependency findings; 8.54 s |
| git diff --check              | Exit 0 on the final local patch                        |
| Focused HTTP regression       | Exit 0; 8 passed; 25.80 s                              |
| Planned hosted command syntax | node --check passed; command NOT executed              |

Failure history is retained: baseline focused RED = 2 failed / 1 passed
(missing Allow and favicon 404). First implementation HTTP gate = 1 failed /
7 passed: cached favicon 204 was reconstructed with a Buffer body and returned 500. The first full E2E attempt was interrupted after this deterministic failure
was known; it is not a completed passing suite. Its process exit was 1.
The favicon route now explicitly opts into dynamic handling, avoiding metadata
response caching. A new build and the complete gate above verify this code correction.
No timeout/retry/console filtering or assertion weakening was added.

First attempt: lint/typecheck/unit/build passed, 140 unit tests / 10 files;
production audit exit 0 (0 vulnerabilities), full audit exit 1 (5 high development
findings). These are not substituted for the final corrected-source gate.
The first repository-wide format check exited 1 on 16 untracked .vercel CLI
artifacts. Git already excludes that directory locally, and no .vercel files are
tracked. The narrow .prettierignore addition preserves these private/historical
records and keeps all previously checked source in scope; a fresh check passed.

### Dependency classification — P2 / TOOLCHAIN MAINTENANCE

Fresh audit results: full npm audit exits 1 with five high dependency findings;
npm audit --omit=dev exits 0 with zero vulnerabilities. They propagate from one
braces stack-exhaustion advisory, not five independently exposed application flaws.

Exact root-to-leaf dependency chain:
eslint-config-next@16.3.8 → @next/eslint-plugin-next@16.3.8 →
fast-glob@3.3.1 → micromatch@4.0.8 → braces@3.0.3.

| Affected package         | Installed version | Lockfile classification | Production runtime evidence      |
| ------------------------ | ----------------- | ----------------------- | -------------------------------- |
| eslint-config-next       | 16.3.8            | dev=true                | Absent from local runtime traces |
| @next/eslint-plugin-next | 16.3.8            | dev=true                | Absent from local runtime traces |
| fast-glob                | 3.3.1             | dev=true                | Absent from local runtime traces |
| micromatch               | 4.0.8             | dev=true                | Absent from local runtime traces |
| braces                   | 3.0.3             | dev=true                | Absent from local runtime traces |

npm explain confirms every dependency in this chain is dev-only. Graph search
finds no application-source imports. The existing local production build's 11
.nft.json runtime trace manifests contain 2,096 entries and zero references to
these five package paths; Next's vendored braces/micromatch/fast-glob trace paths
also have zero hits. Built client/server JavaScript has zero affected package-path
references. None of the affected packages is included in this local traced
application runtime bundle. This is local build evidence, not a separately
retrieved inventory of the protected Vercel deployment.

The reported issue concerns toolchain/CI processing of adversarial glob patterns;
there is no evidenced deployed application request path to this dev-only chain.
Keep high-severity toolchain maintenance tracked, but it is not a P0/P1 launch
blocker and does not require forced remediation to approve this patch.
npm's forced fix proposes a breaking eslint-config-next downgrade to 14.2.35;
it was not applied. No Next.js/ESLint package, lockfile or override changed.
The complete npm audit is still nonzero; its classification, not its output,
has changed.

NO_COLOR/FORCE_COLOR messages are harness warnings, not app-console clearance.

## 13. Hosted audit status and exact plan

Not executed. Required owner access: an already authorized authenticated browser
session that opens the exact Preview, with explicit permission for local audit
tools to use that session, or owner-performed commands and sanitized evidence.
No access/bypass/share URL is created. If session transfer fails, stop and return
to that access decision. Keep Authentication enabled.

The existing performance-audit.mjs and Playwright configs start localhost servers;
they cannot prove a hosted audit. The standalone command below uses existing
Lighthouse 13.5.0 / Playwright 1.63.0 / Chromium 153.0.8010.12. It is syntax checked,
not execution-certified through protection. Owner must first verify hosted blank
IDs and exact deployment. If tools/pins/access are absent, stop rather than
installing/changing access during the audit.

Run timing measurements alone, without builds/E2E/heavy background work.
Deployment-origin cookies are copied through an in-memory array into temporary
Chromium profiles. Chromium may persist them on disk until launcher cleanup;
never archive these profiles and verify cleanup after the run. Lighthouse storage reset is disabled solely to retain protection cookies; each
profile begins with fresh app storage and first-visit consent. No raw authenticated
profile, HAR, trace, LHR, storageState or cookie/request-header export is written.
Sanitized scores/metrics, safe cache headers and screenshots go to a private temp
directory. Inspect screenshots for Vercel/account overlays before archiving.

The command requests 5 EN + 5 HE mobile samples at 390×844/DPR2 and 1 EN + 1 HE
desktop sample at 1440×900/DPR1, all four categories; calculates each metric's
independent median/min/max; probes HTML/chunk/font/mobile Hero twice; and captures
EN/HE viewport screenshots at 390/768/1440. Provider attempts are counted before
aborting cross-origin traffic. Blocked toolbar/other requests, routing overhead and disabled browser caching must
be recorded as measurement limitations; an additional ordinary authenticated manual journey
must verify the app without measurement interception.

```powershell
Set-Location -LiteralPath 'C:\Users\SGT\Documents\Codex\dragon-point-site'
git rev-parse HEAD
node --version
# Confirm baseline SHA and existing owner-authorized loopback CDP privately.
# This reads an existing endpoint; it does not start debugging or create access.
$env:DP_OWNER_CDP = Read-Host 'Existing authorized loopback CDP endpoint'
$env:DP_AUDIT_OUT = Join-Path $env:TEMP ('dp-hosted-3812ae1-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
@'
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = 'https://dragon-point-site-9l6f12y5r-shako-s-projects2.vercel.app';
const out = process.env.DP_AUDIT_OUT;
const endpoint = new URL(process.env.DP_OWNER_CDP ?? '');
if (!out || endpoint.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname) ||
    endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
  throw Error('Existing owner-authorized loopback CDP and private output required');
const deps = createRequire(resolve('.superpowers/phase-7/tools/package.json'));
const local = createRequire(resolve('package.json'));
if (deps('lighthouse/package.json').version !== '13.5.0' ||
    local('@playwright/test/package.json').version !== '1.63.0')
  throw Error('Pinned audit dependencies unavailable');
const { default: lighthouse } = await import(pathToFileURL(deps.resolve('lighthouse')).href);
const { launch } = await import(pathToFileURL(deps.resolve('chrome-launcher')).href);
const { default: desktop } = await import(pathToFileURL(
  resolve('.superpowers/phase-7/tools/node_modules/lighthouse/core/config/desktop-config.js')
).href);
await mkdir(out, { recursive: true });
const owner = await chromium.connectOverCDP(endpoint.href);
let cookies;
try {
  const context = owner.contexts().find(c =>
    c.pages().some(p => p.url().startsWith(origin + '/')));
  if (!context) throw Error('Owner must already have this exact Preview open');
  cookies = await context.cookies(origin);
  if (!cookies.length) throw Error('Authentication cannot transfer; owner access decision required');
} finally { await owner.close(); } // Disconnect CDP; do not close owner's Chrome.
async function protect(context, attempts) {
  await context.addCookies(cookies);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    attempts.other++;
    if (/googletagmanager|google-analytics|facebook/.test(url.hostname))
      attempts.provider++;
    return route.abort();
  });
}
async function app(page, locale) {
  const response = await page.goto(origin + '/' + locale, { waitUntil: 'networkidle' });
  if (response?.status() !== 200 || new URL(page.url()).origin !== origin ||
      await page.locator('html').getAttribute('lang') !== locale)
    throw Error('Preview authentication failed; stop, do not bypass');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.dp-architecture-image').evaluate(image => image.decode());
}
const browser = await chromium.launch();
const cache = [];
const stageAttempts = [];
async function recordStage(stage, locale, attempts, width = null) {
  stageAttempts.push({ stage, locale, width, ...attempts });
  await writeFile(resolve(out, 'network-attempts.json'), JSON.stringify(stageAttempts, null, 2));
  if (attempts.provider) throw Error('Unexpected provider attempt; sanitized stage counts saved');
}
try {
  if (browser.version() !== '153.0.8010.12') throw Error('Chromium pin mismatch');
  for (const locale of ['en', 'he']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true
    });
    const attempts = { provider: 0, other: 0 };
    await protect(context, attempts);
    const page = await context.newPage();
    await app(page, locale);
    const urls = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource').map(e => e.name);
      return [location.origin + location.pathname,
        resources.find(u => /\/_next\/static\/.*\.js(?:\?|$)/.test(u)),
        resources.find(u => /\.woff2?(?:\?|$)/.test(u)),
        document.querySelector('.dp-architecture-image').currentSrc];
    });
    if (urls.some(u => !u || new URL(u).origin !== origin))
      throw Error('Warm asset discovery incomplete');
    for (const url of urls) for (let repetition = 1; repetition <= 2; repetition++) {
      const response = await context.request.get(url, { maxRedirects: 0 });
      if (response.status() !== 200) throw Error('Warm request failed');
      const headers = response.headers();
      cache.push({ locale, repetition, path: new URL(url).pathname,
        status: response.status(), headers: Object.fromEntries([
          'cache-control', 'age', 'server', 'x-vercel-cache', 'x-nextjs-cache'
        ].map(k => [k, headers[k] ?? null])) });
    }
    await context.close();
    await recordStage('warm-probe', locale, attempts);
  }
  const images = resolve(out, 'screenshots');
  await mkdir(images, { recursive: true });
  for (const locale of ['en', 'he']) for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : width === 768 ? 1024 : 900 },
      deviceScaleFactor: width === 390 ? 2 : 1, isMobile: width === 390
    });
    const attempts = { provider: 0, other: 0 };
    await protect(context, attempts);
    const page = await context.newPage();
    await app(page, locale);
    await page.locator('[data-consent-action="necessary"]').click();
    await page.screenshot({ path: resolve(images, locale + '-' + width + '.png') });
    await context.close();
    await recordStage('screenshot', locale, attempts, width);
  }
} finally { await browser.close(); }
await writeFile(resolve(out, 'cache-probes.json'), JSON.stringify(cache, null, 2));
const cases = [
  { locale: 'en', device: 'mobile', width: 390, height: 844, dpr: 2, n: 5 },
  { locale: 'he', device: 'mobile', width: 390, height: 844, dpr: 2, n: 5 },
  { locale: 'en', device: 'desktop', width: 1440, height: 900, dpr: 1, n: 1 },
  { locale: 'he', device: 'desktop', width: 1440, height: 900, dpr: 1, n: 1 }
];
const ids = ['largest-contentful-paint', 'first-contentful-paint',
  'total-blocking-time', 'cumulative-layout-shift', 'speed-index',
  'server-response-time', 'total-byte-weight'];
const runs = [];
for (const c of cases) for (let sample = 1; sample <= c.n; sample++) {
  const chrome = await launch({ chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--disable-background-networking'] });
  let sampleBrowser;
  try {
    sampleBrowser = await chromium.connectOverCDP('http://127.0.0.1:' + chrome.port);
    if (sampleBrowser.version() !== '153.0.8010.12') throw Error('Chromium pin mismatch');
    const context = sampleBrowser.contexts()[0];
    const attempts = { provider: 0, other: 0 };
    await protect(context, attempts);
    const config = c.device === 'desktop' ? structuredClone(desktop)
      : { extends: 'lighthouse:default', settings: {} };
    Object.assign(config.settings, {
      screenEmulation: { width: c.width, height: c.height,
        deviceScaleFactor: c.dpr, mobile: c.device === 'mobile', disabled: false },
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      disableStorageReset: true
    });
    const { lhr, artifacts } = await lighthouse(origin + '/' + c.locale,
      { port: chrome.port, logLevel: 'error', output: 'json' }, config);
    await recordStage('lighthouse', c.locale, attempts, c.width);
    const expected = origin + '/' + c.locale;
    const html = artifacts.MainDocumentContent ?? '';
    const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
    const documents = lhr.audits['network-requests']?.details?.items ?? [];
    const mainDocument = documents.find(item =>
      item.resourceType === 'Document' && item.url === expected);
    const appIdentityVerified =
      lhr.finalDisplayedUrl === expected &&
      mainDocument?.statusCode === 200 &&
      new RegExp(`\\blang=["']${c.locale}["']`, 'i').test(htmlTag) &&
      new RegExp(`\\bdir=["']${c.locale === 'he' ? 'rtl' : 'ltr'}["']`, 'i').test(htmlTag) &&
      /id=["']hero["']/.test(html) &&
      /dp-architecture-image/.test(html) &&
      /id=["']lead-name["']/.test(html) &&
      (html.match(/<h1(?:\s|>)/gi) ?? []).length === 1;
    if (lhr.runtimeError || !appIdentityVerified)
      throw Error('Lighthouse application identity/authentication failed');
    const scores = Object.fromEntries(Object.entries(lhr.categories)
      .map(([key, value]) => [key, typeof value.score === 'number' ? value.score * 100 : NaN]));
    const metrics = Object.fromEntries(ids.map(key => [key, lhr.audits[key]?.numericValue]));
    if (![...Object.values(scores), ...Object.values(metrics)].every(Number.isFinite))
      throw Error('Missing metric; do not substitute zero');
    if (attempts.provider) throw Error('Unexpected provider attempt in blank-ID Preview');
    const run = { locale: c.locale, device: c.device, sample, appIdentityVerified, scores, metrics, attempts,
      indexabilityFailure: lhr.audits['is-crawlable']?.score === 0,
      warningCount: lhr.runWarnings.length };
    runs.push(run);
    await writeFile(resolve(out, c.locale + '-' + c.device + '-' + sample + '.json'),
      JSON.stringify(run, null, 2));
  } finally {
    try { await sampleBrowser?.close(); }
    finally { await chrome.kill(); } // Attempt profile cleanup even if CDP disconnect fails.
  }
}
const stats = values => {
  const a = [...values].sort((x, y) => x - y);
  return { median: a[Math.floor(a.length / 2)], min: a[0], max: a.at(-1) };
};
const summary = cases.map(c => {
  const set = runs.filter(r => r.locale === c.locale && r.device === c.device);
  return { ...c, samples: set.length,
    scores: Object.fromEntries(Object.keys(set[0].scores)
      .map(k => [k, stats(set.map(r => r.scores[k]))])),
    metrics: Object.fromEntries(ids.map(k => [k, stats(set.map(r => r.metrics[k]))])) };
});
await writeFile(resolve(out, 'summary.json'), JSON.stringify({
  deployment: 'dpl_6cpq1pzq1n1UBr4SNQDvHjBFrL8S',
  commit: '3812ae1b89a8615005b76706b9bb82084745c620', origin,
  method: 'Warm origin; fresh profiles/app storage; protection cookies retained; first-visit consent; default simulated throttling; cross-origin traffic denied/counts recorded; interception overhead and browser cache disabled',
  lighthouse: '13.5.0', chromium: '153.0.8010.12', summary
}, null, 2));
cookies = undefined;
'@ | node --input-type=module -
```

Do not call an initial request a CDN cold miss without headers establishing it;
do not purge shared caches. Save independent counts/metrics/ranges and compare
with Phase 7B final-summary.json (historical EN mobile 72 / HE 80, desktop 99/99).
Preview noindex may intentionally lower Lighthouse SEO; retain the guard.
Lab results do not establish field CWV/RUM/CrUX or physical-device performance.
Raw authenticated evidence stays private; only reviewed sanitized evidence may
be copied into a new audit directory, never overwrite Phase 7/8 history.

The inline command covers the six required EN/HE screenshots and aggregate
transfer metrics. Additional KA/RU/state screenshots, encoded JS/font/Hero weights,
long-task inspection, cache request timing and the browser journey below require
separate manual evidence. Exported cache paths omit arbitrary asset query strings.
Authentication success must be checked against actual application markup, not only
a Lighthouse URL; the planned command is not a hosted pass certificate.

Hosted browser checklist, recording exact device/browser and pass/fail evidence:

- Console and pageerror/hydration failures on direct navigation, refresh and locale
  switches; complete assets, no mixed content, one H1 and broken-link checks.
- EN/HE 390/768/1440 screenshots; required RTL widths
  360/390/430/768/1024/1280/1440/1920 and short mobile heights.
- Mobile menu/language controls, anchors, Tab/Shift+Tab/Escape, skip link, visible
  focus, source order, focus restore/trap and directional process/CTA arrows.
- Sticky CTA after Hero; suppression for form, keyboard, menu and consent UI.
- Consent Necessary only / Analytics only / Marketing only / Accept all,
  reopening, revocation, cross-tab synchronization, persistence and blocked storage.
- Campaign entries /en?utm_source=google&utm_medium=cpc&utm_campaign=staging-test
  and /he?utm_source=meta&fbclid=staging-test: original first touch captured before
  all seven campaign keys disappear, even with blank IDs/denied consent;
  unrelated foo=bar/hash preserved; no reload/history-state loss.
- Original session attribution through locale changes, later campaigns, corrupt/
  blocked storage and actual synthetic lead payload; no form PII stored there.
  Never archive raw customer attribution or form data.
- Lead intent/focus, validation, busy state, safe unconfigured 503/retry and retained
  values. Mocked 2xx proves UI only; real delivery needs an isolated durable receiver.
- Zero attempted provider requests with blank IDs, before/after consent/revocation;
  counting delivered requests alone is insufficient. Events carry enums only.
  Synthetic GA/Meta/GTM fixture builds remain local and fully intercepted,
  separately rebuilt with blank IDs; never deploy them or use real accounts.
- Actual noindex header/metadata, robots Disallow, empty sitemap, locale SEO,
  immutable asset vs dynamic/API cache policy, HTTPS HSTS and security headers.
- Malformed paths/body/MIME/origin/honeypot, unsupported methods/Allow, error cache
  policy and bounded limiter behavior using clearly synthetic inputs.
- Physical iPhone Safari and Android Chrome: real keyboard, safe areas, consent,
  menu, lead/RTL behavior. Emulation is not physical-device evidence.

Actual live provider payload/account/container settings require separate approved
activation work. No synthetic submission to an unknown real recipient is allowed;
initial hosted lead check assumes verified unconfigured receiver.

## 14. Production inputs

| Input              | Exact evidence/status                                                                     | Required action                                                         |
| ------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| SITE_URL / domain  | Template blank, no local app key; production origin unconfirmed; hosted scope uninspected | Owner confirms final HTTPS origin; configure production only after GO   |
| Lead receiver      | Locally unconfigured; no durable hosted delivery evidence                                 | Isolated staging receiver then confirmed production persistence/auth    |
| Phone              | Not supplied; contact placeholder                                                         | Verified public value or approved contact model                         |
| WhatsApp           | Not supplied/published                                                                    | Supply verified destination if used                                     |
| Email              | Not supplied; no production contact invented                                              | Reviewed public contact/alternative                                     |
| Address            | Unknown/omitted                                                                           | Verified address if required/published, or approved omission            |
| Privacy/legal      | Inline review-pending disclosure; route conflict                                          | Decision C and real legal content                                       |
| Consent approval   | Four-locale UI present; legal signoff not evidenced                                       | Approve actual storage/purposes/receiver/vendors                        |
| Logo               | Replaceable typographic wordmark; final master absent                                     | Supply master or approve current composition                            |
| Hero visual        | Supplied illustrative Architecture image integrated, provenance retained                  | Confirm continued approved use; no replacement needed for normalization |
| OG image           | Framework present; approved 1200×630 asset/URL absent locally                             | Supply, configure, verify availability/dimensions                       |
| KA signoff         | Not evidenced                                                                             | Native full visible/SEO/legal/consent review                            |
| HE signoff         | Not evidenced                                                                             | Native full visible/SEO/legal/consent review                            |
| GA4                | Template blank; no local app key; hosted configuration unverified                         | Optional off, or approved ID/settings/decision A                        |
| GTM                | Template blank; no local app key; hosted configuration unverified                         | Optional off, or approved container/consent/manual tags                 |
| Meta               | Template blank; no local app key; hosted configuration unverified                         | Optional off, or approved pixel/settings/decision A                     |
| Search Console     | No ownership/setup evidence                                                               | Verify final origin after approved launch; submit production sitemap    |
| Physical mobile QA | Not performed/evidenced                                                                   | Real devices or explicit owner QA decision                              |

Local .env.local contains a nonempty OIDC authentication entry only; value was not
printed/copied. No authentication secret is a public application input.
No scoped hosted environment values were retrieved, and no missing input is
inferred from the Preview hostname.

## 15. Exact recommended next commits

No commits are made now. Proposed reviewed series based on the final local patch:

1. `docs: normalize Dragon Point current state and launch gates` — exact files:
   README.md, src/lib/analytics/README.md, docs/CURRENT_STATE.md,
   docs/LAUNCH_READINESS.md, docs/OWNER_DECISIONS.md,
   docs/staging/preview-runbook.md. Preserve every historical report/asset.
2. `fix: complete lead method headers and handle pending favicon requests` —
   next.config.ts, src/app/favicon.ico/route.ts, tests/e2e/staging.spec.ts.
   Preserve observed RED/GREEN evidence; favicon 204 remains temporary mitigation.
3. `chore: exclude private Vercel CLI artifacts from source formatting` —
   .prettierignore only; retain the initial exit-1 evidence and fresh exit-0 check.
4. After owner A/B/C decisions, prepare separate focused commits for the approved
   decision, real input configuration/content and any confirmed hosted findings.
   Names/files are specified only once decisions become concrete; do not prebuild
   disputed vendor/privacy behavior or commit credentials.

Every file has exactly one commit assignment. Documentation cross-references the
HTTP and formatting changes without requiring overlapping file membership.
Final owner reviews should use the exact commit series and hosted tested SHA.
P0/P1 closure cannot be inferred from these three normalization commits.

## 16. Final launch sequence

Local fixes → complete local gate → one reviewed commit series →
push staging first → verify Git-generated Preview/READY at exact new SHA →
protected hosted browser/performance/device audit → resolve inputs/findings →
owner GO for exact release → fast-forward/update integration branch →
PR to main → final checks → separately authorized controlled production launch.

Recheck branch SHAs, fast-forward ancestry and Vercel production-branch/automatic
deployment policy before each update so integration updates cannot skip the owner
GO and PR gate. No force push,
published-history rebase, remote reset, direct production deploy command,
Authentication change or unapproved domain/DNS action. Preview retains noindex;
production indexing requires confirmed origin and controlled production settings.
PR review/final checks are mandatory before production. Search Console and
approved field measurement follow launch.

Completed: truth audit, requirement reconciliation, owner decision records,
documentation normalization, narrow local HTTP patch and hosted audit plan.
Changed files: section 6. Tests/results: section 12.
Known issues/pending inputs: sections 8–11 and 14.
Next step: review the local patch, obtain owner access/inputs, and follow the staged
release sequence. Track compatible dev-tool maintenance separately as P2; it is
not a launch prerequisite.

CURRENT STATUS: **NOT READY**.
Exact reason: protected hosted verification, durable receiver, confirmed production
origin and privacy/consent decisions are unresolved, with P1 performance/editorial/
asset/device inputs still open. No commit, push or deployment performed.
