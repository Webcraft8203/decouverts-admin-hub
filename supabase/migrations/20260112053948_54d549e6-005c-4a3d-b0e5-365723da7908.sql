-- Add GST percentage to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gst_percentage numeric NOT NULL DEFAULT 18;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_gst_percentage ON public.products(gst_percentage);

-- Update orders table to store GST breakdown per item and buyer GSTIN
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS buyer_gstin text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gst_breakdown jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.products.gst_percentage IS 'GST percentage applicable to this product (e.g., 5, 12, 18)';
COMMENT ON COLUMN public.orders.buyer_gstin IS 'Customer GSTIN for B2B purchases';
COMMENT ON COLUMN public.orders.gst_breakdown IS 'Detailed GST breakdown per item with CGST/SGST/IGST amounts';