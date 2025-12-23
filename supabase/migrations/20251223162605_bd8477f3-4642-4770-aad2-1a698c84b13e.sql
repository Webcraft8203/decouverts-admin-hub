-- Drop the old constraint and create a new one with all status options
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'confirmed'::text, 
  'packing'::text,
  'waiting-for-pickup'::text,
  'processing'::text, 
  'shipped'::text, 
  'out-for-delivery'::text,
  'delivered'::text, 
  'cancelled'::text
]));