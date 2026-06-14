
-- 1. Add phone to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- 2. Add subscriber_id linkage on customer_master
ALTER TABLE public.customer_master
  ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS customer_master_subscriber_id_idx ON public.customer_master(subscriber_id);

-- 3. Update sync_customer_from_invoice to handle phone (priority GST > Email > Phone)
CREATE OR REPLACE FUNCTION public.sync_customer_from_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  matched_id uuid;
  norm_gst   text := NULLIF(upper(trim(coalesce(NEW.buyer_gstin,''))),'');
  norm_email text := NULLIF(lower(trim(coalesce(NEW.client_email,''))),'');
  norm_phone text := NULLIF(regexp_replace(coalesce(NEW.client_phone,''), '\D', '', 'g'), '');
BEGIN
  -- Normalize phone to last 10 digits if longer
  IF norm_phone IS NOT NULL AND length(norm_phone) > 10 THEN
    norm_phone := right(norm_phone, 10);
  END IF;

  IF NEW.order_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customer_master
       SET last_invoice_date    = GREATEST(coalesce(last_invoice_date, NEW.created_at), NEW.created_at),
           total_invoices_count = (SELECT count(*) FROM public.invoices WHERE customer_id = NEW.customer_id),
           mobile_number   = COALESCE(mobile_number, norm_phone),
           email           = COALESCE(email, norm_email),
           gst_number      = COALESCE(gst_number, norm_gst),
           billing_address = COALESCE(NULLIF(billing_address,''), NULLIF(NEW.client_address,'')),
           state           = COALESCE(NULLIF(state,''), NULLIF(NEW.buyer_state,''))
     WHERE id = NEW.customer_id;
    RETURN NEW;
  END IF;

  -- Match priority: GST -> Email -> Phone
  IF norm_gst IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master WHERE upper(gst_number) = norm_gst LIMIT 1;
  END IF;
  IF matched_id IS NULL AND norm_email IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master WHERE lower(email) = norm_email LIMIT 1;
  END IF;
  IF matched_id IS NULL AND norm_phone IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master WHERE mobile_number = norm_phone LIMIT 1;
  END IF;

  IF matched_id IS NULL THEN
    INSERT INTO public.customer_master (
      customer_name, company_name, email, mobile_number, gst_number,
      billing_address, state, country, customer_type, source, created_by
    ) VALUES (
      NEW.client_name,
      CASE WHEN norm_gst IS NOT NULL THEN NEW.client_name ELSE NULL END,
      norm_email,
      norm_phone,
      norm_gst,
      NEW.client_address,
      NEW.buyer_state,
      'India',
      CASE WHEN norm_gst IS NOT NULL THEN 'business' ELSE 'individual' END,
      'invoice',
      NEW.created_by
    )
    RETURNING id INTO matched_id;
  ELSE
    UPDATE public.customer_master SET
      customer_name   = COALESCE(NULLIF(NEW.client_name,''), customer_name),
      email           = COALESCE(email, norm_email),
      mobile_number   = COALESCE(mobile_number, norm_phone),
      gst_number      = COALESCE(gst_number, norm_gst),
      billing_address = COALESCE(NULLIF(billing_address,''), NULLIF(NEW.client_address,'')),
      state           = COALESCE(NULLIF(state,''), NULLIF(NEW.buyer_state,''))
    WHERE id = matched_id;
  END IF;

  NEW.customer_id := matched_id;

  UPDATE public.customer_master
     SET last_invoice_date    = GREATEST(coalesce(last_invoice_date, NEW.created_at), NEW.created_at),
         total_invoices_count = (SELECT count(*) FROM public.invoices WHERE customer_id = matched_id) + 1
   WHERE id = matched_id;

  RETURN NEW;
END;
$function$;

-- Ensure the BEFORE INSERT trigger on invoices exists
DROP TRIGGER IF EXISTS trg_sync_customer_from_invoice ON public.invoices;
CREATE TRIGGER trg_sync_customer_from_invoice
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_from_invoice();

-- 4. Auto-subscribe newsletter when customer email is added or updated
CREATE OR REPLACE FUNCTION public.sync_customer_to_newsletter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  norm_email text := NULLIF(lower(trim(coalesce(NEW.email,''))),'');
  sub_id uuid;
BEGIN
  IF norm_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.newsletter_subscribers (email, is_active, customer_id)
  VALUES (norm_email, true, NEW.id)
  ON CONFLICT (email) DO UPDATE
    SET customer_id = COALESCE(public.newsletter_subscribers.customer_id, EXCLUDED.customer_id),
        is_active   = COALESCE(public.newsletter_subscribers.is_active, true)
  RETURNING id INTO sub_id;

  IF sub_id IS NOT NULL AND (NEW.subscriber_id IS DISTINCT FROM sub_id) THEN
    UPDATE public.customer_master SET subscriber_id = sub_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_customer_to_newsletter ON public.customer_master;
CREATE TRIGGER trg_sync_customer_to_newsletter
  AFTER INSERT OR UPDATE OF email ON public.customer_master
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_to_newsletter();

-- 5. Backfill: link existing customer emails into newsletter subscribers
INSERT INTO public.newsletter_subscribers (email, is_active, customer_id)
SELECT lower(trim(email)), true, id
  FROM public.customer_master
 WHERE email IS NOT NULL AND trim(email) <> ''
ON CONFLICT (email) DO UPDATE
  SET customer_id = COALESCE(public.newsletter_subscribers.customer_id, EXCLUDED.customer_id);

UPDATE public.customer_master cm
   SET subscriber_id = ns.id
  FROM public.newsletter_subscribers ns
 WHERE cm.subscriber_id IS NULL
   AND cm.email IS NOT NULL
   AND lower(trim(cm.email)) = ns.email;
