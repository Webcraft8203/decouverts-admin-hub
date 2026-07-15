
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL UNIQUE,
  quotation_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  reference_number text,
  subject text,
  prepared_by text,
  customer_name text NOT NULL,
  company_name text,
  contact_person text,
  mobile text,
  email text,
  gst_number text,
  billing_address text,
  shipping_address text,
  delivery_time text,
  installation text,
  training text,
  warranty text,
  payment_terms text,
  dispatch_location text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  taxable_amount numeric NOT NULL DEFAULT 0,
  cgst numeric NOT NULL DEFAULT 0,
  sgst numeric NOT NULL DEFAULT 0,
  igst numeric NOT NULL DEFAULT 0,
  round_off numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  is_igst boolean NOT NULL DEFAULT false,
  scope_of_supply text,
  exclusions text,
  terms_conditions text,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quotations"
  ON public.quotations FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER quotations_set_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_quotations_created_at ON public.quotations(created_at DESC);
CREATE INDEX idx_quotations_status ON public.quotations(status);

CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'Nos',
  rate numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 18,
  total numeric NOT NULL DEFAULT 0,
  line_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_items TO authenticated;
GRANT ALL ON public.quotation_items TO service_role;

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage quotation items"
  ON public.quotation_items FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);

-- Number generator: DFT-QT-YYYY-NNNN (financial year based, e.g. 2627 for FY 26-27)
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr int;
  mo int;
  start_yy int;
  end_yy int;
  fy text;
  next_serial int;
  formatted text;
  lock_key bigint;
BEGIN
  yr := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Kolkata')::int;
  mo := EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Kolkata')::int;
  IF mo >= 4 THEN
    start_yy := yr % 100;
    end_yy := (yr + 1) % 100;
  ELSE
    start_yy := (yr - 1) % 100;
    end_yy := yr % 100;
  END IF;
  fy := lpad(start_yy::text, 2, '0') || lpad(end_yy::text, 2, '0');

  lock_key := ('x' || substr(md5('quotation|' || fy), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(split_part(quotation_number, '-', 4), '\D', '', 'g'), '')::int
  ), 0) + 1
  INTO next_serial
  FROM public.quotations
  WHERE quotation_number LIKE 'DFT-QT-' || fy || '-%';

  formatted := 'DFT-QT-' || fy || '-' || lpad(next_serial::text, 4, '0');
  RETURN formatted;
END;
$$;
