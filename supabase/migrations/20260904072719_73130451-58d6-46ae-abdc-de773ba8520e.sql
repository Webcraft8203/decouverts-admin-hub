ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;

UPDATE public.invoices SET amount_paid = total_amount WHERE payment_status = 'paid';