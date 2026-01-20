
-- Create blog_slides table for the hero slider
CREATE TABLE public.blog_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_link TEXT,
  cta_text TEXT DEFAULT 'Read More',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  feature_image TEXT,
  image_gallery TEXT[] DEFAULT '{}',
  youtube_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Decouverts Team',
  content_type TEXT NOT NULL DEFAULT 'blog' CHECK (content_type IN ('blog', 'news')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  meta_title TEXT,
  meta_description TEXT,
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog slides policies
CREATE POLICY "Public can view visible blog slides"
ON public.blog_slides FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can manage blog slides"
ON public.blog_slides FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Blog posts policies
CREATE POLICY "Public can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage blog posts"
ON public.blog_posts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_content_type ON public.blog_posts(content_type);
CREATE INDEX idx_blog_posts_publish_date ON public.blog_posts(publish_date DESC);
CREATE INDEX idx_blog_slides_display_order ON public.blog_slides(display_order);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_blog_slides_updated_at
BEFORE UPDATE ON public.blog_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
