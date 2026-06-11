
-- 1. Add new columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS proforma_status text,
  ADD COLUMN IF NOT EXISTS converted_to_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_proforma_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Default proforma_status to 'draft' for existing proforma invoices
UPDATE public.invoices
SET proforma_status = 'draft'
WHERE invoice_type = 'proforma' AND proforma_status IS NULL;

-- 2. Trigger: prevent deletion of paid final invoices
CREATE OR REPLACE FUNCTION public.prevent_paid_invoice_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.is_final = true OR OLD.invoice_type = 'final') AND OLD.payment_status = 'paid' THEN
    RAISE EXCEPTION 'Paid invoices cannot be deleted because they are permanent accounting records.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_paid_invoice_deletion ON public.invoices;
CREATE TRIGGER trg_prevent_paid_invoice_deletion
BEFORE DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.prevent_paid_invoice_deletion();

-- 3. Trigger: lock edits on paid final invoices (allow only payment_notes, payment_reference)
CREATE OR REPLACE FUNCTION public.lock_paid_invoice_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when OLD status was already paid AND it's a final invoice
  IF (OLD.is_final = true OR OLD.invoice_type = 'final') AND OLD.payment_status = 'paid' THEN
    -- Allow these fields to change; block everything else
    IF NEW.invoice_number IS DISTINCT FROM OLD.invoice_number
       OR NEW.client_name IS DISTINCT FROM OLD.client_name
       OR NEW.client_email IS DISTINCT FROM OLD.client_email
       OR NEW.client_address IS DISTINCT FROM OLD.client_address
       OR NEW.buyer_state IS DISTINCT FROM OLD.buyer_state
       OR NEW.buyer_gstin IS DISTINCT FROM OLD.buyer_gstin
       OR NEW.items::text IS DISTINCT FROM OLD.items::text
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.tax_amount IS DISTINCT FROM OLD.tax_amount
       OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
       OR NEW.cgst_amount IS DISTINCT FROM OLD.cgst_amount
       OR NEW.sgst_amount IS DISTINCT FROM OLD.sgst_amount
       OR NEW.igst_amount IS DISTINCT FROM OLD.igst_amount
       OR NEW.is_igst IS DISTINCT FROM OLD.is_igst
       OR NEW.category_code IS DISTINCT FROM OLD.category_code
       OR NEW.financial_year IS DISTINCT FROM OLD.financial_year
       OR NEW.serial_number IS DISTINCT FROM OLD.serial_number
       OR NEW.invoice_type IS DISTINCT FROM OLD.invoice_type
       OR NEW.is_final IS DISTINCT FROM OLD.is_final
       OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    THEN
      RAISE EXCEPTION 'Paid invoices are locked. Only payment notes and reference can be edited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_paid_invoice_edits ON public.invoices;
CREATE TRIGGER trg_lock_paid_invoice_edits
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.lock_paid_invoice_edits();
