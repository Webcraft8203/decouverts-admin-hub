-- Drop existing constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_availability_status_check;

-- Add new constraint with low_stock option
ALTER TABLE public.products ADD CONSTRAINT products_availability_status_check 
CHECK (availability_status = ANY (ARRAY['in_stock'::text, 'out_of_stock'::text, 'low_stock'::text]));