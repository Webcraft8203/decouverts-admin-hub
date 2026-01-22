-- Update orders SELECT policy to include employees with view_orders permission
DROP POLICY IF EXISTS "Require auth for orders select" ON public.orders;
CREATE POLICY "Require auth for orders select" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'view_orders'::employee_permission)
  )
);

-- Update orders UPDATE policy to include employees with update_orders permission
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Authorized users can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'update_orders'::employee_permission)
);

-- Update orders DELETE policy to include employees with update_orders permission
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Authorized users can delete orders" 
ON public.orders 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'update_orders'::employee_permission)
);

-- Update order_items SELECT policy to include employees with view_orders permission
DROP POLICY IF EXISTS "Require auth for order items select" ON public.order_items;
CREATE POLICY "Require auth for order items select" 
ON public.order_items 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      orders.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_permission(auth.uid(), 'view_orders'::employee_permission)
    )
  )
);

-- Update order_items DELETE policy to include employees with update_orders permission
DROP POLICY IF EXISTS "Admins can delete order items" ON public.order_items;
CREATE POLICY "Authorized users can delete order items" 
ON public.order_items 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'update_orders'::employee_permission)
);

-- Update invoices policy to include employees with invoice permissions
DROP POLICY IF EXISTS "Only admins can manage invoices" ON public.invoices;
CREATE POLICY "Authorized users can manage invoices" 
ON public.invoices 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'view_invoices'::employee_permission)
    OR has_permission(auth.uid(), 'generate_invoices'::employee_permission)
  )
);

-- Update products policy to allow employees with manage_products permission
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Authorized users can manage products" 
ON public.products 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'manage_products'::employee_permission)
);