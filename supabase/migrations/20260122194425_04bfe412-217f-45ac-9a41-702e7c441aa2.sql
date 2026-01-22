-- First migration: Add new permission enum values only
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_employee_profiles';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_employee_profiles';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_salary_info';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_salary';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_employee_documents';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_employee_documents';