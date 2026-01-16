-- Create shop_slides table for admin-controlled slider
CREATE TABLE public.shop_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_parameters table for dynamic product attributes
CREATE TABLE public.product_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  parameter_value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shop_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_parameters ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_slides (public read, admin write)
CREATE POLICY "Shop slides are viewable by everyone" 
ON public.shop_slides 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage shop slides" 
ON public.shop_slides 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_parameters (public read, admin write)
CREATE POLICY "Product parameters are viewable by everyone" 
ON public.product_parameters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product parameters" 
ON public.product_parameters 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_shop_slides_visible_order ON public.shop_slides(is_visible, display_order);
CREATE INDEX idx_product_parameters_product ON public.product_parameters(product_id, display_order);

-- Add triggers for updated_at
CREATE TRIGGER update_shop_slides_updated_at
BEFORE UPDATE ON public.shop_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_parameters_updated_at
BEFORE UPDATE ON public.product_parameters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();