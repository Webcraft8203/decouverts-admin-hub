-- Add shipping details columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS courier_name text,
ADD COLUMN IF NOT EXISTS tracking_id text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS expected_delivery_date date,
ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone;