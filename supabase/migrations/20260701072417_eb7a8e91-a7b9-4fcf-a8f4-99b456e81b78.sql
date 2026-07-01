
-- Hero slides table (CMS-driven cinematic hero slider)
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_label TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  background_image_url TEXT,
  video_url TEXT,
  primary_cta_label TEXT,
  primary_cta_link TEXT,
  secondary_cta_label TEXT,
  secondary_cta_link TEXT,
  glow_color TEXT DEFAULT '#f97316',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides FOR ALL
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Featured products support on existing products table (non-breaking additions)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_is_featured_idx
  ON public.products(is_featured, featured_order)
  WHERE is_featured = true;
