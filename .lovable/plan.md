## Goal
Refocus the entire product on Drone Technology. Remove Engineering Services, Manufacturing, 3D Printer Configuration, and generic Industry Solutions features from the public site, admin panel, database, and code.

## Public site

**Navigation (`PublicNavbar.tsx`)**
- Remove "Services" and "Solutions" dropdowns entirely.
- Remove links to `/engineering`, `/manufacturing`, `/printer-configuration`, and the `services-section` / `industry-solutions` scroll targets.
- Final desktop + mobile nav order: Home · Drones · Gallery · Blogs · About · Contact · Shop.
- "Drones" links to `/drone-configuration`; Gallery/Contact scroll to their homepage sections.

**Home page (`pages/Home.tsx` + `components/home/*`)**
- Remove sections: `ServicesSection`, `IndustrySolutions`, `BusinessSections`, `HomepageSection`, `WhatDrivesUs` (engineering/manufacturing pillars), `FeaturedProduct` engineering copy, and any Manufacturing Process block.
- Rewrite `HeroSection`, `AboutSection`, `StatsCounter`, and `ContactSection` so all copy speaks about drones only (no "engineering", "manufacturing", "industrial solutions").
- Keep: Hero, Stats, About/Drone pillars, Gallery, Customers, Partners, Contact.

**Pages / routes removed**
- Delete files: `pages/Engineering.tsx`, `pages/Manufacturing.tsx`, `pages/PrinterConfiguration.tsx`.
- Delete routes `/engineering`, `/manufacturing`, `/printer-configuration` from `App.tsx`.
- Update `pages/About.tsx`, `pages/Blogs.tsx`, `pages/Shop.tsx`, `pages/NotFound.tsx`, `components/LegalModal.tsx`, `components/SupportDialogs.tsx`, `components/PublicFooter.tsx`, `hooks/usePageSEO.ts`, `hooks/useProductSEO.ts`, `components/SEOSchemas.tsx` so no remaining copy or links reference engineering/manufacturing/3D printing/industrial-solutions.

## Admin panel

**Sidebar (`AdminLayout.tsx`)**
- Remove "Printer Configs" menu item.
- Keep Drone Configs and all e-commerce/invoicing/reporting items.

**Pages / routes removed**
- Delete `pages/admin/PrinterConfigurations.tsx`.
- Remove `/admin/printer-configurations` route from `App.tsx`.
- Purge any "engineering / manufacturing / industrial solutions / service categories" strings, filters, or copy from remaining admin pages (`Dashboard`, `HomepageSettings`, `HomepageImages`, `BlogPosts`, `Products`, `Invoices`, `Newsletter`, `RawMaterialUsage`).
- Homepage Settings: remove the "engineering" and "manufacturing" section toggles; keep only the drone/e-commerce toggles.

## Database cleanup

Single migration:
- `DROP TABLE IF EXISTS public.printer_configurations CASCADE;`
- `DELETE FROM public.homepage_sections WHERE section_key IN ('engineering','manufacturing');`
- Remove any homepage-image `section` rows tied to engineering/manufacturing.
- No `engineering_services`, `manufacturing_services`, `solutions`, `industry_solutions`, or `service_categories` tables exist today, so nothing else to drop.
- Storage: no dedicated buckets for these modules exist; nothing to delete.

## Code / asset cleanup

- Delete now-unused home components: `ServicesSection.tsx`, `IndustrySolutions.tsx`, `BusinessSections.tsx`, `HomepageSection.tsx`, `WhatDrivesUs.tsx` (or trim to drone-only), plus any engineering/manufacturing-only assets they import.
- Remove unused icons/imports across touched files.
- Update memory: none of the removed features are referenced by existing memory entries (Industrial Configs entry stays because Drone Configuration remains).

## Verification

- Typecheck the project (`tsgo`) — no dangling imports.
- Load `/` and `/admin` in Playwright, confirm no console errors and the new nav renders.
- Confirm removed routes return the 404 page.

## Out of scope / preserved

- Drone Configuration (public + admin) stays.
- Invoice category codes (which may include strings like "PRD-3DP") remain — invoice numbering logic is untouched.
- Blog posts / raw-material data authored by the user are not auto-deleted; only schema and hard-coded UI go.
