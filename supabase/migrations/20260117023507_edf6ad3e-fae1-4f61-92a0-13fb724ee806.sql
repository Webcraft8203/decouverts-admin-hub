-- Add cost_price column to products table (admin-only field for calculating profit)
ALTER TABLE public.products 
ADD COLUMN cost_price numeric DEFAULT 0;

-- Add comment to clarify this is an admin-only field
COMMENT ON COLUMN public.products.cost_price IS 'Manufacturing/production cost per unit (admin-only)';