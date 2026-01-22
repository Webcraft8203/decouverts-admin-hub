-- =============================================
-- SECURITY HARDENING: Fix Critical Data Exposure
-- =============================================

-- 1. FIX: contact_requests - restrict SELECT to admins only
DROP POLICY IF EXISTS "Public can view contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Anyone can view contact requests" ON public.contact_requests;

-- Ensure only admins can read contact requests (use existing permission)
CREATE POLICY "Only admins can view contact requests"
ON public.contact_requests
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  has_permission(auth.uid(), 'view_contact_requests')
);

-- 2. FIX: printer_configurations - restrict SELECT to admins only
DROP POLICY IF EXISTS "Public can view printer configurations" ON public.printer_configurations;
DROP POLICY IF EXISTS "Anyone can view printer configurations" ON public.printer_configurations;

-- Ensure only admins can read printer configs (use existing permission)
CREATE POLICY "Only admins can view printer configurations"
ON public.printer_configurations
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  has_permission(auth.uid(), 'manage_printer_configs')
);

-- 3. FIX: drone_configurations - restrict SELECT to admins only
DROP POLICY IF EXISTS "Public can view drone configurations" ON public.drone_configurations;
DROP POLICY IF EXISTS "Anyone can view drone configurations" ON public.drone_configurations;

-- Ensure only admins can read drone configs (use existing permission)
CREATE POLICY "Only admins can view drone configurations"
ON public.drone_configurations
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  has_permission(auth.uid(), 'manage_drone_configs')
);

-- 4. FIX: invoice_settings - restrict SELECT to admins only
DROP POLICY IF EXISTS "Public can view invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Anyone can view invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Invoice settings are publicly readable" ON public.invoice_settings;

-- Ensure only admins/employees with invoice access can read settings
CREATE POLICY "Only authorized users can view invoice settings"
ON public.invoice_settings
FOR SELECT
USING (
  is_super_admin(auth.uid()) OR 
  has_permission(auth.uid(), 'view_invoices') OR
  has_permission(auth.uid(), 'generate_invoices')
);

-- 5. FIX: Permissive INSERT policies with USING (true) on lead capture tables
-- These need to allow public inserts but nothing else

-- Fix contact_requests INSERT - keep public insert but verify it's properly scoped
DROP POLICY IF EXISTS "Public can insert contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Anyone can insert contact requests" ON public.contact_requests;

CREATE POLICY "Public can submit contact requests"
ON public.contact_requests
FOR INSERT
WITH CHECK (true);  -- Public forms need to accept submissions

-- Fix printer_configurations INSERT
DROP POLICY IF EXISTS "Public can insert printer configurations" ON public.printer_configurations;
DROP POLICY IF EXISTS "Anyone can insert printer configurations" ON public.printer_configurations;

CREATE POLICY "Public can submit printer configurations"
ON public.printer_configurations
FOR INSERT
WITH CHECK (true);  -- Public forms need to accept submissions

-- Fix drone_configurations INSERT
DROP POLICY IF EXISTS "Public can insert drone configurations" ON public.drone_configurations;
DROP POLICY IF EXISTS "Anyone can insert drone configurations" ON public.drone_configurations;

CREATE POLICY "Public can submit drone configurations"
ON public.drone_configurations
FOR INSERT
WITH CHECK (true);  -- Public forms need to accept submissions