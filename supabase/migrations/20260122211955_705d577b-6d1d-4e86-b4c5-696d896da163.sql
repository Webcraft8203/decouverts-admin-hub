-- Drop existing trigger and function with CASCADE
DROP TRIGGER IF EXISTS validate_cod_payment ON public.orders;
DROP TRIGGER IF EXISTS validate_cod_payment_trigger ON public.orders;
DROP FUNCTION IF EXISTS public.validate_cod_payment_confirmation() CASCADE;

-- Update existing 'received' values to 'settled'
UPDATE public.orders 
SET cod_payment_status = 'settled' 
WHERE cod_payment_status = 'received';

-- Add courier settlement tracking columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cod_collected_at timestamptz,
ADD COLUMN IF NOT EXISTS cod_settled_at timestamptz,
ADD COLUMN IF NOT EXISTS cod_courier_name text;

-- Create enhanced validation function with granular COD statuses
-- Statuses: 'pending', 'collected_by_courier', 'awaiting_settlement', 'settled', 'not_received'
CREATE OR REPLACE FUNCTION public.validate_cod_payment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_super_admin boolean := false;
  has_accounting_permission boolean := false;
  has_order_permission boolean := false;
BEGIN
  -- Only process COD orders
  IF NEW.order_type != 'cod' THEN
    RETURN NEW;
  END IF;

  -- Check if COD payment status is being changed
  IF OLD.cod_payment_status IS DISTINCT FROM NEW.cod_payment_status THEN
    -- Check user permissions
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO is_super_admin;

    SELECT EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.employee_permissions ep ON e.id = ep.employee_id
      WHERE e.user_id = auth.uid() 
      AND ep.permission IN ('view_accounting', 'update_orders')
    ) INTO has_accounting_permission;

    SELECT EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.employee_permissions ep ON e.id = ep.employee_id
      WHERE e.user_id = auth.uid() 
      AND ep.permission = 'update_orders'
    ) INTO has_order_permission;

    -- Only authorized users can change COD payment status
    IF NOT (is_super_admin OR has_accounting_permission OR has_order_permission) THEN
      RAISE EXCEPTION 'Unauthorized: You do not have permission to update COD payment status';
    END IF;

    -- Validate status transitions
    -- Can only mark as collected_by_courier after delivery
    IF NEW.cod_payment_status = 'collected_by_courier' AND NEW.status != 'delivered' THEN
      RAISE EXCEPTION 'COD payment can only be marked as collected after delivery';
    END IF;

    -- Set collected timestamp
    IF NEW.cod_payment_status = 'collected_by_courier' AND OLD.cod_payment_status = 'pending' THEN
      NEW.cod_collected_at := NOW();
    END IF;

    -- Can only mark as awaiting_settlement after collected
    IF NEW.cod_payment_status = 'awaiting_settlement' AND OLD.cod_payment_status NOT IN ('collected_by_courier', 'awaiting_settlement') THEN
      RAISE EXCEPTION 'Must be collected by courier before awaiting settlement';
    END IF;

    -- Can only mark as settled after awaiting_settlement or collected_by_courier
    IF NEW.cod_payment_status = 'settled' AND OLD.cod_payment_status NOT IN ('collected_by_courier', 'awaiting_settlement') THEN
      RAISE EXCEPTION 'Payment must be collected before it can be settled';
    END IF;

    -- Set settled timestamp and update payment status
    IF NEW.cod_payment_status = 'settled' AND OLD.cod_payment_status != 'settled' THEN
      NEW.cod_settled_at := NOW();
      NEW.cod_confirmed_at := NOW();
      NEW.cod_confirmed_by := auth.uid();
      NEW.payment_status := 'paid';
    END IF;

    -- Prevent changes after settlement (except super admin)
    IF OLD.cod_payment_status = 'settled' AND NOT is_super_admin THEN
      RAISE EXCEPTION 'COD payment status cannot be changed after settlement';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER validate_cod_payment_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cod_payment_confirmation();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_cod_collected_at ON public.orders(cod_collected_at) WHERE order_type = 'cod';
CREATE INDEX IF NOT EXISTS idx_orders_cod_settled_at ON public.orders(cod_settled_at) WHERE order_type = 'cod';