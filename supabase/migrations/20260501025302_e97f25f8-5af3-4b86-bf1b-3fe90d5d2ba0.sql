
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS category_code text,
  ADD COLUMN IF NOT EXISTS financial_year text,
  ADD COLUMN IF NOT EXISTS serial_number integer;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_category_fy_serial_unique
  ON public.invoices (category_code, financial_year, serial_number)
  WHERE category_code IS NOT NULL AND financial_year IS NOT NULL AND serial_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_structured_invoice_number(_category_code text)
RETURNS TABLE(invoice_number text, category_code text, financial_year text, serial_number integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fy text;
  yr int;
  mo int;
  start_yy int;
  end_yy int;
  next_serial int;
  formatted text;
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

  -- Lock matching rows to safely compute next serial
  SELECT COALESCE(MAX(i.serial_number), 0) + 1
    INTO next_serial
  FROM public.invoices i
  WHERE i.category_code = _category_code
    AND i.financial_year = fy
  FOR UPDATE;

  formatted := 'DFT/' || fy || '/' || _category_code || '/' || lpad(next_serial::text, 3, '0');

  RETURN QUERY SELECT formatted, _category_code, fy, next_serial;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_structured_invoice_number(text) TO authenticated, service_role;
