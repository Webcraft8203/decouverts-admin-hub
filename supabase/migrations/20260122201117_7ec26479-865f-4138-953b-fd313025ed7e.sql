-- Create employee_attendance table
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, attendance_date)
);

-- Create employee_leave_requests table
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'casual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee_payslips table
CREATE TABLE IF NOT EXISTS public.employee_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.salary_payments(id),
  payslip_month TEXT NOT NULL,
  payslip_year INTEGER NOT NULL,
  basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  deductions DECIMAL(12, 2) DEFAULT 0,
  bonuses DECIMAL(12, 2) DEFAULT 0,
  net_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  pdf_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, payslip_month, payslip_year)
);

-- Create employee_leave_balance table
CREATE TABLE IF NOT EXISTS public.employee_leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  casual_leave INTEGER DEFAULT 12,
  sick_leave INTEGER DEFAULT 6,
  earned_leave INTEGER DEFAULT 15,
  casual_leave_used INTEGER DEFAULT 0,
  sick_leave_used INTEGER DEFAULT 0,
  earned_leave_used INTEGER DEFAULT 0,
  year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_balance ENABLE ROW LEVEL SECURITY;

-- RLS for employee_attendance
CREATE POLICY "Super admins can manage attendance" ON public.employee_attendance
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "HR can manage attendance" ON public.employee_attendance
  FOR ALL USING (has_permission(auth.uid(), 'mark_attendance') OR has_permission(auth.uid(), 'view_attendance'))
  WITH CHECK (has_permission(auth.uid(), 'mark_attendance'));

CREATE POLICY "Employees can view own attendance" ON public.employee_attendance
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS for employee_leave_requests
CREATE POLICY "Super admins can manage leave requests" ON public.employee_leave_requests
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "HR can manage leave requests" ON public.employee_leave_requests
  FOR ALL USING (has_permission(auth.uid(), 'manage_leave') OR has_permission(auth.uid(), 'view_leave_requests'))
  WITH CHECK (has_permission(auth.uid(), 'manage_leave'));

CREATE POLICY "Employees can view own leave requests" ON public.employee_leave_requests
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can create own leave requests" ON public.employee_leave_requests
  FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS for employee_payslips
CREATE POLICY "Super admins can manage payslips" ON public.employee_payslips
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Accounting can manage payslips" ON public.employee_payslips
  FOR ALL USING (has_permission(auth.uid(), 'generate_payslips') OR has_permission(auth.uid(), 'view_payslips'))
  WITH CHECK (has_permission(auth.uid(), 'generate_payslips'));

CREATE POLICY "Employees can view own payslips" ON public.employee_payslips
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- RLS for employee_leave_balance
CREATE POLICY "Super admins can manage leave balance" ON public.employee_leave_balance
  FOR ALL USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "HR can manage leave balance" ON public.employee_leave_balance
  FOR ALL USING (has_permission(auth.uid(), 'manage_leave'))
  WITH CHECK (has_permission(auth.uid(), 'manage_leave'));

CREATE POLICY "Employees can view own leave balance" ON public.employee_leave_balance
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));