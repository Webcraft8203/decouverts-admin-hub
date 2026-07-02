# Shop Module — Full Redesign Plan

Scope is large. Below is the concrete build broken into phases. Everything is backward compatible — existing products keep working. New fields default to null/empty; the UI gracefully falls back to legacy data (`description`, `images`, `video_url`, `product_parameters`).

---

## Phase 0 — Audit findings (current state)

**Shop page (`Shop.tsx`, 634 lines):** monolithic; generic grid; weak filters (only category + price); no sort variety, no application/badge filter; card is basic; no quick view, compare, or quote; no hero/story sections.

**Product page (`ProductDetail.tsx`, 680 lines):** basic gallery, no zoom/360, no sticky purchase card, no applications/features/highlights sections, no downloads, no FAQ, no timeline; SEO minimal.

**Admin (`Products.tsx`, `ProductMaster.tsx`):** covers name/price/stock/images/video/params only. Missing: brand, series, model, short/long desc split, badges (bestseller, new, coming-soon, pre-order, made-in-india), applications, features, highlights, downloads, SEO fields, manual related products, brochure/manual/CAD files.

**DB (`products` table):** has id/name/description/price/category/images/video_url/sku/hsn/slug/is_featured/featured_order. Missing everything above.

**Perf/SEO:** no per-product schema.org, no OG, no breadcrumbs, no lazy image priority hints.

---

## Phase 1 — Backend (single migration, backward compatible)

Add new nullable columns to `public.products`:

```
short_description text
long_description  text          -- if null, fall back to description
brand             text
series            text
model_number      text
made_in_india     boolean default false
is_bestseller     boolean default false
is_new_arrival    boolean default false
is_coming_soon    boolean default false
is_pre_order      boolean default false
is_discontinued   boolean default false
applications      text[] default '{}'
seo_title         text
seo_description   text
seo_keywords      text[] default '{}'
og_image_url      text
canonical_url     text
gallery_360       text[] default '{}'
```

Three new child tables (all with GRANT + RLS: public SELECT, admin ALL):

- `product_features` — id, product_id, icon, title, description, display_order
- `product_highlights` — id, product_id, icon, label, value, display_order
- `product_downloads` — id, product_id, type (brochure/manual/cad/firmware/certificate), title, file_url, file_size, display_order
- `product_related` — id, product_id, related_product_id, display_order (manual override; auto-related still works via category)

No changes to `product_parameters` — dynamic key/value stays exactly as-is.

New storage bucket `product-downloads` (private, signed URLs via existing admin flow) — or reuse `product-images` if the user prefers public downloads. Default: reuse `product-images` for simplicity (public).

**Migration is additive only.** Existing rows keep working; UI treats new fields as optional.

---

## Phase 2 — Admin Panel upgrades

`src/pages/admin/Products.tsx` reorganized into a tabbed editor:

1. **General** — name, short desc, long desc (rich), brand, series, model, category, price, stock, GST, HSN, SKU (auto)
2. **Badges & Status** — featured, bestseller, new arrival, coming soon, pre-order, discontinued, made-in-india, in-stock
3. **Media** — images (existing), 360 image set, video URL
4. **Specifications** — existing `product_parameters` editor (unchanged)
5. **Features** — repeater (icon picker + title + desc)
6. **Highlights** — repeater (icon + label + value)
7. **Applications** — multi-select from a preset list + custom tags
8. **Downloads** — file uploads categorized by type
9. **Related Products** — manual picker (auto fallback stays)
10. **SEO** — title, description, keywords, OG image, canonical

No existing admin field is removed. Old products load with new sections empty.

---

## Phase 3 — Shop redesign (`Shop.tsx` rewrite)

Sections in order:
1. **Cinematic hero** (reuses `shop_slides`)
2. **Categories rail** — horizontal scroll with images
3. **Featured Collection** — large asymmetric cards
4. **Product Explorer** — filters (category, application, price, availability, badges) + sort + grid; skeleton loading; framer-motion fade-in per card
5. **Popular Products** — bestsellers
6. **Recently Added** — sorted by created_at desc
7. **Industries** — links into `/categories/:slug`
8. **Why Decouvertes** — 4 value props
9. **Downloads Hub** — aggregated latest brochures
10. **Newsletter CTA**

