-- Update storage policy for invoices SELECT to include employees with view_invoices/download_invoices permission
DROP POLICY IF EXISTS "Admins can view all invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view invoices" ON storage.objects;

CREATE POLICY "Authorized users can view invoices" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'invoices' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'view_invoices'::employee_permission)
    OR has_permission(auth.uid(), 'download_invoices'::employee_permission)
    OR has_permission(auth.uid(), 'manage_shipping'::employee_permission)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Update storage policy for invoices INSERT to include employees with generate_invoices/manage_shipping permission
DROP POLICY IF EXISTS "Admins can upload invoices" ON storage.objects;

CREATE POLICY "Authorized users can upload invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'invoices' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'generate_invoices'::employee_permission)
    OR has_permission(auth.uid(), 'manage_shipping'::employee_permission)
  )
);

-- Update storage policy for invoices DELETE to include employees with appropriate permission
DROP POLICY IF EXISTS "Admins can delete invoices" ON storage.objects;

CREATE POLICY "Authorized users can delete invoices" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'invoices' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'generate_invoices'::employee_permission)
  )
);