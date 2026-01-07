-- Create customer_reviews table
CREATE TABLE public.customer_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  designation TEXT,
  photo_url TEXT,
  review_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_title TEXT NOT NULL,
  image_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  image_title TEXT NOT NULL,
  image_description TEXT NOT NULL,
  website_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_reviews
CREATE POLICY "Public can view published reviews" 
ON public.customer_reviews 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can manage reviews" 
ON public.customer_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for partners
CREATE POLICY "Public can view published partners" 
ON public.partners 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admins can manage partners" 
ON public.partners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for customer and partner images
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-partner-images', 'customer-partner-images', true);

-- Storage policies
CREATE POLICY "Public can view customer partner images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-partner-images');

CREATE POLICY "Admins can upload customer partner images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-partner-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update customer partner images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-partner-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete customer partner images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-partner-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_customer_reviews_updated_at
BEFORE UPDATE ON public.customer_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();