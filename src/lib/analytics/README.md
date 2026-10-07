# Analytics readiness

Phase 5 supplies a provider-neutral event contract and consent UI. No production
analytics IDs are configured. Lead delivery, first-touch attribution and SEO have
their own existing contracts and do not depend on analytics consent.

## Consent and event contract

- Necessary is always enabled. Analytics and Marketing default off.
- Choices are stored under `dragon-point:consent:v1` for 180 days. Invalid, expired,
  future-dated or unavailable storage fails closed. Blocked writes retain only the
  current visit's choice and show a localized explanation. Storage changes across
  tabs revoke/update consent without reloading or clearing the lead form.
- The first-visit banner offers necessary-only, accept-all and customization.
  Footer settings reopen the native modal. Escape restores the previous state and
  focus. The existing sticky CTA hides while consent UI is visible.
- `trackAnalytics(name, properties)` accepts only the events and enums in
  `events.ts`. The runtime dispatches the browser `dragon-point:analytics`
  CustomEvent after optional consent; subscribers must respect the current
  purpose. No events are queued or replayed from the period before consent.
- GA4 requires Analytics; Meta requires Marketing; GTM requires both. Revocation
  synchronously gates manual events. Provider loading and failures are isolated
  from the lead form. Events during provider loading are not buffered for vendors.

Events cover Hero and goal CTAs, form opening/start/valid submit/confirmed
success/error, language switching and future real phone/WhatsApp/email links.
Public parameters are locale, targetLocale, intent, surface and coarse errorKind.
There are no names, phone numbers, emails, budgets, messages, field values, raw
errors, URLs, referrers, UTM parameters or click identifiers in event payloads.

## Provider activation contract

Keep `.env.example` IDs empty until the owner supplies real IDs and approves the
account/container configuration. There is no active vendor tracking in this
delivery. Activating vendors requires the following checks:

1. **GA4:** set `NEXT_PUBLIC_GA_ID`. Disable account-level enhanced measurement
   that could observe form values, automatic page views or arbitrary URLs. This
   adapter uses manual events, `send_page_view: false`, disabled Google signals,
   disabled ad personalization and ignored referrer. Do not enable user IDs or
   customer data. Google's [page-view configuration](https://developers.google.com/analytics/devguides/collection/ga4/views)
   and [configuration reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
   explain the relevant options.
2. **GTM:** set `NEXT_PUBLIC_GTM_ID` only for an audited, manual-event container.
   GTM takes precedence over direct GA4. An audited consent template must consume
   the initial denied `dpConsent` during Consent Initialization and
   `dp_consent_update` through `setDefaultConsentState` / `updateConsentState`
   before any tag fires. Automatic page/form/DOM collection is outside this
   contract. The bootstrap queue remains denied during download; the granted
   update is emitted only after load and a live consent check. Google documents
   [container consent APIs and ordering](https://developers.google.com/tag-platform/security/guides/consent).
3. **Meta:** set `NEXT_PUBLIC_META_PIXEL_ID`. Disable automatic events and
   automatic advanced matching in account settings. The adapter queues revocation
   and `autoConfig: false` before load, initializes without customer data, and
   sends only allowlisted custom events. No PageView or advanced-matching payload
   is sent. See Meta's [official GTM template](https://github.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel/blob/main/template.tpl).
4. Verify consent denial, delayed loading, revocation, actual network payloads and
   vendor account settings in a separate activation review before deployment.
   Consent-copy/legal approval is an owner input, not established by these tests.

Vendor scripts may read URL/referrer independently of application events. Phase
5B therefore uses an explicit sequence, independent of React effect order:

1. `getFirstTouchAttribution()` captures the original document into the existing
   session-storage attribution system and a document-local memory cache.
2. After required consent, a configured adapter calls `prepareProviderContext()`
   before vendor commands or download. It captures first, removes every query
   parameter and any unapproved hash via `history.replaceState`, then validates
   the actual browser URL/referrer. Locale, approved anchors and history state
   are preserved. There is no reload or synthetic navigation event.
3. Only the validated context permits provider loading and manual events.

Normal UTM/gclid/fbclid campaign pages can now activate vendors after consent.
Raw campaign values stay exclusively in lead attribution; the event allowlist
does not expose them. LeadForm reads the same cached original record even if it
mounts after cleanup or session storage is blocked. Root `/` preserves the query
in its server redirect to `/en` so it can be captured there.

`safeTrackingContext()` remains strict about raw queries, unapproved fragments
and arbitrary routes. Failed capture/cleanup or unsafe immutable referrer stays
blocked. An empty referrer, an HTTP(S) origin-only external referrer, or a clean
same-origin locale referrer is allowed; arbitrary cross-origin paths/queries are
not rewritten or passed to vendors. With no valid provider IDs, there is no vendor
loading or URL cleanup. No changes to consent wording/categories or lead payload.

Mocked browser activation tests use separate synthetic-ID builds:

```powershell
$env:NEXT_PUBLIC_GA_ID='G-TESTONLY'
$env:NEXT_PUBLIC_GTM_ID=''
$env:NEXT_PUBLIC_META_PIXEL_ID='1234567890'
npm run build
$env:DP_TEST_PROVIDER='ga-meta'
npx playwright test --config tests/e2e/campaign.config.ts
# Repeat with GA/Meta empty, GTM='GTM-TESTONLY', DP_TEST_PROVIDER='gtm'.
# Then clear all three IDs, rebuild, and run the normal full E2E suite.
```

The dedicated fixture intercepts all cross-origin requests and fulfills vendor
scripts locally. Never run that test build as a deployment artifact; restore the
blank-ID production build. Actual accounts still require the activation review.

Removing a downloaded script cannot undo its execution. Explicit GA disable,
Meta revoke and GTM consent updates complement the runtime gate; known vendor
cookies are expired at root/host domains. Actual third-party behavior and all
container tags require the activation audit above. The local implementation does
not claim to control arbitrary external container code.
