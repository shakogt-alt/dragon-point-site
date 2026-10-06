# DRAGON POINT — Codex Implementation Plan

## Mission

Build the first production-ready MVP of the Dragon Point website as a **simple, high-conversion, mobile-first landing page with SEO built in from the first commit**.

Dragon Point is **not** a conventional property listing portal. It is positioned as a technology-driven real estate advisory for Georgia.

## Brand foundation

- Master brand: **DRAGON POINT**
- Descriptor: **REAL ESTATE INTELLIGENCE**
- Primary slogan: **SEE THE DEAL CLEARLY.**
- Communication formula: **PROPERTY · DATA · DECISION**
- Brand essence: **CLARITY + CONTROL**
- Lead idea: **NOT MORE LISTINGS. BETTER DECISIONS.**
- Primary geography: **Tbilisi · Batumi · Georgia**
- Languages: **EN / KA / RU / HE**
- Analytical framework: **MARKET → PRICE → PROPERTY → RISK → RETURN → DEAL**

## Non-negotiable visual system

Approved colors only:

- Obsidian: `#0B0D10`
- Graphite: `#242830`
- Titanium: `#B9C0C8`
- Off White: `#F5F6F7`
- Dragon Violet: `#6847F5`

Use Dragon Violet sparingly, mostly for CTAs, highlights, data markers, and digital states. Target roughly 10–15% of visual emphasis.

Typography:
- **FiraGO** for Latin, Georgian, and Cyrillic.
- For Hebrew, use a high-quality Hebrew web font that is visually compatible with FiraGO; self-host if practical and licensing permits. Do not rely on unsupported glyph fallback.
- Prefer Regular / Medium / SemiBold / Bold.

Visual principle:
- **Architecture + Data**
- Approx. **60% light / 40% dark**
- Analytical minimalism + human advisory

Do NOT use:
- keys in hands
- handshakes
- smiling stock agents/families
- generic luxury clichés
- literal dragons / fire / wings / fantasy motifs
- fake testimonials / awards / ratings / client counts / deal counts
- unsupported claims about KleekTo

## MVP scope

Build ONLY the landing MVP.

Do not build yet:
- full property catalog
- property map
- personal account
- AI chat
- investment calculator
- CMS
- booking system
- deep/public KleekTo integration
- dynamic Market Intelligence
- empty SEO pages created only for keywords

Architecture must allow these later without a rewrite.

## Preferred stack

- Next.js latest stable
- TypeScript
- App Router
- React
- Tailwind CSS
- Vercel
- next/image
- self-hosted FiraGO if practical
- React Hook Form
- Zod
- Lucide or custom SVG icons
- Vitest or Jest
- Playwright
- ESLint
- Prettier

Avoid heavy dependencies unless justified.

## Locale architecture

Routes:
- `/en`
- `/ka`
- `/ru`
- `/he`

Root `/` should server-redirect to `/en` for MVP.

Use one component tree and locale dictionaries, e.g.:
- `messages/en.json`
- `messages/ka.json`
- `messages/ru.json`
- `messages/he.json`

Hebrew requirements:
- `/he` must render with `lang="he"` and `dir="rtl"` at the document level.
- Use CSS logical properties and direction-aware UI so RTL works without a separate component tree.
- Navigation, section layouts, process arrows, icon placement, form alignment, and mobile menu behavior must be reviewed in RTL.
- Do not machine-translate Hebrew at runtime; use reviewed locale copy.

No runtime machine translation.

## Approved landing structure

### 1. Header

Desktop:
- Logo
- Buy
- Invest
- Sell
- How We Work
- EN / KA / RU / HE
- Talk to an Advisor

Use anchor navigation for MVP.

Mobile:
- Logo
- Language
- Menu

Sticky / compact header after scroll.

### 2. Hero

Dark hero.

Copy:

```
DRAGON POINT
REAL ESTATE INTELLIGENCE

SEE THE DEAL CLEARLY.
```

Supporting copy:

```
Buy, sell and invest in Georgian real estate with market analysis,
property verification and end-to-end deal support.
```

Primary CTA:
**FIND A PROPERTY**

Secondary CTA:
**TALK TO AN ADVISOR**

Geo line:
**TBILISI · BATUMI · GEORGIA**

A subtle data overlay is allowed, but any sample number must be clearly marked as SAMPLE / DEMO DATA and must not look like live market data.

### 3. Start With Your Goal

Headline:
**START WITH YOUR GOAL.**

Three cards:

**BUY**
Find the right property for living or relocation.
CTA: **I WANT TO BUY**

**INVEST**
Evaluate return, risk, liquidity and exit before you buy.
CTA: **I WANT TO INVEST**

