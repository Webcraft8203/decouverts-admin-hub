-- Add new columns to homepage_images for professional portfolio
ALTER TABLE public.homepage_images 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS project_id TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to have default title from alt_text
UPDATE public.homepage_images 
SET title = COALESCE(alt_text, 'Untitled Project')
WHERE title IS NULL;

-- Make title required for new records
ALTER TABLE public.homepage_images 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN title SET DEFAULT 'Untitled Project';

-- Add description default
ALTER TABLE public.homepage_images 
ALTER COLUMN description SET DEFAULT '';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_homepage_images_category ON public.homepage_images(category);
CREATE INDEX IF NOT EXISTS idx_homepage_images_is_featured ON public.homepage_images(is_featured);