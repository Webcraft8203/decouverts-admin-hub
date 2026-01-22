-- Add COD payment tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cod_payment_status text DEFAULT 'pending' CHECK (cod_payment_status IN ('pending', 'received', 'not_received')),
ADD COLUMN IF NOT EXISTS cod_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cod_confirmed_by uuid;

-- Add index for faster filtering of COD orders
CREATE INDEX IF NOT EXISTS idx_orders_cod_payment_status ON public.orders(cod_payment_status) WHERE payment_id LIKE 'COD%';

-- Create function to validate COD payment confirmation
CREATE OR REPLACE FUNCTION public.validate_cod_payment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow COD payment status change for COD orders
  IF OLD.cod_payment_status IS DISTINCT FROM NEW.cod_payment_status THEN
    -- Must be a COD order
    IF NEW.payment_id IS NULL OR NOT NEW.payment_id LIKE 'COD%' THEN
      RAISE EXCEPTION 'COD payment status can only be changed for COD orders';
    END IF;
    
    -- Order must be delivered to confirm payment (except for 'not_received')
    IF NEW.cod_payment_status = 'received' AND NEW.status != 'delivered' THEN
      RAISE EXCEPTION 'COD payment can only be confirmed after delivery';
    END IF;
    
    -- Check authorization - must be super admin or have view_accounting/manage_salary permission
    IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'view_accounting') OR has_permission(auth.uid(), 'update_orders')) THEN
      RAISE EXCEPTION 'Unauthorized to confirm COD payment';
    END IF;
    
    -- Auto-set confirmation metadata when marking as received
    IF NEW.cod_payment_status = 'received' AND OLD.cod_payment_status != 'received' THEN
      NEW.cod_confirmed_at := NOW();
      NEW.cod_confirmed_by := auth.uid();
      -- Also update payment_status to reflect payment received
      NEW.payment_status := 'paid';
    END IF;
    
    -- Prevent changing from 'received' to other status (except super admin)
    IF OLD.cod_payment_status = 'received' AND NEW.cod_payment_status != 'received' THEN
      IF NOT is_super_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only Super Admin can revert confirmed COD payments';
      END IF;
    END IF;
    
    -- Log the change
    INSERT INTO public.activity_logs (admin_id, action_type, entity_type, entity_id, description)
    VALUES (
      auth.uid(),
      'cod_payment_' || NEW.cod_payment_status,
      'order',
      NEW.id,
      'COD payment status changed to ' || NEW.cod_payment_status || ' for order ' || NEW.order_number
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for COD payment validation
DROP TRIGGER IF EXISTS validate_cod_payment ON public.orders;
CREATE TRIGGER validate_cod_payment
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cod_payment_confirmation();

-- Update existing COD orders that are delivered to have payment_status as pending
UPDATE public.orders 
SET cod_payment_status = 'pending'
WHERE payment_id LIKE 'COD%' 
  AND cod_payment_status IS NULL;