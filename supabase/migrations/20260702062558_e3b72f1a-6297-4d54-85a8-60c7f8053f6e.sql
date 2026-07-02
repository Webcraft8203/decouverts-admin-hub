
-- Phase 1: Shop upgrade — additive, backward compatible

-- 1. Extend products with new optional metadata
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description  text,
  ADD COLUMN IF NOT EXISTS brand             text,
  ADD COLUMN IF NOT EXISTS series            text,
  ADD COLUMN IF NOT EXISTS model_number      text,
  ADD COLUMN IF NOT EXISTS made_in_india     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new_arrival    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_coming_soon    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pre_order      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_discontinued   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applications      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gallery_360       text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title         text,
  ADD COLUMN IF NOT EXISTS seo_description   text,
  ADD COLUMN IF NOT EXISTS seo_keywords      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS og_image_url      text,
  ADD COLUMN IF NOT EXISTS canonical_url     text;

-- 2. product_features
CREATE TABLE IF NOT EXISTS public.product_features (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  icon          text,
  title         text NOT NULL,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_features TO authenticated;
GRANT ALL ON public.product_features TO service_role;
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product features" ON public.product_features FOR SELECT USING (true);
CREATE POLICY "Admins manage product features" ON public.product_features FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_product_features_product ON public.product_features(product_id, display_order);
CREATE TRIGGER product_features_updated BEFORE UPDATE ON public.product_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. product_highlights
CREATE TABLE IF NOT EXISTS public.product_highlights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  icon          text,
  label         text NOT NULL,
  value         text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_highlights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_highlights TO authenticated;
GRANT ALL ON public.product_highlights TO service_role;
ALTER TABLE public.product_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product highlights" ON public.product_highlights FOR SELECT USING (true);
CREATE POLICY "Admins manage product highlights" ON public.product_highlights FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_product_highlights_product ON public.product_highlights(product_id, display_order);
CREATE TRIGGER product_highlights_updated BEFORE UPDATE ON public.product_highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. product_downloads
CREATE TABLE IF NOT EXISTS public.product_downloads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  download_type text NOT NULL DEFAULT 'brochure',
  title         text NOT NULL,
  file_url      text NOT NULL,
  file_size     bigint,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_downloads_type_check
    CHECK (download_type IN ('brochure','manual','cad','firmware','certificate','other'))
);
GRANT SELECT ON public.product_downloads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_downloads TO authenticated;
GRANT ALL ON public.product_downloads TO service_role;
ALTER TABLE public.product_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product downloads" ON public.product_downloads FOR SELECT USING (true);
CREATE POLICY "Admins manage product downloads" ON public.product_downloads FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_product_downloads_product ON public.product_downloads(product_id, display_order);
CREATE TRIGGER product_downloads_updated BEFORE UPDATE ON public.product_downloads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. product_related (manual related products)
CREATE TABLE IF NOT EXISTS public.product_related (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order       integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_related_unique UNIQUE (product_id, related_product_id),
  CONSTRAINT product_related_not_self CHECK (product_id <> related_product_id)
);
GRANT SELECT ON public.product_related TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_related TO authenticated;
GRANT ALL ON public.product_related TO service_role;
ALTER TABLE public.product_related ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view related products" ON public.product_related FOR SELECT USING (true);
CREATE POLICY "Admins manage related products" ON public.product_related FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_product_related_product ON public.product_related(product_id, display_order);
