-- Add order_type and design_request_id to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS design_request_id uuid REFERENCES public.design_requests(id) ON DELETE SET NULL;

-- Add converted_to_order to design_requests table
ALTER TABLE public.design_requests 
ADD COLUMN IF NOT EXISTS converted_to_order boolean NOT NULL DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_design_request_id ON public.orders(design_request_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);