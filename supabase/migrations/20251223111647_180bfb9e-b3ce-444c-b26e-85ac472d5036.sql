-- Keep invoices private (contain customer address/phone)
UPDATE storage.buckets SET public = false WHERE id = 'invoices';

-- Remove overly-permissive policies created earlier
DROP POLICY IF EXISTS "Anyone can view invoices" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload invoices" ON storage.objects;

-- Allow users to read only their own invoice files (stored under {user_id}/...)
CREATE POLICY "Users can view own invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view any invoices
CREATE POLICY "Admins can view all invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
