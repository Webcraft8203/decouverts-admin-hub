CREATE OR REPLACE FUNCTION public.generate_structured_invoice_number(_category_code text DEFAULT NULL)
 RETURNS TABLE(invoice_number text, category_code text, financial_year text, serial_number integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  yr int;
  mo int;
  start_yyyy int;
  end_yy int;
  fy text;
  next_serial int;
  formatted text;
  lock_key bigint;
BEGIN
  yr := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Kolkata')::int;
  mo := EXTRACT(MONTH FROM now() AT TIME ZONE 'Asia/Kolkata')::int;

  IF mo >= 4 THEN
    start_yyyy := yr;
    end_yy := (yr + 1) % 100;
  ELSE
    start_yyyy := yr - 1;
    end_yy := yr % 100;
  END IF;

  fy := start_yyyy::text || '-' || lpad(end_yy::text, 2, '0');

  lock_key := ('x' || substr(md5('invoice|' || fy), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(split_part(i.invoice_number, '/', 3), '\D', '', 'g'), '')::int
  ), 0) + 1
  INTO next_serial
  FROM public.invoices i
  WHERE i.invoice_number LIKE 'INV/' || fy || '/%';

  formatted := 'INV/' || fy || '/' || lpad(next_serial::text, 4, '0');

  RETURN QUERY SELECT formatted, 'INV'::text, fy, next_serial;
END;
$function$;