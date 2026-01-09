-- Add video_url column to products table for YouTube video support
ALTER TABLE public.products 
ADD COLUMN video_url TEXT DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.products.video_url IS 'Optional YouTube video URL for product demo videos';