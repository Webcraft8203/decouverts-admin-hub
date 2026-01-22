-- Add shipment_id column to orders table for unique shipment tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create unique shipment ID function
CREATE OR REPLACE FUNCTION public.generate_shipment_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id text;
BEGIN
  new_id := 'SHP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  RETURN new_id;
END;
$$;

-- Create trigger to auto-generate shipment_id when shipping details are added
CREATE OR REPLACE FUNCTION public.set_shipment_id_on_ship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate shipment_id when order is marked as shipped and doesn't have one
  IF NEW.status = 'shipped' AND (NEW.shipment_id IS NULL OR NEW.shipment_id = '') THEN
    NEW.shipment_id := public.generate_shipment_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_set_shipment_id ON public.orders;
CREATE TRIGGER tr_set_shipment_id
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_shipment_id_on_ship();

-- Add index for faster shipment lookups
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON public.orders(shipment_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);