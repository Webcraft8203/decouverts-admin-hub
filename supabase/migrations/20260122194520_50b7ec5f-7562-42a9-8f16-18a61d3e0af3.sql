-- Create salary type enum
CREATE TYPE public.salary_type AS ENUM ('monthly', 'hourly', 'contract');

-- Create salary status enum  
CREATE TYPE public.salary_status AS ENUM ('pending', 'paid', 'on_hold');

-- Extend employees table with additional profile fields
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS current_address TEXT,
ADD COLUMN IF NOT EXISTS permanent_address TEXT,
ADD COLUMN IF NOT EXISTS date_of_joining DATE,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT;

-- Create employee_sensitive_info table for government IDs
CREATE TABLE IF NOT EXISTS public.employee_sensitive_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  aadhaar_number_encrypted TEXT,
  aadhaar_last_four TEXT,
  pan_number_encrypted TEXT,
  pan_last_four TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_bank_info table
CREATE TABLE IF NOT EXISTS public.employee_bank_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  bank_name TEXT,
  account_number_encrypted TEXT,
  account_number_last_four TEXT,
  ifsc_code TEXT,
  branch_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_salary table
CREATE TABLE IF NOT EXISTS public.employee_salary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  salary_amount DECIMAL(12, 2),
  salary_type salary_type DEFAULT 'monthly',
  effective_from DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create salary_payments table for payment history
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payment_period TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status salary_status DEFAULT 'pending',
  payment_date DATE,
  payment_method TEXT,
  transaction_reference TEXT,
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee profile update requests for approval workflow
CREATE TABLE IF NOT EXISTS public.employee_profile_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.employee_sensitive_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profile_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_sensitive_info (Admin/HR only)
CREATE POLICY "Super admins can manage sensitive info"
ON public.employee_sensitive_info FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Employees with permission can view sensitive info"
ON public.employee_sensitive_info FOR SELECT
USING (
  has_permission(auth.uid(), 'view_employee_profiles'::employee_permission)
  OR has_permission(auth.uid(), 'manage_employee_profiles'::employee_permission)
);

CREATE POLICY "Employees can view own sensitive info"
ON public.employee_sensitive_info FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for employee_documents
CREATE POLICY "Super admins can manage documents"
ON public.employee_documents FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Employees with permission can view documents"
ON public.employee_documents FOR SELECT
USING (
  has_permission(auth.uid(), 'view_employee_documents'::employee_permission)
  OR has_permission(auth.uid(), 'manage_employee_documents'::employee_permission)
);

CREATE POLICY "Employees can view own documents"
ON public.employee_documents FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can upload own documents"
ON public.employee_documents FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for employee_bank_info
CREATE POLICY "Super admins can manage bank info"
ON public.employee_bank_info FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Accounting can view bank info"
ON public.employee_bank_info FOR SELECT
USING (
  has_permission(auth.uid(), 'view_salary_info'::employee_permission)
  OR has_permission(auth.uid(), 'manage_salary'::employee_permission)
  OR has_permission(auth.uid(), 'view_accounting'::employee_permission)
);

CREATE POLICY "Employees can view own bank info"
ON public.employee_bank_info FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can update own bank info"
ON public.employee_bank_info FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can insert own bank info"
ON public.employee_bank_info FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- RLS Policies for employee_salary (Admin/Accounting only - employees cannot see)
CREATE POLICY "Super admins can manage salary"
ON public.employee_salary FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Accounting can view salary"
ON public.employee_salary FOR SELECT
USING (
  has_permission(auth.uid(), 'view_salary_info'::employee_permission)
  OR has_permission(auth.uid(), 'manage_salary'::employee_permission)
  OR has_permission(auth.uid(), 'view_accounting'::employee_permission)
);

CREATE POLICY "Salary managers can manage"
ON public.employee_salary FOR ALL
USING (has_permission(auth.uid(), 'manage_salary'::employee_permission))
WITH CHECK (has_permission(auth.uid(), 'manage_salary'::employee_permission));

-- RLS Policies for salary_payments
CREATE POLICY "Super admins can manage payments"
ON public.salary_payments FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Accounting can view payments"
ON public.salary_payments FOR SELECT
USING (
  has_permission(auth.uid(), 'view_salary_info'::employee_permission)
  OR has_permission(auth.uid(), 'manage_salary'::employee_permission)
  OR has_permission(auth.uid(), 'view_accounting'::employee_permission)
);

CREATE POLICY "Salary managers can manage payments"
ON public.salary_payments FOR ALL
USING (has_permission(auth.uid(), 'manage_salary'::employee_permission))
WITH CHECK (has_permission(auth.uid(), 'manage_salary'::employee_permission));

-- RLS Policies for employee_profile_updates
CREATE POLICY "Super admins can manage profile updates"
ON public.employee_profile_updates FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "HR can view profile updates"
ON public.employee_profile_updates FOR SELECT
USING (
  has_permission(auth.uid(), 'manage_employee_profiles'::employee_permission)
);

CREATE POLICY "HR can process profile updates"
ON public.employee_profile_updates FOR UPDATE
USING (
  has_permission(auth.uid(), 'manage_employee_profiles'::employee_permission)
);

CREATE POLICY "Employees can view own update requests"
ON public.employee_profile_updates FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can request own profile updates"
ON public.employee_profile_updates FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON public.employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee_id ON public.salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON public.salary_payments(status);
CREATE INDEX IF NOT EXISTS idx_salary_payments_period ON public.salary_payments(payment_period);
CREATE INDEX IF NOT EXISTS idx_employee_profile_updates_employee_id ON public.employee_profile_updates(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_profile_updates_status ON public.employee_profile_updates(status);

-- Add triggers for updated_at
CREATE TRIGGER update_employee_sensitive_info_updated_at
  BEFORE UPDATE ON public.employee_sensitive_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at
  BEFORE UPDATE ON public.employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_bank_info_updated_at
  BEFORE UPDATE ON public.employee_bank_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_salary_updated_at
  BEFORE UPDATE ON public.employee_salary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salary_payments_updated_at
  BEFORE UPDATE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for employee documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for employee documents bucket
CREATE POLICY "Super admins can manage employee documents storage"
ON storage.objects FOR ALL
USING (
  bucket_id = 'employee-documents' 
  AND is_super_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'employee-documents' 
  AND is_super_admin(auth.uid())
);

CREATE POLICY "HR can view employee documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents' 
  AND (
    has_permission(auth.uid(), 'view_employee_documents'::employee_permission)
    OR has_permission(auth.uid(), 'manage_employee_documents'::employee_permission)
  )
);

CREATE POLICY "Employees can view own documents storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can upload own documents storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.employees WHERE user_id = auth.uid()
  )
);