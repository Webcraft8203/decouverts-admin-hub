-- Create employee activity logs table
CREATE TABLE IF NOT EXISTS public.employee_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_employee_id ON public.employee_activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_created_at ON public.employee_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_activity_logs_action_type ON public.employee_activity_logs(action_type);

-- Enable RLS
ALTER TABLE public.employee_activity_logs ENABLE ROW LEVEL SECURITY;

-- Super admins have full access
CREATE POLICY "Super admins have full access to employee activity logs"
  ON public.employee_activity_logs
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Employees with view permission can see all logs
CREATE POLICY "Employees with permission can view activity logs"
  ON public.employee_activity_logs
  FOR SELECT
  USING (has_permission(auth.uid(), 'view_activity_logs'));

-- Any authenticated user can insert logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON public.employee_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Employees can view their own logs
CREATE POLICY "Employees can view own activity logs"
  ON public.employee_activity_logs
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Create function to auto-delete old logs (older than 15 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_employee_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.employee_activity_logs
  WHERE created_at < NOW() - INTERVAL '15 days';
END;
$$;

-- Create a trigger to cleanup old logs on insert (lightweight approach)
CREATE OR REPLACE FUNCTION public.trigger_cleanup_old_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Run cleanup with 1% probability to avoid running on every insert
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_employee_activity_logs();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_old_activity_logs_trigger ON public.employee_activity_logs;
CREATE TRIGGER cleanup_old_activity_logs_trigger
  AFTER INSERT ON public.employee_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_cleanup_old_logs();

-- Add view_activity_logs permission
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_activity_logs';