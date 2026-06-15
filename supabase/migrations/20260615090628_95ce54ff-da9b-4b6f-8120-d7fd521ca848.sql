
-- =========================
-- products_master
-- =========================
CREATE TABLE public.products_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_name_norm TEXT GENERATED ALWAYS AS (lower(btrim(product_name))) STORED,
  description TEXT,
  hsn_code TEXT NOT NULL,
  default_gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
  default_unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT,
  invoice_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX products_master_name_hsn_uniq
  ON public.products_master (product_name_norm, lower(hsn_code));
CREATE INDEX products_master_name_idx ON public.products_master (product_name_norm);
CREATE INDEX products_master_hsn_idx ON public.products_master (lower(hsn_code));
CREATE INDEX products_master_category_idx ON public.products_master (category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_master TO authenticated;
GRANT ALL ON public.products_master TO service_role;
ALTER TABLE public.products_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage products_master"
  ON public.products_master
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_products_master_updated_at
  BEFORE UPDATE ON public.products_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- invoice_product_usage
-- =========================
CREATE TABLE public.invoice_product_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products_master(id) ON DELETE CASCADE,
  description TEXT,
  hsn_code TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2),
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX invoice_product_usage_invoice_idx ON public.invoice_product_usage (invoice_id);
CREATE INDEX invoice_product_usage_product_idx ON public.invoice_product_usage (product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_product_usage TO authenticated;
GRANT ALL ON public.invoice_product_usage TO service_role;
ALTER TABLE public.invoice_product_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invoice_product_usage"
  ON public.invoice_product_usage
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- =========================
-- Sync function & trigger
-- =========================
CREATE OR REPLACE FUNCTION public.sync_products_from_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  it          jsonb;
  idx         int := 0;
  norm_name   text;
  norm_hsn    text;
  desc_text   text;
  qty         numeric;
  rate        numeric;
  gst         numeric;
  total       numeric;
  matched_id  uuid;
BEGIN
  -- Clear previous usage rows for this invoice (idempotent across UPDATE)
  DELETE FROM public.invoice_product_usage WHERE invoice_id = NEW.id;

  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    desc_text := COALESCE(it->>'description', it->>'name', it->>'product_name', '');
    norm_name := lower(btrim(desc_text));
    norm_hsn  := lower(btrim(COALESCE(it->>'hsn_code', it->>'hsn', '')));
    qty       := COALESCE((it->>'quantity')::numeric, 1);
    rate      := COALESCE((it->>'price')::numeric, (it->>'rate')::numeric, 0);
    gst       := COALESCE((it->>'gst_rate')::numeric, 18);
    total     := COALESCE((it->>'total')::numeric, qty * rate);

    -- Skip empty rows
    IF norm_name = '' OR norm_hsn = '' THEN
      idx := idx + 1;
      CONTINUE;
    END IF;

    -- Match priority: (name + hsn) -> (hsn alone) -> (name alone)
    SELECT id INTO matched_id
      FROM public.products_master
     WHERE product_name_norm = norm_name AND lower(hsn_code) = norm_hsn
     LIMIT 1;

    IF matched_id IS NULL THEN
      SELECT id INTO matched_id FROM public.products_master
        WHERE lower(hsn_code) = norm_hsn AND product_name_norm = norm_name LIMIT 1;
    END IF;

    IF matched_id IS NULL THEN
      INSERT INTO public.products_master (
        product_name, description, hsn_code, default_gst_rate, default_unit_price,
        invoice_count, last_used_at, created_by
      ) VALUES (
        desc_text, desc_text, norm_hsn, gst, rate,
        1, NEW.created_at, NEW.created_by
      )
      ON CONFLICT (product_name_norm, lower(hsn_code)) DO UPDATE
        SET invoice_count   = public.products_master.invoice_count + 1,
            last_used_at    = GREATEST(public.products_master.last_used_at, EXCLUDED.last_used_at),
            default_unit_price = COALESCE(NULLIF(EXCLUDED.default_unit_price,0), public.products_master.default_unit_price),
            default_gst_rate   = COALESCE(EXCLUDED.default_gst_rate, public.products_master.default_gst_rate)
      RETURNING id INTO matched_id;
    ELSE
      UPDATE public.products_master
         SET invoice_count = invoice_count + 1,
             last_used_at  = GREATEST(COALESCE(last_used_at, NEW.created_at), NEW.created_at),
             default_unit_price = CASE WHEN rate > 0 THEN rate ELSE default_unit_price END,
             default_gst_rate   = COALESCE(gst, default_gst_rate)
       WHERE id = matched_id;
    END IF;

    INSERT INTO public.invoice_product_usage (
      invoice_id, product_id, description, hsn_code, quantity, rate, gst_rate, total, line_index
    ) VALUES (
      NEW.id, matched_id, desc_text, norm_hsn, qty, rate, gst, total, idx
    );

    idx := idx + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_products_from_invoice
  AFTER INSERT OR UPDATE OF items ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_products_from_invoice();

-- =========================
-- Backfill from existing invoices
-- =========================
DO $$
DECLARE
  inv RECORD;
  it  jsonb;
  idx int;
  norm_name text;
  norm_hsn  text;
  desc_text text;
  qty numeric; rate numeric; gst numeric; total numeric;
  matched_id uuid;
BEGIN
  FOR inv IN SELECT id, items, created_at, created_by FROM public.invoices WHERE items IS NOT NULL LOOP
    idx := 0;
    IF jsonb_typeof(inv.items) <> 'array' THEN CONTINUE; END IF;

    FOR it IN SELECT * FROM jsonb_array_elements(inv.items) LOOP
      desc_text := COALESCE(it->>'description', it->>'name', it->>'product_name', '');
      norm_name := lower(btrim(desc_text));
      norm_hsn  := lower(btrim(COALESCE(it->>'hsn_code', it->>'hsn', '')));
      qty := COALESCE((it->>'quantity')::numeric, 1);
      rate:= COALESCE((it->>'price')::numeric, (it->>'rate')::numeric, 0);
      gst := COALESCE((it->>'gst_rate')::numeric, 18);
      total := COALESCE((it->>'total')::numeric, qty*rate);

      IF norm_name = '' OR norm_hsn = '' THEN
        idx := idx + 1; CONTINUE;
      END IF;

      SELECT id INTO matched_id FROM public.products_master
        WHERE product_name_norm = norm_name AND lower(hsn_code) = norm_hsn LIMIT 1;

      IF matched_id IS NULL THEN
        INSERT INTO public.products_master (
          product_name, description, hsn_code, default_gst_rate, default_unit_price,
          invoice_count, last_used_at, created_by
        ) VALUES (desc_text, desc_text, norm_hsn, gst, rate, 1, inv.created_at, inv.created_by)
        ON CONFLICT (product_name_norm, lower(hsn_code)) DO UPDATE
          SET invoice_count = public.products_master.invoice_count + 1,
              last_used_at  = GREATEST(public.products_master.last_used_at, EXCLUDED.last_used_at)
        RETURNING id INTO matched_id;
      ELSE
        UPDATE public.products_master
           SET invoice_count = invoice_count + 1,
               last_used_at  = GREATEST(COALESCE(last_used_at, inv.created_at), inv.created_at)
         WHERE id = matched_id;
      END IF;

      INSERT INTO public.invoice_product_usage
        (invoice_id, product_id, description, hsn_code, quantity, rate, gst_rate, total, line_index)
      VALUES (inv.id, matched_id, desc_text, norm_hsn, qty, rate, gst, total, idx);

      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;
