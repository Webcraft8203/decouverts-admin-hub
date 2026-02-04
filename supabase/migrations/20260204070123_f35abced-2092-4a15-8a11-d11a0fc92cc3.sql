-- Add SKU (auto-generated) and HSN Code fields to products
-- SKU will be auto-generated in format: DEC-PRD-00001

-- Add new columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- Create sequence for SKU generation
CREATE SEQUENCE IF NOT EXISTS products_sku_seq START 1;

-- Function to generate SKU
CREATE OR REPLACE FUNCTION public.generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
  new_sku TEXT;
  seq_num INTEGER;
BEGIN
  IF NEW.sku IS NULL THEN
    seq_num := nextval('products_sku_seq');
    new_sku := 'DEC-PRD-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.sku := new_sku;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate SKU on insert
DROP TRIGGER IF EXISTS trigger_generate_sku ON public.products;
CREATE TRIGGER trigger_generate_sku
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_sku();

-- Update existing products with SKU values
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM public.products WHERE sku IS NULL ORDER BY created_at
  LOOP
    UPDATE public.products 
    SET sku = 'DEC-PRD-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
  
  -- Update sequence to continue from where we left off
  IF counter > 1 THEN
    PERFORM setval('products_sku_seq', counter);
  END IF;
END $$;

-- Create index for faster SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON public.products(hsn_code);