**SELL**
Understand your real market price and sell with a clear strategy.
CTA: **I WANT TO SELL**

Clicking a card/CTA should preselect intent in the lead form.

### 4. Differentiation

Headline:

**NOT MORE LISTINGS.**
**BETTER DECISIONS.**

Show a visual comparison:
- Typical Listing
- Dragon Point View

Demo fields:
- Listing Price
- Market Range
- Negotiation Target
- Liquidity

All sample numbers must be clearly labeled as mock/demo.

CTA:
**SEE HOW WE ANALYZE**

### 5. Dragon Point Standard

Desktop:
**MARKET → PRICE → PROPERTY → RISK → RETURN → DEAL**

Mobile:
stack or controlled horizontal scroll.

Descriptions:
- Market — Location · Infrastructure · Demand
- Price — Listing · Market · Transaction
- Property — Building · Layout · Condition
- Risk — Legal · Technical · Market
- Return — Yield · Vacancy · Liquidity
- Deal — Offer · Negotiation · Due Diligence · Closing

### 6. Services

Keep concise, four areas only:

**Residential**
- Buy
- Sell
- Rent

**Investments**
- Income
- Capital Growth
- Resale

**New Developments**
- Projects
- Developers
- Payment Plans

**Commercial & Land**
- Retail
- Office
- Income Property
- Development

### 7. Technology / Trust

Dark section.

Headline:
**INTELLIGENCE BEHIND THE DEAL.**

Points:
- Market analysis
- Verified information
- Property matching
- Price history
- Deal workflow

Signature:
**POWERED BY KLEEKTO**

Dragon Point remains the primary client-facing brand. KleekTo is secondary.

Do not claim:
- AI-powered everything
- real-time all-market coverage
- automatic market monitoring
- any unverified KleekTo production capability

### 8. Lead Form

Headline:
**WHAT ARE YOU LOOKING FOR?**

Intent:
- Buy
- Invest
- Sell

Fields:
- Name
- Phone / WhatsApp
- Email (optional)
- Budget
- Message
- Preferred language

CTA:
**TALK TO AN ADVISOR**

Success copy:
`Thank you. A Dragon Point advisor will contact you shortly.`

Mobile:
add sticky bottom CTA after the hero:
**Talk to an Advisor**

Do not block content, safe-area, or cookie UI.

## Lead architecture

Create a clean service abstraction so KleekTo can be connected later without rewriting the UI.

Suggested payload:

```ts
type LeadPayload = {
  intent: 'buy' | 'invest' | 'sell'
  name: string
  phone: string
  email?: string
  budget?: string
  message?: string
  locale: 'en' | 'ka' | 'ru' | 'he'
  source: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  gclid?: string
  fbclid?: string
  referrer?: string
}
```

Create a service layer under something like:
`src/lib/leads/`

For MVP, the endpoint may be a safe placeholder / webhook abstraction. Do not invent CRM credentials.

## SEO requirements

SEO is part of the implementation, not a later phase.

### URL / locale SEO

Indexable:
- `/en`
- `/ka`
- `/ru`
- `/he`

Each locale page uses a self-canonical.

hreflang:
- en
- ka
- ru
- he
- x-default → /en

Do not use aggressive geo redirects.

### Titles

EN:
`Real Estate in Georgia | Buy, Invest & Sell | Dragon Point`

RU:
`Недвижимость в Грузии — покупка, инвестиции и продажа | Dragon Point`

KA:
Create a natural professional Georgian equivalent, not keyword-stuffed literal translation.

HE:
`נדל״ן בגאורגיה | קנייה, השקעה ומכירה | Dragon Point`

Use natural professional Hebrew aimed at Hebrew-speaking buyers and investors interested in Georgia; do not use literal or keyword-stuffed translations.

### Meta descriptions

Create a unique, natural description for each locale.

EN baseline:
`Buy, sell and invest in real estate in Georgia with market analysis, property verification and professional deal support. Dragon Point — Real Estate Intelligence.`

HE baseline:
`קנו, מכרו והשקיעו בנדל״ן בגאורגיה עם ניתוח שוק, בדיקת נכסים וליווי מקצועי לאורך העסקה. Dragon Point — Real Estate Intelligence.`

### Primary keyword themes

EN:
- real estate Georgia
- property Georgia
- buy property Georgia
- real estate Tbilisi
- property Tbilisi
- real estate Batumi
- invest in Georgia real estate
- Georgia property investment
- sell property Georgia

RU:
- недвижимость в Грузии
- купить квартиру в Тбилиси
- купить недвижимость в Грузии
- недвижимость Тбилиси
- инвестиции в недвижимость Грузии
- недвижимость Батуми
- агентство недвижимости Тбилиси

