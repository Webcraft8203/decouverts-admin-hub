-- Add new permissions to the enum (must be committed separately)
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'mark_attendance';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_attendance';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_leave';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_leave_requests';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'generate_payslips';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_payslips';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_gst_reports';

-- Create leave_status enum
DO $$ BEGIN
  CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create attendance_status enum  
DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave', 'holiday');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;