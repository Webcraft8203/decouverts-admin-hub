-- Create homepage_images table
CREATE TABLE public.homepage_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_requests table
CREATE TABLE public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Homepage Images Policies
CREATE POLICY "Public can view active images"
ON public.homepage_images
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage images"
ON public.homepage_images
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Contact Requests Policies
CREATE POLICY "Anyone can submit contact request"
ON public.contact_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all contact requests"
ON public.contact_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contact requests"
ON public.contact_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contact requests"
ON public.contact_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for homepage images
INSERT INTO storage.buckets (id, name, public)
VALUES ('homepage-images', 'homepage-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for homepage images bucket
CREATE POLICY "Public can view homepage images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'homepage-images');

CREATE POLICY "Admins can upload homepage images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update homepage images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete homepage images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'homepage-images' AND has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_homepage_images_updated_at
BEFORE UPDATE ON public.homepage_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_requests_updated_at
BEFORE UPDATE ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();