KA:
Use natural Georgian semantic wording; do not just translate Russian keywords word-for-word.

HE:
Use natural Hebrew search language for Georgia real estate, including themes such as:
- נדל״ן בגאורגיה
- קניית נכס בגאורגיה
- דירות למכירה בטביליסי
- נדל״ן בטביליסי
- נדל״ן בבטומי
- השקעות נדל״ן בגאורגיה
- השקעה בנדל״ן בטביליסי

Do not stuff keywords or translate English/Russian phrases mechanically.

### Heading structure

Exactly one H1 per locale page.

Recommended H1:
`Real Estate Intelligence for Georgia`

For Hebrew, use a natural semantic equivalent rather than displaying the English H1 as the only heading.

Suggested hierarchy:
- H2 Start with your goal
- H3 Buy / Invest / Sell
- H2 Not more listings. Better decisions.
- H2 The Dragon Point Standard
- H2 Real Estate Services in Georgia
- H2 Intelligence Behind the Deal
- H2 Talk to a Dragon Point Advisor

Visual size and semantic heading level must be separate.

### Structured data

Add JSON-LD framework for:
- Organization
- RealEstateAgent
- WebSite

`WebSite.inLanguage` must include `en`, `ka`, `ru`, and `he`.

Only populate known data.

Do not invent:
- office address
- phone
- email
- reviews
- aggregate rating
- awards
- deal counts
- client counts

### Open Graph

Per locale:
- og:title
- og:description
- og:image
- og:locale
- og:locale:alternate
- og:url

Use `he_IL` for the Hebrew Open Graph locale while keeping the URL locale and hreflang as `he`.
- twitter:card = summary_large_image

Prepare support for a branded 1200×630 OG image.

### Sitemap / robots

Implement:
- `/sitemap.xml`
- `/robots.txt`

Production:
- indexing allowed

Preview/staging:
- must be `noindex` using X-Robots-Tag or equivalent

### Future SEO architecture

Prepare the codebase so these can be added later, but do not publish empty pages now:

- `/[locale]/tbilisi`
- `/[locale]/batumi`
- `/[locale]/buy`
- `/[locale]/invest`
- `/[locale]/sell`
- `/[locale]/properties`
- `/[locale]/developments`
- `/[locale]/market-intelligence`
- `/[locale]/developers/[slug]`
- `/[locale]/properties/[slug]`

## Performance

Target Lighthouse mobile:
- Performance >= 90
- SEO >= 95
- Accessibility >= 95
- Best Practices >= 95

Guidelines:
- hero image under ~300 KB where practical
- AVIF/WebP
- next/image
- lazy-load non-hero images
- no autoplay 4K video
- prevent CLS with dimensions/aspect ratio
- minimize client components and JS
- self-host/preload only required font assets

## Accessibility

WCAG AA baseline:
- contrast
- keyboard navigation
- visible focus
- semantic HTML
- alt text
- form errors
- aria labels
- skip link
- prefers-reduced-motion

## Analytics readiness

Prepare env-based hooks for:
- Google Analytics 4
- Google Tag Manager
- Meta Pixel

Suggested env names:
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`

Do not hardcode IDs.

Events:
- hero_find_property_click
- hero_advisor_click
- goal_buy_click
- goal_invest_click
- goal_sell_click
- lead_form_open
- lead_form_start
- lead_form_submit
- lead_form_success
- lead_form_error
- language_switch
- phone_click
- whatsapp_click
- email_click

## Attribution

Capture and pass:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- gclid
- fbclid
- locale
- referrer
- landing URL

## Consent / privacy

Prepare consent architecture:
- Necessary
- Analytics
- Marketing

Do not activate non-essential analytics/marketing before consent where applicable.

Create a placeholder Privacy Policy route clearly marked for legal review before production.

## Security

Lead endpoint:
- server-side validation
- Zod
- sanitization
- honeypot
- basic rate limiting if practical
- never trust client validation
- do not log full production lead payloads
- international phone numbers supported

## Suggested component structure

```
src/
  app/
    [locale]/
      layout.tsx
      page.tsx
    api/
      leads/
        route.ts
    sitemap.ts
    robots.ts
  components/
    layout/
      Header.tsx
      Footer.tsx
    sections/
      Hero.tsx
      GoalSelector.tsx
      BetterDecisions.tsx
      DragonPointStandard.tsx
      Services.tsx
      Technology.tsx
      LeadSection.tsx
    ui/
      Button.tsx
      Container.tsx
      Section.tsx
      Card.tsx
      Input.tsx
      Select.tsx
      LanguageSwitcher.tsx
  lib/
    analytics/
    seo/
    leads/
    validation/
  messages/
    en.json
    ka.json
    ru.json
    he.json
  styles/
