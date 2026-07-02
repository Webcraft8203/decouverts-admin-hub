
CREATE POLICY "public read 3d models" ON storage.objects FOR SELECT USING (bucket_id = 'product-3d-models');
CREATE POLICY "admins upload 3d models" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-3d-models' AND public.is_super_admin(auth.uid()));
CREATE POLICY "admins update 3d models" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-3d-models' AND public.is_super_admin(auth.uid()));
CREATE POLICY "admins delete 3d models" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-3d-models' AND public.is_super_admin(auth.uid()));
