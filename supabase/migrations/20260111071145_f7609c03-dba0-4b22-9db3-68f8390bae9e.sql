-- Create invoice_settings table for admin-configurable settings
CREATE TABLE public.invoice_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text NOT NULL DEFAULT 'Decouverts',
  business_address text NOT NULL DEFAULT '',
  business_city text NOT NULL DEFAULT '',
  business_state text NOT NULL DEFAULT '',
  business_pincode text NOT NULL DEFAULT '',
  business_country text NOT NULL DEFAULT 'India',
  business_phone text NOT NULL DEFAULT '',
  business_email text NOT NULL DEFAULT '',
  business_gstin text NOT NULL DEFAULT '',
  business_logo_url text,
  platform_fee_percentage numeric NOT NULL DEFAULT 2,
  platform_fee_taxable boolean NOT NULL DEFAULT false,
  invoice_prefix text NOT NULL DEFAULT 'INV',
  terms_and_conditions text NOT NULL DEFAULT 'Goods once sold are non-refundable. Payment due within 30 days. Warranty as per product terms.',
  default_gst_rate numeric NOT NULL DEFAULT 18,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage invoice settings"
ON public.invoice_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view settings for invoice display
CREATE POLICY "Public can view invoice settings"
ON public.invoice_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.invoice_settings (
  business_name,
  business_address,
  business_city,
  business_state,
  business_pincode,
  business_country,
  business_phone,
  business_email,
  business_gstin,
  terms_and_conditions
) VALUES (
  'Decouverts',
  '123 Innovation Hub, Tech Park',
  'Pune',
  'Maharashtra',
  '411001',
  'India',
  '+91 98765 43210',
  'info@decouverts.com',
  '27XXXXX1234X1ZX',
  'Goods once sold are non-refundable. Payment due within 30 days. Warranty as per product terms.'
);

-- Add GST-related columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS buyer_gstin text,
ADD COLUMN IF NOT EXISTS buyer_state text,
ADD COLUMN IF NOT EXISTS seller_state text DEFAULT 'Maharashtra',
ADD COLUMN IF NOT EXISTS cgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_tax numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_igst boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gst_breakdown jsonb DEFAULT '[]'::jsonb;

-- Create trigger for updated_at
CREATE TRIGGER update_invoice_settings_updated_at
BEFORE UPDATE ON public.invoice_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();