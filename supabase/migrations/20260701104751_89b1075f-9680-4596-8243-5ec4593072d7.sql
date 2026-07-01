
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'certification',
  status_label TEXT DEFAULT 'Active',
  image_url TEXT,
  pdf_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.certifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active certifications"
  ON public.certifications FOR SELECT
  USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can insert certifications"
  ON public.certifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can update certifications"
  ON public.certifications FOR UPDATE
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can delete certifications"
  ON public.certifications FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_certifications_display
  ON public.certifications(is_active, is_featured DESC, display_order ASC);
