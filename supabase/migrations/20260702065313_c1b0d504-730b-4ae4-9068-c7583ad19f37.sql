
-- Extend products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS mission_type text,
  ADD COLUMN IF NOT EXISTS mission_ready_score integer CHECK (mission_ready_score IS NULL OR (mission_ready_score >= 0 AND mission_ready_score <= 100)),
  ADD COLUMN IF NOT EXISTS readiness_breakdown jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industries text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS awards text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS model_3d_url text,
  ADD COLUMN IF NOT EXISTS model_3d_format text,
  ADD COLUMN IF NOT EXISTS blueprint_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS platform_count_label text;

-- Extend categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS icon_name text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS mission_label text;

-- 360 images
CREATE TABLE IF NOT EXISTS public.product_360_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  frame_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_360_images TO anon, authenticated;
GRANT ALL ON public.product_360_images TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_360_images TO authenticated;
ALTER TABLE public.product_360_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read 360 images" ON public.product_360_images FOR SELECT USING (true);
CREATE POLICY "admins manage 360 images" ON public.product_360_images FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_product_360_product ON public.product_360_images(product_id, frame_index);

-- Certifications
CREATE TABLE IF NOT EXISTS public.product_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cert_name text NOT NULL,
  cert_type text,
  issued_by text,
  icon_name text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_certifications TO anon, authenticated;
GRANT ALL ON public.product_certifications TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_certifications TO authenticated;
ALTER TABLE public.product_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product certs" ON public.product_certifications FOR SELECT USING (true);
CREATE POLICY "admins manage product certs" ON public.product_certifications FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_product_certs_product ON public.product_certifications(product_id, display_order);

-- Timeline
CREATE TABLE IF NOT EXISTS public.product_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stage text NOT NULL,
  title text NOT NULL,
  description text,
  event_date date,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_timeline TO anon, authenticated;
GRANT ALL ON public.product_timeline TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_timeline TO authenticated;
ALTER TABLE public.product_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product timeline" ON public.product_timeline FOR SELECT USING (true);
CREATE POLICY "admins manage product timeline" ON public.product_timeline FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_product_timeline_product ON public.product_timeline(product_id, display_order);

-- Accessories
CREATE TABLE IF NOT EXISTS public.product_accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  accessory_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  accessory_type text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, accessory_product_id)
);
GRANT SELECT ON public.product_accessories TO anon, authenticated;
GRANT ALL ON public.product_accessories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.product_accessories TO authenticated;
ALTER TABLE public.product_accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product accessories" ON public.product_accessories FOR SELECT USING (true);
CREATE POLICY "admins manage product accessories" ON public.product_accessories FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_product_accessories_product ON public.product_accessories(product_id, display_order);
