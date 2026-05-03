CREATE POLICY "Admins can delete invoices"
ON public.invoices
FOR DELETE
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.has_permission(auth.uid(), 'generate_invoices')
  OR public.has_permission(auth.uid(), 'view_accounting')
);

CREATE OR REPLACE FUNCTION public.cleanup_invoice_pdf()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.pdf_url IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'invoices'
      AND name = OLD.pdf_url;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_invoice_pdf ON public.invoices;
CREATE TRIGGER trg_cleanup_invoice_pdf
BEFORE DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.cleanup_invoice_pdf();