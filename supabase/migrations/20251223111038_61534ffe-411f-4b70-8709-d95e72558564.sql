-- Make invoices bucket public so users can download their invoices
UPDATE storage.buckets SET public = true WHERE id = 'invoices';

-- Create storage policies for invoices
CREATE POLICY "Anyone can view invoices"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoices');

CREATE POLICY "Service role can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');