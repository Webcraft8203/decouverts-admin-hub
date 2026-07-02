# Shop Redesign — Aerospace Deep-Tech Experience

Reposition the Shop from an e-commerce grid into an **interactive aerospace product catalogue** modeled after DJI Enterprise / Anduril / Skydio / Apple. All content stays driven by the existing admin panel; backend gets small additive extensions for 3D models, CAD files, and mission metadata.

Given the size, I'll deliver this in **5 sequenced phases**. Each phase is shippable on its own — you can approve, review, then say "continue" for the next.

---

## Design Language (locked across all phases)

- **Palette:** White base, graphite `#1a1d24`, signal orange `#FF6A1A`, soft glass surfaces
- **Motifs:** Thin engineering grid, blueprint lines, radar rings, orange glow accents, glassmorphism
- **Type:** Large display headings (Space Grotesk / Sora), technical mono for specs (JetBrains Mono)
- **Motion:** Framer Motion everywhere — parallax, scroll reveals, hover lifts, cinematic transitions
- **Feel:** Engineered, precise, minimal, futuristic — never "shop-y"

---

## Phase 1 — Backend extensions (additive, non-breaking)

New tables and columns to power 3D models, mission metadata, and richer product data. Existing admin flows keep working.

- `products` new columns: `mission_type`, `mission_ready_score` (0-100), `readiness_breakdown` (jsonb), `industries` (text[]), `awards` (text[]), `model_3d_url`, `model_3d_format` (glb/gltf/usdz), `blueprint_images` (text[]), `video_urls` (jsonb), `platform_count_label`
- `categories` new columns: `icon_name`, `tagline`, `mission_label`
- New table `product_360_images` (product_id, image_url, frame_index)
- New table `product_certifications` (product_id, cert_name, cert_type, issued_by, icon_name)
- New table `product_timeline` (product_id, stage, title, description, date, display_order)
- New table `product_accessories` (product_id, accessory_product_id, accessory_type, display_order)
- Storage bucket `product-3d-models` (public) for GLB/GLTF/USDZ
- All tables: proper GRANTs + RLS (public read, admin write)

## Phase 2 — Shop page core rebuild

- **Cinematic Hero:** Split layout, large heading "Engineering India's Next Generation UAV Platforms", floating 3D drone (model-viewer + fallback image), animated radar rings, particle field, floating spec chips (Range / Payload / Endurance / AI Nav / Mission Ready), CTAs: Explore Platforms + Book Demonstration. Slide transitions animate the whole scene.
- **Glass Feature Bar:** Mission Ready · Made in India · AI Powered · Enterprise Grade · DGCA Ready · Modular Design — connected by animated orange line
- **Aerospace Category Cards:** Icon + name + mission label + platform count + arrow. Hover lift, orange glow, animated border, mesh background
- **Command Center Search:** Glass container with global search, voice icon, category / mission / payload / price / availability filters, sort
- **Engineered Product Cards:** Blueprint background lines, floating badges (Bestseller, Made in India, category), quick-spec strip (Flight Time / Payload / Range / Motor / Controller), hover: slight rotate + orange under-glow. Buttons: **Explore Platform →** (primary), **Get Quote** (secondary), Compare / 3D View / Wishlist icons. No "Add to Cart" as primary.

## Phase 3 — Fullscreen Quick View + Compare

- **Fullscreen Quick View modal:** Large drone image / 3D viewer, 360 spinner, specs, applications, gallery, videos, mission profile, downloads, "Request Demo" CTA
- **Compare tool:** Floating side panel to add up to 4 products → opens comparison table (Payload / Range / Battery / Weight / Flight Time / Navigation / Mission / Applications / Price)
- **Sticky Floating Side Panel:** Compare · Recently Viewed · Wishlist · Downloads · Request Quote · Book Demo

## Phase 4 — Product Detail page overhaul

- **Left column:** Gallery with 360 viewer, 3D model viewer (`@google/model-viewer`), AR preview button (USDZ/GLB), exploded view toggle, hover zoom, fullscreen
- **Right column:** Mission type, category, status (Available / Made in India / DGCA Ready), optional price, CTAs: **Request Quote · Download Brochure · Book Demo · Talk to Engineer**
- **Animated Tabs:** Overview · Specifications · Applications · Downloads · Gallery · Videos · Reviews · FAQ · Accessories · Similar Platforms
- **Specs Dashboard:** Card grid (not table), expandable groups, mono values, icon per spec
- **Applications:** Image cards with hover animation
- **Downloads:** Typed cards (PDF / Manual / Datasheet / CAD / Mission Brief / Certification / Brochure)
- **Mission Readiness Score:** Animated circular gauge + breakdown (Weather / AI / Navigation / Payload / Reliability)
- **Certifications strip:** Clickable cards (Made in India / DGCA / ISO / R&D / Defence)
- **Timeline:** Concept → Prototype → Testing → Production → Deployment (animated)
- **Technical Drawings gallery:** Blueprint / CAD / exploded diagrams
- **Accessories ecosystem:** Modular grid (Battery / Payload / Camera / LiDAR / Thermal / Controller / Landing Gear / 3D Printer Parts)
- **Related Platforms carousel:** Center-focus, perspective animation

## Phase 5 — Admin panel extensions + polish

- Admin Products form: new tabs for **3D Model upload**, **360 Images**, **Mission Metadata**, **Timeline**, **Certifications**, **Accessories**, **Readiness Score builder**, **Blueprint uploads**, **Video links**
- All existing admin functionality preserved
- Global scroll animations pass (Framer Motion + optional Lenis smooth scroll)
- Engineering grid + particle background layer
- SEO, lazy loading, image optimization, code splitting, full responsive audit

---

## Technical Notes

- **3D viewer:** `@google/model-viewer` (web component, tiny, supports GLB/GLTF/USDZ + AR out of the box). Falls back to image if no model.
- **Smooth scroll:** Lenis (optional, gated behind reduced-motion)
- **Animation:** Framer Motion (already installed). GSAP only if a specific effect needs it.
- **No breaking changes** to existing cart, wishlist, checkout, or admin flows — CTAs shift emphasis but underlying data model stays.

---

Reply **"start phase 1"** (or "start") and I'll begin with the database migration. Or tell me to reorder / drop phases.
