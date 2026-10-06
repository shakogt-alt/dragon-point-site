# AGENTS.md — Dragon Point Site

## Purpose
This repository contains the Dragon Point website.

The current approved product is a **single-page, multilingual, SEO-ready conversion landing** for a technology-driven real estate advisory in Georgia.

Primary implementation brief:
- Read and follow `CODEX_TASK.md` before making changes.
- Treat `CODEX_TASK.md` as the source of truth for scope, brand, UX, SEO, performance, accessibility, testing, and delivery order.

## Brand constraints
Do not change the approved brand system without explicit approval.

Approved colors:
- #0B0D10
- #242830
- #B9C0C8
- #F5F6F7
- #6847F5

Use FiraGO where practical.

Visual direction:
- Architecture + Data
- Analytical minimalism
- Approx. 60% light / 40% dark
- Violet as accent, not dominant fill

Do not introduce:
- generic luxury-real-estate clichés
- fake testimonials or ratings
- invented market statistics
- unsupported KleekTo claims
- fantasy dragon imagery

## Product constraints
Current MVP is a landing page, not a listing portal.

Do not add:
- full property catalog
- property map
- AI chatbot
- CMS
- account system
- investment calculator
- public KleekTo integration

unless explicitly approved.

## Engineering rules
- Use small, reviewable commits.
- EN / KA / RU / HE must share one component tree; Hebrew must use document-level RTL (`lang="he"`, `dir="rtl"`) and direction-aware CSS/UI rather than a separate implementation.
- Prefer simple implementations over unnecessary abstractions.
- Keep brand tokens centralized.
- Keep locale content outside presentation components.
- Keep lead integration behind a service abstraction.
- Do not hardcode analytics IDs or production credentials.
- Do not expose secrets.
- Do not invent production contact information.

## SEO rules
SEO must be implemented as part of the core app:
- /en /ka /ru /he
- self-canonical
- hreflang including `he`, with x-default → /en
- sitemap including all four locale URLs
- robots
- localized metadata
- JSON-LD
- Open Graph, with `he_IL` for Hebrew
- Hebrew localized title/description and natural search semantics
- staging/preview noindex
- exactly one H1 per locale page

## Quality gates
Before marking work complete:
- run lint
- run typecheck
- run unit tests
- run E2E tests where available
- verify mobile layout
- verify Hebrew RTL at all required breakpoints
- verify accessibility basics
- verify no console errors
- verify no broken links
- verify no fake production data

## Change control
If an approved requirement must be changed, document:

ISSUE
REASON
PROPOSED CHANGE
IMPACT

Do not silently redesign approved scope.

## Reporting
After each phase report:
- Completed
- Changed files
- Tests run
- Tests result
- Known issues
- Pending inputs
- Next step
