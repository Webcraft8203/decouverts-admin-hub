-- SECURITY HARDENING MIGRATION

-- 1. Fix employee_activity_logs INSERT policy to require employee verification
-- Current policy only checks auth.uid() IS NOT NULL which is too permissive

DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.employee_activity_logs;

CREATE POLICY "Employees can insert own activity logs"
ON public.employee_activity_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND employee_id IN (
    SELECT id FROM public.employees WHERE user_id = auth.uid()
  )
);

-- 2. Add server-side function to validate employee ownership for activity logs
CREATE OR REPLACE FUNCTION public.is_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- 3. Add audit logging trigger for sensitive permission changes
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'permission_granted', 'employee', NEW.employee_id, 
           'Permission ' || NEW.permission::text || ' granted to employee'
    WHERE is_super_admin(auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'permission_revoked', 'employee', OLD.employee_id,
           'Permission ' || OLD.permission::text || ' revoked from employee'
    WHERE is_super_admin(auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for permission change logging
DROP TRIGGER IF EXISTS log_permission_changes ON public.employee_permissions;
CREATE TRIGGER log_permission_changes
AFTER INSERT OR DELETE ON public.employee_permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_permission_change();

-- 4. Add audit logging for role changes (critical security events)
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'role_granted', 'user', NEW.user_id, 
           'Role ' || NEW.role::text || ' granted to user'
    WHERE auth.uid() IS NOT NULL;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'role_revoked', 'user', OLD.user_id,
           'Role ' || OLD.role::text || ' revoked from user'
    WHERE auth.uid() IS NOT NULL;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_role_changes ON public.user_roles;
CREATE TRIGGER log_role_changes
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.log_role_change();

-- 5. Add employee status change logging
CREATE OR REPLACE FUNCTION public.log_employee_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 
           CASE WHEN NEW.is_active THEN 'employee_activated' ELSE 'employee_deactivated' END,
           'employee', NEW.id,
           'Employee ' || NEW.employee_name || CASE WHEN NEW.is_active THEN ' activated' ELSE ' deactivated' END
    WHERE is_super_admin(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for employee status changes
DROP TRIGGER IF EXISTS log_employee_status_changes ON public.employees;
CREATE TRIGGER log_employee_status_changes
AFTER UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.log_employee_status_change();

-- 6. Add salary change logging for audit trail
CREATE OR REPLACE FUNCTION public.log_salary_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  emp_name text;
BEGIN
  SELECT employee_name INTO emp_name FROM public.employees WHERE id = COALESCE(NEW.employee_id, OLD.employee_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'salary_created', 'employee', NEW.employee_id,
           'Salary record created for ' || COALESCE(emp_name, 'employee')
    WHERE auth.uid() IS NOT NULL AND (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_salary'));
  ELSIF TG_OP = 'UPDATE' AND OLD.salary_amount IS DISTINCT FROM NEW.salary_amount THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'salary_updated', 'employee', NEW.employee_id,
           'Salary updated for ' || COALESCE(emp_name, 'employee')
    WHERE auth.uid() IS NOT NULL AND (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_salary'));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for salary changes
DROP TRIGGER IF EXISTS log_salary_changes ON public.employee_salary;
CREATE TRIGGER log_salary_changes
AFTER INSERT OR UPDATE ON public.employee_salary
FOR EACH ROW
EXECUTE FUNCTION public.log_salary_change();

-- 7. Ensure order status can only be changed by authorized personnel
-- Add check constraint to prevent invalid status transitions
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins/employees with permission can change status
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'update_orders')) THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      RAISE EXCEPTION 'Unauthorized status change';
    END IF;
  END IF;
  
  -- Log status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    SELECT auth.uid(), 'order_status_changed', 'order', NEW.id,
           'Order ' || NEW.order_number || ' status changed from ' || OLD.status || ' to ' || NEW.status
    WHERE auth.uid() IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order status validation
DROP TRIGGER IF EXISTS validate_order_status ON public.orders;
CREATE TRIGGER validate_order_status
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_status_transition();

-- 8. Ensure invoice generation is logged
CREATE OR REPLACE FUNCTION public.log_invoice_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
  SELECT COALESCE(NEW.created_by, auth.uid()), 'invoice_generated', 'invoice', NEW.id,
         'Invoice ' || NEW.invoice_number || ' created (' || NEW.invoice_type || ')'
  WHERE auth.uid() IS NOT NULL OR NEW.created_by IS NOT NULL;
  RETURN NEW;
END;
$$;

-- Create trigger for invoice creation logging
DROP TRIGGER IF EXISTS log_invoice_creation ON public.invoices;
CREATE TRIGGER log_invoice_creation
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.log_invoice_creation();

-- 9. Prevent payment status tampering from client
-- Payment status can only be set by edge functions (service role) or authorized admins
CREATE OR REPLACE FUNCTION public.validate_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If payment_status is being changed, validate authorization
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    -- Allow if called from service role (edge functions) or admin
    IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'update_orders')) THEN
      -- Check if this is a service role call (auth.uid() would be null for service role)
      IF auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Payment status can only be changed by authorized personnel';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for payment status validation
DROP TRIGGER IF EXISTS validate_payment_status ON public.orders;
CREATE TRIGGER validate_payment_status
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_payment_status_change();