Filters use URL params so state is shareable. Virtualization only if list > 60 items (keep simple otherwise).

---

## Phase 4 — Premium Product Card

New `src/components/shop/ProductCard.tsx`:
- Large image with hover zoom + orange glow
- Badge stack (Featured / Bestseller / New / Made in India / Pre-Order)
- Application chips (first 3)
- Hover reveal action bar: Quick View, Compare, Wishlist, Request Quote
- Primary CTA: Add to Cart / View Product
- Framer-motion hover lift + shadow

Quick View opens a Dialog with gallery + key specs + Add-to-Cart, no navigation.

Compare uses localStorage list (up to 4); `/shop/compare` page renders side-by-side specs table.

---

## Phase 5 — DJI-style Product Page (`ProductDetail.tsx` rewrite)

Layout:
- **Sticky sub-nav** (Overview · Specs · Features · Downloads · Reviews)
- **Hero split** — large gallery left (zoom, thumbnails, 360 toggle, video), sticky purchase card right (price, stock, quantity, Add to Cart, Wishlist, Request Quote, key highlights)
- **Highlights strip** — animated counter cards
- **Storytelling sections** — features (icon cards), applications (industry grid)
- **Specifications** — reuses the redesigned premium spec cards from last turn (already dynamic)
- **Downloads** — categorized cards with size/type
- **Timeline** — how it ships / warranty / support (static template, no admin)
- **Reviews** — existing system, restyled
- **Related Products** — manual first, else auto by category
- **Recently Viewed** — localStorage
- **FAQs** — collapsible (uses existing accordion). Data source: static per-product template initially (admin FAQ table can come later if wanted)

**SEO per page** via `react-helmet-async`: `<title>`, meta description, canonical, OG image, Twitter card, `Product` JSON-LD (name, image, description, sku, brand, offers, aggregateRating).

**Mobile:** sticky bottom Buy bar; drawer filters; swipe gallery.

---

## Phase 6 — Animations & Perf

- Framer Motion: page transition wrapper, section fade-up on intersection, magnetic buttons on primary CTAs
- Progressive image loading (blur-up), `loading="lazy"` except first hero image (`fetchpriority="high"`)
- Code-split heavy sections (`React.lazy` for 360 viewer, compare page)
- Skeleton components for all grids

---

## Files touched

**New**
- `supabase/migrations/<ts>_shop_upgrade.sql`
- `src/components/shop/ProductCard.tsx`
- `src/components/shop/QuickView.tsx`
- `src/components/shop/CompareBar.tsx`
- `src/components/shop/ShopHero.tsx` (or reuse existing `ShopHeroSlider`)
- `src/components/shop/FilterPanel.tsx`
- `src/components/product/StickyPurchaseCard.tsx`
- `src/components/product/ProductGallery.tsx` (zoom + 360 + video)
- `src/components/product/HighlightsStrip.tsx`
- `src/components/product/FeaturesGrid.tsx`
- `src/components/product/ApplicationsGrid.tsx`
- `src/components/product/DownloadsSection.tsx`
- `src/components/product/ProductFAQ.tsx`
- `src/components/product/ProductSEO.tsx` (Helmet + JSON-LD)
- `src/pages/shop/Compare.tsx`
- `src/pages/admin/ProductFeatures.tsx` etc. — merged as tabs inside existing `Products.tsx`

**Rewritten**
- `src/pages/Shop.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/admin/Products.tsx` (tabbed editor)

**Kept as-is**
- `product_parameters` table + admin editor
- `cart_items`, `wishlist`, `orders` — no changes
- Auth, checkout, payments, invoices, categories

---

## What I need to confirm before building

1. **Scope size** — this is a large multi-turn build. OK to proceed in this order: (a) migration + admin editor upgrades, (b) product page rewrite, (c) shop page rewrite, (d) polish (compare, quick view, FAQ, timeline)? Or do you want a specific phase first?
2. **Downloads bucket** — reuse public `product-images` (simple, files are shareable) or create a private `product-downloads` bucket (signed URLs, more secure)?
3. **FAQ source** — static per-page template for now, or add a `product_faqs` admin table in the same migration?
4. **`react-helmet-async`** — OK to add as a dependency for per-product SEO/OG tags?
