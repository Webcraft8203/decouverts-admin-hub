CREATE TABLE public.document_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type text NOT NULL DEFAULT 'invoice',
  content text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_terms TO authenticated;
GRANT SELECT ON public.document_terms TO anon;
GRANT ALL ON public.document_terms TO service_role;

ALTER TABLE public.document_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active terms" ON public.document_terms
FOR SELECT USING (true);

CREATE POLICY "Admins can manage terms" ON public.document_terms
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_document_terms_updated_at
BEFORE UPDATE ON public.document_terms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.document_terms (document_type, content, display_order) VALUES
('invoice', 'Goods once sold will only be taken back or exchanged as per company policy.', 1),
('invoice', 'Payment is due within 7 days of the invoice date. A 5% late fee will be charged on overdue payments.', 2),
('invoice', 'All disputes are subject to Pune jurisdiction.', 3),
('invoice', 'Warranty as per product terms and conditions.', 4),
('quotation', 'This quotation is valid for the period mentioned above.', 1),
('quotation', 'Prices are subject to change without prior notice after validity.', 2),
('quotation', 'All disputes are subject to Pune jurisdiction.', 3);