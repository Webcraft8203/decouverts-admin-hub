-- Create product_reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view approved reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.product_reviews 
FOR SELECT 
USING (is_approved = true);

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews" 
ON public.product_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create reviews
CREATE POLICY "Users can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own reviews
CREATE POLICY "Users can update own reviews" 
ON public.product_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete own reviews
CREATE POLICY "Users can delete own reviews" 
ON public.product_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews" 
ON public.product_reviews 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();