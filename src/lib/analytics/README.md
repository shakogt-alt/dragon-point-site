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

Vendor scripts may read URL/referrer independently of application events. The
adapter therefore refuses loading or manual dispatch on query-bearing pages,
unknown fragments, arbitrary paths or unsafe referrers. Allowed context consists
of the four locale paths, approved section anchors and an empty/root/same-origin
locale referrer. Consequently even ordinary UTM campaign pages do not load
vendors. First-touch lead attribution is preserved unchanged; the safe neutral
event bus can still operate after consent. This deliberate privacy limitation
must be considered before activation, without rewriting the landing URL.

Removing a downloaded script cannot undo its execution. Explicit GA disable,
Meta revoke and GTM consent updates complement the runtime gate; known vendor
cookies are expired at root/host domains. Actual third-party behavior and all
container tags require the activation audit above. The local implementation does
not claim to control arbitrary external container code.
