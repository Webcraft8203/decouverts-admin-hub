# Premium Hero Redesign + Featured Products

Full scope, no backend logic changes to existing systems. Only additions: 1 new table for hero slides, plus reuse of existing `products.is_featured` (or add flag if missing).

## 1. Database (additions only)

New table `hero_slides` (CMS-driven, no hardcoded content):
- `title`, `subtitle`, `description`, `badge_label`
- `image_url`, `background_image_url`, `video_url`
- `primary_cta_label`, `primary_cta_link`, `secondary_cta_label`, `secondary_cta_link`
- `glow_color` (hex), `display_order` (int), `is_active` (bool)
- Standard RLS: public read active, admins full write. GRANTs to anon (select active) + authenticated + service_role.

Products: verify `is_featured` + `display_order` exist on `products` table. If missing, add them (non-breaking, default false/0).

Storage: reuse existing product/homepage bucket for uploads (no new bucket unless needed).

## 2. Hero Section Redesign (`src/components/home/HeroSection.tsx`)

Split layout:
- **Left 45%**: Badge, large heading, description, dual CTA (magnetic hover), 3 mini animated stat counters.
- **Right 55%**: Cinematic slider — Apple-style. Center slide large; prev/next peek at ~85% scale, 40% opacity behind. Fade+scale transition via Framer Motion `AnimatePresence`. Auto-advance 6s, pause on hover. Arrow keys + swipe (framer drag).
- Floating drone: `y` float loop, subtle rotate, orange radial glow, mouse parallax (motion values), soft shadow.
- Slide info overlay: category badge, heading, subtitle, description, primary+secondary buttons, slide counter "01 / 05".
- **Right-edge vertical thumbnails**: small rounded cards w/ drone thumb + name; active = orange border + scale.
- **Bottom glass strip**: 4 feature cards (Precision, Endurance, Autonomy, Made in India — pulled from CMS-style constants OR keep as static presentational since feature strip wasn't listed as CMS-managed). Animated icons, hover lift, orange accent.

Background layers (all subtle, GPU-only transforms/opacity):
- Blueprint grid (CSS bg-image)
- Radial orange + blue gradients
- Noise texture (svg data-uri)
- Faint flight paths (SVG dashed curves, motion path-draw)
- Radar rings pulsing behind drone
- Scanning line sweep
- Tiny floating particles (framer motion loop)

## 3. Section Divider (Hero → Stats)

Soft gradient fade + wave SVG. Update `SectionDivider` usage in `Home.tsx`.

## 4. Featured Products Section (new component `FeaturedProducts.tsx`)

Placed under `StatsCounter` in `Home.tsx`.
- Title: "Featured Products" / Subtitle: "Designed, Built and Ready for Mission."
- Query `products` where `is_featured=true` and `is_visible=true`, order by `display_order`, limit configurable (default 4).
- If empty → renders `null`.
- Grid: 1 / 2 / 4 cols. Card: image (zoom on hover), name, category, price, stock badge, Quick View, Add to Cart, View Product. Orange glow + lift on hover.

## 5. Admin Panel

New page `src/pages/admin/HeroSlides.tsx`:
- List with drag-reorder (or up/down buttons — keep simple: order input)
- Add / Edit / Delete slide
- Fields: badge, heading, subtitle, description, image upload, background image upload, video URL, primary/secondary CTA label+link, glow color picker, display order, active toggle
- Uses existing storage bucket for uploads

Register route in `App.tsx` under admin. Add sidebar link in `AdminLayout.tsx` ("Hero Slides", Rocket icon).

Products admin: add "Featured" toggle + display order column in existing `ProductMaster.tsx` / `Products.tsx` (small addition, no logic change).

## 6. Performance

- Framer Motion only (already installed)
- `loading="lazy"` on non-first slide images, `fetchpriority="high"` on first
- All animations on `transform`/`opacity`
- Slider uses `AnimatePresence mode="wait"` to avoid overlap cost

## 7. Files touched

New:
- `supabase/migrations/<ts>_hero_slides.sql`
- `src/components/home/HeroSlider.tsx` (cinematic slider)
- `src/components/home/HeroFeatureStrip.tsx`
- `src/components/home/FeaturedProducts.tsx`
- `src/pages/admin/HeroSlides.tsx`

Edited:
- `src/components/home/HeroSection.tsx` (rewrite)
- `src/components/home/SectionDivider.tsx` (gradient variant)
- `src/pages/Home.tsx` (add FeaturedProducts, divider tweak)
- `src/App.tsx` (admin route)
- `src/components/AdminLayout.tsx` (nav item)
- `src/pages/admin/ProductMaster.tsx` or `Products.tsx` (featured toggle) — minimal

Untouched: auth, DB (except additions), APIs, routing (except new admin route), forms, business logic.

## Confirm before I build

1. OK to add `hero_slides` table and (if missing) `products.is_featured` + `products.display_order` columns?
2. Feature strip (4 cards under hero) — keep static in code, or also CMS-managed? Your spec listed slider as CMS but not the strip explicitly.
3. Featured products limit — hard cap at 4, or admin-configurable via a homepage setting?
