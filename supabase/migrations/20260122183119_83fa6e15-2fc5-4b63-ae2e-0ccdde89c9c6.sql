-- Create enum for employee permissions
CREATE TYPE public.employee_permission AS ENUM (
  'view_orders',
  'update_orders',
  'manage_shipping',
  'view_accounting',
  'view_gst_reports',
  'view_revenue',
  'download_financials',
  'view_invoices',
  'generate_invoices',
  'download_invoices',
  'manage_products',
  'manage_categories',
  'manage_inventory',
  'manage_homepage',
  'manage_blog',
  'manage_partners',
  'manage_customer_reviews',
  'view_customers',
  'manage_promo_codes',
  'view_activity_logs',
  'manage_design_requests',
  'manage_printer_configs',
  'manage_drone_configs',
  'view_contact_requests'
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL UNIQUE,
  department TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_permissions table for granular access
CREATE TABLE public.employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  permission employee_permission NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, permission)
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is super admin (has admin role)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE user_id = _user_id
  )
$$;

-- Function to check if employee has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission employee_permission)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employee_permissions ep ON ep.employee_id = e.id
    WHERE e.user_id = _user_id
      AND e.is_active = true
      AND ep.permission = _permission
  )
$$;

-- Function to check if user has any admin access (super admin OR active employee)
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.employees
      WHERE user_id = _user_id
        AND is_active = true
    )
$$;

-- RLS Policies for employees table
CREATE POLICY "Super admins can manage employees"
ON public.employees
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Employees can view own record"
ON public.employees
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for employee_permissions table
CREATE POLICY "Super admins can manage permissions"
ON public.employee_permissions
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Employees can view own permissions"
ON public.employee_permissions
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add employee role type
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';