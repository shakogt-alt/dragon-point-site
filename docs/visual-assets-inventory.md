# Visual source inventory

Inspected before application changes on 2026-10-07. Source: local
`dragon-point-visuals/`, six files, no nested folders. All five PNGs and all six
PDF pages were visually reviewed. Originals are read-only inputs; only derived
files belong in `public/images/`. File provenance hashes are recorded separately.

| Filename                           | Classification                         | Format / dimensions                                 | Approximate size | Transparency   | Likely use / readiness                                                                                                                                 |
| ---------------------------------- | -------------------------------------- | --------------------------------------------------- | ---------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture_Illustrative.png      | Architecture photography / hero visual | PNG, 1600 × 900                                     | 1.67 MiB         | None (RGB)     | Usable supplied illustrative architecture, not a verified listing. Hero with structural overlay and explicit illustrative caption.                     |
| Mockup_Exterior_Signage.png        | Brand reference                        | PNG, 1536 × 1024                                    | 1.93 MiB         | None (RGB)     | Signage concept; not evidence of a real office. Reference only. Embedded perspective logo is not a master asset.                                       |
| Mockup_Merch.png                   | Brand reference                        | PNG, 1536 × 1024                                    | 1.64 MiB         | None (RGB)     | Merchandise concept; reference only, unrelated to conversion or property analysis.                                                                     |
| Mockup_Office.png                  | Brand reference                        | PNG, 1122 × 1402                                    | 1.99 MiB         | None (RGB)     | Office concept; reference only. Do not imply a confirmed office or public address.                                                                     |
| Mockup_Stationery.png              | Brand reference                        | PNG, 1536 × 1024                                    | 1.62 MiB         | None (RGB)     | Print concept; reference only. Embedded logos lack clean production variants.                                                                          |
| Dragon_Point_Merch_and_Mockups.pdf | Brand reference                        | PDF, six pages; five 842 × 595 pt, one 595 × 842 pt | 2.60 MiB         | Not applicable | Page 1 merchandise artwork/layout; pages 2–5 the four mockups; page 6 labels architecture as illustrative photography. Reference, not browser content. |

## Selection before implementation

Use only `Architecture_Illustrative.png` in the Hero. Its architecture improves
the temporary wireframe while the existing analytical framework remains visible.
Keep the existing Technology diagram and restrained backgrounds: none of the
supplied files represents approved data graphics, icons, patterns or technology.
Keep the swappable typographic Logo and Footer branding. The PDF and mockups show
a consistent angular symbol, but contain no clearly designated final standalone
logo, transparent export or approved dark/light/compact master variants. Do not
extract, trace or redraw it.

No production-ready 1200 × 630 social/OG artwork exists. Leave `OG_IMAGE_URL`
support and all SEO behavior unchanged. Do not crop the hero into final OG art.
