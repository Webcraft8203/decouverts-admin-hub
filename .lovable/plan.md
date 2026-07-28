# Decouvertes — Premium Defence UI Redesign

Visual-only redesign across the public site. Zero changes to logic, routes, APIs, DB, forms, components' behavior, or admin. Everything remains fully dynamic and CMS-driven.

## Design System (foundation)

Update `src/index.css` + `tailwind.config.ts` + `index.html`:

- **Palette (HSL tokens)**
  - `--background` Soft White `210 20% 98%`
  - `--foreground` Graphite `220 25% 10%`
  - `--surface-dark` Matte Black `222 30% 6%`
  - `--surface-navy` Deep Navy `217 40% 10%`
  - `--surface-graphite` `220 15% 14%`
  - `--primary` Signal Orange `18 100% 50%` (#FF6B00)
  - `--muted-foreground` `220 10% 45%`
  - `--border` hairline `220 15% 88%` / dark `220 20% 18%`
- **Typography**: Space Grotesk (display 600/700), Inter (body 400/500). Load via `index.html`. Set in Tailwind `fontFamily.display` + `fontFamily.sans`. Enforce large H1 (clamp 3rem→5.5rem), H2 (clamp 2rem→3.5rem), body 16-18px, tight tracking on headings.
- **Utilities**
  - `.grid-engineering` — subtle 32px grid overlay (2% opacity)
  - `.hud-corner` — 12px L-brackets for cards
  - `.metallic-gradient` — very subtle linear (navy→graphite)
  - `.hairline` — 1px border tokenized
  - `.elevation-1/2/3` — soft layered shadows
  - `.reveal-up` — fade+translate 12px (already have CinematicSection)
- **Rhythm**: strict alternation Dark → Light → Dark → Light across homepage sections.

## Section-by-section (files touched)

Only markup, className, and imagery. No prop, hook, or handler changes.

1. **PublicNavbar** (`src/components/PublicNavbar.tsx`)
   - Transparent over hero, matte black + hairline border on scroll, backdrop-blur.
   - Space Grotesk for logo lockup, thin uppercase nav labels with orange underline animation.

2. **HeroSection / HeroSlider** — untouched per prior instruction, only ensure it sits under transparent navbar.

3. **StatsCounter** — floating dashboard cards, 4-col editorial, huge numerals (Space Grotesk 600), muted labels, elevation-2, orange 2px top-left accent bar.

4. **ProductCategories (Capabilities)** — bento: 1 large left tile (row-span-2) + 5 supporting. Each: bg image, navy→transparent overlay, hud-corner brackets, large title, small caption, animated arrow, hover reveals 6% more image (scale 1.06) + orange bottom bar grows.

5. **OurPartners / OurCustomers (Trust)** — dark matte section, centered eyebrow, large circular logo holders (96px), silver ring, generous 96px gaps, greyscale → full-color on hover.

6. **CertificationsSection** — light section, clean white cards, rounded-2xl, subtle border, large preview thumbnail, status pill (Active/Valid), search+filter chrome restyled only.

7. **LatestInsights (Blogs)** — editorial cards: 16:10 image, category pill (orange outline), Space Grotesk title, hairline meta row, hover: image scale 1.03 + title shifts 4px.

8. **HomepageGallery** — magazine layout: one 16:10 hero image left, 2×2 thumbnails right on desktop; dark bg with grid-engineering overlay; hover zoom 1.05; keep existing gallery logic/controls.

9. **CinematicSection wrapper** — soften: remove aggressive scanlines, keep fade-up + hud brackets only for premium calm feel.

10. **ContactSection** — split: left info column with orange icon tiles (already updated), right form as elevated white card with 2px top orange border, larger inputs (h-14), rounded-xl, generous padding.

11. **PublicFooter** — matte black (#07111F equivalent token), 4-col grid, newsletter card top-right with orange CTA, thin dividers, "Made in India" badge (tricolor accent dot + micro label), social icons outline only.

12. **Section dividers** — replace hard cuts with `SectionDivider` curve/wave in tokenized colors between dark↔light bands; add subtle floating stat card overlapping Hero↔Stats seam.

## Motion

Framer Motion presets already in project. Standardize:
- Reveal: opacity 0→1, y 16→0, 600ms, easeOut, `viewport once`.
- Hover lift: translateY(-4px) + shadow bump, 250ms.
- Image zoom: scale 1→1.05, 500ms.
- No neon, no infinite bounces.

## Guardrails

- No changes to: `src/pages/**` route logic, `src/hooks/**`, `src/integrations/**`, `supabase/**`, admin pages, forms' zod/schema/submit, sliders' JS behavior, filters, search.
- All content stays sourced from Supabase/admin. Only className, wrapper markup, tokens, fonts, and imagery classes change.
- Preserve accessibility: focus rings, aria-labels, contrast AA on dark surfaces.

## Rollout order

1. Tokens + fonts + utilities (`index.css`, `tailwind.config.ts`, `index.html`).
2. Navbar + Footer (global chrome).
3. Stats → Capabilities → Trust → Certifications → Blogs → Gallery → Contact.
4. Section dividers + rhythm pass on `src/pages/Home.tsx` (className/order-preserving wrappers only).
5. Visual QA at desktop/tablet/mobile.

## Out of scope

Hero redesign (explicitly locked), admin UI, product detail page (already redesigned), shop page (already redesigned), any data model or edge function.
