
-- ============ customer_master table ============
CREATE TABLE IF NOT EXISTS public.customer_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  company_name text,
  contact_person text,
  mobile_number text,
  alternate_mobile text,
  email text,
  gst_number text,
  pan_number text,
  billing_address text,
  shipping_address text,
  city text,
  state text,
  country text DEFAULT 'India',
  pincode text,
  customer_type text NOT NULL DEFAULT 'business' CHECK (customer_type IN ('individual','business')),
  source text NOT NULL DEFAULT 'manual_entry' CHECK (source IN ('invoice','website_order','manual_entry','newsletter_signup')),
  notes text,
  last_invoice_date timestamptz,
  total_invoices_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness indexes for de-dup matching
CREATE UNIQUE INDEX IF NOT EXISTS customer_master_gst_uniq
  ON public.customer_master (upper(gst_number)) WHERE gst_number IS NOT NULL AND gst_number <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customer_master_email_uniq
  ON public.customer_master (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS customer_master_mobile_uniq
  ON public.customer_master (mobile_number) WHERE mobile_number IS NOT NULL AND mobile_number <> '';

CREATE INDEX IF NOT EXISTS customer_master_name_idx ON public.customer_master USING gin (to_tsvector('simple', coalesce(customer_name,'') || ' ' || coalesce(company_name,'')));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_master TO authenticated;
GRANT ALL ON public.customer_master TO service_role;

ALTER TABLE public.customer_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and view_customers can read customer_master"
  ON public.customer_master FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_permission(auth.uid(), 'view_customers'));

CREATE POLICY "Admins and view_customers can insert customer_master"
  ON public.customer_master FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_permission(auth.uid(), 'view_customers'));

CREATE POLICY "Admins and view_customers can update customer_master"
  ON public.customer_master FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_permission(auth.uid(), 'view_customers'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_permission(auth.uid(), 'view_customers'));

CREATE POLICY "Admins can delete customer_master"
  ON public.customer_master FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER customer_master_updated_at
  BEFORE UPDATE ON public.customer_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FK links ============
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customer_master(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON public.invoices(customer_id);

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customer_master(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS newsletter_subscribers_customer_id_idx ON public.newsletter_subscribers(customer_id);

-- ============ Auto-sync customer + newsletter from invoice ============
CREATE OR REPLACE FUNCTION public.sync_customer_from_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_id uuid;
  norm_gst text := NULLIF(upper(trim(coalesce(NEW.buyer_gstin,''))),'');
  norm_email text := NULLIF(lower(trim(coalesce(NEW.client_email,''))),'');
BEGIN
  -- Only run on manual invoices (no order_id). Order-based invoices keep their existing flow.
  IF NEW.order_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- If invoice already linked, just bump counters
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customer_master
       SET last_invoice_date = GREATEST(coalesce(last_invoice_date, NEW.created_at), NEW.created_at),
           total_invoices_count = (SELECT count(*) FROM public.invoices WHERE customer_id = NEW.customer_id)
     WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;

  -- Priority matching: GST > Email > Mobile (mobile not on invoice, skip)
  IF norm_gst IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master
      WHERE upper(gst_number) = norm_gst LIMIT 1;
  END IF;

  IF matched_id IS NULL AND norm_email IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master
      WHERE lower(email) = norm_email LIMIT 1;
  END IF;

  IF matched_id IS NULL THEN
    INSERT INTO public.customer_master (
      customer_name, company_name, email, gst_number,
      billing_address, state, country, customer_type, source, created_by
    ) VALUES (
      NEW.client_name,
      CASE WHEN norm_gst IS NOT NULL THEN NEW.client_name ELSE NULL END,
      norm_email,
      norm_gst,
      NEW.client_address,
      NEW.buyer_state,
      'India',
      CASE WHEN norm_gst IS NOT NULL THEN 'business' ELSE 'individual' END,
      'invoice',
      NEW.created_by
    )
    RETURNING id INTO matched_id;

    -- Newsletter auto-subscribe (skip if email exists)
    IF norm_email IS NOT NULL THEN
      INSERT INTO public.newsletter_subscribers (email, is_active, customer_id)
      VALUES (norm_email, true, matched_id)
      ON CONFLICT (email) DO UPDATE
        SET customer_id = COALESCE(public.newsletter_subscribers.customer_id, EXCLUDED.customer_id);
    END IF;
  ELSE
    -- Update existing customer with any new info (don't overwrite with NULL)
    UPDATE public.customer_master SET
      customer_name = COALESCE(NULLIF(NEW.client_name,''), customer_name),
      email = COALESCE(email, norm_email),
      gst_number = COALESCE(gst_number, norm_gst),
      billing_address = COALESCE(NULLIF(NEW.client_address,''), billing_address),
      state = COALESCE(NULLIF(NEW.buyer_state,''), state)
    WHERE id = matched_id;
  END IF;

  NEW.customer_id := matched_id;

  -- Update counters on customer
  UPDATE public.customer_master
     SET last_invoice_date = GREATEST(coalesce(last_invoice_date, NEW.created_at), NEW.created_at),
         total_invoices_count = (SELECT count(*) FROM public.invoices WHERE customer_id = matched_id) + 1
   WHERE id = matched_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_customer_from_invoice_trg ON public.invoices;
CREATE TRIGGER sync_customer_from_invoice_trg
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_from_invoice();

-- Backfill: create customers from existing manual invoices
DO $$
DECLARE r RECORD; matched_id uuid; norm_gst text; norm_email text;
BEGIN
  FOR r IN
    SELECT id, client_name, client_email, buyer_gstin, client_address, buyer_state, created_at, created_by
    FROM public.invoices
    WHERE order_id IS NULL AND customer_id IS NULL
    ORDER BY created_at
  LOOP
    norm_gst := NULLIF(upper(trim(coalesce(r.buyer_gstin,''))),'');
    norm_email := NULLIF(lower(trim(coalesce(r.client_email,''))),'');
    matched_id := NULL;

    IF norm_gst IS NOT NULL THEN
      SELECT id INTO matched_id FROM public.customer_master WHERE upper(gst_number) = norm_gst LIMIT 1;
    END IF;
    IF matched_id IS NULL AND norm_email IS NOT NULL THEN
      SELECT id INTO matched_id FROM public.customer_master WHERE lower(email) = norm_email LIMIT 1;
    END IF;
    IF matched_id IS NULL THEN
      INSERT INTO public.customer_master (
        customer_name, company_name, email, gst_number, billing_address, state, country,
        customer_type, source, created_by, created_at
      ) VALUES (
        r.client_name,
        CASE WHEN norm_gst IS NOT NULL THEN r.client_name ELSE NULL END,
        norm_email, norm_gst, r.client_address, r.buyer_state, 'India',
        CASE WHEN norm_gst IS NOT NULL THEN 'business' ELSE 'individual' END,
        'invoice', r.created_by, r.created_at
      ) RETURNING id INTO matched_id;
    END IF;

    UPDATE public.invoices SET customer_id = matched_id WHERE id = r.id;
  END LOOP;

  -- Refresh counts and last_invoice_date
  UPDATE public.customer_master c SET
    total_invoices_count = sub.cnt,
    last_invoice_date = sub.last_d
  FROM (
    SELECT customer_id, count(*) cnt, max(created_at) last_d
    FROM public.invoices WHERE customer_id IS NOT NULL GROUP BY customer_id
  ) sub
  WHERE c.id = sub.customer_id;
END$$;
