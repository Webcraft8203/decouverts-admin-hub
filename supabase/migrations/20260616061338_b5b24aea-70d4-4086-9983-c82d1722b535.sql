
CREATE OR REPLACE FUNCTION public.sync_customer_from_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched_id uuid;
  norm_gst   text := NULLIF(upper(trim(coalesce(NEW.buyer_gstin,''))),'');
  norm_email text := NULLIF(lower(trim(coalesce(NEW.client_email,''))),'');
  norm_phone text := NULLIF(regexp_replace(coalesce(NEW.client_phone,''), '\D', '', 'g'), '');
  action_taken text := 'none';
BEGIN
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
    RAISE NOTICE 'sync_customer_from_invoice: reused customer_id=% (already linked)', NEW.customer_id;
    RETURN NEW;
  END IF;

  -- Match priority: GST -> Email -> Phone (normalize both sides for phone)
  IF norm_gst IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master
      WHERE upper(trim(gst_number)) = norm_gst LIMIT 1;
  END IF;
  IF matched_id IS NULL AND norm_email IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master
      WHERE lower(trim(email)) = norm_email LIMIT 1;
  END IF;
  IF matched_id IS NULL AND norm_phone IS NOT NULL THEN
    SELECT id INTO matched_id FROM public.customer_master
      WHERE right(regexp_replace(coalesce(mobile_number,''), '\D', '', 'g'), 10) = norm_phone
      LIMIT 1;
  END IF;

  IF matched_id IS NULL THEN
    BEGIN
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
      action_taken := 'created';
    EXCEPTION WHEN unique_violation THEN
      -- A concurrent insert or a normalization mismatch hit a unique index.
      -- Re-fetch by GST/Email/Phone instead of failing the invoice.
      IF norm_gst IS NOT NULL THEN
        SELECT id INTO matched_id FROM public.customer_master
          WHERE upper(trim(gst_number)) = norm_gst LIMIT 1;
      END IF;
      IF matched_id IS NULL AND norm_email IS NOT NULL THEN
        SELECT id INTO matched_id FROM public.customer_master
          WHERE lower(trim(email)) = norm_email LIMIT 1;
      END IF;
      IF matched_id IS NULL AND norm_phone IS NOT NULL THEN
        SELECT id INTO matched_id FROM public.customer_master
          WHERE right(regexp_replace(coalesce(mobile_number,''), '\D', '', 'g'), 10) = norm_phone
          LIMIT 1;
      END IF;
      IF matched_id IS NULL THEN
        RAISE; -- truly unexpected, surface the error
      END IF;
      action_taken := 'reused_after_conflict';
    END;
  ELSE
    UPDATE public.customer_master SET
      customer_name   = COALESCE(NULLIF(NEW.client_name,''), customer_name),
      email           = COALESCE(email, norm_email),
      mobile_number   = COALESCE(mobile_number, norm_phone),
      gst_number      = COALESCE(gst_number, norm_gst),
      billing_address = COALESCE(NULLIF(billing_address,''), NULLIF(NEW.client_address,'')),
      state           = COALESCE(NULLIF(state,''), NULLIF(NEW.buyer_state,''))
    WHERE id = matched_id;
    action_taken := 'reused_and_updated';
  END IF;

  NEW.customer_id := matched_id;

  UPDATE public.customer_master
     SET last_invoice_date    = GREATEST(coalesce(last_invoice_date, NEW.created_at), NEW.created_at),
         total_invoices_count = (SELECT count(*) FROM public.invoices WHERE customer_id = matched_id) + 1
   WHERE id = matched_id;

  RAISE NOTICE 'sync_customer_from_invoice: action=% customer_id=% gst=% email=% phone=%',
    action_taken, matched_id, norm_gst, norm_email, norm_phone;

  RETURN NEW;
END;
$function$;
