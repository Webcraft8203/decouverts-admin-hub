-- Update invoice number generator to new compact format: DFT{FY}{CAT}{SERIAL}
CREATE OR REPLACE FUNCTION public.generate_structured_invoice_number(_category_code text)
 RETURNS TABLE(invoice_number text, category_code text, financial_year text, serial_number integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fy text;
  yr int;
  mo int;
  start_yy int;
  end_yy int;
  next_serial int;
  formatted text;
  lock_key bigint;
  cat_clean text;
BEGIN
  IF _category_code IS NULL OR length(trim(_category_code)) = 0 THEN
    RAISE EXCEPTION 'Category code is required';
  END IF;

  yr := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Kolkata')::int;
  mo := EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Kolkata')::int;

  IF mo >= 4 THEN
    start_yy := yr % 100;
    end_yy := (yr + 1) % 100;
  ELSE
    start_yy := (yr - 1) % 100;
    end_yy := yr % 100;
  END IF;

  fy := lpad(start_yy::text, 2, '0') || '-' || lpad(end_yy::text, 2, '0');

  lock_key := ('x' || substr(md5(_category_code || '|' || fy), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COALESCE(MAX(i.serial_number), 0) + 1
    INTO next_serial
  FROM public.invoices i
  WHERE i.category_code = _category_code
    AND i.financial_year = fy;

  -- New compact format: strip separators from FY and category, prefix with DFT
  cat_clean := regexp_replace(upper(_category_code), '[^A-Z0-9]', '', 'g');
  formatted := 'DFT' || replace(fy, '-', '') || cat_clean || lpad(next_serial::text, 3, '0');

  RETURN QUERY SELECT formatted, _category_code, fy, next_serial;
END;
$function$;

-- Migrate existing invoice numbers to the new compact format
UPDATE public.invoices
SET invoice_number = REPLACE(REPLACE(REPLACE(invoice_number, '/', ''), '-', ''), ' ', '')
WHERE invoice_number ~ '[/\- ]';
