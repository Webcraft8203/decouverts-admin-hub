-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_cod_payment_status_check;

-- Add new check constraint with all valid COD statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_cod_payment_status_check 
CHECK (cod_payment_status IN ('pending', 'received', 'not_received', 'collected_by_courier', 'awaiting_settlement', 'settled'));