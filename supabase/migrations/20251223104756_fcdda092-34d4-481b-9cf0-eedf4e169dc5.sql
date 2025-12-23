-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Public can view products" ON public.products;

-- Create as PERMISSIVE policy (default)
CREATE POLICY "Public can view products" 
ON public.products 
FOR SELECT 
TO public
USING (true);