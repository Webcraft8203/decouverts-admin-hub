-- Add invoice type and tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proforma_invoice_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS final_invoice_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

-- Add invoice_type column to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_type text DEFAULT 'proforma';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_final boolean DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_date timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);

-- Comment for documentation
COMMENT ON COLUMN public.orders.proforma_invoice_url IS 'URL of the temporary/proforma invoice generated on order placement';
COMMENT ON COLUMN public.orders.final_invoice_url IS 'URL of the final GST tax invoice generated after delivery';
COMMENT ON COLUMN public.orders.delivered_at IS 'Timestamp when the order was marked as delivered';
COMMENT ON COLUMN public.invoices.invoice_type IS 'Type of invoice: proforma (temporary) or final (tax invoice)';
COMMENT ON COLUMN public.invoices.is_final IS 'Whether this is the final tax invoice (true) or temporary proforma (false)';