```

Adapt if current Next.js conventions suggest something cleaner, but preserve separation of concerns.

## Design tokens

Centralize all brand values. Do not hardcode brand colors repeatedly.

Example:

```css
:root {
  --dp-obsidian: #0B0D10;
  --dp-graphite: #242830;
  --dp-titanium: #B9C0C8;
  --dp-off-white: #F5F6F7;
  --dp-violet: #6847F5;
}
```

Also centralize:
- spacing
- radii
- containers
- shadows
- transitions

## Responsive QA

Test at least:
- 360
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920

For `/he`, run the same responsive matrix in RTL and verify no mirrored-layout regressions, clipped text, incorrect arrow direction, or LTR-only spacing assumptions.

## Motion

Keep restrained:
- fade
- translate 8–16px
- line reveal
- subtle hover lift
- 150–400ms

Do not use:
- scroll hijacking
- long intro animation
- cursor replacement
- heavy parallax
- unnecessary 3D
- mobile hero video

## Logo

Current logo is not yet a final locked master asset.

Build the logo component so assets can be swapped later without layout rewrite:
- dark background version
- light background version
- compact/mobile
- future symbol-only

Do not fabricate a final logo.

## Footer

Minimal:
- DRAGON POINT
- REAL ESTATE INTELLIGENCE
- Tbilisi · Batumi · Georgia
- contact placeholders
- social placeholders only if actual URLs exist
- Privacy
- EN / KA / RU / HE
- Powered by KleekTo

Do not add dead social links.

## Tests

Unit:
- form validation
- locale routing helpers
- UTM parsing
- lead payload

E2E:
- landing loads
- anchor navigation works
- locale switch works
- lead form validates
- lead submission state works
- mobile menu works

SEO checks:
- exactly one H1
- title exists
- description exists
- canonical exists
- hreflang exists
- robots correct
- sitemap correct
- JSON-LD valid
- noindex on previews
- indexable in production

## Definition of Done

MVP is complete when:
- EN / KA / RU / HE work
- Hebrew `/he` renders correctly in RTL with `lang="he"` and `dir="rtl"`
- all approved landing sections are implemented
- mobile-first layout is complete
- lead form works with safe placeholder integration
- UTM attribution works
- analytics event layer is ready
- localized metadata exists
- canonical + hreflang are correct
- sitemap + robots work
- JSON-LD works
- preview/staging is noindex
- production can be indexable
- Lighthouse targets are met or deviations documented
- accessibility audit completed
- no console errors
- no broken links
- no fake market data
- no unsupported KleekTo claims

## Delivery sequence

Work in small reviewable commits.

### Phase 1 — Foundation
- initialize Next.js / TypeScript / Tailwind
- lint / format
- project structure
- design tokens
- FiraGO
- locale architecture

### Phase 2 — SEO Foundation
- metadata
- canonical
- hreflang
- robots
- sitemap
- JSON-LD framework
- OG framework

### Phase 2A — Hebrew Locale & SEO Amendment
- add `/he` locale and reviewed Hebrew dictionary
- add document-level RTL support without a separate component tree
- update locale routing and switcher
- add Hebrew metadata, canonical, hreflang, sitemap, JSON-LD language list and OG locale
- extend SEO/unit/E2E coverage to Hebrew and RTL
- keep x-default → /en

### Phase 3 — Core UI
- Header
- Hero
- Goal Selector
- Better Decisions
- Dragon Point Standard
- Services
- Technology
- Footer

### Phase 4 — Lead System
- form
- validation
- lead API/service
- UTM
- success/error states
- spam protection

### Phase 5 — Analytics Readiness
- analytics hooks
- event layer
- consent hooks

### Phase 6 — Responsive & Accessibility
- mobile QA
- keyboard
- contrast
- ARIA
- reduced motion

### Phase 7 — Performance
- optimize images
- optimize fonts
- inspect bundle
- Lighthouse

### Phase 8 — Tests & Deployment
- unit tests
- Playwright
- Vercel config
- preview noindex
- production QA

## Change-control rule

Do not independently change:
- brand positioning
- approved color system
- landing structure
- SEO architecture

If a deviation is necessary, document:

```
ISSUE
REASON
PROPOSED CHANGE
IMPACT
```

and pause that specific deviation for approval.

## Unknown production inputs

Do not invent these. Keep as TODO / env / config until provided:
- production domain
- public phone / WhatsApp
- public email
- office address
- final lead destination
- final logo assets
- final photography
- social URLs

## Reporting after each phase

Use:
- Completed
- Changed files
- Tests run
- Tests result
- Known issues
- Pending inputs
- Next step
