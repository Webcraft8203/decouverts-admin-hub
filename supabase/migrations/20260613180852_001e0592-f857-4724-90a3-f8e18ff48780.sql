
-- =========================================================
-- PHASE 1: Drop policies that reference employee permissions
-- =========================================================
DROP POLICY IF EXISTS "Only admins can view contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins and view_customers can insert customer_master" ON public.customer_master;
DROP POLICY IF EXISTS "Admins and view_customers can read customer_master" ON public.customer_master;
DROP POLICY IF EXISTS "Admins and view_customers can update customer_master" ON public.customer_master;
DROP POLICY IF EXISTS "Only admins can view drone configurations" ON public.drone_configurations;
DROP POLICY IF EXISTS "Only authorized users can view invoice settings" ON public.invoice_settings;
DROP POLICY IF EXISTS "Admins can delete invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authorized users can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authorized users can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Require auth for order items select" ON public.order_items;
DROP POLICY IF EXISTS "Authorized users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Authorized users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Require auth for orders select" ON public.orders;
DROP POLICY IF EXISTS "Only admins can view printer configurations" ON public.printer_configurations;
DROP POLICY IF EXISTS "Authorized users can manage products" ON public.products;

-- =========================================================
-- PHASE 2: Drop triggers + functions that reference employee tables
-- =========================================================
DROP TRIGGER IF EXISTS validate_order_status_transition_trg ON public.orders;
DROP TRIGGER IF EXISTS validate_cod_payment_confirmation_trg ON public.orders;
DROP TRIGGER IF EXISTS validate_payment_status_change_trg ON public.orders;

DROP FUNCTION IF EXISTS public.validate_order_status_transition() CASCADE;
DROP FUNCTION IF EXISTS public.validate_cod_payment_confirmation() CASCADE;
DROP FUNCTION IF EXISTS public.validate_payment_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.log_salary_change() CASCADE;
DROP FUNCTION IF EXISTS public.log_permission_change() CASCADE;
DROP FUNCTION IF EXISTS public.log_employee_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_employee_activity_logs() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_cleanup_old_logs() CASCADE;

-- =========================================================
-- PHASE 3: Drop employee tables
-- =========================================================
DROP TABLE IF EXISTS public.salary_payments CASCADE;
DROP TABLE IF EXISTS public.employee_payslips CASCADE;
DROP TABLE IF EXISTS public.employee_salary CASCADE;
DROP TABLE IF EXISTS public.employee_bank_info CASCADE;
DROP TABLE IF EXISTS public.employee_documents CASCADE;
DROP TABLE IF EXISTS public.employee_sensitive_info CASCADE;
DROP TABLE IF EXISTS public.employee_profile_updates CASCADE;
DROP TABLE IF EXISTS public.employee_leave_requests CASCADE;
DROP TABLE IF EXISTS public.employee_leave_balance CASCADE;
DROP TABLE IF EXISTS public.employee_attendance CASCADE;
DROP TABLE IF EXISTS public.employee_permissions CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- =========================================================
-- PHASE 4: Drop RBAC functions and the permission enum
-- =========================================================
DROP FUNCTION IF EXISTS public.has_permission(uuid, public.employee_permission) CASCADE;
DROP FUNCTION IF EXISTS public.is_employee(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.has_admin_access(uuid) CASCADE;
DROP TYPE IF EXISTS public.employee_permission CASCADE;

-- =========================================================
-- PHASE 5: Recreate policies (super-admin / customer-self only)
-- =========================================================

-- contact_requests
CREATE POLICY "Only admins can view contact requests"
  ON public.contact_requests FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- customer_master
CREATE POLICY "Admins can insert customer_master"
  ON public.customer_master FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can read customer_master"
  ON public.customer_master FOR SELECT
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Admins can update customer_master"
  ON public.customer_master FOR UPDATE
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- drone_configurations
CREATE POLICY "Only admins can view drone configurations"
  ON public.drone_configurations FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- printer_configurations
CREATE POLICY "Only admins can view printer configurations"
  ON public.printer_configurations FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- invoice_settings
CREATE POLICY "Only authorized users can view invoice settings"
  ON public.invoice_settings FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- invoices
CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Authorized users can manage invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

-- orders
CREATE POLICY "Authorized users can delete orders"
  ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authorized users can update orders"
  ON public.orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Require auth for orders select"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)));

-- order_items
CREATE POLICY "Authorized users can delete order items"
  ON public.order_items FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Require auth for order items select"
  ON public.order_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- products
CREATE POLICY "Authorized users can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- PHASE 6: Recreate order/payment guard triggers (admin-only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized status change';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_super_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Payment status can only be changed by authorized personnel';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_cod_payment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  IF NEW.order_type != 'cod' THEN
    RETURN NEW;
  END IF;

  IF OLD.cod_payment_status IS DISTINCT FROM NEW.cod_payment_status THEN
    SELECT public.is_super_admin(auth.uid()) INTO is_admin;
    IF NOT is_admin THEN
      RAISE EXCEPTION 'Unauthorized: You do not have permission to update COD payment status';
    END IF;

    IF NEW.cod_payment_status = 'collected_by_courier' AND NEW.status != 'delivered' THEN
      RAISE EXCEPTION 'COD payment can only be marked as collected after delivery';
    END IF;
    IF NEW.cod_payment_status = 'collected_by_courier' AND OLD.cod_payment_status = 'pending' THEN
      NEW.cod_collected_at := NOW();
    END IF;
    IF NEW.cod_payment_status = 'awaiting_settlement' AND OLD.cod_payment_status NOT IN ('collected_by_courier','awaiting_settlement') THEN
      RAISE EXCEPTION 'Must be collected by courier before awaiting settlement';
    END IF;
    IF NEW.cod_payment_status = 'settled' AND OLD.cod_payment_status NOT IN ('collected_by_courier','awaiting_settlement') THEN
      RAISE EXCEPTION 'Payment must be collected before it can be settled';
    END IF;
    IF NEW.cod_payment_status = 'settled' AND OLD.cod_payment_status != 'settled' THEN
      NEW.cod_settled_at := NOW();
      NEW.cod_confirmed_at := NOW();
      NEW.cod_confirmed_by := auth.uid();
      NEW.payment_status := 'paid';
    END IF;
    IF OLD.cod_payment_status = 'settled' AND NOT is_admin THEN
      RAISE EXCEPTION 'COD payment status cannot be changed after settlement';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_status_transition_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_status_transition();
CREATE TRIGGER validate_payment_status_change_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_status_change();
CREATE TRIGGER validate_cod_payment_confirmation_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_cod_payment_confirmation();
