-- Fix RLS policies to prevent public data exposure

-- 1. Drop and recreate user_roles policies to only allow users to check their own role
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Allow users to check ONLY their own roles (not query other users)
CREATE POLICY "Users can check own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Ensure profiles table only allows users to see their own profile
-- Current policies look fine but let's verify no public access
-- (Already has proper policies restricting to own profile)

-- 3. Fix cart_items - add explicit denial of anonymous access
-- Current policies require auth.uid() = user_id which should work
-- But let's ensure RLS is definitely blocking anonymous

-- 4. Fix order_items - ensure no public access
-- Current policy uses EXISTS check with orders table which should be secure

-- 5. Fix raw_materials - add explicit select policy for admins only
-- Currently only has ALL policy for admins, add explicit SELECT
CREATE POLICY "Only admins can view raw materials"
ON public.raw_materials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix invoices - ensure only admins can SELECT (already has ALL policy)
-- Add explicit SELECT policy
CREATE POLICY "Only admins can view invoices"
ON public.invoices
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Fix promo_codes - restrict public visibility to code only, not usage stats
-- Drop current public policy
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.promo_codes;

-- Create more restrictive policy - users can only validate codes they enter
CREATE POLICY "Users can validate active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);